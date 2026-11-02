# Spokemon separation Phase 1 — audit and preservation (2026-11-02)

- Frozen source: 2a0945fb0d587403a7868b2e5a097d27c0974b2d (PR #79, unmerged).
- Production main baseline: f160eb89cde798ef27331a40e433466e20ee1ee7.
- Immutable recovery ref (do not mutate): backup/spokemon-pre-extraction-20261102.
- Working ref: feature/spokemon-standalone-extraction-20261102.
- Source PR #79: https://github.com/anthonyaccinelli/breakaway-cycling/pull/79
- Main CI: 41517539347 — 346 tests, 321 passed, 25 failed.
- PR #79 CI: 41519902564 — 347 tests, 322 passed, 25 failed. The failing test names are identical to main.
- The original game assets (public/pedalkin/**), creature definitions, temperament logic, sensor parsing and saved-game schema MUST remain unchanged during extraction.
- Known architecture coupling: src/main.ts (3416 lines) owns trainer/device state, route generation, telemetry and application navigation for multiple modes; route/devices are proxy components over hidden original DOM controls.
- Existing captive storage uses spokemon-caught-v1 and spokemon-buddy-v1 in localStorage; domain isolation prevents automatic migration.
- Account settings mirror matches breakaway* or cycle-quest-* but not spokemon*; no assumed cloud saves.
- 25 failing UI tests are stale source/layout assertions or mismatches against Illustrator assets; they are not proof of browser parity. Keep them visible and replace with behavior/browser comparisons separately.
- Current Vercel project spokemon-gameboy-playable-preview exists. It is NOT evidence that this extraction has been deployed.
- Gate for production: standalone CI pass, browser gameplay pass, physical BLE trainer/cadence test, migration validation, new repository and independent Git project connection.
