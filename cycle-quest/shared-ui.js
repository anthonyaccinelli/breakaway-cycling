/* Shared Cycle Quest workflow; gameplay, routes and live BLE stay original. */
import { mountQuestDevices } from '/api/cycle-quest?asset=devices-ui.js';
export function mountQuestBaseline({
  root,
  getState,
  getLive,
  getView,
  changeView,
  openOverlay,
  routeSVG,
  parentSend,
  getCharacter = () => null,
  getRouteSummits = () => []
}) {
  const game = root.querySelector('.cq-game');
  if (!game) return { sync() {}, setPage() {} };
  let page = 'route';
  const top = document.createElement('section');
  top.className = 'cq-unified-head';
  top.setAttribute('aria-label', 'Cycle Quest navigation');
  top.innerHTML =
    '<div class="cq-unified-brand"><svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs><filter id="cq-wordmark-gold" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  5 0 0 0 -1"/></filter></defs></svg><img class="cq-wordmark" src="/branding/cycle-quest-wordmark.png" alt="Cycle Quest" width="632" height="102"></div><nav class="cq-unified-nav" aria-label="Ride workflow"><button type="button" data-cq-page="route">01 SETUP</button><button type="button" data-cq-page="ride">02 RIDE</button><button type="button" data-cq-page="overlay">OVERLAY</button></nav><button type="button" class="cq-change-mode">CHANGE MODE</button>';
  game.prepend(top);
  // 01 SETUP: route, devices ("party"), character and RIDE on one screen, in the same framed
  // windows as the ride display (Final Fantasy VI party-menu style).
  const section = document.createElement('section');
  section.className = 'cq-unified-route cq-setup';
  section.setAttribute('aria-label', 'Set up your ride');
  const pill = (attr, label) =>
    '<button type="button" class="cq-setup-pill" ' + attr + '>' + label + '</button>';
  // Party devices: three big square tiles; the whole tile is the connect button.
  const tile = (action, id, label, tag) =>
    '<button type="button" class="cq-setup-tile" data-setup-device="' +
    action +
    '" data-tile="' +
    id +
    '"><span class="cq-setup-tag" data-setup-tag="' +
    id +
    '">' +
    tag +
    '</span><strong>' +
    label +
    '</strong><b data-setup-status="' +
    id +
    '">TAP TO CONNECT</b></button>';
  section.innerHTML =
    '<section class="cq-setup-route cq-setup-window">' +
    '<div class="cq-setup-routehead"><h2>ROUTE</h2><div class="cq-setup-modes">' +
    '<button type="button" class="cq-setup-tab" data-mode="adventure">ADVENTURE</button>' +
    '<button type="button" class="cq-setup-tab" data-mode="training">FREEROAM</button>' +
    '<label class="cq-setup-freeroam" hidden><span>ENEMIES</span><select data-setup-freeroam></select></label></div></div>' +
    '<div class="cq-setup-routeinfo"><strong class="cq-route-name">—</strong><span class="cq-setup-routestats"></span></div>' +
    '<div class="cq-setup-profile"><div class="cq-route-actual-profile" role="img" aria-label="Route elevation profile"></div><span class="cq-setup-profilenote"></span></div>' +
    '<div class="cq-setup-generators">' +
    pill('data-cq-action="custom"', 'CUSTOM') +
    pill('data-cq-action="surprise"', 'SURPRISE ME') +
    pill('data-cq-action="endless"', 'ENDLESS') +
    pill('data-cq-action="recovery"', 'RECOVERY 30') +
    pill('data-cq-action="rolling"', 'ROLLING 45') +
    pill('data-cq-action="climbing"', 'CLIMBING 60') +
    pill('data-cq-action="gpx"', 'UPLOAD GPX') +
    '</div></section>' +
    '<section class="cq-setup-party cq-setup-window">' +
    '<h2>PARTY</h2>' +
    '<div class="cq-setup-devices">' +
    tile('connect', 'trainer', 'TRAINER', 'REQUIRED') +
    tile('connectHr', 'hr', 'HEART RATE', 'OPTIONAL') +
    tile('connectClick', 'click', 'SHIFTERS', 'OPTIONAL') +
    '</div>' +
    pill('data-setup-settings', 'TRAINER SETTINGS') +
    '<hr>' +
    '<div class="cq-setup-hero"><strong data-setup="name">RIDER</strong><span class="cq-gold" data-setup="level">LV 1</span></div>' +
    '<div class="cq-setup-hp" role="img" data-setup-aria="hp"><i></i><span data-setup="hp"></span></div>' +
    '<div class="cq-setup-hero2"><span data-setup="ftp">FTP —</span><span class="cq-gold" data-setup="coins">0 COINS</span></div>' +
    '<div class="cq-setup-charbuttons">' +
    pill('data-setup-open="shop"', 'BIKE SHOP').replace('cq-setup-pill', 'cq-setup-pill cq-setup-shop') +
    pill('data-setup-open="rider"', 'FTP &amp; WEIGHT') +
    pill('data-setup-open="cloud"', 'SAVE CODE') +
    pill('data-state="character"', 'STATUS') +
    '</div></section>' +
    '<button type="button" class="cq-setup-ride" data-setup-ride>▶ RIDE</button>';
  // Trainer settings (weight, drivetrain, remembered devices) open in a dialog.
  const settingsDialog = document.createElement('dialog');
  settingsDialog.className = 'cq-route-dialog cq-setup-settingsdialog';
  settingsDialog.innerHTML =
    '<h2>TRAINER SETTINGS</h2><div class="cq-setup-settingsbody"></div><div class="cq-eventactions"><button type="button" data-close-settings>DONE</button></div>';
  root.append(settingsDialog);
  settingsDialog.addEventListener('click', e => {
    if (e.target.closest('[data-close-settings]')) settingsDialog.close();
  });
  game.querySelector('.cq-header').after(section);
  const setPage = next => {
    // Devices now live on the setup screen.
    if (next === 'devices') next = 'route';
    if (!['route', 'ride', 'overlay', 'character'].includes(next)) return;
    page = next;
    game.dataset.cqPage = page;
    parentSend({ type: 'quest-page', page });
    top.querySelectorAll('[data-cq-page]').forEach(button => {
      const current = button.dataset.cqPage === (page === 'character' ? 'ride' : page);
      button.classList.toggle('cq-unified-active', current);
      if (current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  };
  const oldAction = id => root.querySelector('#' + id)?.click();
  const preset = (distance, terrain) => {
    oldAction('create-route');
    const d = document.getElementById('route-distance'),
      t = document.getElementById('route-terrain'),
      g = document.getElementById('route-gain');
    if (d) d.value = String(distance);
    if (t) t.value = terrain;
    if (g) g.value = '';
    oldAction('route-generate');
  };
  section.addEventListener('change', event => {
    const picker = event.target.closest('[data-setup-freeroam]');
    const original = root.querySelector('#freeroam-chapter');
    if (!picker || !original) return;
    original.value = picker.value;
    original.dispatchEvent(new Event('change'));
  });
  section.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.setupDevice) {
      devices.action(button.dataset.setupDevice);
      sync();
      return;
    }
    if (button.hasAttribute('data-setup-settings')) {
      const body = settingsDialog.querySelector('.cq-setup-settingsbody');
      if (!body.childElementCount)
        body.append(...devices.section.querySelectorAll('.cq-dev-setting-grid > .cq-window, .cq-dev-tools'));
      devices.sync(true);
      settingsDialog.showModal();
      return;
    }
    if (button.dataset.setupOpen) {
      root.querySelector('#cq-open-' + button.dataset.setupOpen)?.click();
      return;
    }
    if (button.hasAttribute('data-setup-ride')) {
      if (devices.ready()) {
        changeView('ride');
        setPage('ride');
      } else devices.action('connect');
      sync();
      return;
    }
    switch (button.dataset.cqAction) {
      case 'custom':
        oldAction('create-route');
        break;
      case 'surprise':
        oldAction('surprise-route');
        sync();
        break;
      case 'endless':
        oldAction('endless-route');
        sync();
        break;
      case 'recovery':
        preset(7.5, 'flat');
        break;
      case 'rolling':
        preset(11.25, 'rolling');
        break;
      case 'climbing':
        preset(15, 'climbing');
        break;
      case 'gpx':
        oldAction('upload-gpx');
        break;
      case 'devices':
        changeView('devices');
        setPage('devices');
        sync();
        break;
      case 'ride':
        changeView('ride');
        setPage('ride');
        sync();
        break;
    }
  });
  top.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('cq-change-mode')) {
      parentSend({ type: 'home' });
      return;
    }
    const dest = button.dataset.cqPage;
    if (dest === 'devices') {
      changeView('devices');
      setPage('devices');
      sync();
      return;
    }
    if (dest === 'route') {
      changeView('ride');
      setPage('route');
      sync();
      return;
    }
    if (dest === 'overlay') {
      openOverlay();
      return;
    }
    if (dest === 'ride') {
      changeView(dest);
      setPage(dest);
      sync();
    }
  });
  const devices = mountQuestDevices({
    root,
    requestPage: next => {
      changeView(next);
      setPage(next);
      sync();
    }
  });
  let routeKey = '';
  const setText = (selector, value) => {
    const node = section.querySelector(selector);
    if (node && node.textContent !== value) node.textContent = value;
  };
  function sync() {
    const s = getState();
    if (!s) return;
    devices.sync();
    const live = getLive(),
      r = s.route;
    game.dataset.cqPage = page;
    if (getView() === 'overlay' && page !== 'overlay') setPage('overlay');
    // Mode tabs and the Freeroam enemy picker (mirrors the game's own picker).
    section.querySelectorAll('.cq-setup-tab').forEach(tab => {
      const on = tab.dataset.mode === s.mode;
      tab.classList.toggle('cq-on', on);
      tab.setAttribute('aria-pressed', String(on));
    });
    const original = root.querySelector('#freeroam-chapter'),
      picker = section.querySelector('[data-setup-freeroam]');
    section.querySelector('.cq-setup-freeroam').hidden = s.mode !== 'training' || !original;
    if (original && picker) {
      if (picker.innerHTML !== original.innerHTML) picker.innerHTML = original.innerHTML;
      if (picker.value !== original.value) picker.value = original.value;
      picker.disabled = original.disabled;
    }
    // Party: device status from the app's device bridge.
    const state = devices.snapshot();
    // Short tile states: connected, connecting, or tap to connect.
    const deviceState = (text, connected) =>
      connected || /^connected/i.test(text || '')
        ? 'on'
        : /not connected/i.test(text || '') || !text
          ? 'off'
          : /connect|search|pair|scan|wait/i.test(text)
            ? 'busy'
            : 'off';
    const tiles = {
      trainer: state?.ready ? 'on' : state?.trainer && state.trainer !== 'Not connected' ? 'busy' : 'off',
      hr: deviceState(state?.hr),
      click: deviceState(state?.click)
    };
    for (const [id, st] of Object.entries(tiles)) {
      const node = section.querySelector('[data-tile="' + id + '"]');
      if (node.dataset.state !== st) node.dataset.state = st;
      setText(
        '[data-setup-status="' + id + '"]',
        st === 'on'
          ? id === 'trainer'
            ? 'READY \u2713'
            : 'CONNECTED \u2713'
          : st === 'busy'
            ? 'CONNECTING\u2026'
            : id === 'click'
              ? 'TAP TO PAIR'
              : 'TAP TO CONNECT'
      );
    }
    const ride = section.querySelector('[data-setup-ride]');
    const rideLabel = state?.ready ? '▶ RIDE' : 'CONNECT TRAINER';
    if (ride.textContent !== rideLabel) ride.textContent = rideLabel;
    // Character.
    const c = getCharacter();
    if (c) {
      setText('[data-setup="name"]', c.name);
      setText('[data-setup="level"]', 'LV ' + c.level);
      setText('[data-setup="hp"]', 'HP ' + c.hp + ' / ' + c.maxHP);
      setText('[data-setup="ftp"]', 'FTP ' + c.ftp + ' W');
      setText('[data-setup="coins"]', c.coins.toLocaleString('en-US') + ' COINS');
      const fill = section.querySelector('.cq-setup-hp i'),
        width = Math.max(0, Math.min(100, (c.hp / c.maxHP) * 100)).toFixed(1) + '%';
      if (fill.style.width !== width) fill.style.width = width;
      section
        .querySelector('[data-setup-aria="hp"]')
        .setAttribute('aria-label', 'Health ' + c.hp + ' of ' + c.maxHP);
    }
    if (!r) {
      setText('.cq-route-name', 'NO ROUTE SELECTED');
      return;
    }
    setText('.cq-route-name', r.name || 'CREATED ROUTE');
    const summits = getRouteSummits().length;
    setText(
      '.cq-setup-routestats',
      [
        r.endless ? 'ENDLESS' : (r.distance / 1609.344).toFixed(1) + ' MI',
        r.hasElevation ? Math.round((r.gain || 0) / 0.3048).toLocaleString() + ' FT' : 'FLAT',
        (r.terrain || 'IMPORTED').toUpperCase(),
        r.endless ? '' : summits + ' SUMMIT BOSS' + (summits === 1 ? '' : 'ES'),
        (s.routeMiles || 0).toFixed(1) + ' MI RIDDEN'
      ]
        .filter(Boolean)
        .join(' · ')
    );
    const key = [r.name, r.distance, r.gain, r.points?.length, r.windowStart, r.endless].join(':');
    if (key !== routeKey) {
      routeKey = key;
      try {
        const svgMarkup = routeSVG(r);
        section.querySelector('.cq-route-actual-profile').innerHTML = svgMarkup.replace(
          /<svg\b/,
          '<svg preserveAspectRatio="none"'
        );
      } catch {
        section.querySelector('.cq-route-actual-profile').textContent = 'Route preview not available.';
      }
    }
    setText(
      '.cq-setup-profilenote',
      live.connected ? 'PEDAL OR PRESS RIDE TO SET OUT' : 'CONNECT YOUR SMART TRAINER TO RIDE'
    );
  }
  setPage('route');
  return { sync, setPage, getPage: () => page };
}
