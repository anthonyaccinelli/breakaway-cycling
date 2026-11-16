// Cycle Quest balance check: plays all ten chapters with the real game rules for three
// kinds of riders and prints one row per chapter. Run: npm run simulate:quest
// Exits non-zero if any rider cannot finish, so tuning mistakes are caught before release.
// The rider model: steady effort with small wobbles, a reward policy of "heal below 60% HP,
// otherwise coins", and a chapter-boss retry after riding Freeroam for an hour on a loss.
import { loadQuestModule } from '../tests/quest-loader.mjs';

const progression = await loadQuestModule('progression.js');
const combat = await loadQuestModule('combat.js');
const rewards = await loadQuestModule('rewards.js');
const { CHAPTER_COUNT } = await loadQuestModule('chapters.js');
const stamina = await loadQuestModule('stamina.js');

export const RIDERS = {
  casual: { label: 'Casual (62% FTP, 14 mph)', effort: 0.62, mph: 14 },
  typical: { label: 'Typical (75% FTP, 17 mph)', effort: 0.75, mph: 17 },
  strong: { label: 'Strong (88% FTP, 21 mph)', effort: 0.88, mph: 21 },
  // Rides easy between fights, then attacks every battle with 1-minute surges at 125% FTP
  // and 1-minute recoveries at 60%. Exercises the stamina bar and the exhausted penalty.
  intervals: {
    label: 'Intervals (65% FTP riding, 125%/60% surges in battle, 16 mph)',
    effort: 0.65,
    mph: 16,
    battleEffort: t => (Math.floor(t / 60) % 2 === 0 ? 1.25 : 0.6)
  }
};
const FTP = 250; // any value works: damage depends only on effort

export function simulate(rider, { seed = 7, chapters = CHAPTER_COUNT } = {}) {
  let rng = seed;
  const random = () => (rng = (rng * 16807) % 2147483647) / 2147483647;
  const s = {
    xp: 0,
    coins: 0,
    hp: progression.baseMaxHP(1),
    stamina: stamina.STAMINA.max,
    chapterEncounter: null
  };
  const level = () => progression.levelFromXP(s.xp);
  const maxHP = () => progression.baseMaxHP(level());
  const award = xp => {
    const before = level();
    s.xp += xp;
    if (level() > before) s.hp = maxHP(); // level-ups fully heal
  };
  const watts = (effort = rider.effort) => FTP * effort * (0.9 + 0.2 * random());
  let exhaustedSeconds = 0;
  function fight(battle) {
    let seconds = 0;
    for (;;) {
      const w = watts(rider.battleEffort ? rider.battleEffort(seconds) : rider.effort);
      s.stamina = stamina.advanceStamina(s.stamina, w / FTP, 1);
      if (stamina.isExhausted(s.stamina)) exhaustedSeconds++;
      const damage =
        combat.riderDamagePerSecond(progression.baseAttack(level()), w, FTP) *
        stamina.staminaDamageMultiplier(s.stamina);
      const out =
        battle.kind === 'enemy'
          ? combat.advanceBattle(battle, s.hp, damage, 1)
          : combat.advanceBossBattle(battle, s.hp, damage, 1, { watts: w, cadence: 85 });
      battle = out.battle;
      s.hp = out.hp;
      award(1);
      seconds++;
      if (out.outcome) return { won: out.outcome === 'win', seconds, battle };
    }
  }
  function settle(result, battle) {
    if (result.won) {
      const reward = rewards.battleRewards(battle);
      award(reward.xp);
      if (s.hp < 0.6 * maxHP())
        s.hp = Math.min(maxHP(), s.hp + Math.round((maxHP() * reward.healPercent) / 100));
      else s.coins += reward.coins;
    } else {
      s.coins -= Math.floor((s.coins * rewards.HEALING.lossCoinPercent) / 100);
      s.hp = Math.round((maxHP() * rewards.HEALING.lossHPPercent) / 100);
    }
  }
  const rows = [];
  for (let chapter = 1; chapter <= chapters; chapter++) {
    exhaustedSeconds = 0;
    let miles = 0,
      seconds = 0,
      next = 240 + random() * 180,
      wins = 0,
      losses = 0,
      fightSeconds = 0,
      lowHP = 0;
    const startLevel = level(),
      startCoins = s.coins;
    while (miles < 100) {
      seconds++;
      miles += rider.mph / 3600;
      award(1);
      s.stamina = stamina.advanceStamina(s.stamina, rider.effort, 1);
      s.hp = Math.min(maxHP(), s.hp + rewards.regenPerSecond(maxHP(), rider.effort));
      if (--next > 0) continue;
      if (s.hp < (maxHP() * rewards.HEALING.encounterMinPercent) / 100) {
        next = 30;
        lowHP += 30;
        continue;
      }
      next = 240 + random() * 180;
      const roll = random(),
        count = roll < 0.1 ? 3 : roll < 0.3 ? 2 : 1,
        fights = [];
      for (let i = 0; i < count; i++) {
        const pick = combat.nextChapterEncounter(chapter, s.chapterEncounter, random);
        s.chapterEncounter = pick.state;
        fights.push(
          combat.makeBattle('enemy', {
            chapter,
            level: combat.encounterLevel(chapter, miles, random),
            monsterId: pick.monsterId
          })
        );
      }
      const group = combat.enemyGroup(fights),
        result = fight(group);
      fightSeconds += result.seconds;
      seconds += result.seconds;
      result.won ? wins++ : losses++;
      settle(result, group);
    }
    let attempts = 0,
      beaten = false;
    while (!beaten && attempts < 6) {
      attempts++;
      const recover = Math.max(0, (0.9 * maxHP() - s.hp) / rewards.regenPerSecond(maxHP(), rider.effort));
      seconds += recover;
      award(Math.round(recover));
      s.hp = Math.max(s.hp, 0.9 * maxHP());
      const boss = combat.makeBattle('boss', { chapter }),
        result = fight(boss);
      seconds += result.seconds;
      settle(result, boss);
      beaten = result.won;
      if (!beaten) {
        seconds += 3600;
        award(3600 * 1.5);
      } // an hour of Freeroam grinding
    }
    rows.push({
      chapter,
      hours: +(seconds / 3600).toFixed(1),
      level: startLevel + '→' + level(),
      enemyLevels: combat.chapterLevels(chapter, 0).min + '–' + combat.chapterLevels(chapter, 99).max,
      bossLevel: combat.chapterLevels(chapter).boss,
      winRate: Math.round((100 * wins) / Math.max(1, wins + losses)) + '%',
      avgFight: Math.round(fightSeconds / Math.max(1, wins + losses)) + 's',
      lowHPMinutes: Math.round(lowHP / 60),
      coins: s.coins - startCoins,
      exhaustedMin: Math.round(exhaustedSeconds / 60),
      bossTries: beaten ? attempts : 'FAILED'
    });
    if (!beaten) break;
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let failed = false;
  for (const [id, rider] of Object.entries(RIDERS)) {
    const rows = simulate(rider);
    console.log('\n' + rider.label);
    console.table(rows);
    if (rows.length < CHAPTER_COUNT || rows.some(r => r.bossTries === 'FAILED')) {
      failed = true;
      console.error(id + ' rider could not finish');
    }
  }
  process.exit(failed ? 1 : 0);
}
