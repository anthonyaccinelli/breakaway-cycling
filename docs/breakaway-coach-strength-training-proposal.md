# Breakaway Coach — Strength Training Integration (product proposal)

**Status:** Proposed feature; no application implementation or production release.
**Repository branch:** `feat/breakaway-coach-rideable-preview`
**Scope:** Coach is accessible from Classic; Survival and Cycle Quest remain free-play game modes. Ride data from all modes may inform training load without interfering with gameplay.

## Product principle

One coaching plan should allocate **cycling + off-bike strength + recovery** across the user's real availability. Equipment limits are a first-class planning constraint. Riders should not have to choose a strength workout from a library: Coach recommends one and explains why; swapping is optional.

## Profile / equipment inventory

Required: primary cycling goal; experience with resistance training (new/intermediate/experienced); preferred days, total weekly time or separate cycling/strength time budget; preferred rest day; whether to include strength training; preferred 1/2/3 weekly sessions (Coach offers conservative defaults).

Equipment checklist, multi-select:
- Bodyweight / floor space (baseline)
- Dumbbells (fixed/adjustable), optionally record available min/max or each pair
- Kettlebells, optionally record weights
- Resistance bands, optionally record strengths
- Bench (independent of rack/barbell)
- Squat rack + barbell, and available plates/load
- Pull-up bar, stable step/box, cables/machines (optional future)
- Available workout space, time/session (15, 20, 30, 45, 60 minutes)

Optional: mobility limitations, exercise exclusions and replacement preferences; do not diagnose injury. Riders may change equipment per session (home/travel/gym).

## Exercise catalog and selection

Tag each exercise by movement pattern (squat, hinge, unilateral, horizontal/vertical push, pull, trunk stability, calf/ankle), required equipment, technique level, prescribed loading unit, progression type, substitution IDs, and contraindication flags requiring rider choice.

Example mapping (not a claim of biomechanical equivalence):

| Pattern | Bodyweight | Dumbbells | Kettlebells | Rack & barbell |
|---|---|---|---|---|
| Squat / knee-dominant | Tempo squat, split squat | Goblet squat, split squat | KB goblet squat | Back squat, front squat (technique dependent) |
| Hinge | Hip bridge, single-leg bridge | DB Romanian deadlift | KB deadlift | Barbell Romanian deadlift |
| Single-leg | Reverse lunge | DB split squat | KB reverse lunge | Weighted split squat with appropriate setup |
| Push | Incline/floor push-up | DB floor press, overhead press | KB floor press | Bench press only if bench is available |
| Pull | Prone back raise / Y-T-W (not equivalent to loaded row) | One-arm DB row | KB row | Barbell row |
| Trunk | Dead bug, side plank | Suitcase carry | Suitcase carry | Side plank / carries if suitable |

A bodyweight-only program must not mislabel light accessory work as a heavy loaded pull; explain capability limitations.

## Weekly integrated scheduler

1. Compute candidate cycling sessions from current Coach goal, training days, schedule and recent history.
2. Allocate strength within total time budget, not on top of full cycling hours without consent.
3. Usually propose 1-2 sessions/week for cyclists; beginners may start lighter/shorter. Add more only if their goals, tolerance and time allow.
4. Avoid stacking demanding lower-body strength immediately before key intervals, races, or long rides. When stacking on one day is necessary, present timing choices, preserve meaningful recovery, and expose the tradeoff.
5. Respect rest days and do not automatically schedule two leg-intensive sessions back to back.
6. Read completed Breakaway rides across modes; use observed session duration/power and subjective fatigue, without fabricating training stress when metrics are absent.
7. If fatigue is high, modify/skip heavy lifting or replace with gentle mobility; never force it.
8. Strength sessions appear on the same weekly schedule as rides, can share days, and can be rescheduled.
9. A session's movement patterns and progression should be deterministic and explainable; any AI layer can help describe adjustments but should not invent unsupported exercise prescriptions.

## Strength session player (no trainer required)

- In Coach, rename Today's Ride to **Today** or **Today's Training** when mixed workouts are enabled.
- Card: Strength A / Strength B, estimated time, goal and why it was selected, required equipment.
- Session walkthrough: warm-up, exercises, sets, reps/repetition range, weight or RPE/RIR, rest intervals, alternatives, instructions and form cues.
- Interactions: complete set; log reps/load/RPE; substitute exercise; decrease/increase difficulty; shorten or skip.
- Avoid using FTP for weight prescription. Use experience, logged loads, rep quality and perceived exertion to establish conservative starting loads.
- Progress by rep ranges/load when successfully completed, with deloads/recovery consideration; no uncontrolled automatic increases.
- All progress stays local in preview unless rider explicitly opts into data sync in a future release.

## Proposed settings and UI

Rider Settings: Strength Training switch, equipment multi-select + weights, strength experience, weekly frequency, session duration/time budget.
Training Plan: integrated color/icon-coded Cycling / Strength / Recovery sessions, including on same day when appropriate.
Today: coach-recommended card for all planned workouts, including standalone strength without BLE trainer.
Ride History: eventually expand to Training History; show exercise session logs separately from cycling power, with an honest combined training-duration view.

## Implementation roadmap

### Phase 1: preview MVP
Equipment intake, exercise catalog & substitutions, two strength templates (full-body A/B), schedule allocation, strength day UI, completion logs. Must not alter Survival / Cycle Quest gameplay or publish to main.

### Phase 2: smart progression
Individual load/reps/RPE tracking, automatic but conservative progression, exercise preference/exclusion, fatigue-aware schedule changes, flexible calendars and travel equipment changes.

### Phase 3: advanced
Training period blocks matching cycling race season, personal strength trends, exercise video/cues, support for explicitly authorized additional health/training sources, more nuanced workload and readiness modeling.

## Important safeguards / acceptance criteria

- Bodyweight-only rider can complete a viable session without a gym.
- Rack exercises are never offered without required associated equipment (e.g., bench needed for bench press).
- Strength is optional, not silently added above the user's available training hours.
- Coach accounts for hard recent game rides without changing Survival / Cycle Quest.
- Rest days and rider fatigue are respected; a missed session does not lead to forced catch-up.
- Strength session can start from Coach without trainer pairing.
- The session offers manual exercise substitution and does not demand maximal testing.
- No ungrounded FTP-to-strength-load conversion, medical promises, or compulsory all-out sets.
- Production remains unchanged pending explicit approval.

## Evidence references reviewed October 29, 2026

- ACSM 2026 Resistance Training Prescription position stand, https://pubmed.ncbi.nlm.nih.gov/41843416/
- 2025 systematic review and meta-analysis of heavy strength training in endurance cyclists, https://pubmed.ncbi.nlm.nih.gov/40632222/
- October 2026 cycling-specific resistance training review, https://pubmed.ncbi.nlm.nih.gov/42828469/
- Concurrent resistance and endurance exercise meta-analysis, https://pmc.ncbi.nlm.nih.gov/articles/PMC8053170/

**Not implemented. This document preserves the next feature specification for the Coach preview branch.**
