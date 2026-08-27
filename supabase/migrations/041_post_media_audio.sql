-- Already applied manually to production; retained here to synchronize schema history.
ALTER TABLE public.post_media
  DROP CONSTRAINT IF EXISTS post_media_media_type_check;

ALTER TABLE public.post_media
  ADD CONSTRAINT post_media_media_type_check
  CHECK (media_type IN ('image', 'video', 'document', 'audio'));
