import {
  COACH_HISTORY_KEY, COACH_PROFILE_KEY, defaultProfile, availableControls,
  feedbackRecommendation, inTargetRange, intervalRequirements, recommendWeek, segmentAt, targetWatts,
  validProfile, workoutDuration, workoutLibrary
} from './coach-engine';
import type {CoachControl, CoachMode, CoachProfile, CoachSessionRecord, CoachWorkout} from './coach-engine';
import './coach.css';
import {mountCoachHistory} from './coach-history-ui';
import './coach-v2.css';

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
  // The visible Classic Route Studio owns the Coach banner; delegate its click
  // so it continues to work when that shell is unmounted and recreated.
  const classicRoute=document.getElementById('screenRoute');
  const screen=document.createElement('section');
  screen.id='breakawayCoachScreen';
  screen.className='coach-screen coach-v2';
  screen.hidden=true;
  screen.innerHTML = `
<header class="coach-top">
  <div class="coach-identity">
    <div class="coach-eyebrow">RIDE BREAKAWAY <span>/</span> CLASSIC <span>/</span> COACH</div>
    <h1>Breakaway <em>Coach.</em></h1>
    <p>Train with a plan. Enjoy the ride.</p>
  </div>
  <div class="coach-header-actions">
    <span id="coachHeaderFtp" class="coach-ftp-chip">FTP 200 W</span>
    <button type="button" class="coach-back" id="coachBack">← BACK TO CLASSIC</button>
  </div>
</header>
<nav class="coach-nav" role="tablist" aria-label="Breakaway Coach navigation">
  <button type="button" id="coachTabToday" role="tab" aria-controls="coachViewToday" aria-selected="true" tabindex="0" data-coach-tab="today">◉ <span>Today's Ride</span></button>
  <button type="button" id="coachTabPlan" role="tab" aria-controls="coachViewPlan" aria-selected="false" tabindex="-1" data-coach-tab="plan">▦ <span>Training Plan</span></button>
  <button type="button" id="coachTabHistory" role="tab" aria-controls="coachViewHistory" aria-selected="false" tabindex="-1" data-coach-tab="history">▥ <span>Ride History</span></button>
  <button type="button" id="coachTabSettings" role="tab" aria-controls="coachViewSettings" aria-selected="false" tabindex="-1" data-coach-tab="settings">⚙ <span>Rider Settings</span></button>
</nav>
<div class="coach-main" role="main">
  <section class="coach-view" id="coachViewToday" role="tabpanel" aria-labelledby="coachTabToday" data-coach-view="today">
    <div class="coach-page-lead"><div><span class="coach-tag">YOUR NEXT SESSION</span><h2>Today's ride.</h2><p id="coachSuggestion">Choose a workout, connect your trainer, and ride.</p></div><button type="button" class="coach-subtle-link" data-navigate-coach="plan">See training plan →</button></div>
    <div class="coach-today-grid">
      <section class="coach-panel coach-workout-card">
        <div class="coach-section-top"><span class="coach-tag">WORKOUT</span><span class="coach-feature-pill">CLASSIC ONLY</span></div>
        <label class="coach-label" for="coachWorkout">CHOOSE YOUR WORKOUT</label>
        <select id="coachWorkout" class="coach-select"></select>
        <div id="coachWorkoutInfo" class="coach-workout-info"></div>
        <div class="coach-interval-readout" id="coachIntervalDetails" aria-live="polite" aria-atomic="true"></div>
        <div id="coachSegments" class="coach-segments" role="group" aria-label="Workout blocks: hover, focus, or tap a block to inspect its duration and wattage requirements"></div>
        <div class="coach-start-controls"><label for="coachControl">TRAINER CONTROL</label>
          <select id="coachControl" class="coach-select">
            <option value="structured">ERG — trainer holds the target power</option>
            <option value="guided">SIM — you control effort over terrain</option>
          </select>
        </div>
        <button type="button" id="coachStartClassic" class="coach-classic-start">CONTINUE TO CONNECT TRAINER <span aria-hidden="true">→</span></button>
        <p class="coach-start-note">Next: Classic Devices. Connect your trainer and start pedaling.</p>
        <div class="coach-quick"><button type="button" data-coach-question="tired">Feeling tired?</button><button type="button" data-coach-question="short">Short on time?</button><button type="button" data-coach-question="why">Why this workout?</button></div>
        <p id="coachAnswer" class="coach-feedback" aria-live="polite">Your workout is based on your saved FTP and experience.</p>
        <p id="coachStatus" class="coach-status" role="status"></p>
      </section>
      <aside class="coach-today-side">
        <section class="coach-panel coach-mini-card">
          <div class="coach-section-top"><span class="coach-tag">YOUR PROFILE</span><button type="button" class="coach-subtle-link" data-navigate-coach="settings">Edit →</button></div>
          <div id="coachProfileSummary" class="coach-profile-summary"></div>
        </section>
        <section class="coach-panel coach-mini-card">
          <div class="coach-section-top"><span class="coach-tag">UPCOMING</span><button type="button" class="coach-subtle-link" data-navigate-coach="plan">Full week →</button></div>
          <h3>Keep your momentum.</h3><div id="coachNextUp"></div>
        </section>
        <button type="button" id="coachDemo" class="coach-demo-button">TRY THE 8-MINUTE WORKOUT DEMO <small>NO TRAINER NEEDED →</small></button>
      </aside>
    </div>
  </section>
  <section class="coach-view" id="coachViewPlan" role="tabpanel" aria-labelledby="coachTabPlan" data-coach-view="plan" hidden>
    <div class="coach-page-lead"><div><span class="coach-tag">BUILD CONSISTENCY</span><h2>Your training plan.</h2><p>Select a day or browse the workout library, then head to Today's Ride.</p></div><button type="button" class="coach-subtle-link" data-navigate-coach="settings">Change schedule →</button></div>
    <div class="coach-plan-grid">
      <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">THIS WEEK</span><span class="coach-small">Select a day to load its workout</span></div><div id="coachWeek" class="coach-week"></div></section>
      <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">WORKOUT LIBRARY</span></div><div id="coachPlanLibrary" class="coach-library-list"></div><p class="coach-small">Initial recommendations only; detailed long-term periodization is a future feature.</p></section>
    </div>
  </section>
  <section class="coach-view" id="coachViewHistory" role="tabpanel" aria-labelledby="coachTabHistory" data-coach-view="history" hidden>
    <div class="coach-page-lead"><div><span class="coach-tag">TRACK YOUR PROGRESS</span><h2>Ride history.</h2><p>Bring in your cycling history and review rides from all Breakaway modes.</p></div></div>
    <div class="coach-history-grid">
      <section class="coach-panel coach-history-host" id="coachHistoryImport"></section>
      <div class="coach-history-side">
        <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">ALL BREAKAWAY RIDES</span></div><div id="coachPlatformHistory"><p class="coach-small">Loading local rides…</p></div></section>
        <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">COACHED WORKOUTS</span></div><div id="coachHistory"></div></section>
      </div>
    </div>
  </section>
  <section class="coach-view" id="coachViewSettings" role="tabpanel" aria-labelledby="coachTabSettings" data-coach-view="settings" hidden>
    <div class="coach-page-lead"><div><span class="coach-tag">PERSONALIZE</span><h2>Rider settings.</h2><p>Tell Coach how you ride and how much time you have.</p></div></div>
    <div class="coach-settings-grid">
      <section class="coach-panel">
        <div class="coach-section-top"><span class="coach-tag">YOUR RIDER PROFILE</span><span class="coach-tag">LOCAL ONLY</span></div>
        <div class="coach-fields">
          <label>FTP (W)<input id="coachFtp" type="number" min="75" max="550" step="1"></label>
          <label>HOURS / WEEK<input id="coachHours" type="number" min="1" max="20" step=".5"></label>
          <label>DAYS / WEEK<input id="coachDays" type="number" min="2" max="7" step="1"></label>
          <label>REST DAY<select id="coachRestDay"><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select></label>
          <label>LEVEL<select id="coachExperience"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label>GOAL<select id="coachGoal"><option value="fitness">Ride consistently</option><option value="ftp">Increase FTP</option><option value="endurance">Build endurance</option><option value="race">Prepare to race</option></select></label>
        </div>
        <button type="button" id="coachSaveProfile" class="coach-classic-start">SAVE RIDER SETTINGS →</button><p id="coachSettingsFeedback" class="coach-settings-feedback" role="status"></p>
        <p class="coach-small">Your profile and recent coached workouts are saved in this browser. No cloud sync or generative AI is connected.</p>
      </section>
      <section class="coach-panel coach-howto">
        <span class="coach-tag">HOW COACH WORKS</span><h3>Three easy steps.</h3>
        <div class="coach-howto-step"><strong>1. Set your schedule</strong><p>Your FTP, days, and goals determine your starting workouts.</p></div>
        <div class="coach-howto-step"><strong>2. Choose a workout</strong><p>Use the suggested ride or pick an alternative from the plan.</p></div>
        <div class="coach-howto-step"><strong>3. Ride in Classic</strong><p>ERG holds power targets; SIM lets you control effort on terrain.</p></div>
        <button type="button" class="coach-subtle-link" data-navigate-coach="today">Go to today's ride →</button>
      </section>
    </div>
  </section>
</div>
`;
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
  type CoachTab='today'|'plan'|'history'|'settings';
  const tabs:Array<CoachTab>=['today','plan','history','settings'];
  let activeTab:CoachTab='today';
  function navigate(tab:CoachTab,focus=false){
    activeTab=tab;
    screen.querySelectorAll<HTMLButtonElement>('[data-coach-tab]').forEach(button=>{
      const selected=button.dataset.coachTab===tab;
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex=selected?0:-1;
      if(selected&&focus)button.focus();
    });
    screen.querySelectorAll<HTMLElement>('[data-coach-view]').forEach(view=>{
      view.hidden=view.dataset.coachView!==tab;
    });
    screen.scrollTop=0;
    if(tab==='history')void refreshPlatformHistory();
  }
  screen.querySelectorAll<HTMLButtonElement>('[data-coach-tab]').forEach(button=>{
    button.addEventListener('click',()=>navigate(button.dataset.coachTab as CoachTab));
    button.addEventListener('keydown',event=>{
      const current=tabs.indexOf(button.dataset.coachTab as CoachTab);
      let next=-1;
      if(event.key==='ArrowRight')next=(current+1)%tabs.length;
      if(event.key==='ArrowLeft')next=(current+tabs.length-1)%tabs.length;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=tabs.length-1;
      if(next>=0){event.preventDefault();navigate(tabs[next],true);}
    });
  });
  screen.querySelectorAll<HTMLButtonElement>('[data-navigate-coach]').forEach(button=>button.addEventListener('click',()=>{
    const tab=button.dataset.navigateCoach as CoachTab;
    if(tabs.includes(tab))navigate(tab,true);
  }));
  function open(){
    if(session){hud.hidden=false;return;}
    screen.hidden=false;
    document.body.classList.add('coach-planning');
    navigate('today');
    render();
    void refreshPlatformHistory();
    window.scrollTo(0,0);
  }
  function close(){screen.hidden=true;document.body.classList.remove('coach-planning');}
  classicRoute?.addEventListener('click',event=>{
    const target=event.target;
    if(target instanceof Element && target.closest('#openBreakawayCoach'))open();
  });
  $('coachBack').addEventListener('click',close);
  function getWorkout(){return library.find(w=>w.id===selected)||library[0];}
  function showIntervalRequirements(index:number){
    const workout=getWorkout(), segment=workout.segments[index];
    if(!segment)return;
    const requirements=intervalRequirements(rider.ftp,segment);
    $('coachIntervalDetails').innerHTML=
      '<div class="coach-interval-identity"><span class="coach-interval-kicker">BLOCK '+(index+1)+' / '+workout.segments.length+'</span>'+
      '<strong>'+escapeHtml(segment.name)+'</strong><small>'+requirements.ftpRange+'</small></div>'+
      '<div class="coach-interval-numbers"><div><span>DURATION</span><strong>'+requirements.duration+'</strong></div>'+
      '<div><span>POWER RANGE</span><strong>'+requirements.range+'</strong></div>'+
      '<div><span>ERG TARGET</span><strong>'+requirements.target+' W</strong></div></div>';
    $('coachSegments').querySelectorAll<HTMLButtonElement>('[data-coach-segment]').forEach(button=>{
      button.setAttribute('aria-pressed',String(Number(button.dataset.coachSegment)===index));
    });
  }
  const chart=$('coachSegments');
  const inspect=(event:Event)=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const button=target.closest<HTMLButtonElement>('[data-coach-segment]');
    if(button&&chart.contains(button))showIntervalRequirements(Number(button.dataset.coachSegment));
  };
  chart.addEventListener('pointerover',inspect);
  chart.addEventListener('focusin',inspect);
  chart.addEventListener('click',inspect);
  function render(){
    library=workoutLibrary(rider);
    workSelect.innerHTML=library.map(w=>'<option value="'+w.id+'">'+escapeHtml(w.name)+'</option>').join('');
    if(!library.some(w=>w.id===selected))selected='endurance';
    workSelect.value=selected;
    const w=getWorkout(), duration=workoutDuration(w);
    $('coachWorkoutInfo').innerHTML='<div><strong>'+escapeHtml(w.category.toUpperCase())+'</strong><span>'+Math.round(duration/60)+' MINUTES · '+w.segments.length+' SEGMENTS</span></div><p>'+escapeHtml(w.description)+'</p>';
    $('coachSegments').innerHTML=w.segments.map((segment,i)=>{
      const color=segment.low<.6?'#86b5da':segment.low<.8?'#63d8bd':segment.low<1?'#f9be70':'#fb7489';
      const height=Math.max(24,Math.min(100,Math.round(segment.high*80)));
      const info=intervalRequirements(rider.ftp,segment);
      const description=segment.name+' — '+info.duration+' duration, '+info.range+' power range, '+info.target+' W ERG target ('+info.ftpRange+')';
      return '<button type="button" class="coach-segment" data-coach-segment="'+i+'" aria-pressed="false" aria-label="'+escapeHtml(description)+'" title="'+escapeHtml(description)+'" style="flex:'+segment.minutes+'">'+
        '<span class="coach-segment-bar" aria-hidden="true" style="height:'+height+'%;background:'+color+'"></span></button>';
    }).join('');
    showIntervalRequirements(0);
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
    $('coachHeaderFtp').textContent='FTP '+rider.ftp+' W';
    $('coachProfileSummary').innerHTML=
      '<div><strong>'+rider.ftp+' W</strong><span>FTP</span></div>'+
      '<div><strong>'+rider.hours+' h</strong><span>Per week</span></div>'+
      '<div><strong>'+rider.days+' days</strong><span>Training days</span></div>';
    const upcoming=week.filter(day=>day.day>=now&&day.workoutId).slice(0,3);
    const later=upcoming.length?upcoming:week.filter(day=>day.workoutId).slice(0,3);
    $('coachNextUp').innerHTML=later.length?later.map(day=>{
      const name=library.find(w=>w.id===day.workoutId)?.name||'Easy ride';
      return '<button type="button" class="coach-upcoming-item" data-upcoming-workout="'+escapeHtml(day.workoutId||'')+'"><strong>'+weekdays[day.day]+'</strong><span>'+escapeHtml(name)+'</span><span aria-hidden="true">→</span></button>';
    }).join(''):'<p class="coach-small">Rest and recover. Your next workout will be on the plan.</p>';
    $('coachPlanLibrary').innerHTML=library.map(w=>{
      const mins=Math.round(workoutDuration(w)/60);
      return '<button type="button" class="coach-library-item" data-library-workout="'+escapeHtml(w.id)+'"><span><strong>'+escapeHtml(w.name)+'</strong><small>'+escapeHtml(w.category)+' · '+mins+' min</small></span><span aria-hidden="true">→</span></button>';
    }).join('');
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
    if(button?.dataset.dayWorkout){selected=button.dataset.dayWorkout;render();navigate('today');}
  });
  $('coachPlanLibrary').addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-library-workout]');
    if(button?.dataset.libraryWorkout){selected=button.dataset.libraryWorkout;render();navigate('today');}
  });
  $('coachNextUp').addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-upcoming-workout]');
    if(button?.dataset.upcomingWorkout){selected=button.dataset.upcomingWorkout;render();navigate('today');}
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
    $('coachSettingsFeedback').textContent='Saved. Your recommended workouts and weekly plan are updated.';
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
    h('coachTarget').innerHTML=String(target)+'<span> W</span>';
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
