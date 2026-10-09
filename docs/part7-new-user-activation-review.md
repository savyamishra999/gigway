# Part 7 — Guided activation

Baseline: Name, username and optional photo already complete a person identity. Existing explicit next routes and legacy role-required destinations are functional; no first-action guide/replay existed.

Added a lightweight Profile Ready guide after successful default onboarding, three real action links (Explore Work, Find People, Share a GigThought), brief person/Workplace explanation, Create/Network/Work tips, Skip/close and local Hide tips. Replay is available at /how-it-works and in both account navigation surfaces. Explicit return destinations and role-required setup retain their original routing, so the guide does not intercept an in-progress destination. No forced follow/post/search, storage read during render, new database field or mutation in the guide.

Validation: actual guide tests PASS; Create P0 nine groups and auth/navigation 23 groups PASS; TypeScript PASS. Local Chrome 14 ready/replay component samples at all seven requested widths PASS without overflow: C:/Users/Admin/AppData/Local/Temp/gigway-part7-component-RT0LbT/report.json. Compiled baseline CSS plus actual current markup; only menu text changed in Navbar. No live signup/account or Next hydration claim. git diff --check verified at phase checkpoint.

Application files: components/identity/ActivationGuide.tsx; components/identity/IdentityOnboarding.tsx; app/how-it-works/page.tsx; components/layout/ModernNavbar.tsx; app/profile/page.tsx.
Test files: scripts/test-part7-activation.cjs; scripts/part7-component-browser-qa.cjs.
No migration, commit, push, deployment or production mutation.
