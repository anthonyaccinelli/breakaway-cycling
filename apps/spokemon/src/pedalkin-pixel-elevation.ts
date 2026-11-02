/** Pedalkin / Spokemon Game Boy Color-inspired elevation rendering.
 * Visual quantization ONLY: caller's original distance/elevation/grade
 * values are unchanged and continue to drive trainer simulation and exports.
 */
export type PixelPoint={x:number;y:number};
export type PixelElevation={
 line:string;fill:string;points:PixelPoint[];
 at:(fraction:number)=>PixelPoint;
};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
export function pixelateElevation(
 rawY:readonly number[],
 xStart:number,xEnd:number,topY:number,bottomY:number,
 steps=112,yGrid=6
):PixelElevation{
 if(rawY.length<2||rawY.some(y=>!Number.isFinite(y)))throw Error('Pixel elevation requires at least two finite heights');
 if(![xStart,xEnd,topY,bottomY,yGrid].every(Number.isFinite)||xEnd<=xStart||bottomY<=topY||yGrid<=0)
  throw Error('Invalid pixel elevation geometry');
 const count=clamp(Math.round(steps),2,500);
 const range=rawY.length-1;
 const points=Array.from({length:count+1},(_,i)=>{
  const f=i/count,offset=f*range,j=Math.min(rawY.length-2,Math.floor(offset));
  const value=rawY[j]+(rawY[j+1]-rawY[j])*(offset-j);
  const snapped=topY+Math.round((clamp(value,topY,bottomY)-topY)/yGrid)*yGrid;
  return {x:xStart+(xEnd-xStart)*f,y:clamp(snapped,topY,bottomY)};
 });
 const fixed=(v:number)=>v.toFixed(2);
 const line='M '+fixed(points[0].x)+' '+fixed(points[0].y)
  +points.slice(1).map(p=>' H '+fixed(p.x)+' V '+fixed(p.y)).join('');
 const fill=line+' L '+fixed(xEnd)+' '+fixed(bottomY)+' H '+fixed(xStart)+' Z';
 return {line,fill,points,at:(fraction:number)=>{
  const i=clamp(Math.floor(clamp(Number.isFinite(fraction)?fraction:0,0,1)*count),0,count);
  return points[i];
 }};
}
