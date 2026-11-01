import './pedalkin-handheld-devices.css';
import {enableSpokemonHandheldFont} from './pedalkin-font-artwork';

/** 02 Devices — the exact 01 Route console frame, with controls bridged
 * to Breakaway's original BLE and shifting handlers. */
export function mountPedalkinHandheldDevices():void{
 const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T|null;
 const required=['connect','connectHr','connectClick','autoBluetooth','drivetrainMode',
  'trainerMode','down','up','goToRide','stepRoute','stepSetup','stepRide','nativeProfile'];
 if(required.some(id=>!el(id)))return;
 const shell=document.createElement('section');
 shell.className='pk-dev-shell';shell.hidden=true;
 shell.setAttribute('aria-label','Spokemon 02 Devices');
 shell.innerHTML=`
 <div class="pk-dev-stage">
  <img class="pk-dev-art" src="/pedalkin/route-v3.svg" alt="Spokemon handheld console" draggable="false"/>
  <nav class="pk-dev-frame-nav" aria-label="Game navigation">
   <button data-pk-nav="stepRoute" aria-label="01 Route"></button>
   <button data-pk-nav="stepSetup" aria-current="page" aria-label="02 Devices"></button>
   <button data-pk-nav="stepRide" aria-label="03 Ride"></button>
   <button data-pk-nav="nativeProfile" aria-label="Overlay"></button>
  </nav>
  <div class="pk-dev-screen">
   <header class="pk-dev-heading">
    <span class="pk-dev-step">2</span><h1>Connect Your Devices</h1>
    <span class="pk-dev-route-chip">PINE FOREST <span>/</span> <span data-pk-distance>15 MI</span></span>
   </header>
   <div class="pk-dev-columns">
    <section class="pk-dev-column">
     <h2>01 / PAIR DEVICES</h2>
     <div class="pk-dev-device" data-pk-device="trainer">
      <div class="pk-dev-device-heading"><span class="pk-dev-bluetooth">ᛒ</span>
       <div class="pk-dev-device-name"><strong>Smart Trainer</strong><small>FTMS / optional smart-trainer pairing</small></div>
       <span class="pk-dev-tag">OPTIONAL</span></div>
      <button data-pk-action="trainer">CONNECT TRAINER</button>
      <small class="pk-dev-device-status" data-pk-status="trainer">Not connected</small>
     </div>
     <div class="pk-dev-device" data-pk-device="hr">
      <div class="pk-dev-device-heading"><span class="pk-dev-bluetooth">ᛒ</span>
       <div class="pk-dev-device-name"><strong>Heart Rate</strong><small>Bluetooth heart-rate sensor</small></div>
       <span class="pk-dev-tag">OPTIONAL</span></div>
      <button data-pk-action="hr">CONNECT HEART RATE</button>
      <small class="pk-dev-device-status" data-pk-status="hr">Not connected</small>
     </div>
     <div class="pk-dev-device" data-pk-device="click">
      <div class="pk-dev-device-heading"><span class="pk-dev-bluetooth">ᛒ</span>
       <div class="pk-dev-device-name"><strong>Zwift Click</strong><small>Virtual gear controls</small></div>
       <span class="pk-dev-tag">OPTIONAL</span></div>
      <button data-pk-action="click">CONNECT CLICK</button>
      <small class="pk-dev-device-status" data-pk-status="click">Not connected</small>
     </div>
     <label class="pk-dev-auto"><input data-pk-auto type="checkbox" checked/> Auto-reconnect remembered devices</label>
     <small class="pk-dev-optional">All devices optional. Ride without hardware or pair a trainer.</small>
    </section>
    <section class="pk-dev-column">
     <h2>02 / RIDE SETTINGS</h2>
     <div class="pk-dev-settings">
      <label for="pkDevShifting">SHIFTING STYLE</label>
      <select id="pkDevShifting" data-pk-shifting><option value="traditional">Traditional Shifting</option><option value="virtual">Virtual Shifting</option></select>
      <label for="pkDevControl">TRAINER CONTROL</label>
      <select id="pkDevControl" data-pk-control><option value="sim">Route Simulation (SIM)</option><option value="erg">Virtual Gears (ERG)</option><option value="target">Fixed Target (ERG)</option></select>
      <div class="pk-dev-target" data-pk-target hidden>
       <label for="pkDevWatts">TARGET POWER (W)</label>
       <div><input id="pkDevWatts" data-pk-watts type="number" min="30" max="1000" step="1"/><button data-pk-action="watts">SET</button></div>
      </div>
      <div class="pk-dev-gear" data-pk-gear>
       <label>VIRTUAL GEAR</label>
       <div class="pk-dev-gear-controls"><button data-pk-action="down" aria-label="Shift down">−</button><output data-pk-gear-value>06 / 24</output><button data-pk-action="up" aria-label="Shift up">+</button></div>
      </div>
      <p class="pk-dev-control-note">SIM follows the route gradient.<br/> ERG target appears when selected.</p>
      <p class="pk-dev-ready" data-pk-ready>● TRAINER OPTIONAL</p>
     </div>
    </section>
   </div>
   <p class="pk-dev-banner" data-pk-banner role="status">● TRAINER OPTIONAL. SKIP TO RIDE ANYTIME.</p>
   <button class="pk-dev-continue" data-pk-action="continue">SKIP TO 03 RIDE <span aria-hidden="true">→</span></button>
  </div>
 </div>`;
 document.body.append(shell);
 void enableSpokemonHandheldFont(shell);
 const q=<T extends Element=HTMLElement>(selector:string)=>shell.querySelector<T>(selector)!;
 const buttons={
  trainer:el<HTMLButtonElement>('connect')!,hr:el<HTMLButtonElement>('connectHr')!,
  click:el<HTMLButtonElement>('connectClick')!,down:el<HTMLButtonElement>('down')!,
  up:el<HTMLButtonElement>('up')!,watts:el<HTMLButtonElement>('applyErgWatts'),
  continue:el<HTMLButtonElement>('goToRide')!
 };
 const real={
  shifting:el<HTMLSelectElement>('drivetrainMode')!,
  control:el<HTMLSelectElement>('trainerMode')!,
  auto:el<HTMLInputElement>('autoBluetooth')!,
  watts:el<HTMLInputElement>('fixedErgWatts')
 };
 // Real handlers run synchronously during the click, preserving the BLE user gesture.
 shell.querySelectorAll<HTMLButtonElement>('[data-pk-nav]').forEach(btn=>btn.addEventListener('click',()=>{
  el<HTMLButtonElement>(btn.dataset.pkNav||'')?.click();
 }));
 shell.querySelectorAll<HTMLButtonElement>('[data-pk-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const name=btn.dataset.pkAction as keyof typeof buttons;
  if(name==='continue'&&buttons.continue.disabled)return;
  buttons[name]?.click();requestAnimationFrame(refresh);
 }));
 const shifting=q<HTMLSelectElement>('[data-pk-shifting]');
 const control=q<HTMLSelectElement>('[data-pk-control]');
 const auto=q<HTMLInputElement>('[data-pk-auto]');
 const watts=q<HTMLInputElement>('[data-pk-watts]');
 const updateSelect=(src:HTMLSelectElement,dest:HTMLSelectElement)=>{
  dest.value=src.value;dest.dispatchEvent(new Event('change',{bubbles:true}));
 };
 shifting.addEventListener('change',()=>updateSelect(shifting,real.shifting));
 control.addEventListener('change',()=>updateSelect(control,real.control));
 auto.addEventListener('change',()=>{
  real.auto.checked=auto.checked;
  real.auto.dispatchEvent(new Event('change',{bubbles:true}));
 });
 watts.addEventListener('change',()=>{
  if(!real.watts)return;
  real.watts.value=watts.value;
  real.watts.dispatchEvent(new Event('input',{bubbles:true}));
  real.watts.dispatchEvent(new Event('change',{bubbles:true}));
 });
 function deviceStatus(which:'trainer'|'hr'|'click'){
  const button=buttons[which];
  const tile=button.closest<HTMLElement>('.setup-device-tile');
  const state=tile?.dataset.connectionState||'';
  const status=tile?.querySelector<HTMLElement>('.setup-connection-indicator')?.textContent?.trim()||'';
  const fallback=which==='hr'?el('hrStatus')?.textContent?.trim():which==='click'?el('clickStatus')?.textContent?.trim():'';
  const connected=state==='connected';
  const pending=state==='connecting'||state==='initializing';
  return {connected,pending,text:status||(connected?'Connected':pending?'Connecting…':fallback||'Not connected')};
 }
 function refresh(){
  if(shell.hidden)return;
  if(document.activeElement!==shifting)shifting.value=real.shifting.value;
  if(document.activeElement!==control)control.value=real.control.value;
  if(document.activeElement!==auto)auto.checked=real.auto.checked;
  if(real.watts&&document.activeElement!==watts)watts.value=real.watts.value;
  q<HTMLElement>('[data-pk-target]').hidden=control.value!=='target';
  q<HTMLElement>('[data-pk-gear]').hidden=shifting.value!=='virtual';
  const gear=Number(el('gear')?.textContent?.replace(/[^0-9]/g,'')||'');
  q<HTMLElement>('[data-pk-gear-value]').textContent=
   Number.isInteger(gear)&&gear>=1&&gear<=24?String(gear).padStart(2,'0')+' / 24':'— / 24';
  for(const kind of ['trainer','hr','click'] as const){
   const state=deviceStatus(kind);
   q<HTMLElement>('[data-pk-status="'+kind+'"]').textContent=state.text;
   q<HTMLElement>('[data-pk-device="'+kind+'"]').dataset.state=state.connected?'connected':state.pending?'connecting':'disconnected';
   const button=q<HTMLButtonElement>('[data-pk-action="'+kind+'"]');
   button.textContent=state.connected?'CONNECTED ✓':state.pending?'CONNECTING…':kind==='trainer'?'CONNECT TRAINER':kind==='hr'?'CONNECT HEART RATE':'CONNECT CLICK';
   button.disabled=state.pending;
  }
  const trainerConnected=deviceStatus('trainer').connected;
  const next=q<HTMLButtonElement>('[data-pk-action="continue"]');
  next.disabled=false;
  next.innerHTML=trainerConnected?'READY TO RIDE! <span aria-hidden="true">→</span>':'SKIP DEVICES — 03 RIDE <span aria-hidden="true">→</span>';
  q<HTMLElement>('[data-pk-ready]').textContent=trainerConnected?'● TRAINER READY':'● TRAINER OPTIONAL';
  q<HTMLElement>('[data-pk-ready]').dataset.ready=String(trainerConnected);
  q<HTMLElement>('[data-pk-banner]').textContent=trainerConnected?'✓ TRAINER CONNECTED. READY FOR THE NEXT STEP.':'● NO TRAINER REQUIRED — YOU CAN ENTER 03 RIDE NOW.';
  q<HTMLElement>('[data-pk-distance]').textContent=(el<HTMLInputElement>('generatedMiles')?.value||'—')+' MI';
 }
 function sync(){
  const active=document.body.dataset.rideExperience==='pedalkin'&&document.body.dataset.breakawayScreen==='setup';
  shell.hidden=!active;document.body.classList.toggle('pk-dev-active',active);
  if(active)refresh();
 }
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 window.setInterval(()=>{if(!shell.hidden)refresh();},650);
 sync();
}
