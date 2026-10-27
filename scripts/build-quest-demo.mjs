import {readFile,writeFile,mkdir} from 'node:fs/promises';
const out='public/cq-autoplay';await mkdir(out,{recursive:true});
for(const name of ['index.html','game.js','routes.js','monsters.js','combat.js','profile.js','level-up.js','reward-gesture.js','workouts.js','workout-ui.js']){
 let s=(await readFile('cycle-quest/'+name,'utf8')).replace(/\/api\/cycle-quest\?asset=([A-Za-z0-9.-]+)/g,'./$1');
 if(name==='index.html')s=s.replace('Cycle Quest | Ride Breakaway','Cycle Quest — Autoplay Preview');
 if(name==='game.js'){
  s=s.replace("key='cycle-quest-character-v1'","key='cycle-quest-autoplay-preview-v1'").replace('version:1,xp:0,hp:100','version:1,xp:570,hp:100').replace('nextEncounter:260','nextEncounter:8').replace('dt=lastLiveTime?Math.min(3,(now-lastLiveTime)/1000):0','dt=Number.isFinite(m.demoSeconds)?Math.min(30,m.demoSeconds):(lastLiveTime?Math.min(3,(now-lastLiveTime)/1000):0)').replace('s.nextEncounter=240+Math.random()*180','s.nextEncounter=35+Math.random()*20');
  const at=s.indexOf(" if(m.type==='telemetry')");s=s.slice(0,at)+` if(m.type==='demo-action'){
 const action=m.action;rewardChoice=null;if(action==='group'){s.battle=null;s.reward=false;encounter('enemy',3);return;}if(action==='chapter-1'||action==='chapter-2'){s.battle=null;s.reward=false;s.chapter=action==='chapter-1'?1:2;s.miles=0;s.boss=null;s.chapterEncounter=null;message='Previewing '+CHAPTER_BIOMES[s.chapter].name;save();render();return;}if(action==='claim'){choose('xp');return;}if(action==='win'||action==='lose'){if(s.battle)finish(action==='win');render();return;}
 if(action==='reset'){levelUps.clear();levelUp=null;s=fresh();s.route=generateRoute(15,'rolling',null,42077);s.routeMiles=0;lastLiveDistance=0;parentSend({type:'route',route:s.route});message='Autoplay preview reset.';}
 else{s.battle=null;s.reward=false;if(action==='level'){levelUps.clear();levelUp=null;award(threshold(level()+1)-s.xp);s.nextEncounter=20;}else if(action==='reward'){s.reward=true;message='Victory! Choose healing or bonus XP.';}else if(['enemy','summit','boss'].includes(action))encounter(action);}
 save();render();return;
 }
`+s.slice(at);
 }
 await writeFile(out+'/'+(name==='index.html'?'ride.html':name),s);
}
