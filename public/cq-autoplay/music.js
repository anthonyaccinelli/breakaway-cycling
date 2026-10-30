// One audio owner in the game iframe; overlays never create duplicate players.
export function createQuestMusic({makeAudio=src=>{const audio=new Audio(src);audio.hidden=true;audio.dataset.questMusic=src.split('/').pop();document.body.append(audio);return audio;},storage=globalThis.localStorage,schedule=setTimeout,cancel=clearTimeout,onChange=()=>{},random=Math.random}={}){
 const key='cycle-quest-music-enabled';
 let enabled=true;try{enabled=storage?.getItem(key)!=='false';}catch{}
 const tracks=Object.fromEntries(['battle','victory','rest','level','death'].map(name=>{
  const file={battle:'do-or-die-loop.mp3',victory:'victory-opening-0-5.wav',rest:'rest.mp3',level:'take-flight.mp3',death:'game-over.mp3'}[name],audio=makeAudio('/audio/cycle-quest/'+file);
  audio.preload='none';audio.loop=['battle','rest'].includes(name);audio.volume=.6;return [name,audio];
 }));
 let scene='silent',wasBattle=false,blocked=false,suspended=false,paused=false,generation=0,timer=null,playing=false,battleOffset=null,lastBattleOffset=null,outcome=null;
 const state=()=>({enabled,blocked,scene,suspended,paused});
 const notify=()=>onChange(state());
 function clearTimer(){if(timer!==null)cancel(timer);timer=null;}
 function halt(){generation++;clearTimer();playing=false;for(const audio of Object.values(tracks)){audio.pause();try{audio.currentTime=0;}catch{}}}
 function play(){
  if(!enabled||suspended||paused||scene==='silent'||playing)return;
  const audio=tracks[scene],token=++generation;playing=true;
  async function start(){
   if(scene==='battle'){
    if(!Number.isFinite(audio.duration)||audio.duration<=0)await new Promise((resolve,reject)=>{
     const loaded=()=>{cleanup();resolve();},failed=()=>{cleanup();reject(new Error('Music could not load'));};
     const cleanup=()=>{audio.removeEventListener('loadedmetadata',loaded);audio.removeEventListener('error',failed);};
     audio.addEventListener('loadedmetadata',loaded);audio.addEventListener('error',failed);audio.preload='metadata';audio.load();
    });
    if(token!==generation)return;
    if(battleOffset===null){
     const duration=audio.duration;
     battleOffset=Math.min(1-Number.EPSILON,Math.max(0,Number(random())||0))*duration;
     if(lastBattleOffset!==null&&Math.min(Math.abs(battleOffset-lastBattleOffset),duration-Math.abs(battleOffset-lastBattleOffset))<Math.min(8,duration/4))battleOffset=(lastBattleOffset+duration/2)%duration;
     lastBattleOffset=battleOffset;
    }
    if(audio.currentTime===0)audio.currentTime=battleOffset;
   }else if(scene==='victory'||scene==='death')audio.currentTime=0;
   if(token!==generation)return;
   await audio.play();
   if(token!==generation)return;blocked=false;notify();
   if(scene==='victory')timer=schedule(()=>{timer=null;select('silent');},5000);
  }
  start().catch(()=>{if(token!==generation)return;playing=false;blocked=true;notify();});
 }

 function select(next){if(scene!==next){halt();scene=next;if(next==='battle')battleOffset=null;blocked=false;}play();notify();}
 for(const name of ['victory','death','level'])tracks[name].addEventListener('ended',()=>{if(scene===name)select('silent');});
 function sync({battle=false,rest=false,levelUp=false,paused:battlePaused=false}={}){
  const nextPaused=!!battle&&!!battlePaused&&!rest;
  if(paused!==nextPaused){paused=nextPaused;if(paused){generation++;playing=false;tracks.battle.pause();}}
  if(rest)select('rest');
  else if(battle)select('battle');
  else if(wasBattle){select(outcome==='death'?'death':outcome==='flee'?'silent':'victory');outcome=null;}
  else if(levelUp)select('level');
  else if(['battle','rest','level'].includes(scene))select('silent');
  wasBattle=!!battle;
 }
 return {
  sync,state,
  endBattle(result){outcome=result;},
  resume(){if(enabled){blocked=false;play();notify();}},
  toggle(){if(blocked&&enabled){blocked=false;play();notify();return;}enabled=!enabled;try{storage?.setItem(key,String(enabled));}catch{}if(!enabled)halt();else play();notify();},
  suspend(value=true){suspended=value;if(value)halt();else play();notify();},
  dispose(){halt();scene='silent';for(const audio of Object.values(tracks))audio.remove?.();}
 };
}
