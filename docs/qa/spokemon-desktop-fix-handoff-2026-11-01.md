# Spokemon Desktop QA Fix Handoff — November 1, 2026

## User instruction and scope
User asked to fix all identified Spokemon problems. Explicitly **ignore mobile**: this is a desktop application. Preserve uploaded 1920×1080 Explore and Encounter SVGs precisely; do not replace them with generic HTML or redesigned art. Use the existing GitHub repository anthonyaccinelli/breakaway-cycling, Vercel project prj_BYFZotpHvwKRgICup52ciMGBaLAM. Only merge to main after approval of this preview.

Branch: `fix/spokemon-desktop-qa-sweep-2026-11-01`
Original QA report: `docs/qa/spokemon-senior-designer-playtest-2026-11-01.md` on branch `qa/spokemon-playtest-2026-11-01`.
Original approved graphic baseline: `docs/spokemon-exact-svg-baseline-2026-11-01.md`.

## Fixed on this branch
1. **SPK-001 / Route CTA:** 01 Route main CTA now opens **02 Devices**, not 03 Ride. Explicit 03 Ride navigation shortcut remains.
2. **SPK-002 / GPX truth:** route engine emits `spokemon:route-state` after import; on-screen distance/elevation fields sync to real GPX stats. Inline import status displays filename. A user selecting new manual values switches to draft.
3. **SPK-003 / Endless:** Preview stats display infinity, "next X mi" chunk, and "No finish line"; input fields sync to the currently previewed chunk and status says Endless.
4. **SPK-006 / Desktop navigation:** 01 / 02 / 03 / 04 tabs visible in desktop Ride outside original Illustrator artboards. Navigation while a native recorded ride is running prompts to save first.
5. **SPK-007 / Pre-ride encounter:** Find Spokemon button disabled and encounter handler gated until trainer ride or Test Ride is actually running.
6. **SPK-008 / Pause and coasting:** Pausing freezes trust/patience; six-second shifting/coasting grace; no forced trainer gradient alterations.
7. **SPK-009 / Tests:** replaced stale V2/demo-specific assertions with current behavior/invariants; all tests green. Added focused temperament distribution/effort tests.
8. **SPK-010 / Validation:** Invalid zero/negative distance and invalid gain rejected with inline feedback; old route not silently overwritten.
9. **SPK-011 / Settings:** Virtual gear and Target ERG panels refresh immediately on selection.
10. **SPK-012 / Homepage:** corrected "smart trainer required" claim and outdated accessible name.
11. **SPK-013 / Temperaments:** seven individual temperaments (Shy, Calm, Energetic, Playful, Stubborn, Unpredictable, Chaotic). Capture rate depends on current watts/FTP and temperament; Chaotic is ~1.8% of encounters and requires continuous ≥90% FTP for 10 sec (rare event, optional effort). **100% Trust now guarantees capture**; the only failed encounter is when Patience expires before full Trust. This corrects the unfair post-100% random roll (previously 30% failure for Chaotic).
12. **SPK-014 / Buddy:** stored chosen companion, selection menu, XP from moving pedal time, level display, temporary selected-species pixel sprite in the original companion viewport. Collection stores individual-capture temperament metadata while preserving backward compatibility with legacy species-count records.
13. **SPK-015 / Sim stats:** Stats draws from current test or native ride frame, clearly labels test as NOT RECORDED; Game Controls explains 5× accelerated mode.
14. **SPK-016 / Onboarding/feedback:** in-game How to Play covers ride, Trust, Patience, guaranteed capture at 100%, temperaments, pause, Buddy and rare Chaotic. Capture/escape message stays 6.5 sec, with distinct success/failure text.
15. **SPK-017 / Zone 2 grace:** effort bands centered on sustainable cycling; short coasts/gear shifts protected.
16. **SPK-018 / Time assumption:** time-estimate tooltip explicitly describes fixed 15-mph planning assumption.

## Verified browser scenarios
Desktop 1440×900 Chromium browser test on prior branch tip:
- invalid 0 mi -> inline error;
- new 16-mile route generates;
- Endless stats show ∞ with 5-mile preview chunk, form set to 5;
- 1.0-mile GPX with 246-ft gain -> correct matching form, stats and file status;
- Route main CTA -> setup;
- choosing Virtual and Target mode -> panels immediately visible;
- 02 Devices -> 03 Ride;
- 03 Ride tabs computed visible;
- Find Spokemon disabled without active session;
- Test Ride -> natural/manual encounter with Shy/Mossprout;
- pausing preserves Patience exactly;
- capture adds temperament metadata to persistent collection;
- Buddy menu shows selected Mossprout, level and XP;
- Save & Close returns to Route;
- no page JS errors.
Final additional browser test:
- predefined captured Hootwig appeared as selected Buddy pixel art;
- How to Play displayed eight guidance steps;
- Buddy chooser rendered and had accurate level/XP;
- visible 02 Devices tab opened setup;
- no page JS errors.
Historical QA: a forced Elderoot/Chaotic reached 100% Trust but failed a random roll, which the user identified as unfair. The random post-100% roll was removed on the current branch. Reaching full Trust must capture; otherwise Patience expiry allows an escape. Pause/real power/real FTMS still requires physical trainer confirmation.

## Tests / release state
On tested code before final tooltip/update: `npm run build` success, `npx tsc --noEmit` success, `npm test` **269 passed, zero failed**.
After final tooltip copy/update rerun those gates and require latest-sha READY Vercel preview. The source code is on branch; **main remains unchanged** until user approves.
Desktop-only scope: do not spend time on phone portrait layout or responsive mobile hit targets.

## Still requiring real hardware
Cannot validate real Elite Direto XR-T FTMS pairing and virtual gears, Bluetooth loss/reconnect, Zwift Click V2, HRM, gradient under sustained captures, recording, elevation gain, actual elapsed ride and TCX export without user's hardware. Do not claim those have been tested in Chromium. Also actual full workout length needs real rider validation.

## Regression risks to monitor
- GPX/Endless fields are synchronized to the native source; manual edits turn route state to draft.
- Original Explore/Encounter SVG master files are never mutated.
- Test Ride telemetry is isolated from native recording.
- Buddy collection currently localStorage on current device (no cross-device sync).
- Running during an encounter is protected from UI navigation without finishing a real recorded session.
- The initial testimonial/flow is desktop-first; leave mobile unchanged per explicit user preference.

## Capture-rule correction (November 1, 2026)
The user confirmed that **100% Trust is a guaranteed capture**, including Chaotic Spokemon. A failed encounter occurs only when the creature's Patience reaches zero before Trust reaches 100%. The UI floors displayed Trust to avoid showing “100%” at 99.5%. The original SVG masters remain untouched. The former chanceAtFullTrust helper and random capture roll have been removed; test cases assert this behavior. Do not reintroduce random failure after full Trust.
