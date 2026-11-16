import test from 'node:test';
import assert from 'node:assert/strict';
import {loadQuestModule} from './quest-loader.mjs';
const combat=await loadQuestModule('combat.js');
const {BALANCE,MONSTERS,makeBattle,enemyGroup,enemyXP,enemyCoins,chapterLevels,chapterBaseLevel,chapterMonsters,nextChapterEncounter,
 advanceBattle,advanceBossBattle,riderDamagePerSecond,effortShare,critBonus,SUMMIT_BOSSES}=combat;
const {CHAPTERS,chapterRoster}=await loadQuestModule('chapters.js');
const {readCharacter}=await loadQuestModule('save-state.js');
const species=id=>MONSTERS.find(m=>m.id===id);
const close=(a,b,eps=1e-9)=>assert(Math.abs(a-b)<=eps,`${a} ≉ ${b}`);

test('damage is attack × effort, plus a critical-hit bonus of 1% per 1% above FTP',()=>{
 close(riderDamagePerSecond(100,250,250),250);
 close(riderDamagePerSecond(100,0,250),0);
 close(riderDamagePerSecond(100,125,250),125);
 close(riderDamagePerSecond(100,275,250),250*1.1*1.1);
 close(riderDamagePerSecond(100,500,250),250*2*2);
 close(critBonus(1.0),0);close(critBonus(1.01),0.01,1e-12);close(critBonus(2),1);
 close(riderDamagePerSecond(200,250,250),500);
});
test('riders with different FTPs deal identical damage at the same effort',()=>{
 for(const effort of [0.5,0.75,1,1.1,1.5]){
  const results=[180,250,320].map(ftp=>riderDamagePerSecond(100,ftp*effort,ftp));
  for(const r of results)close(r,results[0],1e-9);
 }
 assert.equal(effortShare(300,0),300);
});
test('enemy stats follow BALANCE and depend only on the enemy level and species',()=>{
 const m=species('bat'),one=makeBattle('enemy',{monsterId:'bat',level:1}),ten=makeBattle('enemy',{monsterId:'bat',level:10});
 assert.equal(one.hp,Math.round(BALANCE.enemyHPBase*m.baseHP/9000));
 assert.equal(one.dps,Math.round(BALANCE.enemyAttackBase*m.baseAttack/0.2*100)/100);
 assert.equal(ten.hp,Math.round(BALANCE.enemyHPBase*m.baseHP/9000*BALANCE.enemyHPGrowth**9));
 assert.equal(one.reward,enemyXP(1));assert.equal(ten.reward,enemyXP(10));
 assert.equal(one.coins,enemyCoins(1));assert.equal(ten.coins,enemyCoins(10));
 assert(ten.hp>one.hp&&ten.dps>one.dps&&ten.reward>one.reward);
});
test('a fight between equal levels takes the same time in every chapter',()=>{
 const times=[1,20,45].map(L=>{const e=makeBattle('enemy',{monsterId:'bat',level:L});const attack=100*1.08**(L-1);return e.hp/riderDamagePerSecond(attack,187.5,250);});
 for(const t of times)close(t,times[0],0.05);
});
test('chapter levels are fixed per chapter and rise one level every 25 miles',()=>{
 assert.deepEqual(chapterLevels(1,0),{min:1,max:3,boss:6});
 assert.deepEqual(chapterLevels(1,99),{min:4,max:6,boss:6});
 assert.deepEqual(chapterLevels(1,null),{min:1,max:6,boss:6});
 for(let c=2;c<=10;c++){
  assert(chapterBaseLevel(c)>chapterBaseLevel(c-1));
  assert.equal(chapterLevels(c,0).min,chapterBaseLevel(c));
 }
 assert.equal(chapterBaseLevel(10),1+Math.round(BALANCE.chapterLevelStep*9));
});
test('rosters: 8 new monsters per chapter; 4 carry over from the last chapter for 12',()=>{
 assert.equal(CHAPTERS.length,10);
 const seenNew=new Set();
 for(const c of CHAPTERS){
  assert.equal(c.newMonsters.length,8);
  for(const id of c.newMonsters){assert(!seenNew.has(id),'repeated new monster '+id);seenNew.add(id);assert(species(id),id);}
  assert(species(c.boss),c.boss);
  assert.equal(chapterRoster(c.chapter).length,c.chapter===1?8:12);
  if(c.chapter>1){
   assert.equal(c.carriedOver.length,4);
   const prev=CHAPTERS[c.chapter-2].newMonsters;
   for(const id of c.carriedOver)assert(prev.includes(id),id+' must come from chapter '+(c.chapter-1));
  }
  assert.deepEqual(chapterMonsters(c.chapter).map(m=>m.id),chapterRoster(c.chapter));
 }
});
test('encounters draw every roster monster once before repeating, never twice in a row',()=>{
 let seed=3;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const chapter of [1,4]){
  let state=null,last=null;const roster=chapterRoster(chapter);
  for(let round=0;round<5;round++){
   const drawn=[];
   for(let i=0;i<roster.length;i++){const pick=nextChapterEncounter(chapter,state,random);state=pick.state;assert.notEqual(pick.monsterId,last);last=pick.monsterId;drawn.push(pick.monsterId);}
   assert.deepEqual([...drawn].sort(),[...roster].sort());
  }
 }
});
test('groups sum HP, attack, XP and coins, and a defeated member stops attacking at once',()=>{
 const parts=[1,3,5].map(level=>makeBattle('enemy',{monsterId:'bat',level}));
 const g=enemyGroup(parts);
 assert.equal(g.hp,parts.reduce((n,p)=>n+p.hp,0));assert.equal(g.reward,parts.reduce((n,p)=>n+p.reward,0));
 assert.equal(g.coins,parts.reduce((n,p)=>n+p.coins,0));close(g.dps,parts.reduce((n,p)=>n+p.dps,0),1e-9);
 const b={kind:'enemy',enemies:[0,1,2].map(i=>({id:'x'+i,name:'X',level:1,hp:7500,max:7500,dps:0.2})),hp:22500,max:22500,dps:0.6};
 const result=advanceBattle(b,100,150,150);assert.equal(result.outcome,'win');assert.equal(result.killed,3);close(result.hp,40,1e-8);
 let small={battle:b,hp:100};for(let i=0;i<150;i++)small=advanceBattle(small.battle,small.hp,150,1);
 assert.equal(small.outcome,'win');close(small.hp,result.hp,1e-8);
});
test('chapter bosses are the chapter roster boss, fixed in level, and tougher than its enemies',()=>{
 for(const c of CHAPTERS){
  const boss=makeBattle('boss',{chapter:c.chapter}),same=makeBattle('enemy',{monsterId:c.boss,level:boss.level});
  assert.equal(boss.monsterId,c.boss);assert.equal(boss.level,chapterLevels(c.chapter).boss);
  close(boss.hp/same.hp,BALANCE.boss.hp,0.001);assert.equal(boss.reward,Math.round(enemyXP(boss.level)*BALANCE.boss.xp));
 }
});
test('summit bosses: twelve identities at the chapter boss level with summit scaling',()=>{
 assert.equal(SUMMIT_BOSSES.length,12);
 for(const id of SUMMIT_BOSSES){
  const s=makeBattle('summit',{chapter:3,monsterId:id});
  assert.equal(s.monsterId,id);assert.equal(s.level,chapterLevels(3).boss);assert.equal(s.reward,enemyXP(s.level)*BALANCE.summit.xp);
 }
});
test('summit bosses can be escaped by not pedaling; chapter bosses cannot',()=>{
 const summit=makeBattle('summit',{chapter:1,monsterId:'oni'});
 let out={battle:summit,hp:100};
 for(let i=0;i<14;i++)out=advanceBossBattle(out.battle,out.hp,0,1,{watts:0,cadence:0});
 assert.equal(out.outcome,null);
 out=advanceBossBattle(out.battle,out.hp,100,1,{watts:200,cadence:80});assert.equal(out.battle.stopped,0);
 for(let i=0;i<15;i++)out=advanceBossBattle(out.battle,out.hp,0,1,{watts:0,cadence:0});
 assert.equal(out.outcome,'flee');
 let boss={battle:makeBattle('boss',{chapter:1}),hp:100};
 for(let i=0;i<30;i++){boss=advanceBossBattle(boss.battle,boss.hp,0,1,{watts:0,cadence:0});assert.notEqual(boss.outcome,'flee');if(boss.outcome)break;}
});
test('older saves migrate battles, bosses and pending rewards into the current rules',()=>{
 const fresh={version:1,xp:24000,hp:100,miles:50,chapter:1,mode:'adventure',rideSeconds:100,rideMiles:2,nextEncounter:0,reward:false,boss:null};
 const old={...fresh,battleCapPct:125,chapterEncounter:{chapter:1,bag:['giant-rat','bat'],last:'giant-rat'},
  battle:{combatVersion:2,kind:'enemy',name:'GIANT RAT',monsterId:'giant-rat',level:6,hp:500,max:1000,dps:.25,reward:150,enemies:[{id:'giant-rat',name:'GIANT RAT',level:6,hp:500,max:1000,dps:.25,reward:150}]}};
 const next=readCharacter(JSON.stringify(old));
 assert.equal(next.xp,old.xp);assert.equal(next.battle.monsterId,'rat');assert.equal(next.battle.combatVersion,combat.COMBAT_VERSION);
 assert.equal(next.battle.hp,next.battle.max/2);assert(next.battle.level>=1&&next.battle.level<=chapterLevels(1,null).max);
 assert.equal(next.battleCapPct,undefined);assert.deepEqual(readCharacter(JSON.stringify(next)),next);
 const paid=readCharacter(JSON.stringify({...fresh,reward:true,pendingReward:{count:2,xp:300,hp:50,coins:50}}));
 assert.deepEqual(paid.pendingReward,{count:2,xp:300,coins:50,healPercent:70});
 const boss=readCharacter(JSON.stringify({...fresh,boss:{combatVersion:2,kind:'boss',monsterId:'tarrasque',name:'TARRASQUE',level:18,hp:9999,max:9999,dps:1,reward:1}}));
 assert.equal(boss.boss.monsterId,CHAPTERS[0].boss);assert.equal(boss.boss.level,chapterLevels(1).boss);
});
test('random encounters wait on descents steeper than -3% and resume when the road levels out',async()=>{
 const {encounterAllowedOnGrade}=combat;
 for(const g of [8,0,-1,-2.9,-3])assert(encounterAllowedOnGrade(g),String(g));
 for(const g of [-3.1,-6,-12])assert(!encounterAllowedOnGrade(g),String(g));
 assert(encounterAllowedOnGrade(undefined),'unknown grade never blocks encounters');
 const {readFile}=await import('node:fs/promises');
 const game=await readFile(new URL('../cycle-quest/game.js',import.meta.url),'utf8');
 assert(game.includes("if (s.nextEncounter <= 0 && encounterAllowedOnGrade(m.grade)) encounter('enemy');"));
});

test('scaled Freeroam puts enemies at the rider level minus 0 to 2, never below 1', async () => {
  const { scaledEncounterLevel, makeBattle, BALANCE } = await loadQuestModule('combat.js');
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(scaledEncounterLevel(30, () => i / 200));
  assert.deepEqual([...seen].sort((a, b) => a - b), [28, 29, 30]);
  assert.equal(BALANCE.scaledLevelsBelow, 2);
  for (let i = 0; i < 20; i++) assert(scaledEncounterLevel(1, () => i / 20) === 1);
  assert.equal(makeBattle('summit', { chapter: 1, level: 30 }).level, 30, 'scaled summit boss');
  assert.equal(makeBattle('summit', { chapter: 1 }).level, 6, 'chapter summit boss');
});

test('saves accept the scaled Freeroam setting (0) and chapters 1–10', async () => {
  const { validCharacter } = await loadQuestModule('save-state.js');
  const fresh = { version: 1, xp: 0, hp: 100, miles: 2, chapter: 1, mode: 'training', rideSeconds: 0, rideMiles: 0, nextEncounter: 260, reward: false, boss: null, battle: null, workouts: [] };
  for (const n of [0, 1, 10]) assert(validCharacter({ ...fresh, freeroamChapter: n }), String(n));
  for (const n of [-1, 11, 2.5]) assert(!validCharacter({ ...fresh, freeroamChapter: n }), String(n));
});

test('random encounters come about every 3 minutes, and the first within 60–90 s of a ride', async () => {
  const { encounterDelay } = await loadQuestModule('combat.js');
  for (const r of [0, 0.5, 0.999]) {
    const gap = encounterDelay(false, () => r), first = encounterDelay(true, () => r);
    assert(gap >= 150 && gap <= 240, 'gap ' + gap);
    assert(first >= 60 && first <= 90, 'first ' + first);
  }
  const game = await (await import('node:fs/promises')).readFile(new URL('../cycle-quest/game.js', import.meta.url), 'utf8');
  assert.match(game, /s\.nextEncounter = encounterDelay\(true\)/);
});
