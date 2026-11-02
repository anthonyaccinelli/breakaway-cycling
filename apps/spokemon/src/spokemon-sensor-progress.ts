/** Select live wheel speed where available, otherwise estimate route pace from fresh cadence.
 * No power is inferred and zero wheel speed is respected as a real reading.
 */
export function advanceCadenceSensorRide(state:{
 nowMs:number; lastSpeedAtMs:number; lastCadenceAtMs:number;
 speedSensorConnected:boolean; speedMps:number; cadenceRpm:number;
 distanceMeters:number; stepSeconds:number; routeLimitMeters:number;
}):{speedMps:number;distanceMeters:number;source:'wheel'|'cadence'|'stopped'}{
 const fresh=(timestamp:number)=>timestamp>0&&state.nowMs>=timestamp&&state.nowMs-timestamp<4500;
 const wheelFresh=state.speedSensorConnected&&fresh(state.lastSpeedAtMs);
 const cadenceFresh=fresh(state.lastCadenceAtMs);
 const speedMps=wheelFresh?Math.max(0,state.speedMps)
  :cadenceFresh?Math.max(0,Math.min(160,state.cadenceRpm))/80*5.36448:0;
 return {
  speedMps,
  distanceMeters:Math.min(state.routeLimitMeters,state.distanceMeters+speedMps*Math.max(0,state.stepSeconds)),
  source:wheelFresh?'wheel':cadenceFresh?'cadence':'stopped',
 };
}
