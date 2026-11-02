# SPOKEMON — playable alpha handoff (2026-11-01)

## Goal and non-negotiable visual rule
Continue Spokemon in the existing Ride Breakaway web app, GitHub repository anthonyaccinelli/breakaway-cycling, Vercel project prj_BYFZotpHvwKRgICup52ciMGBaLAM. Do not create standalone HTML mockups or separate Vercel projects.

Approved visuals:
- public/pedalkin/explore.svg (exact 1920×1080 uploaded Illustrator SVG)
- public/pedalkin/encounter.svg (exact 1920×1080 uploaded Illustrator SVG)
- 01 Route and 02 Devices purple Game Boy layout
- 03 Ride artwork must fit entirely in browser viewport. No arbitrary redesign.
- The two uploaded SVGs are displayed as unmodified <img> elements, with an independent transparent gameplay layer over dynamic fields.
- Color palette: downhill #F6D58C; 0–1% #9ECA96; 1–4% #6AAD38; 4–8% #989141; 8–12% #C6744A; 12%+ #F45853.

## Current release
- Source branch: feature/spokemon-playable-v1-2026-11-01.
- Existing approved graphics released on main at commit 4f812d15a2e4723ae6f46a032e7756f0bc0bfe66, PR #63.
- Current playable implementation is a new gameplay overlay in src/spokemon-playable.ts and CSS src/spokemon-playable.css.
- src/pedalkin-ride.ts mounts it on the exact artwork, wires SVG Journal / Buddy / Stats / Save & Close.
- src/main.ts emits FTMS-derived power, cadence, speed, HR, grade, calories, distance, and running/connected state via pedalkin:ride-frame.
- tests/spokemon-playable.test.mjs includes source-integration smoke checks.

## Functioning Spokemon alpha loop
- Route generator is still the existing Breakaway route generator.
- 03 Ride accessible without a connected trainer.
- With trainer connected and initialized: native Breakaway start/pause/SIM/ERG/activity recording is used. The game listens to existing real telemetry, no synthetic telemetry is ever dispatched into the native ride recorder.
- With no trainer: use GAME CONTROLS → START TEST RIDE; adjusting Test Effort changes simulated progression (accelerated) without producing false activity recordings.
- Explore uses real route elevations and a grade-colored clipped elevation profile, with moving rider marker.
- Natural encounters start after route progress; manual FIND SPOKEMON available for QA. 
- Encounter uses PINE_FOREST_SPOKEMON catalogue (12 species), requires actual trainer pedaling with >50 W and >35 rpm (or explicit simulated test mode) to raise Trust to 100%. Trust accumulation is effort-adjusted. Patience counts down; capture chance about 85% at 100% Trust, otherwise creature escapes. Natural encounter cooldown prevents immediate repeats.
- Captured creatures are saved locally via browser localStorage key spokemon-caught-v1; Journal and Collection list them. They do not currently sync between devices.
- Mossprout is default preview art, other species use provisional original silhouettes in the same 460×370 encounter slot.
- Underlying Breakaway real session uses the original Finish Ride confirmation and TCX workflow. Never save a trainer-free test session as a real ride.
- This is an alpha: Bluetooth behavior with the user's real hardware and end-to-end ride recording need user hardware validation. Do not claim verified by a real trainer test.

## Development / QA workflow
- Always check GitHub branch diff against main; preserve unrelated Classic, Survival, Cycle Quest, Coach changes.
- Deploy to existing Vercel project. Verify state READY and exact SHA. Merge to main after explicit user approval or release instruction, then verify production deployment alias ridebreakaway.com.
- Keep recovery branch recovery/spokemon-pre-new-chat-2026-11-01 and exact SVG baseline feature/spokemon-exact-svg-2026-11-01 untouched.
- Previous full visual recovery and SVG hashes: docs/spokemon-exact-svg-baseline-2026-11-01.md.

## Near-term work
- Test trainer pairing / SIM grade behavior on the user's Elite Direto XR-T and Zwift Click.
- Confirm starting, pausing, finishing and TCX export using genuine trainer telemetry.
- Tune encounter pacing and effort / Trust progression using an actual Zone 2 ride.
- Replace provisional creature sprite art only with approved creature art.
- Add account-independent creature save/export or cloud sync with user authorization if needed.
- Provide copyable handoff before chat context runs out. Never promise ability to know exact remaining context capacity.
