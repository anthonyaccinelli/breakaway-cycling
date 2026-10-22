# Breakaway Cycling v3.4.3 Web — Zwift Click idle keepalive

- Original Zwift Click RC1 activation (`RideOn`) is refreshed every 15 seconds while its Bluetooth GATT connection remains active.
- Keepalive stops when the Click disconnects, is manually disconnected, or a new Click is selected.
- Writes are serialized to avoid overlapping keepalive commands.
- Disconnect status explains how to wake and reconnect the Click.
- No changes to Direto trainer control, route simulation, or overlay.

**Note:** This is a best-effort fix for idle timeout. It cannot prevent all Bluetooth radio drops, macOS sleep, or battery-related disconnections. Keep the Chrome tab and Mac awake during the test.

## Run
Extract ZIP and double-click `Start GPX Trainer with Overlay.command`. Connect your Click, then leave it untouched for 5–10 minutes during a ride and try shifting again. If it still disconnects, record the status text and whether Chrome reports the Click as disconnected.
