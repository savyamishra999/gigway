-- Persist the selected GigWay Moment on a normal post so feeds and shared links
-- can retain its editorial presentation. No separate Moment-post table is needed.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moment_slug text;
CREATE INDEX IF NOT EXISTS posts_moment_slug_idx ON posts (moment_slug) WHERE moment_slug IS NOT NULL;
