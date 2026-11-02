/** Zone-2-friendly personality challenges. Pure logic: no trainer commands or DOM.
 * The rider earns Trust only by meeting the current temperament target.
 * Brief shifting/gradient fluctuations never remove earned Trust.
 */
export type SpokemonTemperament='shy'|'curious'|'stubborn'|'gentle'|'playful';
export type TemperamentPhase='easy'|'brisk';
export type TemperamentAttempt={
 phase:TemperamentPhase;heldSeconds:number;offTargetSeconds:number;
 lastWatts:number|null;
};
export type TemperamentFeedback={
 next:TemperamentAttempt;trustGain:number;
 targetMin:number;targetMax:number;
 cue:string;feedback:string;matched:boolean;
};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const settings:Record<SpokemonTemperament,{
 easy:[number,number];brisk?:[number,number];holdSeconds?:number;
}>={
 gentle:{easy:[.54,.65]},
 shy:{easy:[.59,.71]},
 stubborn:{easy:[.68,.76],holdSeconds:4},
 curious:{easy:[.55,.63],brisk:[.69,.76],holdSeconds:5},
 playful:{easy:[.55,.64],brisk:[.68,.76],holdSeconds:4}
};
const cadenceSettings:typeof settings={
 gentle:{easy:[.75,.87]},
 shy:{easy:[.90,1.02]},
 stubborn:{easy:[1.00,1.12],holdSeconds:4},
 curious:{easy:[.82,.94],brisk:[1.02,1.13],holdSeconds:5},
 playful:{easy:[.85,.96],brisk:[1.08,1.18],holdSeconds:4}
};
export function evaluateCadenceTemperament(
 personality:SpokemonTemperament,baselineRpm:number,cadenceRpm:number,
 moving:boolean,seconds:number,previous:TemperamentAttempt,metric:'power'|'cadence'='power'
):TemperamentFeedback{
 return evaluateTemperament(personality,baselineRpm,cadenceRpm,moving,seconds,previous,'cadence');
}
export function initialTemperamentAttempt():TemperamentAttempt{
 return {phase:'easy',heldSeconds:0,offTargetSeconds:0,lastWatts:null};
}
export function evaluateTemperament(
 personality:SpokemonTemperament,ftpWatts:number,powerWatts:number,
 moving:boolean,seconds:number,previous:TemperamentAttempt
):TemperamentFeedback{
 const ftp=clamp(Number.isFinite(ftpWatts)?ftpWatts:(metric==='cadence'?82:250),metric==='cadence'?55:50,metric==='cadence'?115:1000);
 const effort=Number.isFinite(powerWatts)?Math.max(0,powerWatts):0;
 const dt=clamp(Number.isFinite(seconds)?seconds:0,0,1.5);
 const rule=(metric==='cadence'?cadenceSettings:settings)[personality],alternating=!!rule.brisk;
 const phase=alternating?previous.phase:'easy';
 const [low,high]=phase==='brisk'&&rule.brisk?rule.brisk:rule.easy;
 const targetMin=Math.round(ftp*low),targetMax=Math.round(ftp*high);
 // 3s-averaged telemetry + 2.5s grace protects virtual shifts and hills.
 const tolerance=metric==='cadence'?2.5:Math.max(6,ftp*.025);
 const within=effort>=ftp*low-tolerance&&effort<=ftp*high+tolerance;
 const smooth=previous.lastWatts===null||Math.abs(effort-previous.lastWatts)<=(metric==='cadence'?7:Math.max(15,ftp*.075));
 const matched=moving&&within&&(personality!=='shy'||smooth);
 const next={...previous,lastWatts:moving?effort:previous.lastWatts};
 const cue=alternating?(phase==='easy'?'EASY':'BRISK'):personality==='stubborn'?'HOLD STRONG':personality==='gentle'?'RIDE GENTLY':'STAY STEADY';
 if(!moving){
  next.offTargetSeconds+=dt;
  if(next.offTargetSeconds>2.5){next.heldSeconds=0;next.lastWatts=null;}
  return {next,trustGain:0,targetMin,targetMax,cue,feedback:'KEEP PEDALING TO EARN TRUST',matched:false};
 }
 if(!matched){
  next.offTargetSeconds+=dt;
  if(next.offTargetSeconds>2.5)next.heldSeconds=0;
  const feedback=effort<ftp*low-tolerance?(metric==='cadence'?'PEDAL A LITTLE FASTER':'A LITTLE MORE POWER'):
   effort>ftp*high+tolerance?(metric==='cadence'?'PEDAL A LITTLE SLOWER':'EASE OFF A LITTLE'):
   'SMOOTH OUT YOUR PEDALING';
  return {next,trustGain:0,targetMin,targetMax,cue,feedback,matched:false};
 }
 next.offTargetSeconds=0;
 next.heldSeconds+=dt;
 let trustGain=dt*(personality==='stubborn'?(next.heldSeconds>=4?5.4:2.1):4.7);
 let feedback='GREAT RHYTHM! TRUST RISING';
 if(alternating){
  const hold=rule.holdSeconds||5;
  if(next.heldSeconds>=hold){
   trustGain+=8;
   next.phase=phase==='easy'?'brisk':'easy';
   next.heldSeconds=0;
   feedback='NICE CHANGE! NOW '+next.phase.toUpperCase();
  }else feedback='HOLD '+cue+' FOR '+Math.ceil(hold-next.heldSeconds)+'S';
 }else if(personality==='stubborn'&&next.heldSeconds<4){
  feedback='HOLD STEADY FOR '+Math.ceil(4-next.heldSeconds)+'S';
 }
 return {next,trustGain,targetMin,targetMax,cue,feedback,matched:true};
}
