# Breakaway Cycling v3.4.2 — Overlay rider follow fix

The floating overlay previously positioned its yellow rider marker using whole-route percentage, even when the profile displayed a zoomed section. Endless routes forced that percentage to zero, pinning the marker at the left edge.

The overlay now receives a separately rendered, rider-centered elevation chart with a marker position calculated from the same displayed bounds. The main window’s yellow route inspector can still be dragged independently.

## Build on Mac

Run `Build Breakaway Cycling DMG.command` from this extracted folder. Quit the old installed app before replacing it with the new DMG. Test with a short route, then zoom to five miles and watch the marker follow the rider. Also test Endless Route.

This source patch is not hardware-tested. Existing Bluetooth and Strava limitations still apply.
