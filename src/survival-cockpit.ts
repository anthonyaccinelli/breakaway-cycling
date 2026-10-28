/**
 * Survival cockpit v2. Reorganizes the existing DOM, never duplicates the BLE,
 * route, ride-recording or chase engines. Restores Classic's DOM on mode exit.
 */
import './survival-cockpit.css';

type Screen = 'route' | 'setup' | 'ride';
const byId = (id:string) => document.getElementById(id);
const el = (selector:string) => document.querySelector<HTMLElement>(selector);

export function mountSurvivalCockpit():void {
 const route=byId('screenRoute')!;
 const setup=byId('screenSetup')!;
 const ride=byId('screenRide')!;
 const studio=byId('survivalStudio')!;
 const rideView=el('#screenRide .ride-screen-content')!;
 const hud=byId('surviveGameHud')!;
 const dashboard=el('#screenRide .ride-dashboard')!;
 const profile=byId('profileSection')!;
 const metrics=dashboard.querySelector<HTMLElement>('.metrics')!;
 const originalActions=profile.querySelector<HTMLElement>('.profile-ride-actions')!;
 const originalHudParent=hud?.parentElement;
 const originalHudNext=hud?.nextSibling;
 // Rehome the legacy Configure panel inside the ride layout so its controls
 // are never positioned beyond the viewport by the old full-width banner CSS.
 const configurePanel=el('#screenRide > .survive-beta');
 const originalConfigureParent=configurePanel?.parentElement;
 const originalConfigureNext=configurePanel?.nextSibling;
 const originalProfileTitle=profile.querySelector<HTMLElement>('.profile-heading h2')?.textContent||'Elevation profile';
 const waveSettings=byId('surviveWaveSettings');
 const legacyControls=el('#screenRide .survive-beta .survive-controls');
 const studioControls=studio?.querySelector<HTMLElement>('.survival-studio-controls');
 if(!route||!setup||!ride||!studio||!rideView||!hud||!dashboard||!profile||!metrics||!originalActions) return;

 const originalMetricNodes=Array.from(metrics.children);
 const originalButtons=['start','rideFinishNow','inspectReset'].map(byId).filter((node):node is HTMLElement=>!!node);
 const masthead=document.createElement('header');
 masthead.className='sc-masthead';
 masthead.innerHTML=[
  '<div class="sc-head">',
   '<div class="sc-brand"><small>RIDE BREAKAWAY / CHALLENGE MODE</small><strong>SURVIVAL<span class="sc-brand-mark"> / 02</span></strong></div>',
   '<nav class="sc-tabs" aria-label="Survival navigation">',
    '<button type="button" data-sc-step="route">01 ROUTE</button>',
    '<button type="button" data-sc-step="setup">02 DEVICES</button>',
    '<button type="button" data-sc-step="ride">03 RIDE</button>',
    '<button type="button" data-sc-step="overlay">OVERLAY ↗</button>',
   '</nav>',
   '<div class="sc-head-right"><div class="sc-phase"><i aria-hidden="true"></i><span id="scPhase">MISSION READY</span></div><button type="button" id="scModeChange" class="sc-mode-change">CHANGE MODE</button></div>',
  '</div>',
  '<div class="sc-subhead"><strong id="scSectionTitle">BUILD YOUR ESCAPE</strong><span id="scMissionSummary">Configure your threat and escape route</span></div>'
 ].join('');

 const preflight=document.createElement('section');
 preflight.className='sc-preflight';
 preflight.innerHTML='<div><span class="sc-kicker">YOUR ESCAPE IS READY</span><strong>START THE PURSUIT WHEN YOU’RE READY</strong></div><button type="button" id="scStartSurvival">START SURVIVAL <span aria-hidden="true">→</span></button>';

 const footer=document.createElement('div');
 footer.className='sc-ride-controls';
 footer.innerHTML='<span class="sc-ride-control-label">RIDE CONTROLS</span>';
 const status=document.createElement('section');
 status.className='cc-status sv-ride-status';
 status.setAttribute('aria-label','Survival route information');
 status.innerHTML='<div><small>DISTANCE REMAINING</small><strong id="svRemaining">—</strong><span>MI</span></div><div><small>ELEVATION GAIN</small><strong id="svGain">—</strong><span>FT</span></div><div><small>ESTIMATED TIME LEFT</small><strong id="svEta">—</strong></div>';
 const previewChase=document.createElement('section');
 previewChase.className='sv-preview-chase';
 previewChase.innerHTML='<header><strong>SURVIVAL · GAMEPLAY PREVIEW</strong><span>LIVE READOUTS APPEAR WHEN SURVIVAL BEGINS</span></header><div><span>YOU MPH<strong>—</strong></span><span>THREAT MPH<strong>—</strong></span><span>THREAT GAP<strong>—</strong></span><span>NEXT SURGE<strong>—</strong></span><span>WAVE / PHASE<strong>—</strong></span></div>';


 const statusDetail=document.createElement('div');
 statusDetail.className='sc-distance-card';
 statusDetail.innerHTML='<small>DISTANCE LEFT</small><strong id="scDistanceLeft">—</strong><span>MI TO FINISH</span>';

 const chaseCards=document.createElement('div');
 chaseCards.className='sc-chase-cards';
 const top=hud.querySelector<HTMLElement>('.survive-game-top');
 const chaseMetrics=hud.querySelector<HTMLElement>('.survive-game-metrics');
 const gap=hud.querySelector<HTMLElement>('.survive-game-gap');
 const clock=hud.querySelector<HTMLElement>('.survive-game-clock');
 const bottom=hud.querySelector<HTMLElement>('.survive-game-bottom');
 const speeds=chaseMetrics!;
 if(!top||!chaseMetrics||!gap||!clock||!bottom) return;
 gap.classList.add('sc-chase-card');
 clock.classList.add('sc-chase-card');
 statusDetail.classList.add('sc-chase-card');
 chaseCards.append(gap,clock,statusDetail);
 top.append(speeds);
 hud.replaceChildren(top,chaseCards,bottom);

 const hiddenMetric=document.createElement('div');
 hiddenMetric.className='sc-meter-storage';
 hiddenMetric.hidden=true;
 const gearMetric=document.createElement('div');
 gearMetric.className='metric sc-gear-metric';
 gearMetric.innerHTML='<b id="scGear">—</b><small>Virtual gear</small>';
 const arrangement=['power','heartRate','cadence','speed','elapsedTime','distance'];
 const orderedMetrics=arrangement.map(id=>byId(id)?.closest<HTMLElement>('.metric')).filter((x):x is HTMLElement=>!!x);
 const remainingCell=byId('remaining')?.closest<HTMLElement>('.metric')||null;
 const gainCell=byId('totalGain')?.closest<HTMLElement>('.metric')||null;
 const gradeMetric=document.createElement('div');
 gradeMetric.className='metric sc-grade-metric';
 gradeMetric.innerHTML='<b id="svGrade">—</b><small>Grade</small>';
 const showPreview=()=>['setup','ride'].includes(new URLSearchParams(location.search).get('survivalPreview')||'');

 function mount():void {
  if(document.body.classList.contains('sc-cockpit-mounted'))return;
  document.body.classList.add('sc-cockpit-mounted','sv-companion-mounted');
  if(waveSettings&&studioControls)studioControls.append(waveSettings);
  if(remainingCell)hiddenMetric.append(remainingCell);
  if(gainCell)hiddenMetric.append(gainCell);
  for(const cell of orderedMetrics)metrics.append(cell);
  metrics.append(gradeMetric,gearMetric);
  dashboard.append(hiddenMetric);
  if(configurePanel){
   configurePanel.classList.add('sv-config-panel');
   rideView.prepend(configurePanel);
  }
  rideView.insertBefore(status,profile);
  rideView.insertBefore(hud,dashboard);
  rideView.insertBefore(previewChase,dashboard);
  rideView.append(footer);
  footer.append(preflight);
  for(const button of originalButtons)footer.append(button);
  const title=el('#screenRoute .route-studio-heading h2');
  if(title)title.textContent='YOUR ESCAPE ROUTE';
  const profileTitle=el('#screenRide #profileSection .profile-heading h2');
  if(profileTitle)profileTitle.textContent='ESCAPE ROUTE';
 }

 function unmount():void {
  if(!document.body.classList.contains('sc-cockpit-mounted'))return;
  document.body.classList.remove('sc-cockpit-mounted','sv-companion-mounted');
  masthead.remove();
  if(waveSettings&&legacyControls)legacyControls.insertBefore(waveSettings,byId('surviveStart'));
  for(const button of originalButtons)originalActions.append(button);
  preflight.remove();footer.remove();status.remove();previewChase.remove();
  if(configurePanel){
   configurePanel.classList.remove('sv-config-panel');
   if(originalConfigureParent){
    if(originalConfigureNext?.parentNode===originalConfigureParent)originalConfigureParent.insertBefore(configurePanel,originalConfigureNext);
    else originalConfigureParent.prepend(configurePanel);
   }
  }
  if(originalHudParent){
   if(originalHudNext&&originalHudNext.parentNode===originalHudParent)originalHudParent.insertBefore(hud,originalHudNext);
   else originalHudParent.prepend(hud);
  }
  for(const cell of originalMetricNodes)metrics.append(cell);
  gearMetric.remove();gradeMetric.remove();hiddenMetric.remove();
  const profileTitle=el('#screenRide #profileSection .profile-heading h2');
  if(profileTitle)profileTitle.textContent=originalProfileTitle;
 }

 function modeActive():boolean {
  return document.body.dataset.rideExperience==='survival'&&document.body.dataset.breakawayScreen!=='home';
 }
 function syncReadouts():void {
  const raw=(id:string)=>(byId(id)?.textContent||'—').trim();
  const set=(id:string,value:string)=>{const node=byId(id);if(node&&node.textContent!==value)node.textContent=value;};
  set('scGear',raw('profileBarGear'));
  set('svGrade',raw('profileBarGrade'));
  set('scDistanceLeft',raw('remaining'));
  set('svRemaining',raw('remaining'));
  set('svGain',raw('totalGain'));
  const remaining=Number.parseFloat(raw('remaining'));
  const speed=Number.parseFloat(raw('speed'));
  const eta=Number.isFinite(remaining)&&Number.isFinite(speed)&&speed>=1?Math.ceil(remaining/speed*60):null;
  set('svEta',eta===null?'—':Math.floor(eta/60)+'h '+String(eta%60).padStart(2,'0')+'m');
 }
 function syncChase():void {
  const active=modeActive()&&!hud.hidden;
  preflight.hidden=active;
  previewChase.hidden=!showPreview()||active;
  const phase=byId('scPhase');
  if(phase){
   const next=active?(byId('surviveGameState')?.textContent||'CHASE ACTIVE'):'MISSION READY';
   if(phase.textContent!==next)phase.textContent=next;
  }
  masthead.classList.toggle('sc-chasing',active);
  masthead.classList.toggle('sc-danger',active&&hud.classList.contains('is-critical'));
  syncReadouts();
 }
 function syncShell():void {
  if(!modeActive()){unmount();return;}
  mount();
  const screen=document.body.dataset.breakawayScreen as Screen;
  const host=screen==='setup'?setup:screen==='ride'?ride:route;
  if(masthead.parentElement!==host)host.prepend(masthead);
  const label=masthead.querySelector<HTMLElement>('.sc-brand small');
  if(label)label.textContent='RIDE BREAKAWAY / SURVIVAL MODE';
  const title=byId('scSectionTitle');
  if(title)title.textContent=screen==='route'?'create your route':screen==='setup'?'connect your trainer':'enjoy the ride';
  const overlay=masthead.querySelector<HTMLButtonElement>('[data-sc-step="overlay"]');
  if(overlay)overlay.textContent='OVERLAY';
  masthead.querySelectorAll<HTMLButtonElement>('[data-sc-step]').forEach(button=>{
   const active=button.dataset.scStep===screen;
   button.classList.toggle('sc-active',active);
   button.setAttribute('aria-current',active?'page':'false');
  });
  const challenge=(byId('studioChallenge') as HTMLSelectElement|null)?.selectedOptions[0]?.textContent?.replace(/^[^a-zA-Z]+/,'').split('—')[0].trim()||'Survival';
  const difficulty=(byId('studioDifficulty') as HTMLSelectElement|null)?.selectedOptions[0]?.textContent?.split('·')[0].trim()||'Standard';
  const threat=(byId('studioThreat') as HTMLSelectElement|null)?.value||'Zombies';
  const summary=byId('scMissionSummary');
  if(summary)summary.textContent=challenge+'  /  '+difficulty+'  /  '+threat;
  syncChase();
 }
 masthead.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-sc-step]');
  if(!button)return;
  const destination=button.dataset.scStep;
  if(destination==='overlay'){(byId('nativeProfile') as HTMLButtonElement|null)?.click();return;}
  const id=destination==='route'?'stepRoute':destination==='setup'?'stepSetup':'stepRide';
  (byId(id) as HTMLButtonElement|null)?.click();
 });
 masthead.querySelector('#scModeChange')?.addEventListener('click',()=>{
  (byId('modeHomeButton') as HTMLButtonElement|null)?.click();
 });
 preflight.querySelector('#scStartSurvival')?.addEventListener('click',()=>{
  (byId('surviveStart') as HTMLButtonElement|null)?.click();
  syncChase();
 });

 [byId('studioChallenge'),byId('studioDifficulty'),byId('studioThreat'),byId('survivePeriod')].forEach(control=>{
  control?.addEventListener('change',syncShell);
 });
 const syncHeaderObserver=new MutationObserver(syncShell);
 syncHeaderObserver.observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 const chaseObserver=new MutationObserver(syncChase);
 chaseObserver.observe(hud,{attributes:true,attributeFilter:['hidden','class'],childList:true,subtree:true,characterData:true});
 const readoutObserver=new MutationObserver(syncReadouts);
 for(const id of ['profileBarGear','profileBarGrade','remaining','totalGain','speed']){
  const node=byId(id);if(node)readoutObserver.observe(node,{childList:true,characterData:true,subtree:true});
 }
 syncShell();
}
