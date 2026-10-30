// One audio owner in the game iframe; overlays never create duplicate players.
export function createQuestMusic({makeAudio=src=>{const audio=new Audio(src);audio.hidden=true;audio.dataset.questMusic=src.split('/').pop();document.body.append(audio);return audio;},storage=globalThis.localStorage,schedule=setTimeout,cancel=clearTimeout,onChange=()=>{}}={}){
 const key='cycle-quest-music-enabled';
 let enabled=true;try{enabled=storage?.getItem(key)!=='false';}catch{}
 const tracks=Object.fromEntries(['battle','victory','rest'].map(name=>{
  const file={battle:'do-or-die.mp3',victory:'victory-opening-0-5.wav',rest:'rest.mp3'}[name],audio=makeAudio('/audio/cycle-quest/'+file);
  audio.preload='none';audio.loop=name!=='victory';audio.volume=.6;return [name,audio];
 }));
 let scene='silent',wasBattle=false,blocked=false,suspended=false,paused=false,generation=0,timer=null,playing=false;
 const state=()=>({enabled,blocked,scene,suspended,paused});
 const notify=()=>onChange(state());
 function clearTimer(){if(timer!==null)cancel(timer);timer=null;}
 function halt(){generation++;clearTimer();playing=false;for(const audio of Object.values(tracks)){audio.pause();try{audio.currentTime=0;}catch{}}}
 function play(){
  if(!enabled||suspended||paused||scene==='silent'||playing)return;
  const audio=tracks[scene],token=++generation;if(scene==='victory')audio.currentTime=0;playing=true;
  try{Promise.resolve(audio.play()).then(()=>{
   if(token!==generation)return;blocked=false;notify();
   if(scene==='victory')timer=schedule(()=>{timer=null;select('silent');},5000);
  }).catch(()=>{if(token!==generation)return;playing=false;blocked=true;notify();});}
  catch{playing=false;blocked=true;notify();}
 }
 function select(next){if(scene!==next){halt();scene=next;blocked=false;}play();notify();}
 tracks.victory.addEventListener('ended',()=>{if(scene==='victory')select('silent');});
 function sync({battle=false,rest=false,paused:battlePaused=false}={}){
  const nextPaused=!!battle&&!!battlePaused&&!rest;
  if(paused!==nextPaused){paused=nextPaused;if(paused){generation++;playing=false;tracks.battle.pause();}}
  if(rest)select('rest');
  else if(battle)select('battle');
  else if(wasBattle)select('victory');
  else if(scene==='battle'||scene==='rest')select('silent');
  wasBattle=!!battle;
 }
 return {
  sync,state,
  resume(){if(enabled){blocked=false;play();notify();}},
  toggle(){if(blocked&&enabled){blocked=false;play();notify();return;}enabled=!enabled;try{storage?.setItem(key,String(enabled));}catch{}if(!enabled)halt();else play();notify();},
  suspend(value=true){suspended=value;if(value)halt();else play();notify();},
  dispose(){halt();scene='silent';for(const audio of Object.values(tracks))audio.remove?.();}
 };
}
