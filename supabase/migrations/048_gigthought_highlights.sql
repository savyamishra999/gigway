-- 048: Author-selected GigThought emphasis metadata. Review/run manually only.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_highlights jsonb NOT NULL DEFAULT '[]'::jsonb;
