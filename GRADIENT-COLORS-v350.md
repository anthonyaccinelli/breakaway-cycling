# Breakaway Cycling v3.5.0 — Grade-colored elevation overlay

The single always-on-top elevation profile uses colored vertical segments based on the slope between neighboring terrain samples:

- Green: grade <= 6% (including descents)
- Orange: 6% < grade <= 12%
- Red: 12% < grade <= 18%
- Purple: grade > 18%

The 6% automatic climb zoom and existing full-route / endless-route logic are unchanged. The rider marker stays yellow. Colors are estimated at 240 horizontal samples of the displayed window, so very short grade changes may be averaged out on long routes.

Launch with `Start GPX Trainer with Overlay.command` as before.
