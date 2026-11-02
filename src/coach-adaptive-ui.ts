import {MORNING_KEY,MISSED_KEY,OVERRIDES_KEY,validMorning,localDay,changesSummary} from './coach-adaptive';
import type {AdaptivePlan,MorningCheck,MissedSession} from './coach-adaptive';
import type {CoachWorkout} from './coach-engine';
import {escapeHtml,readJson,writeJson} from './coach-dom';
import './coach-adaptive.css';

export function mountAdaptiveUI(statusHost:HTMLElement,morningHost:HTMLElement,changesHost:HTMLElement,callbacks:{changed:()=>void}){
 const list=(key:string):unknown[]=>{const r=readJson(key);return Array.isArray(r)?r:[];};
 const getMornings=()=>list(MORNING_KEY).map(validMorning).filter((x):x is MorningCheck=>x!==null).slice(-90);
 const getMissed=():MissedSession[]=>list(MISSED_KEY).filter((x):x is MissedSession=>!!x&&typeof x==='object'&&typeof (x as MissedSession).date==='string'&&
  ['missed','skipped'].includes((x as MissedSession).kind)).slice(-70);
 const getOverrides=():string[]=>list(OVERRIDES_KEY).filter((x):x is string=>typeof x==='string').slice(-28);
 const currentDay=()=>localDay(new Date());
 const recentEntry=()=>getMornings().find(x=>x.date===currentDay())||null;
 morningHost.innerHTML=[
  '<div class="coach-adaptive-header"><div><span class="coach-tag">GARMIN MORNING CHECK-IN</span><h3>How did you recover?</h3>',
  '<p>Enter your sleep and HRV each morning. Coach can adjust training and show exactly why.</p></div>',
  '<span class="coach-adaptive-local">SAVED ON THIS DEVICE</span></div>',
  '<div class="coach-adaptive-form">',
  '<label>Garmin Sleep Score <small>0–100</small><input id="coachSleepScore" type="number" min="0" max="100" placeholder="e.g. 82"></label>',
  '<label>Overnight HRV <small>milliseconds</small><input id="coachHrv" type="number" min="1" max="300" placeholder="e.g. 48"></label>',
  '<label>Garmin HRV Status<select id="coachHrvStatus">',
  '<option value="unknown">Not available</option><option value="balanced">Balanced</option>',
  '<option value="unbalanced">Unbalanced</option><option value="low">Low</option><option value="poor">Poor</option>',
  '</select></label></div>',
  '<details class="coach-adaptive-baseline"><summary>My personal HRV baseline (optional)</summary>',
  '<p>Enter your normal Garmin baseline range, not someone else’s HRV. Without a baseline or HRV status, the raw HRV number is logged but not used for readiness.</p>',
  '<div class="coach-adaptive-baseline-fields">',
  '<label>Baseline minimum (ms)<input id="coachHrvLow" type="number" min="1" max="300" placeholder="e.g. 42"></label>',
  '<label>Baseline maximum (ms)<input id="coachHrvHigh" type="number" min="1" max="300" placeholder="e.g. 62"></label></div></details>',
  '<div class="coach-adaptive-actions"><button type="button" id="coachMorningSave" class="coach-adaptive-primary">SAVE MORNING CHECK-IN →</button>',
  '<button type="button" id="coachMorningClear" class="coach-adaptive-secondary">CLEAR TODAY</button></div>',
  '<p id="coachMorningNotice" role="status" class="coach-adaptive-notice">Optional. A green day is not a guarantee of exercise readiness.</p>'
 ].join('');
 changesHost.innerHTML=[
  '<div class="coach-adaptive-changes-header"><span class="coach-tag">ADAPTIVE TRAINING</span><h3>What Coach changed</h3>',
  '<p>Compare your original workouts with the new plan. Missed days are never automatically made up.</p></div>',
  '<div id="coachChangeList" class="coach-adaptive-change-list"></div>',
  '<details id="coachMissedDetails" class="coach-adaptive-missed"><summary>Missed or skipped a workout?</summary>',
  '<p>Mark a training day from the last week. This is optional when completed rides are already recorded.</p>',
  '<div class="coach-adaptive-missed-fields"><label>Day<input id="coachMissedDate" type="date"></label>',
  '<label>What happened?<select id="coachMissedKind"><option value="missed">Missed</option><option value="skipped">Skipped intentionally</option></select></label>',
  '<button type="button" id="coachMissedSave" class="coach-adaptive-secondary">SAVE</button></div>',
  '<div id="coachMissedList"></div></details>',
  '<p class="coach-adaptive-disclaimer">Experimental training guidance; not a validated medical or physiological readiness score. Rest if you feel unwell or exhausted, even on a green day.</p>'
 ].join('');
 const $=(id:string)=>morningHost.querySelector<HTMLInputElement|HTMLSelectElement>('#'+id)!;
 const setVal=(id:string,v:number|null)=>{$(id).value=v===null?'':String(v);};
 function syncForm(){
  const latest=recentEntry(),prior=getMornings().at(-1)||null;
  setVal('coachSleepScore',latest?.sleepScore??null);
  setVal('coachHrv',latest?.overnightHrv??null);
  setVal('coachHrvLow',latest?.baselineLow??prior?.baselineLow??null);
  setVal('coachHrvHigh',latest?.baselineHigh??prior?.baselineHigh??null);
  $('coachHrvStatus').value=latest?.hrvStatus||'unknown';
  ($('coachMorningClear') as HTMLButtonElement).disabled=!latest;
 }
 const optional=(id:string)=>$(id).value===''?null:Number($(id).value);
 morningHost.querySelector('#coachMorningSave')!.addEventListener('click',()=>{
  const low=optional('coachHrvLow'),high=optional('coachHrvHigh');
  if((low===null)!==(high===null)||low!==null&&high!==null&&low>=high){
   morningHost.querySelector('#coachMorningNotice')!.textContent='Enter both HRV baseline limits with minimum below maximum, or leave both blank.';return;
  }
  const raw={date:currentDay(),sleepScore:optional('coachSleepScore'),overnightHrv:optional('coachHrv'),baselineLow:low,baselineHigh:high,hrvStatus:$('coachHrvStatus').value};
  const entry=validMorning(raw);
  if(!entry||entry.sleepScore!==raw.sleepScore||entry.overnightHrv!==raw.overnightHrv||entry.baselineLow!==low||entry.baselineHigh!==high){
   morningHost.querySelector('#coachMorningNotice')!.textContent='Please check your scores: Sleep Score 0–100 and HRV in milliseconds.';return;
  }
  if(entry.sleepScore===null&&entry.overnightHrv===null&&entry.hrvStatus==='unknown'){
   morningHost.querySelector('#coachMorningNotice')!.textContent='Enter at least one reading or Garmin HRV Status.';return;
  }
  const updated=getMornings().filter(x=>x.date!==entry.date).concat(entry).sort((a,b)=>a.date.localeCompare(b.date)).slice(-90);
  if(!writeJson(MORNING_KEY,updated)){morningHost.querySelector('#coachMorningNotice')!.textContent='Unable to save in this browser.';return;}
  morningHost.querySelector('#coachMorningNotice')!.textContent='✓ Saved. Today and the coming week have been recalculated.';
  syncForm();callbacks.changed();
 });
 morningHost.querySelector('#coachMorningClear')!.addEventListener('click',()=>{
  if(!writeJson(MORNING_KEY,getMornings().filter(x=>x.date!==currentDay())))return;
  syncForm();callbacks.changed();
  morningHost.querySelector('#coachMorningNotice')!.textContent='Today’s check-in cleared.';
 });
 const dayInput=changesHost.querySelector<HTMLInputElement>('#coachMissedDate')!;
 function syncMissed(){
  const d=new Date(),today=currentDay(),sevenAgo=localDay(new Date(d.getFullYear(),d.getMonth(),d.getDate()-7));
  dayInput.max=today;dayInput.min=sevenAgo;
  if(!dayInput.value||dayInput.value>today||dayInput.value<sevenAgo)dayInput.value=localDay(new Date(d.getFullYear(),d.getMonth(),d.getDate()-1));
  changesHost.querySelector('#coachMissedList')!.innerHTML=getMissed().filter(x=>x.date>=sevenAgo).slice(-7).reverse().map(x=>
   '<div class="coach-adaptive-missed-row"><span>'+escapeHtml(x.date)+' · '+escapeHtml(x.kind)+'</span><button type="button" data-missed-remove="'+escapeHtml(x.date)+'">UNDO</button></div>').join('');
 }
 changesHost.querySelector('#coachMissedSave')!.addEventListener('click',()=>{
  const date=dayInput.value,kind=changesHost.querySelector<HTMLSelectElement>('#coachMissedKind')!.value;
  if(!date||date>currentDay()||date<dayInput.min||!['missed','skipped'].includes(kind))return;
  const next=getMissed().filter(x=>x.date!==date).concat({date,kind:kind as 'missed'|'skipped'}).slice(-70);
  if(writeJson(MISSED_KEY,next)){syncMissed();callbacks.changed();}
 });
 changesHost.querySelector('#coachMissedList')!.addEventListener('click',event=>{
  const target=event.target;if(!(target instanceof Element))return;
  const b=target.closest<HTMLButtonElement>('[data-missed-remove]');if(!b)return;
  if(writeJson(MISSED_KEY,getMissed().filter(x=>x.date!==b.dataset.missedRemove))){syncMissed();callbacks.changed();}
 });
 changesHost.querySelector('#coachChangeList')!.addEventListener('click',event=>{
  const target=event.target;if(!(target instanceof Element))return;
  const b=target.closest<HTMLButtonElement>('[data-adaptive-keep]');if(!b)return;
  const key=b.dataset.adaptiveKeep!,old=getOverrides();
  if(writeJson(OVERRIDES_KEY,old.includes(key)?old.filter(x=>x!==key):[...old,key]))callbacks.changed();
 });
 function render(plan:AdaptivePlan,workouts:CoachWorkout[]){
  const status=plan.today,labels={green:'GREEN · NO RESTRICTION DETECTED',yellow:'YELLOW · AVOID INTENSITY',red:'RED · REST RECOMMENDED'};
  const today=plan.days[0];
  statusHost.innerHTML='<div class="coach-readiness coach-readiness-'+status+'">'+
   '<div class="coach-readiness-head"><span class="coach-readiness-dot" aria-hidden="true"></span><strong>'+labels[status]+'</strong>'+
   '<span>'+(recentEntry()?'GARMIN CHECK-IN SAVED':'NO MORNING CHECK-IN')+'</span></div>'+
   '<p>'+escapeHtml(today?.reasons.join(' ')||'Limited data. No additional fatigue restriction identified; this is not a clearance to exercise.')+'</p>'+
   '<button type="button" data-adaptive-open="morning">ENTER MORNING DATA →</button></div>';
  const changes=changesSummary(plan,workouts);
  changesHost.querySelector('#coachChangeList')!.innerHTML=changes.length?
   changes.map(d=>'<article class="coach-adaptive-change"><div class="coach-adaptive-change-top">'+
    '<span class="coach-readiness-dot coach-readiness-dot-'+d.light+'" aria-hidden="true"></span><strong>'+escapeHtml(d.date)+'</strong>'+
    '<span>'+ (d.locked?'RIDER OVERRIDE':d.light==='red'?'REST ADVISED':d.light==='yellow'?'EASIER SESSION':'COMPLETION UPDATE')+'</span></div>'+
    '<div class="coach-adaptive-beforeafter"><div><small>ORIGINALLY</small><strong>'+escapeHtml(d.originalLabel)+'</strong></div>'+
    '<span aria-hidden="true">→</span><div><small>NOW</small><strong>'+escapeHtml(d.updatedLabel)+'</strong></div></div>'+
    '<p>'+escapeHtml(d.changes.join(' ')+' '+d.reasons.join(' '))+'</p>'+
    '<button type="button" data-adaptive-keep="'+escapeHtml(d.date)+'">'+(d.locked?'USE COACH ADJUSTMENT':'KEEP ORIGINAL WORKOUT')+'</button></article>').join(''):
   '<p class="coach-adaptive-nochanges">No workouts changed in the next seven days. New rides or Garmin morning readings may change the schedule.</p>';
  syncMissed();
  if(lastDay!==currentDay()){lastDay=currentDay();syncForm();}
 }
 let lastDay='';
 statusHost.addEventListener('click',event=>{
  const target=event.target;if(!(target instanceof Element))return;
  if(target.closest('[data-adaptive-open]')){morningHost.scrollIntoView({behavior:'smooth',block:'center'});$('coachSleepScore').focus();}
 });
 syncForm();syncMissed();
 return {getMornings,getMissed,getOverrides,render,syncForm};
}
