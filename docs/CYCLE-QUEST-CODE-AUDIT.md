# Cycle Quest code audit

This branch combines the pending fullscreen and earned-reward changes with the
cleanup below. It is a preview; main is unchanged.

## Scope

Reviewed the authored Cycle Quest gameplay, combat, progression, rewards, save
handling, routes/GPX parsing, elevation profiles, character/devices UI, workout
imports, overlay, summary capture, protected asset endpoint and preview builder.
Also reviewed the Cycle Quest message bridge and trainer hold logic in main.ts.
Generated FIT/capture libraries and the monster data catalogue were not rewritten.

## Bugs corrected

- An expired random-encounter countdown could become negative, making the app
  reject its own save on reload. Countdown updates now clamp at zero, and the
  reader repairs that known legacy case.
- Invalid saved characters could silently fall back to a new character and be
  overwritten by autosave. The original bytes are now preserved, autosave and
  gameplay are blocked, and Export save retains the original data. A valid backup
  can be imported to recover.
- Autosave now checks for a newer character written by another tab before writing,
  rather than relying only on the asynchronous storage event.
- Imported save validation now checks battle/group health, names, levels, rewards,
  routes and session data. Rendered battle/boss names are HTML-escaped.
- Character import is blocked during an unfinished ride and synchronizes the
  imported route with the host instead of mixing old route telemetry with a new
  character. Missing legacy routes receive a default route.
- Disconnected telemetry no longer advances battle damage or riding XP. Parent
  notice messages are now shown instead of being ignored.
- The bestiary now uses current encounter calculations instead of the obsolete
  short-fight HP/attack formula.
- Main/overlay time formatting now agrees at minute/hour boundaries. Reward buttons
  in the overlay retain their nodes while their countdown is updated.
- TCX imports use trackpoint distance when lap distance totals are absent. FIT/TCX
  maxima use reductions rather than argument spreading on large record arrays.
- Failed summary image capture now offers a working retry. Malformed highlight
  collections no longer crash the gallery.
- Character Status now hides the ride panel correctly despite shared layout rules,
  and rider W/kg uses actual FTP/weight rather than a hardcoded example.
- Unknown asset names cannot match inherited object properties in the allowlist.

## Redundancy removed

- Consolidated the inline game styling into game.css in its original cascade order;
  removed six obsolete preview-only rules and unused hidden telemetry controls.
- Shared one protected-asset manifest between the endpoint and autoplay builder.
  The workout build generates decoder/capture bundles; only the demo builder copies
  browser assets, removing duplicate copy code and dependency lists.
- Shared summit category scaling, reward-button markup, text escaping, time
  formatting and reward keyboard handling between their previous call sites.
- Split readout rendering and encounter-panel rendering out of the large render
  function.
- Replaced repeated preview creature/group setup with one demo scene handler.
  Preview-only source hooks now fail the build if their insertion point changes.
- Removed unused encounter/summit variables, a no-op DOM query, duplicate route
  footer updates and the obsolete broad summit-selection branch. The dedicated
  twelve-boss/three-variant roster remains in use.

## Verification

Production build and the full automated suite are run for this branch. New
regressions cover legacy save recovery, malformed state, stale-tab writes, summit
rules, rendering helpers, asset completeness, protected allowlisting and TCX
distance fallback. Existing combat, reward, progression, route, workout, fullscreen
and trainer-controller tests remain included.

Browser verification checks Route, Ride, three-enemy victory rewards, Status,
Overlay and save persistence using autoplay. The beta-authenticated live trainer
session and actual resistance feel still require a physical trainer test; autoplay
and controller tests cannot establish hardware behavior.

## Existing design boundary

The existing 10,000,000 XP save/import limit remains. This cleanup does not
change progression balance or raise that limit; truly unlimited progression
needs a separate numerical-scaling decision. The new invalid-save protection
prevents an out-of-range save from being silently replaced.
