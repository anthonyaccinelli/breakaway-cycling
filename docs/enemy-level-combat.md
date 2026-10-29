# Enemy-level combat

Combat version 2 replaces rider/FTP scaling. `combat.js` owns encounter levels, HP, attack, XP, groups, bosses and combat resolution. `monsters.js` contains authored species bases and content-placement tiers; it no longer contains tabletop HP, attack bonuses, damage or CR calculations.

## Rules

- Enemy HP = round(species base HP × 1.08^(enemy level − 1)).
- Enemy attack = round(species base attack × 1.06^(enemy level − 1), 2), measured in player HP/sec.
- Enemy XP = 150 + 25 × (enemy level − 1).
- Chapter 1: mileage bands 0/25/50/75 unlock ceilings 5/10/14/18. Floor 1; boss level 18 and reward 1,725 XP.
- Chapter 2: ceilings 18/22/26/30. Floor 12; boss level 30 and reward 2,625 XP.
- Later chapters extend the authored chapter schedule by 12 levels. Their uncurated species fallback uses content tiers, never rider level. Levels are bounded at 1,000 for numerical stability.
- Eight distinct biome species per curated chapter, plus the independent 10% Headwind roll per enemy slot. Canonical Rat ID is `rat`.
- Each group member draws its own level from the unlocked chapter band. HP and XP sum across members. Incoming attack sums living members, dropping immediately on defeat. The whole encounter must be won for bonus XP; health/coin choices still grant 25 per member.
- Chapter bosses have fixed identities selected deterministically by chapter and fixed chapter levels. Boss HP uses a fixed 27,000 HP baseline, species health ratio and own-level growth. Boss attack uses 65% of the own-level HP benchmark over 180 seconds, adjusted by authored species attack ratio. These are design constants, not measured rider performance.
- Summit variants have permanent own levels: max(8, species tier), plus 10 for Extreme or 20 for Psycho; Lifted Dually starts at 12. Their fixed HP baseline is 13,500 with own-level growth; attack targets 40% of the own-level HP benchmark over 60 seconds. Chapter progression gates eligible identities/variants. Climb category is metadata and no longer multiplies combat stats or XP. Summit XP is three times enemy XP at its own level.
- No battle time limits. Actual watts and the existing player attack stat determine outgoing damage. Reaching 1 HP is a loss, including a simultaneous kill.

## Compatibility and deletion

`combat-save.js` is the sole migration boundary. Retired `giant-rat` IDs are converted in battles and shuffle bags; the duplicate species entry is removed. Legacy battles are rebuilt once using the new rules, preserving per-enemy damage fractions and known boss identities. Completed/pending rewards and character progression are untouched. Unreadable saves remain protected by the existing export/autosave block.

Removed: recent-power samples, 125% entry-power targeting, FTP ceiling control, rider-level enemy creation, flat group XP, tabletop creature-factor calculations, and the separate summit-category multiplier module. Protected assets and generated autoplay files use the same manifest.

## Verification

Production build and 73 tests cover own-level invariance across rider telemetry, chapter-band boundaries, all catalogue species, all 36 summit variants, mixed-level HP/XP sums, exact within-tick kills, death ties, no timeout, one-time save migration, pending rewards and existing trainer/resistance behavior.

`node scripts/simulate-quest-balance.mjs` runs deterministic balance smoke simulations after building. Simplifications: constant 15 mph, no summits, coins after wins, ten-second reward holds; no extra level-up hold. At 150 W, three seeds reached chapter 1's boss at rider level 19; chapter 2's boss at levels 29–30, with one chapter 2 loss. This is a design smoke check, not a claim that every rider will win.
