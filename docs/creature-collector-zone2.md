# Creature collector — Zone 2 first (prototype contract)

This is a **new game**, not a Cycle Quest redesign. It may reuse Ride Breakaway's
FTMS connection, virtual drivetrain, ride physics, and account infrastructure.
Existing Classic, Survival and Cycle Quest behavior must remain unchanged.

## Goal
Make long Zone 2 indoor rides enjoyable via discovery, creature collecting, a
creature journal, companionship and restrained personality challenges. Normal
encounters should be achievable within the rider's selected Zone 2 range.
Avoid prescribed sprint intervals, arbitrary post-challenge capture dice rolls,
or combat/health/attack/defense stats.

## Personalities
Shy, Calm, Energetic, Playful, Stubborn, Unpredictable, plus **Chaotic**.
The first six operate within the selected Zone 2 target range. Adapt to
the workout (especially fixed-wattage ERG sessions), not the other way around.
Use visual / audible cues before power preference changes, forgiving power
windows and brief smoothing/grace periods.

**Chaotic** creatures are exceptional, opt-in near-max short-effort challenges.
Schedule 1–2 opportunities per 50 **lifetime** miles using a persisted player
seed. Schedule across multiple rides, not per route; mark encountered event IDs
as processed, including declined/skipped ones. When opted out, do not interrupt
a Zone 2 session. Calibrate from the player's best actual 10-second power
rather than FTP. Prototype target: 90% of that best for 10 uninterrupted
seconds, with a 40-second patience budget. These figures are tuning targets,
not a training prescription. Users must be able to decline without penalty,
and a hardware ERG controller must never force an unrequested maximal load.

## Route hold and honest distance accounting
The existing Cycle Quest battle hold freezes distance and holds the previous
slope. Do NOT reuse it directly for the collector.

For the collector, track two monotonic, distinct counters:
- **routeMeters**: location along GPX/generated route, paused during encounters;
- **rideMeters**: total *physical/virtual* distance pedaled, including all
  encounter minutes, used for on-screen session distance, milestones, lifetime
  discovery events, and exported TCX/FIT DistanceMeters.

On encounter enter:
1. Snapshot route position and elevation.
2. Pause routeMeters, scenery position and climb/elevation progress.
3. Transition SIM trainer grade to **0%** (smooth ramp, no abrupt load spike);
   for virtual drivetrain, calculate cadence-based virtual resistance at 0%.
   For prescribed target ERG, **keep** the requested watts unchanged.
4. Continue real power/cadence/time/energy and calculate rideMeters from
   actual measured watts with the shared flat-road speed physics. No synthetic
   fixed speed, invented power or distance. Do not use Cycle Quest's
   route-distance freeze as the TCX distance accumulator.

On exit (capture, escape, pause or disconnect):
1. Finish the flat segment's accumulated rideMeters.
2. Restore the exact saved route location; do not jump forward through the
   route or count the flat segment twice.
3. Smoothly restore route resistance and resume normal distance advancement.
4. Continue to record TCX timestamps and rideMeters monotonically, with
   elevation held at the encounter point until route progress resumes.

Keep live file export, route/profile rendering, background telemetry and ride
checkpoint recovery in sync with the separated counters. If the app pauses
or loses BLE, never integrate wall-clock time without valid recent telemetry.

### Integration points for future collector mode
- `src/main.ts`: give the new mode its own route/ride distance state.
- `advanceRide()`: normal route advances *both* routeMeters and rideMeters;
  active encounters call `advanceFlatEncounter` for rideMeters only.
- `simRequestedGrade()` and `setVirtualGearResistance()`: use
  `encounterRoadGrade` while the collector encounter is active.
- `recordRideSample()`, `sessionDistanceMeters()`, `tcx()`, summary,
  ride autosave and overlays: use rideMeters for *ridden* distance, and
  routeMeters for remaining route, ascent, terrain and chapter position.
- Do not change Cycle Quest's existing hold, physics, or save-state schema.

## Why companions progress
No traditional levels or battle XP. A selected companion instead gains
**Companionship** from time spent riding together. This is a friendship
meter, not combat power: unlock animations, journal entries, cosmetics,
small narrative moments and (for selected species) evolution.
Do not create performance-enhancing collection rewards that pressure
players to train harder.

## Validation checklist before connecting the new mode to hardware
- SIM physical cassette and virtual shifting: 0% grade during encounter.
- Fixed ERG target: prescribed watts unaffected.
- Start encounter halfway up a climb; route and elevation freeze, TCX
  ride distance continues increasing, then original grade returns smoothly.
- Finish, fail, pause, disconnect, resume/autosave: no missing or doubled miles.
- Short rides share Chaotic mileage schedule; skipping events and reconnecting
  cannot reroll or repeat rare encounters.
- No unrequested intense efforts during a Zone 2 workout.
- Never alter Cycle Quest, Classic or Survival implicitly.

## Status
This branch contains isolated, tested game-engine primitives only.
**No collector mode UI, mode selection, hardware bridge, TCX integration,
or live encounter has been wired yet.** Those require an intentional
new-mode integration and trainer validation before a preview release.
