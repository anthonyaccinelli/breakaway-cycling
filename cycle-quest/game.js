import {
  slots,
  catalog,
  grades,
  unlockedGrade,
  riderLevel,
  partBonus,
  bikeFor,
  multiplier,
  partPrice,
  changePart,
  exploreRoadside,
  GRADE_BONUS,
  UPGRADE_BONUS,
  SLOT_STATS,
  staminaEfficiency
} from '/api/cycle-quest?asset=bike-parts.js';
import { createQuestMusic } from '/api/cycle-quest?asset=music.js';
import { readCharacter } from '/api/cycle-quest?asset=save-state.js';
import {
  MAX_XP,
  levelCost,
  xpForLevel,
  levelFromXP,
  baseMaxHP,
  baseAttack
} from '/api/cycle-quest?asset=progression.js';
import { escapeHTML as safeText, formatClock, rewardButtons } from '/api/cycle-quest?asset=ui-utils.js';
import {
  battleRewards,
  sessionMetrics,
  HEALING,
  regenPerSecond,
  SMART_HEAL_BELOW
} from '/api/cycle-quest?asset=rewards.js';
import { mountQuestBaseline } from '/api/cycle-quest?asset=shared-ui.js';
import { createRewardGesture } from '/api/cycle-quest?asset=reward-gesture.js';
import {
  generateRoute,
  parseGPX,
  sample,
  grade,
  routeSummits,
  METERS_PER_MILE
} from '/api/cycle-quest?asset=routes.js';
import { CHAPTER_COUNT, chapterInfo, chapterRoute } from '/api/cycle-quest?asset=chapters.js';
import {
  riderFTP,
  suggestedFTP,
  createPowerWindow,
  mountRiderProfile
} from '/api/cycle-quest?asset=rider-profile.js';
import {
  makeBattle,
  enemyGroup,
  encounterLevel,
  chapterLevels,
  chapterBossLevel,
  chapterMonsters,
  riderDamagePerSecond,
  encounterAllowedOnGrade,
  effortShare,
  critBonus,
  BALANCE,
  nextChapterEncounter,
  advanceBattle,
  advanceBossBattle,
  scaledEncounterLevel,
  encounterDelay,
  bossPhase,
  BOSS_FIGHT
} from '/api/cycle-quest?asset=combat.js';
import { elevationSVG } from '/api/cycle-quest?asset=profile.js';
import { createLevelUpQueue, levelUpMarkup } from '/api/cycle-quest?asset=level-up.js';
import { initWorkoutUI } from '/api/cycle-quest?asset=workout-ui.js';
import { createCloudSave } from '/api/cycle-quest?asset=cloud-save.js';
import {
  STAMINA,
  advanceStamina,
  isExhausted,
  staminaDamageMultiplier
} from '/api/cycle-quest?asset=stamina.js';
import { creditWorkout, dayAt, validLedger } from '/api/cycle-quest?asset=workouts.js';
import { mountRideHud } from '/api/cycle-quest?asset=ride-hud.js';
let questBaseline = null;
const root = document.getElementById('cq-preview'),
  $ = s => root.querySelector(s),
  all = s => root.querySelectorAll(s),
  key = 'cycle-quest-character-v1';
const setStat = (name, value, html = false) =>
  all('[data-stat="' + name + '"]').forEach(el => (html ? setHTML(el, value) : setText(el, value)));
// DOM writes are skipped when nothing changed, which keeps busy rides light on hardware.
function setHTML(el, html) {
  if (!el || el._cqHTML === html) return;
  el.innerHTML = html;
  el._cqHTML = html;
}
function setText(el, text) {
  if (el && el.textContent !== String(text)) el.textContent = text;
}
$('.cq-route').append($('.cq-event'));
const rewardGesture = createRewardGesture();
const musicButton = document.createElement('button');
musicButton.id = 'quest-music';
musicButton.type = 'button';
$('#quest-finish').after(musicButton);
let sentMusicEnabled = null;
function updateMusicButton(state) {
  if (sentMusicEnabled !== state.enabled) {
    sentMusicEnabled = state.enabled;
    window.parent.postMessage(
      { source: 'cycle-quest', type: 'music-setting', enabled: state.enabled },
      location.origin
    );
  }
  musicButton.textContent = !state.enabled ? 'Music: Off' : state.blocked ? 'Enable Music' : 'Music: On';
  musicButton.setAttribute(
    'aria-label',
    state.blocked
      ? 'Enable Cycle Quest music'
      : state.enabled
        ? 'Mute Cycle Quest music'
        : 'Turn on Cycle Quest music'
  );
  musicButton.setAttribute('aria-pressed', String(state.enabled));
  const routeControl = root.querySelector('#quest-route-music');
  if (routeControl) {
    routeControl.textContent = musicButton.textContent;
    routeControl.setAttribute('aria-pressed', String(state.enabled));
  }
}
const music = createQuestMusic({ onChange: updateMusicButton });
updateMusicButton(music.state());
musicButton.onclick = () => music.toggle();
root.addEventListener(
  'pointerdown',
  event => {
    if (!event.target.closest('#quest-music,#quest-route-music')) music.resume();
  },
  { capture: true }
);
root.addEventListener(
  'keydown',
  event => {
    if (!event.target.closest('#quest-music,#quest-route-music')) music.resume();
  },
  { capture: true }
);

let rewardChoice = null,
  warmupSeconds = 0;
let persistedSave = null,
  externalSaveChanged = false,
  invalidStoredSave = false;
const fresh = () => ({
  workouts: [],
  version: 1,
  xp: 0,
  hp: 100,
  coins: 0,
  pendingReward: null,
  miles: 0,
  chapter: 1,
  mode: 'adventure',
  rideSeconds: 0,
  rideMiles: 0,
  nextEncounter: 260,
  battle: null,
  reward: false,
  boss: null
});
const levelUps = createLevelUpQueue();
let levelUp = null;
function displayedPower() {
  return Number.isFinite(live.displayPower) ? Math.round(Math.max(0, live.displayPower)) : power;
}
let summitChoices = new Map(),
  summitSeen = new Set();
let live = {
    connected: false,
    running: false,
    power: 0,
    cadence: 0,
    heartRate: '—',
    speed: 0,
    gear: 6,
    ftp: 280,
    distanceM: 0,
    grade: 0,
    elevation: 0
  },
  lastLiveTime = 0,
  lastLiveDistance = 0,
  lastHold = null,
  clickArmed = true;
const parentSend = data => window.parent.postMessage({ source: 'cycle-quest', ...data }, location.origin);
const mediaKey = 'cycle-quest-share-cards-v1';
function shareCard(title, lines, saveCard = true) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const c = canvas.getContext('2d');
    c.fillStyle = '#0b1640';
    c.fillRect(0, 0, 1200, 630);
    c.strokeStyle = '#a7b2d1';
    c.lineWidth = 6;
    c.strokeRect(18, 18, 1164, 594);
    c.fillStyle = '#ffe777';
    c.font = 'bold 54px monospace';
    c.fillText('CYCLE QUEST', 62, 95);
    c.fillStyle = '#fff';
    c.font = 'bold 56px monospace';
    c.fillText(title.slice(0, 30), 62, 190);
    c.font = '36px monospace';
    lines.slice(0, 11).forEach((line, i) => c.fillText(String(line).slice(0, 50), 62, 230 + i * 34));
    const data = canvas.toDataURL('image/png');
    if (saveCard) saveShareCard(title, data);
    return data;
  } catch {
    return null;
  }
}
function saveShareCard(title, data) {
  const stored = JSON.parse(localStorage.getItem(mediaKey) || '[]'),
    cards = Array.isArray(stored) ? stored : [];
  cards.unshift({ title, date: new Date().toISOString(), data });
  localStorage.setItem(mediaKey, JSON.stringify(cards.slice(0, 12)));
}
let summaryCapturing = false;
const summaryDialog = document.createElement('dialog');
summaryDialog.className = 'cq-route-dialog cq-summary-dialog';
summaryDialog.innerHTML =
  '<h2>REST AT INN</h2><div id="cq-summary-content"></div><div class="cq-eventactions"><button id="cq-summary-download">DOWNLOAD IMAGE</button><button id="cq-summary-retry" hidden>RETRY IMAGE</button><button id="cq-summary-close">CLOSE</button></div>';
root.append(summaryDialog);
summaryDialog.addEventListener('close', () => {
  music.sync({ battle: !!s.battle, paused: !running });
});
// Character tools (profile, shop, cloud save, highlights, workouts, export/import) live in
// the "Character" menu so the ride toolbar never runs off the screen.
function characterMenu() {
  return document.querySelector('#save-tools > div');
}
const galleryButton = document.createElement('button');
galleryButton.textContent = 'Ride highlights';
characterMenu().append(galleryButton);
galleryButton.onclick = () => {
  const body = summaryDialog.querySelector('#cq-summary-content');
  body.replaceChildren();
  let cards = [];
  try {
    cards = JSON.parse(localStorage.getItem(mediaKey) || '[]');
  } catch {
    /* unreadable highlight list: show none */
  }
  if (!Array.isArray(cards)) cards = [];
  cards = cards.filter(
    card => card && typeof card.data === 'string' && card.data.startsWith('data:image/png;base64,')
  );
  if (!cards.length) body.textContent = 'No ride highlights saved yet.';
  for (const card of cards) {
    const row = document.createElement('p'),
      a = document.createElement('a');
    a.href = card.data;
    a.download = 'cycle-quest-highlight.png';
    a.textContent = card.title + ' · ' + new Date(card.date).toLocaleDateString() + ' · DOWNLOAD';
    const thumb = document.createElement('img');
    thumb.src = card.data;
    thumb.alt = card.title + ' preview';
    thumb.style.cssText = 'display:block;max-width:100%;max-height:200px;margin-top:8px';
    row.append(a, thumb);
    body.append(row);
  }
  summaryImage = null;
  if (!summaryDialog.open) summaryDialog.showModal();
};
let summaryImage = null;
summaryDialog.querySelector('#cq-summary-retry').onclick = () => finishQuestSummary(true);
summaryDialog.querySelector('#cq-summary-close').onclick = () => summaryDialog.close();
summaryDialog.querySelector('#cq-summary-download').onclick = () => {
  if (!summaryImage) return;
  const a = document.createElement('a');
  a.href = summaryImage;
  a.download = 'cycle-quest-ride-summary.png';
  a.click();
};
async function finishQuestSummary(retry = false) {
  const q = s.session;
  if (!q || summaryCapturing || (q.completed && !retry)) return;
  q.completed = true;
  summaryCapturing = true;
  summaryDialog.querySelector('#cq-summary-retry').hidden = true;
  const metrics = sessionMetrics(s, live);
  const ascent = Math.max(0, (Number(live.ascentFeet) || 0) - (Number(q.startAscentFeet) || 0));
  const avgPower = (q.powerSeconds || 0) > 0 ? Math.round(q.powerWattSeconds / q.powerSeconds) : 0;
  const avgHR = (q.heartRateSeconds || 0) > 0 ? Math.round(q.heartRateBpmSeconds / q.heartRateSeconds) : 0;
  const lines = [
    'TIME RIDDEN  ' + clock(metrics.seconds),
    'DISTANCE  ' + metrics.miles.toFixed(2) + ' MI',
    'ELEVATION GAINED  ' + fmt(ascent) + ' FT',
    'AVERAGE POWER  ' + avgPower + ' W',
    'AVERAGE HEART RATE  ' + (avgHR ? avgHR + ' BPM' : 'NO HR DATA'),
    'RIDER LEVEL  ' + q.startLevel + ' → ' + level(),
    'XP GAINED  +' + fmt(s.xp - q.startXP),
    'ENEMIES DEFEATED  ' + q.monsters,
    'SUMMIT / CHAPTER BOSSES DEFEATED  ' + q.bosses,
    'COINS COLLECTED  +' + fmt((s.coins || 0) - (q.startCoins || 0)),
    'ATTACK  ' + fmt(atk())
  ];
  const card = shareCard('RIDE COMPLETE', lines, false),
    body = summaryDialog.querySelector('#cq-summary-content');
  body.replaceChildren();
  for (const line of lines) {
    const row = document.createElement('p');
    row.textContent = line;
    body.append(row);
  }
  if (card) {
    const img = document.createElement('img');
    img.src = card;
    img.alt = 'Shareable Cycle Quest ride summary';
    img.style.cssText = 'display:block;max-width:100%;max-height:250px';
    body.append(img);
  }
  const offer = suggestedFTP(q.best20, riderFTP(s));
  if (offer) {
    const box = document.createElement('div');
    box.className = 'cq-ftp-offer';
    const text = document.createElement('p');
    text.textContent =
      'You averaged ' +
      Math.round(q.best20) +
      ' W for 20 minutes. Raise your FTP from ' +
      riderFTP(s) +
      ' to ' +
      offer +
      ' W?';
    const accept = document.createElement('button'),
      keep = document.createElement('button');
    accept.type = keep.type = 'button';
    accept.textContent = 'RAISE FTP TO ' + offer + ' W';
    keep.textContent = 'KEEP ' + riderFTP(s) + ' W';
    accept.onclick = () => {
      if (externalSaveChanged) return;
      s.rider = { ...(s.rider || {}), ftp: offer, source: 'ride' };
      text.textContent = 'FTP raised to ' + offer + ' W.';
      accept.remove();
      keep.remove();
      save();
      render();
    };
    keep.onclick = () => box.remove();
    box.append(text, accept, keep);
    body.append(box);
  }
  const download = summaryDialog.querySelector('#cq-summary-download');
  download.disabled = true;
  summaryImage = null;
  save({ force: true });
  if (!summaryDialog.open) summaryDialog.showModal();
  music.sync({ battle: !!s.battle, rest: true });
  try {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const { default: capture } = await import('/api/cycle-quest?asset=summary-capture.js');
    const canvas = await capture(summaryDialog, {
      backgroundColor: null,
      scale: Math.min(2, window.devicePixelRatio || 1),
      logging: false,
      useCORS: true,
      width: summaryDialog.offsetWidth,
      height: Math.max(summaryDialog.offsetHeight, summaryDialog.scrollHeight),
      onclone: doc => {
        const clone = doc.querySelector('.cq-summary-dialog');
        if (clone) {
          clone.style.maxHeight = 'none';
          clone.style.height = 'auto';
          clone.style.overflow = 'visible';
          clone.querySelector('#cq-summary-download').disabled = false;
        }
      }
    });
    summaryImage = canvas.toDataURL('image/png');
    try {
      saveShareCard('RIDE SUMMARY', summaryImage);
    } catch {
      message = 'Summary image could not be saved locally; use Download image.';
    }
    download.disabled = false;
    parentSend({ type: 'quest-summary', lines, image: summaryImage });
  } catch (error) {
    download.disabled = true;
    message = 'Could not capture the full ride summary. Please try again.';
    parentSend({ type: 'quest-summary', lines, image: null });
    summaryDialog.querySelector('#cq-summary-retry').hidden = false;
    const note = document.createElement('p');
    note.textContent = message;
    body.append(note);
    console.error('Summary image capture failed', error);
  } finally {
    summaryCapturing = false;
  }
}

let powerWindow = createPowerWindow();
let roadsideNotice = '',
  roadsideNoticeUntil = 0;
let floating = null,
  floatingMarkup = '';
let s = fresh(),
  view = 'ride',
  running = false,
  saveTick = 0,
  message = 'The road ahead is yours.',
  power = 0;
function level(xp = s.xp) {
  return levelFromXP(xp);
}
function cost(L) {
  return levelCost(L);
}
function threshold(L) {
  return xpForLevel(L);
}
function maxHP(L = level()) {
  return Math.round(baseMaxHP(L) * multiplier(s.bike, 0));
}
function atk(L = level()) {
  return baseAttack(L) * multiplier(s.bike, 2);
}
// Short form for tight spots like the overlay XP bar: 4,416 → 4.4K, 12,345 → 12K.
function compactNumber(n) {
  const value = Math.max(0, Math.round(n));
  if (value < 1000) return String(value);
  return value < 10000 ? (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : Math.round(value / 1000) + 'K';
}
function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}
function clock(t) {
  return formatClock(t);
}
function load() {
  try {
    persistedSave = localStorage.getItem(key);
    if (persistedSave) {
      s = readCharacter(persistedSave);
      if (JSON.parse(persistedSave).xp > MAX_XP) {
        localStorage.setItem(key + '-xp-limit-backup', persistedSave);
        message = 'Character recovered at the 10,000,000 XP limit. Original save backed up.';
      }
    }
  } catch {
    invalidStoredSave = true;
    externalSaveChanged = true;
    message =
      'Your saved character could not be loaded. It has been preserved. Export your save before making changes.';
  }
  if (!invalidStoredSave) loadHistory();
  s.hp = Math.min(maxHP(), s.hp);
  if (s.chapter > 10) s.mode = 'training';
  warmupSeconds = 0;
  if (
    !invalidStoredSave &&
    s.mode === 'adventure' &&
    s.chapter <= 10 &&
    s.route?.storyChapter !== s.chapter
  ) {
    s.route = chapterRoute(s.chapter, generateRoute);
    s.routeMiles = s.miles;
  }
  if (!invalidStoredSave) restoreRewardState();
  else $('#save-state').textContent = 'Original save preserved — export to recover';
}
// The character and its ride history are stored separately. The character is small and
// saved often; the history (up to 5,000 workouts) is written at most once a minute.
const historyKey = 'cycle-quest-history-v1';
let cloud = null; // cloud save by save code, created after the character loads
let historyText = null,
  lastHistoryWrite = -Infinity;
function characterText(state) {
  const character = { ...state };
  delete character.workouts;
  return JSON.stringify(character);
}
function saveHistory(force = false) {
  const now = performance.now();
  if (!force && now - lastHistoryWrite < 60000) return;
  const text = JSON.stringify(s.workouts || []);
  if (text !== historyText) {
    localStorage.setItem(historyKey, text);
    historyText = text;
  }
  lastHistoryWrite = now;
}
function loadHistory() {
  try {
    const stored = localStorage.getItem(historyKey);
    if (stored === null) return; // first run after the split: history is still inside the character
    const ledger = JSON.parse(stored);
    if (validLedger(ledger)) {
      s.workouts = ledger;
      historyText = stored;
    }
  } catch {
    /* unreadable history: keep whatever the character carried */
  }
}
function save({ force = false } = {}) {
  if (externalSaveChanged) return;
  try {
    if (localStorage.getItem(key) !== persistedSave) {
      externalSaveChanged = true;
      running = false;
      parentSend({ type: 'pause' });
      message = 'Character changed in another tab. Export your progress or reload before continuing.';
      $('#save-state').textContent = message;
      return;
    }
    const text = characterText(s);
    if (text !== persistedSave) {
      localStorage.setItem(key, text);
      persistedSave = text;
    }
    saveHistory(force);
    $('#save-state').textContent = 'Saved on this device' + (cloud?.statusSuffix() || '');
    cloud?.queue(force);
  } catch {
    $('#save-state').textContent = 'Save unavailable — use Export save';
  }
}
function award(x) {
  const before = level();
  s.xp = Math.min(MAX_XP, s.xp + Math.max(0, x));
  if (level() > before) {
    s.hp = maxHP();
    levelUps.enqueue(before, level());
    message = 'LEVEL UP! Level ' + level() + '.';
    shareCard('LEVEL UP!', [
      'LEVEL ' + before + ' → ' + level(),
      'MAX HP  ' + maxHP(before) + ' → ' + maxHP(),
      'ATTACK  ' + fmt(atk(before)) + ' → ' + fmt(atk())
    ]);
  }
  if (s.xp === MAX_XP)
    message = 'Character XP limit reached (10,000,000). Export your save to keep a backup.';
}
function bossStats() {
  if (!s.boss) s.boss = makeBattle('boss', { chapter: s.chapter });
  return s.boss;
}
function loadStoryRoute() {
  const route = chapterRoute(s.chapter, generateRoute);
  if (!route) {
    message = 'All ten chapters cleared!';
    render();
    return false;
  }
  const previous = s.route?.storyChapter === s.chapter ? s.routeMiles || 0 : s.miles;
  s.mode = 'adventure';
  s.route = route;
  s.routeMiles = Math.min(100, Math.max(0, previous));
  s.pendingSummit = null;
  s.summitDoneEnd = null;
  summitChoices.clear();
  summitSeen.clear();
  lastLiveDistance = s.routeMiles * METERS_PER_MILE;
  parentSend({ type: 'route', route: s.route, restoreMiles: s.routeMiles });
  message = route.name + ' · ' + s.routeMiles.toFixed(1) + ' / 100 miles.';
  save();
  render();
  return true;
}
function showEncounterView() {
  if (view === 'overlay') return;
  view = 'ride';
  questBaseline?.setPage('ride');
}
function shopAvailable() {
  return (
    !externalSaveChanged &&
    !running &&
    !s.battle &&
    !s.reward &&
    !(live.activityStartTime && !live.routeComplete)
  );
}
function renderShop() {
  const bike = bikeFor(s),
    available = shopAvailable(),
    grade = unlockedGrade(s);
  const actionButton = (p, action, label, target = grade) => {
    const price = partPrice(bike, p.id, action, target);
    return (
      '<button type="button" data-part="' +
      p.id +
      '" data-part-action="' +
      action +
      '" data-grade="' +
      target +
      '" ' +
      (!available || s.coins < price ? 'disabled' : '') +
      '>' +
      label +
      ' · ' +
      fmt(price) +
      ' coins</button>'
    );
  };
  shopDialog.querySelector('.cq-shop-content').innerHTML =
    '<p>' +
    fmt(s.coins) +
    ' COINS · RIDER LEVEL ' +
    level() +
    '</p>' +
    '<p>' +
    grades
      .slice(1)
      .map((name, i) => name + ' · ' + (i + 1 <= grade ? 'Available' : 'Chapter ' + (i + 1)))
      .join(' / ') +
    '</p>' +
    (!available
      ? '<p>Finish your ride to buy, upgrade, or equip parts.</p>'
      : '<p>Each grade adds ' +
        GRADE_BONUS +
        '% to the part’s stat. Each upgrade adds ' +
        UPGRADE_BONUS +
        '%. Upgrade level is capped by rider level, up to 50.</p>') +
    slots
      .map(
        (slot, i) =>
          '<h3>' +
          slot +
          ' · ' +
          SLOT_STATS[i] +
          '</h3>' +
          (SLOT_STATS[i] === 'STAMINA'
            ? '<p>Tires make stamina last longer and refill faster, at half the tire’s bonus. ' +
              (staminaEfficiency(bike) > 1
                ? 'Your tires: +' + Math.round((staminaEfficiency(bike) - 1) * 100) + '% stamina.'
                : 'Stock tires: no bonus yet.') +
              '</p>'
            : '') +
          catalog
            .filter(p => p.slot === i)
            .map(p => {
              const tier = bike.owned[p.id],
                equipped = bike.equipped[i] === p.id;
              let actions = '';
              if (tier === null) {
                for (let g = 1; g <= grade; g++)
                  actions += actionButton(p, 'buy', 'Buy ' + grades[g] + ' · +' + g * GRADE_BONUS + '%', g);
              } else {
                if (tier < Math.min(50, riderLevel(s)))
                  actions += actionButton(
                    p,
                    'upgrade',
                    'Upgrade +' +
                      tier +
                      ' → +' +
                      (tier + 1) +
                      ' · bonus ' +
                      partBonus(bike, p.id) +
                      '% → ' +
                      (partBonus(bike, p.id) + UPGRADE_BONUS) +
                      '%'
                  );
                else
                  actions +=
                    '<span>' +
                    (tier >= 50 ? 'Maximum upgrade' : 'Next upgrade at rider level ' + (tier + 1)) +
                    '</span>';
                for (let g = bike.grades[p.id] + 1; g <= grade; g++)
                  actions += actionButton(
                    p,
                    'promote',
                    'Promote to ' + grades[g] + ' · bonus +' + (g * GRADE_BONUS + tier * UPGRADE_BONUS) + '%',
                    g
                  );
                if (!equipped)
                  actions +=
                    '<button type="button" data-part="' +
                    p.id +
                    '" data-part-action="equip" ' +
                    (!available ? 'disabled' : '') +
                    '>Equip</button>';
              }
              return (
                '<p><b>' +
                p.name +
                '</b> · ' +
                (tier === null
                  ? 'Available to buy'
                  : grades[bike.grades[p.id]] + ' +' + tier + ' · +' + partBonus(bike, p.id) + '%') +
                (equipped ? ' · EQUIPPED' : '') +
                '</p><div class="cq-eventactions">' +
                actions +
                '</div>'
              );
            })
            .join('')
      )
      .join('');
}
const riderProfile = mountRiderProfile({
  root,
  getRider: () => s.rider || null,
  onSave: rider => {
    if (externalSaveChanged) return;
    s.rider = rider;
    message = 'Rider profile saved · FTP ' + rider.ftp + ' W.';
    save();
    render();
  }
});
const riderButton = document.createElement('button');
riderButton.type = 'button';
riderButton.id = 'cq-open-rider';
riderButton.textContent = 'Rider profile · FTP';
characterMenu().append(riderButton);
riderButton.onclick = () => riderProfile.open();
const partsButton = document.createElement('button');
partsButton.type = 'button';
partsButton.id = 'cq-open-shop';
partsButton.textContent = 'Bike shop';
characterMenu().append(partsButton);
partsButton.onclick = () => {
  renderShop();
  shopDialog.showModal();
};
const shopDialog = document.createElement('dialog');
shopDialog.className = 'cq-route-dialog cq-shop';
shopDialog.innerHTML =
  '<h2>BIKE SHOP</h2><div class="cq-shop-content"></div><div class="cq-eventactions"><button type="button" data-close-shop>CLOSE SHOP</button></div>';
root.append(shopDialog);
shopDialog.addEventListener('click', e => {
  const button = e.target.closest('[data-part-action]');
  if (!button || !shopAvailable()) return;
  if (localStorage.getItem(key) !== persistedSave) {
    externalSaveChanged = true;
    renderShop();
    return;
  }
  const oldMax = maxHP();
  if (
    changePart(s, Number(button.dataset.part), button.dataset.partAction, Number(button.dataset.grade) || 1)
  ) {
    s.hp = Math.max(1, Math.min(maxHP(), s.hp + (maxHP() - oldMax)));
    save();
    render();
    renderShop();
  }
});
// Ride display profile window: 10 miles by default; tapping the profile cycles 10 → 5 → whole
// route. Remembered on this device.
const HUD_PROFILE_STEPS = [10, 5, 0];
let hudProfileMiles = 10;
try {
  const saved = localStorage.getItem('cycle-quest-hud-profile-miles');
  if (saved !== null && HUD_PROFILE_STEPS.includes(Number(saved))) hudProfileMiles = Number(saved);
} catch {
  /* storage blocked: keep 10 miles */
}
function cycleHudProfile() {
  hudProfileMiles =
    HUD_PROFILE_STEPS[(HUD_PROFILE_STEPS.indexOf(hudProfileMiles) + 1) % HUD_PROFILE_STEPS.length];
  try {
    localStorage.setItem('cycle-quest-hud-profile-miles', String(hudProfileMiles));
  } catch {
    /* storage blocked */
  }
  render();
}
// Summit bosses for fixed routes: computed from the route itself, cached per route.
let summitCache = { key: null, ends: [] };
const summitRouteKey = () =>
  s.route
    ? [s.route.name, Math.round(s.route.distance), s.route.seed ?? '', s.route.points?.length].join('|')
    : '';
function currentSummits() {
  const key = summitRouteKey();
  if (summitCache.key !== key)
    summitCache = { key, ends: s.route && !s.route.endless ? routeSummits(s.route) : [] };
  return summitCache.ends;
}
function summitsDone() {
  return s.summitsDone?.route === summitRouteKey() && Array.isArray(s.summitsDone.ends)
    ? s.summitsDone.ends
    : [];
}
// Freeroam is "Scaled to me" by default (freeroamChapter 0 or unset): enemies at the rider's
// level, drawn from the highest chapter reached. Picking a chapter instead uses that chapter's
// fixed levels, so riders can go back and feel the power creep.
function freeroamScaled() {
  return s.mode === 'training' && !(Number(s.freeroamChapter) >= 1);
}
function freeroamChapter() {
  const reached = Math.min(s.chapter, CHAPTER_COUNT);
  if (freeroamScaled()) return reached;
  return Math.max(1, Math.min(reached, Math.floor(Number(s.freeroamChapter))));
}
function hpReadyForBattle() {
  return s.hp >= (maxHP() * HEALING.encounterMinPercent) / 100;
}
function encounter(kind, forcedCount = null) {
  if (externalSaveChanged || !live.connected) return;
  if (!hpReadyForBattle()) {
    if (kind === 'enemy') s.nextEncounter = 30;
    message =
      'HP low · battles wait until you recover to ' +
      HEALING.encounterMinPercent +
      '%. Easy spinning (≤' +
      Math.round(HEALING.easyEffort * 100) +
      '% FTP) heals twice as fast.';
    render();
    return;
  }
  if (s.battle || s.reward || levelUp) {
    message = 'Finish your current encounter first.';
    return;
  }
  showEncounterView();
  const contentChapter = s.mode === 'adventure' ? Math.min(s.chapter, CHAPTER_COUNT) : freeroamChapter(),
    contentMiles = s.mode === 'adventure' ? s.miles : null;
  if (kind === 'boss') {
    if (s.mode !== 'adventure' || s.chapter > 10) return;
    s.bossWarmupReady = false;
    s.miles = 100;
    // The chapter boss meets the rider at their level (weaker after each loss).
    s.battle = {
      ...makeBattle('boss', {
        chapter: s.chapter,
        level: chapterBossLevel(s.chapter, level(), s.bossLosses || 0)
      })
    };
  } else if (kind === 'enemy') {
    const roll = Math.random(),
      count = forcedCount ?? (roll < 0.1 ? 3 : roll < 0.3 ? 2 : 1),
      fights = [];
    for (let i = 0; i < count; i++) {
      const pick = nextChapterEncounter(contentChapter, s.chapterEncounter);
      s.chapterEncounter = pick.state;
      fights.push(
        makeBattle('enemy', {
          chapter: contentChapter,
          level: freeroamScaled()
            ? scaledEncounterLevel(level())
            : encounterLevel(contentChapter, contentMiles),
          monsterId: pick.monsterId
        })
      );
    }
    s.battle = enemyGroup(fights);
  } else
    s.battle = makeBattle(
      'summit',
      freeroamScaled() ? { chapter: contentChapter, level: level() } : { chapter: contentChapter }
    );
  message = kind === 'summit' ? 'SUMMIT BOSS! Resistance held for battle.' : 'An enemy stands in your way.';
  save();
  render();
}
function restoreRewardState() {
  s.coins ??= 0;
  bikeFor(s);
  if (s.reward && !s.pendingReward) {
    // A reward flag saved without details: nothing was paid yet, so the choice pays the coins.
    s.pendingReward = { ...battleRewards({ kind: 'enemy', reward: 150 }), coinsPaid: false };
    award(s.pendingReward.xp);
  }
  // A pending heal-or-coins choice survives a reload and is offered again.
}
function finish(win) {
  const b = s.battle;
  if (!b) return;
  music.endBattle(win ? 'victory' : 'death');
  s.battle = null;
  s.reward = false;
  s.pendingReward = null;
  if (b.kind === 'summit' && !s.route?.endless) parentSend({ type: 'summit-resolved' });
  s.nextEncounter = encounterDelay();
  if (win) {
    const rewards = battleRewards(b);
    if (s.session) {
      if (b.kind === 'enemy' && !Array.isArray(b.enemies)) s.session.monsters++;
      else if (b.kind !== 'enemy') s.session.bosses++;
    }
    award(rewards.xp);
    s.coins = (s.coins || 0) + rewards.coins;
    s.reward = true;
    s.pendingReward = rewards;
    if (b.kind === 'boss') {
      s.chapter++;
      s.miles = 0;
      s.boss = null;
      delete s.bossLosses;
      if (s.chapter <= 10) {
        s.route = chapterRoute(s.chapter, generateRoute);
        s.routeMiles = 0;
        lastLiveDistance = 0;
        parentSend({ type: 'route', route: s.route, restoreMiles: 0 });
      } else {
        s.mode = 'training';
        parentSend({ type: 'story-complete' });
      }
    }
    if (b.kind !== 'enemy')
      shareCard(b.kind === 'summit' ? 'SUMMIT BOSS DEFEATED' : 'CHAPTER BOSS DEFEATED', [
        b.name,
        'XP EARNED  +' + rewards.xp,
        'LEVEL ' + level()
      ]);
    message =
      (s.chapter > 10 && b.kind === 'boss' ? 'ALL TEN CHAPTERS CLEARED! ' : 'VICTORY! ') +
      '+' +
      fmt(rewards.xp) +
      ' XP · +' +
      fmt(rewards.coins) +
      ' coins · Choose a bonus: heal or more coins.';
  } else {
    const lostCoins = Math.floor(((s.coins || 0) * HEALING.lossCoinPercent) / 100);
    s.coins = (s.coins || 0) - lostCoins;
    s.hp = Math.max(1, Math.round((maxHP() * HEALING.lossHPPercent) / 100));
    if (b.kind === 'boss') s.bossLosses = (s.bossLosses || 0) + 1;
    message =
      'Battle lost. No XP' +
      (lostCoins ? ', ' + fmt(lostCoins) + ' coins dropped' : '') +
      '. You limp on at ' +
      HEALING.lossHPPercent +
      '% HP. ' +
      (b.kind !== 'boss'
        ? 'Keep riding.'
        : chapterBossLevel(s.chapter, level(), s.bossLosses) < b.level
          ? 'The boss is wounded: next time it is LV ' +
            chapterBossLevel(s.chapter, level(), s.bossLosses) +
            '.'
          : 'The same boss awaits your next attempt.');
  }
  save();
}
function choose(type) {
  if (externalSaveChanged || !s.reward || !s.pendingReward || !['heal', 'coins'].includes(type)) return;
  const rewards = s.pendingReward;
  if (type === 'heal') {
    const n = Math.min(Math.round((maxHP() * rewards.healPercent) / 100), maxHP() - s.hp);
    s.hp += n;
    message = 'Recovered ' + fmt(n) + ' HP. Shifting restored.';
  } else {
    // New rewards already paid the win's coins; this is the bonus. Older saved choices paid
    // nothing yet, so they still pay their coins here.
    const bonus = rewards.coinsPaid ? rewards.bonusCoins || 0 : rewards.coins;
    s.coins = (s.coins || 0) + bonus;
    message = '+' + fmt(bonus) + ' bonus coins! Shifting restored.';
  }
  s.reward = false;
  s.pendingReward = null;
  rewardChoice = null;
  save();
  render();
}

function step(dt) {
  if (!running) return;
  dt = Math.min(dt, 1);
  s.rideSeconds += dt;
  // Stamina: above FTP drains it, easy riding refills it, in battles and while exploring.
  s.stamina = advanceStamina(s.stamina, effortShare(power, riderFTP(s)), dt, staminaEfficiency(s.bike));
  if (power > 0 && live.cadence > 0) {
    award(dt);
    if (!s.battle && !s.reward)
      s.hp = Math.min(maxHP(), s.hp + regenPerSecond(maxHP(), effortShare(power, riderFTP(s))) * dt);
  }
  if (s.reward) return;
  if (warmupSeconds > 0) {
    if (power > 0 && live.cadence > 0) warmupSeconds = Math.max(0, warmupSeconds - dt);
    if (warmupSeconds <= 0) s.bossWarmupReady = true;
    return;
  }
  if (s.bossWarmupReady && !s.battle && !levelUp) {
    s.bossWarmupReady = false;
    encounter('boss');
  }
  if (s.battle) {
    const damage = riderDamagePerSecond(atk(), power, riderFTP(s)) * staminaDamageMultiplier(s.stamina);
    const before = s.battle.kind === 'enemy' ? null : bossPhase(s.battle);
    const out =
      s.battle.kind === 'enemy'
        ? advanceBattle(s.battle, s.hp, damage, dt)
        : advanceBossBattle(s.battle, s.hp, damage, dt, {
            watts: power,
            cadence: live.cadence,
            effort: effortShare(power, riderFTP(s)),
            maxHP: maxHP()
          });
    s.battle = out.battle;
    s.hp = out.hp;
    if (before && !out.outcome) announceBossPhase(before, out);
    if (s.session && out.killed) s.session.monsters += out.killed;
    if (out.outcome === 'flee') fleeSummit();
    else if (out.outcome) finish(out.outcome === 'win');
  }
}
function fleeSummit() {
  music.endBattle('flee');
  s.battle = null;
  if (!s.route?.endless) parentSend({ type: 'summit-resolved' });
  message = 'Summit battle escaped. No bonus reward.';
  save();
}
// Live effort readout: "112% FTP · CRIT +12%".
function effortLabel() {
  const effort = effortShare(displayedPower(), riderFTP(s)),
    crit = critBonus(effort);
  return (
    Math.round(effort * 100) +
    '% FTP' +
    (crit > 0 ? ' · CRIT +' + Math.round(crit * 100) + '%' : '') +
    (isExhausted(s.stamina) ? ' · EXHAUSTED −' + Math.round((1 - STAMINA.exhaustedDamage) * 100) + '%' : '')
  );
}
// ---- Boss phases: on-screen prompts, messages and sound cues ---------------------
// m:ss countdown for boss phases.
const phaseClock = seconds => {
  const n = Math.max(0, Math.ceil(seconds));
  return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
};
const braceWatts = () => Math.round(BOSS_FIGHT.braceEffort * riderFTP(s));
// Short beeps for phase changes, only when the game's sound is on.
let cueContext = null;
function cue(kind) {
  if (!music.state().enabled) return;
  try {
    cueContext ||= new AudioContext();
    const t = cueContext.currentTime,
      tones = {
        windup: [660, 660, 660],
        brace: [880, 660],
        counter: [660, 990],
        hit: [330],
        enrage: [440, 330, 220]
      }[kind] || [660];
    tones.forEach((frequency, i) => {
      const osc = cueContext.createOscillator(),
        gain = cueContext.createGain(),
        start = t + i * 0.18;
      osc.type = 'square';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.07, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
      osc.connect(gain).connect(cueContext.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  } catch {
    /* audio unavailable: the on-screen countdown still shows */
  }
}
function announceBossPhase(before, out) {
  const after = bossPhase(out.battle),
    name = out.battle.name;
  if (!before.windup && after.windup) {
    cue('windup');
    message = name + ' winds up! Ease under ' + braceWatts() + ' W to brace.';
  }
  for (const event of out.events || []) {
    if (event === 'brace') {
      cue('brace');
      message = 'BRACE! Hold under ' + braceWatts() + ' W.';
    } else if (event === 'hit') {
      const held = Math.round((out.battle.lastBrace || 0) * 100),
        landed = (out.battle.lastBrace || 0) >= BOSS_FIGHT.counterNeedsBrace;
      cue(landed ? 'counter' : 'hit');
      message =
        name +
        ' hits for ' +
        fmt(out.battle.lastHit || 0) +
        ' HP (' +
        held +
        '% braced). ' +
        (landed ? 'COUNTER! Double damage.' : 'No opening this time.');
    } else if (event === 'attack') message = 'Back on the attack.';
    else if (event === 'enrage') {
      cue('enrage');
      message = name + ' is ENRAGED! No more braces. Finish it!';
    }
  }
}
// Full-screen prompt under the boss name: what to do now, and for how long.
function bossPrompt(b) {
  if (b.kind === 'enemy') return '';
  const p = bossPhase(b);
  let big, small;
  if (p.phase === 'brace') {
    big = 'BRACE \xB7 UNDER ' + braceWatts() + ' W \xB7 ' + phaseClock(p.secondsLeft);
    small = p.grace
      ? 'EASE DOWN NOW'
      : Math.round(p.braceShare * 100) + '% BRACED \xB7 BIG HIT ' + fmt(p.bigHit) + ' HP';
  } else if (p.phase === 'counter') {
    big = (p.counterLanded ? 'COUNTER! DOUBLE DAMAGE' : 'NO OPENING') + ' \xB7 ' + phaseClock(p.secondsLeft);
    small = p.counterLanded ? 'PUSH NOW' : 'HOLD MORE OF THE NEXT BRACE TO EARN A COUNTER';
  } else if (p.phase === 'enrage') {
    big = 'ENRAGED \xB7 NO MORE BRACES';
    small = 'FINISH IT';
  } else if (p.windup) {
    big = 'WIND-UP \xB7 BRACE IN ' + Math.ceil(p.secondsLeft);
    small = 'EASE UNDER ' + braceWatts() + ' W';
  } else {
    big = 'ATTACK \xB7 BRACE IN ' + phaseClock(p.secondsLeft);
    small = 'RIDE HOWEVER YOU LIKE';
  }
  if (b.kind === 'summit' && p.phase !== 'brace' && b.stopped)
    small = 'RIDING AWAY IN ' + Math.ceil(BALANCE.summitEscapeSeconds - b.stopped) + 's';
  return (
    '<div class="cq-boss-prompt cq-phase-' +
    (p.windup ? 'windup' : p.phase) +
    '">' +
    big +
    '<small>' +
    small +
    '</small></div>'
  );
}
// Rider damage and boss attack as the current phase changes them.
function phaseDamageFactor(b) {
  if (b.kind === 'enemy') return 1;
  const p = bossPhase(b);
  return p.phase === 'brace' ? 0 : p.counterLanded ? BOSS_FIGHT.counterMultiplier : 1;
}
function phaseAttack(b) {
  if (b.kind === 'enemy') return b.dps;
  const phase = bossPhase(b).phase;
  const factor =
    phase === 'brace'
      ? 0
      : phase === 'counter'
        ? BOSS_FIGHT.counterBossAttack
        : phase === 'enrage'
          ? BOSS_FIGHT.boss.enrageAttack
          : 1;
  return b.dps * factor;
}
function healthColor(hp, max) {
  const ratio = max > 0 ? hp / max : 0;
  return ratio > 2 / 3 ? '#00ed00' : ratio > 1 / 3 ? '#ffcc00' : '#f21d38';
}
function patchMarkup(host, markup) {
  const template = host.ownerDocument.createElement('template');
  template.innerHTML = markup;
  function patch(parent, wanted) {
    const incoming = Array.from(wanted.childNodes);
    incoming.forEach((next, i) => {
      let current = parent.childNodes[i];
      if (!current) {
        parent.appendChild(next.cloneNode(true));
        return;
      }
      if (
        current.nodeType !== next.nodeType ||
        (current.nodeType === 1 && current.tagName !== next.tagName)
      ) {
        parent.replaceChild(next.cloneNode(true), current);
        return;
      }
      if (current.nodeType === 3) {
        if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
        return;
      }
      if (current.nodeType !== 1) return;
      for (const attr of Array.from(current.attributes))
        if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
      for (const attr of Array.from(next.attributes))
        if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
      patch(current, next);
    });
    while (parent.childNodes.length > incoming.length) parent.lastChild.remove();
  }
  patch(host, template.content);
}
// One text card per living enemy (overlay battle view). No artwork.
// The compact overlay names each enemy on its card, so the heading only says what kind of fight it is.
function compactBattleTitle(b) {
  if (b.kind === 'summit') return 'SUMMIT BOSS';
  if (b.kind === 'boss') return 'CHAPTER BOSS';
  const count = Array.isArray(b.enemies) ? b.enemies.filter(e => e.hp > 0).length : 1;
  return count > 1 ? count + ' ENEMIES' : 'ENEMY';
}
// In the compact overlay the boss phase lives in the heading, so the card keeps its height.
function compactPhaseLabel(b) {
  const p = bossPhase(b);
  if (b.kind === 'summit' && p.phase !== 'brace' && b.stopped)
    return 'ESCAPE IN ' + Math.ceil(BALANCE.summitEscapeSeconds - b.stopped) + 's';
  if (p.phase === 'brace')
    return p.grace ? 'BRACE NOW' : 'BRACE <' + braceWatts() + 'W ' + phaseClock(p.secondsLeft);
  if (p.phase === 'counter')
    return (p.counterLanded ? 'COUNTER \xD72 ' : 'NO OPENING ') + phaseClock(p.secondsLeft);
  if (p.phase === 'enrage') return 'ENRAGED';
  return p.windup ? 'BRACE IN ' + Math.ceil(p.secondsLeft) : 'ATTACK ' + phaseClock(p.secondsLeft);
}
function enemyCards(b) {
  const enemies = Array.isArray(b.enemies)
    ? b.enemies
    : [{ id: b.monsterId, name: b.name, hp: b.hp, max: b.max, level: b.level }];
  const living = enemies.filter(e => e.hp > 0);
  return living.length
    ? '<div class="cq-text-group">' +
        living
          .map(
            e =>
              '<div class="cq-rat-card"><strong class="cq-rat-name">' +
              safeText(e.name || b.name) +
              ' <span class="cq-lv">- LV ' +
              safeText(e.level || b.level || 1) +
              '</span></strong><span class="cq-rat-hp">' +
              fmt(e.hp) +
              ' HP</span><div class="cq-enemymeter"><i style="width:' +
              Math.max(0, Math.min(100, (e.hp / e.max) * 100)) +
              '%"></i></div></div>'
          )
          .join('') +
        '</div>'
    : '';
}
function groupBars(b) {
  if (!Array.isArray(b.enemies) || b.enemies.length <= 1) return '';
  const enemies = b.enemies.filter(e => e.hp > 0);
  if (!enemies.length) return '';
  return (
    '<div class="cq-group">' +
    enemies
      .map(
        e =>
          '<div style="--enemy-health:' +
          healthColor(e.hp, e.max) +
          '"><span>' +
          safeText(e.name) +
          ' · LV ' +
          safeText(e.level || 1) +
          ' · ' +
          fmt(e.hp) +
          ' HP</span><div class="cq-enemymeter"><i style="width:' +
          Math.max(0, (e.hp / e.max) * 100) +
          '%"></i></div></div>'
      )
      .join('') +
    '</div>'
  );
}

let profileInspect = null,
  profileDrag = null;
root.addEventListener('pointerdown', event => {
  const el = event.target.closest('.cq-profile:not(.cq-smallprofile):not(.cq-hudprofile)');
  if (!el || !s.route || event.button !== 0 || event.target.closest('[data-profile-reset]')) return;
  profileDrag = { id: event.pointerId, el };
  el.setPointerCapture(event.pointerId);
  moveProfileInspection(event);
  event.preventDefault();
});
root.addEventListener('pointermove', event => {
  if (profileDrag?.id !== event.pointerId) return;
  moveProfileInspection(event);
  event.preventDefault();
});
function moveProfileInspection(event) {
  const el = profileDrag.el,
    svg = el.querySelector('svg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect(),
    width = svg.viewBox.baseVal.width;
  const fraction = Math.max(
    0,
    Math.min(
      1,
      (((event.clientX - rect.left) / Math.max(1, rect.width)) * width - 14) / Math.max(1, width - 28)
    )
  );
  profileInspect = Number(el.dataset.profileStart) + fraction * Number(el.dataset.profileLength);
  draw();
}
function endProfileDrag(event) {
  if (profileDrag?.id !== event.pointerId) return;
  const el = profileDrag.el;
  profileDrag = null;
  if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
}
root.addEventListener('pointerup', endProfileDrag);
root.addEventListener('pointercancel', endProfileDrag);
root.addEventListener('click', event => {
  if (!event.target.closest('[data-profile-reset]')) return;
  profileInspect = null;
  draw();
});
function draw() {
  if (!s.route) return;
  all('.cq-profile').forEach(el => {
    let w = el.clientWidth,
      h = el.clientHeight;
    if (el.classList.contains('cq-smallprofile') && floating && !floating.closed) {
      w = w || Math.max(160, floating.innerWidth - 440);
      h = h || 110;
    }
    if (!w || !h) return;
    if (el.classList.contains('cq-smallprofile') && (warmupSeconds > 0 || levelUp || s.battle || s.reward))
      el._cqProfileKey = null;
    if (el.classList.contains('cq-smallprofile') && warmupSeconds > 0) {
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', 'Boss warmup');
      el.innerHTML =
        '<div class="cq-mini-battle"><strong>BOSS WARMUP</strong><span>' +
        clock(Math.ceil(warmupSeconds)) +
        ' LEFT · PEDAL TO WARM UP</span></div>';
      return;
    }
    if (el.classList.contains('cq-smallprofile') && levelUp) {
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', 'Level up celebration');
      el.innerHTML = levelUpMarkup(levelUp, { hp: maxHP, attack: atk }, true);
      return;
    }
    if (el.classList.contains('cq-smallprofile') && (s.battle || s.reward)) {
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', s.reward ? 'Victory reward choice' : s.battle.name + ' battle');
      if (s.reward) {
        patchMarkup(
          el,
          '<div class="cq-mini-battle cq-mini-reward"><span>' +
            rewardLabel() +
            '</span>' +
            rewardButtons(s.pendingReward, true)
              .replace(
                'data-reward="heal"',
                'data-reward="heal"' +
                  (rewardChoice?.selected === 'heal' ? ' class="cq-reward-selected"' : '')
              )
              .replace(
                'data-reward="coins"',
                'data-reward="coins"' +
                  (rewardChoice?.selected === 'coins' ? ' class="cq-reward-selected"' : '')
              ) +
            '</div>'
        );
      } else {
        const b = s.battle;
        patchMarkup(
          el,
          '<div class="cq-mini-battle cq-text-battle" style="--enemy-health:' +
            healthColor(b.hp, b.max) +
            '"><div class="cq-battleheading"><span>' +
            compactBattleTitle(b) +
            '</span><span' +
            (b.kind === 'enemy'
              ? ''
              : ' class="cq-phase-' + (bossPhase(b).windup ? 'windup' : bossPhase(b).phase) + '"') +
            '>' +
            (b.kind === 'enemy' ? 'UNTIL 1 HP' : compactPhaseLabel(b)) +
            '</span></div>' +
            (enemyCards(b) ||
              '<div class="cq-mini-enemyhp">' +
                fmt(b.hp) +
                ' HP</div><div class="cq-enemymeter" style="--enemy-health:' +
                healthColor(b.hp, b.max) +
                '"><i style="width:' +
                Math.max(0, (b.hp / b.max) * 100) +
                '%"></i></div>') +
            '</div>'
        );
      }
      return;
    }
    el.setAttribute('role', 'img');
    el.setAttribute(
      'aria-label',
      'Elevation profile: downhill, 0–3%, 3–6%, 6–9%, 9%+ grades in five blue tones; yellow rider line'
    );
    const hudWindow =
      el.classList.contains('cq-hudprofile') && hudProfileMiles ? hudProfileMiles * METERS_PER_MILE : 0;
    const offset = s.route?.windowStart || 0,
      current = (s.routeMiles || 0) * METERS_PER_MILE,
      climb =
        !hudWindow && running && !document.getElementById('route-dialog')?.open
          ? (Array.isArray(live.climbs) ? live.climbs : []).find(
              c =>
                current >= c.start &&
                current < c.end &&
                c.start >= offset &&
                c.end <= offset + s.route.distance
            )
          : null;
    let displayed = s.route,
      progress = (current - offset) / s.route.distance,
      windowFrom = offset;
    if (hudWindow && hudWindow < s.route.distance) {
      // Ride display: show the next stretch of road. The rider line moves until it is 2 miles
      // in, then the road scrolls past it; near the end of the route the line moves on again.
      const rel = current - offset,
        from = Math.max(0, Math.min(s.route.distance - hudWindow, rel - 2 * METERS_PER_MILE)),
        to = from + hudWindow;
      displayed = {
        ...s.route,
        distance: hudWindow,
        points: [
          { d: 0, e: sample(s.route, from) },
          ...s.route.points.filter(p => p.d > from && p.d < to).map(p => ({ d: p.d - from, e: p.e })),
          { d: hudWindow, e: sample(s.route, to) }
        ]
      };
      progress = (rel - from) / hudWindow;
      windowFrom = offset + from;
    } else if (climb) {
      const start = climb.start - offset,
        end = climb.end - offset,
        pts = [
          { d: 0, e: sample(s.route, start) },
          ...s.route.points.filter(p => p.d > start && p.d < end).map(p => ({ d: p.d - start, e: p.e })),
          { d: end - start, e: sample(s.route, end) }
        ];
      displayed = { ...s.route, distance: end - start, points: pts };
      progress = (current - climb.start) / (climb.end - climb.start);
    }
    if (climb) windowFrom = climb.start;
    const inspectable = !el.classList.contains('cq-smallprofile') && !hudWindow,
      profileStart = windowFrom;
    el.dataset.profileStart = String(profileStart);
    el.dataset.profileLength = String(displayed.distance);
    if (inspectable && profileInspect !== null)
      progress = (profileInspect - profileStart) / displayed.distance;
    const bossEnds = s.route?.endless
      ? (Array.isArray(live.climbs) ? live.climbs : []).map(c => c.end)
      : currentSummits().map(e => e + offset);
    const bosses = bossEnds
      .filter(e => summitChoices.get(Math.round(e)) && !summitSeen.has(Math.round(e)))
      .map(e => (e - windowFrom) / displayed.distance)
      .filter(v => v >= 0 && v <= 1);
    displayed = { ...displayed, summits: bosses };
    const eta =
      climb && live.speed > 1
        ? Math.ceil((climb.end - current) / ((live.speed * METERS_PER_MILE) / 3600) / 60)
        : null;
    el.style.touchAction = inspectable ? 'none' : '';
    el.style.cursor = inspectable ? 'crosshair' : '';
    // Rebuilding ~1,000 SVG shapes is the most expensive thing on screen: skip it unless the
    // route window, size, rider marker (to the half pixel), overlays or readouts changed.
    const profileKey = [
      displayed.distance,
      displayed.points.length,
      s.route.windowStart || 0,
      s.route.name,
      w,
      h,
      Math.round(Math.max(0, Math.min(1, progress)) * w * 2),
      Math.round(windowFrom),
      displayed.summits.join(','),
      profileInspect === null ? '' : Math.round(profileInspect),
      climb ? climb.start + ':' + ((climb.end - current) / METERS_PER_MILE).toFixed(2) + ':' + eta : '',
      el.classList.contains('cq-smallprofile') ? currentGrade() : ''
    ].join('|');
    if (el._cqProfileKey === profileKey) return;
    el._cqProfileKey = profileKey;
    el.innerHTML =
      elevationSVG(displayed, sample, w, h, progress) +
      (inspectable && profileInspect !== null
        ? '<div style="position:absolute;bottom:4px;left:6px;z-index:3;background:#102052;color:#fff;padding:4px 7px;font-size:16px">PREVIEW ' +
          (profileInspect / METERS_PER_MILE).toFixed(2) +
          ' MI · ' +
          Math.round(
            sample(s.route, Math.max(0, Math.min(s.route.distance, profileInspect - offset))) / 0.3048
          ) +
          ' FT · ' +
          grade(s.route, Math.max(0, Math.min(s.route.distance, profileInspect - offset))).toFixed(1) +
          '% <button type="button" data-profile-reset style="cursor:pointer">FOLLOW RIDER</button></div>'
        : '') +
      (climb
        ? '<div class="cq-climb-hud">' +
          safeText(climb.category) +
          ' · ' +
          ((climb.end - current) / METERS_PER_MILE).toFixed(2) +
          ' MI LEFT · ETA ' +
          (eta === null ? '—' : eta + ' MIN') +
          '</div>'
        : '') +
      (el.classList.contains('cq-smallprofile')
        ? '<div class="cq-overlay-grade" aria-label="Current route grade">' + currentGrade() + '</div>'
        : '');
  });
}
function currentGrade() {
  const g = live.connected
    ? live.grade
    : s.route
      ? grade(s.route, (s.routeMiles || 0) * METERS_PER_MILE - (s.route.windowStart || 0))
      : 0;
  return (g >= 0 ? '+' : '') + g.toFixed(1) + '%';
}
let previousEvent = '',
  lastRewardState = null;
function renderRideReadouts(session, L, remaining) {
  setStat('tile-hr', safeText(live.heartRate) + ' <em>BPM</em>', true);
  setStat('tile-cadence', Math.round(live.cadence) + ' <em>RPM</em>', true);
  setStat('tile-gear', safeText(live.gear) + ' <em>/ 24</em>', true);
  setStat('tile-power', displayedPower() + ' <em>W</em>', true);
  setStat('tile-speed', live.speed.toFixed(1) + ' <em>MPH</em>', true);
  setStat('tile-time', clock(session.seconds));
  setStat('tile-distance', session.miles.toFixed(2) + ' <em>MI</em>', true);
  if (s.route) setStat('tile-ascent', fmt(routeAscent()) + ' <em>FT</em>', true);
  setHTML(
    $('.cq-overlayhead>span'),
    'CYCLE QUEST <span class="cq-gold">LV ' +
      L +
      '</span> <span class="cq-overlay-xp" aria-label="Experience remaining to next level"><span class="cq-overlay-xpfill" style="width:' +
      Math.max(0, Math.min(100, (remaining / cost(L)) * 100)) +
      '%"></span><b>' +
      compactNumber(remaining) +
      ' XP LEFT</b></span>'
  );
  setText(
    $('.cq-overlayhead>span:nth-child(2)'),
    'CHAPTER ' + s.chapter + ' \xB7 ' + s.miles.toFixed(1) + ' / 100 MI'
  );
  setText(
    $('.cq-elapsed'),
    session.miles.toFixed(2) + ' MI \xB7 GEAR ' + live.gear + ' \xB7 ' + formatClock(session.seconds)
  );
  // Overlay units are drawn at half size so the numbers themselves can be as large as possible.
  setStat('overlay-power', displayedPower() + '<em> W</em>', true);
  setStat('overlay-hr', safeText(live.heartRate) + '<em> BPM</em>', true);
  renderStamina();
  setHTML(
    $('.cq-overlayfoot'),
    '<span>' +
      (s.battle
        ? safeText(s.battle.name) + ' \xB7 ' + fmt(s.battle.hp) + ' HP'
        : s.reward
          ? '+' + (s.pendingReward?.xp || 0) + ' XP EARNED \xB7 CHOOSE A REWARD'
          : performance.now() < roadsideNoticeUntil
            ? safeText(roadsideNotice)
            : ' +1 XP / SEC PEDALING') +
      '</span><span>' +
      live.speed.toFixed(1) +
      ' MPH \xB7 ATTACK ' +
      fmt(atk()) +
      ' \xB7 ' +
      fmt(s.coins || 0) +
      ' COINS</span>'
  );
}
// Stamina readouts: overlay (number + bar under HP) and the full-screen strip.
function renderStamina() {
  const value = Math.round(Number.isFinite(s.stamina) ? s.stamina : STAMINA.max),
    exhausted = isExhausted(s.stamina);
  setStat('overlay-stamina', value + '<em> %</em>', true);
  all('[data-stamina-label]').forEach(el => setText(el, exhausted ? 'EXHAUSTED' : 'STAMINA'));
  all('.cq-stamina-fill').forEach(el => (el.style.width = value + '%'));
  all('.cq-stamina-value').forEach(el => setText(el, value + '%'));
  all('[data-stamina]').forEach(el => el.classList.toggle('cq-exhausted', exhausted));
  const hpPct = Math.max(0, Math.min(100, (s.hp / maxHP()) * 100));
  all('.cq-hp-fill-mini').forEach(el => (el.style.width = hpPct + '%'));
}
function battleLevelLabel(b) {
  const levels = b.enemies?.map(e => e.level) || [b.level];
  const low = Math.min(...levels),
    high = Math.max(...levels);
  return 'LV ' + low + (high !== low ? '–' + high : '');
}
function eventMarkup() {
  let html = '';
  if (levelUp) {
    html = levelUpMarkup(levelUp, { hp: maxHP, attack: atk });
  } else if (s.battle) {
    const b = s.battle;
    html =
      '<div class="cq-battleheading"><span>' +
      { enemy: 'RANDOM ENCOUNTER', summit: 'SUMMIT BOSS', boss: 'CHAPTER BOSS' }[b.kind] +
      '</span><span>' +
      (b.kind === 'boss'
        ? bossPhase(b).phase === 'enrage'
          ? 'FINAL ROUND'
          : 'ROUND ' + Math.min(BOSS_FIGHT.boss.rounds, (b.round || 0) + 1) + ' OF ' + BOSS_FIGHT.boss.rounds
        : 'NO TIME LIMIT') +
      '</span></div>' +
      (Array.isArray(b.enemies) && b.enemies.length > 1 ? '' : '<h3>' + safeText(b.name) + '</h3>') +
      bossPrompt(b) +
      '<span class="cq-sub">' +
      (battleLevelLabel(b) + ' \xB7 ') +
      'BASE ATTACK ' +
      b.dps.toFixed(2) +
      ' HP / SEC</span><div class="cq-eventbar" style="--enemy-health:' +
      healthColor(b.hp, b.max) +
      '"><span>' +
      fmt(b.hp) +
      ' / ' +
      fmt(b.max) +
      ' HP</span><span>LOSE AT 1 HP</span></div>' +
      // Group fights show one bar per enemy; a single enemy gets the one big bar.
      (Array.isArray(b.enemies) && b.enemies.length > 1
        ? groupBars(b)
        : '<div class="cq-enemymeter" style="--enemy-health:' +
          healthColor(b.hp, b.max) +
          '"><i style="width:' +
          Math.max(0, (b.hp / b.max) * 100) +
          '%"></i></div>') +
      '<span class="cq-sub' +
      (critBonus(effortShare(displayedPower(), riderFTP(s))) > 0 ? ' cq-crit' : '') +
      '">' +
      displayedPower() +
      ' W \xB7 ' +
      effortLabel() +
      ' \u2192 ' +
      fmt(
        riderDamagePerSecond(atk(), displayedPower(), riderFTP(s)) *
          staminaDamageMultiplier(s.stamina) *
          phaseDamageFactor(b)
      ) +
      ' DAMAGE / SEC \xB7 ' +
      phaseAttack(b).toFixed(2) +
      ' HP LOST / SEC</span><p class="cq-sub">' +
      (running ? 'Keep pedaling!' : 'Start pedaling to continue the battle.') +
      '</p>';
  } else if (s.reward) {
    html =
      '<h3>VICTORY!</h3><p>' +
      rewardLabel() +
      '</p>' +
      rewardButtons(s.pendingReward)
        .replace(
          'data-reward="heal"',
          'data-reward="heal"' + (rewardChoice?.selected === 'heal' ? ' class="cq-reward-selected"' : '')
        )
        .replace(
          'data-reward="coins"',
          'data-reward="coins"' + (rewardChoice?.selected === 'coins' ? ' class="cq-reward-selected"' : '')
        ) +
      '<p class="cq-sub" style="margin-top:12px">Keep pedaling for ' +
      (rewardChoice?.pedal === 'heal'
        ? 'HEAL \xB7 Stop pedaling for COINS'
        : 'COINS \xB7 Stop pedaling for HEAL') +
      ' \xB7 \u2212 / + or click confirms now.</p>';
  } else if (warmupSeconds > 0) {
    html =
      '<h3>BOSS WARMUP</h3><p>Pedal to warm up \xB7 ' +
      clock(Math.ceil(warmupSeconds)) +
      ' remaining</p><div class="cq-eventactions"><button data-warmup="0">Skip warmup</button></div>';
  } else if (s.miles >= 100 && s.mode === 'adventure' && s.chapter <= 10) {
    html =
      '<h3>' +
      safeText(bossStats().name) +
      ' AWAITS</h3><p>Choose your warmup before the boss battle.</p><div class="cq-eventactions"><button data-warmup="0">Fight now</button><button data-warmup="300">5 min warmup</button><button data-warmup="600">10 min warmup</button><button data-mode="training">Keep grinding</button></div>';
  } else {
    html =
      '<h3>' +
      (chapterInfo(Math.min(s.chapter, 10))?.title || 'FREEROAM') +
      '</h3><p>' +
      (s.mode === 'training' ? 'Train here. Return stronger.' : 'Keep pedaling. Your next level is ahead.') +
      '</p><span class="cq-sub">' +
      (running ? 'Pedaling \xB7 every second earns 1 XP.' : 'Connect your trainer, then start pedaling.') +
      '</span>';
  }
  return html;
}
function render() {
  if (s.reward && !rewardChoice)
    rewardChoice = rewardGesture.begin(
      performance.now(),
      (s.hp / maxHP()) * 100 < SMART_HEAL_BELOW ? 'heal' : 'coins'
    );
  if (!s.reward) rewardChoice = null;
  levelUp = levelUps.update(performance.now(), !!s.battle || s.reward || view === 'character');
  music.sync({
    battle: !!s.battle,
    rest: summaryDialog.open && !!s.session?.completed,
    levelUp: !!levelUp,
    paused: !running
  });
  const holding = !!s.battle || s.reward || !!levelUp || warmupSeconds > 0;
  if (lastHold !== holding) {
    lastHold = holding;
    clickArmed = false;
    parentSend({ type: 'hold', hold: holding, reward: s.reward });
  }
  if (lastRewardState !== s.reward) {
    lastRewardState = s.reward;
    parentSend({ type: 'reward-state', reward: s.reward });
  }
  setText(
    $('#live-status'),
    live.connected
      ? 'Trainer connected · ' + (running ? 'RIDING' : 'Ready to pedal')
      : 'Connect your smart trainer to ride.'
  );
  if (s.route) {
    const length = s.route.distance / METERS_PER_MILE;
    setText($('.cq-route .cq-windowtitle>span'), s.route.name);
    setText($('.cq-route .cq-grade'), currentGrade());
    setHTML(
      $('.cq-axis'),
      [0, 0.25, 0.5, 0.75, 1]
        .map(
          f =>
            '<span>' +
            (length * f + (s.route.windowStart || 0) / METERS_PER_MILE).toFixed(1) +
            (f === 0 || f === 1 ? ' mi' : '') +
            '</span>'
        )
        .join('')
    );
    setHTML(
      $('.cq-routefoot'),
      '<span><i class="cq-dot"></i> YOU <b>' +
        (s.routeMiles || 0).toFixed(1) +
        ' MI</b></span><span>' +
        (s.route.endless ? 'ENDLESS · <b>∞ MI</b> · ' : 'ROUTE <b>' + length.toFixed(1) + ' MI</b> · ') +
        (s.route.hasElevation
          ? fmt(s.route.endless ? routeAscent() : s.route.gain / 0.3048) + ' FT ASCENT'
          : 'NO ELEVATION DATA') +
        '</span>'
    );
  }
  const inBattle =
    !!s.battle ||
    s.reward ||
    !!levelUp ||
    warmupSeconds > 0 ||
    (s.miles >= 100 && s.mode === 'adventure' && s.chapter <= 10);
  $('.cq-route').classList.toggle('cq-combat', inBattle);
  $('.cq-event').hidden = !inBattle;
  const session = sessionMetrics(s, live);
  let L = level(),
    hp = maxHP(),
    remaining = threshold(L + 1) - s.xp;
  all('.cq-coinbalance').forEach(el => setText(el, fmt(s.coins || 0)));
  $('.cq-full').hidden = view === 'overlay' || view === 'devices';
  $('.cq-overlay').hidden = view !== 'overlay';
  $('.cq-layout').hidden = view === 'character';
  $('.cq-character').hidden = view !== 'character';
  all('.cq-hpnumber').forEach(e =>
    e.closest('.cq-overlaystats')
      ? setHTML(e, fmt(s.hp) + '<em> / ' + fmt(hp) + '</em>')
      : setText(e, fmt(s.hp) + ' / ' + hp)
  );
  all('.cq-totalxp').forEach(e => setText(e, fmt(s.xp)));
  all('.cq-nextxp').forEach(e => setText(e, fmt(remaining) + ' XP'));
  $('.cq-hpfill').style.width = Math.max(0, (s.hp / hp) * 100) + '%';
  $('.cq-xpmeter i').style.width = ((s.xp - threshold(L)) / cost(L)) * 100 + '%';
  setText($('.cq-player .cq-windowtitle .cq-gold'), 'LV ' + L);
  setStat('attack', fmt(atk()));
  setText($('.cq-characterhead .cq-gold'), L);
  setStat('to-next-label', 'To Level ' + (L + 1));
  setStat(
    'chapter-name',
    s.chapter + ' · ' + (chapterInfo(Math.min(s.chapter, 10))?.title || 'ALL CHAPTERS CLEARED')
  );
  setStat('chapter-distance', s.miles.toFixed(1) + ' / 100 MI');
  setStat('next-boss', s.boss?.name || makeBattle('boss', { chapter: Math.min(s.chapter, 10) }).name);
  setStat('ftp', riderFTP(s) + ' W' + (s.rider ? '' : ' · SET UP'));
  setStat('wkg', s.rider?.weightKg ? (riderFTP(s) / s.rider.weightKg).toFixed(1) + ' W/KG' : '— W/KG');
  setStat('save-location', cloud?.enabled ? 'THIS DEVICE + CLOUD' : 'THIS DEVICE');
  setText($('.cq-statuslabel'), s.mode === 'training' ? 'FREEROAM' : 'ADVENTURE');
  setHTML(
    $('.cq-topline>span'),
    '<span class="cq-gold">' +
      (s.mode === 'training' ? 'FREEROAM' : 'CHAPTER ' + s.chapter) +
      '</span> &nbsp; ' +
      (chapterInfo(Math.min(s.chapter, 10))?.title || 'ALL CHAPTERS CLEARED')
  );
  $('.cq-game').dataset.chapter = String(Math.min(s.chapter, CHAPTER_COUNT));
  setHTML($('.cq-mileage'), s.miles.toFixed(1) + ' <span>/ 100 MI</span>');
  $('.cq-chaptermeter i').style.width = s.miles + '%';
  setText(
    $('.cq-chapterhint'),
    s.mode === 'training'
      ? 'Freeroam: chapter progress paused.'
      : (100 - s.miles).toFixed(1) + ' miles to the chapter boss.'
  );
  setText($('.cq-bossname>b'), s.boss?.name || makeBattle('boss', { chapter: Math.min(s.chapter, 10) }).name);
  setText(
    $('.cq-bossname>span'),
    s.mode === 'training' ? 'Adventure only' : s.miles >= 100 ? 'Ready to challenge' : 'Not yet reached'
  );
  $('.cq-bossname').hidden = s.mode === 'training' || s.chapter > 10;
  setText(
    $('.cq-modehint'),
    s.mode === 'training'
      ? 'FREEROAM · Earn XP and coins without chapter progression.'
      : 'ADVENTURE · Complete the 100-mile chapter route.'
  );
  all('[data-mode]').forEach(b => b.classList.toggle('cq-active', b.dataset.mode === s.mode));
  setText($('#pedal'), running ? 'Pause pedaling' : 'Begin Adventure');
  setText($('.cq-message'), message);
  renderRideReadouts(session, L, remaining);
  const html = eventMarkup();
  if (html !== previousEvent) {
    patchMarkup($('.cq-event'), html);
    previousEvent = html;
  }
  renderHud(session, L, remaining);
  draw();
  syncFreeroamPicker();
  questBaseline?.sync();
  if (view === 'overlay') fitOverlayNumbers($('.cq-overlay'));
  syncFloating();
}
// ---- Ride HUD (ride-hud.js) --------------------------------------------------------
// While a ride is running the ride page becomes the big-number HUD: ROAD while exploring,
// COCKPIT during encounters, rewards and level-ups. MENU shows the classic screen; the
// "Ride display" button (or starting the next ride) brings the HUD back.
let hudDismissed = false,
  hudWasRunning = false;
const hud = mountRideHud(root, {
  onMenu: () => {
    hudDismissed = true;
    render();
  },
  // START RIDE begins right away; without a trainer it opens the devices page instead.
  onStart: () => parentSend({ type: live.connected ? 'start' : 'toggle' }),
  onOverlay: () => openFloating(),
  // SAVE & QUIT ends the ride and opens the ride summary (same as the classic button).
  onQuit: () => parentSend({ type: 'finish' }),
  onProfile: () => cycleHudProfile()
});
// Fight clock for the cockpit's TIME tile.
let fightClock = { battle: null, start: 0 };
function fightSeconds() {
  if (!s.battle) return 0;
  if (fightClock.battle !== s.battle.name + '|' + s.battle.max) {
    fightClock = { battle: s.battle.name + '|' + s.battle.max, start: s.rideSeconds };
  }
  return Math.max(0, s.rideSeconds - fightClock.start);
}
// Where the rider line sits across the ride display's profile (0–1), for the iris wipe.
function hudRiderFraction() {
  if (!s.route) return 0.2;
  const rel = (s.routeMiles || 0) * METERS_PER_MILE - (s.route.windowStart || 0),
    span = hudProfileMiles ? hudProfileMiles * METERS_PER_MILE : 0;
  if (!span || span >= s.route.distance) return rel / s.route.distance;
  const from = Math.max(0, Math.min(s.route.distance - span, rel - 2 * METERS_PER_MILE));
  return (rel - from) / span;
}
// Pedaling alone also starts the ride: whenever the ride page is open with a connected
// trainer and no ride running, ask the app to start the ride as soon as the rider pedals.
let hudArmed = false;
const hudReturn = document.createElement('button');
hudReturn.type = 'button';
hudReturn.id = 'hud-return';
hudReturn.textContent = 'Ride display';
hudReturn.hidden = true;
hudReturn.onclick = () => {
  hudDismissed = false;
  render();
};
$('.cq-controls').insertBefore(hudReturn, $('#float-overlay'));
const unit = (value, suffix) => value + '<em> ' + suffix + '</em>';
// Enemy cards, one per living enemy. The first is the one you are fighting (gold frame);
// the rest wait their turn.
function hudEnemyCards(b) {
  const enemies = (Array.isArray(b.enemies) ? b.enemies : [b]).filter(e => e.hp > 0);
  return enemies
    .map(
      (e, i) =>
        '<div class="cq-hud-enemy ' +
        (i === 0 ? 'cq-hud-active' : 'cq-hud-waiting') +
        '" style="--enemy-health:' +
        healthColor(e.hp, e.max) +
        '"><div class="cq-hud-enemyname"><span>' +
        safeText(e.name || b.name) +
        ' \xB7 LV ' +
        safeText(e.level || b.level || 1) +
        '</span>' +
        (enemies.length > 1 ? '<em>' + (i === 0 ? 'FIGHTING' : 'NEXT') + '</em>' : '') +
        '</div><span class="cq-hud-enemyhp">' +
        fmt(e.hp) +
        '<em> HP</em></span><div class="cq-hud-enemymeter"><i style="width:' +
        Math.max(0, Math.min(100, (e.hp / e.max) * 100)).toFixed(1) +
        '%"></i></div></div>'
    )
    .join('');
}
// Crit and exhaustion notes for the prompt band (the power tile already shows % FTP).
function hudEffortNotes(effort) {
  const crit = critBonus(effort);
  return (
    (crit > 0 ? 'CRIT +' + Math.round(crit * 100) + '% \xB7 ' : '') +
    (isExhausted(s.stamina)
      ? 'EXHAUSTED \u2212' + Math.round((1 - STAMINA.exhaustedDamage) * 100) + '% \xB7 '
      : '')
  );
}
function hudPrompt(b) {
  const watts = displayedPower(),
    effort = effortShare(watts, riderFTP(s)),
    damage = fmt(
      riderDamagePerSecond(atk(), watts, riderFTP(s)) *
        staminaDamageMultiplier(s.stamina) *
        phaseDamageFactor(b)
    ),
    lost = phaseAttack(b).toFixed(2) + ' HP LOST / SEC';
  if (b.kind === 'enemy')
    return {
      big: damage + ' DMG / SEC',
      small: hudEffortNotes(effort) + lost,
      countdown: '',
      state: critBonus(effort) > 0 ? 'crit' : ''
    };
  const p = bossPhase(b);
  let out;
  if (p.phase === 'brace')
    out = {
      big: 'BRACE',
      small: p.grace
        ? 'EASE DOWN NOW'
        : Math.round(p.braceShare * 100) + '% HELD \xB7 BIG HIT ' + fmt(p.bigHit) + ' HP',
      countdown: phaseClock(p.secondsLeft),
      state: 'brace'
    };
  else if (p.phase === 'counter')
    out = {
      big: p.counterLanded ? 'COUNTER \xD72' : 'NO OPENING',
      small: damage + ' DMG / SEC \xB7 ' + hudEffortNotes(effort) + lost,
      countdown: phaseClock(p.secondsLeft),
      state: p.counterLanded ? 'counter' : ''
    };
  else if (p.phase === 'enrage')
    out = {
      big: 'ENRAGED',
      small: damage + ' DMG / SEC \xB7 NO MORE BRACES',
      countdown: '',
      state: 'enrage'
    };
  else if (p.windup)
    out = {
      big: 'WIND-UP',
      small: 'EASE UNDER ' + braceWatts() + ' W TO BRACE',
      countdown: Math.ceil(p.secondsLeft) + 's',
      state: 'windup'
    };
  else
    out = {
      big: 'ATTACK',
      small: damage + ' DMG / SEC \xB7 BRACE IN',
      countdown: phaseClock(p.secondsLeft),
      state: critBonus(effort) > 0 ? 'crit' : ''
    };
  if (b.kind === 'summit' && p.phase !== 'brace' && b.stopped)
    out.small = 'RIDING AWAY IN ' + Math.ceil(BALANCE.summitEscapeSeconds - b.stopped) + 's';
  return out;
}
function renderHud(session, L, remaining) {
  const onRidePage = view === 'ride' && root.querySelector('.cq-game')?.dataset.cqPage === 'ride';
  const visible = onRidePage;
  if (running && !hudWasRunning) hudDismissed = false;
  hudWasRunning = running;
  const armable = onRidePage && live.connected && !running;
  if (armable && !hudArmed) parentSend({ type: 'arm' });
  hudArmed = armable;
  hudReturn.hidden = !hudDismissed;
  if (!visible || hudDismissed) {
    hud.update(null);
    return;
  }
  const watts = displayedPower(),
    ftp = riderFTP(s),
    effortPct = Math.round(effortShare(watts, ftp) * 100),
    hpMax = maxHP(),
    stamina = Math.round(Number.isFinite(s.stamina) ? s.stamina : STAMINA.max),
    exhausted = isExhausted(s.stamina),
    adventure = s.mode === 'adventure' && s.chapter <= CHAPTER_COUNT,
    hr = Number(live.heartRate) > 0 ? safeText(live.heartRate) : '\u2014',
    bossWaiting = s.miles >= 100 && s.mode === 'adventure' && s.chapter <= 10,
    encounter = !!s.battle || s.reward || !!levelUp || warmupSeconds > 0 || bossWaiting;
  const text = {
    power: unit(watts, 'W'),
    'power-sub': effortPct + '% FTP \xB7 GEAR ' + safeText(live.gear),
    hr: unit(hr, 'BPM'),
    coins: fmt(s.coins || 0),
    level: (adventure ? 'CH ' + s.chapter : 'FREEROAM') + ' \xB7 LV ' + L,
    'xp-left': fmt(remaining) + ' XP TO GO',
    'profile-view':
      (hudProfileMiles ? 'NEXT ' + hudProfileMiles + ' MI' : 'WHOLE ROUTE') + ' \xB7 TAP TO CHANGE',
    toast: performance.now() < roadsideNoticeUntil ? roadsideNotice : '',
    'chapter-title': adventure
      ? chapterInfo(s.chapter)?.title || ''
      : freeroamScaled()
        ? 'ENEMIES SCALED TO YOUR LEVEL'
        : 'CHAPTER ' + freeroamChapter() + ' ENEMIES',
    miles: adventure
      ? s.miles.toFixed(1) + '<em> / 100 MI</em>'
      : (s.routeMiles || 0).toFixed(1) + '<em> MI RIDDEN</em>',
    grade: currentGrade(),
    'boss-in': adventure && s.miles < 100 ? 'BOSS IN ' + (100 - s.miles).toFixed(1) + ' MI' : '',
    'cq-hud-hp-value': fmt(s.hp) + '<em> / ' + fmt(hpMax) + '</em>',
    'cq-hud-hp-label': 'HP',
    'cq-hud-stamina-value': stamina + '<em> %</em>',
    'cq-hud-stamina-label': exhausted ? 'EXHAUSTED' : 'STAMINA',
    time: clock(session.seconds),
    distance: unit(session.miles.toFixed(1), 'MI'),
    ascent: unit(fmt(routeAscent()), 'FT'),
    cadence: unit(Math.round(live.cadence), 'RPM'),
    speed: unit(live.speed.toFixed(1), 'MPH'),
    'level-c': 'LV ' + L,
    'power-c': unit(watts, 'W'),
    target: effortPct + '% FTP \xB7 GEAR ' + safeText(live.gear),
    effort: '',
    'hr-c': unit(hr, 'BPM'),
    'time-c': clock(session.seconds),
    'fight-time': s.battle ? 'FIGHT ' + phaseClock(fightSeconds()) : ''
  };
  text['start-label'] = !live.connected
    ? 'CONNECT TRAINER'
    : s.session && !s.session.completed
      ? 'RESUME RIDE'
      : 'START RIDE';
  text['start-hint'] = live.connected
    ? Number(live.cadence) >= 20 || displayedPower() >= 15
      ? 'Keep pedaling \u2014 starting\u2026'
      : 'or just start pedaling'
    : 'Connect your smart trainer to ride';
  const model = {
    riderFraction: hudRiderFraction(),
    idle: !running,
    mode: encounter ? 'cockpit' : 'road',
    text,
    fill: {
      xp: ((s.xp - threshold(L)) / cost(L)) * 100,
      progress: adventure ? s.miles : 0,
      'cq-hud-hp': (s.hp / hpMax) * 100,
      'cq-hud-stamina': stamina
    },
    aria: {
      xp: compactNumber(remaining) + ' XP to level ' + (L + 1),
      progress: adventure ? 'Chapter progress ' + s.miles.toFixed(1) + ' of 100 miles' : 'Freeroam',
      'cq-hud-hp': 'Health ' + fmt(s.hp) + ' of ' + fmt(hpMax),
      'cq-hud-stamina': 'Stamina ' + stamina + ' percent' + (exhausted ? ', exhausted' : '')
    },
    classes: {},
    blocks: {},
    exhausted
  };
  if (encounter) {
    const b = s.battle;
    if (b) {
      text.kind = { enemy: 'RANDOM ENCOUNTER', summit: 'SUMMIT BOSS', boss: 'CHAPTER BOSS' }[b.kind];
      const living = (Array.isArray(b.enemies) ? b.enemies : [b]).filter(e => e.hp > 0);
      text.title =
        living.length > 1
          ? living.map(e => e.name).join(' \xB7 ')
          : b.name +
            ' \xB7 LV ' +
            (b.level || 1) +
            (b.kind === 'boss'
              ? bossPhase(b).phase === 'enrage'
                ? ' \xB7 FINAL ROUND'
                : ' \xB7 ROUND ' +
                  Math.min(BOSS_FIGHT.boss.rounds, (b.round || 0) + 1) +
                  ' OF ' +
                  BOSS_FIGHT.boss.rounds
              : '');
      const prompt = hudPrompt(b);
      text['prompt-big'] = prompt.big;
      text['prompt-small'] = running ? prompt.small : 'PAUSED \xB7 START PEDALING TO RESUME';
      text.countdown = prompt.countdown;
      model.classes.prompt = prompt.state;
      model.blocks.enemies = hudEnemyCards(b);
      const p = b.kind === 'enemy' ? null : bossPhase(b);
      if (p?.phase === 'brace') {
        const ok = effortShare(watts, ftp) <= BOSS_FIGHT.braceEffort;
        text.target = 'UNDER ' + braceWatts() + ' W \xB7 GEAR ' + safeText(live.gear);
        text.effort = p.grace ? 'EASE DOWN' : ok ? 'BRACED \u2713' : 'EASE OFF';
        model.classes['power-tile'] = ok ? 'brace-ok' : p.grace ? '' : 'brace-high';
      } else if (p?.windup) text.target = 'BRACE SOON \xB7 GEAR ' + safeText(live.gear);
    } else {
      text.kind = s.reward
        ? 'VICTORY'
        : levelUp
          ? 'LEVEL UP'
          : warmupSeconds > 0
            ? 'BOSS WARMUP'
            : 'CHAPTER BOSS';
      text.title = s.reward
        ? 'CHOOSE YOUR REWARD'
        : !levelUp && bossWaiting && !warmupSeconds
          ? bossStats().name + ' AWAITS'
          : '';
      model.blocks.event = eventMarkup();
    }
  }
  hud.update(model);
}
// Freeroam chapter picker: every chapter the rider has reached.
const freeroamSelect = $('#freeroam-chapter');
function syncFreeroamPicker() {
  if (!freeroamSelect) return;
  const reached = Math.min(s.chapter, CHAPTER_COUNT);
  if (freeroamSelect.options.length !== reached + 1)
    freeroamSelect.innerHTML =
      '<option value="0">Scaled to me</option>' +
      Array.from(
        { length: reached },
        (_, i) =>
          '<option value="' +
          (i + 1) +
          '">' +
          (i + 1) +
          ' · ' +
          safeText(chapterInfo(i + 1).title) +
          '</option>'
      ).join('');
  freeroamSelect.value =
    Number(s.freeroamChapter) >= 1 ? String(Math.min(reached, Math.floor(s.freeroamChapter))) : '0';
  freeroamSelect.disabled = !!s.battle || s.reward;
  // Only Freeroam uses the picker; hiding it in Adventure keeps the side column short.
  freeroamSelect.closest('label').hidden = s.mode !== 'training';
}
if (freeroamSelect)
  freeroamSelect.onchange = () => {
    if (externalSaveChanged || s.battle || s.reward) return;
    s.freeroamChapter = Number(freeroamSelect.value);
    message = s.freeroamChapter
      ? 'Freeroam enemies now come from Chapter ' + s.freeroamChapter + ' at its fixed levels.'
      : 'Freeroam enemies now scale to your level.';
    save();
    render();
  };
function syncFloating() {
  if (!floating || floating.closed) return;
  const source = $('.cq-overlay');
  const clone = source.cloneNode(true);
  clone.hidden = false;
  clone.querySelectorAll('[data-float],[data-state]').forEach(e => e.remove());
  const markup = clone.outerHTML;
  if (markup !== floatingMarkup) {
    const host = floating.document.getElementById('cq-preview');
    patchMarkup(host, markup);
    floatingMarkup = markup;
    fitOverlayNumbers(host);
  }
}
// Shrink the big overlay readouts so they never run past their column, whatever the
// overlay window size or value length. Measured in the document that shows them.
const FIT_TARGETS = [
  ['.cq-overlaystats strong', 12],
  // Compact battle cards: enemy names, HP and the "3 ENEMIES" heading.
  ['.cq-mini-battle .cq-rat-hp', 11],
  ['.cq-mini-battle .cq-battleheading > span', 10]
];
function fitOverlayNumbers(scope) {
  if (!scope) return;
  // Enemy names: one line, shrunk to fit; wrap to two lines only if still too long.
  scope.querySelectorAll('.cq-mini-battle .cq-rat-name').forEach(el => {
    el.classList.remove('cq-name-wrap');
    el.style.removeProperty('font-size');
    if (!el.clientWidth || el.scrollWidth <= el.clientWidth) return;
    const view = el.ownerDocument.defaultView;
    const base = parseFloat(view.getComputedStyle(el).fontSize) || 16;
    const size = Math.max(11, Math.floor((base * el.clientWidth) / el.scrollWidth));
    el.style.setProperty('font-size', size + 'px', 'important');
    if (el.scrollWidth > el.clientWidth) el.classList.add('cq-name-wrap');
  });
  for (const [selector, minimum] of FIT_TARGETS)
    scope.querySelectorAll(selector).forEach(el => {
      el.style.removeProperty('font-size');
      if (!el.clientWidth || el.scrollWidth <= el.clientWidth) return;
      const view = el.ownerDocument.defaultView;
      const base = parseFloat(view.getComputedStyle(el).fontSize) || 40;
      const size = Math.max(minimum, Math.floor((base * el.clientWidth) / el.scrollWidth));
      el.style.setProperty('font-size', size + 'px', 'important');
    });
}
async function openFloating() {
  try {
    if (floating && !floating.closed) {
      floating.focus();
      return;
    }
    const alwaysOnTop = 'documentPictureInPicture' in window || 'documentPictureInPicture' in window.parent;
    const width = Math.max(600, Math.min(1600, Math.round(screen.availWidth * 0.8))),
      height = 170,
      left = Math.round((screen.availWidth - width) / 2),
      top = Math.max(0, screen.availHeight - height - 40);
    if (window.parent !== window && window.parent.openCycleQuestOverlay) {
      floating = await window.parent.openCycleQuestOverlay({ width, height });
    } else if (alwaysOnTop) {
      floating = await window.documentPictureInPicture.requestWindow({
        width,
        height,
        preferInitialWindowPlacement: true
      });
    } else {
      floating = window.open(
        '',
        'cycle-quest-overlay',
        'popup,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top
      );
    }
    if (!floating) {
      message = 'Allow popups to open the floating overlay.';
      render();
      return;
    }
    const doc = floating.document;
    doc.head.replaceChildren();
    doc.title = 'Cycle Quest — Overlay';
    document.querySelectorAll('style,link[rel=stylesheet]').forEach(e => doc.head.append(e.cloneNode(true)));
    const style = doc.createElement('style');
    style.textContent =
      'html,body{margin:0!important;padding:0!important;height:100%!important;overflow:hidden!important;background:#07112c}#cq-preview{height:auto!important;max-width:none!important;width:100%!important;display:block!important}#cq-preview .cq-overlay{margin:0!important;border-radius:0!important;box-shadow:none!important}';
    doc.head.append(style);
    doc.body.replaceChildren();
    const host = doc.createElement('div');
    host.id = 'cq-preview';
    doc.body.append(host);
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-reward]');
      if (b) choose(b.dataset.reward);
    });
    doc.addEventListener('keydown', rewardKey);
    floatingMarkup = '';
    floating.addEventListener('resize', () => {
      floatingMarkup = '';
      draw();
      syncFloating();
    });
    floating.addEventListener('pagehide', () => {
      floating = null;
      floatingMarkup = '';
    });
    message = alwaysOnTop
      ? 'Always-on-top overlay opened.'
      : 'Floating window opened. Always-on-top requires a browser with Document Picture-in-Picture.';
    render();
  } catch {
    message = 'Could not open the overlay. Try Chrome or Edge on desktop.';
    render();
  }
}
$('#float-overlay').onclick = openFloating;
const bestiaryButton = document.createElement('button');
bestiaryButton.textContent = 'Bestiary & credits';
bestiaryButton.className = 'cq-choice';
$('.cq-character').append(bestiaryButton);
bestiaryButton.onclick = () => {
  const chapter = s.mode === 'adventure' ? Math.min(s.chapter, CHAPTER_COUNT) : freeroamChapter(),
    band = freeroamScaled()
      ? { min: Math.max(1, level() - BALANCE.scaledLevelsBelow), max: level() }
      : chapterLevels(chapter, s.mode === 'adventure' ? s.miles : null),
    visible = chapterMonsters(chapter),
    boss = makeBattle('boss', { chapter });
  document.getElementById('bestiary-current').textContent =
    'CHAPTER ' +
    chapter +
    ' · ENEMIES LV ' +
    band.min +
    '–' +
    band.max +
    ' · BOSS: ' +
    boss.name +
    ' LV ' +
    boss.level;
  document.getElementById('bestiary-rows').innerHTML = visible
    .map(m => {
      const low = makeBattle('enemy', { monsterId: m.id, level: band.min }),
        high = makeBattle('enemy', { monsterId: m.id, level: band.max });
      return (
        '<tr><td>' +
        safeText(m.name) +
        '</td><td>' +
        band.min +
        '–' +
        band.max +
        '</td><td>' +
        fmt(low.hp) +
        '–' +
        fmt(high.hp) +
        '</td><td>' +
        low.dps.toFixed(2) +
        '–' +
        high.dps.toFixed(2) +
        '</td><td>' +
        low.reward +
        '–' +
        high.reward +
        '</td></tr>'
      );
    })
    .join('');
  document.getElementById('bestiary-dialog').showModal();
};

function routeAscent() {
  if (s.route?.endless) return Math.max(0, Number(live.ascentFeet) || 0);
  if (!s.route) return 0;
  const m = (s.routeMiles || 0) * METERS_PER_MILE;
  let gain = 0;
  for (let i = 1; i < s.route.points.length; i++) {
    const a = s.route.points[i - 1],
      b = s.route.points[i];
    if (a.d >= m) break;
    gain += Math.max(0, (m >= b.d ? b.e : sample(s.route, m)) - a.e);
  }
  return gain / 0.3048;
}
let pendingRoute = null;
const routeDialog = document.getElementById('route-dialog'),
  distanceInput = document.getElementById('route-distance'),
  terrainInput = document.getElementById('route-terrain'),
  gainInput = document.getElementById('route-gain'),
  routeUse = document.getElementById('route-use'),
  routeGenerate = document.getElementById('route-generate'),
  routeError = document.getElementById('route-error');
function canPlan() {
  if (externalSaveChanged) {
    message = 'Character changed in another tab. Reload this page.';
    render();
    return false;
  }
  if (s.battle || s.reward || levelUp) {
    message = 'Finish your encounter or level-up celebration before changing routes.';
    render();
    return false;
  }
  running = false;
  parentSend({ type: 'pause' });
  render();
  return true;
}
function openPlanner(imported = false) {
  pendingRoute = null;
  routeError.textContent = '';
  document.getElementById('route-summary').textContent = '';
  document.getElementById('route-preview').innerHTML = '';
  routeUse.disabled = true;
  routeGenerate.hidden = imported;
  document.querySelector('.cq-routefields').hidden = imported;
  document.getElementById('route-dialog-title').textContent = imported
    ? 'UPLOADED ROUTE'
    : 'CREATE YOUR ROUTE';
  routeDialog.showModal();
}
function previewRoute(route) {
  pendingRoute = route;
  routeUse.disabled = false;
  document.getElementById('route-summary').textContent =
    route.name +
    ' · ' +
    (route.distance / METERS_PER_MILE).toFixed(1) +
    ' miles · ' +
    (route.hasElevation
      ? fmt(route.gain / 0.3048) + ' ft ascent'
      : 'Elevation unavailable — flat simulation');
  document.getElementById('route-preview').innerHTML = elevationSVG(route, sample, 600, 150, 0, false);
}
$('#create-route').onclick = () => {
  if (canPlan()) openPlanner();
};
$('#story-route').onclick = () => {
  if (canPlan() && loadStoryRoute()) {
    render();
  }
};
function useRoute(route) {
  profileInspect = null;
  s.route = route;
  s.routeMiles = 0;
  s.mode = 'training';
  s.summitDoneEnd = null;
  s.pendingSummit = null;
  summitChoices.clear();
  summitSeen.clear();
  lastLiveDistance = 0;
  parentSend({ type: 'route', route: s.route });
  view = 'ride';
  message = route.endless
    ? 'Endless ride ready. Pedal to gain XP and battle monsters; chapter progress is paused.'
    : 'Route loaded: ' + s.route.name + '. Start pedaling when ready.';
  if (routeDialog.open) routeDialog.close();
  save();
  render();
}
$('#surprise-route').onclick = () => {
  if (!canPlan()) return;
  const terrain = ['flat', 'rolling', 'climbing', 'punchy'][Math.floor(Math.random() * 4)],
    miles = 10 + Math.floor(Math.random() * 31);
  useRoute(generateRoute(miles, terrain));
};
$('#endless-route').onclick = () => {
  if (!canPlan()) return;
  const route = generateRoute(5, terrainInput.value);
  route.endless = true;
  route.windowStart = 0;
  route.name = 'Endless ' + route.terrain + ' ride';
  useRoute(route);
};
terrainInput.onchange = () => {
  gainInput.placeholder = 'Natural terrain';
};
routeGenerate.onclick = () => {
  try {
    routeError.textContent = '';
    previewRoute(
      generateRoute(
        Number(distanceInput.value),
        terrainInput.value,
        gainInput.value.trim() === '' ? null : Number(gainInput.value)
      )
    );
  } catch (e) {
    routeError.textContent = e.message;
  }
};
routeUse.onclick = () => {
  if (pendingRoute) useRoute(pendingRoute);
};
$('#upload-gpx').onclick = () => {
  if (canPlan()) $('#gpxfile').click();
};
$('#gpxfile').onchange = async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  openPlanner(true);
  try {
    if (file.size > 20 * 1024 * 1024) throw Error('GPX file is too large (20 MB maximum).');
    previewRoute(parseGPX(await file.text()));
  } catch (err) {
    routeError.textContent = err.message;
  }
};

root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-close-shop')) {
    shopDialog.close();
    return;
  }
  if (b.dataset.float) openFloating();
  if (b.dataset.state === 'overlay') {
    openFloating();
  } else if (b.dataset.state) {
    view = b.dataset.state;
    questBaseline?.setPage(view === 'character' ? 'character' : 'ride');
    render();
  }
  if (b.dataset.mode) {
    if (s.battle || s.reward) return;
    if (b.dataset.mode === 'adventure') {
      if (loadStoryRoute()) {
        render();
      }
    } else {
      s.mode = 'training';
      // The setup screen's FREEROAM tab only picks the mode; RIDE starts it.
      if (!b.closest('.cq-setup')) showEncounterView();
      save();
      render();
    }
  }
  if (b.dataset.demo) encounter(b.dataset.demo);
  if (b.dataset.warmup !== undefined) {
    warmupSeconds = Number(b.dataset.warmup);
    if (!warmupSeconds) encounter('boss');
    else {
      message = 'Pedal to warm up for the boss.';
      render();
    }
  }
  if (b.dataset.reward) choose(b.dataset.reward);
});
$('#pedal').onclick = () => parentSend({ type: 'toggle' });
$('#quest-connect').onclick = () => parentSend({ type: 'connect' });
$('#quest-finish').onclick = () => parentSend({ type: 'finish' });
$('#export').onclick = () => {
  const blob = new Blob([invalidStoredSave && persistedSave ? persistedSave : JSON.stringify(s, null, 2)], {
      type: 'application/json'
    }),
    u = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = u;
  a.download = 'cycle-quest-save.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
$('#import').onclick = () => {
  if (invalidStoredSave) {
    $('#savefile').click();
    return;
  }
  if (live.activityStartTime && !live.routeComplete) {
    message = 'Finish the current ride before importing another character.';
    render();
    return;
  }
  if (canPlan()) $('#savefile').click();
};
$('#savefile').onchange = async e => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) throw Error('Save file is too large');
    const v = readCharacter(await file.text());
    if (localStorage.getItem(key) !== persistedSave || (!invalidStoredSave && externalSaveChanged))
      throw Error('Character changed in another tab. Reload before importing.');
    if (
      persistedSave &&
      !window.confirm(
        'Replace this device’s character with the imported save? Your current save will be kept as a pre-import backup.'
      )
    )
      return;
    if (persistedSave) localStorage.setItem(key + '-pre-import-backup', persistedSave);
    s = v;
    historyText = null;
    if (!s.route) {
      s.route = generateRoute(15, 'rolling');
      s.routeMiles = 0;
    }
    invalidStoredSave = false;
    externalSaveChanged = false;
    levelUps.clear();
    levelUp = null;
    running = false;
    s.hp = Math.min(maxHP(), s.hp);
    warmupSeconds = 0;
    restoreRewardState();
    lastLiveDistance = (s.routeMiles || 0) * METERS_PER_MILE;
    if (s.route) parentSend({ type: 'route', route: s.route, restoreMiles: s.routeMiles || 0 });
    save({ force: true });
    message = 'Save imported. Ready to ride.';
    render();
  } catch (err) {
    message = 'Could not import: ' + err.message;
    render();
  } finally {
    e.target.value = '';
  }
};
root.addEventListener('keydown', rewardKey);
window.addEventListener('pagehide', () => {
  save({ force: true });
  cloud?.flush();
  music.dispose();
});
window.addEventListener('storage', e => {
  if (e.key === key && e.newValue !== persistedSave) {
    externalSaveChanged = true;
    running = false;
    parentSend({ type: 'pause' });
    message = 'Character changed in another tab. Reload before continuing.';
    render();
  }
});
new ResizeObserver(draw).observe(root);
load();
if (!invalidStoredSave && !s.rider) riderProfile.open();
// Cloud save: replaces this device's character with one loaded by save code.
function adoptCloudCharacter(saveText, historyText) {
  if (s.battle || s.reward || (live.activityStartTime && !live.routeComplete)) {
    message = 'Finish your ride and any battle before loading a cloud save.';
    render();
    return false;
  }
  let next, history;
  try {
    next = readCharacter(saveText);
    history = historyText ? JSON.parse(historyText) : [];
    if (!validLedger(history)) history = next.workouts || [];
  } catch {
    message = 'That cloud save could not be read.';
    render();
    return false;
  }
  if (
    persistedSave &&
    !window.confirm('Replace this device’s character with the cloud save? A backup of this one is kept.')
  )
    return false;
  if (persistedSave) localStorage.setItem(key + '-pre-cloud-backup', persistedSave);
  s = next;
  s.workouts = history;
  if (!s.route) {
    s.route = generateRoute(15, 'rolling');
    s.routeMiles = 0;
  }
  invalidStoredSave = false;
  externalSaveChanged = false;
  levelUps.clear();
  levelUp = null;
  running = false;
  warmupSeconds = 0;
  s.hp = Math.min(maxHP(), s.hp);
  restoreRewardState();
  lastLiveDistance = (s.routeMiles || 0) * METERS_PER_MILE;
  historyText = null;
  persistedSave = localStorage.getItem(key);
  parentSend({ type: 'route', route: s.route, restoreMiles: s.routeMiles || 0 });
  save({ force: true });
  message = 'Cloud save loaded. Ready to ride.';
  render();
  return true;
}
cloud = createCloudSave({
  root,
  getSnapshot: () => ({ save: characterText(s), history: JSON.stringify(s.workouts || []) }),
  onLoad: adoptCloudCharacter,
  onChange: () => {
    if (!externalSaveChanged) $('#save-state').textContent = 'Saved on this device' + cloud.statusSuffix();
    setStat('save-location', cloud.enabled ? 'THIS DEVICE + CLOUD' : 'THIS DEVICE');
  }
});
const cloudButton = document.createElement('button');
cloudButton.type = 'button';
cloudButton.id = 'cq-open-cloud';
cloudButton.textContent = 'Cloud save';
characterMenu().append(cloudButton);
cloudButton.onclick = () => cloud.open();
cloud.check();
questBaseline = mountQuestBaseline({
  root,
  getState: () => s,
  getLive: () => live,
  getView: () => view,
  changeView: next => {
    view = next;
    render();
  },
  openOverlay: openFloating,
  routeSVG: route => elevationSVG(route, sample, 1000, 250, 0, false),
  parentSend,
  getCharacter: () => ({
    name: $('.cq-player h2')?.textContent || 'RIDER',
    level: level(),
    hp: Math.round(s.hp),
    maxHP: maxHP(),
    ftp: riderFTP(s),
    coins: s.coins || 0
  }),
  getRouteSummits: () => currentSummits()
});
questBaseline.sync();
if (!s.route) {
  s.route = generateRoute(15, 'rolling');
  s.routeMiles = 0;
}
function claimWorkout(workout, chapterCredit) {
  if (externalSaveChanged || localStorage.getItem(key) !== persistedSave)
    throw Error('This character changed in another tab. Reload before claiming a workout.');
  const before = level(),
    { state: next, result } = creditWorkout(s, workout, chapterCredit),
    after = level(next.xp);
  if (after > before) next.hp = maxHP(after);
  if (next.xp > MAX_XP)
    throw Error('This reward exceeds the current character XP limit. Export your save first.');

  if (result.bossReady && !next.boss) next.boss = makeBattle('boss', { chapter: next.chapter });
  const text = characterText(next);
  try {
    localStorage.setItem(key, text);
    localStorage.setItem(historyKey, (historyText = JSON.stringify(next.workouts || [])));
  } catch {
    throw Error(
      'Could not save the reward on this device. Export your save or free browser storage, then try again.'
    );
  }
  s = next;
  persistedSave = text;
  if (after > before) levelUps.enqueue(before, after);
  view = 'ride';
  message =
    'Workout recorded! +' +
    fmt(result.xp) +
    ' XP' +
    (result.miles ? ' · +' + result.miles.toFixed(2) + ' chapter miles' : '') +
    '.' +
    (result.bossReady ? ' Your chapter boss awaits.' : '');
  render();
}
function rememberIndoor(m) {
  if (Number.isFinite(m.demoSeconds) || !m.connected || !m.running || !(m.power > 0 && m.cadence > 0)) return;
  const start = Date.parse(m.activityStartTime);
  if (!Number.isFinite(start)) return;
  const end = Date.now(),
    id = 'indoor:' + start;
  s.workouts ||= [];
  const entry = s.workouts.find(w => w.id === id);
  if (entry) entry.end = Math.max(entry.end, end);
  else if (s.workouts.length < 5000)
    s.workouts.push({
      id,
      name: 'Ride Breakaway indoor ride',
      kind: 'indoor',
      family: 'cycling',
      source: 'Ride Breakaway',
      start,
      end,
      day: dayAt(start),
      xp: 0,
      miles: 0
    });
}
initWorkoutUI({ root, getState: () => s, apply: claimWorkout, canOpen: canPlan });
window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== window.parent || e.data?.source !== 'breakaway') return;
  const m = e.data;
  if (externalSaveChanged) {
    parentSend({ type: 'pause' });
    return;
  }
  if (m.type === 'quest-audio-visibility') {
    music.suspend(!m.active);
    if (m.active) parentSend({ type: 'quest-page', page: questBaseline?.getPage?.() || 'route' });
    return;
  }
  if (m.type === 'notice') {
    message = String(m.message || '');
    render();
    return;
  }
  if (m.type === 'navigate') {
    if (['route', 'devices', 'ride', 'overlay', 'character'].includes(m.page)) {
      view = m.page === 'overlay' ? 'overlay' : m.page === 'character' ? 'character' : 'ride';
      questBaseline?.setPage(m.page);
      render();
    }
    return;
  }
  if (m.type === 'recover-ride') {
    if (m.route && Array.isArray(m.route.points) && Number.isFinite(m.distanceM)) {
      s.route = { ...s.route, ...m.route };
      s.routeMiles = m.distanceM / METERS_PER_MILE;
      lastLiveDistance = m.distanceM;
      lastLiveTime = 0;
      running = false;
      // Reassert encounter resistance holds after the parent engine reloads.
      lastHold = null;
      message = 'Ride recovered and paused. Reconnect your trainer to resume.';
      save();
      render();
    }
    return;
  }
  if (m.type === 'telemetry') {
    const now = performance.now(),
      dt = lastLiveTime ? Math.min(3, (now - lastLiveTime) / 1000) : 0;
    lastLiveTime = now;
    live = m;
    if (m.running && m.activityStartTime && (!s.session || s.session.id !== m.activityStartTime)) {
      s.session = {
        id: m.activityStartTime,
        startXP: s.xp,
        startLevel: level(),
        startAttack: atk(),
        startMiles: s.rideMiles,
        startSeconds: s.rideSeconds,
        startCoins: s.coins || 0,
        startAscentFeet: Number(m.ascentFeet) || 0,
        powerWattSeconds: 0,
        powerSeconds: 0,
        heartRateBpmSeconds: 0,
        heartRateSeconds: 0,
        monsters: 0,
        bosses: 0,
        best20: 0,
        completed: false
      };
      s.stamina = STAMINA.max;
      // The first fight of a ride comes quickly, so short rides get into the action.
      if (!s.battle && !s.reward) s.nextEncounter = encounterDelay(true);
      powerWindow = createPowerWindow();
    }
    if (s.session && !s.session.completed && m.running && dt > 0) {
      const sampleSeconds = Math.min(3, Math.max(0, dt));
      s.session.powerWattSeconds =
        (s.session.powerWattSeconds || 0) + Math.max(0, Number(m.power) || 0) * sampleSeconds;
      s.session.powerSeconds = (s.session.powerSeconds || 0) + sampleSeconds;
      s.session.best20 = Math.max(s.session.best20 || 0, powerWindow.add(m.power, sampleSeconds));
      const hr = Number(String(m.heartRate ?? '').replace(/[^0-9.]/g, ''));
      if (Number.isFinite(hr) && hr >= 30 && hr <= 240) {
        s.session.heartRateBpmSeconds = (s.session.heartRateBpmSeconds || 0) + hr * sampleSeconds;
        s.session.heartRateSeconds = (s.session.heartRateSeconds || 0) + sampleSeconds;
      }
    }
    rewardGesture.sample(now, m.cadence);
    if (s.reward && rewardChoice) rewardGesture.update(rewardChoice, now, m.cadence, m.power, m.connected);
    rememberIndoor(m);
    if (s.route?.endless && m.routeProfile) {
      s.route = { ...s.route, ...m.routeProfile };
    }
    if (m.buttonsReleased) clickArmed = true;
    power = Math.max(0, Math.round(m.power));
    running = !!m.running && !!m.connected;
    const previousDistance = lastLiveDistance;
    const delta = Math.max(0, m.distanceM - lastLiveDistance);
    lastLiveDistance = m.distanceM;
    if (!s.route?.endless) {
      // A summit boss waits at the top of each of the route's biggest climbs (routeSummits).
      const ends = currentSummits(),
        done = summitsDone();
      summitChoices.clear();
      for (const end of ends) if (!done.includes(Math.round(end))) summitChoices.set(Math.round(end), true);
      const next = ends.find(
        end => previousDistance < end && m.distanceM >= end && !done.includes(Math.round(end))
      );
      if (m.running && next !== undefined && !s.pendingSummit)
        s.pendingSummit = { end: next, category: 'SUMMIT' };
      const pending = s.pendingSummit;
      if (pending && !s.battle && !s.reward && !levelUp && hpReadyForBattle() && m.connected) {
        encounter('summit');
        if (s.battle?.kind === 'summit') {
          s.battle.category = pending.category;
          s.summitsDone = {
            route: summitRouteKey(),
            ends: [...summitsDone(), Math.round(pending.end)].slice(-12)
          };
          s.pendingSummit = null;
          save();
        }
      }
    } else {
      for (const c of Array.isArray(m.climbs) ? m.climbs : []) {
        const id = Math.round(c.end);
        if (!summitChoices.has(id)) summitChoices.set(id, Math.random() < 0.25);
        if (
          previousDistance < c.end &&
          m.distanceM >= c.end &&
          summitChoices.get(id) &&
          !summitSeen.has(id) &&
          !s.battle &&
          !s.reward &&
          !levelUp
        ) {
          summitSeen.add(id);
          encounter('summit');
          if (s.battle?.kind === 'summit') {
            s.battle.category = c.category;
          }
        }
      }
    }
    if (!s.battle && !s.reward && !levelUp && running) {
      s.rideMiles += delta / METERS_PER_MILE;
      if (s.mode === 'adventure') s.miles = Math.min(100, s.miles + delta / METERS_PER_MILE);
      if (
        s.mode === 'adventure' &&
        s.route?.storyChapter === s.chapter &&
        m.distanceM >= s.route.distance - 0.01
      )
        s.miles = 100;
      s.routeMiles = m.distanceM / METERS_PER_MILE;
      if (s.miles >= 100 && s.mode === 'adventure' && s.chapter <= 10) {
        // Chapter boss reached: wait for the rider to pick a warmup or fight now.
      } else if (power > 0 && m.cadence > 0 && warmupSeconds <= 0) {
        if (!s.battle) {
          s.nextEncounter = Math.max(0, s.nextEncounter - dt);
          if (s.nextEncounter <= 0 && encounterAllowedOnGrade(m.grade)) encounter('enemy');
          else if (delta > 0) {
            const find = exploreRoadside(s, delta / METERS_PER_MILE);
            if (find) {
              if (find.repair) s.hp = Math.min(maxHP(), s.hp + Math.round(maxHP() * 0.25));
              roadsideNotice = find.text;
              roadsideNoticeUntil = performance.now() + 8000;
              message = find.text;
              save();
            }
          }
        }
      }
    }

    if (running) {
      let remaining = dt;
      while (remaining > 0) {
        const part = Math.min(0.1, remaining);
        step(part);
        remaining -= part;
      }
    }
    if (!s.route?.endless && s.summitDoneEnd != null && !s.pendingSummit && !s.battle)
      parentSend({ type: 'summit-resolved' });
    if (m.routeComplete) {
      running = false;
      if (s.mode === 'adventure' && s.chapter <= 10) {
        s.miles = 100;
        s.routeMiles = 100;
        bossStats();
      }
      finishQuestSummary();
      message =
        s.mode === 'adventure'
          ? 'Defeat the chapter boss to unlock the next Story route.'
          : 'Freeroam ride complete; rewards saved.';
    }
    render();
    if (++saveTick >= 50) {
      save();
      saveTick = 0;
    }
  } else if (m.type === 'ride-finished') {
    finishQuestSummary();
  } else if (m.type === 'indoor-history') {
    s.workouts ||= [];
    for (const w of (Array.isArray(m.workouts) ? m.workouts : []).slice(0, 5000)) {
      const start = Date.parse(w.start),
        end = Date.parse(w.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || s.workouts.length >= 5000)
        continue;
      const id = 'indoor:' + start;
      if (!s.workouts.some(e => e.id === id))
        s.workouts.push({
          id,
          name: 'Ride Breakaway indoor ride',
          kind: 'indoor',
          family: 'cycling',
          source: 'Ride Breakaway',
          start,
          end,
          day: dayAt(start),
          xp: 0,
          miles: 0
        });
    }
    save();
  } else if (m.type === 'click') {
    if (!m.plus && !m.minus) {
      clickArmed = true;
      return;
    }
    if (s.reward && clickArmed) {
      clickArmed = false;
      choose(m.plus ? 'coins' : 'heal');
    }
  }
});
function rewardKey(e) {
  if (e.target.matches('input,select,textarea,[contenteditable=true]')) return;
  if (s.reward && ['-', '+', '='].includes(e.key)) {
    e.preventDefault();
    choose(e.key === '-' ? 'heal' : 'coins');
  }
}
function rewardLabel() {
  const r = s.pendingReward;
  if (!r) return '';
  return (
    '+' +
    r.xp +
    ' XP EARNED · ' +
    (rewardChoice?.selected === 'heal'
      ? 'HEAL ' + fmt(Math.round((maxHP() * r.healPercent) / 100)) + ' HP'
      : 'BONUS +' + fmt(r.coinsPaid ? r.bonusCoins || 0 : r.coins) + ' COINS') +
    ' · ' +
    Math.max(0, Math.ceil(((rewardChoice?.end || 0) - performance.now()) / 1000)) +
    's'
  );
}

setInterval(() => {
  if (externalSaveChanged) return;
  if (s.reward && rewardChoice && performance.now() >= rewardChoice.end) {
    choose(rewardChoice.selected);
    return;
  }
  if (s.reward || levelUp || levelUps.waiting) render();
}, 200);
const routeMusicButton = musicButton.cloneNode(true);
routeMusicButton.id = 'quest-route-music';
routeMusicButton.onclick = () => music.toggle();
root.querySelector('.cq-workflow-overview')?.append(routeMusicButton);
lastLiveDistance = (s.routeMiles || 0) * METERS_PER_MILE;
if (!invalidStoredSave) render();
if (!invalidStoredSave) parentSend({ type: 'route', route: s.route, restoreMiles: s.routeMiles || 0 });
parentSend({ type: 'ready' });
