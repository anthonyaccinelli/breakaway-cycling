# Breakaway Coach: private-repository integration

## Architecture
- The private repository `anthonyaccinelli/breakaway-coach` is the **source of truth** for Coach's planning engine, UI and training tests.
- `breakaway-coach` GitHub Actions runs its own 84-test suite and web/library builds. Only a successful main-branch CI job publishes two ESM/CSS assets plus a SHA-256 integrity manifest to the private `coach-bundle` branch.
- Ride Breakaway keeps the **compiled**, explicitly version-pinned copy in `src/vendor/breakaway-coach/`, imported by `src/main.ts`. This does not require production Vercel credentials or cross-repository private GitHub access.
- The Coach UI still runs in the **same browser origin** as Ride Breakaway. That preserves browser-stored profiles, readiness and IndexedDB history; no iframe, cookie copying, or personal training-data migration.

## Update to a tested Coach version
1. Merge an independently tested Coach change to the private Coach repository's `main`.
2. Confirm Coach GitHub Actions succeeds and publishes `coach-bundle`.
3. On a development machine with a **read-only** GitHub token authorized for the private Coach repository, run:
   ```sh
   GH_TOKEN=... node scripts/sync-coach-bundle.mjs <full-coach-source-sha>
   npm test
   npm run build
   ```
4. Open a Ride Breakaway PR with the new `breakaway-coach.js`, `.css` and `manifest.json`. Review changes and verify a real ride before merging.

**Never put the token in a committed file, frontend build, or Vercel client env variable.** Build artifacts are committed and need no runtime credentials. Source code from the private Coach repository is never dynamically fetched in the user's browser.

## Integration verification checklist
- Classic > Train with Breakaway Coach opens the existing, fully styled Coach UI
- Today / Next 7 Days / My Week agree about every date and status
- Existing browser profile, event goal, strength setup, skipped days and ride history remain unchanged
- Adaptation after out-of-plan rides remains correct
- Normal FTMS session: workout routes, ERG setTarget, interval transitions, pause/resume, finish/review and TCX export
- Overlay displays the active workout without affecting Survival, Cycle Quest or Pedalkin
- Check browser console for module/CSS errors and confirm no duplicate Coach screen/HUD

## Cutover / rollback
This change runs in a **review branch**, not production. The previous `src/coach*.ts/css` implementation remains in Ride Breakaway temporarily for fast rollback and legacy integration tests. After preview plus hardware verification, delete the duplicate Coach implementation and relocate Coach-only tests to its own repository in a separate reviewed PR. Reverting this PR returns to the original import without touching saved plans.
