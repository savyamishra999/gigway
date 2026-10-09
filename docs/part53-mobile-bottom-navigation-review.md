# Part 5.3 mobile bottom navigation

Baseline: `1071a55`. The subsequent master continuation request supersedes the earlier push authorization: no commit, push or deployment during this roadmap pass. The final output is a consolidated report and staging plan.

## Design and behavior

Previous navigation used five equal columns with a 28px coral Create icon and 44px minimum-height links. The new navigation retains five equal logical positions and all labels: Home, Network, Create, Work, Account. Create is a 56px indigo circle raised 16px above the clean white bar, with a clear Plus icon, white perimeter and restrained shadow. Its label remains below the circle. No custom notch or continuous animation.

Home routes to `/home`, Network to `/network`, Create to `/create`, Work to `/work`, Account to the existing `/profile`. Links retain `prefetch={false}`. There is one Link navigation path and no added click handler or router push. No `/explore`, JOX or GLIMPS primary item is introduced.

Create is active on `/create`, `/social/create`, `/jobs/new`, `/projects/new`, `/gigs/new` and their slash-delimited descendants. Unrelated detail pages do not select Create. Ordinary tab matching uses exact or slash-delimited descendants. An active Create suppresses other active tabs. Active destinations have stronger icon strokes, bold accent labels and `aria-current="page"`; inactive normal tabs remain quieter. Create's active circle is darker with a subtle ring.

The existing `lg` breakpoint remains: bottom nav below 1024px, original desktop navigation at 1024px and above. No desktop header architecture changes. The bottom bar remains fixed during scroll and uses z-30, below z-40 sheets and z-50 menus/overlays. Each link has a visible keyboard focus ring and accessible name; decorative icons are hidden from assistive technology. At 320px each column is over 56px wide, with 64px link height and visible 11px labels.

Safe area adds `env(safe-area-inset-bottom)` to 8px bottom bar padding. Shared root-main mobile bottom padding is `96px + env(safe-area-inset-bottom)`, exceeding the bar's 73px base height (including its border) plus 16px upward circle overlap. Desktop resets this additional padding. Existing per-page padding is preserved; no scattered page edits.

Hydration presentation is CSS-driven. The new nav markup reads no browser width, storage, random value, clock or navigator. Existing `usePathname` and shared auth state remain. Historical React #418 remains NOT REPRODUCED in Part 5.2; this visual change does not claim to fix it.

## Validation scope

Focused tests execute actual Navbar output with deterministic shared auth and navigation mocks. The browser harness archives committed HEAD and overlays only the two application changes, then drives actual local Next routes against an authenticated local Supabase fixture. It never uses production credentials or publishes/uploads content. Third-party browser requests are blocked.

Requested matrix: 320,360,375,390,412,430 and 1280. Each width checks Home, Network, Work, Account, Create, GigThought composer, Jobs/Projects/Services lists and representative details. Create checks four actions and reachable final action; composer checks Text/Photo/Video/PDF controls and reachable Post. Actual attachment upload/publish and physical software keyboard are not measured. Safe-area handling includes CSS audit and a synthetic 24px inset; this does not substitute for a physical iPhone or Android test.

Browser navigation scenarios include three six-destination sequences, a six-tap burst without awaiting intermediate destinations, fixed-scroll geometry and Home→Network→back, Work→Create→back, Account→Home→back. Physical Android back and browser chrome are not measured.

## Exact scoped files

- `components/layout/ModernNavbar.tsx`
- `app/layout.tsx`
- `app/projects/[id]/page.tsx` — wrap existing Save/Share/Repost toolbar to prevent measured 320px viewport expansion.
- `scripts/test-part53-mobile-nav.cjs`
- `scripts/part53-browser-qa.cjs`
- `scripts/part53-mobile-nav-scenarios.cjs`
- `scripts/part53-component-browser-qa.cjs`
- `docs/part53-mobile-bottom-navigation-review.md`

Existing dirty media/settings/audits and uncommitted Part 5.2 artifacts are excluded from the commit. Generated service workers, configuration, database/schema/RLS remain unchanged. No Part 6 or dormant product work.

Measured results and final disposition follow after the checks finish.

## Final phase result

READY FOR PART 5.3 REVIEW within the measured component/CSS scope. No commit/push/deploy; continue under the master roadmap.

Measured evidence: C:/Users/Admin/AppData/Local/Temp/gigway-part53-component-cgTR94/report.json. Actual Navbar, Create choices, GigThought composer and Project detail SSR were rendered with current compiled Tailwind CSS and the generated Manrope class. Other page bodies in this lightweight harness are navigation fixtures, not full application pages.

| Result | Evidence / limit |
|---|---|
| Widths 320,360,375,390,412,430,1280 | 49 component/CSS samples PASS; requested viewport matches actual layout viewport; no horizontal overflow. |
| Center Create | 56px circle, 16px raised, mathematical center, five visible labels; normal destinations quieter. |
| Routes / active state | Actual Navbar tests pass exact order, /network, /create, /work, existing /profile and standard creation boundaries; no detail-page Create activation. |
| Desktop | Actual desktop destination tests unchanged; CSS hides bottom nav at 1280. |
| Create P0 / composer | Four actual Create actions; final action and actual composer Post reach above nav at all six mobile widths. Text/Photo/Video/PDF control source preserved. No upload/publish performed. |
| Safe area | env(safe-area-inset-bottom) audited in actual CSS. Installed Chrome lacks setSafeAreaInsets; hardware inset behavior NOT MEASURED. |
| Scroll / focus / accessibility | Fixed positioning measured in CSS; semantic named links, aria-current, hidden decorative icons, 64px-high targets and focus rings covered by actual markup tests. No screen-reader/physical-keyboard claim. |
| Rapid Next navigation | NOT COMPLETED in full Next harness; source confirms one Link path without extra router push. Native fixture history pairs pass; these do not prove Next client navigation or Android back. |
| Hydration | Focused Part 5.2 initial-state test passes. Static SSR harness performs no React hydration. Historical production #418 remains NOT REPRODUCED, not fixed. |
| Project detail viewport | BEFORE actual component SSR: 320px became343px; Repost toolbar right edge342.98px. AFTER adding flex-wrap to existing toolbar: all seven widths pass. Earlier full Next sample also showed viewport expansion. |
| Full Next attempts | Initial boot timeouts; an interim eval-based helper caused worker EADDRINUSE and was removed. Standard CLI restored. One 320px full-route run reached detail and exposed the toolbar issue; missing price/budget fixture values caused separate caught errors and were corrected. Subsequent full boot timed out. No full Next matrix PASS is claimed. |
| Regression | Final exact three-application-file snapshot: all16 CJS suites plus TypeScript PASS; logs in C:/Users/Admin/AppData/Local/Temp/gigway-part53-aivTHn/final-tests.json. Initial timing failure retained; clean rerun and final full run pass without changing the timing assertion. |
| Diff / frozen artifacts | git diff --check passes; no generated worker/configuration/schema/RLS changes. |
| Physical Android/iPhone | NOT MEASURED. |

Final scoped inventory: three application files, four Part5.3 QA/test scripts and this review. The master inventory is tracked separately. Browser integration limitations remain a launch QA item; no product flow is changed to conceal them.
