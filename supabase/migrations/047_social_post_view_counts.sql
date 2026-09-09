-- 047: Qualified feed-impression aggregate. Review/run manually only.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_social_post_view(target_post_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE next_count bigint;
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = target_post_id AND status = 'published' AND content_format = 'standard'
  RETURNING view_count INTO next_count;
  RETURN COALESCE(next_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_social_post_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_social_post_view(uuid) TO service_role;
