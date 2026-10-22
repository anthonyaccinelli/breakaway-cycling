# Breakaway Cycling v409 — Ride Recovery & Autosave

- Automatically checkpoints active rides every 5 seconds, on page hide, and on navigation away.
- Saves route geometry and generated-route configuration, progress, timing, calories, power aggregates, and recorded telemetry samples locally in the browser.
- On reload, offers Recover ride or Discard saved ride. Restored rides are paused and require a trainer reconnection before resuming.
- If the trainer disconnects, pauses and saves the ride rather than automatically ending it.
- Finished rides retain a recoverable summary until the existing local IndexedDB archive completes successfully.
- Autosave errors are reported without interrupting the ride. No Bluetooth secrets are stored.

Recovery is local to the same browser/profile/device and can be unavailable in private browsing or when browser storage is cleared/full. V408 UI and ride summary remain unchanged.
