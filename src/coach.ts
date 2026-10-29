import {
  COACH_HISTORY_KEY, COACH_PROFILE_KEY, defaultProfile, availableControls,
  feedbackRecommendation, inTargetRange, recommendWeek, segmentAt, targetWatts,
  validProfile, workoutDuration, workoutLibrary
} from './coach-engine';
import type {CoachControl, CoachMode, CoachProfile, CoachSessionRecord, CoachWorkout} from './coach-engine';
import './coach.css';
import {mountCoachHistory} from './coach-history-ui';

export interface CoachBridge {
  launchMode:(mode:CoachMode)=>void;
  makeRoute:(durationSeconds:number,structured:boolean)=>void;
  setMode:(mode:'target'|'sim')=>void;
  setTarget:(watts:number)=>void;
  isRiding:()=>boolean;
  getPlatformRides:()=>Promise<{start:number;elapsed:number;avgPower:number|null;mode:'classic'|'survival'|'cyclequest'|null;name:string}[]>;
}
type Session = {
  workout:CoachWorkout; mode:CoachMode; control:CoachControl; ftp:number;
  elapsed:number; adjusted:number; measured:number; inRange:number;
  sumWatts:number; countWatts:number; done:boolean; previousIndex:number;
};
const readJson = (key:string):unknown => {try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
const writeJson = (key:string,value:unknown) => {try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Private storage may be disabled */}};
function historyRecords():CoachSessionRecord[]{
  const x=readJson(COACH_HISTORY_KEY);
  return Array.isArray(x)?x.filter(r=>r && typeof r.workout==='string' && typeof r.date==='string').slice(-150):[];
}
const formatTime=(seconds:number)=> {
  const whole=Math.max(0,Math.ceil(seconds));
  return Math.floor(whole/60)+':'+String(whole%60).padStart(2,'0');
};
const byId=(parent:ParentNode,id:string)=>parent.querySelector<HTMLElement>('#'+id)!;
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function mountCoach(bridge:CoachBridge){
  const profile=validProfile(readJson(COACH_PROFILE_KEY)||defaultProfile);
  let rider:CoachProfile=profile;
  let library=workoutLibrary(rider);
  let selected='endurance';
  let controlChoice:CoachControl='structured';
  let platformRides:Awaited<ReturnType<CoachBridge['getPlatformRides']>>=[];
  let session:Session|null=null;
  let finishedId='';
  let renderAt=0;
  let isDemo=false;
  let demoTimer:number|null=null;
  let demoWatts=130;
  const trigger=document.createElement('button');
  trigger.id='openBreakawayCoach';
  trigger.type='button';
  trigger.className='coach-classic-entry';
  trigger.innerHTML='<span class="coach-classic-label">TRAIN WITH</span><strong>BREAKAWAY COACH</strong><span aria-hidden="true">→</span>';
  trigger.title='Open structured training plans inside Classic';
  const classicRoute=document.getElementById('screenRoute');
  const routeHeading=classicRoute?.querySelector<HTMLElement>('.route-studio-heading') || classicRoute?.querySelector<HTMLElement>('.route-studio-header');
  (routeHeading||classicRoute||document.body).append(trigger);
  const screen=document.createElement('section');
  screen.id='breakawayCoachScreen';
  screen.className='coach-screen';
  screen.hidden=true;
  screen.innerHTML=
    '<header class="coach-top"><div><div class="coach-eyebrow">RIDE BREAKAWAY / CLASSIC / COACH</div><h1>BREAKAWAY <em>COACH.</em></h1><p>Structured training inside Classic. Survival and Cycle Quest stay free-play games.</p></div><button type="button" class="coach-back" id="coachBack">← BACK TO CLASSIC</button></header>'+
    '<div class="coach-main" role="main"><div class="coach-layout"><section class="coach-panel coach-primary">'+
    '<div class="coach-section-top"><span class="coach-tag">01 / TODAY</span><span class="coach-tag" id="coachPlanTag">PERSONALIZED</span></div>'+
    '<h2>YOUR NEXT RIDE.</h2><p class="coach-intro" id="coachSuggestion">Train with purpose, ride your way.</p>'+ '<div class="coach-quick"><button type="button" data-coach-question="why">WHY THIS WORKOUT?</button><button type="button" data-coach-question="tired">I FEEL TIRED</button><button type="button" data-coach-question="short">SHORT ON TIME</button></div><p id="coachAnswer" class="coach-small" aria-live="polite">Try a coaching question to get a simple, rules-based recommendation.</p>'+ 
    '<label class="coach-label" for="coachWorkout">WORKOUT LIBRARY</label><select id="coachWorkout" class="coach-select"></select>'+
    '<div id="coachWorkoutInfo" class="coach-workout-info"></div><div id="coachSegments" class="coach-segments"></div>'+
    '<div class="coach-inline-fields"><label>CONTROL STYLE<select id="coachControl"><option value="structured">Structured ERG</option><option value="guided">Guided SIM (terrain controlled by rider)</option></select></label></div>'+
    '<h3>READY TO TRAIN?</h3><button type="button" class="coach-classic-start" id="coachStartClassic">PREPARE CLASSIC WORKOUT →</button>'+
    '<p class="coach-compat">Breakaway Coach prescribes workouts only inside Classic. For a free ride, return to Classic Route Studio. Survival and Cycle Quest retain their original gameplay and resistance control.</p>'+
    '<button type="button" id="coachDemo" class="coach-demo-button">TRY INTERACTIVE WORKOUT DEMO (NO TRAINER)</button>'+
    '<p class="coach-status" id="coachStatus" role="status"></p></section>'+
    '<aside class="coach-side"><section class="coach-panel coach-history-host" id="coachHistoryImport"></section><section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">02 / PROFILE</span><span class="coach-tag">LOCAL ONLY</span></div><h2>YOUR TRAINING.</h2>'+
    '<div class="coach-fields"><label>FTP (W)<input id="coachFtp" type="number" min="75" max="550" step="1"></label><label>HOURS / WEEK<input id="coachHours" type="number" min="1" max="20" step=".5"></label><label>DAYS / WEEK<input id="coachDays" type="number" min="2" max="7" step="1"></label><label>REST DAY<select id="coachRestDay"><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select></label><label>LEVEL<select id="coachExperience"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label>GOAL<select id="coachGoal"><option value="fitness">Ride consistently</option><option value="ftp">Increase FTP</option><option value="endurance">Build endurance</option><option value="race">Prepare to race</option></select></label></div>'+
    '<button type="button" id="coachSaveProfile">SAVE RIDER PROFILE</button><p class="coach-small">Your profile and workout history are stored in this browser. No cloud sync or generative AI is connected.</p></section>'+
    '<section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">03 / PLAN</span><span class="coach-tag">ADAPTS TO FEEDBACK</span></div><h2>THIS WEEK.</h2><div id="coachWeek" class="coach-week"></div></section>'+
    '<section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">04 / PROGRESS</span></div><h2>COACHED WORKOUTS.</h2><div id="coachHistory"></div></section>'+ 
    '<section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">TRAINING AWARENESS</span><span class="coach-tag">NO GAMEPLAY CHANGES</span></div><h2>ALL BREAKAWAY RIDES.</h2><div id="coachPlatformHistory"><p class="coach-small">Loading local ride history…</p></div></section>'+ 
    '</aside></div></div>';
  document.body.append(screen);

  const hud=document.createElement('aside');
  hud.id='breakawayCoachHud';
  hud.className='coach-hud';
  hud.hidden=true;
  hud.setAttribute('aria-label','Live Breakaway Coach');
  hud.innerHTML='<div class="coach-hud-top"><strong>◆ BREAKAWAY COACH</strong><span id="coachHudState">WAITING FOR PEDALS</span><button type="button" id="coachMinimize" aria-label="Minimize coaching panel">−</button></div>'+
    '<div class="coach-hud-core"><div><small>ACTUAL</small><strong id="coachActual">—<span> W</span></strong></div><div><small>TARGET</small><strong id="coachTarget">—<span> W</span></strong></div><div><small>REMAINING</small><strong id="coachRemaining">—</strong></div></div>'+
    '<div class="coach-interval-line"><span id="coachInterval">WARM UP</span><span id="coachSessionClock">0:00</span></div><div class="coach-progress"><div id="coachProgressBar"></div></div>'+
    '<p id="coachPrompt" aria-live="polite">Connect a trainer, then start pedaling.</p>'+
    '<div class="coach-hud-actions"><button type="button" id="coachLighter">−5% EFFORT</button><button type="button" id="coachHarder">+5% EFFORT</button><button type="button" id="coachEnd">END COACHING</button></div>';
  document.body.append(hud);
  const $=(id:string)=>byId(screen,id);
  const h=(id:string)=>byId(hud,id);
  const workSelect=$('coachWorkout') as HTMLSelectElement;
  const styleSelect=$('coachControl') as HTMLSelectElement;
  function open(){
    if(session){hud.hidden=false;return;}
    screen.hidden=false;
    document.body.classList.add('coach-planning');
    render();
    void refreshPlatformHistory();
    window.scrollTo(0,0);
  }
  function close(){screen.hidden=true;document.body.classList.remove('coach-planning');}
  trigger.addEventListener('click',open);
  $('coachBack').addEventListener('click',close);
  function getWorkout(){return library.find(w=>w.id===selected)||library[0];}
  function render(){
    library=workoutLibrary(rider);
    workSelect.innerHTML=library.map(w=>'<option value="'+w.id+'">'+escapeHtml(w.name)+'</option>').join('');
    if(!library.some(w=>w.id===selected))selected='endurance';
    workSelect.value=selected;
    const w=getWorkout(), duration=workoutDuration(w);
    $('coachWorkoutInfo').innerHTML='<div><strong>'+escapeHtml(w.category.toUpperCase())+'</strong><span>'+Math.round(duration/60)+' MINUTES · '+w.segments.length+' SEGMENTS</span></div><p>'+escapeHtml(w.description)+'</p>';
    $('coachSegments').innerHTML=w.segments.map((s,i)=>{
      const color=s.low<.6?'#86b5da':s.low<.8?'#63d8bd':s.low<1?'#f9be70':'#fb7489';
      const height=Math.max(24,Math.min(100,Math.round(s.high*80)));
      return '<div class="coach-segment" title="'+escapeHtml(s.name)+' · '+Math.round(s.minutes)+' min · '+Math.round(s.low*100)+'–'+Math.round(s.high*100)+'% FTP" style="flex:'+s.minutes+'"><div style="height:'+height+'%;background:'+color+'"></div></div>';
    }).join('');
    ($('coachFtp') as HTMLInputElement).value=String(rider.ftp);
    ($('coachHours') as HTMLInputElement).value=String(rider.hours);
    ($('coachDays') as HTMLInputElement).value=String(rider.days);
    ($('coachRestDay') as HTMLSelectElement).value=String(rider.restDay);
    ($('coachExperience') as HTMLSelectElement).value=rider.experience;
    ($('coachGoal') as HTMLSelectElement).value=rider.goal;
    styleSelect.value=controlChoice;
    const history=historyRecords(), last=history.at(-1);
    const recentHardGame=platformRides.some(r=>r.mode!==null&&r.mode!=='classic'&&r.start<=Date.now()&&Date.now()-r.start<36*3600000&&r.elapsed>=1800&&r.avgPower!==null&&r.avgPower>=rider.ftp*.8);
    const fatigue=(last?.rpe!==null && typeof last?.rpe==='number' && last.rpe>=9)||recentHardGame;
    const week=recommendWeek(rider,!!fatigue), now=new Date().getDay();
    const weekdays=['SUN','MON','TUE','WED','THU','FRI','SAT'];
    $('coachWeek').innerHTML=week.map(day=>{
      const assigned=library.find(w=>w.id===day.workoutId);
      return '<button type="button" data-day-workout="'+(assigned?.id||'')+'" '+(!assigned?'disabled':'')+' class="'+(day.day===now?'coach-week-today':'')+'"><span>'+weekdays[day.day]+'</span><strong>'+(assigned?escapeHtml(assigned.name):'Rest day')+'</strong></button>';
    }).join('');
    $('coachHistory').innerHTML=history.length?history.slice(-5).reverse().map(r=>'<div class="coach-history-row"><strong>'+escapeHtml(r.workout)+'</strong><span>'+new Date(r.date).toLocaleDateString()+' · '+Math.round(r.elapsedSeconds/60)+' min · '+escapeHtml(r.mode.toUpperCase())+'</span></div>').join(''):'<p class="coach-small">Your coached rides will appear here.</p>';
    $('coachSuggestion').textContent=recentHardGame?'A recent Survival or Cycle Quest ride may have been demanding. Consider recovery before another hard session. This is a rough estimate from average power.':fatigue?'Your last coached workout felt very hard. Consider recovery or rest before another demanding effort.':'Choose a structured workout inside Classic. Survival and Cycle Quest remain free from training prescriptions.';
  }
  screen.querySelectorAll<HTMLButtonElement>('[data-coach-question]').forEach(button=>button.addEventListener('click',()=>{
    const question=button.dataset.coachQuestion;
    if(question==='tired'){selected='recovery';render();$('coachAnswer').textContent='Recovery Spin selected. If you feel unusually fatigued or unwell, consider rest instead of adding intensity.';}
    else if(question==='short'){selected='recovery';render();$('coachAnswer').textContent='Recovery Spin is a shorter option today. Missing one workout is better than cramming training into a busy week.';}
    else $('coachAnswer').textContent='This '+getWorkout().category.toLowerCase()+' session supports your '+rider.goal+' goal. The weekly plan alternates demanding and easier rides, with extra recovery after very hard feedback.';
  }));
  workSelect.addEventListener('change',()=>{selected=workSelect.value;render();});
  $('coachWeek').addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-day-workout]');
    if(button?.dataset.dayWorkout){selected=button.dataset.dayWorkout;render();}
  });
  styleSelect.addEventListener('change',()=>{controlChoice=styleSelect.value as CoachControl;});
  $('coachSaveProfile').addEventListener('click',()=>{
    rider=validProfile({
      ftp:Number(($('coachFtp') as HTMLInputElement).value),
      hours:Number(($('coachHours') as HTMLInputElement).value),
      days:Number(($('coachDays') as HTMLInputElement).value),
      restDay:Number(($('coachRestDay') as HTMLSelectElement).value),
      experience:($('coachExperience') as HTMLSelectElement).value,
      goal:($('coachGoal') as HTMLSelectElement).value
    });
    writeJson(COACH_PROFILE_KEY,rider);
    render();
    $('coachStatus').textContent='Profile saved on this device. Weekly recommendations updated.';
  });
  function release(){
    if(session?.control==='structured' && !isDemo)bridge.setMode('sim');
  }
  async function refreshPlatformHistory(){
    const output=$('coachPlatformHistory');
    try{
      platformRides=await bridge.getPlatformRides();
      const recent=platformRides.filter(r=>Number.isFinite(r.start)&&r.start>=Date.now()-7*86400000&&r.start<=Date.now());
      const hours=recent.reduce((total,r)=>total+Math.max(0,r.elapsed),0)/3600;
      const modes=['classic','survival','cyclequest'] as const;
      output.innerHTML='<p class="coach-small">'+platformRides.length+' locally saved rides · '+hours.toFixed(1)+' hours in the last 7 days. All three riding modes contribute to your training history. Only Classic uses prescribed workouts.</p>'+
       modes.map(mode=>'<div class="coach-history-row"><strong>'+({classic:'CLASSIC',survival:'SURVIVAL',cyclequest:'CYCLE QUEST'}[mode])+'</strong><span>'+recent.filter(r=>r.mode===mode).length+' rides · '+(recent.filter(r=>r.mode===mode).reduce((total,r)=>total+r.elapsed,0)/3600).toFixed(1)+' hours this week</span></div>').join('')+
       '<p class="coach-small">Older rides without a mode label count toward total hours. A potential hard-game-day alert uses duration and average power, not a clinical recovery assessment.</p>';
      render();
    }catch(error){output.textContent='Local ride history could not be loaded: '+String(error instanceof Error?error.message:error);}
  }
  function endCoaching(){
    if(session && session.elapsed>0 && !isDemo)saveRecord(session,null);
    release();session=null;isDemo=false;stopDemo();hud.hidden=true;close();
  }
  h('coachEnd').addEventListener('click',endCoaching);
  h('coachMinimize').addEventListener('click',()=>{
    hud.classList.toggle('coach-hud-minimized');
    h('coachMinimize').textContent=hud.classList.contains('coach-hud-minimized')?'+':'−';
  });
  function adjust(shift:number){
    if(!session)return;
    session.adjusted=Math.round(Math.min(1.25,Math.max(.7,session.adjusted+shift))*100)/100;
    if(session.control==='structured'&&!isDemo)bridge.setTarget(targetWatts(session.ftp,segmentAt(session.workout,session.elapsed).segment,session.adjusted));
    showHud();
  }
  h('coachLighter').addEventListener('click',()=>adjust(-.05));
  h('coachHarder').addEventListener('click',()=>adjust(.05));
  function start(workout:CoachWorkout,mode:CoachMode,control:CoachControl,demo=false){
    if(session || bridge.isRiding()){ $('coachStatus').textContent='Finish the current ride or coaching session before starting a new one.';return;}
    const supported=availableControls(mode);
    const actual=supported.includes(control)?control:'structured';
    session={workout,mode,control:actual,ftp:rider.ftp,elapsed:0,adjusted:1,measured:0,inRange:0,sumWatts:0,countWatts:0,done:false,previousIndex:-1};
    finishedId='';
    isDemo=demo;
    close();
    hud.hidden=false;
    hud.classList.remove('coach-hud-minimized');
    h('coachMinimize').textContent='−';
    if(!demo){
      bridge.setMode(actual==='structured'?'target':'sim');
      if(actual==='structured')bridge.setTarget(targetWatts(rider.ftp,workout.segments[0]));
      bridge.makeRoute(workoutDuration(workout),actual==='structured');
      bridge.launchMode('classic');
    }
    showHud();
  }
  $('coachStartClassic').addEventListener('click',()=>start(getWorkout(),'classic',controlChoice));
  let demoInput:HTMLInputElement|null=null;
  const demoControls=document.createElement('div');
  demoControls.id='coachDemoControls';
  demoControls.hidden=true;
  demoControls.innerHTML='<label>SIMULATED POWER <input id="coachDemoPower" type="range" min="0" max="450" step="5" value="130"></label><span id="coachDemoWatts">130 W</span><button type="button" id="coachDemoStop">STOP DEMO</button>';
  hud.append(demoControls);
  demoInput=demoControls.querySelector<HTMLInputElement>('#coachDemoPower')!;
  demoInput.addEventListener('input',()=>{demoWatts=Number(demoInput!.value);byId(demoControls,'coachDemoWatts').textContent=demoWatts+' W';});
  const demoStop=byId(demoControls,'coachDemoStop');
  demoStop.addEventListener('click',()=>{endCoaching();open();});
  $('coachDemo').addEventListener('click',()=>{
    const preview=workoutLibrary(rider).find(w=>w.id==='preview')!;
    demoWatts=130;demoInput!.value='130';
    start(preview,'classic',controlChoice,true);
    stopDemo();
    demoControls.hidden=false;
    let last=performance.now();
    demoTimer=window.setInterval(()=>{const now=performance.now();const dt=Math.min(1.5,(now-last)/1000);last=now;tick(dt,demoWatts,85,true);},250);
  });
  function stopDemo(){if(demoTimer!==null)window.clearInterval(demoTimer);demoTimer=null;demoControls.hidden=true;}
  function showHud(powerNow:number|null=null){
    if(!session)return;
    const w=session.workout, state=segmentAt(w,session.elapsed), complete=state.done||session.done;
    const target=targetWatts(session.ftp,state.segment,session.adjusted);
    h('coachHudState').textContent=isDemo?'SIMULATED DEMO':complete?'WORKOUT COMPLETE':session.elapsed===0?'WAITING FOR PEDALS':session.control==='structured'?'ERG CONTROL':session.control==='guided'?'GUIDED SIM':'RECORD ONLY';
    h('coachActual').innerHTML=(powerNow===null?'—':String(Math.round(powerNow)))+'<span> W</span>';
    h('coachTarget').innerHTML=session.control==='free'?'—<span> W</span>':String(target)+'<span> W</span>';
    h('coachRemaining').textContent=complete?'DONE':formatTime(state.remaining);
    h('coachInterval').textContent=state.segment.name.toUpperCase()+' · '+Math.round(state.segment.low*100)+'–'+Math.round(state.segment.high*100)+'% FTP';
    h('coachSessionClock').textContent=formatTime(session.elapsed)+' / '+formatTime(workoutDuration(w));
    h('coachProgressBar').style.width=Math.round(session.elapsed/workoutDuration(w)*100)+'%';
    let message='Connect a trainer, then start pedaling.';
    if(isDemo)message='SIMULATED telemetry only — no physical trainer or ride record.';
    else if(complete)message='Workout complete! Finish your ride when ready.';
    else if(session.elapsed>0 && powerNow!==null)message=inTargetRange(powerNow,session.ftp,state.segment,session.adjusted)?'On target. Smooth and controlled.':powerNow<session.ftp*state.segment.low*session.adjusted?'Below target. Build effort gradually.':'Above target. Ease back to your prescribed effort.';
    h('coachPrompt').textContent=message;
  }
  function tick(dt:number,watts:number,cadence:number,hasTelemetry:boolean){
    if(!session || session.done || !Number.isFinite(dt) || dt<=0 || (!hasTelemetry&&!isDemo))return;
    if(!isDemo && (!Number.isFinite(cadence)||cadence<10))return;
    const current=segmentAt(session.workout,session.elapsed);
    if(session.previousIndex!==current.index){
      session.previousIndex=current.index;
      if(session.control==='structured'&&!isDemo)bridge.setTarget(targetWatts(session.ftp,current.segment,session.adjusted));
    }
    const step=Math.min(3,dt,workoutDuration(session.workout)-session.elapsed);
    if(step<=0)return;
    if(Number.isFinite(watts) && watts>=0){
      session.sumWatts+=watts*step;session.countWatts+=step;
      session.measured+=step;
      if(inTargetRange(watts,session.ftp,current.segment,session.adjusted))session.inRange+=step;
    }
    session.elapsed+=step;
    const next=segmentAt(session.workout,session.elapsed);
    if(next.index!==current.index && session.control==='structured' && !isDemo)bridge.setTarget(targetWatts(session.ftp,next.segment,session.adjusted));
    if(session.elapsed>=workoutDuration(session.workout)){
      session.done=true;
      // Hold a gentle recovery target until the rider ends coaching or the ride.
      if(session.control==='structured' && !isDemo)bridge.setTarget(Math.max(30,Math.round(session.ftp*.45)));
      if(isDemo)stopDemo();
    }
    if(performance.now()-renderAt>250 || session.done){renderAt=performance.now();showHud(watts);}
  }
  function saveRecord(s:Session,rpe:number|null){
    const all=historyRecords();
    const record:CoachSessionRecord={
      id:new Date().toISOString()+':'+s.workout.id, date:new Date().toISOString(),
      workoutId:s.workout.id, workout:s.workout.name, mode:s.mode, control:s.control,
      elapsedSeconds:Math.round(s.elapsed),plannedSeconds:workoutDuration(s.workout),
      measuredSeconds:Math.round(s.measured), inRangeSeconds:Math.round(s.inRange),
      averageWatts:s.countWatts?Math.round(s.sumWatts/s.countWatts):null,
      rpe,complete:s.done
    };
    all.push(record);writeJson(COACH_HISTORY_KEY,all.slice(-150));
    return record;
  }
  function finish(){
    if(!session||isDemo)return null;
    const s=session;
    release();session=null;hud.hidden=true;
    if(s.elapsed<5)return null;
    const record=saveRecord(s,null);
    finishedId=record.id;
    const panel=document.createElement('section');
    panel.className='coach-finish-review';
    const pct=s.measured?Math.round(s.inRange/s.measured*100):null;
    panel.innerHTML='<h2>BREAKAWAY COACH / SESSION REVIEW</h2><p><strong>'+escapeHtml(s.workout.name)+'</strong> · '+Math.round(s.elapsed/60)+' minutes of '+Math.round(workoutDuration(s.workout)/60)+' planned</p>'+
    '<p>'+(pct===null?'No coached power adherence available.':'Time in prescribed power range: '+pct+'% of measured time.')+'</p>'+
    '<p>How hard did the workout feel? Rate your overall effort.</p><div class="coach-rpe-buttons"><button type="button" data-coach-rpe="2">Easy</button><button type="button" data-coach-rpe="5">Moderate</button><button type="button" data-coach-rpe="8">Hard</button><button type="button" data-coach-rpe="10">Maximal</button></div>'+
    '<p id="coachReviewMessage">Feedback stays in this browser and informs your next suggested week.</p>';
    panel.querySelectorAll<HTMLButtonElement>('[data-coach-rpe]').forEach(button=>button.addEventListener('click',()=>{
      const rpe=Number(button.dataset.coachRpe);
      const history=historyRecords();
      const match=history.slice().reverse().find(r=>r.id===finishedId);
      if(!match)return;
      match.rpe=rpe;writeJson(COACH_HISTORY_KEY,history);
      const note=byId(panel,'coachReviewMessage');
      note.textContent=feedbackRecommendation(rpe);
      panel.querySelectorAll<HTMLButtonElement>('[data-coach-rpe]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    }));
    return panel;
  }
  function snapshot(){
    if(!session)return null;
    const seg=segmentAt(session.workout,session.elapsed);
    return {name:session.workout.name,mode:session.mode,control:session.control,remaining:formatTime(seg.remaining),target:targetWatts(session.ftp,seg.segment,session.adjusted),done:session.done};
  }
  render();
  mountCoachHistory($('coachHistoryImport'),{applySuggestion:(suggestion)=>{
    rider=validProfile({...rider,...suggestion});
    writeJson(COACH_PROFILE_KEY,rider);
    render();
  }});
  return {tick,finish,endCoaching,snapshot,get mode(){return session?.mode||null;},get active(){return !!session;}};
}
