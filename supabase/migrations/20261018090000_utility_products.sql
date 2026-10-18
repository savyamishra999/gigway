-- Isolated utility commerce. No changes to legacy billing or identity-document collection.
begin;
create table public.utility_documents (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('resume','pitch')), source_hash text not null,
 title text not null default '', result jsonb, status text not null default 'generating' check(status in ('generating','ready','failed')),
 published boolean not null default false, created_at timestamptz not null default now(),
 unique(owner_id,kind,source_hash), check(not published or (kind='pitch' and status='ready'))
);
create index utility_documents_owner_created on public.utility_documents(owner_id,created_at desc);
create unique index utility_one_public_pitch on public.utility_documents(owner_id) where published;
create table public.utility_verifications (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 evidence text not null, status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reason text, reviewed_by uuid references auth.users(id), reviewed_at timestamptz, updated_at timestamptz not null default now()
);
create table public.utility_orders (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 product text not null check(product in ('resume_report','pitch_pro','professional_verified')),
 document_id uuid references public.utility_documents(id), mode text not null check(mode in ('test','live')),
 amount_paise integer not null, currency text not null default 'INR' check(currency='INR'),
 status text not null default 'creating' check(status in ('creating','created','paid','refunded')),
 provider_order text unique, provider_payment text unique, paid_at timestamptz, expires_at timestamptz,
 created_at timestamptz not null default now(),
 check ((product='resume_report' and document_id is not null and amount_paise=4900) or
 (product='pitch_pro' and document_id is null and amount_paise=14900) or
 (product='professional_verified' and document_id is null and amount_paise=29900))
);
create unique index utility_report_purchase on public.utility_orders(owner_id,document_id,mode) where product='resume_report';
create index utility_orders_owner on public.utility_orders(owner_id,product,mode,expires_at);
create table public.utility_generation_attempts (owner_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create index utility_generation_attempts_owner on public.utility_generation_attempts(owner_id,created_at);
alter table public.utility_generation_attempts enable row level security;
revoke all on public.utility_generation_attempts from public,anon,authenticated;
grant all on public.utility_generation_attempts to service_role;
alter table public.utility_documents enable row level security;
alter table public.utility_orders enable row level security;
alter table public.utility_verifications enable row level security;
-- Full reports must never be readable directly through the browser's Data API.
revoke all on public.utility_documents,public.utility_orders,public.utility_verifications from public,anon,authenticated;
grant all on public.utility_documents,public.utility_orders,public.utility_verifications to service_role;

create function public.utility_reserve_document(p_owner uuid,p_kind text,p_hash text,p_title text,p_mode text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.utility_documents; paid boolean; n integer;
begin
 if p_kind not in ('resume','pitch') or p_mode not in ('test','live') or length(p_hash)<>64 then raise exception 'Invalid document'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 701));
 select * into d from public.utility_documents where owner_id=p_owner and kind=p_kind and source_hash=p_hash;
 if found and d.status='ready' then return to_jsonb(d)||'{"generate":false}'::jsonb; end if;
 if found and d.status='generating' and d.created_at>now()-interval '5 minutes' then raise exception 'Generation in progress'; end if;
 -- Failed attempts count toward the rate limit, but do not consume the free pitch.
 select count(*) into n from public.utility_generation_attempts where owner_id=p_owner and created_at>now()-interval '1 hour';
 if n>=10 then raise exception 'Please wait before generating again'; end if;
 if p_kind='pitch' then
  select exists(select 1 from public.utility_orders where owner_id=p_owner and product='pitch_pro' and mode=p_mode and status='paid' and expires_at>now()) into paid;
  if not paid and exists(select 1 from public.utility_documents where owner_id=p_owner and kind='pitch' and (status='ready' or (status='generating' and created_at>now()-interval '5 minutes'))) then raise exception 'PRO_REQUIRED'; end if;
 else
  select count(*) into n from public.utility_documents where owner_id=p_owner and kind='resume' and created_at>now()-interval '1 day' and status<>'failed';
  if n>=3 then raise exception 'Three free previews per day. Please return tomorrow.'; end if;
 end if;
 insert into public.utility_generation_attempts(owner_id) values(p_owner);
 insert into public.utility_documents(owner_id,kind,source_hash,title) values(p_owner,p_kind,p_hash,left(p_title,160))
 on conflict(owner_id,kind,source_hash) do update set status='generating',created_at=now()
 returning * into d;
 return to_jsonb(d)||'{"generate":true}'::jsonb;
end $$;

create function public.utility_reserve_order(p_owner uuid,p_product text,p_document uuid,p_mode text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.utility_orders; price integer;
begin
 if p_mode not in ('test','live') then raise exception 'Invalid mode'; end if;
 price:=case p_product when 'resume_report' then 4900 when 'pitch_pro' then 14900 when 'professional_verified' then 29900 else null end;
 if price is null then raise exception 'Invalid product'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,702));
 if p_product='resume_report' then
  if not exists(select 1 from public.utility_documents where id=p_document and owner_id=p_owner and kind='resume' and status='ready') then raise exception 'Report not found'; end if;
 else
  if p_document is not null then raise exception 'Invalid document'; end if;
 end if;
 if p_product='professional_verified' and not exists(select 1 from public.utility_verifications where owner_id=p_owner and status='approved') then raise exception 'Review must be approved before payment'; end if;
 select * into o from public.utility_orders where owner_id=p_owner and product=p_product and mode=p_mode
 and (case when p_product='resume_report' then document_id=p_document else status in ('creating','created') or (status='paid' and expires_at>now()) end)
 order by created_at desc limit 1;
 if found then return to_jsonb(o)||'{"new_order":false}'::jsonb; end if;
 insert into public.utility_orders(owner_id,product,document_id,mode,amount_paise) values(p_owner,p_product,p_document,p_mode,price) returning * into o;
 return to_jsonb(o)||'{"new_order":true}'::jsonb;
end $$;

create function public.utility_settle_order(p_id uuid,p_order text,p_payment text,p_amount integer,p_refunded boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.utility_orders;
begin
 select * into o from public.utility_orders where id=p_id for update;
 if not found or o.provider_order is distinct from p_order or o.amount_paise<>p_amount or p_payment !~ '^pay_[A-Za-z0-9]+$' then raise exception 'Payment does not match order'; end if;
 if o.provider_payment is not null and o.provider_payment<>p_payment then raise exception 'Payment already attached'; end if;
 if o.status='refunded' then return to_jsonb(o); end if;
 if p_refunded then
  update public.utility_orders set status='refunded',provider_payment=p_payment where id=p_id returning * into o;
 elsif o.status<>'paid' then
  update public.utility_orders set status='paid',provider_payment=p_payment,paid_at=now(),
   expires_at=case product when 'pitch_pro' then now()+interval '30 days' when 'professional_verified' then now()+interval '365 days' else null end
   where id=p_id returning * into o;
 end if;
 return to_jsonb(o);
end $$;

create function public.utility_publish_pitch(p_owner uuid,p_document uuid,p_publish boolean,p_result jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,701));
 if not exists(select 1 from public.utility_documents where id=p_document and owner_id=p_owner and kind='pitch' and status='ready') then raise exception 'Pitch not found'; end if;
 if p_publish then update public.utility_documents set published=false where owner_id=p_owner and published; end if;
 update public.utility_documents set result=p_result,title=left(p_result->>'title',160),published=p_publish where id=p_document and owner_id=p_owner;
end $$;
revoke all on function public.utility_reserve_document(uuid,text,text,text,text),public.utility_reserve_order(uuid,text,uuid,text),public.utility_settle_order(uuid,text,text,integer,boolean),public.utility_publish_pitch(uuid,uuid,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.utility_reserve_document(uuid,text,text,text,text),public.utility_reserve_order(uuid,text,uuid,text),public.utility_settle_order(uuid,text,text,integer,boolean),public.utility_publish_pitch(uuid,uuid,boolean,jsonb) to service_role;
commit;
