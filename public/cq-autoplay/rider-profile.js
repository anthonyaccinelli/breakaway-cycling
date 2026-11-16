// Rider profile: the FTP Cycle Quest uses to turn watts into effort.
// Kept inside the character save and separate from Ride Breakaway's own settings.
// Three ways to set it: type it in, estimate it from weight and rider type, or accept
// an offer after a ride when the rider's best 20 minutes shows a higher FTP.
import { escapeHTML } from './ui-utils.js';

export const DEFAULT_FTP = 200; // used only until the rider sets up a profile
export const MIN_FTP = 50;
export const MAX_FTP = 600;
export const LB_PER_KG = 2.2046226218487757;

export const RIDER_TYPES = Object.freeze([
  { id: 'new', label: 'New to cycling', wattsPerKg: 1.5 },
  { id: 'occasional', label: 'Ride occasionally', wattsPerKg: 2.0 },
  { id: 'regular', label: 'Ride regularly', wattsPerKg: 2.7 },
  { id: 'serious', label: 'Train seriously', wattsPerKg: 3.5 }
]);

const clampFTP = watts => Math.max(MIN_FTP, Math.min(MAX_FTP, Math.round(watts)));

export function estimateFTP(weightKg, riderTypeId) {
  const type = RIDER_TYPES.find(t => t.id === riderTypeId);
  if (!type || !Number.isFinite(weightKg) || weightKg <= 0) return null;
  return clampFTP(Math.round((weightKg * type.wattsPerKg) / 5) * 5);
}

export function validRider(rider) {
  if (!rider || typeof rider !== 'object' || Array.isArray(rider)) return false;
  if (!Number.isInteger(rider.ftp) || rider.ftp < MIN_FTP || rider.ftp > MAX_FTP) return false;
  if (!['manual', 'estimate', 'ride'].includes(rider.source)) return false;
  if (
    rider.weightKg !== undefined &&
    !(Number.isFinite(rider.weightKg) && rider.weightKg >= 20 && rider.weightKg <= 300)
  )
    return false;
  if (rider.riderType !== undefined && !RIDER_TYPES.some(t => t.id === rider.riderType)) return false;
  return true;
}

export function riderFTP(state) {
  return validRider(state?.rider) ? state.rider.ftp : DEFAULT_FTP;
}

// FTP is about 95% of the best 20-minute average power. Only offer increases worth having.
export function suggestedFTP(best20Watts, currentFTP) {
  if (!Number.isFinite(best20Watts) || best20Watts <= 0) return null;
  const suggestion = clampFTP(best20Watts * 0.95);
  return suggestion >= currentFTP + Math.max(5, currentFTP * 0.02) ? suggestion : null;
}

// Best 20-minute average power while riding. Samples are bucketed into whole seconds,
// so the cost is the same no matter how often telemetry arrives.
export function createPowerWindow(windowSeconds = 1200) {
  const ring = new Float64Array(windowSeconds);
  let filled = 0,
    index = 0,
    sum = 0,
    bucketWatts = 0,
    bucketTime = 0,
    best = 0;
  return {
    add(watts, seconds) {
      let remaining = Math.max(0, Number(seconds) || 0);
      const w = Math.max(0, Number(watts) || 0);
      while (remaining > 0) {
        const part = Math.min(remaining, 1 - bucketTime);
        bucketWatts += w * part;
        bucketTime += part;
        remaining -= part;
        if (bucketTime >= 1 - 1e-9) {
          sum += bucketWatts - ring[index];
          ring[index] = bucketWatts;
          index = (index + 1) % windowSeconds;
          filled = Math.min(windowSeconds, filled + 1);
          if (filled === windowSeconds) best = Math.max(best, sum / windowSeconds);
          bucketWatts = 0;
          bucketTime = 0;
        }
      }
      return best;
    },
    get best() {
      return best;
    }
  };
}

// The rider profile dialog. `getRider` returns the saved profile or null, `onSave` stores one.
export function mountRiderProfile({ root, getRider, onSave }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'cq-route-dialog cq-rider-profile';
  dialog.setAttribute('aria-labelledby', 'cq-rider-title');
  dialog.innerHTML =
    '<form method="dialog">' +
    '<h2 id="cq-rider-title">RIDER PROFILE</h2>' +
    '<p>Cycle Quest measures effort as your watts compared with your FTP, so every rider deals the same damage at the same effort.</p>' +
    '<label>FTP (watts)<input name="ftp" type="number" min="' +
    MIN_FTP +
    '" max="' +
    MAX_FTP +
    '" step="1" inputmode="numeric"></label>' +
    '<fieldset><legend>Don’t know your FTP?</legend>' +
    '<label>Weight (lb)<input name="weight" type="number" min="50" max="600" step="1" inputmode="numeric"></label>' +
    '<label>Rider type<select name="type">' +
    RIDER_TYPES.map(t => '<option value="' + t.id + '">' + escapeHTML(t.label) + '</option>').join('') +
    '</select></label>' +
    '<button type="button" data-estimate>Estimate my FTP</button></fieldset>' +
    '<p class="cq-sub">After each ride, Cycle Quest checks your best 20 minutes and offers to raise your FTP if you rode stronger.</p>' +
    '<p role="alert" class="cq-rider-error"></p>' +
    '<div class="cq-dialogactions"><button type="button" data-save-rider>Save profile</button><button value="cancel">Cancel</button></div>' +
    '</form>';
  root.append(dialog);
  const field = name => dialog.querySelector('[name="' + name + '"]');
  const error = dialog.querySelector('.cq-rider-error');
  let source = 'manual';
  field('ftp').addEventListener('input', () => (source = 'manual'));
  dialog.querySelector('[data-estimate]').addEventListener('click', () => {
    const weightKg = Number(field('weight').value) / LB_PER_KG;
    const estimate = estimateFTP(weightKg, field('type').value);
    if (!estimate) {
      error.textContent = 'Enter your weight to estimate your FTP.';
      return;
    }
    error.textContent = '';
    field('ftp').value = String(estimate);
    source = 'estimate';
  });
  dialog.querySelector('[data-save-rider]').addEventListener('click', () => {
    const ftp = Math.round(Number(field('ftp').value));
    const weightLb = Number(field('weight').value);
    const rider = { ftp, source };
    if (weightLb > 0) rider.weightKg = Math.round((weightLb / LB_PER_KG) * 10) / 10;
    if (source === 'estimate') rider.riderType = field('type').value;
    if (!validRider(rider)) {
      error.textContent = 'Enter an FTP between ' + MIN_FTP + ' and ' + MAX_FTP + ' watts, or estimate one.';
      return;
    }
    onSave(rider);
    dialog.close();
  });
  return {
    open() {
      const rider = getRider();
      source = rider?.source || 'manual';
      field('ftp').value = rider ? String(rider.ftp) : '';
      field('weight').value = rider?.weightKg ? String(Math.round(rider.weightKg * LB_PER_KG)) : '';
      field('type').value = rider?.riderType || 'occasional';
      error.textContent = '';
      if (!dialog.open) dialog.showModal();
    }
  };
}
