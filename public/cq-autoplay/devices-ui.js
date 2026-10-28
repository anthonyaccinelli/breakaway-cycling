/* Native Cycle Quest 02 Devices. Rendered IN the same game document as Route/Ride.
 * Calls the same-origin Breakaway parent synchronously during a user click,
 * preserving transient user activation for Web Bluetooth requestDevice.
 * Never sends a BluetoothDevice across postMessage or duplicates BLE logic.
 */
export function mountQuestDevices({root,requestPage}){
 const game=root.querySelector('.cq-game');
 const section=document.createElement('section');
 section.className='cq-unified-devices';
 section.setAttribute('aria-label','Connect your trainer');
 section.innerHTML=`
   <div class="cq-dev-topline"><span><span class="cq-gold">CHAPTER I</span> &nbsp; EQUIPMENT CHECK</span><span>TRAINER SETUP</span></div>
   <div class="cq-dev-workbench">
    <div class="cq-dev-heading"><span class="cq-dev-number">2</span><div><h1>RIDE CONTROLS & DEVICES</h1><p>Connect your smart trainer to begin. HRM and Zwift Click are optional.</p></div></div>
    <div class="cq-dev-cards">
     <section class="cq-window cq-dev-card"><div class="cq-windowtitle">SMART TRAINER</div><h2>Connect Trainer</h2><p class="cq-dev-status" data-cq-status="trainer">Not connected</p><button data-cq-device-action="connect">CONNECT TRAINER</button></section>
     <section class="cq-window cq-dev-card"><div class="cq-windowtitle">HEART RATE</div><h2>HRM <small>(optional)</small></h2><p class="cq-dev-status" data-cq-status="hr">Not connected</p><div class="cq-dev-buttons"><button data-cq-device-action="connectHr">CONNECT HRM</button><button class="cq-dev-secondary" data-cq-device-action="disconnectHr">DISCONNECT HR</button></div></section>
     <section class="cq-window cq-dev-card"><div class="cq-windowtitle">SHIFT REMOTE</div><h2>Zwift Click <small>(optional)</small></h2><p class="cq-dev-status" data-cq-status="click">Not connected</p><div class="cq-dev-buttons"><button data-cq-device-action="connectClick">CONNECT CLICK</button><button class="cq-dev-secondary" data-cq-device-action="disconnectClick">DISCONNECT CLICK</button></div></section>
    </div>
    <div class="cq-dev-setting-grid">
     <section class="cq-window cq-dev-settings"><div class="cq-windowtitle">RIDER & TRAINER SETTINGS</div>
      <div class="cq-dev-fields">
       <label>RIDER WEIGHT (LB)<input type="number" data-cq-input="weight" min="30" max="700" step="0.1" inputmode="decimal"></label>
       <label>FTP (WATTS)<input type="number" data-cq-input="ftp" min="50" max="1000" step="1" inputmode="numeric"></label>
       <label>BIKE WEIGHT (LB)<input type="number" data-cq-input="bikeWeight" min="0" max="200" step="0.1" inputmode="decimal"></label>
      </div>
      <p class="cq-dev-help">Live FTMS telemetry and trainer control are required to start. Speed is estimated from power, not GPS.</p>
     </section>
     <section class="cq-window cq-dev-settings"><div class="cq-windowtitle">DRIVETRAIN & SHIFTING</div>
      <div class="cq-dev-shifting" role="group" aria-label="Drivetrain mode">
       <button data-cq-drive="traditional" aria-pressed="true">TRADITIONAL</button>
       <button data-cq-drive="virtual" aria-pressed="false">VIRTUAL</button>
      </div>
      <p class="cq-dev-help">Traditional uses your bike gears. Virtual uses Breakaway resistance adjustments and supports Zwift Click.</p>
      <label class="cq-dev-auto"><input type="checkbox" data-cq-input="autoBluetooth"> Automatically reconnect remembered devices</label>
     </section>
    </div>
    <div class="cq-dev-bottom">
      <div class="cq-window cq-dev-tools"><div class="cq-windowtitle">BLUETOOTH & SESSION</div><p data-cq-status="bluetooth">Connect each device once to remember it for future sessions.</p><button class="cq-dev-secondary" data-cq-device-action="forgetBluetooth">FORGET REMEMBERED DEVICES</button></div>
      <div class="cq-dev-actions">
        <button class="cq-dev-secondary" data-cq-page-target="route">← EDIT ROUTE</button>
        <div><strong data-cq-status="readiness">TRAINER REQUIRED</strong><small>HRM and Zwift Click are optional</small></div>
        <button data-cq-page-target="ride">CONTINUE TO RIDE →</button>
      </div>
    </div>
   </div>
   <div class="cq-dev-routebar"><span data-cq-status="message">Connect your smart trainer to begin the quest.</span><strong>✦ CYCLE QUEST</strong></div>`;
 const footer=game.querySelector('.cq-footer');
 footer.before(section);
 const bridge=()=>{try{return window.parent?.__cycleQuestDeviceBridge||null}catch{return null}};
 const action=(name,value)=>{
   const b=bridge();
   if(!b||typeof b.activate!=='function')return false;
   try{return b.activate(name,value)===true}catch(e){console.warn('Cycle Quest trainer action failed',e);return false}
 };
 const select=name=>section.querySelector('[data-cq-input="'+name+'"]');
 let lastState=null;
 function sync(){
  if(!game.isConnected||game.dataset.cqPage!=='devices')return;
  const b=bridge();let state=null;
  try{state=b?.snapshot?.()||null}catch{}
  if(!state){section.querySelector('[data-cq-status="message"]').textContent='Trainer controls unavailable. Reload Cycle Quest.';return;}
  lastState=state;
  const txt=(id,value)=>{const node=section.querySelector('[data-cq-status="'+id+'"]');if(node&&node.textContent!==value)node.textContent=value};
  txt('trainer',state.trainer||'Not connected');
  txt('hr',state.hr||'Not connected');
  txt('click',state.click||'Not connected');
  txt('bluetooth',state.bluetooth||'');
  txt('readiness',state.ready?'TRAINER READY':'TRAINER REQUIRED');
  txt('message',state.message||(state.ready?'Trainer connected. Ready to ride.':'Connect your smart trainer to start.'));
  for(const key of ['weight','ftp','bikeWeight']){
   const node=select(key);if(node&&document.activeElement!==node&&state[key]!=null&&node.value!==String(state[key]))node.value=String(state[key]);
  }
  const check=select('autoBluetooth');if(check&&document.activeElement!==check)check.checked=!!state.autoBluetooth;
  section.querySelectorAll('[data-cq-drive]').forEach(node=>{
   const enabled=node.dataset.cqDrive===(state.drivetrainMode||'traditional');
   node.classList.toggle('cq-dev-selected',enabled);
   node.setAttribute('aria-pressed',String(enabled));
  });
  const continueButton=section.querySelector('[data-cq-page-target="ride"]');
  if(continueButton)continueButton.disabled=!state.ready;
 }
 section.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.cqDeviceAction){
   action(button.dataset.cqDeviceAction);
   sync();
  } else if(button.dataset.cqDrive){
   action('drivetrainMode',button.dataset.cqDrive);sync();
  } else if(button.dataset.cqPageTarget){
   if(button.dataset.cqPageTarget==='ride'&&!lastState?.ready)return;
   requestPage(button.dataset.cqPageTarget);
  }
 });
 section.addEventListener('change',event=>{
  const field=event.target.closest('[data-cq-input]');
  if(!field)return;
  action(field.dataset.cqInput,field.type==='checkbox'?field.checked:field.value);
  sync();
 });
 // Sync only while visible. Disconnected previews show genuine empty telemetry.
 const poll=window.setInterval(sync,750);
 window.addEventListener('pagehide',()=>window.clearInterval(poll),{once:true});
 return {sync,section};
}
