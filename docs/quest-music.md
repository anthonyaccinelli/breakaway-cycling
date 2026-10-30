# Cycle Quest music

User-supplied Sara Garrard tracks, with browser-ready battle/rest MP3s and an exact ten-second victory WAV:

- **Do or Die {Boss Battle} loop**: loops during all enemy, summit and chapter boss fights.
- **Victory! {Fanfare} loop**: only the original WAV frames from 0.000 through 10.000 seconds are included in `victory-opening-0-10.wav`, with no compression or seek offset. Every playback explicitly starts at zero. Plays for ten seconds after victory, with an 0.8-second crossfade from battle and a gentle fade over the final 1.5 seconds; defeats use Game Over and fleeing is silent; a new battle or inn screen interrupts it.
- **Rest**: loops while the end-of-ride summary is open. The action and summary title read **Rest at Inn**. Closing the summary stops the track.

One music controller lives in the game iframe, including when the overlay is open. It prevents overlapping tracks and cancels stale fanfare timers. Battle music pauses with the game, mute preference is saved on the device, and leaving Cycle Quest silences music. If browser autoplay is blocked, the control displays **Enable Music** for a user gesture. Main iframe delegates autoplay but browser policy still applies. No changes to combat, healing, XP, trainer control or ride completion rules.

Source WAVs were supplied by the user; this implementation does not add or alter music licensing terms.

## Additional soundtrack behavior

- The newly supplied loopable **Do or Die** replaces the earlier battle recording. Each new battle picks a random position in the full track, avoiding positions within eight seconds of the prior start where duration allows. Pause/resume keeps its position; this does not jump randomly during a fight.
- **Take Flight** uses its first ten seconds and plays while the actual ten-second level-up celebration is visible, including queued celebrations after combat/reward screens. It stops when that screen ends.
- **Game Over** plays once after defeat, replacing the victory fanfare. Fleeing is silent. Existing full-health recovery on defeat remains unchanged.
- **Largo** starts in the homepage Cycle Quest selection gesture, continues through beta access, Route and Devices, and stops on entering 03 Ride (also overlay/character). Canceling beta access or leaving the mode stops it. Its device mute setting is shared with the game.
