// Reward selection uses live trainer signals and wall-clock time.
export function createRewardGesture(){
 return {
  sample(){},
  begin(now){return {selected:'coins',end:now+10000,stopSince:null};},
  update(choice,now,cadence,power,connected=true){
   if(!connected){choice.stopSince=null;return;}
   if(Number.isFinite(cadence)&&Number.isFinite(power)&&cadence<=0&&power<10){choice.stopSince??=now;if(now-choice.stopSince>=2000)choice.selected='heal';}
   else {choice.stopSince=null;choice.selected='coins';}
  }
 };
}
