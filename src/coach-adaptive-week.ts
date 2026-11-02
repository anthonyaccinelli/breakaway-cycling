import type {CoachRecentFeedback,CoachRecentRide,TodayRecommendation} from './coach-engine';
import type {IntegratedDay} from './coach-strength';

export type AdaptiveStatus='planned'|'recovery'|'shortened'|'completed'|'skipped'|'missed'|'rest';
export type AdaptiveDay={
 key:string;date:Date;weekday:number;originalId:string|null;workoutId:string|null;
 originalMinutes:number;minutes:number;recordedMinutes:number;status:AdaptiveStatus;reason:string;
 changed:boolean;strength:'A'|'B'|null;strengthMinutes:number;
};
export type AdaptiveChange={
 key:string;originalId:string|null;workoutId:string|null;
 beforeMinutes:number;afterMinutes:number;reason:string;kind:'recovery'|'shortened'|'completed'|'skipped'|'missed';
};
export type AdaptiveWeek={days:AdaptiveDay[];changes:AdaptiveChange[];extraMinutes:number};
export type AdaptiveInputs={
 now:Date;week:IntegratedDay[];rides:CoachRecentRide[];
 feedback:CoachRecentFeedback[];skipped:string[];ftp:number;ftpKnown:boolean;
 budgetMinutes:number;today:TodayRecommendation;recoveryMinutes:number;
};
const DAY=86400000;
export function adaptiveDateKey(date:Date):string{
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
const validRide=(r:CoachRecentRide,now:number)=>
 Number.isFinite(r.start)&&r.start<=now&&r.start>=now-14*DAY&&
 Number.isFinite(r.elapsed)&&r.elapsed>=15*60;
function rideMinutes(ride:CoachRecentRide){return Math.max(0,Math.round(ride.elapsed/60));}
/**
 * Recompute a rolling two-week date-specific schedule from immutable weekly slots.
 * Never move missed sessions, invent trainer telemetry, add days, or change strength.
 * The excess-volume budget applies only to the current calendar week and only to
 * actual riding beyond the scheduled ride allowance on days that were ridden.
 */
export function adaptWeeklySchedule(input:AdaptiveInputs):AdaptiveWeek{
 const {now,week,today,ftp,ftpKnown}=input;
 const todayKey=adaptiveDateKey(now),nowMs=now.getTime();
 const skipped=new Set(input.skipped);
 const valid=input.rides.filter(r=>validRide(r,nowMs));
 const currentSunday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-now.getDay());
 const days:AdaptiveDay[]=[];
 for(let offset=0;offset<14;offset++){
  const date=new Date(currentSunday.getFullYear(),currentSunday.getMonth(),currentSunday.getDate()+offset);
  const key=adaptiveDateKey(date),weekday=date.getDay();
  const baseline=week.find(d=>d.day===weekday);
  const id=baseline?.cyclingId&&baseline.cyclingMinutes>0?baseline.cyclingId:null;
  const originalMinutes=id?baseline!.cyclingMinutes:0;
  const dateStart=date.getTime();
  const recorded=valid.filter(r=>adaptiveDateKey(new Date(r.start))===key);
  const recordedMinutes=recorded.reduce((sum,r)=>sum+rideMinutes(r),0);
  const isPast=dateStart<new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  const isToday=key===todayKey;
  let workoutId=id,minutes=originalMinutes,status:AdaptiveStatus=id?'planned':'rest';
  let reason=baseline?.reason||'Recovery day';
  if((isPast||isToday)&&recorded.length){
   workoutId=null;minutes=0;status='completed';
   reason='A ride was recorded on this date. Coach does not prescribe a duplicate session.';
  }else if((isPast||isToday)&&skipped.has(key)){
   workoutId=null;minutes=0;status='skipped';
   reason='You skipped this session. Coach will not stack it onto a later day.';
  }else if(isPast){
   workoutId=null;minutes=0;status=id?'missed':'rest';
   reason=id?'This scheduled ride was not recorded and has not been rescheduled.':'Scheduled rest day.';
  }else if(isToday){
   workoutId=today.workoutId;
   status=today.status==='completed'?'completed':!workoutId?'rest':today.status==='recovery'?'recovery':'planned';
   minutes=workoutId?(workoutId==='recovery'&&id!=='recovery'?Math.min(originalMinutes||input.recoveryMinutes,input.recoveryMinutes):originalMinutes):0;
   reason=today.reason;
  }else if(id){
   // Use an assumed morning start for future sessions, not current time; never
   // compare a ride against dates before it occurred.
   const reference=new Date(date.getFullYear(),date.getMonth(),date.getDate(),9).getTime();
   const hardRide=valid.some(r=>r.start<reference&&reference-r.start<=36*3600000&&
     (rideMinutes(r)>=120||(ftpKnown&&r.avgPower!==null&&Number.isFinite(r.avgPower)&&r.elapsed>=1800&&r.avgPower>=ftp*.8)));
   const hardFeedback=input.feedback.some(f=>Number.isFinite(f.date)&&f.date<reference&&reference-f.date<=48*3600000&&f.rpe!==null&&f.rpe>=9);
   if((hardRide||hardFeedback)&&id!=='recovery'){
    workoutId='recovery';minutes=Math.min(originalMinutes,input.recoveryMinutes);
    status='recovery';
    reason=hardFeedback?'Very hard recent workout feedback prompted a recovery spin instead of the planned workout.':
      'A demanding or long ride was recorded before this session. Coach replaced it with easier recovery riding.';
   }
  }
  days.push({key,date,weekday,originalId:id,workoutId,originalMinutes,minutes,recordedMinutes,status,reason,
   changed:status==='completed'||workoutId!==id||minutes!==originalMinutes,
   strength:baseline?.strength||null,strengthMinutes:baseline?.strengthMinutes||0});
 }
 // Actual minutes above planned allowances from days already ridden this week.
 // A ride on a rest day has a zero allowance and counts fully as extra volume.
 const consumed=days.filter(d=>d.date.getTime()<=nowMs&&d.date.getTime()>=currentSunday.getTime());
 const completed=consumed.filter(d=>valid.some(r=>adaptiveDateKey(new Date(r.start))===d.key));
 const totalRidden=completed.reduce((sum,d)=>sum+valid.filter(r=>adaptiveDateKey(new Date(r.start))===d.key).reduce((n,r)=>n+rideMinutes(r),0),0);
 const allowance=completed.reduce((sum,d)=>sum+d.originalMinutes,0);
 const extraMinutes=Math.max(0,totalRidden-allowance);
 const scheduledBudget=days.slice(0,7).reduce((sum,day)=>sum+day.originalMinutes+day.strengthMinutes,0);
 const availableHeadroom=Math.max(0,input.budgetMinutes-scheduledBudget);
 // Extra riding within free weekly hours does not automatically cut prescribed rides.
 // Recovery swaps already reduce weekly volume, so credit those savings first.
 const recoverySavings=days.slice(0,7).filter(day=>day.status==='recovery'&&day.date.getTime()>=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime())
   .reduce((sum,day)=>sum+Math.max(0,day.originalMinutes-day.minutes),0);
 let remaining=Math.max(0,extraMinutes-availableHeadroom-recoverySavings);
 // Adjust future easy sessions first to preserve key workouts where possible.
 const endOfWeek=new Date(currentSunday.getFullYear(),currentSunday.getMonth(),currentSunday.getDate()+7).getTime();
 const candidates=days.filter(d=>d.date.getTime()>=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()&&
   d.date.getTime()<endOfWeek&&d.workoutId&&d.status!=='completed'&&d.status!=='skipped')
   .sort((a,b)=>{
    const rank=(d:AdaptiveDay)=>d.workoutId==='recovery'?0:d.workoutId==='endurance'?1:2;
    return rank(a)-rank(b)||a.date.getTime()-b.date.getTime();
   });
 for(const day of candidates){
  if(remaining<=0)break;
  // Preserve at least 15 minutes per session rather than creating tiny intervals.
  const removable=Math.max(0,day.minutes-15);
  const reduction=Math.min(removable,remaining);
  if(reduction<=0)continue;
  day.minutes-=reduction;remaining-=reduction;
  if(day.minutes!==day.originalMinutes){
   day.status=day.status==='recovery'?'recovery':'shortened';day.changed=true;
   day.reason+=' Additional riding exceeded your remaining weekly time by '+(extraMinutes-availableHeadroom-recoverySavings)+' minutes, so Coach shortened this session by '+reduction+' minutes. Strength and rest days stay unchanged.';
  }
 }
 // Only report actionable changes today or in the future, plus explicit
 // skips/completions from the current week for context.
 const changes=days.filter(d=>d.date.getTime()<endOfWeek&&(
   d.changed||(d.status==='skipped'&&skipped.has(d.key))
 )).map(d=>({
  key:d.key,originalId:d.originalId,workoutId:d.workoutId,
  beforeMinutes:d.originalMinutes,afterMinutes:d.status==='completed'?d.recordedMinutes:d.minutes,
  reason:d.reason,kind:(d.status==='completed'?'completed':d.status==='skipped'?'skipped':
    d.status==='shortened'?'shortened':d.status==='missed'?'missed':'recovery') as AdaptiveChange['kind']
 }));
 return {days,changes,extraMinutes};
}
