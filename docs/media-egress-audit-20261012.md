# GigWay avatar and post-media audit — 12 October 2026

Local implementation and verification completed. No deployment, production uploads, storage rewrites, bucket-policy changes, or database migrations performed. Existing workspace edits were retained.

The reported Supabase dashboard restriction establishes exhausted egress, but this code audit does not establish what percentage came from media. No production bandwidth reduction is claimed.

## Findings and changes

| Area inspected | Finding | Result |
| --- | --- | --- |
| Shared ImageUploader: profile photo, workplace logo and cover | Original files uploaded directly; default storage cache duration | Optional lossless preparation; original resolution retained; UUID paths, explicit MIME and one-day public-object cache |
| Legacy onboarding and ProfileCompleteForm | Direct avatar uploads; timestamp paths and upsert | Same lossless preparation and unique non-overwriting avatar paths; resume content untouched |
| GigImageUpload | Direct thumbnail upload, no synchronous duplicate guard | Lossless preparation, UUID path, explicit cache, duplicate guard and finite error cleanup |
| Google-avatar import | Original downloaded and stored directly | Lossless preparation when smaller; import retains original if optimization cannot run; one-day object cache |
| CreatePostComposer, companion images, Jox cover | Original images uploaded; concurrent submit could create duplicate upload work | Prepare before upload initialization so filename/MIME/size/final dimensions agree; synchronous submit guard; repeated preparation of the same File coalesces |
| GLIMPS, recorded Jox, inspection worker | Video/audio quality and containers already have playback/inspection requirements | No lossy transcoding or bitrate reduction; existing viewport preparation, pause, range seeking and native audio retained |
| Avatars/logos across navigation, Home, profiles, discovery, messages, connections, workplaces, jobs, onboarding and admin lists | Full source files used in small displays | Shared MediaImage with consistent responsive URLs; avatar sizing preserves high-DPI detail and the shorter dimension needed for square display |
| Standard-post images and Jox companion images | Full originals and changing signed URLs | Responsive lossless variants; original-image link for standard posts; Jox enlarged view and cropped/zoomed cover retain originals |
| Feed serialization | Image/private media signing on every serialization | Stable public or authenticated delivery URLs for images, video, audio and PDF; zero signing calls during feed serialization/finalization |
| Public video/audio delivery | `private, no-store` redownloaded bytes on revisits | `private, no-cache` with ETag and conditional 304; Range/If-Range/HEAD preserved |
| Public media middleware | Media subroute still entered session refresh | Exact public-media route bypasses session refresh; delivery still checks current post visibility/status |
| GLIMPS, VIJOX, Explore | Per-post calls repeated author/media enrichment | Page-level safePosts batching replaces individual serialization |
| Home feed | Duplicate requests and late responses during tab switching | Coalesce identical in-flight page requests, abort superseded requests, ignore stale responses |
| Export/card rendering, verification documents, local recording/blob previews, external image hosts | Originals or separate access/format requirements | Originals preserved; no arbitrary external image proxy or private-document optimization |

## Quality and cache contract

- Upload preparation never resizes. Only smaller lossless WebP output replaces the upload. Unprofitable encodes keep the source. JPEG pixels are not subjected to a second lossy JPEG encode.
- Display sizes are limited to 96, 192, 384, 768, 1280, 1920 and 2560 pixels. Resizing preserves aspect ratio, never upscales, and encodes losslessly. Avatar delivery preserves sufficient pixels on both axes for square CSS cropping.
- Animation, APNG markers, non-8-bit/non-sRGB sources, ICC/XMP-bearing images and detected HDR gain-map metadata retain their original representation. Optimizer failure falls back to the original in the image component or upload helper.
- Local fixture tests compare decoded full-resolution pixels exactly, including alpha. Display-variant decoded pixels match the same high-quality resampling pipeline. This is not a universal perceptual guarantee for every camera file/browser or a real-device visual sign-off.
- New public avatar/logo/cover/gig uploads use unique URLs and `cacheControl: 86400`. The public image endpoint returns a one-day browser/shared-cache policy and content-derived ETag. Changing a photo generates a new URL; there are no timestamp query cache busters.
- Post media is **never publicly/shared cached**. Every conditional request checks post access and media membership before returning 304 or bytes. A different account, revoked follower access, deletion, or public-to-private transition cannot reuse the HTTP cache without revalidation. Content already downloaded cannot be retracted from a device.
- Per-process image source/variant reuse is bounded to 48 MiB, 256 entries and five minutes, with in-flight coalescing, a 12 MiB source-body limit, 40 million decoded pixels and at most two transformations concurrently. Errors are not retained. Request/processing timeouts are finite.
- The optimizer only accepts this project's public `avatars` URLs. Signed/private URLs, other buckets, arbitrary hosts, credentials and query-bearing URLs are rejected. Storage service credentials stay in the server delivery helper. Existing bucket/RLS policies are unchanged.
- Existing PWA NetworkOnly navigation/API rules remain; no private payloads are placed in a persistent service-worker CacheFirst store.

## Verification

| Check | Result |
| --- | --- |
| `node scripts/test-media-egress.cjs` | 9 groups pass: lossless pixels, resizing, colour/orientation preservation, cache coalescing, URL restrictions, revoked visibility/account switching, range/HEAD, upload fallback, feed races |
| `node scripts/test-part3-media.cjs` | 16 existing playback/loading groups pass; image adapter mocked here and exercised in the separate real-browser check |
| `node scripts/test-makkhan-pass1.cjs` | Pass; media assertions updated to stable URLs with zero signing calls |
| `node scripts/test-p0-auth.cjs` | 12 groups pass |
| `node scripts/test-auth-navigation.cjs` | 23 groups pass |
| `node scripts/media-egress-browser-qa.cjs` | Real headless Chromium, 390px viewport / DPR 2, actual MediaImage and delivery handlers, local fixture storage: all seven checks pass |
| TypeScript `--noEmit --incremental false` | Pass |
| `git diff --check` | Pass |

Browser checks: duplicate avatars make one request; initial render does not fetch an original then a variant; offscreen images make no request; rerender makes no request; avatar survives reload from fresh HTTP cache; post image reload receives an authorized 304; enlargement uses original bytes. Two storage source fetches total served the two source assets, including reload and enlargement. The screenshot was inspected.

Browser artifacts: `C:/Users/Admin/AppData/Local/Temp/gigway-media-egress-ZNWAIq/report.json` and `mobile.png`. Run the committed script to reproduce in a fresh temporary directory.

Synthetic text/shape PNG fixture: 169,270 bytes → 14,092 bytes for the lossless full-resolution upload; 5,488 bytes for its 384px display variant. These numbers are **fixture measurements**, not typical photo savings or a production projection. Test execution emitted non-fatal Fontconfig cache-directory warnings; image comparisons passed.

## Limits and operational follow-up

1. The current Supabase quota restriction must separately be lifted/reset; code changes do not restore a restricted origin. These changes are local and have not been deployed.
2. Upload preparation is optional for 32 KiB–4 MiB images to stay within serverless request limits. Larger images upload unchanged and can receive display variants afterward. Preparation sends one image to the app server before the storage upload, trading additional upload/app compute for potentially smaller stored bytes. There is no lossy size-target fallback.
3. Existing stored originals are retained. No destructive bulk recompression or cleanup ran. Cold processes/regions still fetch originals; source reuse is an in-memory optimization, not durable cross-region derivative storage. Public avatar variants additionally benefit from the host's shared cache. Post access checks still incur small database/auth requests.
4. Audio/video bytes are unchanged. Browser cache/range behavior varies; this work removes forced no-store behavior but does not claim all repeat video transfers are eliminated. There are no new video posters or background transcoding jobs.
5. External-host avatars, colour-managed/animated/HDR sources and originals used for export/cropped covers may still transfer their full size. This is deliberate quality preservation.
6. Production signed-in uploads, deployed CDN headers, real phone visual comparisons and before/after Storage egress totals remain to be measured after release and restoration of service. The browser test uses the real component/handlers with generated assets, not the entire production application.

References consulted: [Supabase serving assets](https://supabase.com/docs/guides/storage/serving/downloads), [Storage CDN](https://supabase.com/docs/guides/storage/cdn/fundamentals), [standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [Sharp output options](https://sharp.pixelplumbing.com/api-output/). Installed Sharp is 0.34.5; no dependency upgrades were made.
