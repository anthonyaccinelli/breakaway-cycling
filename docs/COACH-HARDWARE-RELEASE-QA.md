# Breakaway Coach repository cutover — Phase 2 release QA

**PR:** https://github.com/anthonyaccinelli/breakaway-cycling/pull/82

**Scope:** Version-pinned private Coach distribution consumed by Classic on the original Ride Breakaway website origin. This plan is intentionally a **release gate**, not evidence that Bluetooth hardware was tested.

## 1. Automated verification (record after last source change)

- [x] Vite + TypeScript production build passes on integration PR.
- [x] Standalone Coach repository: 84/84 tests passed (prior published source pin `d3f64b8e7ac5a8c106eef94acc8ba72e559240c5`).
- [x] Coach-specific integration GitHub Actions workflow passes.
- [x] Coach route-duration and locked-seed regression tests pass.
- [ ] Entire Ride Breakaway suite green. As of the latest integration run: 326/351 passed; 25 **pre-existing Pedalkin SVG/UI tests** failed. Track this separately; do not describe as fully green.
- [ ] Confirm any subsequent PR changes have rebuilt and redeployed before testing.

## 2. Browser UX, calendar, and data

Use a laptop/desktop Chrome or Edge session with no physical trainer connected first.

- [ ] Choose **Classic → Train with Breakaway Coach**. Confirm Today, My Week, My Next 7 Days, My Setup, Progress, and Create Workout all render and respond.
- [ ] Record all seven date keys and workout/strength statuses in My Next 7 Days; compare **My Week** on those exact same dates. They must match after setting an event goal, after a skipped ride, after Undo, and after entering a recovery check-in. Reload, then recheck.
- [ ] Complete first-run setup with an unknown FTP; verify the app offers guided SIM rather than uncalibrated automatic watt targets.
- [ ] Try the trainer-free demonstration; verify it explicitly says simulated and does **not** create a physical ride, award real mileage, or issue FTMS commands.
- [ ] In Classic Route Studio, lock a known old route seed with a different distance/terrain. Then select a **30-minute** Coach workout. Confirm Coach generates a **new seed**, uses the Coach-selected terrain and **12-mile buffer** (24 mph), rather than restoring the locked route. A 60-minute session should generate 24 miles and a 2-hour session 48 miles.
- [ ] Review the browser console and network requests for module errors, CSS errors, duplicate HUDs, or private GitHub tokens. No production token should be delivered to the browser.
- [ ] Verify old plan, event goal, rider profile, skipped days, and locally imported ride history are still visible. **Do not treat a separate Vercel preview domain as proof of preservation:** browser localStorage and IndexedDB are origin-scoped.
- [ ] Re-test saved-data retention **on the ridebreakaway.com origin immediately after cutover**, with an existing profile before any reset. If lost, rollback at once.

## 3. Physical smart trainer test — REQUIRED before merge

Tester: __________   Date: __________   Trainer/firmware: __________
Browser/OS: __________   Preview commit: __________

Using a real Bluetooth FTMS trainer (Elite Direto XR-T preferred):

- [ ] Pair the trainer once in **02 Devices** and verify real watt/cadence telemetry. Heart-rate monitor is optional.
- [ ] Select a structured Coach workout containing at least two different target intervals. Confirm the trainer is in **ERG target** mode, and the first prescribed watt target arrives when the ride starts.
- [ ] At each interval transition, verify a new appropriate FTMS target is sent and resistance changes safely. No stale target after a later interval.
- [ ] Test **Lighter / Harder** controls and confirm watt target and HUD follow the same adjusted level.
- [ ] Pause pedaling and use **Pause ride**; verify elapsed coached workout time does not accrue while paused and no unwanted resistance jump occurs. Resume and verify it advances only during an active ride with telemetry.
- [ ] Reach workout completion: Coach says complete, trainer target settles to an easy level, and the rider can manually finish the ride normally.
- [ ] Finish and review feedback. Verify **one** saved ride, **one** Coach session record, and TCX power/cadence/duration/distance/elevation fields consistent with the actual ride.
- [ ] Leave Coach and verify ERG is released back to SIM as intended. Try a normal Classic ride and confirm no Coach overlay/commands remain.
- [ ] Confirm Survival, Cycle Quest, and Pedalkin are unchanged after switching modes.

A simulated Trainer Test Lab or standalone Coach demo **does not satisfy** these checks.

## 4. Adaptive history regression

- [ ] Finish an extra, non-Coach Classic ride; confirm the next Coach refresh includes it and shows understandable before/after workout changes without stacking missed rides.
- [ ] Confirm another game mode's real ride is included in total weekly training load.
- [ ] Verify save/reload persistence and date boundaries across local day changes. Do not interpret Vercel preview-domain storage as production storage.

## 5. Release / rollback gate

**Merge only when:** required browser, calendar, and physical trainer checks pass; the exact preview commit was tested; the bundle pin and SHA-256 manifest match; and known unrelated failures are acknowledged. Keep PR #82 in draft otherwise.

After merge: verify Coach at `https://ridebreakaway.com/` against pre-cutover saved data. If there is a regression, revert PR #82 (restores original Coach import). Do not delete the old Coach source or tests until cutover is verified. Remove duplicates in a separate cleanup PR.
