// Physical units throughout: kg, metres, seconds, watts; grade is percent.
export const ZWIFT_GEAR_RATIOS:readonly number[]=Object.freeze([
 .75,.87,.99,1.11,1.23,1.38,1.53,1.68,1.86,2.04,2.22,2.40,
 2.61,2.82,3.03,3.24,3.49,3.74,3.99,4.24,4.54,4.84,5.14,5.49
]);
export const WHEEL_CIRCUMFERENCE_M=2.105;
export const DRIVETRAIN_EFFICIENCY=.975;
export type RoadLoad={massKg:number;gradePercent:number;crr:number};
export function roadForce(speedMps:number,road:RoadLoad):number{
 const angle=Math.atan(road.gradePercent/100);
 return road.massKg*9.80665*(Math.sin(angle)+road.crr*Math.cos(angle))+.5*1.225*.38*speedMps**2;
}
export function virtualGearTarget(gear:number,cadenceRpm:number,road:RoadLoad){
 const ratio=ZWIFT_GEAR_RATIOS[Math.max(0,Math.min(23,Math.round(gear)-1))];
 const rpm=Number.isFinite(cadenceRpm)?Math.max(0,Math.min(200,cadenceRpm)):0;
 // The virtual wheel speed determines pedal load, NOT avatar speed/flywheel speed.
 const speedMps=rpm/60*ratio*WHEEL_CIRCUMFERENCE_M;
 const watts=Math.max(0,roadForce(speedMps,road)*speedMps/DRIVETRAIN_EFFICIENCY);
 return {ratio,speedMps,watts:Math.min(2000,watts)};
}
// Implicit midpoint energy balance. Unlike P/max(v,1.5), any positive
// power can launch uphill; there is no artificial minimum wattage to advance.
export function advanceRoadSpeed(speedMps:number,powerWatts:number,seconds:number,road:RoadLoad):number{
 if(seconds<=0)return speedMps;
 const old=Math.max(0,speedMps),power=Math.max(0,powerWatts)*DRIVETRAIN_EFFICIENCY;
 if(power===0)return Math.max(0,Math.min(35,old-roadForce(old,road)/road.massKg*seconds));
 const balance=(next:number)=>.5*road.massKg*(next*next-old*old)-seconds*(power-roadForce((old+next)/2,road)*(old+next)/2);
 if(balance(0)>=0)return 0;
 let low=0,high=35;
 for(let i=0;i<40;i++){const mid=(low+high)/2;if(balance(mid)>0)high=mid;else low=mid;}
 return (low+high)/2;
}
