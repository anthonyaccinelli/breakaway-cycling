// Deterministic smoke simulation: constant 15 mph, no summits, coins after wins.
// Uses the real combat rules and extracts the real player progression functions.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {makeBattle,enemyGroup,encounterLevel,nextChapterEncounter,advanceBattle} from '../public/cq-autoplay/combat.js';
const source=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
const names=['level','cost','threshold','maxHP','atk','award'];
const functions=names.map(name=>{const start=source.indexOf('function '+name+'(');return source.slice(start,source.indexOf('\nfunction ',start+1));}).join('\n');
for(const watts of [100,150,250])for(const seed of [1,2,3]){
 let rng=seed,seconds=0,chapter=1,miles=0,timer=260,bag=null,battle=null,rest=0;
 const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const player={s:{xp:0,hp:100},MAX_XP:10000000,levelUps:{enqueue(){}},shareCard(){},fmt:Math.round};vm.createContext(player);vm.runInContext(functions,player);
 const results=[];
 while(chapter<=2&&seconds<48*3600){
  player.award(1);seconds++;
  if(rest>0){rest--;continue;}
  if(battle){
   const out=advanceBattle(battle,player.s.hp,watts*player.atk()/100,1);battle=out.battle;player.s.hp=out.hp;
   if(out.outcome){
    if(out.outcome==='win')player.award(battle.reward);else player.s.hp=player.maxHP();
    if(battle.kind==='boss'){results.push({chapter,riderLevel:player.level(),bossLevel:battle.level,outcome:out.outcome,hours:+(seconds/3600).toFixed(2)});if(out.outcome==='loss')break;chapter++;miles=0;bag=null;}
    battle=null;timer=240+random()*180;rest=10;
   }continue;
  }
  miles+=15/3600;
  if(miles>=100){battle=makeBattle('boss',{chapter});continue;}
  if(--timer<=0){
   const r=random(),count=r<.1?3:r<.3?2:1,fights=[];
   for(let i=0;i<count;i++){const selection=nextChapterEncounter(chapter,bag,random);bag=selection.state;fights.push(makeBattle('enemy',{chapter,monsterId:selection.monsterId,level:encounterLevel(chapter,miles,random)}));}
   battle=enemyGroup(fights);
  }
 }
 console.log(JSON.stringify({watts,seed,results}));
}
