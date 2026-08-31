-- 045: GLIMPS product-format foundation. Review/run manually only.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content_format text NOT NULL DEFAULT 'standard';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_content_format_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_content_format_check
  CHECK (content_format IN ('standard', 'vijox', 'glimps'));

CREATE INDEX IF NOT EXISTS posts_glimps_discovery_idx
  ON public.posts (created_at DESC, id DESC)
  WHERE content_format = 'glimps' AND status = 'published';
