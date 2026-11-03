# Breakaway Coach — Phase 3 legacy cleanup (staged, not released)

## Preconditions / merge order
1. Complete the browser, calendar, Elite Direto XR-T (FTMS) and saved-data checks in [COACH-HARDWARE-RELEASE-QA.md](COACH-HARDWARE-RELEASE-QA.md).
2. Merge **PR #82** to `main` only after its draft release blockers have been resolved.
3. Confirm `ridebreakaway.com` serves the pinned Coach bundle on the **existing origin** and retains real rider plans, event goals and local/imported history after reload. If not, revert PR #82 immediately.
4. After the production cutover is verified, rebase this cleanup branch on `main`, rerun Coach integration CI and the full build, then separately review and merge the cleanup PR.

## Ownership boundary
- `anthonyaccinelli/breakaway-coach` is the source of truth for all Coach planning/UI logic, CSS and 12 migrated Coach unit-test files.
- Ride Breakaway retains `src/vendor/breakaway-coach/` (pinned compiled artifact), `src/coach-route.ts` (host route buffer), its Classic host bridge in `src/main.ts`, and host-specific Coach integration tests.
- The three host-specific tests (`coach-classic-only`, `coach-v2-navigation`, `coach-visibility`) are refactored to verify the compiled distribution rather than deleted source modules.
- The 10 stable existing Coach browser-storage identifiers remain guarded by `tests/coach-cutover-contract.test.mjs`; any key/schema migration must be explicit.
- `.github/workflows/coach-adaptive-checks.yml` now watches host integration paths, not the old monolithic Coach source.

## Validation limits
Automated checks cannot establish successful physical ERG transitions, pause/resume, TCX correctness, or preservation of **the user's actual origin-scoped data**. Do not merge a draft release because these repository tests pass. Keep the prior implementation available in Git history for rollback; this cleanup must remain a separate reviewed change.
