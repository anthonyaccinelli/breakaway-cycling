import './classic-cockpit.css';
import './classic-companion-preview.css';
import './cycle-quest-setup.css';
import '../cycle-quest/shared-ui.css';
import './cycle-quest-native-frame.css';

/** Arrange the existing Classic controls in the shared cockpit layout. */
export function mountClassicCockpit():void {
 const get=(id:string)=>document.getElementById(id);
 const route=get('screenRoute'),setup=get('screenSetup'),ride=get('screenRide');
 const rideView=ride?.querySelector<HTMLElement>('.ride-screen-content');
 const dashboard=ride?.querySelector<HTMLElement>('.ride-dashboard');
 const profile=get('profileSection');
 const metrics=dashboard?.querySelector<HTMLElement>('.metrics');
 const actions=profile?.querySelector<HTMLElement>('.profile-ride-actions');
 const survivalPanel=ride?.querySelector<HTMLElement>(':scope > .survive-beta');
 const previousSurvivalDisplay=survivalPanel?.style.getPropertyValue('display')||'';
 const previousSurvivalPriority=survivalPanel?.style.getPropertyPriority('display')||'';
 if(!route||!setup||!ride||!rideView||!dashboard||!profile||!metrics||!actions)return;
 const originalMetrics=Array.from(metrics.children);
 const buttons=['start','rideFinishNow','inspectReset'].map(get).filter((item):item is HTMLElement=>!!item);
 const header=document.createElement('header');
 header.className='sc-masthead';
 header.innerHTML='<div class="sc-head"><div class="sc-brand"><small>RIDE BREAKAWAY / ORIGINAL MODE</small><strong>CLASSIC<span class="sc-brand-mark"> / 01</span></strong></div><nav class="sc-tabs" aria-label="Classic navigation"><button type="button" data-cc-step="route">01 ROUTE</button><button type="button" data-cc-step="setup">02 DEVICES</button><button type="button" data-cc-step="ride">03 RIDE</button><button type="button" data-cc-step="overlay">OVERLAY ↗</button></nav><div class="sc-head-right"><div class="sc-phase"><i aria-hidden="true"></i><span>YOUR RIDE</span></div><button type="button" class="sc-mode-change" id="ccModeChange">CHANGE MODE</button></div></div><div class="sc-subhead"><strong id="ccTitle">BUILD YOUR ROUTE</strong><span>CREATE. CONNECT. RIDE.</span></div>';
 // Cycle Quest's device workflow stays in the native BLE document but
 // matches the embedded RPG's utility/character/footer chrome.
 // Share Cycle Quest's ACTUAL DOM classes and CSS, not a painted copy of
 // Classic's screen. Bluetooth stays in this parent document for user-gesture
 // permissions; the live device controls are physically moved, never cloned.
 const questUtility=document.createElement('div');
 questUtility.className='quest-host-bar cq-device-utility';
 questUtility.innerHTML='<button type="button" data-cq-utility="home">← HOME</button><span>CYCLE QUEST · PRIVATE BETA</span><button type="button" data-cq-utility="devices">TRAINER / DEVICES</button>';
 const questShell=document.createElement('div');
 questShell.id='cq-preview';
 questShell.className='cq-device-preview';
 questShell.innerHTML='<div class="cq-game cq-device-game" data-cq-page="devices"><section class="cq-unified-head"><div class="cq-unified-brand"><strong>RIDE BREAKAWAY / CYCLE QUEST</strong><small>connect your trainer</small></div><nav class="cq-unified-nav" aria-label="Ride workflow"><button type="button" data-cq-native="route">01 ROUTE</button><button type="button" data-cq-native="devices" class="cq-unified-active" aria-current="page">02 DEVICES</button><button type="button" data-cq-native="ride">03 RIDE</button><button type="button" data-cq-native="overlay">OVERLAY</button></nav><button type="button" class="cq-change-mode">CHANGE MODE</button></section></div>';
 const questGame=questShell.querySelector<HTMLElement>('.cq-game')!;
 const questSubnav=document.createElement('header');
 questSubnav.className='cq-header';
 questSubnav.innerHTML='<div class="cq-brand"><span class="cq-kicker">RIDE BREAKAWAY PRESENTS</span><strong>CYCLE QUEST</strong></div><nav aria-label="Game navigation"><button data-cq-destination="ride">Ride</button><button data-cq-destination="character">Status</button><button data-cq-destination="overlay">Overlay</button></nav><span class="cq-slot">SAVE 01<br><span>Local character</span></span>';
 const questFull=document.createElement('div');
 questFull.className='cq-full cq-devices-full';
 questFull.innerHTML='<div class="cq-topline"><span><span class="cq-gold">CHAPTER I</span> &nbsp; EQUIPMENT CHECK</span><span class="cq-statuslabel">TRAINER SETUP</span></div>';
 const questFooter=document.createElement('footer');
 questFooter.className='cq-footer';
 questFooter.innerHTML='<span>LIVE TRAINER <span class="cq-gold">●</span></span><span class="cq-message">The road ahead is yours.</span><span><b>CYCLE QUEST · PRIVATE BETA</b></span>';
 questGame.append(questSubnav,questFull,questFooter);
 const nativeConnections=setup?.querySelector<HTMLElement>('.connection-strip')||null;
 const nativeConnectionsParent=nativeConnections?.parentElement||null;
 const nativeConnectionsNext=nativeConnections?.nextSibling||null;
 const restoreNativeConnections=()=>{
  if(!nativeConnections||!nativeConnectionsParent||nativeConnections.parentElement!==questFull)return;
  if(nativeConnectionsNext?.parentNode===nativeConnectionsParent)
   nativeConnectionsParent.insertBefore(nativeConnections,nativeConnectionsNext);
  else nativeConnectionsParent.append(nativeConnections);
 };
 const status=document.createElement('section');
 status.className='cc-status';
 status.setAttribute('aria-label','Route status');
 status.innerHTML='<div><small>DISTANCE REMAINING</small><strong id="ccRemaining">—</strong><span>MI</span></div><div><small>ELEVATION GAIN</small><strong id="ccGain">—</strong><span>FT</span></div><div><small>ESTIMATED TIME LEFT</small><strong id="ccEta">—</strong></div>';
 const hidden=document.createElement('div');hidden.hidden=true;hidden.className='sc-meter-storage';
 const gear=document.createElement('div');gear.className='metric sc-gear-metric';gear.innerHTML='<b id="ccGear">—</b><small>Virtual gear</small>';
 const grade=document.createElement('div');grade.className='metric';grade.innerHTML='<b id="ccGrade">—</b><small>Grade</small>';
 const footer=document.createElement('div');footer.className='sc-ride-controls';footer.innerHTML='<span class="sc-ride-control-label">RIDE CONTROLS</span>';
 const arrangement=['power','heartRate','cadence','speed','elapsedTime','distance'];
 const cells=arrangement.map(id=>get(id)?.closest<HTMLElement>('.metric')).filter((node):node is HTMLElement=>!!node);
 const gainCell=get('totalGain')?.closest<HTMLElement>('.metric');
 const remainingCell=get('remaining')?.closest<HTMLElement>('.metric');
 const active=()=>((document.body.dataset.rideExperience==='classic'&&document.body.dataset.breakawayScreen!=='home')||(document.body.dataset.rideExperience==='cyclequest'&&document.body.dataset.breakawayScreen==='setup'))&&document.body.dataset.deviceShortcut!=='true';
 function mount(){
  if(document.body.classList.contains('cc-cockpit-mounted'))return;
  document.body.classList.add('cc-cockpit-mounted');
  if(document.body.dataset.rideExperience==='cyclequest')document.body.classList.add('cq-native-shell');
  survivalPanel?.style.setProperty('display','none','important');
  for(const cell of cells)metrics!.append(cell);
  // Keep eight tiles while the duplicated route values live in the status bar.
  if(gainCell)hidden.append(gainCell);
  metrics!.append(grade);
  metrics!.append(gear);
  if(remainingCell)hidden.append(remainingCell);
  dashboard!.append(hidden);
  rideView!.insertBefore(status,dashboard!);
  rideView!.append(footer);
  for(const button of buttons)footer.append(button);
 }
 function unmount(){
  if(!document.body.classList.contains('cc-cockpit-mounted'))return;
  document.body.classList.remove('cc-cockpit-mounted','cq-native-shell');
  restoreNativeConnections();questUtility.remove();questShell.remove();
  header.remove();status.remove();footer.remove();
  if(survivalPanel){if(previousSurvivalDisplay)survivalPanel.style.setProperty('display',previousSurvivalDisplay,previousSurvivalPriority);else survivalPanel.style.removeProperty('display');}
  for(const button of buttons)actions!.append(button);
  for(const cell of originalMetrics)metrics!.append(cell);
  gear.remove();grade.remove();hidden.remove();
 }
 function readouts(){
  const text=(id:string)=>(get(id)?.textContent||'—').trim();
  const set=(id:string,value:string)=>{const node=get(id);if(node&&node.textContent!==value)node.textContent=value;};
  set('ccRemaining',text('remaining'));set('ccGain',text('totalGain'));set('ccGear',text('profileBarGear'));set('ccGrade',text('profileBarGrade'));
  const distance=Number.parseFloat(text('remaining')),speed=Number.parseFloat(text('speed'));
  const minutes=Number.isFinite(distance)&&Number.isFinite(speed)&&speed>=1?Math.ceil(distance/speed*60):null;
  set('ccEta',minutes===null?'—':Math.floor(minutes/60)+'h '+String(minutes%60).padStart(2,'0')+'m');
 }
 function sync(){
  if(!active()){unmount();return;}
  mount();
  const screen=document.body.dataset.breakawayScreen;
  const host=screen==='setup'?setup:screen==='ride'?ride:route;
  const isQuestDevices=document.body.dataset.rideExperience==='cyclequest'&&screen==='setup';
  // Prevent stale Quest-only shell classes if the mounted cockpit changes modes.
  document.body.classList.toggle('cq-native-shell',isQuestDevices);
  if(isQuestDevices){
   header.remove();
   if(questUtility.parentElement!==setup)setup!.prepend(questUtility);
   if(questShell.parentElement!==setup)setup!.append(questShell);
   if(nativeConnections&&nativeConnections.parentElement!==questFull)questFull.append(nativeConnections);
  }else{
   restoreNativeConnections();
   questUtility.remove();questShell.remove();
   if(header.parentElement!==host)host!.prepend(header);
  }
  const brandLabel=header.querySelector<HTMLElement>('.sc-brand small');
  if(brandLabel)brandLabel.textContent=document.body.dataset.rideExperience==='cyclequest'?'RIDE BREAKAWAY / CYCLE QUEST':'RIDE BREAKAWAY / CLASSIC MODE';
  const title=get('ccTitle');if(title)title.textContent=screen==='setup'?'connect your trainer':screen==='ride'?'enjoy the ride':'create your route';
  const overlayTab=header.querySelector<HTMLButtonElement>('[data-cc-step="overlay"]');
  if(overlayTab)overlayTab.textContent='OVERLAY';
  header.querySelectorAll<HTMLButtonElement>('[data-cc-step]').forEach(button=>{
   const selected=button.dataset.ccStep===screen;button.classList.toggle('sc-active',selected);button.setAttribute('aria-current',selected?'page':'false');
  });
  readouts();
 }
 header.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-cc-step]');
  if(!button)return;
  const step=button.dataset.ccStep;
  const id=step==='overlay'?'nativeProfile':step==='route'?'stepRoute':step==='setup'?'stepSetup':'stepRide';
  (get(id) as HTMLButtonElement|null)?.click();
 });
 header.querySelector('#ccModeChange')?.addEventListener('click',()=>(get('modeHomeButton') as HTMLButtonElement|null)?.click());
 questUtility.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-cq-utility]');
  if(button?.dataset.cqUtility==='home')(get('modeHomeButton') as HTMLButtonElement|null)?.click();
 });
 questShell.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-cq-native],.cq-change-mode');
  if(!button)return;
  if(button.classList.contains('cq-change-mode')){
   (get('modeHomeButton') as HTMLButtonElement|null)?.click();return;
  }
  const dest=button.dataset.cqNative;
  if(dest==='route')(get('stepRoute') as HTMLButtonElement|null)?.click();
  else if(dest==='ride')(get('stepRide') as HTMLButtonElement|null)?.click();
  else if(dest==='overlay')window.dispatchEvent(new CustomEvent('cyclequest-navigate',{detail:{page:'overlay'}}));
 });
 questSubnav.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-cq-destination]');
  if(!button)return;
  const dest=button.dataset.cqDestination;
  if(dest==='ride')(get('stepRide') as HTMLButtonElement|null)?.click();
  else window.dispatchEvent(new CustomEvent('cyclequest-navigate',{detail:{page:dest}}));
 });
 const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen','data-device-shortcut']});
 const readoutObserver=new MutationObserver(readouts);
 for(const id of ['profileBarGear','profileBarGrade','remaining','totalGain','speed']){const node=get(id);if(node)readoutObserver.observe(node,{childList:true,characterData:true,subtree:true});}
 sync();
}
