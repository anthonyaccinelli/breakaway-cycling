import type {CoachWorkout,TodayRecommendation} from './coach-engine';
import type {IntegratedDay} from './coach-strength';

export type CoachCalendarDay={
 date:Date;
 key:string;
 label:string;
 title:string;
 isToday:boolean;
 rideId:string|null;
 rideName:string|null;
 rideMinutes:number;
 rideDescription:string|null;
 strength:'A'|'B'|null;
 strengthMinutes:number;
 completedRide:boolean;
 reason:string;
};

/**
 * Rolling seven-day display for the existing weekly Coach plan.
 * Uses calendar dates (rather than adding 24h in milliseconds) so it
 * remains correct across local daylight-saving transitions.
 */
export function calendarDays(
 now:Date,
 week:IntegratedDay[],
 workouts:CoachWorkout[],
 today:TodayRecommendation
):CoachCalendarDay[]{
 const dates:CoachCalendarDay[]=[];
 for(let offset=0;offset<7;offset++){
  const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset);
  const plan=week.find(d=>d.day===date.getDay());
  const completedRide=offset===0&&today.status==='completed';
  let rideId=plan?.cyclingId&&plan.cyclingMinutes>0?plan.cyclingId:null;
  if(offset===0){
   if(completedRide||today.status==='rest'||!rideId)rideId=null;
   else if(today.workoutId)rideId=today.workoutId;
  }
  const ride=workouts.find(w=>w.id===rideId);
  const allocated=plan?.cyclingId===rideId?plan.cyclingMinutes:0;
  const rideMinutes=ride?Math.max(0,allocated||Math.round(ride.segments.reduce((n,s)=>n+s.minutes,0))):0;
  const label=offset===0?'Today':new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(date);
  const key=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  dates.push({
   date,key,isToday:offset===0,label:label+' '+(date.getMonth()+1)+'/'+date.getDate(),
   title:new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(date),
   rideId:ride?.id||null,rideName:ride?.name||null,rideMinutes,rideDescription:ride?.description||null,
   strength:plan?.strength||null,strengthMinutes:plan?.strengthMinutes||0,
   completedRide,
   reason:offset===0?today.reason:plan?.reason||'Scheduled recovery day'
  });
 }
 return dates;
}
