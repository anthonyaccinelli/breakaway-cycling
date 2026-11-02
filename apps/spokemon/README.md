# Spokemon — standalone extraction (2026-11-02)

Independent Vite app (root: apps/spokemon) designed for migration into its own Git repository. It intentionally does NOT import the original Breakaway main.ts, Cycle Quest, Survival, Classic or Coach.

## Current functionality
- Original approved Illustrator Route, Explore, Encounter SVG assets copied by unchanged Git blob SHA
- Existing gameplay code: temperament-specific power/cadence Trust, Patience, capture, buddy, XP and collection
- Simulated Game Controls (explicitly non-recording) and manual encounter tests
- Bluetooth Cycling Speed and Cadence, including cadence-only virtual distance, freshness checks and measured wheel speed precedence
- Basic FTMS Indoor Bike Data and Bluetooth HR readings; no trainer resistance commands yet
- Deterministic generated terrain, GPX import, independent TCX export for real rides, local summary saves
- Responsive standalone artboards and portable app-local CI

## IMPORTANT release limitations
- This is an extraction prototype, NOT production-complete. FTMS SIM/ERG commands and Zwift Click input require porting and real-hardware verification.
- The current browser localStorage collection is origin-bound. New-domain migration must provide an export/import workflow BEFORE legacy access is removed.
- No direct GitHub repository-creation action is available in this development connection. This directory is portable to a fresh repository but remains inside the existing GitHub repository on an isolated branch.
- Existing 25 root-suite UI assertions are pre-existing failures on main; this project's independent suite is separate.
- Do NOT delete old Spokemon or Cycle Quest code, modify the main Breakaway deployment or claim production readiness based solely on CI.

## Run
npm install
npm test
npm run build
npm run dev

Requires desktop Chrome or Edge over HTTPS or localhost for Web Bluetooth. Non-hardware Test Ride is available from 03 Ride > Game Controls.
