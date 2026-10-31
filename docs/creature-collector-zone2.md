# Creature collector — Zone 2 first (prototype contract)

This is a **new game**, not a Cycle Quest redesign. Reuse the existing Ride
Breakaway trainer interface, route progression, physics and account
infrastructure without affecting Classic, Survival or Cycle Quest.

## Goal
Make long Zone 2 indoor rides enjoyable through discovery, collecting,
creature personalities, a creature journal and companionship. Capture attempts
should be engaging without requiring physical intensity outside Zone 2,
except for explicitly optional Chaotic encounters.

## Encounters are visual/gameplay overlays only — DO NOT pause or flatten routes
**Revised design decision:** Remove the earlier idea that an encounter would
pause the authored route and override resistance with a flat 0% grade.

- Generated routes and uploaded GPX routes **continue advancing normally**
  during every creature encounter.
- Actual gradient and trainer resistance remain entirely controlled by the
  existing ride engine, regardless of creature appearance, temperament,
  successful capture, escape, or dismissal.
- Never call encounter-specific `setGrade`, override
  `simRequestedGrade` / `setVirtualGearResistance`, enter a Cycle Quest
  battle hold, freeze route progress, or insert flat terrain into the route.
- Speed, distance, elevation, ascent, elapsed time, moving time, history,
  summary and TCX/FIT samples continue using the original ride pipeline.
  Do not add a second distance accumulator for encounters.
- Encounter scoring may **read** the usual smoothed watt telemetry. It must
  never alter resistance, trainer mode, shift state, route simulation or
  recording behavior. Appearance and dismissal should be seamless.
- Mid-climb, mid-descent, virtual shifting, natural cadence changes and short
  resistance/power spikes must be handled through generous windows, smoothing
  and brief penalty grace periods. A change of terrain alone should never
  cause an immediate capture failure.
- A training workout in ERG mode must retain its prescribed power. Creatures
  adjust to the workout rather than altering the workout to suit the creature.
- The player remains free to maintain their intended Zone 2 effort and ride
  uninterrupted even if they ignore an encounter.

## Personalities
Shy, Calm, Energetic, Playful, Stubborn, Unpredictable, plus **Chaotic**.
The first six operate within the rider's selected Zone 2 power envelope;
challenge is about observation, relaxed consistency and forgiving behaviors,
not sprints or sudden resistance changes.
Unpredictable personality changes should have clear cues and transition
periods. Avoid punitive raw-watts thresholds that ignore terrain or drift.

**Chaotic** creatures are exceptionally rare and fully optional near-max
effort encounters. Schedule 1–2 appearance opportunities per 50 **lifetime**
miles, deterministically using a persisted player seed, across multiple
rides. Mark each attempted or skipped event ID as processed to avoid repeats
after reconnect/recovery. An opt-out or declined encounter has no penalty.
Calibrate against actual best ten-second power (FTP is insufficient):
prototype target 90% of recorded ten-second best, held for ten seconds,
with 40 seconds of patience. Tune after real rider feedback.
The rider decides whether to exert themself: software must never force a
maximal trainer load or change the resistance for a Chaotic encounter.
If an ERG workout prevents such an effort, allow a no-penalty skip.

## Companion progression
No combat levels, health, attack or defense. Companions earn
**Companionship** while riding together, unlocking new behaviors, animations,
journal stories, cosmetic rewards and species-specific evolution.
Progression should encourage consistency and time in the saddle without
pressuring riders toward high intensity.

## Integration and regression validation before a playable preview
- During a capture on a steep climb, route distance, current grade,
  physical resistance and ascent must follow the *same* path as a ride with
  no encounter at all.
- The same invariant holds for a descent, a sudden virtual shift, a GPX
  route, an endless generated route and a fixed ERG workout.
- Starting/ending/escaping encounters must not alter TCX/FIT samples,
  route checkpoints, odometer or session summary.
- Momentary terrain, power and shifting variations do not immediately
  invalidate a normal creature capture.
- Short rides share a persistent Chaotic schedule without rerolling skipped
  or already processed encounters.
- Only deliberate opt-in riders receive Chaotic near-max capture prompts.
- Classic, Survival and Cycle Quest remain unchanged.

## Status
This branch contains isolated creature-collector personality and Chaotic
encounter primitives, plus tests. **No new game mode, creature capture UI,
hardware bridge or live encounter system is wired yet.**
Flat encounter physics, resistance overrides and route-pausing code were
removed from the prototype after the design revision.
