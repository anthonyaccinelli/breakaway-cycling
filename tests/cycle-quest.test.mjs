import {QUEST_ASSETS} from '../cycle-quest/assets.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeColor,GRADE_COLORS,elevationSVG} from '../cycle-quest/profile.js';
import {generateRoute,sample} from '../cycle-quest/routes.js';
import {loadQuestModule} from './quest-loader.mjs';
const {MONSTERS,makeBattle,enemyGroup,enemyXP,chapterLevels,encounterLevel,chapterMonsters,nextChapterEncounter,advanceBattle,SUMMIT_BOSSES,SUMMIT_VARIANTS}=await loadQuestModule('combat.js');
const {readCharacter}=await loadQuestModule('save-state.js');
const fresh=()=>({version:1,xp:24000,hp:100,miles:50,chapter:1,mode:'adventure',rideSeconds:100,rideMiles:2,nextEncounter:0,reward:false,boss:null});

test('canonical roster has one rat and no obsolete tabletop combat numbers',()=>{
 assert.equal(MONSTERS.length,314);assert.equal(new Set(MONSTERS.map(m=>m.id)).size,314);
 assert.equal(MONSTERS.filter(m=>m.id==='rat').length,1);assert(!MONSTERS.some(m=>m.id==='giant-rat'));
 for(const m of MONSTERS){assert(m.baseHP>0&&m.baseAttack>0&&m.tier>=1);for(const key of ['hp','attack','damage','cr','level'])assert.equal(m[key],undefined);}
});
test('approved rat and Stirge stats and XP use the enemy own level',()=>{
 for(const [level,hp,dps,xp] of [[1,7500,.2,150],[2,8100,.21,175],[6,11020,.27,275],[10,14993,.34,375],[18,27750,.54,575]]){
  const b=makeBattle('enemy',{monsterId:'rat',level});assert.equal(b.hp,hp);assert.equal(b.dps,dps);assert.equal(b.reward,xp);
 }
 const stirge=makeBattle('enemy',{monsterId:'stirge',level:2});assert.equal(stirge.hp,8640);assert.equal(stirge.dps,.24);assert.equal(stirge.reward,175);
});
test('rider telemetry and rider progression cannot affect enemy or boss stats',()=>{
 for(const kind of ['enemy','boss','summit']){
  const options={chapter:2,monsterId:kind==='enemy'?'rat':kind==='summit'?'lifted-dually':'roper',level:6};
  const base=makeBattle(kind,options);
  for(const riderLevel of [1,8,20,100])assert.deepEqual(makeBattle(kind,{...options,riderLevel,ftp:riderLevel*30,entryPower:riderLevel*20,ceilingPercent:150}),base);
  assert.equal(base.time,undefined);assert.equal(base.targetWatts,undefined);
 }
});
test('chapter mileage bands match the approved first two chapters and never consult rider level',()=>{
 for(const [chapter,min,caps,boss] of [[1,1,[5,10,14,18],18],[2,12,[18,22,26,30],30]]){
  for(let i=0;i<4;i++)for(const miles of [i*25,i*25+24.999]){
   assert.deepEqual(chapterLevels(chapter,miles),{min,max:caps[i],boss});
   assert.equal(encounterLevel(chapter,miles,()=>0),min);assert.equal(encounterLevel(chapter,miles,()=>1),caps[i]);
  }
 }
 assert.equal(chapterLevels(1,100).max,18);
 for(const chapter of [3,50,1000]){const b=chapterLevels(chapter,100);assert(b.min<=b.max&&b.max<=1000);assert(chapterMonsters(chapter).length>0);}
});
test('first two biome pools stay distinct and shuffle without adjacent repeats',()=>{
 const a=chapterMonsters(1),b=chapterMonsters(2);assert.equal(a.length,8);assert.equal(b.length,8);assert.equal(new Set([...a,...b].map(m=>m.id)).size,16);
 for(const chapter of [1,2]){let state=null,last=null;for(let cycle=0;cycle<5;cycle++){const drawn=[];for(let i=0;i<8;i++){const pick=nextChapterEncounter(chapter,state,()=>.37);assert.notEqual(pick.monsterId,last);drawn.push(pick.monsterId);last=pick.monsterId;state=pick.state;}assert.equal(new Set(drawn).size,8);}}
});
test('Headwind remains recurring in all chapters and uses the same own-level rules',()=>{
 for(const chapter of [1,2,3,50,1000]){const state={chapter,bag:['rat'],last:'wolf'},pick=nextChapterEncounter(chapter,state,()=>.05);assert.equal(pick.monsterId,'headwind');assert.equal(pick.state,state);}
 assert.equal(makeBattle('enemy',{monsterId:'headwind',level:20}).reward,625);
});
test('mixed groups sum fixed HP, individual attack and XP',()=>{
 const b=enemyGroup([1,6,10].map(level=>makeBattle('enemy',{monsterId:'rat',level})));
 assert.equal(b.hp,33513);assert.equal(b.reward,800);assert.deepEqual(b.enemies.map(e=>e.level),[1,6,10]);assert(Math.abs(b.dps-.81)<1e-10);
 for(const count of [1,2,3]){const one=makeBattle('enemy',{monsterId:'rat',level:6}),group=enemyGroup(Array(count).fill(one));assert.equal(group.hp,one.hp*count);assert.equal(group.reward,one.reward*count);}
});
test('a defeated group member immediately stops attacking, including inside a long tick',()=>{
 const b=enemyGroup([1,1,1].map(level=>makeBattle('enemy',{monsterId:'rat',level})));
 const result=advanceBattle(b,100,150,150);assert.equal(result.outcome,'win');assert.equal(result.killed,3);assert(Math.abs(result.hp-40)<1e-8);assert.equal(result.battle.dps,0);
 let small={battle:b,hp:100};for(let i=0;i<150;i++)small=advanceBattle(small.battle,small.hp,150,1);
 assert.equal(small.outcome,'win');assert(Math.abs(small.hp-result.hp)<1e-8);assert.equal(b.hp,22500);
});
test('combat has no timeout, coasting still takes damage, and simultaneous death is a loss',()=>{
 let r=advanceBattle({kind:'boss',hp:50000,max:50000,dps:.25},100,150,60);assert.equal(r.outcome,null);assert.equal(r.battle.hp,41000);assert.equal(r.hp,85);
 r=advanceBattle(r.battle,r.hp,0,400);assert.equal(r.outcome,'loss');assert.equal(r.hp,1);
 assert.equal(advanceBattle({hp:990,max:990,dps:1},100,10,100).outcome,'loss');
});
test('boss levels and rewards are fixed by chapter; grinding makes them easier',()=>{
 for(const [chapter,level,xp] of [[1,18,1725],[2,30,2625]]){const a=makeBattle('boss',{chapter}),b=makeBattle('boss',{chapter,level:99,ftp:500});assert.deepEqual(a,b);assert.equal(a.level,level);assert.equal(a.reward,xp);assert(a.hp/(150*1.08**19)<a.hp/(150*1.08**9));}
});
test('all twelve summit identities and three variants have permanent own levels and stats',()=>{
 assert.equal(SUMMIT_BOSSES.length,12);assert.equal(SUMMIT_VARIANTS.length,3);const names=new Set();
 for(const monsterId of SUMMIT_BOSSES){let previous=0;for(const variant of SUMMIT_VARIANTS){
  const a=makeBattle('summit',{chapter:1,monsterId,variant:variant.name}),b=makeBattle('summit',{chapter:50,monsterId,variant:variant.name,ftp:500,level:99});assert.deepEqual(a,b);assert(a.hp>previous);previous=a.hp;assert.equal(a.reward,3*enemyXP(a.level));names.add(a.name);
 }}assert.equal(names.size,36);
 for(let i=0;i<100;i++){const b=makeBattle('summit',{chapter:1,random:()=>i/100});assert(b.level<=22);}
});
test('legacy rat IDs and scaled battles migrate once, preserving progress, damage and earned rewards',()=>{
 const old={...fresh(),battleCapPct:125,chapterEncounter:{chapter:1,bag:['giant-rat','rat','goblin'],last:'giant-rat'},battle:{kind:'enemy',name:'GIANT RAT',monsterId:'giant-rat',level:6,hp:500,max:1000,dps:.25,reward:150,enemies:[{id:'giant-rat',name:'GIANT RAT',hp:500,max:1000}]}};
 const next=readCharacter(JSON.stringify(old));assert.equal(next.xp,old.xp);assert.equal(next.hp,100);assert.equal(next.battle.monsterId,'rat');assert.equal(next.battle.name,'RAT');assert.equal(next.battle.max,11020);assert.equal(next.battle.hp,5510);assert.equal(next.battle.reward,275);assert.equal(next.battleCapPct,undefined);assert.deepEqual(next.chapterEncounter.bag,['rat','goblin']);
 assert.deepEqual(readCharacter(JSON.stringify(next)),next);
 const paid={...fresh(),reward:true,pendingReward:{count:1,xp:150,hp:25,coins:25}};assert.deepEqual(readCharacter(JSON.stringify(paid)).pendingReward,paid.pendingReward);
 const boss=readCharacter(JSON.stringify({...fresh(),boss:{monsterId:'roper',name:'ROPER',hp:9999,dps:1}}));assert.equal(boss.boss.monsterId,'roper');assert.equal(boss.boss.level,18);assert.equal(boss.boss.reward,1725);
});
test('all species-level variants are finite and higher own levels mean higher HP, attack and XP',()=>{
 for(const m of MONSTERS){let previous={hp:0,dps:0,reward:0};for(const level of [1,2,6,10,18,30,100,1000]){const b=makeBattle('enemy',{monsterId:m.id,level});assert(Number.isFinite(b.hp)&&Number.isFinite(b.dps));assert(b.hp>previous.hp&&b.dps>previous.dps&&b.reward>previous.reward);previous=b;}}
});
test('five supplied colors respect exact grade boundaries, including 0 and 9%',()=>{
 assert.deepEqual([-1,0,2.999,3,5.999,6,8.999,9,15].map(gradeColor),[GRADE_COLORS[0],GRADE_COLORS[1],GRADE_COLORS[1],GRADE_COLORS[2],GRADE_COLORS[2],GRADE_COLORS[3],GRADE_COLORS[3],GRADE_COLORS[4],GRADE_COLORS[4]]);
});
test('main, overlay and route planner use true grade with one bounded fill per route segment',()=>{
 const route={distance:500,points:[{d:0,e:100},{d:100,e:99},{d:200,e:100},{d:300,e:104},{d:400,e:111},{d:500,e:121}]};
 for(const [w,h] of [[1000,300],[600,110],[600,150]]){const svg=elevationSVG(route,sample,w,h,.5);for(const color of GRADE_COLORS)assert(svg.includes('fill="'+color+'"'));assert.equal((svg.match(/<polygon/g)||[]).length,5);assert(!/NaN|Infinity/.test(svg));}
 const flat=elevationSVG(generateRoute(1,'flat',0,1),sample,600,110,1);assert(!/NaN|Infinity/.test(flat));
});
test('new monster modules remain behind the beta password gate',async()=>{
 const {default:handler}=await import('../api/cycle-quest.js');
 const oldPassword=process.env.CYCLE_QUEST_PASSWORD,oldSecret=process.env.CYCLE_QUEST_SESSION_SECRET;
 process.env.CYCLE_QUEST_PASSWORD='test-fixture';process.env.CYCLE_QUEST_SESSION_SECRET='test-signing-key';
 try{for(const asset of Object.keys(QUEST_ASSETS)){let status;const res={setHeader(){},status(n){status=n;return this;},json(){return this;},end(){}};await handler({method:'GET',url:'/api/cycle-quest?asset='+asset,headers:{host:'localhost'}},res);assert.equal(status,401);}}
 finally{if(oldPassword===undefined)delete process.env.CYCLE_QUEST_PASSWORD;else process.env.CYCLE_QUEST_PASSWORD=oldPassword;if(oldSecret===undefined)delete process.env.CYCLE_QUEST_SESSION_SECRET;else process.env.CYCLE_QUEST_SESSION_SECRET=oldSecret;}
});


test('malformed current combat saves are rejected rather than crashing the next fight',()=>{
 const good=makeBattle('boss',{chapter:1});
 for(const patch of [{max:undefined},{level:1001},{reward:undefined},{combatVersion:99},{kind:'enemy'}])assert.throws(()=>readCharacter(JSON.stringify({...fresh(),boss:{...good,...patch}})));
 const group=enemyGroup([makeBattle('enemy',{monsterId:'rat',level:1})]);group.enemies[0].dps=undefined;
 assert.throws(()=>readCharacter(JSON.stringify({...fresh(),battle:group})));
});
test('legacy summit category never changes fixed variant HP, attack or earned XP',()=>{
 const original={...makeBattle('summit',{monsterId:'lifted-dually',variant:'EXTREME'}),combatVersion:undefined};
 const migrated=['CAT 4','CAT 1','HC'].map(category=>readCharacter(JSON.stringify({...fresh(),battle:{...original,category}})).battle);
 for(const b of migrated){assert.equal(b.max,migrated[0].max);assert.equal(b.dps,migrated[0].dps);assert.equal(b.reward,migrated[0].reward);}
});
