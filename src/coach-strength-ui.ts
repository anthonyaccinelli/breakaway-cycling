import {STRENGTH_KEY,STRENGTH_HISTORY_KEY,defaultStrength,equipmentChoices,validStrength,availableExercises,strengthRoutine} from './coach-strength';
import type {StrengthSettings,StrengthRecord,StrengthExercise,StrengthSetLog} from './coach-strength';
import './coach-strength.css';
const esc=(x:string)=>x.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const read=(k:string)=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
const write=(k:string,v:unknown)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
const dayKey=(v:Date)=>v.getFullYear()+'-'+v.getMonth()+'-'+v.getDate();

export function mountCoachStrength(host:HTMLElement,callbacks:{changed:()=>void;finished:()=>void}){
 let settings=validStrength(read(STRENGTH_KEY)||defaultStrength);
 const stored=read(STRENGTH_HISTORY_KEY);
 let history:StrengthRecord[]=Array.isArray(stored)?stored.filter(x=>x&&typeof x.routine==='string'&&Array.isArray(x.sets)).slice(-150):[];
 let active=false,variation:'A'|'B'='A',light=false,start=0,selectedRpe='',allocatedMinutes=30;
 let exercises:StrengthExercise[]=[];
 const checked=new Set<string>(),entered=new Map<string,string>();
 let timer:number|null=null,restUntil=0;
 const overlay=document.createElement('section');
 overlay.className='coach-strength-overlay';overlay.id='coachStrengthOverlay';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Guided strength session');
 document.body.append(overlay);
 function renderSettings(){
  host.innerHTML='<div class="coach-section-top"><span class="coach-tag">STRENGTH TRAINING</span><span class="coach-tag">OPTIONAL · LOCAL ONLY</span></div>'+
  '<h3>Train with what you own.</h3><p class="coach-small">Set your available equipment. Strength sessions share your weekly training time budget.</p>'+
  '<label class="coach-strength-toggle"><input id="strengthEnabled" type="checkbox" '+(settings.enabled?'checked':'')+'><span>Include strength in my training plan</span></label>'+
  '<span class="coach-label">AVAILABLE EQUIPMENT</span><div class="coach-equipment-grid">'+equipmentChoices.map(e=>
   '<label class="coach-gear-choice"><input type="checkbox" data-gear="'+e.id+'" '+(settings.equipment.includes(e.id)?'checked':'')+' '+(e.id==='bodyweight'?'disabled':'')+'>'+
   '<span><strong>'+esc(e.label)+'</strong><small>'+esc(e.detail)+'</small></span></label>').join('')+'</div>'+
  '<div class="coach-strength-fields"><label>EXPERIENCE<select id="strengthExperience"><option value="beginner">New to lifting</option><option value="intermediate">Some experience</option><option value="advanced">Experienced</option></select></label>'+
  '<label>SESSIONS / WEEK<select id="strengthSessions"><option value="1">1 session</option><option value="2">2 sessions</option></select></label>'+
  '<label>TIME / SESSION<select id="strengthMinutes"><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></label>'+
  '<label>AVAILABLE WEIGHTS (OPTIONAL)<input type="text" id="strengthWeights" maxlength="150" placeholder="e.g. 25 lb DB, 35 lb KB"></label></div>'+
  '<button type="button" class="coach-classic-start" id="strengthSave">SAVE STRENGTH SETTINGS →</button>'+
  '<p id="strengthSaved" class="coach-small" role="status">This preview stores your equipment and training log on this device.</p>';
  (host.querySelector('#strengthExperience') as HTMLSelectElement).value=settings.experience;
  (host.querySelector('#strengthSessions') as HTMLSelectElement).value=String(settings.sessions);
  (host.querySelector('#strengthMinutes') as HTMLSelectElement).value=String(settings.minutes);
  (host.querySelector('#strengthWeights') as HTMLInputElement).value=settings.notes;
 }
 host.addEventListener('click',event=>{
  const target=event.target;
  if(!(target instanceof Element)||!target.closest('#strengthSave'))return;
  const equipment=Array.from(host.querySelectorAll<HTMLInputElement>('[data-gear]')).filter(el=>el.checked).map(el=>el.dataset.gear);
  const next=validStrength({
   enabled:(host.querySelector('#strengthEnabled') as HTMLInputElement).checked,equipment,
   experience:(host.querySelector('#strengthExperience') as HTMLSelectElement).value,
   sessions:Number((host.querySelector('#strengthSessions') as HTMLSelectElement).value),
   minutes:Number((host.querySelector('#strengthMinutes') as HTMLSelectElement).value),
   notes:(host.querySelector('#strengthWeights') as HTMLInputElement).value
  });
  if(!write(STRENGTH_KEY,next)){host.querySelector('#strengthSaved')!.textContent='Local storage unavailable. Nothing saved.';return;}
  settings=next;renderSettings();host.querySelector('#strengthSaved')!.textContent='Saved! Your weekly plan now includes equipment-aware strength work.';
  callbacks.changed();
 });
 function stopTimer(){if(timer!==null)window.clearInterval(timer);timer=null;restUntil=0;}
 function startRest(seconds:number){
  if(timer!==null)window.clearInterval(timer);
  restUntil=Date.now()+seconds*1000;
  const display=()=>{
   const remaining=Math.max(0,Math.ceil((restUntil-Date.now())/1000));
   const label=overlay.querySelector('#strengthRestLabel');
   if(label)label.textContent=remaining?'Rest: '+remaining+' seconds':'Rest complete. Ready for the next set.';
   if(!remaining){if(timer!==null)window.clearInterval(timer);timer=null;}
  };
  timer=window.setInterval(display,500);display();
 }
 const key=(i:number,j:number)=>i+':'+j;
 function renderSession(){
  if(!active)return;
  const routine=strengthRoutine(settings,variation,light);
  const total=exercises.reduce((n,e)=>n+e.sets,0);
  overlay.innerHTML='<div class="coach-strength-session">'+
    '<header class="coach-strength-session-head"><div><span>BREAKAWAY COACH / STRENGTH</span><h2>'+esc(routine.title)+'</h2><p>'+allocatedMinutes+' min planned · +checked.size+' / '+total+' sets logged</p></div><button type="button" id="strengthExit">← BACK TO COACH</button></header>'+
    '<div class="coach-strength-session-note">'+esc(routine.note)+' Warm up for 5 minutes. Stop or modify anything painful; use a load you can control.</div>'+
    '<div class="coach-strength-progress"><div style="width:'+Math.round(100*checked.size/Math.max(total,1))+'%"></div></div>'+
    '<div class="coach-strength-rest"><span id="strengthRestLabel">Rest as needed between sets.</span><button type="button" id="strengthRestStart">START 60s REST</button></div>'+
    '<div class="coach-strength-list">'+exercises.map((exercise,i)=>{
     const choices=availableExercises(settings,exercise.pattern);
     return '<section class="coach-strength-exercise">'+
      '<div class="coach-strength-exercise-header"><div><small>'+(i+1)+' / '+exercises.length+' · '+esc(exercise.pattern.toUpperCase())+'</small><h3>'+esc(exercise.name)+'</h3></div>'+
      '<label>SWAP EXERCISE<select data-strength-sub="'+i+'">'+choices.map(e=>'<option value="'+e.id+'" '+(e.id===exercise.id?'selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select></label></div>'+
      '<p>'+esc(exercise.instructions)+'</p><p class="coach-strength-dose">'+exercise.sets+' sets · '+esc(exercise.reps)+' · Rest '+exercise.restSeconds+'s · '+esc(exercise.loadHint)+'</p>'+
      '<div class="coach-strength-sets">'+Array.from({length:exercise.sets},(_,j)=>{
       const id=key(i,j);
       return '<div class="coach-strength-set"><span>SET '+(j+1)+'</span>'+
        '<input aria-label="Repetitions: set '+(j+1)+' '+esc(exercise.name)+'" data-reps="'+id+'" maxlength="30" placeholder="'+esc(exercise.reps)+'">'+
        '<input aria-label="Weight: set '+(j+1)+' '+esc(exercise.name)+'" data-load="'+id+'" maxlength="32" placeholder="Weight / BW">'+
        '<button type="button" aria-pressed="'+checked.has(id)+'" data-check="'+id+'">'+(checked.has(id)?'✓ DONE':'MARK DONE')+'</button></div>';
      }).join('')+'</div></section>';
    }).join('')+'</div>'+
    '<div class="coach-strength-complete"><label>SESSION EFFORT<select id="strengthRpe"><option value="">Select effort</option><option value="3">Easy</option><option value="5">Moderate</option><option value="7">Hard</option><option value="9">Very hard</option></select></label>'+
    '<button type="button" id="strengthFinish">FINISH & SAVE SESSION →</button><p id="strengthSessionError" role="status"></p></div></div>';
  overlay.querySelectorAll<HTMLInputElement>('[data-reps],[data-load]').forEach(input=>{
   const type=input.hasAttribute('data-reps')?'reps':'load';
   input.value=entered.get(type+':'+input.getAttribute('data-'+type))||'';
  });
  (overlay.querySelector('#strengthRpe') as HTMLSelectElement).value=selectedRpe;
 }
 overlay.addEventListener('input',event=>{
  const target=event.target;
  if(!(target instanceof HTMLInputElement))return;
  for(const kind of ['reps','load'])if(target.hasAttribute('data-'+kind))entered.set(kind+':'+target.getAttribute('data-'+kind),target.value);
 });
 overlay.addEventListener('change',event=>{
  const el=event.target;if(!(el instanceof HTMLSelectElement))return;
  if(el.id==='strengthRpe'){selectedRpe=el.value;return;}
  if(!el.hasAttribute('data-strength-sub'))return;
  const i=Number(el.dataset.strengthSub);
  const previous=exercises[i];if(!previous)return;
  const choice=availableExercises(settings,previous.pattern).find(e=>e.id===el.value);
  if(!choice)return;
  exercises[i]={...choice,sets:previous.sets,restSeconds:previous.restSeconds,alternatives:previous.alternatives};
  for(let j=0;j<previous.sets;j++){const k=key(i,j);checked.delete(k);entered.delete('reps:'+k);entered.delete('load:'+k);}
  renderSession();
 });
 overlay.addEventListener('click',event=>{
  const target=event.target;if(!(target instanceof Element))return;
  if(target.closest('#strengthExit')){if(checked.size&&!confirm('Leave without saving your sets?'))return;close();return;}
  const button=target.closest<HTMLButtonElement>('[data-check]');
  if(button){
   const id=button.dataset.check!;
   if(checked.has(id))checked.delete(id);else checked.add(id);
   if(checked.has(id)){const index=Number(id.split(':')[0]);startRest(exercises[index]?.restSeconds||60);}
   renderSession();return;
  }
  if(target.closest('#strengthRestStart')){startRest(60);return;}
  if(target.closest('#strengthFinish'))finish();
 });
 function finish(){
  if(!checked.size){overlay.querySelector('#strengthSessionError')!.textContent='Complete at least one set to save this session.';return;}
  const sets:StrengthSetLog[]=[];
  exercises.forEach((e,i)=>{for(let j=0;j<e.sets;j++){
   const id=key(i,j);
   sets.push({exerciseId:e.id,set:j+1,reps:entered.get('reps:'+id)||'',load:entered.get('load:'+id)||'',done:checked.has(id)});
  }});
  const routine=strengthRoutine(settings,variation,light);
  const record:StrengthRecord={
   id:new Date().toISOString()+':'+routine.id,date:new Date().toISOString(),routine:routine.title,
   minutes:Math.max(1,Math.round((Date.now()-start)/60000)),completedSets:checked.size,plannedSets:sets.length,
   rpe:selectedRpe?Number(selectedRpe):null,sets
  };
  const next=history.concat(record).slice(-150);
  if(!write(STRENGTH_HISTORY_KEY,next)){overlay.querySelector('#strengthSessionError')!.textContent='Could not save. Check local browser storage.';return;}
  history=next;close();callbacks.finished();
 }
 function close(){stopTimer();active=false;overlay.hidden=true;}
 function open(chosen:'A'|'B'='A',isLight=false,minutes?:number){
  if(!settings.enabled)return false;
  variation=chosen;light=isLight;allocatedMinutes=Math.min(settings.minutes,Math.max(15,minutes||settings.minutes));exercises=strengthRoutine(settings,variation,isLight||allocatedMinutes<20).exercises;
  if(allocatedMinutes<settings.minutes)exercises=exercises.map(e=>({...e,sets:Math.max(1,Math.min(e.sets,allocatedMinutes<25?1:2))}));
  active=true;checked.clear();entered.clear();selectedRpe='';start=Date.now();stopTimer();
  overlay.hidden=false;renderSession();overlay.scrollTop=0;
  (overlay.querySelector('#strengthExit') as HTMLButtonElement)?.focus();return true;
 }
 renderSettings();
 return {get settings(){return settings;},get history(){return history;},open,close,renderSettings,get active(){return active;},
  completedToday(){return history.some(r=>dayKey(new Date(r.date))===dayKey(new Date()));}};
}
