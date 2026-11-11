/** Bluetooth Cycling Speed and Cadence Measurement (0x2A5B).
 * Values come from revolution counters; no power or resistance is inferred.
 * Event times are 1/1024 s and wrap at 65536.
 */
export type CscCounter={revolutions:number;eventTime:number};
export type CscState={wheel?:CscCounter;crank?:CscCounter};
export type CscReading={
 state:CscState;wheelPresent:boolean;crankPresent:boolean;
 speedMps:number|null;cadenceRpm:number|null;
};
export function parseCscMeasurement(
 data:DataView,previous:CscState,wheelCircumferenceMm=2105
):CscReading{
 if(data.byteLength<1)throw Error('Empty CSC measurement');
 const flags=data.getUint8(0);
 let offset=1;
 const state:CscState={...previous};
 let speedMps:number|null=null,cadenceRpm:number|null=null;
 const wheelPresent=(flags&1)!==0,crankPresent=(flags&2)!==0;
 if(wheelPresent){
  if(offset+6>data.byteLength)throw Error('Truncated CSC wheel data');
  const revolutions=data.getUint32(offset,true),eventTime=data.getUint16(offset+4,true);
  if(previous.wheel){
   const revolutionsDelta=(revolutions-previous.wheel.revolutions)>>>0;
   const ticks=(eventTime-previous.wheel.eventTime+65536)%65536;
   if(ticks>0&&revolutionsDelta<100){
    const seconds=ticks/1024;
    const speed=revolutionsDelta*wheelCircumferenceMm/1000/seconds;
    if(speed<=35)speedMps=speed;
   }
  }
  state.wheel={revolutions,eventTime};
  offset+=6;
 }
 if(crankPresent){
  if(offset+4>data.byteLength)throw Error('Truncated CSC crank data');
  const revolutions=data.getUint16(offset,true),eventTime=data.getUint16(offset+2,true);
  if(previous.crank){
   const revolutionsDelta=(revolutions-previous.crank.revolutions+65536)%65536;
   const ticks=(eventTime-previous.crank.eventTime+65536)%65536;
   if(ticks>0&&revolutionsDelta<20){
    const rpm=revolutionsDelta*60*1024/ticks;
    if(rpm<=220)cadenceRpm=rpm;
   }
  }
  state.crank={revolutions,eventTime};
 }
 return {state,wheelPresent,crankPresent,speedMps,cadenceRpm};
}
