# Spokemon / Pedalkin — Development Handoff
_Last updated: 2026-11-02. Repository: `anthonyaccinelli/breakaway-cycling`._

> **Read this at the beginning of every Spokemon development session.** This document records user-approved design intentions and reported behavior. It is **not** proof that every feature is implemented, merged, deployed, or working. Compare against the current source, tests, main branch, and live browser before reporting status.

## Identity, objectives, and boundaries
- Working name **Spokemon** (also previously **Pedalkin**). Browser-based creature-collecting mode in Ride Breakaway, separate from Classic, Survival, Cycle Quest, and Breakaway Coach.
- Primary design objective: make longer, mostly Zone-2 indoor cycling enjoyable, approachable, and low-stress. No conventional monster combat.
- Core loop: pedal to explore a procedurally generated route, encounter a creature, meet its riding/cadence challenge, build **Trust** to 100%, and recruit it as a buddy. Capture is not universally guaranteed; distinguish legitimate failure *before* completion from a bug after reaching 100% Trust.
- Rare **Chaotic** temperament may require a short near-max effort, with an intended frequency around 1–2 encounters per 50 miles. Most encounters should not require sprints.

## Screens and approved visual direction
- 01 Route, 02 Devices, 03 Ride navigation; **01 and 02 must remain clickable from 03** when appropriate.
- The supplied **Explore** and **Encounter** SVGs are the authoritative pixel-for-pixel layout references. Do not take creative liberties when implementing those screens. Reacquire the original assets if unavailable in the repository; this document cannot substitute for their exact geometry.
- Universal **Minecraft** font across screens 01–03 and overlay (source file previously supplied by user; verify file licensing and presence).
- 1990s handheld creature-collector pixel aesthetic, Pacific Northwest pixelated forest background. Ensure the actual background renders in both Explore and Encounter. Prior preview showed a missing background.
- Creature illustration within Encounter: **460 × 370 px** target area, with no visible temporary white bounding rectangle.
- Ride Explore and Encounter are two states of the same 03 screen. Encounter-specific Trust/Patience elements disappear on Explore.
- Explore top-right metrics: **distance traveled, elevation gained, time elapsed**, matching the user-approved compact boxed screenshot style (same box dimensions as Encounter counterparts). The three metrics must remain visible and update.
- All units in the ride UI should use US/imperial conventions where applicable (miles, mph, feet); replace calories readout with virtual gear.
- Readout values (power, HR, cadence, speed, grade, etc.) shift visually from green `#6aad38` toward red `#f45853` as magnitude rises; confirm accessible contrast and sane metric-specific ranges.
- Elevation coloring: downhill `#9eca96`; nonnegative grades use the supplied four-color palette, which must be recovered from the actual SVG/art assets rather than guessed.
- Overlay launch button must function from Ride; full-screen option requested. Preserve consistent screen style.

## Route generator (01)
- Reuse the overall Classic/Survival/Cycle Quest layout but change primary dark teal to `#0f292f` (replacing `#074ce0`).
- Terrain, Distance, Total Elevation share one row; Route Seed below with **one** lock icon/button at right.
- Remove Difficulty field and duplicate Upload GPX field.
- Generate Route, Surprise Me, Endless, Recovery, Rolling, Climb aligned with consistent sizes and no overlap. Check for route lock/checkmark collision.
- Route preview adopts the user-provided Spokemon design.
- While encountering a creature, **normal route geometry and trainer resistance continue**; do not flatten the route automatically. Small grade/gear changes must not auto-fail an encounter.

## Encounter rules — design decisions and QA invariants
- Dialogue displays creature temperament explicitly, e.g. **“A SHY Dear appeared!”**, plus actionable requirement beneath, e.g. **“Stay steady 148–178 W to earn its trust!”**. That watt range is an *example*, not a universal threshold.
- Temperament must actually change the riding requirement; changing only the label is a bug. Specify and test different target windows, pace tolerance, progression behavior, and failure conditions for each temperament.
- **Trust** progresses from 0 to 100%. At **100% the encounter must result in capture/recruitment**, not an unexplained wander-away. On success, update collection, buddy selection, companion artwork and UI consistently; avoid duplicate rewards and stale state.
- **Patience** is a separate indicator governing opportunity/escape before full Trust. Both bars must remain inside their user-designed border bounding boxes; clearly communicate why an encounter failed.
- Temperament and Trust/Patience values need to be visible at the correct stage and accessible from encounter UI.
- Companion earns XP by pedaling, using the Cycle Quest continuous riding XP approach; prominent XP/level-up feedback and progression bar. The **green XP bar lives in the lower-right companion/buddy box**, not the top center, using the SVG's bar border.
- Capture/selection must immediately populate the companion/Buddy Art slot; a placeholder green circle or unclickable buddy is a bug.
- Encounter animation/visual assets must be the original approved artwork where supplied, not arbitrary replacement art.
- First biome creature artwork/names approved: **Dear, Bob Moss, Hedgie** (left-to-right from user art). These replace three preexisting entries; verify image paths and catalog entries in source before claiming live.

## Device detection and cadence-only support — current requested work
- Support cyclists with **Bluetooth speed + cadence sensors and no smart trainer resistance/power data**.
- Offer the appropriate input/goal mode after detection: **power (watts)** for compatible measured-power devices and **cadence (rpm)** for speed/cadence-only setups.
- Do not require FTMS/resistance or invented watts to play cadence mode; keep supported BLE connection paths separate from trainer control. Auto-detection and a visible manual override/fallback are recommended.
- Cadence requirements must be meaningful and temperament-dependent. Display clearly labeled `rpm` targets instead of watt targets for cadence-only riders.
- User requested a **working web-browser play test demonstrating the menu choice** before production deployment. **Verify whether implemented; do not assume this request shipped.** Test sensors, denied Bluetooth permissions, missing power, reconnects, and device switching.
- A browser cannot guarantee discovery without user-granted Bluetooth permissions; capability detection should gracefully degrade.

## Reported bugs / regression checklist
1. Top-right Explore stats missing or stale.
2. PNW/background artwork missing after a preview deploy.
3. Temperament not displayed or different temperaments producing identical pedaling demands.
4. Some encounters wandered away **after 100% Trust**.
5. Overlay button on Ride not opening the overlay.
6. 01 Route / 02 Devices buttons nonfunctional from Ride.
7. Calories displayed instead of gear, or metric units inappropriately used.
8. Captured buddy not populating creature window; buddy card not clickable.
9. Trust and Patience windows persisting in Explore.
10. Companion leveling and XP feedback too subtle or absent.
11. Cadence-only device choice/play test incomplete or not verified.

**Status rule:** A user report of a bug is not evidence it remains unfixed today. For every issue record commit, reproduction, fix, test result, and preview/main deployment before marking complete.

## Safe development workflow
1. Inspect the latest `main` commit, relevant mode files, branches/PRs, and deployment state. Documentation may be ahead of or behind code.
2. Before editing, locate the real Explore/Encounter SVGs, Minecraft font, PNW background, creature assets, and BLE/FTMS abstractions. Do not silently substitute placeholders for user-provided assets.
3. Keep Spokemon changes isolated from Classic, Survival, Cycle Quest, and Coach unless shared-code changes are explicitly necessary; regression test shared routes, controls, ride stats, and BLE.
4. Develop on a focused branch; run unit tests/typecheck/build, then browser-interaction tests. Report checks actually performed, not imagined.
5. Publish preview for review; only promote to `main` on user approval. Provide actual preview link and commit/PR details.
6. Update **this file** as part of approved changes: decisions, exact file paths, reproducible bugs, tests, preview URL, branch/commit, and verified production status.

## Known open documentation gaps
- Exact Explore and Encounter SVG asset paths and pixel dimensions (except Encounter creature art target).
- Canonical four-color positive grade palette and any per-temperament timing/target formula.
- Full authoritative first-biome creature roster and image assignments.
- Actual frontend source files defining mode routes/state, XP progression, capture, BLE sensors, and overlay.
- Current test coverage, deployment IDs, and whether the Nov 2 cadence-mode preview shipped.

## Starting a new chat
Use: **“Continue Spokemon development in `anthonyaccinelli/breakaway-cycling`. Read `SPOKEMON_DEVELOPMENT.md` on main first; inspect the latest code and deployment. Tell me what is verified vs. still planned, then implement [specific request] on a preview branch.”**

Related projects should maintain separate handoffs: `BREAKAWAY_COACH_DEVELOPMENT.md`, `CLASSIC_DEVELOPMENT.md`, `SURVIVAL_DEVELOPMENT.md`, `CYCLE_QUEST_DEVELOPMENT.md`. Do not copy Spokemon assumptions into other modes.
