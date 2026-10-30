# Cycle Quest music

User-supplied Sara Garrard tracks, converted from WAV to 128 kbps MP3 for browser delivery:

- **Do or Die {Boss Battle} loop**: loops during all enemy, summit and chapter boss fights.
- **Victory! {Fanfare} loop**: only the opening five seconds are included. Plays when any battle ends (including loss or fleeing, per the request for each battle ending); a new battle or inn screen interrupts it.
- **Rest**: loops while the end-of-ride summary is open. The action and summary title read **Rest at Inn**. Closing the summary stops the track.

One music controller lives in the game iframe, including when the overlay is open. It prevents overlapping tracks and cancels stale fanfare timers. Battle music pauses with the game, mute preference is saved on the device, and leaving Cycle Quest silences music. If browser autoplay is blocked, the control displays **Enable Music** for a user gesture. Main iframe delegates autoplay but browser policy still applies. No changes to combat, healing, XP, trainer control or ride completion rules.

Source WAVs were supplied by the user; this implementation does not add or alter music licensing terms.
