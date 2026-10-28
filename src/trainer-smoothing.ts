export type PowerReading = {time:number; watts:number};

// A reading represents the interval until the following reading. Include the
// predecessor of the window boundary, rather than dropping its partial interval.
export function timeWeightedPower(readings:readonly PowerReading[],now:number,windowMs=3000):number|null {
 if(!readings.length||now-readings[readings.length-1].time>windowMs)return null;
 let energy=0,duration=0;
 for(let i=0;i<readings.length;i++){
  const start=Math.max(now-windowMs,readings[i].time);
  const end=Math.min(now,readings[i+1]?.time??now);
  const dt=Math.max(0,end-start);
  energy+=Math.max(0,readings[i].watts)*dt;duration+=dt;
 }
 return duration>0?energy/duration:Math.max(0,readings[readings.length-1].watts);
}

// Limit change per elapsed second, independent of animation/notification rate.
export function slewGrade(current:number,target:number,seconds:number,rate:number):number {
 const step=Math.max(0,seconds)*rate;
 return current+Math.max(-step,Math.min(step,target-current));
}
