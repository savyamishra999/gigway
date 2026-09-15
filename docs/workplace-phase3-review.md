# Workplace Phase 3: setup and management review

Local implementation only. SAFE FOR REVIEW: YES, with the authentication/storage/browser limitations below. No commit, push, deployment, migration, infrastructure change, or production write.

## Audit and reuse

- Creation remains `/organizations/new`; editing remains `/organizations/[username]/edit`. Existing POST `/api/organizations/create`, PATCH `/api/organizations/[username]`, and GET `/api/organizations/username` are unchanged.
- Existing fields reused: name, username, entity_type, logo_url, cover_url, tagline, description, industry, company_size, founded_year, website, location, country. No columns added. The edit page now projects only its ID and form fields instead of `select(*)`.
- The server edit gate still requires an authenticated Professional and active owner/admin membership scoped to the requested Workplace. The PATCH endpoint independently repeats authorization. Creation still inserts the existing active owner membership. No new membership system or public write path.
- Phase 1 cross-entity username validation and final-write checks are unchanged. Normalization and syntax are reused. The legacy `/u/kalpana` collision is intentionally untouched.
- Public anonymous read-only audit returned three existing records with industries IT, Marketing Agency, SOCIAL MEDIA; sizes 1, 2-10, 5-10 MEMBERS; countries india, India, SINGAPORE; founding years 2024/2026; entity_type organization. This is a public RLS-visible sample, not a service-role/full-schema audit.
- Existing upload utility accepts JPEG, PNG and WebP; its client caps are 5 MB by default and 8 MB for Workplace covers. It uploads to the existing avatars bucket at `<signed-in-user-id>/<kind>s/<uuid>.<extension>` with upsert=false and explicit MIME type. No image resizing or thumbnail representation is exposed by this utility. Remote bucket limits/policies were not changed or asserted to match client limits.

## Experience and compatibility

1. Creation is one lightweight form: required name/username, existing entity type, optional tagline/logo. Other existing optional fields are completed after creation in Manage Workplace. Success navigates to the existing edit route. The backend's required-field semantics are unchanged.
2. Editing groups Workplace identity, About, and Location into light cards consistent with the public Workplace palette. Existing data arrives from the authorized server page; there is no second organization fetch or public-panel query.
3. Entity values remain exactly `company` and `organization`. Labels explain businesses/startups/agencies versus organizations/brands/institutions/nonprofits/teams. No new enum semantics. Unexpected existing values remain visible; the existing server still decides what it accepts.
4. Industry uses a native searchable suggestion list: existing Professional categories plus IT, Marketing Agency, Advertising & Marketing, Nonprofit, Professional Services, Construction and Energy. It accepts custom text because the existing field is text.
5. Country uses native searchable suggestions for common countries, with unrestricted custom text so omitted countries and legacy casing remain editable. This is not a complete country registry.
6. Size is a native select with 1, 2-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10000+. Current nonstandard values are inserted as a `(current)` option. No legacy values are silently mapped or erased. The existing APIs continue their existing whitespace trimming.
7. Native select/datalist controls avoid custom popup positioning, retain keyboard operation, and permit platform-native selection. Datalist appearance/support varies by browser; free typing remains available.
8. Username has an @ prefix, format guidance, a wrapping canonical URL preview, debounced/canceled availability requests, and explicit unavailable/error states. An unchanged handle explains that the server will check it again. Availability is advisory; server checks remain authoritative.
9. Logo recommendation is 400 x 400 square, not a hard dimension constraint. Preview uses a 96px rounded square with object-cover and 16px radius, matching PublicWorkplace. Change/remove/current-preview controls and actual client size/type guidance are visible.
10. Cover recommendation is 1600 x 240 (approximately 6.7:1), close to common desktop public viewport ratios (1365/208 = 6.56). The actual public cover is full viewport width, 208px tall at sm+ and 144px below sm, so it has no universal aspect ratio. The form preview switches from a wide desktop strip to a narrower mobile crop. Text explains cropping and the dashed center guide is explicitly not a guaranteed safe area. This does not duplicate the public page or introduce an image editor.
11. Completeness is round(completed / 9 * 100). Equal fields: name, valid username, logo, cover, tagline, description, industry, valid website, location. Whitespace-only values do not count. Missing steps link to their fields. The UI states the score reflects unsaved form values and optional fields remain optional. Type, country, size and year do not inflate this identity score. No backend scoring or DB column.
12. View Workplace opens the last saved canonical `/u/{username}` in a new tab, announced to screen readers. Unsaved username edits do not change that link. Successful username edits update the management route and saved address.
13. Save Changes has a loading state, immediate submission ref guard, disabled fieldset, and upload-aware disabled submit button. Success stays in management. Name/username/website/year errors appear beside fields, with focus on the first invalid field. Safe errors preserve data and never display raw DB diagnostics. HTTP 401/403 explain session/permission problems. Client validation supplements, not replaces, existing server controls.
14. ImageUploader reuses the same storage implementation. It adds optional Workplace preview/guidance/busy props, accessible button names, visible focus styles, upload error announcements, duplicate-upload guards, and try/finally cleanup. Existing avatar/cover callers retain their upload path/type/size semantics; generalized reliability/accessibility changes apply to them too.

## Validation and browser evidence

- Next type generation: PASS.
- TypeScript noEmit: PASS.
- `scripts/test-workplace-setup.cjs`: PASS; legacy preservation, completeness, validation, and actual edit page authorization under mocked auth/membership fixtures.
- `scripts/test-workplace-foundation.cjs`: PASS, 28 checks, including final-write username guards.
- `scripts/test-workplace-public.cjs`: PASS, including 24 section/role render combinations.
- ESLint: UNAVAILABLE. Installed ESLint 9 has no eslint.config.js/mjs/cjs. Existing package script uses next lint. No tooling/config migration was made.
- `git diff --check`: PASS. Existing line-ending warnings do not change the result.
- Actual local Next routes compiled successfully. Chromium logged-out requests to both creation and SellVora editing ended at `/login`.
- Isolated Chromium harness rendered the actual form, uploader, input, textarea, and setup helper, with generated application CSS. Next navigation, Supabase storage/auth, network responses, icons, and class-combining utility were mocked. No authenticated production form or production mutation was used. The harness omits the application shell/Next font setup; screenshots are component evidence, not full application visual parity.
- Synthetic existing-record fixture preserved SOCIAL MEDIA / 5-10 MEMBERS / india, showed current images and 100% completeness, and linked to the saved canonical address. Removing the logo changed completeness to 89%.
- Mocked browser checks passed: native select keyboard use, industry/country input, username available/taken and validation, required name, unsafe website focus/error, invalid upload MIME, upload permission failure, logo/cover upload paths, save disabled during upload, safe server error retaining data, successful edit, duplicate-save suppression (one PATCH), and creation redirect to management (one POST).
- No uncaught page errors in the completed fixture suite. Real storage success, persisted saves, live owner/admin/member permissions, screen-reader behavior and native mobile OS picker presentation: NOT VERIFIED IN BROWSER.

| Width | Create scroll/client | Edit scroll/client |
|---|---|---|
| 320 | 320 / 320 | 320 / 320 |
| 360 | 360 / 360 | 360 / 360 |
| 375 | 375 / 375 | 375 / 375 |
| 390 | 390 / 390 | 390 / 390 |
| 412 | 412 / 412 | 412 / 412 |
| 430 | 430 / 430 | 430 / 430 |

Measurements include long unbroken name/username and long industry/country values. Fields scroll their own text; the canonical address wraps. Buttons, preview images, selects and cards fit. No global overflow masking. Desktop and mobile fixture screenshots inspected.

Artifacts (outside repository): `%TEMP%/gigway-phase3-browser/results.json`, `new-desktop.png`, `edit-desktop.png`, `new-320.png`, `edit-320.png`. Temporary browser harness and automation scripts are also outside the repository.

## Security, performance and limitations

No APIs, RLS, credentials, remote policies or infrastructure changed. Uploads remain in the authenticated user's existing storage prefix, not an arbitrary organization-provided path. Public member data is not loaded. Edit loads one organization and one current-user membership, then reuses that server data. No member-list or per-card/N+1 queries. The existing public image URL is reused because no existing resized representation was found. Image guidance does not guarantee a remote bucket's effective limit.

No schema change is necessary. More granular entity taxonomy would require a separately approved change; existing two-value semantics are retained. Legacy malformed optional URLs/years remain visible but must be corrected or cleared before a new save passes client validation. Website/year server validation remains its existing implementation. The known cross-entity handle collision, Professional avatar shape, and all Phase 3 non-goals remain untouched. Shared uploader changes warrant signed-in regression QA on other callers before release.

## Changed files and worktree

Task files:
- app/organizations/[username]/edit/page.tsx
- app/organizations/new/page.tsx
- components/organizations/OrganizationForm.tsx
- components/ui/image-uploader.tsx
- lib/organizations/setup.ts
- scripts/test-workplace-setup.cjs
- docs/workplace-phase3-review.md

`git status --short`:

```text
 M app/organizations/[username]/edit/page.tsx
 M app/organizations/new/page.tsx
 M components/organizations/OrganizationForm.tsx
 M components/ui/image-uploader.tsx
 M public/sw.js
?? docs/workplace-phase3-review.md
?? lib/organizations/setup.ts
?? scripts/test-workplace-setup.cjs
```

Tracked `git diff --stat` (includes pre-existing service-worker diff; excludes untracked task files):

```text
 app/organizations/[username]/edit/page.tsx    | 13 +++-
 app/organizations/new/page.tsx                |  7 ++-
 components/organizations/OrganizationForm.tsx | 90 +++++++++++++++++++--------
 components/ui/image-uploader.tsx              | 54 ++++++++++++++--
 public/sw.js                                  |  2 +-
 5 files changed, 132 insertions(+), 34 deletions(-)
```

Nothing staged, committed, pushed or deployed. No migrations run. Existing worktree preserved. public/sw.js remains local-only and uncommitted; unchanged SHA-256: B1E2C71C59683D97B5FB0B649EF2327F279727F980821DC89E0AF3179C4816F6. HEAD remains b3038cc3619e6776fa21979128fd8bf630b319be.

**SAFE FOR REVIEW: YES.** Live authenticated save/upload QA remains required before release. Stop for review; no next feature started.
