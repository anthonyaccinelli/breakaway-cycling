import type {AdaptiveDay} from './coach-adaptive-week';
import type {CoachCalendarDay} from './coach-calendar';
import type {CoachWorkout} from './coach-engine';

export type CoachWeekItem={
 key:string;weekday:number;status:AdaptiveDay['status'];name:string|null;
 workoutId:string|null;minutes:number;strength:AdaptiveDay['strength'];
 strengthMinutes:number;reason:string;changed:boolean;missingWorkout:boolean;
};

/**
 * Today and My Week must present one date-specific schedule.
 * For the seven dates shown on the Today strip, use that already
 * reconciled calendar as the display authority. Older dates use the
 * adaptive planner's completed, skipped, and missed statuses.
 * Never silently call a day "rest" when it has a prescribed ride.
 */
export function reconcileCoachWeek(
 days:AdaptiveDay[], calendar:CoachCalendarDay[], workouts:CoachWorkout[],
 todayKey:string
):CoachWeekItem[]{
 const byKey=new Map(calendar.map(d=>[d.key,d]));
 const library=new Map(workouts.map(w=>[w.id,w]));
 return days.map(day=>{
  const canonical=day.key>=todayKey?byKey.get(day.key):undefined;
  const rideId=canonical?canonical.rideId:day.workoutId;
  const isRideScheduled=rideId!==null&&rideId!==undefined&&
    (canonical?canonical.rideMinutes>0:day.minutes>0);
  const workout=isRideScheduled?library.get(rideId):undefined;
  return {
   key:day.key,weekday:day.weekday,status:day.status,
   name:workout?.name??null,
   workoutId:isRideScheduled?rideId:null,
   minutes:isRideScheduled?(canonical?.rideMinutes??day.minutes):0,
   strength:canonical?.strength??day.strength,
   strengthMinutes:canonical?.strengthMinutes??day.strengthMinutes,
   reason:day.reason,changed:day.changed,
   missingWorkout:isRideScheduled&&!workout
  };
 });
}
