import type {CoachProfile} from './coach-engine';
export const COACH_EVENT_GOAL_KEY='breakaway.coach.event-goal.v1';
export type GoalDiscipline='general'|'criterium'|'road'|'tt'|'xco'|'xcm'|'gravel'|'cyclocross'|'gran-fondo'|'ultra'|'stage-race';
export type CoachEventGoal={discipline:GoalDiscipline;name:string;date:string;distanceKm:number|null;elevationM:number|null;durationMinutes:number|null;stages:number;priority:'A'|'B'|'C';objective:'finish'|'perform';terrain:'road'|'gravel'|'trail'|'mixed'};
export const DEFAULT_EVENT_GOAL:CoachEventGoal={discipline:'general',name:'',date:'',distanceKm:null,elevationM:null,durationMinutes:null,stages:1,priority:'A',objective:'finish',terrain:'road'};
export const GOAL_DISCIPLINES:Record<GoalDiscipline,string>={general:'General cycling fitness',criterium:'Criterium',road:'Road race',tt:'Time trial',xco:'Mountain bike XCO / short track',xcm:'Mountain bike marathon',gravel:'Gravel race',cyclocross:'Cyclocross', 'gran-fondo':'Gran Fondo / century',ultra:'Ultra-endurance', 'stage-race':'Multi-day stage race'};
const numberOrNull=(x:unknown,max:number)=>x===''||x===null||x===undefined?null:(Number.isFinite(Number(x))&&Number(x)>0&&Number(x)<=max?Number(x):null);
export function validEventGoal(raw:unknown):CoachEventGoal{
 const x=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 const discipline=Object.hasOwn(GOAL_DISCIPLINES,String(x.discipline))?x.discipline as GoalDiscipline:'general';
 const date=typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&!Number.isNaN(new Date(x.date+'T12:00:00').getTime())&&new Date(x.date+'T12:00:00').toISOString().slice(0,10)===x.date?x.date:'';
 return {discipline,name:typeof x.name==='string'?x.name.trim().slice(0,100):'',date,
  distanceKm:numberOrNull(x.distanceKm,5000),elevationM:numberOrNull(x.elevationM,100000),durationMinutes:numberOrNull(x.durationMinutes,30000),
  stages:discipline==='stage-race'?Math.max(2,Math.min(30,Math.round(Number(x.stages)||2))):1,
  priority:['A','B','C'].includes(String(x.priority))?x.priority as CoachEventGoal['priority']:'A',
  objective:x.objective==='perform'?'perform':'finish',
  terrain:['road','gravel','trail','mixed'].includes(String(x.terrain))?x.terrain as CoachEventGoal['terrain']:'road'};
}
export function goalPhase(goal:CoachEventGoal,now:Date):{phase:'foundation'|'base'|'build'|'specific'|'taper'|'event'|'post-event';weeksLeft:number|null;description:string}{
 if(!goal.date||goal.discipline==='general')return {phase:'foundation',weeksLeft:null,description:'Build consistency, comfortable endurance and repeatable training habits.'};
 const event=new Date(goal.date+'T12:00:00');
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
 const days=Math.round((event.getTime()-today.getTime())/86400000);
 const stageCount=goal.discipline==='stage-race'?Math.max(2,goal.stages):1;
 const weeksLeft=Math.max(0,Math.ceil(days/7));
 const phase=days<-(stageCount-1)?'post-event':days<=0?'event':days<=7?'taper':days<=28?'specific':days<=70?'build':'base';
 const descriptions={base:'Build a sustainable aerobic foundation before race-specific sessions.',build:'Develop the power and endurance needed for your event.',specific:'Practice efforts that resemble your event while managing fatigue.',taper:'Reduce accumulated fatigue; preserve fitness and arrive ready.',event:'Event day: follow your pacing, fueling and safety plan.','post-event':'Recover after the event before setting a new primary goal.'};
 return {phase,weeksLeft,description:descriptions[phase]};
}
export function eventWeek(profile:CoachProfile,goal:CoachEventGoal,now:Date){
 const {phase}=goalPhase(goal,now);
 const slots=profile.days===2?[1,4]:profile.days===3?[1,3,6]:profile.days===4?[1,2,4,6]:profile.days===5?[0,1,3,4,6]:[0,1,2,3,4,6];
 const days=[...slots];
 if(days.includes(profile.restDay)){
  const replacement=Array.from({length:7},(_,i)=>i).find(i=>i!==profile.restDay&&!days.includes(i));
  if(replacement!==undefined)days.splice(days.indexOf(profile.restDay),1,replacement);
 }
 days.sort((a,b)=>a-b);
 const highIntensity=['criterium','xco','cyclocross'].includes(goal.discipline);
 const steady=['ultra','stage-race','xcm','gravel','gran-fondo'].includes(goal.discipline);
 const intensive=highIntensity?'vo2':steady?'tempo':goal.discipline==='tt'?'sweetspot':'tempo';
 const hard=profile.experience==='beginner'?'tempo':intensive;
 const buildPhase=phase==='build'||phase==='specific';
 const easyPhase=phase==='taper'||phase==='post-event'||phase==='event';
 return Array.from({length:7},(_,day)=>{
  const index=days.indexOf(day);
  if(index<0)return {day,workoutId:null,reason:'Scheduled recovery day'};
  const workoutId=easyPhase?(index===0?'recovery':'endurance'):
   index===days.length-1?'endurance':index===0?(buildPhase?hard:'endurance'):
   index===2&&buildPhase&&highIntensity&&profile.experience==='advanced'?'tempo':
   index%2===0?'recovery':'endurance';
  const context=phase==='foundation'?'General development':GOAL_DISCIPLINES[goal.discipline]+' · '+phase;
  return {day,workoutId,reason:context+' preparation. '+(easyPhase?'Keep the session easy and avoid chasing workload.':buildPhase?'Match the event demands while maintaining recovery.':'Build consistent aerobic training.')};
 });
}
