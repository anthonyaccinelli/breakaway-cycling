import type {TodayRecommendation} from './coach-engine';

/** Optional manually entered recovery context; never infer a physiological score from missing inputs. */
export type MorningCheckIn={
 date:string;
 feeling:'tired'|'okay'|'great';
 bodyBattery:number|null;
 sleepScore:number|null;
 hrvMs:number|null;
};
export const COACH_CHECKIN_KEY='breakaway.coach.morning.v1';
export const COACH_FTP_KNOWN_KEY='breakaway.coach.ftp-known.v1';
const integer=(x:unknown,min:number,max:number):number|null=>
 typeof x==='number'&&Number.isFinite(x)&&Number.isInteger(x)&&x>=min&&x<=max?x:null;
export function validCheckIn(value:unknown,date:string):MorningCheckIn|null{
 if(!value||typeof value!=='object')return null;
 const v=value as Partial<MorningCheckIn>;
 if(v.date!==date||!['tired','okay','great'].includes(String(v.feeling)))return null;
 // Reject invalid readings rather than quietly considering them normal.
 for(const [k,min,max] of [['bodyBattery',0,100],['sleepScore',0,100],['hrvMs',1,300]] as const){
  if(v[k]!==null&&v[k]!==undefined&&integer(v[k],min,max)===null)return null;
 }
 return {date,feeling:v.feeling!,bodyBattery:integer(v.bodyBattery,0,100),
 sleepScore:integer(v.sleepScore,0,100),hrvMs:integer(v.hrvMs,1,300)};
}
export function recoveryGuidance(check:MorningCheckIn|null){
 if(!check)return {label:'Not checked in',detail:'Morning check-in is optional. Coach is using your schedule and recent rides.',suggestEasy:false};
 if(check.feeling==='tired')return {label:'Check your energy',detail:'You reported feeling tired. Consider an easy session; Body Battery, Sleep Score and HRV alone are not diagnostic.',suggestEasy:true};
 const data=[check.bodyBattery,check.sleepScore,check.hrvMs].filter(x=>x!==null).length;
 return {label:check.feeling==='great'?'Feeling good':'Feeling okay',
 detail:data?'Your Garmin-style readings are recorded for reference. Personalized recovery thresholds need a baseline, so these numbers do not automatically change workouts.':'Your self-check is saved; there are no device readings today.',
 suggestEasy:false};
}
export function applyRecoveryGuidance(plan:TodayRecommendation,check:MorningCheckIn|null):TodayRecommendation{
 const guide=recoveryGuidance(check);
 if(!guide.suggestEasy||plan.status!=='planned'||!plan.workoutId||plan.workoutId==='recovery')return plan;
 return {workoutId:'recovery',status:'recovery',reason:'You reported feeling tired during your morning check-in. Coach suggests an easier recovery spin instead of your planned session. This is a training suggestion, not a medical assessment.'};
}

/** Explainable training-day signal. Never estimate Garmin thresholds without a personal baseline. */
export function trainingDayGuidance(check:MorningCheckIn|null,recentLoad:{demandingRide:boolean;veryHardFeedback:boolean},completedToday=false){
 if(completedToday)return {color:'green' as const,label:'Training complete',detail:'You have already ridden today. No additional prescribed workout is needed.'};
 if(check?.feeling==='tired'&&(recentLoad.demandingRide||recentLoad.veryHardFeedback))
  return {color:'red' as const,label:'Recovery recommended',detail:'You reported fatigue and recent training was demanding. Coach recommends rest or gentle recovery rather than another hard effort.'};
 if(check?.feeling==='tired'||recentLoad.demandingRide||recentLoad.veryHardFeedback)
  return {color:'yellow' as const,label:'Take it easy',detail:check?.feeling==='tired'?'You reported fatigue. Coach suggests a lighter session based on your check-in.':'Recent demanding training suggests a lighter session. Coach uses recorded effort, not Garmin score cutoffs.'};
 return {color:'green' as const,label:'Follow your plan',detail:check?.feeling==='great'?'You feel good today. Follow your planned session without adding extra intensity.':'No fatigue flag was found in available inputs. Missing Garmin data does not mean you are fully recovered.'};
}
