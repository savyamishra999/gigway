-- 044: Portable JOX rendition foundation. Review and run manually only.
CREATE TABLE IF NOT EXISTS public.jox_renditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  source_audio_media_id uuid NOT NULL REFERENCES public.post_media(id) ON DELETE CASCADE,
  source_image_media_id uuid REFERENCES public.post_media(id) ON DELETE SET NULL,
  rendition_key text NOT NULL,
  template_version text NOT NULL CHECK (template_version = 'v1'),
  profile text NOT NULL CHECK (profile = 'vertical-720p'),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'rendering', 'ready', 'failed')),
  storage_path text,
  source_fingerprint text NOT NULL,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT jox_renditions_ready_output CHECK ((status = 'ready') = (storage_path IS NOT NULL)),
  CONSTRAINT jox_renditions_completion_state CHECK (completed_at IS NULL OR status IN ('ready', 'failed')),
  CONSTRAINT jox_renditions_unique_source UNIQUE (post_id, source_fingerprint, template_version, profile),
  CONSTRAINT jox_renditions_unique_key UNIQUE (rendition_key)
);

CREATE INDEX IF NOT EXISTS jox_renditions_post_status_idx ON public.jox_renditions(post_id, status, created_at DESC);

ALTER TABLE public.jox_renditions ENABLE ROW LEVEL SECURITY;
-- No browser policies: all reads/writes are mediated by trusted server routes.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('jox-renditions', 'jox-renditions', false, 52428800, ARRAY['video/mp4'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
