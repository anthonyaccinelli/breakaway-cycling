// Breakaway Coach strength preview. Pure, deterministic planning logic: no device API or network.
import type {CoachProfile} from './coach-engine';
export const STRENGTH_KEY='breakaway.coach.strength.settings.v1';
export const STRENGTH_HISTORY_KEY='breakaway.coach.strength.history.v1';
export type Equipment='bodyweight'|'dumbbells'|'kettlebells'|'bands'|'barbell'|'bench'|'pullup';
export type StrengthExperience='beginner'|'intermediate'|'advanced';
export type StrengthSettings={enabled:boolean;equipment:Equipment[];experience:StrengthExperience;sessions:number;minutes:number;notes:string};
export const defaultStrength:StrengthSettings={enabled:false,equipment:['bodyweight'],experience:'beginner',sessions:1,minutes:30,notes:''};
export const equipmentChoices:{id:Equipment;label:string;detail:string}[]=[
 {id:'bodyweight',label:'Bodyweight',detail:'Floor space only'},
 {id:'dumbbells',label:'Dumbbells',detail:'Fixed or adjustable'},
 {id:'kettlebells',label:'Kettlebells',detail:'Single or paired'},
 {id:'bands',label:'Resistance bands',detail:'Light to heavy'},
 {id:'barbell',label:'Squat rack + barbell',detail:'With plates'},
 {id:'bench',label:'Weight bench',detail:'Flat or adjustable'},
 {id:'pullup',label:'Pull-up bar',detail:'Safe, securely mounted'}
];
export function validStrength(raw:unknown):StrengthSettings{
 const v=(raw&&typeof raw==='object'?raw:{}) as Partial<StrengthSettings>;
 const eq=Array.isArray(v.equipment)?v.equipment.filter((x):x is Equipment=>equipmentChoices.some(e=>e.id===x)):[];
 const unique=Array.from(new Set<Equipment>(['bodyweight',...eq]));
 return {enabled:v.enabled===true,equipment:unique,
  experience:['beginner','intermediate','advanced'].includes(String(v.experience))?v.experience as StrengthExperience:'beginner',
  sessions:v.sessions===2?2:1,minutes:[20,30,45].includes(Number(v.minutes))?Number(v.minutes):30,
  notes:typeof v.notes==='string'?v.notes.slice(0,150):''};
}
export type StrengthExercise={
 id:string;name:string;pattern:string;equipment:Equipment[];
 instructions:string;reps:string;sets:number;restSeconds:number;loadHint:string;alternatives:string[];
};
type ExerciseOption=Omit<StrengthExercise,'sets'|'restSeconds'|'alternatives'>;
const catalog:ExerciseOption[]=[
 {id:'body-squat',name:'Tempo Bodyweight Squat',pattern:'Squat',equipment:['bodyweight'],reps:'8–12',loadHint:'Bodyweight',instructions:'Move slowly with controlled range; stop if form deteriorates.'},
 {id:'split-squat',name:'Supported Split Squat',pattern:'Squat',equipment:['bodyweight'],reps:'8 / side',loadHint:'Bodyweight',instructions:'Hold a stable support for balance; lower only as far as controlled.'},
 {id:'db-goblet',name:'Dumbbell Goblet Squat',pattern:'Squat',equipment:['dumbbells'],reps:'6–10',loadHint:'Choose a manageable dumbbell',instructions:'Hold the dumbbell near the chest; maintain a stable trunk.'},
 {id:'kb-goblet',name:'Kettlebell Goblet Squat',pattern:'Squat',equipment:['kettlebells'],reps:'6–10',loadHint:'Choose a manageable kettlebell',instructions:'Hold the bell in front of the chest and squat under control.'},
 {id:'bar-squat',name:'Barbell Back Squat',pattern:'Squat',equipment:['barbell'],reps:'5–8',loadHint:'Begin conservatively; avoid grinding reps',instructions:'Use the rack safeties and an appropriate practiced technique.'},
 {id:'hip-bridge',name:'Glute Bridge',pattern:'Hinge',equipment:['bodyweight'],reps:'10–15',loadHint:'Bodyweight',instructions:'Drive through the feet and extend hips without arching the back.'},
 {id:'single-bridge',name:'Single-Leg Glute Bridge',pattern:'Hinge',equipment:['bodyweight'],reps:'8 / side',loadHint:'Bodyweight',instructions:'Keep pelvis level and use smooth controlled reps.'},
 {id:'db-rdl',name:'Dumbbell Romanian Deadlift',pattern:'Hinge',equipment:['dumbbells'],reps:'8–10',loadHint:'Two comfortable dumbbells',instructions:'Hinge at hips, soft knees, keep weights close and back neutral.'},
 {id:'kb-deadlift',name:'Kettlebell Deadlift',pattern:'Hinge',equipment:['kettlebells'],reps:'8–10',loadHint:'Comfortable kettlebell',instructions:'Hinge from hips with the bell near the feet and stand tall.'},
 {id:'bar-rdl',name:'Barbell Romanian Deadlift',pattern:'Hinge',equipment:['barbell'],reps:'6–8',loadHint:'Comfortable barbell load',instructions:'Control the hinge, keep the bar close and do not round the lower back.'},
 {id:'pushup',name:'Incline or Floor Push-Up',pattern:'Push',equipment:['bodyweight'],reps:'6–12',loadHint:'Bodyweight',instructions:'Use a stable elevated surface if needed; keep body aligned.'},
 {id:'db-press',name:'Dumbbell Floor Press',pattern:'Push',equipment:['dumbbells'],reps:'8–12',loadHint:'Light dumbbells to start',instructions:'Keep upper arms controlled on the floor and press smoothly.'},
 {id:'kb-press',name:'Kettlebell Floor Press',pattern:'Push',equipment:['kettlebells'],reps:'8 / side',loadHint:'Light kettlebell to start',instructions:'Press one arm at a time and keep wrist neutral.'},
 {id:'bar-bench',name:'Barbell Bench Press',pattern:'Push',equipment:['barbell','bench'],reps:'6–10',loadHint:'Use a spotter or suitable safeties',instructions:'Practice bench setup and use a spotter or safeties.'},
 {id:'prone-ytw',name:'Prone Y–T–W Raises',pattern:'Pull',equipment:['bodyweight'],reps:'8 each',loadHint:'Bodyweight shoulder control',instructions:'Lift arms gently in Y, T, W shapes. Not a substitute for heavy pulling.'},
 {id:'band-row',name:'Anchored Band Row',pattern:'Pull',equipment:['bands'],reps:'10–15',loadHint:'Secure band anchor',instructions:'Use a secure anchor and pull shoulder blades back under control.'},
 {id:'db-row',name:'Single-Arm Dumbbell Row',pattern:'Pull',equipment:['dumbbells'],reps:'8–12 / side',loadHint:'Comfortable dumbbell',instructions:'Support yourself and pull elbow toward the hip without twisting.'},
 {id:'kb-row',name:'Single-Arm Kettlebell Row',pattern:'Pull',equipment:['kettlebells'],reps:'8–12 / side',loadHint:'Comfortable kettlebell',instructions:'Hinge with a stable torso; pull elbow near the rib cage.'},
 {id:'bar-row',name:'Barbell Bent-Over Row',pattern:'Pull',equipment:['barbell'],reps:'6–10',loadHint:'Controlled barbell load',instructions:'Hinge and brace; row without jerking or rounding the back.'},
 {id:'pull-up',name:'Assisted or Strict Pull-Up',pattern:'Pull',equipment:['pullup'],reps:'3–8',loadHint:'Bodyweight or assisted',instructions:'Use a secure bar and an assisted version if needed.'},
 {id:'dead-bug',name:'Dead Bug',pattern:'Core',equipment:['bodyweight'],reps:'8 / side',loadHint:'Bodyweight',instructions:'Brace gently and extend opposing limbs without arching the back.'},
 {id:'side-plank',name:'Side Plank',pattern:'Core',equipment:['bodyweight'],reps:'20–30 sec / side',loadHint:'Bodyweight',instructions:'Keep hips stacked and use knees-down variation when needed.'},
 {id:'suitcase',name:'Suitcase Carry',pattern:'Core',equipment:['dumbbells'],reps:'30 sec / side',loadHint:'Manageable dumbbell',instructions:'Walk slowly without leaning toward the weight.'},
 {id:'kb-suitcase',name:'Kettlebell Suitcase Carry',pattern:'Core',equipment:['kettlebells'],reps:'30 sec / side',loadHint:'Manageable kettlebell',instructions:'Stay tall, avoid leaning and take small controlled steps.'},
 {id:'calf-raise',name:'Standing Calf Raise',pattern:'Calf',equipment:['bodyweight'],reps:'10–15',loadHint:'Bodyweight',instructions:'Raise and lower heels smoothly, with stable support if needed.'}
];
export const exerciseCatalog=catalog;
export function availableExercises(settings:StrengthSettings,pattern?:string){
 const has=new Set(validStrength(settings).equipment);
 return catalog.filter(e=>(!pattern||e.pattern===pattern)&&e.equipment.every(x=>has.has(x)));
}
const pick=(settings:StrengthSettings,pattern:string,priority:string[]):ExerciseOption=>{
 const options=availableExercises(settings,pattern);
 return priority.map(id=>options.find(e=>e.id===id)).find(Boolean)||options[0];
};
export function strengthRoutine(raw:StrengthSettings,variation:'A'|'B'='A',light=false){
 const s=validStrength(raw);
 const beginner=s.experience==='beginner',sets=light?1:beginner?2:3;
 const patterns=['Squat','Hinge','Push','Pull','Core'];
 const prefs:Record<string,string[]>={
  Squat:variation==='A'?['bar-squat','db-goblet','kb-goblet','body-squat']:['split-squat','db-goblet','kb-goblet','body-squat','bar-squat'],
  Hinge:variation==='A'?['bar-rdl','db-rdl','kb-deadlift','hip-bridge']:['single-bridge','db-rdl','kb-deadlift','hip-bridge'],
  Push:variation==='A'?['bar-bench','db-press','kb-press','pushup']:['pushup','db-press','kb-press','bar-bench'],
  Pull:variation==='A'?['db-row','kb-row','bar-row','band-row','pull-up','prone-ytw']:['band-row','pull-up','db-row','kb-row','bar-row','prone-ytw'],
  Core:variation==='A'?['dead-bug','suitcase','kb-suitcase','side-plank']:['side-plank','suitcase','kb-suitcase','dead-bug']
 };
 return {id:'strength-'+variation.toLowerCase(),title:light?'Recovery Strength & Mobility':'Full Body Strength '+variation,
  minutes:light?20:s.minutes,light,
  note:light?'Recent fatigue suggests a very easy session or rest. Skip if sore or unwell.':'Leave about 2–3 repetitions in reserve and prioritize control over heavy loads.',
  exercises:patterns.map(pattern=>{
    const chosen=pick(s,pattern,prefs[pattern]);
    return {...chosen,sets:pattern==='Core'?Math.max(1,sets-1):sets,restSeconds:light?45:beginner?60:90,
     alternatives:availableExercises(s,pattern).filter(e=>e.id!==chosen.id).map(e=>e.id)} as StrengthExercise;
  })};
}
export type IntegratedDay={day:number;cyclingId:string|null;cyclingMinutes:number;strength:'A'|'B'|null;strengthMinutes:number;reason:string};
export function integratedWeek(profile:CoachProfile,raw:StrengthSettings,
 base:{day:number;workoutId:string|null;reason:string}[],
 cyclingMinutes:(id:string)=>number):{days:IntegratedDay[];budgetMinutes:number;plannedMinutes:number;note:string}{
 const s=validStrength(raw),budgetMinutes=Math.round(Math.max(60,profile.hours*60));
 const days=base.map(d=>({day:d.day,cyclingId:d.workoutId,cyclingMinutes:d.workoutId?cyclingMinutes(d.workoutId):0,
   strength:null as 'A'|'B'|null,strengthMinutes:0,reason:d.reason}));
 if(!s.enabled)return {days,budgetMinutes,plannedMinutes:days.reduce((n,d)=>n+d.cyclingMinutes,0),note:'Strength training is turned off.'};
 // Strength sessions must fit within the user's existing training days, not add surprise training days.
 const candidates=days.filter(d=>d.cyclingId&&d.day!==profile.restDay)
  .sort((a,b)=>((a.cyclingId==='endurance'||a.cyclingId==='recovery')?-1:1)-((b.cyclingId==='endurance'||b.cyclingId==='recovery')?-1:1));
 const chosen:IntegratedDay[]=[];
 for(const day of candidates){
  if(chosen.length>=s.sessions)break;
  if(chosen.some(other=>Math.abs(other.day-day.day)===1))continue;
  chosen.push(day);
 }
 let allocated=0;
 for(const d of chosen){d.strength=allocated?'B':'A';d.strengthMinutes=s.minutes;allocated++;}
 // Reserve strength time first. Shorten non-key cycling sessions if necessary; do not exceed the budget.
 let used=days.reduce((n,d)=>n+d.cyclingMinutes+d.strengthMinutes,0);
 if(used>budgetMinutes){
  const adjustable=[...days].filter(d=>d.cyclingId).sort((a,b)=>{
   const rank=(d:IntegratedDay)=>d.cyclingId==='recovery'?0:d.cyclingId==='endurance'?1:d.cyclingId==='tempo'?2:3;
   return rank(a)-rank(b);
  });
  for(const day of adjustable){
   if(used<=budgetMinutes)break;
   const min=day.strength?0:15;
   const decrement=Math.min(day.cyclingMinutes-min,used-budgetMinutes);
   if(decrement>0){day.cyclingMinutes-=decrement;used-=decrement;if(day.cyclingMinutes===0)day.cyclingId=null;}
  }
  // If total time is extremely constrained, reduce or skip strength rather than exceeding rider's total hours.
  for(const day of [...chosen].reverse()){
   if(used<=budgetMinutes)break;
   const reducible=Math.max(0,day.strengthMinutes-15);
   const remove=Math.min(reducible,used-budgetMinutes);
   day.strengthMinutes-=remove;used-=remove;
   if(used>budgetMinutes){used-=day.strengthMinutes;day.strengthMinutes=0;day.strength=null;}
  }
  for(const day of adjustable){if(used<=budgetMinutes)break;const extra=Math.min(day.cyclingMinutes,used-budgetMinutes);day.cyclingMinutes-=extra;used-=extra;if(day.cyclingMinutes===0)day.cyclingId=null;}
 }
 const plannedMinutes=days.reduce((n,d)=>n+d.cyclingMinutes+d.strengthMinutes,0);
 const n=days.filter(d=>d.strength).length;
 return {days,budgetMinutes,plannedMinutes,note:n?s.sessions>n?'Limited time or available training days reduced strength frequency.':'Strength sessions are included in your total weekly time budget.':'Not enough available time or separate training days for strength. Consider increasing your weekly training time or lowering other sessions.'};
}
export type StrengthSetLog={exerciseId:string;set:number;reps:string;load:string;done:boolean};
export type StrengthRecord={id:string;date:string;routine:string;minutes:number;completedSets:number;plannedSets:number;rpe:number|null;sets:StrengthSetLog[]};
