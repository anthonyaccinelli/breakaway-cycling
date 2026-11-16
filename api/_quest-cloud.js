// Cycle Quest cloud saves, keyed by a private save code instead of an account.
// The code itself is never stored: rows are keyed by its SHA-256 hash, so a database
// leak does not reveal anyone's code. Only this server (service role key) can read or
// write the table; row level security has no policies for anyone else.
//
// Setup (once): run database/cycle-quest-cloud-saves.sql in Supabase, then add these
// Vercel environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
import { createHash } from 'node:crypto';

const CODE = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const MAX_SAVE_BYTES = 256 * 1024;
const MAX_HISTORY_BYTES = 2 * 1024 * 1024;
const TABLE = 'cycle_quest_saves';

export const validCode = code => typeof code === 'string' && CODE.test(code);
export const hashCode = code =>
  createHash('sha256')
    .update('cycle-quest:' + code)
    .digest('hex');

function validSave(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_SAVE_BYTES) return false;
  try {
    const save = JSON.parse(text);
    return !!save && typeof save === 'object' && !Array.isArray(save) && save.version === 1;
  } catch {
    return false;
  }
}
function validHistory(text) {
  if (text === null || text === undefined) return true;
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_HISTORY_BYTES) return false;
  try {
    return Array.isArray(JSON.parse(text));
  } catch {
    return false;
  }
}

export function cloudConfig(env = process.env) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/+$/, ''), key } : null;
}

// action: 'load' | 'save'. Returns [status, body].
export async function handleCloud(action, body, { config = cloudConfig(), fetchImpl = fetch } = {}) {
  if (!config) return [503, { error: 'Cloud saves are not set up on this server yet.' }];
  if (!body || !validCode(body.code)) return [400, { error: 'That save code is not valid.' }];
  const hash = hashCode(body.code);
  const headers = {
    apikey: config.key,
    Authorization: 'Bearer ' + config.key,
    'Content-Type': 'application/json'
  };
  const rows = config.url + '/rest/v1/' + TABLE;
  const current = async () => {
    const r = await fetchImpl(rows + '?code_hash=eq.' + hash + '&select=save,history,revision,updated_at', {
      headers
    });
    if (!r.ok) throw Error('read ' + r.status);
    return (await r.json())[0] || null;
  };
  try {
    if (action === 'load') {
      const row = await current();
      if (!row) return [404, { error: 'No cloud save was found for that code.' }];
      return [
        200,
        { save: row.save, history: row.history, revision: row.revision, updatedAt: row.updated_at }
      ];
    }
    if (action !== 'save') return [400, { error: 'Unknown cloud action.' }];
    if (!validSave(body.save) || !validHistory(body.history))
      return [400, { error: 'That save is too large or not a Cycle Quest character.' }];
    const base = Number.isInteger(body.baseRevision) && body.baseRevision >= 0 ? body.baseRevision : 0;
    const updatedAt = new Date().toISOString();
    const fields = { save: body.save, history: body.history ?? null, updated_at: updatedAt };
    let result;
    if (base === 0 && !body.force) {
      // First upload for this code: insert only, never overwrite someone else's row.
      result = await fetchImpl(rows, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({ code_hash: hash, revision: 1, ...fields })
      });
      if (result.status === 409) return conflict(await current());
    } else {
      // Update only if nobody else saved since this device last synced (unless forced).
      const latest = body.force ? await current() : null;
      if (body.force && !latest) {
        result = await fetchImpl(rows, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify({ code_hash: hash, revision: 1, ...fields })
        });
      } else {
        const expected = body.force ? latest.revision : base;
        result = await fetchImpl(rows + '?code_hash=eq.' + hash + '&revision=eq.' + expected, {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify({ revision: expected + 1, ...fields })
        });
      }
    }
    if (!result.ok) throw Error('write ' + result.status);
    const written = (await result.json())[0];
    if (!written) return conflict(await current());
    return [200, { revision: written.revision, updatedAt: written.updated_at }];
  } catch (error) {
    console.error('Cycle Quest cloud save failed', error);
    return [
      502,
      { error: 'The cloud save service did not respond. Your progress is still saved on this device.' }
    ];
  }
}

function conflict(row) {
  return [
    409,
    {
      error: 'This save code has a newer save from another device.',
      revision: row?.revision ?? null,
      updatedAt: row?.updated_at ?? null
    }
  ];
}
