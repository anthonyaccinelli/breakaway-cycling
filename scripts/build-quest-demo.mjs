import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {QUEST_ASSETS} from '../cycle-quest/assets.js';
const out='public/cq-autoplay';await mkdir(out,{recursive:true});
const scenes=await readFile('scripts/quest-demo-scenes.js','utf8');
function replaceOnce(source,before,after){
 if(source.split(before).length!==2)throw Error('Autoplay source hook changed: '+before);
 return source.replace(before,after);
}
for(const name of Object.keys(QUEST_ASSETS)){
 let source=(await readFile('cycle-quest/'+name,'utf8')).replace(/\/api\/cycle-quest\?asset=([A-Za-z0-9.-]+)/g,'./$1');
 if(name==='index.html')source=source.replace('Cycle Quest | Ride Breakaway','Cycle Quest — Autoplay Preview');
 if(name==='game.js'){
  for(const [before,after] of [
   ["key='cycle-quest-character-v1'","key='cycle-quest-autoplay-preview-v1'"],
   ['version:1,xp:0,hp:100','version:1,xp:570,hp:100'],
   ['nextEncounter:260','nextEncounter:8'],
   ['dt=lastLiveTime?Math.min(3,(now-lastLiveTime)/1000):0','dt=Number.isFinite(m.demoSeconds)?Math.min(30,m.demoSeconds):(lastLiveTime?Math.min(3,(now-lastLiveTime)/1000):0)'],
   ['s.nextEncounter=240+Math.random()*180','s.nextEncounter=35+Math.random()*20'],
   ["window.addEventListener('message',e=>",scenes+"\nwindow.addEventListener('message',e=>"],
   ["if(m.type==='telemetry')","if(m.type==='demo-action'){handleDemoAction(m.action);return;}\n if(m.type==='telemetry')"]
  ])source=replaceOnce(source,before,after);
 }
 await writeFile(out+'/'+(name==='index.html'?'ride.html':name),source);
}
