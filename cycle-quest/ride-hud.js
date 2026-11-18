// Ride HUD: the full-screen view on the ride page, sized to read from about 6 feet on a 13"
// laptop. Two layouts designed at 1440×900, scaled to the window and stretched to fill it:
//   ROAD     (exploring)  power and heart rate in the top corners (gear and coins under them),
//                         level, XP, chapter and buttons in the middle, the next 10 miles of
//                         road, HP and stamina bars, and five ride stats along the bottom.
//   COCKPIT  (encounters) power (with gear) and heart rate, then the enemies and time, then the
//                         damage band (or boss phase), then HP and stamina. Rewards, level-ups
//                         and the boss warmup take over the enemy and damage rows.
// Moving between the two plays an iris wipe that closes on the rider and opens on the fight.
// Windows use the same framed style as the setup screen. The game computes a plain model each
// frame (see renderHud in game.js); this module only draws it, skipping unchanged DOM writes.
const STAGE_W = 1440,
  STAGE_H = 900,
  IRIS_MS = 420;

const menuIcon =
  '<svg width="28" height="22" viewBox="0 0 28 22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3"><path d="M2 3h24M2 11h24M2 19h24"/></svg>';
const coinIcon =
  '<svg width="36" height="36" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12" fill="#e0b52f" stroke="#fff2a6" stroke-width="3"/><path d="M15 9v12" stroke="#7a5a00" stroke-width="3"/></svg>';
const bar = (cls, label) =>
  `<div class="cq-hud-bar ${cls}" role="img" data-h-aria="${cls}">` +
  `<i data-h-fill="${cls}"></i>` +
  (cls === 'cq-hud-stamina' ? '<b class="cq-hud-line" title="Below 25%: exhausted"></b>' : '') +
  `<span class="cq-hud-barlabel" data-h="${cls}-label">${label}</span>` +
  `<span class="cq-hud-barvalue" data-h="${cls}-value" data-h-html></span></div>`;
const stat = (key, label) =>
  `<div class="cq-hud-stat cq-hud-window"><small>${label}</small><strong data-h="${key}" data-h-html></strong></div>`;
const button = (attr, label, extra = '') =>
  `<button type="button" class="cq-hud-small" ${attr}${extra}>${label}</button>`;

const MARKUP =
  `<div class="cq-hud-stage">` +
  // ---- ROAD (exploring) ----
  `<div class="cq-hud-road">` +
  `<section class="cq-hud-top">` +
  `<div class="cq-hud-corner"><small>POWER</small><strong class="cq-hud-hero" data-h="power" data-h-html></strong><span class="cq-hud-sub" data-h="power-sub"></span></div>` +
  `<div class="cq-hud-center">` +
  `<div class="cq-hud-levelrow"><span class="cq-hud-gold" data-h="level"></span>` +
  `<div class="cq-hud-xp" role="img" data-h-aria="xp"><i data-h-fill="xp"></i><span data-h="xp-left"></span></div></div>` +
  `<span class="cq-hud-chapter" data-h="chapter-title"></span>` +
  `<span class="cq-hud-miles" data-h="miles" data-h-html></span>` +
  `<div class="cq-hud-progress" role="img" data-h-aria="progress"><i data-h-fill="progress"></i></div>` +
  `<div class="cq-hud-buttons">` +
  button('data-hud-menu', 'MENU', ' aria-label="Show menu and ride controls"') +
  button('data-hud-overlay', 'OVERLAY', ' aria-label="Open the always-on-top overlay"') +
  `<button type="button" class="cq-hud-small cq-hud-quit" data-hud-quit data-h="quit-label"></button>` +
  `</div></div>` +
  `<div class="cq-hud-corner cq-hud-right"><small>HEART RATE</small><strong class="cq-hud-hero" data-h="hr" data-h-html></strong>` +
  `<span class="cq-hud-coins">${coinIcon}<b data-h="coins"></b><small>COINS</small></span></div>` +
  `</section>` +
  `<section class="cq-hud-road-profile cq-hud-window">` +
  `<div class="cq-profile cq-hudprofile" role="button" tabindex="0" aria-label="Elevation ahead. Tap to show 10 miles, 5 miles or the whole route."></div>` +
  `<span class="cq-hud-grade" data-h="grade"></span><span class="cq-hud-bossin" data-h="boss-in"></span>` +
  `<span class="cq-hud-view" data-h="profile-view"></span>` +
  `<span class="cq-hud-toast" role="status" data-h="toast"></span>` +
  // Before the ride starts: START RIDE, or simply start pedaling.
  `<div class="cq-hud-start" hidden><button type="button" data-hud-start data-h="start-label"></button>` +
  `<span data-h="start-hint"></span></div></section>` +
  `<section class="cq-hud-bars cq-hud-bars-row">` +
  bar('cq-hud-hp', 'HP') +
  bar('cq-hud-stamina', 'STAMINA') +
  `</section>` +
  `<section class="cq-hud-stats">` +
  stat('time', 'TIME') +
  stat('distance', 'DISTANCE') +
  stat('ascent', 'ASCENT') +
  stat('cadence', 'CADENCE') +
  stat('speed', 'SPEED') +
  `</section>` +
  `</div>` +
  // ---- COCKPIT (encounters) ----
  `<div class="cq-hud-cockpit">` +
  `<header class="cq-hud-head"><span class="cq-hud-gold" data-h="kind"></span><span class="cq-hud-title" data-h="title"></span>` +
  `<span class="cq-hud-gold" data-h="level-c"></span>` +
  button('data-hud-overlay', 'OVERLAY', ' aria-label="Open the always-on-top overlay"') +
  `<button type="button" class="cq-hud-iconbutton" data-hud-menu aria-label="Show menu and ride controls">${menuIcon}</button></header>` +
  `<section class="cq-hud-heroes">` +
  `<div class="cq-hud-tile cq-hud-window" data-h-class="power-tile"><div class="cq-hud-tilehead"><small>POWER</small><span data-h="target"></span></div>` +
  `<div class="cq-hud-tilebody"><strong class="cq-hud-hero" data-h="power-c" data-h-html></strong><span class="cq-hud-effort" data-h="effort"></span></div></div>` +
  `<div class="cq-hud-tile cq-hud-window"><div class="cq-hud-tilehead"><small>HEART RATE</small></div>` +
  `<div class="cq-hud-tilebody"><strong class="cq-hud-hero" data-h="hr-c" data-h-html></strong></div></div>` +
  `</section>` +
  `<section class="cq-hud-foot"><div class="cq-hud-enemies" data-h-block="enemies"></div>` +
  `<div class="cq-hud-tile cq-hud-window cq-hud-timetile"><small>TIME</small><strong data-h="time-c"></strong><span data-h="fight-time"></span></div></section>` +
  `<section class="cq-hud-prompt cq-hud-window" data-h-class="prompt"><span class="cq-hud-promptbig" data-h="prompt-big"></span>` +
  `<span class="cq-hud-promptsmall" data-h="prompt-small"></span><span class="cq-hud-countdown" data-h="countdown"></span></section>` +
  `<section class="cq-hud-event cq-hud-window" data-h-block="event"></section>` +
  `<section class="cq-hud-bars cq-hud-bars-row cq-hud-bars-cockpit">` +
  bar('cq-hud-hp', 'HP') +
  bar('cq-hud-stamina', 'STAMINA') +
  `</section>` +
  `</div>` +
  `<div class="cq-hud-iris" aria-hidden="true"></div>` +
  `</div>`;

// Make `from` match `to` with the fewest DOM changes: same-shaped trees are patched
// attribute by attribute and text by text; anything else is replaced.
function morphChildren(from, to) {
  const a = [...from.childNodes],
    b = [...to.childNodes];
  if (a.length !== b.length || a.some((n, i) => n.nodeName !== b[i].nodeName)) {
    from.replaceChildren(...b);
    return;
  }
  a.forEach((n, i) => {
    const m = b[i];
    if (n.nodeType === 3) {
      if (n.nodeValue !== m.nodeValue) n.nodeValue = m.nodeValue;
      return;
    }
    if (n.nodeType !== 1) return;
    for (const attr of [...n.attributes]) if (!m.hasAttribute(attr.name)) n.removeAttribute(attr.name);
    for (const attr of m.attributes)
      if (n.getAttribute(attr.name) !== attr.value) n.setAttribute(attr.name, attr.value);
    morphChildren(n, m);
  });
}
export function mountRideHud(
  host,
  {
    onMenu = () => {},
    onStart = () => {},
    onOverlay = () => {},
    onQuit = () => {},
    onProfile = () => {}
  } = {}
) {
  const doc = host.ownerDocument,
    win = doc.defaultView;
  const el = doc.createElement('section');
  el.className = 'cq-hud';
  el.hidden = true;
  el.setAttribute('aria-label', 'Ride display');
  el.innerHTML = MARKUP;
  host.append(el);
  const stage = el.querySelector('.cq-hud-stage'),
    iris = el.querySelector('.cq-hud-iris');
  const cache = new Map();
  const changed = (key, value) => {
    if (cache.get(key) === value) return false;
    cache.set(key, value);
    return true;
  };
  let shownMode = null,
    irisTimer = null,
    lastModel = null,
    quitArmedUntil = 0;
  el.addEventListener('click', event => {
    if (event.target.closest('[data-hud-menu]')) onMenu();
    if (event.target.closest('[data-hud-start]')) onStart();
    if (event.target.closest('[data-hud-overlay]')) onOverlay();
    if (event.target.closest('.cq-hudprofile')) onProfile();
    // SAVE & QUIT asks once more (for 4 seconds) before ending the ride.
    if (event.target.closest('[data-hud-quit]')) {
      if (performance.now() < quitArmedUntil) {
        quitArmedUntil = 0;
        onQuit();
      } else quitArmedUntil = performance.now() + 4000;
      if (lastModel) update(lastModel);
    }
  });
  el.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('.cq-hudprofile')) {
      event.preventDefault();
      onProfile();
    }
  });
  // Scale so the 1440×900 design fits the shorter side, then stretch the stage along the
  // longer side so the display fills the whole window (no letterbox bars). The layouts are
  // flex and grid, so extra width widens the columns and extra height goes to the road.
  function fit() {
    const k = Math.min(win.innerWidth / STAGE_W, win.innerHeight / STAGE_H);
    const width = (win.innerWidth / k).toFixed(1) + 'px',
      height = (win.innerHeight / k).toFixed(1) + 'px',
      transform = `scale(${k})`;
    if (changed('size', width + height)) {
      stage.style.width = width;
      stage.style.height = height;
    }
    if (changed('transform', transform)) stage.style.transform = transform;
  }
  win.addEventListener('resize', fit);

  // Iris wipe between ROAD and COCKPIT: close on the rider, swap layouts, open on the new view.
  const reducedMotion = () => win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function riderPoint(model) {
    const profile = el.querySelector('.cq-hud-road-profile');
    const x = profile.offsetLeft + profile.offsetWidth * Math.max(0, Math.min(1, model.riderFraction ?? 0.2)),
      y = profile.offsetTop + profile.offsetHeight * 0.55;
    return x.toFixed(0) + 'px ' + y.toFixed(0) + 'px';
  }
  function switchMode(model) {
    if (shownMode === null || reducedMotion()) {
      shownMode = model.mode;
      el.dataset.mode = model.mode;
      return;
    }
    if (irisTimer) return;
    // The circle closes on the rider when leaving the road, and opens from there on return.
    if (shownMode === 'road') stage.style.setProperty('--iris-at', riderPoint(model));
    iris.className = 'cq-hud-iris cq-hud-iris-close';
    irisTimer = win.setTimeout(() => {
      shownMode = lastModel?.mode ?? model.mode;
      el.dataset.mode = shownMode;
      iris.className = 'cq-hud-iris cq-hud-iris-open';
      irisTimer = win.setTimeout(() => {
        iris.className = 'cq-hud-iris';
        irisTimer = null;
        if (lastModel && lastModel.mode !== shownMode) switchMode(lastModel);
      }, IRIS_MS);
    }, IRIS_MS);
  }

  function update(model) {
    lastModel = model;
    if (changed('visible', !!model)) {
      el.hidden = !model;
      if (!model) shownMode = null;
    }
    if (!model) return;
    fit();
    if (model.mode !== shownMode) switchMode(model);
    if (changed('idle', !!model.idle)) el.querySelector('.cq-hud-start').hidden = !model.idle;
    const quitArmed = performance.now() < quitArmedUntil;
    model.text['quit-label'] = quitArmed ? 'CONFIRM?' : 'SAVE & QUIT';
    if (changed('quit', quitArmed))
      el.querySelector('[data-hud-quit]').classList.toggle('cq-armed', quitArmed);
    for (const node of el.querySelectorAll('[data-h]')) {
      const key = node.dataset.h,
        value = model.text[key] ?? '';
      if (!changed('t:' + key + ':' + (node.closest('.cq-hud-road') ? 'r' : 'c'), value)) continue;
      if (node.hasAttribute('data-h-html')) node.innerHTML = value;
      else node.textContent = value;
    }
    for (const node of el.querySelectorAll('[data-h-fill]')) {
      const key = node.dataset.hFill,
        width = Math.max(0, Math.min(100, model.fill[key] ?? 0)).toFixed(1) + '%';
      if (node.style.width !== width) node.style.width = width;
    }
    for (const node of el.querySelectorAll('[data-h-aria]')) {
      const label = model.aria[node.dataset.hAria] || '';
      if (node.getAttribute('aria-label') !== label) node.setAttribute('aria-label', label);
    }
    for (const node of el.querySelectorAll('[data-h-class]')) {
      const cls = model.classes[node.dataset.hClass] || '';
      if (node.dataset.state !== cls) node.dataset.state = cls;
    }
    for (const node of el.querySelectorAll('[data-h-block]')) {
      const html = model.blocks[node.dataset.hBlock] || '';
      if (changed('b:' + node.dataset.hBlock, html)) {
        // Patch in place so images (monster art) are not recreated on every HP change.
        const next = document.createElement('div');
        next.innerHTML = html;
        morphChildren(node, next);
      }
    }
    const exhausted = !!model.exhausted;
    if (changed('exhausted', exhausted))
      el.querySelectorAll('.cq-hud-stamina').forEach(n => n.classList.toggle('cq-exhausted', exhausted));
    if (changed('event', !!model.blocks.event)) el.classList.toggle('cq-hud-has-event', !!model.blocks.event);
    const toast = !!model.text.toast;
    if (changed('toast', toast)) el.querySelector('.cq-hud-toast').classList.toggle('cq-show', toast);
  }
  return { update, element: el };
}
