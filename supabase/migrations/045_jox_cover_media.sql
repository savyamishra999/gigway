-- 045: Durable explicit Jox cover media. Review/run manually only.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS jox_cover_media_id uuid NULL;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_jox_cover_media_id_fkey;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_jox_cover_media_id_fkey
  FOREIGN KEY (jox_cover_media_id) REFERENCES public.post_media(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.validate_jox_cover_media()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.jox_cover_media_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.content_format <> 'vijox' OR NOT EXISTS (
    SELECT 1 FROM public.post_media
    WHERE id = NEW.jox_cover_media_id AND post_id = NEW.id AND media_type = 'image'
  ) THEN
    RAISE EXCEPTION 'Invalid Jox cover media';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_validate_jox_cover_media ON public.posts;
CREATE TRIGGER posts_validate_jox_cover_media
  BEFORE INSERT OR UPDATE OF jox_cover_media_id, content_format ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.validate_jox_cover_media();
