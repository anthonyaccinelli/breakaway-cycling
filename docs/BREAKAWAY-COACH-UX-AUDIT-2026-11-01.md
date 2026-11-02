# Breakaway Coach — senior design and first-time cyclist audit (2026-11-01)

## Evidence and scope
Reviewed `src/coach.ts`, `src/coach-engine.ts`, `src/coach-calendar.ts`, `src/coach-dom.ts`, `docs/COACH-CLEANUP.md`, and `tests/coach-usability.test.mjs` on main. These are source-code findings, **not a completed hands-on browser / smart trainer test**. This branch includes a small copy/accessibility pass; no recovery-algorithm changes, production deploy, or Garmin API connection.

## Critical — Must address before claiming personal adaptive coaching

1. **Unknown FTP defaults to 200 W.** `defaultProfile.ftp=200` is applied to beginners and then presented as a concrete target. Change onboarding to ask “Do you know your FTP?” and support an “I don't know” path. Do not prescribe personalized ERG intensity from an unverified default; offer a conservative introductory ride, a guided RPE trial, and an optional ramp/assessment later.
2. **Fatigue model is rule-based, not full adaptive load modeling.** `fatigueSignals()` is triggered by a >=30-minute ride averaging >=80% FTP within 36 hours, or RPE >=9 within 48 hours. `recommendToday()` responds by selecting recovery. This ignores frequency, progression, volume, other sports, sleep, HRV, Body Battery, time-of-day, planned intensity, and individual baseline; the threshold can both miss intermittent hard sessions and mislabel rides. Present adaptation honestly as basic recent-effort adjustments until improved.
3. **Missed / skipped / swapped workflow lacks persistent plan changes.** Schedule is generated from weekday slots; a swap is explicitly local and does not rewrite the week. Introduce a dated plan with durable workout IDs, provenance, versioned changes, reason codes, and reviewable before/after diffs. Avoid doubling sessions after a missed day.
4. **Local storage is fragile.** Explain browser-specific data retention prominently. Add export/backup and later authenticated syncing with conflict handling.
5. **Coach-first workflow needs validation with hardware.** Test smart-trainer BLE permissions, device reconnection, unavailable HRM, ERG onset, mode transitions, power failures, pause/resume, disconnects, changing gears, and interrupted sessions. Do not declare pass based on source alone.

## High priority — first-time user journey

**Goal:** Beginner understands what to do in under five seconds on Today; can get from first visit to demo without owning hardware; no jargon gates.

Proposed onboarding:
- Welcome: “What do you want from cycling?” (get fitter, endurance, ride regularly, race).
- Experience: new / occasionally ride / train regularly; simple descriptions rather than identity.
- Weekly availability: actual days, typical minutes/session, rest day, optional strength time, equipment.
- FTP: know / unsure. Unknown enters **guided** introductory effort, not a 200 W personal prescription.
- Devices: optional setup/check, distinct “No trainer yet — try a demo”.
- Review plan: summarize time budget, expected hard days, first ride and how to change it.
- First completion: ask 1–10 effort and if session was too easy/hard; show what changes (or why nothing changes).

Today hierarchy: readiness (optional and interpretable) -> one recommended ride with duration and plain-language effort -> primary Start/Connect button -> change options -> upcoming 7 days -> metrics. Prefer a single obvious primary action; consider moving calendar below main workout for first-timers.

Navigation: five tabs are understandable but Create Workout is advanced. Consider keeping it in a secondary Tools area or inside “My Week > Add workout”, without hiding it from power users. Clearly label tab destinations and preserve keyboard focus.

Controls: label “Connect trainer” only when connection is required, then “Start workout” once connected; show clear connected/connecting/retry status. Keep ERG/SIM explanation adjacent to toggle. Make “Try without trainer” discoverable on Today, not buried in Setup.

Readability: verify actual computed colors across normal/hover/disabled/focus states, 200% zoom, long labels, light themes, and tooltips; do not rely only on regex source tests. Ensure 44px minimum interactive targets, accessible modal focus, reduced motion, adequate line length and contrast.

## Garmin readiness design — product spec, not yet implemented
Optional morning fields:
- Body Battery at wake (0–100) with measurement time; optional pre-ride value separate.
- Sleep Score (0–100), with date and confidence.
- HRV as raw ms **and** baseline-relative status; raw absolute HRV should not be scored universally.
- “How do you feel?” 3–5-point subjective check-in.
- Ability to skip all data and use the basic ride/history model.

Do **not** add independent weighted points for Body Battery, Sleep Score, and HRV: Garmin Body Battery already incorporates stress/rest-related signals, so independent weighting risks double counting. Use a grouped recovery trend, compare to personal baseline and recent load, then use conservative recommendation policy with override. No medical diagnostic claims or guaranteed performance prediction. Explain inputs and evidence: “Your last two demanding sessions and lower-than-usual recovery suggest keeping today easy”; show exactly what changed (e.g. 60-min tempo -> 40-min endurance), with a one-click undo. If data are missing/stale, show “not enough recovery data” and never fabricate a green status.

Validate correlations and false positives over real user trials; only establish specific green/yellow/red thresholds after baseline calibration. Garmin automatic sync is a separate feasibility/permissions task.

## Adaptive scheduling design
Event log should include planned, started, completed, shortened, skipped, swapped, rescheduled and outside-Plan ride. Map completed activities (including GPX/TCX/FIT where supported) to days by time and deduplicate. Workout variations should keep a parent workout identity and immutable prior version. On each new activity or morning recovery input:
1. reconcile the ride/event ledger, preserving user edits;
2. estimate load, fatigue and available time;
3. suggest minimal changes only when justified;
4. display reason and before/after, with accept/revert;
5. re-check weekly spacing (particularly hard days).

Strength should share training-load logic and not silently overwrite strength plans. Extra off-plan rides should influence future *scheduled* sessions, not merely today's recommended card.

## Test matrix
Run separate journeys for:
1. Brand-new cyclist, no FTP, no hardware, no historical activity;
2. Beginner with one smart trainer, no HRM;
3. Experienced rider with Garmin Fenix/Edge and 8–10 hours/week;
4. New user with 2 short weekly days and designated rest day;
5. User with 2+ concurrent workouts / completed extra rides;
6. Low/unknown/stale Body Battery, Sleep Score, and HRV;
7. DST transition, midnight rollover, browser storage cleared, offline state;
8. Trainer disconnected mid-ERG, stop pedaling, resume, unexpected app refresh;
9. Keyboard-only, screen reader, 200% browser zoom and reduced-motion;
10. An imported structured workout that is drafted but cannot yet be launched.

For each journey record steps, outcome, severity, screenshot, expected behavior, and regression test. **Status: pending browser/hardware execution**, not verified.

## Shipped in this branch
- Beginner first-run guidance and discoverability of trainer-free demo.
- Better explanation of ERG vs SIM trainer settings.
- FTP 200 W clearly identified as a **placeholder, not an individual assessment**.
- Local-only storage and loss-of-data risks called out.

## Suggested delivery sequence
**P0:** unknown-FTP route, hardware connection states, persistent adaptive plan event ledger, honest readiness state.
**P1:** daily optional Garmin check-in and grouped recovery assessment, before/after workout-change UI, imported activity reconciliation.
**P2:** advanced training trends, calibrated personalization, cross-device sync, Garmin integration feasibility and opt-in.
