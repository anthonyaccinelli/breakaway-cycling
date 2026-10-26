// Use real time, never accelerated ride time. Freeze the pre-reward baseline.
export function createRewardGesture(){
 let samples=[];
 return {
  sample(now,rpm){samples=samples.filter(s=>now-s.time<=5000);if(Number.isFinite(rpm)&&rpm>=30&&rpm<=220)samples.push({time:now,rpm});},
  begin(now){const recent=samples.filter(s=>now-s.time<=5000).map(s=>s.rpm).sort((a,b)=>a-b);const baseline=recent.length>=3?recent[Math.floor(recent.length/2)]:null;return {selected:'xp',end:now+10000,baseline,increase:baseline===null?15:Math.max(15,Math.ceil(baseline*.2)),above:null,last:null};},
  update(choice,now,rpm){if(choice.selected==='heal'||choice.baseline===null||now>=choice.end)return;const gap=choice.last!==null&&now-choice.last>1500;choice.last=now;if(gap||!Number.isFinite(rpm)||rpm<choice.baseline+choice.increase||rpm>220){choice.above=null;return;}choice.above??=now;if(now-choice.above>=1000){choice.selected='heal';choice.end=Math.max(choice.end,now+3000);}}
 };
}
