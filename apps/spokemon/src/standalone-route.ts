/** Small standalone route engine. No Breakaway, Cycle Quest or Coach dependencies. */
export type Profile={totalMeters:number;samples:number[];terrain:string;seed:number;gainMeters:number;steepestPercent:number};
export const metersForMiles=(miles:number)=>miles*1609.344;
const terrainStrength:Record<string,number>={flat:.35,rolling:1.1,mountain:3.0,punchy:2.2};
function rng(seed:number){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
export function generateProfile(miles:number,terrain:string,seed:number,targetGain?:number):Profile{
 const totalMeters=metersForMiles(miles),count=256,rand=rng(seed);
 const strength=terrainStrength[terrain]||1;
 const samples=[120];let gainMeters=0,steepestPercent=0;
 const segment=totalMeters/(count-1);
 for(let i=1;i<count;i++){
  const wave=Math.sin(i*.16+seed*.001)+.65*Math.sin(i*.052+seed*.002)+.3*Math.sin(i*.58+rand());
  const grade=Math.max(-.12,Math.min(.12,wave*strength*.014));
  const next=samples[i-1]+grade*segment;
  gainMeters+=Math.max(0,next-samples[i-1]);steepestPercent=Math.max(steepestPercent,grade*100);
  samples.push(next);
 }
 if(targetGain!==undefined&&gainMeters>0){
  // Scaling the profile preserves the seed shape but can exceed 12%: clamp to safe gradients.
  const multiplier=Math.max(0,Math.min(12/Math.max(.01,steepestPercent),targetGain/gainMeters));
  const start=samples[0];for(let i=1;i<samples.length;i++)samples[i]=start+(samples[i]-start)*multiplier;
 }
 gainMeters=0;steepestPercent=0;
 for(let i=1;i<samples.length;i++){
  const rise=samples[i]-samples[i-1];
  gainMeters+=Math.max(0,rise);steepestPercent=Math.max(steepestPercent,rise/segment*100);
 }
 return {totalMeters,samples,terrain,seed,gainMeters,steepestPercent};
}
export function parseGpxRoute(xml:string):Profile{
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror'))throw Error('Invalid XML');
 const points=Array.from(doc.querySelectorAll('trkpt,rtept'));
 if(points.length<2)throw Error('GPX route needs at least two points');
 const coords=points.map(p=>({lat:Number(p.getAttribute('lat')),lon:Number(p.getAttribute('lon')),e:Number(p.querySelector('ele')?.textContent||0)}));
 if(coords.some(x=>!Number.isFinite(x.lat)||!Number.isFinite(x.lon)||Math.abs(x.lat)>90||Math.abs(x.lon)>180))throw Error('Invalid coordinates');
 let distance=0,gain=0;
 for(let i=1;i<coords.length;i++){
  const a=coords[i-1],b=coords[i],toRad=Math.PI/180;
  const dLat=(b.lat-a.lat)*toRad,dLon=(b.lon-a.lon)*toRad;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*toRad)*Math.cos(b.lat*toRad)*Math.sin(dLon/2)**2;
  distance+=2*6371000*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
  gain+=Math.max(0,b.e-a.e);
 }
 if(distance<1)throw Error('Route contains no usable distance');
 const samples=coords.map(p=>p.e);
 let steepest=0;for(let i=1;i<samples.length;i++)steepest=Math.max(steepest,Math.max(0,samples[i]-samples[i-1])/Math.max(1,distance/(samples.length-1))*100);
 return {totalMeters:distance,samples,terrain:'GPX',seed:0,gainMeters:gain,steepestPercent:steepest};
}
