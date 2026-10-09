# Part 9 — Home V2 audit

The requested visible hierarchy is already present in the completed Network/Home architecture: Share a GigThought then FOR YOU in the primary feed; People for you and Workplaces to follow (six each), Find Work without another search form, Latest Opportunities (two per category, six total), and existing Network/Work links. Person cards carry stored headline/skills/intents and Follow; Connect remains on the person profile. Workplace cards carry logo/tagline and Follow only. No redesign or duplicate loader added.

Home uses one request-scoped viewer; primary initial posts are server rendered and replay/empty first pages do not refetch. Optional HomeModule boundaries do not gate primary feed. Current-product flags prevent dormant loaders from running. The shared six-item discovery read selects only returned IDs for follow/intent enrichment; no huge candidate fetch or second Discover fetch introduced. Preserve the pre-existing dirty SocialHomeFeed byte-for-byte.

Validation: actual architecture11 groups, Part4 visible-performance7 groups, final pagination/visibility/recovery19 groups and simplification13 groups PASS. Existing Part5 public/browser evidence covers the baseline; no new full Next/hydration/performance measurement is claimed. Layout/mount behavior is source-derived and local-fixture tested. No application edit required in this phase; later connection pagination is Part10.

No database/schema/migration, remote mutation, commit, push or deployment. Inventory: this review only. Protected and dormant baseline preserved.
