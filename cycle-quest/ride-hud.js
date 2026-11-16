// Ride HUD: the full-screen view while a ride is running, sized to read from about 6 feet
// on a 13" laptop. Two layouts on one 1440×900 stage that scales to fit any window:
//   ROAD     (exploring)  power and heart rate in the top corners, level, XP, chapter and
//                         coins, a big elevation profile, HP and stamina bars, and five
//                         ride stats along the bottom.
//   COCKPIT  (encounters) power and heart rate as big tiles, HP and stamina bars, a prompt
//                         band (boss phase, damage, reward choice, level up) and the enemies.
// The game computes a plain model each frame (see hudModel in game.js); this module only
// draws it, skipping DOM writes for values that have not changed.
const STAGE_W = 1440,
  STAGE_H = 900;

const menuIcon =
  '<svg width="28" height="22" viewBox="0 0 28 22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3"><path d="M2 3h24M2 11h24M2 19h24"/></svg>';
const coinIcon =
  '<svg width="36" height="36" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12" fill="#e0b52f" stroke="#fff2a6" stroke-width="3"/><path d="M15 9v12" stroke="#7a5a00" stroke-width="3"/></svg>';
const bar = (cls, label, aria) =>
  `<div class="cq-hud-bar ${cls}" role="img" aria-label="${aria}" data-h-aria="${cls}">` +
  `<i data-h-fill="${cls}"></i>` +
  (cls === 'cq-hud-stamina' ? '<b class="cq-hud-line" title="Below 25%: exhausted"></b>' : '') +
  `<span class="cq-hud-barlabel" data-h="${cls}-label">${label}</span>` +
  `<span class="cq-hud-barvalue" data-h="${cls}-value" data-h-html></span></div>`;
const stat = (key, label) =>
  `<div class="cq-hud-stat"><small>${label}</small><strong data-h="${key}" data-h-html></strong></div>`;

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
  `<button type="button" class="cq-hud-menu" data-hud-menu aria-label="Show menu and ride controls">MENU</button>` +
  `</div>` +
  `<div class="cq-hud-corner cq-hud-right"><small>HEART RATE</small><strong class="cq-hud-hero" data-h="hr" data-h-html></strong>` +
  `<span class="cq-hud-coins">${coinIcon}<b data-h="coins"></b><small>COINS</small></span></div>` +
  `</section>` +
  `<section class="cq-hud-road-profile"><div class="cq-profile cq-hudprofile" role="img" aria-label="Route elevation profile"></div>` +
  `<span class="cq-hud-grade" data-h="grade"></span><span class="cq-hud-bossin" data-h="boss-in"></span></section>` +
  `<section class="cq-hud-bars cq-hud-bars-row">` +
  bar('cq-hud-hp', 'HP', 'Health') +
  bar('cq-hud-stamina', 'STAMINA', 'Stamina') +
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
  `<button type="button" class="cq-hud-iconbutton" data-hud-menu aria-label="Show menu and ride controls">${menuIcon}</button></header>` +
  `<section class="cq-hud-heroes">` +
  `<div class="cq-hud-tile" data-h-class="power-tile"><div class="cq-hud-tilehead"><small>POWER</small><span data-h="target"></span></div>` +
  `<div class="cq-hud-tilebody"><strong class="cq-hud-hero" data-h="power-c" data-h-html></strong><span class="cq-hud-effort" data-h="effort"></span></div></div>` +
  `<div class="cq-hud-tile"><div class="cq-hud-tilehead"><small>HEART RATE</small></div>` +
  `<div class="cq-hud-tilebody"><strong class="cq-hud-hero" data-h="hr-c" data-h-html></strong></div></div>` +
  `</section>` +
  `<section class="cq-hud-bars">` +
  bar('cq-hud-hp', 'HP', 'Health') +
  bar('cq-hud-stamina', 'STAMINA', 'Stamina') +
  `</section>` +
  `<section class="cq-hud-prompt" data-h-class="prompt"><span class="cq-hud-promptbig" data-h="prompt-big"></span>` +
  `<span class="cq-hud-promptsmall" data-h="prompt-small"></span><span class="cq-hud-countdown" data-h="countdown"></span></section>` +
  `<section class="cq-hud-foot"><div class="cq-hud-enemies" data-h-block="enemies"></div>` +
  `<div class="cq-hud-tile cq-hud-timetile"><small>TIME</small><strong data-h="time-c"></strong></div></section>` +
  `<section class="cq-hud-event" data-h-block="event"></section>` +
  `</div>` +
  `</div>`;

export function mountRideHud(host, { onMenu = () => {} } = {}) {
  const el = host.ownerDocument.createElement('section');
  el.className = 'cq-hud';
  el.hidden = true;
  el.setAttribute('aria-label', 'Ride display');
  el.innerHTML = MARKUP;
  host.append(el);
  const stage = el.querySelector('.cq-hud-stage');
  const cache = new Map();
  const changed = (key, value) => {
    if (cache.get(key) === value) return false;
    cache.set(key, value);
    return true;
  };
  el.addEventListener('click', event => {
    if (event.target.closest('[data-hud-menu]')) onMenu();
  });
  function fit() {
    const win = host.ownerDocument.defaultView;
    const k = Math.min(win.innerWidth / STAGE_W, win.innerHeight / STAGE_H);
    const left = Math.max(0, (win.innerWidth - STAGE_W * k) / 2),
      top = Math.max(0, (win.innerHeight - STAGE_H * k) / 2);
    const transform = `translate(${left}px, ${top}px) scale(${k})`;
    if (changed('transform', transform)) stage.style.transform = transform;
  }
  host.ownerDocument.defaultView.addEventListener('resize', fit);

  function update(model) {
    if (changed('visible', !!model)) el.hidden = !model;
    if (!model) return;
    fit();
    if (changed('mode', model.mode)) el.dataset.mode = model.mode;
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
      if (changed('b:' + node.dataset.hBlock, html)) node.innerHTML = html;
    }
    const exhausted = !!model.exhausted;
    if (changed('exhausted', exhausted))
      el.querySelectorAll('.cq-hud-stamina').forEach(n => n.classList.toggle('cq-exhausted', exhausted));
    if (changed('event', !!model.blocks.event)) el.classList.toggle('cq-hud-has-event', !!model.blocks.event);
  }
  return { update, element: el };
}
