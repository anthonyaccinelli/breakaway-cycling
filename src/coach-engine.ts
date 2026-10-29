// Breakaway Coach preview: pure workout model, no device or network access.
export type CoachMode = 'classic';
export type CoachControl = 'structured' | 'guided';
export type CoachGoal = 'fitness' | 'ftp' | 'endurance' | 'race';
export type CoachExperience = 'beginner' | 'intermediate' | 'advanced';
export type CoachProfile = {
  ftp: number;
  hours: number;
  days: number;
  restDay: number; // 0 Sunday through 6 Saturday
  goal: CoachGoal;
  experience: CoachExperience;
};
export type CoachSegment = { name: string; minutes: number; low: number; high: number };
export type CoachWorkout = { id: string; name: string; description: string; segments: CoachSegment[]; category: string };
export type CoachSessionRecord = {
  id: string;
  date: string;
  workoutId: string;
  workout: string;
  mode: CoachMode;
  control: CoachControl;
  elapsedSeconds: number;
  plannedSeconds: number;
  inRangeSeconds: number;
  measuredSeconds: number;
  averageWatts: number | null;
  rpe: number | null;
  complete: boolean;
};

export const COACH_PROFILE_KEY = 'breakaway.coach.profile.v1';
export const COACH_HISTORY_KEY = 'breakaway.coach.history.v1';
export const defaultProfile: CoachProfile = { ftp: 200, hours: 5, days: 3, restDay: 6, goal: 'fitness', experience: 'beginner' };
export function validProfile(raw: unknown): CoachProfile {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<CoachProfile>;
  const bound = (value: unknown, min: number, max: number, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  return {
    ftp: Math.round(bound(p.ftp, 75, 550, defaultProfile.ftp)),
    hours: bound(p.hours, 1, 20, defaultProfile.hours),
    days: Math.round(bound(p.days, 2, 6, defaultProfile.days)),
    restDay: Math.round(bound(p.restDay, 0, 6, defaultProfile.restDay)), 
    goal: ['fitness','ftp','endurance','race'].includes(String(p.goal)) ? p.goal as CoachGoal : 'fitness',
    experience: ['beginner','intermediate','advanced'].includes(String(p.experience)) ? p.experience as CoachExperience : 'beginner'
  };
}
const block = (name: string, minutes: number, low: number, high: number): CoachSegment =>
  ({ name, minutes, low, high });
export function workoutLibrary(profile: CoachProfile): CoachWorkout[] {
  const p = validProfile(profile);
  const novice = p.experience === 'beginner';
  const enduranceMinutes=Math.max(20,Math.min(novice?45:p.experience==='intermediate'?75:110,Math.round(p.hours*60/p.days)-15));
  return [
    { id:'recovery', name:'Recovery Spin', description:'Easy spinning and relaxed cadence.', category:'Recovery',
      segments:[block('Ease in',5,.4,.5),block('Easy spin',novice?15:25,.45,.58),block('Cool down',5,.35,.45)] },
    { id:'endurance', name:'Aerobic Builder', description:'Build endurance with an achievable steady effort.', category:'Endurance',
      segments:[block('Warm up',8,.45,.6),block('Zone 2 cruise',enduranceMinutes,.56,.75),block('Cool down',7,.4,.5)] },
    { id:'tempo', name:'Tempo Builder', description:'Practice sustained, controlled work with recovery.', category:'Tempo',
      segments:[block('Warm up',10,.45,.65),block('Tempo 1',novice?5:10,.76,.87),block('Recovery',4,.45,.6),block('Tempo 2',novice?5:10,.76,.87),block('Cool down',6,.4,.5)] },
    { id:'sweetspot', name:'Sweet Spot Builder', description:'Develop sustainable power without maximal efforts.', category:'Threshold',
      segments:[block('Warm up',10,.45,.7),block('Sweet Spot 1',8,.88,.94),block('Recovery',5,.45,.58),block('Sweet Spot 2',8,.88,.94),block('Cool down',8,.4,.55)] },
    { id:'vo2', name:'VO2 Intervals', description:'Short hard efforts separated by easy recovery.', category:'High intensity',
      segments:[block('Warm up',10,.45,.7),block('Work 1',3,1.05,1.15),block('Recovery 1',4,.43,.55),block('Work 2',3,1.05,1.15),block('Recovery 2',4,.43,.55),block('Work 3',3,1.05,1.15),block('Cool down',8,.4,.5)] },
    { id:'preview', name:'Coach Test Ride', description:'A short session to try live coaching and trainer control.', category:'Test',
      segments:[block('Warm up',2,.45,.55),block('Steady',2,.65,.75),block('Recovery',1,.4,.5),block('Tempo',2,.77,.85),block('Cool down',1,.4,.5)] }
  ];
}
export function workoutDuration(workout: CoachWorkout): number {
  return Math.round(workout.segments.reduce((sum,s) => sum + s.minutes*60,0));
}
export function segmentAt(workout: CoachWorkout, seconds: number) {
  const total = workoutDuration(workout);
  const bounded = Math.max(0, Math.min(total, seconds));
  let start = 0;
  for(let index=0;index<workout.segments.length;index++){
    const segment = workout.segments[index], end = start + segment.minutes*60;
    if(bounded < end || index === workout.segments.length-1){
      return { segment, index, remaining:Math.max(0,end-bounded), progress:Math.min(1,Math.max(0,(bounded-start)/(end-start))), total, done:seconds>=total };
    }
    start=end;
  }
  throw Error('The workout must have at least one interval');
}
/** Exact session requirements displayed in the interactive workout interval chart. */
export function intervalRequirements(ftp:number,segment:CoachSegment){
 const seconds=Math.max(0,Math.round(segment.minutes*60));
 const duration=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 const lowWatts=Math.round(ftp*segment.low);
 const highWatts=Math.round(ftp*segment.high);
 const target=targetWatts(ftp,segment);
 return {
  duration,
  lowWatts,
  highWatts,
  target,
  range:lowWatts+'–'+highWatts+' W',
  ftpRange:Math.round(segment.low*100)+'–'+Math.round(segment.high*100)+'% FTP'
 };
}
export function targetWatts(ftp:number, segment:CoachSegment, adjustment=1): number {
  const center=(segment.low+segment.high)/2;
  return Math.max(30,Math.min(1000,Math.round(ftp*center*adjustment)));
}
export function inTargetRange(watts:number,ftp:number,segment:CoachSegment,adjustment=1):boolean {
  return Number.isFinite(watts) && watts>=ftp*segment.low*adjustment*.95 && watts<=ftp*segment.high*adjustment*1.05;
}
export function availableControls(_mode:CoachMode): CoachControl[] {
  return ['structured','guided'];
}
export function recommendWeek(profile:CoachProfile, fatigue=false) {
  const p=validProfile(profile);
  const slots = p.days===2?[1,4]:p.days===3?[1,3,6]:p.days===4?[1,2,4,6]:p.days===5?[0,1,3,4,6]:p.days===6?[0,1,2,3,4,6]:[0,1,2,3,4,5,6];
  if(p.days<7 && slots.includes(p.restDay)){
    const candidate=Array.from({length:7},(_,day)=>day).filter(day=>day!==p.restDay&&!slots.includes(day)).sort((a,b)=>Math.abs(a-p.restDay)-Math.abs(b-p.restDay))[0];
    if(candidate!==undefined)slots.splice(slots.indexOf(p.restDay),1,candidate);
    slots.sort((a,b)=>a-b);
  }
  const harder = p.experience==='beginner' ? 'tempo' : p.goal==='race' ? 'vo2' : 'sweetspot';
  return Array.from({length:7},(_,day)=>{
    const index=slots.indexOf(day);
    if(index<0)return {day,workoutId:null,reason:'Rest or optional easy movement'};
    const workoutId=fatigue ? index===0?'recovery':'endurance'
      : index===0?harder:index===slots.length-1?'endurance':index%3===0?'tempo':index%2===0?'recovery':'endurance';
    return {day,workoutId,reason:fatigue?'Reduced intensity after a difficult session':'Planned training session'};
  });
}

export type CoachRecentRide={
 start:number;
 elapsed:number;
 avgPower:number|null;
 source?:'classic'|'survival'|'cyclequest'|'import';
};
export type CoachRecentFeedback={date:number;rpe:number|null};
export type TodayRecommendation={
 workoutId:string|null;
 status:'planned'|'recovery'|'rest'|'completed';
 reason:string;
};
/** Unified fatigue signal used by cycling recommendations and strength day previews. */
export function fatigueSignals(profile:CoachProfile,now:number,rides:CoachRecentRide[]=[],feedback:CoachRecentFeedback[]=[]){
 const p=validProfile(profile);
 const demandingRide=rides.some(r=>Number.isFinite(r.start)&&r.start<=now&&now-r.start<=36*3600000&&
   Number.isFinite(r.elapsed)&&r.elapsed>=30*60&&r.avgPower!==null&&Number.isFinite(r.avgPower)&&r.avgPower>=p.ftp*.8);
 const veryHardFeedback=feedback.some(x=>Number.isFinite(x.date)&&x.date<=now&&now-x.date<=48*3600000&&x.rpe!==null&&x.rpe>=9);
 return {demandingRide,veryHardFeedback,fatigued:demandingRide||veryHardFeedback};
}
export function recommendToday(profile:CoachProfile,day:Date,rides:CoachRecentRide[]=[],feedback:CoachRecentFeedback[]=[]):TodayRecommendation {
 const p=validProfile(profile),now=day.getTime();
 const startOfDay=new Date(day.getFullYear(),day.getMonth(),day.getDate()).getTime();
 const scheduled=recommendWeek(p,false)[day.getDay()];
 const validRides=rides.filter(r=>Number.isFinite(r.start)&&r.start<=now&&Number.isFinite(r.elapsed)&&r.elapsed>0&&r.start>=now-7*86400000);
 const completedToday=validRides.some(r=>r.start>=startOfDay&&r.elapsed>=15*60);
 const {demandingRide,veryHardFeedback}=fatigueSignals(p,now,validRides,feedback);
 if(completedToday) return {workoutId:null,status:'completed',
   reason:'You already recorded a ride today. Coach is not stacking another prescribed session. Rest, or choose an optional workout.'};
 if(!scheduled.workoutId) return {workoutId:null,status:'rest',
   reason:'Today is outside your '+p.days+' planned training days. Rest supports consistency. You can still choose an optional workout.'};
 if(demandingRide||veryHardFeedback) return {workoutId:'recovery',status:'recovery',
   reason:demandingRide?'A demanding ride was recorded recently. Coach has replaced the planned workout with an easy recovery spin based on duration and average power.':
   'Your recent workout feedback indicated very high effort. Coach has selected an easier recovery spin.'};
 const descriptions:Record<CoachGoal,string>={
  fitness:'regular riding and consistency',ftp:'building sustainable power',
  endurance:'aerobic endurance',race:'preparing for your cycling event'
 };
 return {workoutId:scheduled.workoutId,status:'planned',
   reason:'Your '+p.days+'-day weekly schedule calls for this session to support '+descriptions[p.goal]+'. The recommendation uses your rider profile and basic scheduling rules.'};
}
/** Return a concrete shorter workout; preserve power ranges, warmup, and recovery segments. */
export function shortenWorkout(workout:CoachWorkout,maxMinutes=30):CoachWorkout {
 const current=workout.segments.reduce((sum,s)=>sum+s.minutes,0);
 const requested=Math.max(12,Math.min(maxMinutes,current));
 if(current<=requested)return workout;
 const base=workout.segments.length; // each block retains at least one minute
 if(base>=requested)return workout;
 const remaining=requested-base;
 const weights=workout.segments.map(s=>Math.max(0,s.minutes-1));
 const totalWeight=weights.reduce((sum,v)=>sum+v,0);
 const parts=workout.segments.map((s,i)=>({
  ...s,minutes:Math.max(1,Math.floor((1+(totalWeight?weights[i]/totalWeight*remaining:0))*2)/2)
 }));
 let allocated=parts.reduce((sum,s)=>sum+s.minutes,0);
 for(let i=0;allocated+.5<=requested;i=(i+1)%parts.length){parts[i].minutes+=.5;allocated+=.5;}
 return {...workout,id:workout.id+'-short',name:workout.name+' · Short',segments:parts,
   description:'Shortened version: '+workout.description};
}

export function feedbackRecommendation(rpe:number|null):string {
  if(rpe===null)return 'Rate how the session felt so future recommendations have more context.';
  if(rpe>=9)return 'That felt very hard. Consider recovery or rest next; do not stack another demanding workout.';
  if(rpe>=7)return 'Challenging session completed. Check your fatigue before the next hard effort.';
  if(rpe<=3)return 'Comfortable effort. Keep building consistency rather than chasing extra intensity.';
  return 'Good training. Keep the next session aligned with your weekly plan.';
}
