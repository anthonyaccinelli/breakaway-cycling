# Spokemon — Senior Designer / Player QA Audit
**Date:** November 1, 2026  
**Repository:** anthonyaccinelli/breakaway-cycling  
**QA log branch:** qa/spokemon-playtest-2026-11-01 (report only, no game changes)  
**Final production baseline:** main @ \`16901302e0347490224c3a3fc963f3b1bb6001b5\` (PR #65 merged while testing)  
**Earlier preview tested:** \`1b62a6a60107ce09aabe178e2434e9702cea00ab\`, at the branch's Vercel preview URL ending \`60nyflsem.vercel.app\`.

## Method and confidence
I exercised the **actual deployed website** with automated Chromium/Playwright and WebKit, rather than only reviewing code or still images. I started at the real ridebreakaway.com homepage, selected Pedalkin, generated and imported routes, navigated Route/Devices/Ride, triggered captures and escapes, checked localStorage and menus, and inspected visual geometry at four desktop/tablet/mobile viewport sizes. Time-sensitive encounters were accelerated using Playwright's controlled virtual clock, and the 15% failure roll was deliberately forced for a deterministic negative-path check. I also reviewed relevant source logic and ran the project test/build commands in an isolated checkout.

**Important scope limit:** No actual Bluetooth FTMS trainer, Zwift Click, HRM, or native TCX workout was available inside this browser test environment. True trainer pairing, changing gradient resistance, pause/resume under load, and end-to-end real TCX recording remain **UNVERIFIED**. A passing build is not proof of hardware correctness. Playwright WebKit is Safari-like Linux browser testing, **not** a physical iPhone/Safari test.

The branch changed during QA: PR #65 was merged to main. Consequently, bugs seen only on the older preview are marked **RESOLVED on latest production** after specific retests; active issues below were either reproduced on latest production, concern unchanged components, or are explicitly marked code-review risks.

## Actual journey executed
| Stage | Action | Result / evidence |
|---|---|---|
| Home | Open \`ridebreakaway.com\`, click “PEDALKIN” | PASS — opens Spokemon Route. Homepage is still written as “SMART TRAINER REQUIRED” (inconsistent). |
| Create route | Generate 20 mi with 1,000 ft goal | PASS — custom route generated, displayed 20.0 mi and 1,000 feet in first run. |
| Seed | Generate using \`123456789\`, change to \`987654321\`, re-enter \`123456789\` | PASS — same seed gives byte-identical chart path; different seed changes the path. |
| Preset | Recovery | PASS — generated approximately 10.0 mi / 92 feet / Flat. |
| Surprise Me | Click | PASS — example route 10.8 mi / 688 ft. |
| Endless | Click | PARTIAL — endless engine starts but on-screen fields remain old values while preview shows a 5-mi chunk; confusing. |
| GPX | Import generated GPX with 16 points | PARTIAL — uploaded route loads as 1.0 mi / 137 ft and status reports file loaded; input fields misleadingly still show 10.8 mi / 688 ft. |
| Route → Devices | Use 02 Devices top navigation | PASS. |
| Route “Ready for your Adventure?” | Click main CTA | FAIL on latest production — goes **straight to 03 Ride**, skipping 02 Devices. |
| Device controls | Change Traditional→Virtual, SIM→Target ERG | PARTIAL — underlying native values change; advanced fields appear after ~650 ms refresh, not immediately. Gear readout remains “— / 24” without trainer. |
| Devices → Ride | Click “Skip to 03 Ride” | PASS; no trainer required for test access. |
| Ride unloaded | Observe readouts | PASS — 0 W, no synthetic recorded power; Game Controls marked READY. |
| Manual encounter without riding | Click Find Spokemon | FAIL — begins encounter before real/test ride starts. |
| Escape | Do not pedal for 67 simulated seconds | PASS — Patience decays 65→0; Glimmoth escapes; Explore resumes ~4 s later. |
| Capture | Start explicit Test Ride, set 310 W, encounter | PASS — captured Hootwig; one saved entry in \`spokemon-caught-v1\`. |
| Failure at Trust 100 | Force deterministic 0.99 random roll | PASS — failed, did not add a second capture. |
| Natural encounter | Keep simulated route progressing | PASS — Shroomble appeared around 5.6 km during test. |
| Collection | Open Collection | PASS — “Hootwig ×1 · 1 of 12 species discovered.” |
| Save & Close | Earlier preview test | FAIL on old preview; **PASS on final production** after PR #65, returns to Route. |
| Prompt visibility | Earlier preview | Text visibly truncated. **PASS on final production:** complete 72-character prompt shown at ~33.63px with 1,198.7px text width inside the 1,212px space. |
| Browser | Chromium desktop & mobile emulation | PASS initial load; no JavaScript console errors in the completed paths. |
| Browser | WebKit 1440×900 and 390×844 | PASS Explore→Encounter and native SVG text updates; no JS console errors in smoke test. |
| Build | \`npm run build\` on contemporary QA branch | PASS. |
| Test suite | \`npm test\` | FAIL — **282 tests; 265 passed; 17 failed**; mostly brittle source-text checks for earlier SVG/DOM architecture. |

## Open confirmed defects — prioritize in order

### SPK-001 · P1 · Primary Route CTA skips Devices
**Reproduction:** On production homepage select Pedalkin; at 01 Route click “Ready for your Adventure? Start Riding!”  
**Observed:** \`data-breakaway-screen\` becomes \`ride\` immediately.  
**Expected:** 01 Route → **02 Devices** → 03 Ride; the direct 03 Ride tab can remain available as an explicit shortcut.  
**Impact:** Players skip trainer pairing and experience a confusing no-trainer readout. **Fix:** Change the CTA's bridge in \`src/pedalkin-handheld-route.ts\` from \`stepRide\` to \`stepSetup\` and test route navigation from homepage.

### SPK-002 · P1 · GPX import leaves stale Route form inputs
**Reproduction:** Click Surprise Me (10.8 mi/688 ft in this test), then import a new 16-point GPX.  
**Observed:** Preview correctly shows **1.0 mi / 137 feet**, status “Loaded spokemon-qa-route.gpx: 1.0 mi”; input boxes still show **10.8 / 688**.  
**Expected:** Clear, auto-update, or explicitly disable/synchronize the Distance and Total Elevation form inputs to the loaded GPX.  
**Impact:** Players can misunderstand their route or accidentally generate a different route with the stale controls.

### SPK-003 · P1 · Endless Route displays finite/inconsistent route fields
**Reproduction:** On 01 Route select Surprise Me then Endless Route.  
**Observed:** Inputs kept **10.8 mi / 688 ft** while preview displayed **5.0 mi / 338 ft** from the generated endless chunk.  
**Expected:** Label Endless as ∞/streaming and explain “next X-mile preview”, instead of showing conflicting route distances.  
**Impact:** Misleading game setup and expected ride distance.

### SPK-004 · P1 · Mobile screen is functionally unreadable and untappable
**Reproduction:** At a 390×844 viewport open 01 Route / 03 Ride.  
**Observed:** Entire native 16:9 game stage is **390×219 px**, centered vertically. The Route main CTA is **146×9 px**, Ride Save & Close hit target **55×9 px**, and other text/buttons shrink proportionally. At 768×1024, main Route CTA is 288×18 px.  
**Expected:** Mobile/portrait composition with minimum touch-target sizes (aim 44×44 CSS px), landscape takeover, or an explicit “rotate your phone” gate. Do not just shrink the whole 1920×1080 artboard.  
**Impact:** Playing on phones and portrait tablets is effectively impossible, despite loaded screens.

### SPK-005 · P1 · Mobile/tablet Route still has vertical page scrolling
**Reproduction:** Open 01 Route at 390×844 and 768×1024.  
**Observed:** At 390×844, document scrollHeight is **1,481px**; at 768×1024 it is **1,418px**. Stage itself is much shorter and centered.  
**Expected:** Screen-filling single-page gameplay with no stray legacy content beneath it.  
**Impact:** Accidental scrolling, inconsistent focus and touch interactions. (Ride screen itself did not have this overflow in the check.)

### SPK-006 · P1 · Ride hides the four promised navigation tabs
**Reproduction:** Enter 03 Ride on desktop and mobile.  
**Observed:** \`.pk-ride-nav\` has computed \`display:none\`. Route and Devices are not discoverable on-screen. A hidden keyboard shortcut exists, but touch users cannot use it.  
**Expected:** Visible, appropriately sized 01 Route / 02 Devices / 03 Ride / 04 Overlay controls, compatible with saving/pausing a real ride.  
**Impact:** Navigation dead end, especially on touch devices.

### SPK-007 · P1 · Game allows encounter before a ride starts
**Reproduction:** Enter 03 Ride without trainer; do NOT start Test Ride; expand Game Controls → Find Spokemon.  
**Observed:** Wild Hootwig/Glimmoth encounter starts with 0 W and Trust 0%; Patience runs down to zero.  
**Expected:** Enable “Find Spokemon” only during an active Test Ride or real ride, or label it clearly as an intentional debug encounter with synthetic/paused state.  
**Impact:** User can enter a guaranteed no-effort failure and mistakes QA controls for gameplay.

### SPK-008 · P1 / Code review · Patience drains even when ride is paused
**Source evidence:** \`src/spokemon-playable.ts\` decrements \`patience=Math.max(0,patience-dt)\` each interval, regardless of \`f.running\`; Trust only advances while \`moving\`.  
**Observed demonstration:** No-ride encounter decayed 65→0.  
**Hardware pause scenario:** Not physically verified, but source indicates pause/coast/device drop can cost capture progress.  
**Expected:** Pause or grace period for normal stop/gear shifts, or clearly communicate that Patience is real time while preserving Zone-2-friendly gameplay.

### SPK-009 · P1 · Automated regression suite is red
**Reproduction:** In isolated checkout of QA branch, \`npm test\`.  
**Observed:** **282 tests / 265 pass / 17 fail**, despite \`npm run build\` success. Assertions inspect architecture that was replaced (inline SVG vs object, original placeholder alignments, previous demo, old fonts/headers).  
**Expected:** Rewrite tests around user-visible behavior and robust DOM geometry; stop asserting outdated source snippets. Require clean tests for merges.  
**Impact:** New regressions cannot be reliably distinguished from expected changes.

### SPK-010 · P2 · Invalid zero-mile route silently preserves old route
**Reproduction:** Fill Distance with \`0\`; press Generate Route.  
**Observed:** The old GPX preview stays 1.0 mi/137 ft while input shows 0, without visible inline feedback.  
**Expected:** Field-level validation and non-destructive “Enter a distance greater than 0” message.

### SPK-011 · P2 · Device settings react with a perceptible delay
**Reproduction:** Select Virtual Shifting and Fixed Target ERG.  
**Observed:** Underlying selector values update immediately, but conditional gear/target panels remain hidden until next ~650ms periodic refresh.  
**Expected:** Call UI refresh directly on select change; timer only as fallback. “— / 24” with no trainer should be explicit “Connect trainer to shift”, not ambiguous.

### SPK-012 · P2 · Homepage messaging contradicts trainer-free play
**Reproduction:** Open production homepage.  
**Observed:** Footer says “SMART TRAINER REQUIRED” although Pedalkin itself allows entering 03 Ride and running an unrecorded Test Ride. Accessibility label describes Pedalkin as a “route studio first draft.”  
**Expected:** Mode-specific requirement / “Trainer needed to record a real ride; optional for gameplay demonstration”, and current accessible name.

## Feature-completeness / product-design gaps (not crash bugs)

### SPK-013 · P1 product gap · Temperaments are labels, not game mechanics
All species still use a common Trust increase formula based on watts, a fixed 65-second Patience window and a **flat 85% capture roll at Trust 100**. The prior seven-personality design (Shy, Calm, Energetic, Playful, Stubborn, Unpredictable, Chaotic) is not connected to gameplay; \`src/creature-collector/encounters.ts\` contains isolated Chaotic calculations only. These shouldn't be described as functional temperament encounters yet. Different individual creatures of the same species have no independent personality/capture histories.

### SPK-014 · P2 product gap · Buddy/companionship is still placeholder
Ride shows a green circle and “COMPANIONSHIP 12”; the Buddy panel names the first captured species but doesn't use a working chosen-companion or companion XP loop. Give a newly caught creature a meaningful next action, make creature art reflect the chosen companion, and show progress.

### SPK-015 · P2 UX · Tests aren't labeled as accelerated; Stats can disagree
The trainer-free simulator advances route distance ~5× real time, but UI says simply “TEST RIDE”. Its Game Stats menu reads native recorded numbers, not the simulated route values, so it may show 0 while the test mode shows kilometers traveled. Either show clearly segregated test stats or hide the native record stats during simulation.

### SPK-016 · P2 UX · No strong onboarding or success/failure celebration
New users see Game Controls but not what Trust/Patience/power do, how to attract creatures, why a catch fails at 100%, or what to do with a captured creature. Win/escape prompt lasts about 3.6 seconds before returning to Explore. Recommend an illustrated first encounter tutorial, “how to befriend” legend, visible temperament + preferred effort, audible/visual catch feedback, and a persistent brief “added to collection” indication.

### SPK-017 · P2 UX · Effort gating can penalize normal Zone 2 behavior
The capture loop requires **>50 W and >35 rpm** before Trust increases, while Patience continues draining. During uphill shifting, low-cadence climbs, coasting, or Bluetooth dropouts, this may unintentionally make captures impossible. Consider tolerances, smoothing, and grace windows. This is a design/code concern, not a proven real-trainer failure.

### SPK-018 · P3 UX · Estimated ride time uses fixed 15 mph
Route preview uses an estimate at 15 mph, irrespective of rider FTP, grade, or planned workout. Label it explicitly as a rough illustrative estimate or use athlete-specific estimates.

## Fixed during QA / production retest — DO NOT reopen
- **Old-SPK-SAVE:** Earlier preview's Save & Close did not navigate. After PR #65 deployed, latest production test from home→Route→Devices→Ride→Save returned to \`route\` with Ride host hidden. **PASS / RESOLVED** for trainer-free state. Real trainer Finish/TCX still requires hardware testing.
- **Old-SPK-PROMPT:** Earlier preview truncated 72-character Explore prompt. Final production shows the complete string; computed SVG text width ~1,198.7px under available 1,212px. **PASS / RESOLVED**.
- **Old-SPK-PROFILE:** Older preview colored columns and scanlines escaped the elevation silhouette. Shared clipping was implemented before final production; code audit confirms both are within same clip. **VISUAL HARDWARE/PHONE REVIEW STILL RECOMMENDED**, but don't classify as reproduced on final build.
- **Old-SPK-DOT:** Earlier sample-point lookup made rider position jump. Later code interpolates the profile height smoothly. **Source fixed; precise live-trainer animation not physically tested**.

## Action plan / release gates
**Before the next gameplay/content expansion:** Fix SPK-001/002/003 (route truth and navigation), SPK-004/005/006 (basic usability), SPK-007/008 (trustworthy encounter conditions), and restore the test suite (SPK-009). Then implement the temperament system and companion consequences on top of a stable ride loop.

**Hardware QA required before declaring 1.0:** Pair Elite Direto XR-T (FTMS), HRM, Zwift Click, generate a hilly route, ride 20–40 min, confirm power/cadence accuracy, uninterrupted route progress during encounters, trainer gradient continuity, no false failure from gear shifts, pause/resume preservation, finish summary, real distance/elevation/TCX, and recovery after Bluetooth loss. These were **not tested** in this automated pass.

**Tested deployment distinction:** The full synthetic ride/GPX negative path was executed on the pre-merge preview ending \`60nyflsem.vercel.app\`; production rechecks for Home, primary CTA, 02 Devices → 03 Ride, Save & Close and complete prompt were executed on \`ridebreakaway.com\` after PR #65. Files not touched in PR #65 retain the behavior reproduced on the earlier preview.

**No game code was changed for this QA report.**
