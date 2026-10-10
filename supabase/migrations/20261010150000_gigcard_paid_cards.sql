-- LOCAL ONLY: deploy only after isolated database proof and release approval.
begin;

create table public.gigcard_designs (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  design jsonb not null check (jsonb_typeof(design) = 'object' and octet_length(design::text) <= 2000000),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index gigcard_designs_owner_updated on public.gigcard_designs(owner_id, updated_at desc);

create table public.gigcard_orders (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null unique,
  owner_id uuid not null,
  mode text not null check (mode in ('test', 'live')),
  amount_paise integer not null default 9900 check (amount_paise = 9900),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'creating' check (status in ('creating', 'created', 'paid', 'refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (card_id, owner_id) references public.gigcard_designs(id, owner_id),
  check (status = 'creating' or razorpay_order_id is not null),
  check (status not in ('paid', 'refunded') or (razorpay_payment_id is not null and paid_at is not null))
);
create index gigcard_orders_owner on public.gigcard_orders(owner_id);
alter table public.gigcard_designs enable row level security;
alter table public.gigcard_orders enable row level security;
revoke all on public.gigcard_designs, public.gigcard_orders from public, anon, authenticated;
grant select on public.gigcard_designs to authenticated;
create policy gigcard_owner_read on public.gigcard_designs for select to authenticated
  using (owner_id = (select auth.uid()));
grant select, insert, update, delete on public.gigcard_designs, public.gigcard_orders to service_role;

create function public.gigcard_save(p_id uuid, p_owner uuid, p_revision integer, p_design jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare c public.gigcard_designs;
begin
  -- Serialize new drafts for an owner so the bounded quota cannot race.
  if p_owner is null or p_id is null or p_revision is null or p_revision < 0 or p_design is null then raise exception 'Invalid card'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 0));
  select * into c from public.gigcard_designs where id = p_id for update;
  if found then
    if c.owner_id <> p_owner then raise exception 'Card not found' using errcode = '42501'; end if;
    if c.revision <> p_revision then raise exception 'Card changed; reload before saving' using errcode = '40001'; end if;
    update public.gigcard_designs set design = p_design, revision = revision + 1, updated_at = now()
      where id = p_id returning * into c;
  else
    if p_revision <> 0 then raise exception 'Card not found' using errcode = '42501'; end if;
    if (select count(*) from public.gigcard_designs where owner_id = p_owner) >= 20 then
      raise exception 'Card limit reached' using errcode = '54000';
    end if;
    insert into public.gigcard_designs(id, owner_id, design) values (p_id, p_owner, p_design) returning * into c;
  end if;
  return to_jsonb(c);
end $$;

create function public.gigcard_reserve_order(p_card uuid, p_owner uuid, p_mode text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare c public.gigcard_designs; o public.gigcard_orders;
begin
  if p_owner is null or p_card is null or p_mode is null then raise exception 'Invalid order'; end if;
  select * into c from public.gigcard_designs where id = p_card for update;
  if not found or c.owner_id <> p_owner then raise exception 'Card not found' using errcode = '42501'; end if;
  select * into o from public.gigcard_orders where card_id = p_card;
  if found then
    if o.mode <> p_mode then raise exception 'Payment mode mismatch' using errcode = '22023'; end if;
    return to_jsonb(o) || jsonb_build_object('new_order', false);
  end if;
  insert into public.gigcard_orders(card_id, owner_id, mode) values (p_card, p_owner, p_mode) returning * into o;
  return to_jsonb(o) || jsonb_build_object('new_order', true);
end $$;

create function public.gigcard_attach_order(p_id uuid, p_owner uuid, p_provider_order text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare o public.gigcard_orders;
begin
  if p_owner is null or p_id is null or p_provider_order is null then raise exception 'Invalid order'; end if;
  select * into o from public.gigcard_orders where id = p_id for update;
  if not found or o.owner_id <> p_owner then raise exception 'Order not found' using errcode = '42501'; end if;
  if p_provider_order !~ '^order_[A-Za-z0-9]+$' then raise exception 'Invalid provider order'; end if;
  if o.razorpay_order_id is not null and o.razorpay_order_id <> p_provider_order then raise exception 'Order already attached'; end if;
  if o.status = 'creating' then
    update public.gigcard_orders set razorpay_order_id = p_provider_order, status = 'created', updated_at = now()
      where id = p_id returning * into o;
  end if;
  return to_jsonb(o);
end $$;

-- Only a trusted server that fetched the provider payment can call this.
-- One row is the payment ledger and entitlement: no partial fulfillment window.
create function public.gigcard_settle(p_id uuid, p_order text, p_payment text, p_amount integer, p_currency text, p_refunded boolean)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare o public.gigcard_orders;
begin
  if p_id is null or p_order is null or p_payment is null or p_amount is null or p_currency is null then raise exception 'Invalid payment'; end if;
  select * into o from public.gigcard_orders where id = p_id for update;
  if not found or o.razorpay_order_id is distinct from p_order or o.amount_paise <> p_amount or o.currency <> p_currency then
    raise exception 'Payment does not match order' using errcode = '22023';
  end if;
  if p_refunded is null or p_payment !~ '^pay_[A-Za-z0-9]+$' then raise exception 'Invalid payment'; end if;
  if o.razorpay_payment_id is not null and o.razorpay_payment_id <> p_payment then raise exception 'Order has another payment'; end if;
  -- Monotonic revocation: a delayed captured event cannot undo a refund.
  update public.gigcard_orders set razorpay_payment_id = p_payment,
    status = case when p_refunded or status = 'refunded' then 'refunded' else 'paid' end,
    paid_at = coalesce(paid_at, now()), updated_at = now()
    where id = p_id returning * into o;
  return to_jsonb(o);
end $$;

revoke all on function public.gigcard_save(uuid, uuid, integer, jsonb) from public, anon, authenticated;
revoke all on function public.gigcard_reserve_order(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.gigcard_attach_order(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.gigcard_settle(uuid, text, text, integer, text, boolean) from public, anon, authenticated;
grant execute on function public.gigcard_save(uuid, uuid, integer, jsonb) to service_role;
grant execute on function public.gigcard_reserve_order(uuid, uuid, text) to service_role;
grant execute on function public.gigcard_attach_order(uuid, uuid, text) to service_role;
grant execute on function public.gigcard_settle(uuid, text, text, integer, text, boolean) to service_role;
commit;
