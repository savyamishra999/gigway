CREATE TABLE IF NOT EXISTS public.vijox_timed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reactor_user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('love', 'applause', 'insight', 'fire')),
  timestamp_ms integer NOT NULL CHECK (timestamp_ms >= 0 AND timestamp_ms <= 27000),
  time_bucket_ms integer GENERATED ALWAYS AS ((timestamp_ms / 500) * 500) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vijox_timed_reactions_idempotency_idx
  ON public.vijox_timed_reactions(post_id, reactor_user_id, reaction_type, time_bucket_ms);

CREATE INDEX IF NOT EXISTS vijox_timed_reactions_post_bucket_idx
  ON public.vijox_timed_reactions(post_id, time_bucket_ms);

CREATE INDEX IF NOT EXISTS vijox_timed_reactions_post_reactor_idx
  ON public.vijox_timed_reactions(post_id, reactor_user_id);

ALTER TABLE public.vijox_timed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads timed reactions on public posts"
  ON public.vijox_timed_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = vijox_timed_reactions.post_id
      AND posts.status = 'published'
      AND posts.visibility = 'public'
  ));

CREATE POLICY "Users create own timed reactions on public posts"
  ON public.vijox_timed_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = reactor_user_id
    AND EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = vijox_timed_reactions.post_id
        AND posts.status = 'published'
        AND posts.visibility = 'public'
    )
  );

CREATE POLICY "Users delete own timed reactions"
  ON public.vijox_timed_reactions FOR DELETE
  USING (auth.uid() = reactor_user_id);
