-- 046: Durable Jox cover crop presentation. Review/run manually only.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS jox_cover_scale numeric NULL,
  ADD COLUMN IF NOT EXISTS jox_cover_position_x numeric NULL,
  ADD COLUMN IF NOT EXISTS jox_cover_position_y numeric NULL;

UPDATE public.posts
  SET jox_cover_scale = COALESCE(jox_cover_scale, 1),
      jox_cover_position_x = COALESCE(jox_cover_position_x, 0),
      jox_cover_position_y = COALESCE(jox_cover_position_y, 0)
  WHERE jox_cover_media_id IS NOT NULL;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_jox_cover_presentation_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_jox_cover_presentation_check
  CHECK (
    (jox_cover_media_id IS NULL AND jox_cover_scale IS NULL AND jox_cover_position_x IS NULL AND jox_cover_position_y IS NULL)
    OR
    (jox_cover_media_id IS NOT NULL
      AND jox_cover_scale BETWEEN 1 AND 3
      AND jox_cover_position_x BETWEEN -1 AND 1
      AND jox_cover_position_y BETWEEN -1 AND 1)
  );
