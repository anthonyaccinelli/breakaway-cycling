# Cycle Quest workout rewards

Use **Add workout** for completed activity imports; **Upload GPX** remains a route-planning tool and does not award XP.

## Outdoor cycling

- FIT and TCX activity files, up to 8 MB, processed in the browser.
- One XP per moving second, including coasting. Elapsed/timer duration is never silently substituted for moving duration.
- Prefer a FIT session's recorded total moving time. Otherwise derive an estimate from speed/distance samples, using movement above 0.3 m/s, honoring FIT timer-stop events and excluding sample gaps over 120 seconds. TCX uses timestamped trackpoints. The review allows correcting moving time to the value displayed by Garmin or Strava.
- Optional adventure mileage advances only the current chapter, stopping at 100 miles. All moving-time XP still counts. Imports cannot defeat a boss, unlock another chapter or award encounter XP.
- Explicit indoor/virtual FIT cycling activities are rejected as outdoor imports.

## Strength

- FIT active weighted sets: stored kg × repetitions, converted to lb. Rest sets and missing/bodyweight-only weights are excluded; review explains missing values.
- If weights are missing, enter the total volume from the recorded workout manually. A separate manual logging flow accepts lb × reps or kg × reps and workout date/time/duration.
- One XP per 10 lb; round down per workout. Maximum 3,600 strength XP per local calendar day, allocated to the activity's start date. The cap combines FIT and manual claims.
- Strength grants no chapter mileage.

## Claims and persistence

Review the activity and reward, then explicitly claim. Claimed XP and the activity ledger save together in the character's local save. Quota/storage failures leave both unchanged. A character changed in another browser tab requires reloading before further changes.

Deduplication checks exact file fingerprints, matching activity start times and strong time overlaps within cycling/strength families. This also catches equivalent FIT and TCX exports and manual/file versions of a lifting session. Local Ride Breakaway history and active indoor sessions block re-crediting recorded indoor rides. It is local duplicate protection for a personal game, not server-side anti-cheat or cross-device synchronization.

Only activity summaries and reward history are retained; source files and GPS samples are not uploaded or stored. Exporting/importing the character save includes its workout ledger. The ledger supports up to 5,000 entries.

## Development and verification

`npm run build` bundles the MIT-licensed FIT parser and browser dependencies with their licenses, and regenerates the isolated autoplay demo from the same game/import code. The official Garmin FIT SDK is a development-only fixture encoder; it is not bundled into the browser app.

`node --test tests/cycle-quest*.test.mjs` covers valid/corrupt FIT, coasting and stops, timer events, TCX, kg conversion, set selection, daily caps, duplicate exports, boss gates, and the existing game regressions. Synthetic FIT fixtures were verified in the browser through review, claim, level-up, repeat-upload rejection and manual lifting rewards. A real user Garmin strength export still needs validation because device fields and edited-set exports can vary.

Automatic Strava/Garmin account sync is a later phase. No accounts, tokens, backend workout database or API subscriptions are introduced by this change.
