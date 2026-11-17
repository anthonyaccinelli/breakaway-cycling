# Cycle Quest: how the game works

Cycle Quest is the RPG mode of Ride Breakaway. It runs in a same-origin iframe served
through the beta-password endpoint `api/cycle-quest.js`. Code lives in `cycle-quest/`.

## Core loop

Ride ten fixed 100-mile chapters (Adventure) or any route (Freeroam). Pedaling earns
1 XP per second. Every 2.5–4 minutes of riding (the first within 60–90 s of a ride, `BALANCE.encounterGap` and `firstEncounter`) a random encounter of 1–3 enemies starts; summit
bosses wait at the top of categorized climbs; a chapter boss waits at mile 100.
Random encounters are "ride until they die". Summit and chapter bosses fight in phases (below).

During a battle, reward choice, level-up or boss warmup, the trainer rides a **flat road**
and the route position waits; the rider resumes exactly where the battle began, so chapter
miles only count route riding. The real distance pedaled during battles is still counted
by the ride **odometer** (`rideOdometer` in `src/main.ts`), which the ride summary, saved
history, TCX file and Strava/Garmin uploads use, so uploads never lose battle miles.
Random encounters wait while the road descends more steeply than −3%
(`BALANCE.steepestEncounterDescent`); summit and chapter bosses keep their places.

## Damage: effort, not watts

`damage/sec = attack × (watts ÷ FTP) × (1 + crit)`, where crit is the share above FTP
(110% FTP → +10%, 200% FTP → +100%). Riders with different FTPs deal the same damage at the
same effort. Attack comes from rider level and bike parts. See `combat.js` → `riderDamagePerSecond`.

## Ride display (HUD)

The 03 Ride page is a big-number display (`ride-hud.js`,
`ride-hud.css`) sized to read from about 6 feet on a 13" laptop. It is one 1440×900 stage
that scales to fit the window, so nothing reflows or clips.

* **Road** (exploring): power with % FTP and gear, heart rate with coins, level with an XP
  bar, chapter miles and progress, the elevation profile with grade and miles to the boss,
  HP and stamina bars, then time, distance, ascent, cadence and speed.
* **Cockpit** (encounters, boss fights, rewards, level-ups, boss warmup): power and heart
  rate tiles, HP and stamina bars, a prompt band (damage, or the boss phase with its
  countdown and brace target) and the enemy cards with time. Reward and warmup buttons
  appear in the same place.
* **Before the ride** the Road view shows START RIDE over the road (RESUME RIDE when paused,
  CONNECT TRAINER without one). It is optional: pedaling for 3 seconds also starts the ride
  (the game sends `arm`, START RIDE sends `start` to the app).
* **MENU** shows the classic screen; the "Ride display" toolbar button, or starting the
  next ride, brings the display back.

## Boss fights

Bosses fight in minutes-long phases (`BOSS_FIGHT` in `combat.js`), so riders ease in and
out of efforts instead of snapping between 400 W and 140 W. Trainer resistance never changes.

| Phase | Length | What the rider does | What happens |
|---|---|---|---|
| Attack | 2.5 min | Ride however you like | Normal damage both ways |
| Wind-up | last 15 s of attack | Ease down | Countdown and sound cue |
| Brace | 60 s (chapter boss 75/60/45 s) | Hold at or under 75% FTP | Rider deals no damage; the boss's steady attack stops and one big hit (120 s of its attack) lands at the end. A full brace blocks 75% of it and heals 5% max HP. The first 5 s are grace for trainer lag. |
| Counter | 40 s | Push | Double damage if at least half the brace was held; boss attacks at half strength |
| Enrage | chapter boss after 3 braces | Finish it | No more braces; boss attacks at 1.5× |

A summit boss repeats attack/brace/counter. Stopping pedaling for 15 s still rides away,
except during a brace (coasting through a brace never flees). A chapter boss's big hit grows
25% each round. At a matched level, a summit fight lasts about 5–9 minutes and a chapter
boss about 11–19 minutes. Riders who ignore braces usually lose the chapter boss.

## Stamina

Stamina (`stamina.js`) is the reserve for riding above FTP, modeled on W′. It drains
whenever effort is above FTP, in battles and on climbs alike, at 1.25% per second for each
100% of FTP above threshold (150% FTP empties a full bar in about 2.7 minutes). It refills
at 0.6% per second at or below 75% FTP and holds steady between 75% and 100%. Below 25%
the rider is **exhausted** and deals 40% less damage (`staminaDamageMultiplier`). Riders
who stay under FTP never lose any, so casual riders are unaffected. Stamina starts full each
ride. It shows as a bar under the route on the full screen and in the overlay's right column,
under HP.

## FTP (rider profile)

Cycle Quest keeps its own FTP in the character save (`rider-profile.js`), separate from
Ride Breakaway's settings. Three ways to set it: type it in; estimate it from weight ×
rider type (1.5 / 2.0 / 2.7 / 3.5 W/kg); or accept the post-ride offer when 95% of the
best 20 minutes is higher than the current FTP. Until set, the game uses 200 W.

## Difficulty and progression

* Adventure: fixed difficulty per chapter. Enemy levels start at `1 + 4.5 × (chapter − 1)`
  and rise 1 level every 25 miles; the chapter boss is at the top of the range. Rider level
  is never an input there, so out-leveling a chapter makes it easier.
* Freeroam, "Scaled to me" (the default): enemies come in at the rider's level minus 0–2
  (`BALANCE.scaledLevelsBelow`), drawn from the highest chapter reached; summit bosses use
  the rider's level. XP and coins grow with enemy level, so rewards keep pace. XP and levels
  count; chapter miles and bosses do not.
* Freeroam, a chosen chapter: that chapter's fixed levels, for going back and feeling the
  power creep.
* Enemy HP grows 8% per level (same as rider attack); enemy attack grows 6% per level
  (same as rider HP). Equal-level fights feel the same in every chapter.
* XP per level: 5,000 + 300 per level (about one level per hour of riding).
* All tuning numbers are in `combat.js` → `BALANCE` and `progression.js`.
* `npm run simulate:quest` plays all ten chapters with the real rules for casual,
  typical and strong riders. `tests/cycle-quest-balance.test.mjs` fails if any of them
  cannot finish, so run the tests after any tuning change.

## Rosters

`chapters.js`: each chapter introduces 8 D&D SRD 5.1 monsters; from Chapter 2 on, 4 of the
previous chapter's new monsters carry over (12 per chapter). Each chapter has a fixed boss.
They were picked at random within each chapter's challenge band, and you can edit them freely.
Summit bosses come from a fixed list of 12 (`SUMMIT_BOSSES`). No monster artwork for now.

## Rewards and healing

* A win gives XP, then one choice for 10 seconds: heal 35% of max HP per enemy, or coins
  (scaled by enemy level). Keep pedaling for coins; stop pedaling for 2 s to heal; the
  − / + keys or trainer buttons confirm. Defaults to coins.
* Level-ups fully heal.
* Pedaling between fights heals 1.5% of max HP per minute, 3% at ≤55% FTP.
* Random encounters wait until HP is back to 20%.
* A loss gives no XP, drops 10% of coins and leaves the rider at 50% HP.
* Summit bosses are optional: stop pedaling for 15 s to ride away.
* Constants: `rewards.js` → `HEALING`, `HEAL_PERCENT_PER_ENEMY`.

## Bike shop

Four slots (Frame and Seat add HP, Pedals and Wheels add attack). Grades unlock by
chapter (+10% each); upgrades add +2.5% each, capped by rider level (max 50) and cost
100 × (tier + 1) coins. See `bike-parts.js`.

## Saves

* Character: `localStorage['cycle-quest-character-v1']`, saved about every 10 s while
  riding and on every important event.
* Ride and workout history: `localStorage['cycle-quest-history-v1']`, written at most
  once a minute (always on ride end and page close).
* Export/Import save includes both.
* Old saves migrate on load (`save-state.js` → `readCharacter`, `combat-save.js`).

## Cloud saves (save codes)

A rider turns on cloud save and gets a private 12-character code (no account needed).
The game uploads the character and history at most every 2 minutes while riding and
soon after important events; another device loads it by code. Conflicts (two devices)
are detected and the rider chooses which save to keep. The server stores only a SHA-256
hash of the code.

Setup, once:
1. Run `database/cycle-quest-cloud-saves.sql` in the Supabase SQL editor.
2. In Vercel project settings → Environment Variables, add `SUPABASE_URL` (the project
   URL) and `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → service_role).
   The service role key must stay server-side; never prefix it with `VITE_`.
3. Redeploy. Until then the Cloud save dialog says cloud saves are not set up.

## Performance notes

Screen writes are skipped when values have not changed, and the elevation profile SVG
is rebuilt only when the route window, size, rider marker or overlays change.

## Autoplay demo

`public/cq-autoplay/` is a password-free autoplay preview. Only `index.html` and
`autoplay.js` are hand-written; everything else is generated from `cycle-quest/` by
`scripts/build-quest-demo.mjs` during `npm run build` and `npm test`, and is git-ignored.
Note: the demo serves the full game code without the beta password.

## Development

* `npm run format:quest` / `npm run lint:quest`: Prettier for Cycle Quest code.
* `npm test`: all tests (Cycle Quest tests are `tests/cycle-quest*.test.mjs`).
