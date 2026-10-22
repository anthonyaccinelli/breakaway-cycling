# Breakaway Cycling — live-only Direto XR-T

## Start

```sh
npm install
npm run dev
```

Use desktop Chrome/Edge at the local Vite URL. Import an elevation-bearing GPX file, connect your Elite Direto XR-T over FTMS, wait for actual power/cadence telemetry, then start the ride. The ride cannot start without a connected trainer and granted FTMS control. No demo power/cadence inputs are available.

## Notes

- The route progresses using **measured** trainer watts and an approximate power-balance road-speed calculation, not actual road GPS speed.
- GPX hills are sent to the trainer using FTMS Indoor Bike Simulation Parameters. Actual trainer support and response require hardware testing.
- Heart rate uses standard Bluetooth Heart Rate Service.
- Original Zwift Click remains **experimental**: requires independently verified BLE UUIDs and button protocol. Packet learning may fail with encrypted or changing packets. Gear shifting is not guaranteed to physically affect resistance.
- The optional experimental ERG mode approximates virtual shifting with target-power commands; it is not Zwift virtual shifting.
- Stop pedaling if resistance behaves unexpectedly. Close other apps connected to the trainer.


## Click packet decoder (v0.6)
Confirmed from user logs: `37 08 00 10 01` = plus pressed, `37 08 01 10 01` = both released. Expected minus pressed: `37 08 01 10 00` (not yet verified on user hardware). `19 10 5d` is ignored by the button decoder. Shift occurs only on transition to pressed. In SIM mode gears remain display-only; experimental ERG mode sends physical target power commands.

## v0.7 gear strength
ERG-mode virtual gear target watts are now 150% of the prior calculated targets (1.5x), capped at 550 W. SIM-mode gear changes remain display-only. This is not a real drivetrain gear-ratio simulation.

## v0.8 — ERG cap update
Removed the previous 550 W software cap on experimental virtual gear targets. The value is bounded only by the signed 16-bit FTMS target-power field (32767 W); actual trainer firmware may reject or limit requested power. No guarantee of safe or achievable output. Start in a low gear and stop if resistance becomes excessive. GPX SIM mode is unchanged.

## Imperial units (v1.0)
The dashboard displays miles, mph, and feet. Rider and bike weight inputs are pounds. GPX data and physics stay in SI internally; grade remains a percentage and trainer power remains watts. All Bluetooth and Zwift Click logic is unchanged.


## Elevation profile overlay (v1.1)
Click **Float overlay** to show a draggable, resizable elevation profile over the dashboard. Click **Dock** or **×** to hide it. Click **Pop out window** for a separate, resizable browser window (allow pop-ups). Both views update as the route progresses. No Bluetooth behavior or trainer resistance code was changed.


## v1.2 macOS always-on-top dashboard

Use **Start GPX Trainer with Overlay.command** to start Chrome and a separate Electron always-on-top window. The overlay shows route elevation, power, cadence, HR, speed, distance, grade, elevation and virtual gear. It polls a local-only HTTP bridge on port 5174. No data is sent to the internet. True full-screen DRM video may still hide the overlay.

## v1.3 bridge fix
The overlay telemetry server now allows both localhost:5173 and 127.0.0.1:5173 origins. Start using Start GPX Trainer with Overlay.command; use http://127.0.0.1:5173/ in Chrome. If the overlay waits, confirm the app is open and inspect ~/Library/Application Support/GPXVirtualTrainer/overlay.log.

## Floating overlay transparency (v1.7)
In the Always on Top overlay, drag the **Opacity** slider in the title bar from 25% (most transparent) to 100% (opaque). The setting is remembered on this Mac. This changes the entire Electron overlay window, not the video behind it.

## v1.8 — SIM virtual shifting test build

- Zwift Click and dashboard gear changes now modify FTMS SIM resistance by translating 7% virtual gear ratio steps to an **equivalent gradient offset**. This is an approximation, not a physically exact drivetrain or Zwift shifting.
- Commands are paced at approximately 750 ms and target grade changes are ramped at about 1 percentage point per second; actual trainer response may differ.
- A **300 W soft test governor** uses measured power to reduce commanded grade above 300 W. **It cannot guarantee a 300 W ceiling**, especially during transients, steep grades, or trainer firmware behavior.
- The grade command is clamped to +/-12%; original experimental ERG mode is unchanged and remains uncapped/unsafe for testing. Avoid ERG mode.
- Test gently in a low gear with a short, nearly flat GPX route. Keep an emergency stop within reach, and stop pedaling if resistance is unexpectedly high. Hardware behavior has not been verified.

## v1.9 — Ride recording, auto-start and unified shutdown

- Load a GPX route, connect your FTMS trainer, and pedal at 35+ rpm and 15+ watts for roughly 1.2 seconds to start recording automatically. The Start button still works.
- Press **Finish & save** to end and save a ride, or **Download TCX for Garmin** to download a TCX file. Import the TCX manually in Garmin Connect's web interface (Import Data). This is not automatic Garmin syncing.
- With the Electron helper running, ride files are saved in `~/Documents/Breakaway Cycling/Rides/` on finish, route completion, reset, or trainer disconnection. Download TCX works without the helper.
- Press **Save & quit app** to save and shut down the overlay and the dedicated Vite server. Closing the main browser tab sends best-effort save/shutdown requests. Browser refreshes may also trigger shutdown. Closing only the floating overlay hides it; it does not close the ride.
- Only the app's dedicated server process, recorded by the launcher, is stopped; Chrome itself remains open for other tabs.
- Activity trackpoints contain modeled route distance/elevation/speed, plus measured trainer power/cadence and Bluetooth HR when available. No GPS position is fabricated. Garmin may display the activity as an indoor ride without a map.
- A sudden power loss, browser crash, or macOS force-quit can prevent the final file from saving. Use Finish & save or Download TCX before quitting when possible.
- Ride start/stop and shutdown need testing on your Mac. Never rely on software shutdown as an emergency resistance release.


## Strava auto sync
See STRAVA-SETUP.txt. Client ID 289114, callback http://localhost:5174/strava/callback. Ride files are saved locally before asynchronous Strava uploads.

## v2.5 Procedural Routes (based on working v2.3)

The Generate a route section offers a positive-mileage fixed-distance route, a one-click endless route, and a randomized Surprise Me endless route. Terrain uses a deterministic seed, four presets and three difficulties. The application generates 5-mile chunks ahead of the rider and discards old points to keep memory bounded. For endless rides, Remaining reads infinity; Finish & save stops and records the actual ride. Generated routes contain fictional elevation, not GPS coordinates. The app still requires the original macOS Node/Electron launcher; this is NOT the cross-platform desktop project.


## v2.6 — Grouped ride workspace

The Route & trainer, Generate a route, Elevation profile, and Ride dashboard sections now appear together in a single Ride workspace, in that order. All original element IDs and functionality remain unchanged. The floating overlay stays outside the workspace to preserve fixed positioning.

## v2.7 — Manual elevation editor
Before starting a ride, load a GPX route or generate a procedural route, then select **Edit elevation** above the elevation graph. Drag up to add climbing or down to add descending. A smooth localized adjustment modifies the underlying route elevation and recomputes grades used for trainer resistance. **Undo** reverts the last drag; **Reset edits** restores the original profile. Finish editing before starting the ride. Changes are in memory for this session, not written back to the original GPX file. For endless terrain, editing applies to the currently generated terrain window; future segments continue procedurally.


## v2.8 profile inspector
Drag the yellow vertical line horizontally to inspect route mileage, elevation, cumulative gain, cumulative loss, and gradient. The displayed Elevation (ft) dashboard metric follows the inspector while Edit elevation is enabled. Use Follow rider to return the inspection cursor to live ride position. Editing a route updates the inspection totals; moving the inspection cursor does not move the rider or change resistance.


## v2.9 Total elevation gain
Optional total elevation gain in feet for fixed-distance generated routes. Grade scaling is limited to ±12%. The dashboard displays full-route ascent for imported GPX and estimated ascent for fixed generated routes. For endless routes it displays ascent in the retained terrain window only.

## v3.0 — Persistent endless-ride climbing counter

Endless rides now retain cumulative elevation gain and loss when old procedural terrain points are discarded. The Ride dashboard Total Elevation Gain reports **climbing actually ridden**, not the five-mile look-ahead or the retained graph window. The yellow route inspector includes accumulated ascent and descent from discarded terrain as well. Counters reset when a new route is loaded or generated. This persistence is **within the active route session**, including route-window pruning; it does not restore an interrupted ride after browser refresh, app crash, or restart.

## v3.1 elevation profile zoom
Full route is the default view for imported GPX and normal-length fixed generated routes. Zoom in/out with a minimum 5-mile viewport. Endless routes display the currently retained/generated terrain; historical segments evicted to preserve memory cannot be reconstructed in this build. Extremely long generated fixed routes (>250,000 samples) preview the generated portion, not the entire planned distance.


### v3.2 Surprise Me targets
Check **Surprise Me: use my distance and elevation gain targets** to randomize terrain/difficulty/seed while generating a fixed-length route with the requested climbing (if feasible under the 12% grade cap). Leave unchecked to retain one-click endless surprise rides. Elevation gain may differ slightly because the generator uses discretized terrain points.

## v3.3 — Elevation profile route totals
The elevation profile header displays total route mileage and total elevation gain (feet) together, even while zoomed in. Imported GPX and fully generated fixed-distance routes use actual profile ascent, including elevation edits. Very long fixed-distance routes not fully materialized use an estimated ascent until generated. Endless routes report generated mileage and cumulative ascent over generated terrain, rather than claiming a finite route total.

## v3.4 — Endless route lifetime elevation overview

The **Entire route** elevation view includes a compressed record of earlier terrain, even after full-resolution route points are discarded. Zoom In narrows the view to a minimum 5-mile window, centered on the rider or yellow inspection marker. The inspector reads archived elevation and cumulative gain/loss. The high-resolution active terrain still drives trainer resistance. Historical points are compacted as the ride grows to limit memory usage; very old hills will appear less detailed. The archive lasts for the current app session only.
