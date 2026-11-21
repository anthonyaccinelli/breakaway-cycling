// Cloud save by save code: a private code like ABCD-EFGH-JKLM backs the character up to
// the server and loads it on another device. No account needed. The code stays on this
// device (localStorage) and is shown to the rider so they can write it down.
import { escapeHTML } from '/api/cycle-quest?asset=ui-utils.js';

const CONFIG_KEY = 'cycle-quest-cloud-v1';
const ENDPOINT = '/api/cycle-quest?cloud=';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0 or 1
const AUTO_SYNC_MS = 2 * 60 * 1000; // while riding, at most every two minutes
const KEEPALIVE_LIMIT = 60 * 1024; // browsers cap keepalive request bodies near 64 KB

export function generateSaveCode(random = crypto.getRandomValues.bind(crypto)) {
  const bytes = random(new Uint8Array(12));
  const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
  return chars.slice(0, 4) + '-' + chars.slice(4, 8) + '-' + chars.slice(8, 12);
}
export function normalizeSaveCode(text) {
  const raw = String(text || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return raw.length === 12 ? raw.slice(0, 4) + '-' + raw.slice(4, 8) + '-' + raw.slice(8) : null;
}
function ago(ms) {
  const minutes = Math.round((Date.now() - ms) / 60000);
  return minutes < 1 ? 'just now' : minutes < 60 ? minutes + ' min ago' : Math.round(minutes / 60) + ' h ago';
}

// getSnapshot() → { save: characterJSON, history: historyJSON }
// onLoad(saveText, historyText) → true when the game accepted and replaced the character.
export function createCloudSave({ root, getSnapshot, onLoad, onChange = () => {}, fetchImpl = fetch }) {
  let config = null;
  try {
    config = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
  } catch {
    config = null;
  }
  let timer = null,
    busy = false,
    state = config ? 'idle' : 'off', // off | idle | syncing | synced | conflict | error | unavailable
    note = '';
  const store = () => {
    try {
      if (config) localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      else localStorage.removeItem(CONFIG_KEY);
    } catch {
      /* storage blocked: cloud sync lasts for this session only */
    }
  };
  async function call(action, body, keepalive = false) {
    const response = await fetchImpl(ENDPOINT + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive,
      body: JSON.stringify(body)
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      /* empty body */
    }
    return { status: response.status, data };
  }
  function set(next, text = '') {
    state = next;
    note = text;
    render();
    onChange();
  }

  async function upload({ force = false, keepalive = false } = {}) {
    if (!config || busy) return;
    const snapshot = getSnapshot();
    const body = {
      code: config.code,
      save: snapshot.save,
      history: snapshot.history,
      baseRevision: config.revision || 0,
      force
    };
    if (keepalive && JSON.stringify(body).length > KEEPALIVE_LIMIT) return;
    busy = true;
    if (!keepalive) set('syncing');
    try {
      const { status, data } = await call('save', body, keepalive);
      if (status === 200) {
        config.revision = data.revision;
        config.syncedAt = Date.now();
        store();
        set('synced');
      } else if (status === 409)
        set(
          'conflict',
          data.updatedAt ? 'Saved there ' + new Date(data.updatedAt).toLocaleString() + '.' : ''
        );
      else if (status === 503) set('unavailable', data.error || '');
      else set('error', data.error || '');
    } catch {
      set('error', 'No connection. Your progress is still saved on this device.');
    } finally {
      busy = false;
    }
  }

  async function load(code) {
    busy = true;
    set('syncing');
    try {
      const { status, data } = await call('load', { code });
      if (status !== 200) {
        set(config ? 'error' : 'off', data.error || 'Could not load that cloud save.');
        return;
      }
      if (onLoad(data.save, data.history)) {
        config = { code, revision: data.revision, syncedAt: Date.now() };
        store();
        set('synced', 'Cloud save loaded on this device.');
      } else set(config ? 'idle' : 'off', 'Load cancelled.');
    } catch {
      set(config ? 'error' : 'off', 'No connection. Try again when you are online.');
    } finally {
      busy = false;
    }
  }

  // Startup check: tell the rider when another device saved something newer.
  async function check() {
    if (!config) return;
    try {
      const { status, data } = await call('load', { code: config.code });
      if (status === 200 && data.revision > (config.revision || 0))
        set('conflict', 'Saved on another device ' + new Date(data.updatedAt).toLocaleString() + '.');
      else if (status === 503) set('unavailable', data.error || '');
    } catch {
      /* offline: the next sync will try again */
    }
  }

  // ---- dialog ----
  const dialog = document.createElement('dialog');
  dialog.className = 'cq-route-dialog cq-cloud-save';
  dialog.setAttribute('aria-labelledby', 'cq-cloud-title');
  root.append(dialog);
  function render() {
    if (!dialog.open) return;
    const status = {
      off: '',
      idle: 'Cloud save is on.',
      syncing: 'Syncing…',
      synced: 'Synced ' + (config?.syncedAt ? ago(config.syncedAt) : '') + '.',
      conflict: 'The cloud has a newer save from another device.',
      error: 'Last sync failed.',
      unavailable: 'Cloud saves are not set up on this server yet.'
    }[state];
    dialog.innerHTML =
      '<h2 id="cq-cloud-title">CLOUD SAVE</h2>' +
      (config
        ? '<p>Your save code</p><p class="cq-cloud-code">' +
          escapeHTML(config.code) +
          '</p><p class="cq-sub">Write this down. Anyone with the code can load this character, so keep it private.</p>' +
          '<div class="cq-eventactions"><button type="button" data-cloud="copy">COPY CODE</button><button type="button" data-cloud="sync">SYNC NOW</button></div>'
        : '<p>Back up this character and play it on another device. You will get a private save code to keep.</p>' +
          '<div class="cq-eventactions"><button type="button" data-cloud="enable">TURN ON CLOUD SAVE</button></div>') +
      '<p role="status">' +
      escapeHTML([status, note].filter(Boolean).join(' ')) +
      '</p>' +
      (state === 'conflict'
        ? '<div class="cq-eventactions"><button type="button" data-cloud="pull">LOAD THE CLOUD SAVE</button><button type="button" data-cloud="force">KEEP THIS DEVICE’S SAVE</button></div>'
        : '') +
      '<details' +
      (config ? '' : ' open') +
      '><summary>Load a character with a save code</summary><label>Save code <input data-cloud-code autocomplete="off" spellcheck="false" placeholder="ABCD-EFGH-JKLM"></label>' +
      '<div class="cq-eventactions"><button type="button" data-cloud="load">LOAD FROM CLOUD</button></div><p class="cq-sub">This replaces the character on this device. A backup of it is kept.</p></details>' +
      '<div class="cq-dialogactions">' +
      (config ? '<button type="button" data-cloud="off">TURN OFF ON THIS DEVICE</button>' : '') +
      '<button type="button" data-cloud="close">CLOSE</button></div>';
  }
  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-cloud]')?.dataset.cloud;
    if (!action) return;
    if (action === 'close') dialog.close();
    else if (action === 'enable') {
      config = { code: generateSaveCode(), revision: 0, syncedAt: 0 };
      store();
      set('idle');
      upload();
    } else if (action === 'copy') {
      navigator.clipboard?.writeText(config.code).then(
        () => set(state, 'Code copied.'),
        () => set(state, 'Copy failed. Select the code and copy it.')
      );
    } else if (action === 'sync') upload();
    else if (action === 'force') upload({ force: true });
    else if (action === 'pull') load(config.code);
    else if (action === 'load') {
      const code = normalizeSaveCode(dialog.querySelector('[data-cloud-code]').value);
      if (!code) set(state, 'Enter the 12-character save code.');
      else load(code);
    } else if (action === 'off') {
      config = null;
      store();
      set('off', 'Cloud save is off on this device. Your cloud copy is kept.');
    }
  });

  return {
    open() {
      if (!dialog.open) dialog.showModal();
      render();
    },
    // Called after every local save. Uploads soon after important moments, otherwise
    // at most every couple of minutes while riding.
    queue(soon = false) {
      if (!config || state === 'conflict' || state === 'unavailable') return;
      const delay = soon ? 2000 : AUTO_SYNC_MS;
      if (timer && !soon) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        upload();
      }, delay);
    },
    flush() {
      if (config && state !== 'conflict' && state !== 'unavailable') upload({ keepalive: true });
    },
    check,
    statusSuffix() {
      if (!config) return '';
      return (
        {
          synced: ' · cloud synced',
          syncing: ' · syncing to cloud',
          conflict: ' · newer cloud save on another device',
          error: ' · cloud sync failed',
          unavailable: ''
        }[state] || ' · cloud save on'
      );
    },
    get enabled() {
      return !!config;
    }
  };
}
