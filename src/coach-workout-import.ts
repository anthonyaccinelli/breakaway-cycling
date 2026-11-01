/** Deterministic text importer for preview. Never invents wattage from heart rate. */
export type ImportedWorkoutDraft={
  title:string;
  sport:'cycling';
  durationMinutes:number|null;
  target:{kind:'heart-rate';minBpm:number;maxBpm:number}|{kind:'power';lowWatts:number;highWatts:number}|null;
  description:string;
  pace:'steady'|'unspecified';
  notes:string[];
  warnings:string[];
  ready:boolean;
};
const duration=(input:string):number|null=>{
  const hms=input.match(/\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/);
  if(hms)return Math.round((Number(hms[1])*3600+Number(hms[2])*60+Number(hms[3]))/60);
  const hm=input.match(/\b(\d{1,2}):([0-5]\d)\b/);
  if(hm)return Number(hm[1])*60+Number(hm[2]);
  const hours=input.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/i);
  const mins=input.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i);
  const total=(hours?Number(hours[1])*60:0)+(mins?Number(mins[1]):0);
  return total>0?Math.round(total):null;
};
export function parseWorkoutDescription(source:string):ImportedWorkoutDraft{
  const description=source.trim().slice(0,3000);
  const min=duration(description);
  const steady=/\b(steady|base|endurance|easy aerobic|consistent|continuous)\b/i.test(description);
  // Supports "between 103 and 114 bpm", "HR 103-114", "103 to 114 bpm".
  const hrBetween=description.match(/\b(?:heart[\s-]*rate|hr)?\s*(?:between|from)\s*(\d{2,3})\s*(?:and|to|[-–—])\s*(\d{2,3})\s*(?:bpm)?\b/i);
  const hrRange=description.match(/\b(?:heart[\s-]*rate|hr)?\s*(\d{2,3})\s*(?:-|–|—|to)\s*(\d{2,3})\s*bpm\b/i);
  const powerRange=description.match(/\b(\d{2,4})\s*(?:-|–|—|to)\s*(\d{2,4})\s*(?:w|watts)\b/i);
  const hr=hrBetween||hrRange;
  let target:ImportedWorkoutDraft['target']=null;
  if(hr){
    const a=Number(hr[1]),b=Number(hr[2]);
    if(a>=35&&b<=240&&a<b)target={kind:'heart-rate',minBpm:a,maxBpm:b};
  }else if(powerRange){
    const a=Number(powerRange[1]),b=Number(powerRange[2]);
    if(a>=20&&b<=1200&&a<b)target={kind:'power',lowWatts:a,highWatts:b};
  }
  const warnings:string[]=[];
  if(min===null)warnings.push('Duration not specified. Enter a total workout time.');
  if(target===null)warnings.push('No valid heart-rate or wattage range found. Add an intensity target.');
  if(!/\bwarm[\s-]?up\b/i.test(description))warnings.push('Warmup not specified — no separate warmup was added.');
  if(!/\bcool[\s-]?down\b/i.test(description))warnings.push('Cooldown not specified — no separate cooldown was added.');
  if(target?.kind==='heart-rate'){
    warnings.push('No power target provided. Breakaway will not convert heart rate into watts.');
    warnings.push('A compatible heart-rate monitor is needed for live guidance.');
  }
  if(min!==null&&(min<1||min>600))warnings.push('Duration must be between 1 and 600 minutes.');
  const ready=min!==null&&min>=1&&min<=600&&target!==null;
  const title=/\b(base|endurance)\b/i.test(description)?'Base':'Steady Heart-Rate Ride';
  return {title,sport:'cycling',durationMinutes:min,target,description,
    pace:steady?'steady':'unspecified',notes:steady?['One continuous, steady session.']:[],
    warnings,ready};
}
export const EXAMPLE_WORKOUT='Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm.';
export const IMPORTED_WORKOUT_KEY='breakaway.coach.imported-workouts.v1';
