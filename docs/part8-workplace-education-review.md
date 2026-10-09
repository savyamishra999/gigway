# Part 8 — Workplace education

Baseline: existing lightweight Workplace creation already includes name, username, type, tagline and logo. Authenticated server authority, username collision checks and owner membership creation were present. No backend rebuild needed.

Added person-versus-organization explanation after identity essentials, nonblocking company-name copy hints (Pvt Ltd/private limited/LLP/Technologies/Solutions/Foundation/Institute/Company/Startup), the same existing Continue handler and separate Create Workplace links. Names are never rejected by this heuristic. Account menu now has My Professional Identity, My Workplaces, + Create Workplace and My Account; Workplace subtitle explains the separate page. Creation header repeats the distinction. No role/schema/permission change.

Tests: actual onboarding trees for company-like and ordinary human names PASS; existing Workplace foundation28 checks, setup authorization/validation and public24 section/role combinations PASS; TypeScript PASS. Local Chrome 14 person/company component samples, all seven widths, no overflow PASS: C:/Users/Admin/AppData/Local/Temp/gigway-part8-component-XZ4xFl/report.json. Upload control and identity operations mocked; no signup/upload or live creation. The raw test Link mock emits a harmless React prefetch attribute warning; real Next Link consumes that prop. Full Next/physical-device integration unmeasured.

Application: lib/identity/company-name.ts; components/identity/IdentityOnboarding.tsx; components/layout/ModernNavbar.tsx; app/profile/page.tsx; app/organizations/new/page.tsx.
Tests: scripts/test-part8-workplace-education.cjs; scripts/part8-component-browser-qa.cjs.
No migration, remote mutation, commit, push or deploy.
