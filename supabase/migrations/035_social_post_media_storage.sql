-- 035: Social Feed Phase 1C private media bucket. Review and run manually only.
-- No direct storage.objects policies: trusted server endpoints issue narrow signed upload URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  false,
  104857600,
  ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
