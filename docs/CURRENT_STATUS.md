# Spokemon standalone — current state (2026-11-02)

## Location
- Authoritative code-only branch: anthonyaccinelli/breakaway-cycling, branch spokemon-standalone (all files are Spokemon-specific, no other game modes in this working tree).
- Portable original extraction and preview source: PR #80, branch feature/spokemon-standalone-extraction-20261102, app root apps/spokemon.
- Separate Vercel project: spokemon-standalone-extraction, project ID prj_50ICTyTAfMiZkpVPAQPshPYSntZc. Its READY source deployment was built from PR #80's app folder. Do not confuse ERROR deployments from unrelated branches that lack apps/spokemon with failed Spokemon code.
- Legacy site export migration PR: #81, feature/spokemon-save-export-20261102. Dedicated export workflow passed. PR NOT MERGED.
- Safe source recovery ref: backup/spokemon-pre-extraction-20261102, SHA 2a0945fb0d587403a7868b2e5a097d27c0974b2d, PR #79 source (cadence-only). Do not move this backup ref.

## What works in automated checks
- Standalone unit tests: cadence-only virtual route progress, speed-source precedence, fresh/stale sensor handling, deterministic terrain, temperament-dependent cadence targets, no unrelated game-mode imports.
- Chromium Playwright smoke tests: 01 Route -> 02 Devices -> 03 Ride, original Illustrator Explore/Encounter assets, no-trainer cadence play-test, route generation, navigation, save JSON export.
- TypeScript and Vite build passed.
- Original Breakaway root CI has 25 known pre-existing source/layout assertion failures on main and PR #79. Never claim all Breakaway CI green.

## Architecture
- src/standalone.ts: App entry, DOM adapter for original Spokemon route/devices/ride UIs, Web Bluetooth CSC/FTMS/HR receipt, real-ride recorder, TCX download, save export/import, overlay.
- src/standalone-route.ts: Portable deterministic elevation route and GPX parser.
- src/pedalkin-ride.ts / src/spokemon-playable.ts: unchanged preserved gameplay and artwork rendering from PR #79; SVGs stored under public/pedalkin/.
- src/spokemon-temperament.ts: Trust cadence/power requirement logic.
- src/spokemon-csc.ts and src/spokemon-sensor-progress.ts: speed/cadence telemetry parsing and route progression.
- Use data-pk/input-choice helpers for auto, power and cadence.
- The standalone game's original body screen states remain 01 route, 02 setup, 03 ride.

## NOT YET COMPLETE
1. Real FTMS SIM/ERG resistance control and Zwift Click input were not ported into the standalone adapter. Do not claim trainer parity. Physical cadence and FTMS hardware validation is also pending.
2. Standalone new GitHub repository cannot be created with the available GitHub connector, so a user must create an initialized repository before code can be copied into it as a clean history.
3. Legacy domain localStorage does not transfer automatically to another origin. Once PR #81 is reviewed/released, users can export from legacy Game Controls and import in standalone Game Controls. Verify with a REAL save before migration.
4. Browser smoke tests do not prove every capture/escape edge case, storage failure, road physics or overlay behavior; expand tests and test on actual trainer.
5. Vercel project is linked to the old GitHub monorepo for now. After the new repo is initialized and populated, connect a new project to the new repo before releasing a production destination domain.
6. Keep the approved Illustrator SVG source untouched; no arbitrary redesign.

## Acceptance for full separation
- Fresh GitHub repo contains only Spokemon source and no shared history of other modes.
- Independent Vercel app builds from new repo main and has a verified stable domain.
- Browser, unit, save export/import and physical hardware tests pass.
- Legacy Breakaway unchanged until replacement is confirmed, then update navigation and retire original Spokemon code in a separate reviewed change.
