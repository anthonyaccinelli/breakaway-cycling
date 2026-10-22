# Breakaway Cycling v3.4.2 — Chrome + Overlay

This is the browser-based build of v3.4.2, **not** a macOS DMG.

1. Quit any installed Breakaway Cycling application and any prior local trainer server.
2. Install Node.js from https://nodejs.org/ if necessary.
3. On macOS, double-click `Start GPX Trainer with Overlay.command`. If blocked, right-click > Open, or run `chmod +x` on the launcher.
4. Open Chrome at http://127.0.0.1:5173 if it does not open automatically.
5. Connect your trainer using Chrome's Bluetooth chooser.
6. In Elevation Profile, use Always on top to open the helper overlay.

The Electron helper listens on localhost port 5174; it is **not** the main app.
Ride files and Strava helper behavior retain the original local paths and configuration.
This package restores the v3.4 browser helper while retaining v3.4.2 frontend and overlay-follow changes. Physical trainer and Mac tests are still required.
