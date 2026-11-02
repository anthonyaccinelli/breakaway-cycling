/**
 * Breakaway Coach adaptive schedule v1.
 * Deterministic, explainable training guidance; NOT a clinical readiness score,
 * not TrainerRoad's proprietary model, and not a Garmin-calculated status.
 * Never compare absolute HRV values between athletes.
 */
import type {CoachProfile,CoachRecentRide,CoachRecentFeedback,CoachWorkout} from './coach-engine';
import type {IntegratedDay} from './coach-strength';
export type Light='green'|'yellow'|'red';
export type HrvStatus='balanced'|'unbalanced'|'low'|'poor'|'unknown';
export type MorningCheck={date:string;sleepScore:number|null;overnightHrv:number|null;baselineLow:number|null;baselineHigh:number|null;hrvStatus:HrvStatus};
export type MissedSession={date:string;kind:'missed'|'skipped'};
export type AdaptiveDay={
 date:string;weekday:number;
 original:{cyclingId:string|null;cyclingMinutes:number;strength:'A'|'B'|null;strengthMinutes:number};
 cyclingId:string|null;cyclingMinutes:number;strength:'A'|'B'|null;strengthMinutes:number;
 light:Light; reasons:string[];changes:string[];locked:boolean;completedRide:boolean;
};
export type AdaptivePlan={days:AdaptiveDay[];changes:AdaptiveDay[];today:Light;note:string};
export const MORNING_KEY='breakaway.coach.morning-check.v1';
export const MISSED_KEY='breakaway.coach.missed-days.v1';
export const OVERRIDES_KEY='breakaway.coach.adaptive-overrides.v1';
export const localDay=(d:Date):string=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const dayMs=(key:string)=>new Date(key+'T12:00:00').getTime();
export function validMorning(input:unknown):MorningCheck|null{
 if(!input||typeof input!=='object')return null;
 const x=input as Partial<MorningCheck>;
 if(!x.date||! /^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(dayMs(x.date)))return null;
 const num=(n:unknown,lo:number,hi:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi?n:null;
 const baselineLow=num(x.baselineLow,1,300),baselineHigh=num(x.baselineHigh,1,300);
 return {date:x.date,sleepScore:num(x.sleepScore,0,100),overnightHrv:num(x.overnightHrv,1,300),
  baselineLow:baselineLow!==null&&baselineHigh!==null&&baselineLow<baselineHigh?baselineLow:null,
  baselineHigh:baselineLow!==null&&baselineHigh!==null&&baselineLow<baselineHigh?baselineHigh:null,
  hrvStatus:['balanced','unbalanced','low','poor','unknown'].includes(x.hrvStatus||'unknown')?x.hrvStatus!:'unknown'};
}
export function morningLight(entry:MorningCheck|null):{light:Light;reasons:string[]}{
 if(!entry)return {light:'green',reasons:[]};
 const r:string[]=[];
 const hrvLow=entry.hrvStatus==='low'||entry.hrvStatus==='poor'
    ||(entry.overnightHrv!==null&&entry.baselineLow!==null&&entry.overnightHrv<entry.baselineLow*.85);
 const hrvCaution=hrvLow||entry.hrvStatus==='unbalanced'
    ||(entry.overnightHrv!==null&&entry.baselineLow!==null&&entry.overnightHrv<entry.baselineLow);
 const poorSleep=entry.sleepScore!==null&&entry.sleepScore<60;
 const veryPoorSleep=entry.sleepScore!==null&&entry.sleepScore<45;
 if(entry.sleepScore!==null&&entry.sleepScore<70)r.push('Garmin Sleep Score '+entry.sleepScore+' indicates less-than-ideal sleep.');
 if(hrvLow)r.push('HRV is substantially below your Garmin baseline or marked Low/Poor.');
 else if(hrvCaution)r.push('HRV is outside your personal baseline or marked Unbalanced.');
 if(veryPoorSleep&&hrvLow)return {light:'red',reasons:r};
 if(poorSleep||hrvCaution)return {light:'yellow',reasons:r};
 return {light:'green',reasons:r.length?r:['Morning readings do not indicate an additional restriction.']};
}
const rank:(x:Light)=>number=x=>x==='red'?2:x==='yellow'?1:0;
const max=(a:Light,b:Light):Light=>rank(a)>=rank(b)?a:b;
const hardRide=(ftp:number,r:CoachRecentRide,at:number)=>r.start<=at&&r.start>=at-72*3600000&&r.elapsed>=30*60
 &&r.avgPower!==null&&Number.isFinite(r.avgPower)&&r.avgPower>=ftp*.8;
const isHigh=(id:string|null)=>id==='vo2'||id==='sweetspot'||id==='tempo';
const clone=(d:IntegratedDay)=>({cyclingId:d.cyclingId,cyclingMinutes:d.cyclingMinutes,strength:d.strength,strengthMinutes:d.strengthMinutes});
/**
 * Project a rolling week using OBSERVED rides only, and today's morning readings
 * (plus an optional 1-day rest follow-up). No future sleep/HRV values are imagined.
 * 'green' is not a promise of physiological readiness.
 */
export function adaptWeek(input:{
 now:Date;profile:CoachProfile;base:IntegratedDay[];rides:CoachRecentRide[];
 feedback:CoachRecentFeedback[];mornings:MorningCheck[];missed:MissedSession[];
 overrides?:string[];strengthCompletedDates?:string[];
}):AdaptivePlan{
 const {now,profile,base,rides,feedback}=input,days:AdaptiveDay[]=[];
 const nowMs=now.getTime(), todayKey=localDay(now);
 const validRides=rides.filter(r=>Number.isFinite(r.start)&&r.start<=nowMs&&Number.isFinite(r.elapsed)&&r.elapsed>0);
 const todayMorning=input.mornings.filter(m=>m.date===todayKey).at(-1)||null;
 const overnight=morningLight(todayMorning),todayReasons=[...overnight.reasons];
 const last48=validRides.filter(r=>r.start>=nowMs-48*3600000&&hardRide(profile.ftp,r,nowMs));
 const yesterdayHard=validRides.some(r=>r.start>=nowMs-36*3600000&&hardRide(profile.ftp,r,nowMs));
 const intenseFeedback=feedback.some(f=>Number.isFinite(f.date)&&f.date<=nowMs&&nowMs-f.date<48*3600000&&f.rpe!==null&&f.rpe>=9);
 let current:Light=overnight.light;
 if(last48.length>=3){current=max(current,'red');todayReasons.push('Three demanding rides were recorded within 48 hours.');}
 else if(yesterdayHard||intenseFeedback){
  current=max(current,'yellow');
  todayReasons.push(yesterdayHard?'A demanding ride was completed within 36 hours.':'Recent effort feedback was very high.');
 }
 const missed=new Set(input.missed.filter(m=>m.kind==='missed'||m.kind==='skipped').map(m=>m.date));
 const missedPastWeek=[...missed].filter(date=>date<todayKey&&date>=localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()-7))).length;
 if(missedPastWeek>=3){current=max(current,'yellow');todayReasons.push('Three or more training days were marked missed/skipped recently. Resume gradually, rather than making them up.');}
 const previousDaysLight=current;
 for(let offset=0;offset<7;offset++){
  const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset);
  const date=localDay(d),weekday=d.getDay();
  const baseDay=base.find(x=>x.day===weekday);
  if(!baseDay)continue;
  const original=clone(baseDay);
  const day:AdaptiveDay={date,weekday,original,...clone(baseDay),
   light:'green',reasons:[],changes:[],locked:(input.overrides||[]).includes(date),completedRide:false};
  const hrvNotice=offset===0?todayReasons:[];
  // Future lights are only short-term propagation from currently observed evidence.
  if(offset===0){day.light=current;day.reasons.push(...hrvNotice);}
  else if(offset===1&&previousDaysLight==='red'){
   day.light='yellow';day.reasons.push('Extra recovery after today’s red/rest recommendation.');
  }else if(offset===1&&last48.some(r=>r.start>=nowMs-24*3600000)){
   day.light='yellow';day.reasons.push('Recent demanding riding may still affect tomorrow’s training.');
  }
  const finished=validRides.some(r=>localDay(new Date(r.start))===date&&r.elapsed>=15*60);
  day.completedRide=finished;
  const missedFlag=missed.has(date);
  if(offset===0&&missedFlag){
   day.reasons.push('You marked today’s training as skipped/missed. It will not be added to tomorrow.');
  }
  if(day.locked){
   day.reasons.push('You chose to keep the original workout despite Coach’s recommendation.');
  }else if(missedFlag){
   if(day.cyclingId){day.changes.push('Cycling workout removed — marked missed/skipped.');day.cyclingId=null;day.cyclingMinutes=0;}
   if(day.strength){day.changes.push('Strength session removed — marked missed/skipped.');day.strength=null;day.strengthMinutes=0;}
  }else if(finished){
   if(day.cyclingId){day.changes.push('Planned cycling workout replaced by your completed ride.');day.cyclingId=null;day.cyclingMinutes=0;}
   day.reasons.push('An actual ride was recorded; no make-up cycling workout is added.');
  }
  if(!day.locked&&!missedFlag){
   if(day.light==='red'){
    if(day.cyclingId){day.changes.push('Cycling workout → Rest day.');day.cyclingId=null;day.cyclingMinutes=0;}
    if(day.strength){day.changes.push('Strength session → Rest day.');day.strength=null;day.strengthMinutes=0;}
    if(day.changes.length)day.reasons.push('Recovery is prioritized over additional training stress.');
   }else if(day.light==='yellow'){
    if(isHigh(day.cyclingId)){
     const old=day.cyclingId;
     day.cyclingId='endurance';
     day.cyclingMinutes=Math.min(day.cyclingMinutes,45);
     day.changes.push(old+' intervals → Easy endurance ('+day.cyclingMinutes+' min).');
    }else if(day.cyclingId==='endurance'&&day.cyclingMinutes>45){
     day.changes.push('Endurance shortened from '+day.cyclingMinutes+' to 45 min.');
     day.cyclingMinutes=45;
    }
    if(day.strength&&day.strengthMinutes>20){
     day.changes.push('Strength shortened to 20 min with lighter loading.');
     day.strengthMinutes=20;
    }
   }
  }
  days.push(day);
 }
 return {days,changes:days.filter(d=>d.changes.length>0),today:current,
 note:'Experimental coaching heuristics: Garmin sleep/HRV, recent power and effort, explicit missed sessions. This is not a validated fatigue or medical assessment. Green means no restriction identified from the available data.'};
}
export function changesSummary(plan:AdaptivePlan,workouts:CoachWorkout[]){
 const name=(id:string|null)=>!id?'Rest':workouts.find(w=>w.id===id)?.name||id;
 return plan.changes.map(day=>({
  ...day,originalLabel:(day.original.cyclingId?name(day.original.cyclingId)+' · '+day.original.cyclingMinutes+' min':'No cycling')
   +(day.original.strength?' + Strength '+day.original.strength+' '+day.original.strengthMinutes+' min':''),
  updatedLabel:(day.cyclingId?name(day.cyclingId)+' · '+day.cyclingMinutes+' min':'No cycling')
   +(day.strength?' + Strength '+day.strength+' '+day.strengthMinutes+' min':'')
 }));
}
