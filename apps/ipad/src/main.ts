import './style.css';

type Mode = 'Classic + Coach' | 'Survival' | 'Cycle Quest' | 'Pedalkin';
type Telemetry = { watts: number; cadence: number; heartRate: number; speedMph: number; grade: number; seconds: number; distanceMiles: number };
const modes: Mode[] = ['Classic + Coach', 'Survival', 'Cycle Quest', 'Pedalkin'];
let active: Mode = modes[0];
let running = false;
let telemetry: Telemetry = { watts: 165, cadence: 82, heartRate: 118, speedMph: 16.5, grade: 1.2, seconds: 0, distanceMiles: 0 };
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing app root');
const app = root;

function elapsed(seconds: number): string { return new Date(seconds * 1000).toISOString().slice(11, 19); }
function render() {
  app.innerHTML = `<div class="shell"><header><div class="brand">RIDE <strong>BREAKAWAY</strong><small>iPad foundation · simulated ride</small></div><span class="connection">● DEMO TELEMETRY · NO BLUETOOTH CONNECTION</span></header><nav aria-label="Game modes">${modes.map(mode => `<button class="mode ${mode === active ? 'selected' : ''}" data-mode="${mode}">${mode}</button>`).join('')}</nav><main><section class="ride"><div class="section-label">${active.toUpperCase()} / PHASE 1</div><h1>${active}</h1><p>Shared landscape ride shell. Device connectivity, game engines, and saved rides are not yet integrated.</p><div class="metrics"><div><span>POWER</span><strong>${telemetry.watts}</strong><em>W</em></div><div><span>CADENCE</span><strong>${telemetry.cadence}</strong><em>RPM</em></div><div><span>HEART RATE</span><strong>${telemetry.heartRate}</strong><em>BPM</em></div><div><span>SPEED</span><strong>${telemetry.speedMph.toFixed(1)}</strong><em>MPH</em></div></div><div class="lower"><div><label>RIDE TIME</label><b>${elapsed(telemetry.seconds)}</b></div><div><label>DISTANCE</label><b>${telemetry.distanceMiles.toFixed(2)} mi</b></div><div><label>GRADE</label><b>${telemetry.grade.toFixed(1)}%</b></div></div></section><aside><div class="section-label">SESSION</div><h2>Ride controls</h2><p>Use the simulator to check layout and mode switching without a trainer.</p><button id="toggle" class="primary">${running ? 'Pause simulated ride' : 'Start simulated ride'}</button><button id="reset" class="secondary">Reset demo</button><div class="notice">Hardware pairing will use a native CoreBluetooth bridge in a later phase. Do not use this screen for real workouts.</div></aside></main><footer>Prototype only · No resistance commands · No account writes · Existing browser applications unchanged</footer></div>`;
  app.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => { active = button.dataset.mode as Mode; render(); }));
  app.querySelector<HTMLButtonElement>('#toggle')?.addEventListener('click', () => { running = !running; render(); });
  app.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', () => { running = false; telemetry = { watts: 165, cadence: 82, heartRate: 118, speedMph: 16.5, grade: 1.2, seconds: 0, distanceMiles: 0 }; render(); });
}
window.setInterval(() => { if (!running) return; telemetry.seconds++; const t = telemetry.seconds; telemetry.watts = Math.round(165 + 28 * Math.sin(t / 7)); telemetry.cadence = Math.round(82 + 5 * Math.sin(t / 9)); telemetry.heartRate = Math.round(118 + Math.min(t / 20, 18) + 2 * Math.sin(t / 15)); telemetry.speedMph = 16.5 + 1.2 * Math.sin(t / 11); telemetry.distanceMiles += telemetry.speedMph / 3600; render(); }, 1000);
render();
