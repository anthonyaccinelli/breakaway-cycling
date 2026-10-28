import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MONSTERS} from '../cycle-quest/monsters.js';
import {gradeColor,GRADE_COLORS,elevationSVG} from '../cycle-quest/profile.js';
import {generateRoute,sample} from '../cycle-quest/routes.js';
const source=(await readFile(new URL('../cycle-quest/combat.js',import.meta.url),'utf8')).replace("'/api/cycle-quest?asset=monsters.js'",JSON.stringify(new URL('../cycle-quest/monsters.js',import.meta.url).href));
const {makeBattle,monsterPool,chapterRandom,CHAPTER_BIOMES,nextChapterEncounter,advanceBattle,SUMMIT_BOSSES,SUMMIT_VARIANTS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('roster contains unique numerical SRD creatures at appropriate progression tiers',()=>{
 assert.equal(MONSTERS.length,314);assert.equal(new Set(MONSTERS.map(m=>m.id)).size,314);
 for(const m of MONSTERS)assert(m.hp>0&&Number.isFinite(m.attack)&&m.damage>=0&&m.level>=1);
 assert(MONSTERS.find(m=>m.id==='goblin').level<MONSTERS.find(m=>m.id==='adult-red-dragon').level);
});
test('regular encounter effort scales with FTP and combat has no timeout',()=>{
 for(let level=1;level<=200;level++)for(const random of [()=>0,()=>.5,()=>.999999]){
  assert(monsterPool(level).length>0);
  const enemy=makeBattle('enemy',{level,ftp:280,entryPower:150,random});const seconds=enemy.hp/(187.5*1.08**(level-1));
  assert(Math.abs(seconds-60)<.01);assert.equal(enemy.dps,.25);assert.equal(enemy.time,undefined);assert.equal(enemy.reward,150);
  const summit=makeBattle('summit',{level,ftp:280,random});assert.equal(summit.time,undefined);assert.equal(summit.reward,600);assert(summit.dps>0);assert(summit.hp>enemy.hp);
  const boss=makeBattle('boss',{level,chapterLevel:level,ftp:280,random});assert.equal(boss.time,undefined);assert(boss.hp>enemy.hp&&boss.dps>0);
 }
});
test('chapter selection is reproducible and grinding increases player damage against a fixed boss',()=>{
 const options={level:12,chapterLevel:12,ftp:280,random:()=>chapterRandom(1)};
 const a=makeBattle('boss',options),b=makeBattle('boss',options);assert.deepEqual(a,b);
 assert(a.hp/(280*1.08**14)<a.hp/(280*1.08**11));assert.equal(a.hp,b.hp);
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
 try{for(const asset of ['rewards.js','monsters.js','combat.js','profile.js','level-up.js','workouts.js','workout-ui.js','fit-decoder.js']){let status;const res={setHeader(){},status(n){status=n;return this;},json(){return this;},end(){}};await handler({method:'GET',url:'/api/cycle-quest?asset='+asset,headers:{host:'localhost'}},res);assert.equal(status,401);}}
 finally{if(oldPassword===undefined)delete process.env.CYCLE_QUEST_PASSWORD;else process.env.CYCLE_QUEST_PASSWORD=oldPassword;if(oldSecret===undefined)delete process.env.CYCLE_QUEST_SESSION_SECRET;else process.env.CYCLE_QUEST_SESSION_SECRET=oldSecret;}
});

test('first two chapter pools are distinct, complete, and draw fairly without repeated neighbors',()=>{
 const a=CHAPTER_BIOMES[1].monsters,b=CHAPTER_BIOMES[2].monsters;assert.equal(a.length,8);assert.equal(b.length,8);assert.equal(new Set([...a,...b]).size,16);for(const id of [...a,...b])assert(MONSTERS.some(m=>m.id===id));
 for(const chapter of [1,2]){let state=null,last=null;for(let cycle=0;cycle<5;cycle++){const drawn=[];for(let i=0;i<8;i++){const pick=nextChapterEncounter(chapter,state,()=>.37);assert.notEqual(pick.monsterId,last);drawn.push(pick.monsterId);last=pick.monsterId;state=pick.state;const fight=makeBattle('enemy',{level:1,ftp:280,monsterId:pick.monsterId});assert.equal(fight.monsterId,pick.monsterId);}assert.equal(new Set(drawn).size,8);}}
 assert.equal(nextChapterEncounter(3,null),null);
});

test('battle continues beyond old deadlines and ends exactly at 1 HP',()=>{
 let b={kind:'boss',hp:50000,max:50000,dps:.25,reward:600,time:30},hp=100;
 let r=advanceBattle(b,hp,150,60);assert.equal(r.outcome,null);assert.equal(r.battle.hp,41000);assert.equal(r.hp,85);
 r=advanceBattle(r.battle,r.hp,0,400);assert.equal(r.outcome,'loss');assert.equal(r.hp,1);
});
test('group has three full individual health bars and damage rolls to the next enemy',()=>{
 const e={hp:11250,max:11250,name:'GOBLIN'},b={kind:'enemy',hp:33750,max:33750,dps:.25,reward:60,enemies:[e,e,e]};
 const r=advanceBattle(b,100,187.5,100);assert.equal(r.outcome,null);assert.deepEqual(r.battle.enemies.map(x=>x.hp),[0,3750,11250]);assert.equal(r.killed,1);assert.equal(r.hp,75);
 const end=advanceBattle(r.battle,r.hp,187.5,80);assert.equal(end.outcome,'win');assert.equal(end.killed,2);
});
test('simultaneous boss defeat and 1 HP is a loss',()=>{const r=advanceBattle({hp:990,max:990,dps:1},100,10,100);assert.equal(r.outcome,'loss');assert.equal(r.hp,1);});
test('rider can set a ceiling and coasting uses a minimum target',()=>{const b=makeBattle('enemy',{level:1,ftp:280,entryPower:250,ceilingPercent:100});assert.equal(b.targetWatts,280);assert.equal(b.hp,16800);const c=makeBattle('enemy',{level:1,ftp:280,entryPower:0,ceilingPercent:100});assert.equal(c.targetWatts,154);});

test('summit roster has twelve fixed bosses and three variants with level unlocks',()=>{
 assert.equal(SUMMIT_BOSSES.length,12);assert.equal(new Set(SUMMIT_BOSSES).size,12);assert(SUMMIT_BOSSES.includes('lifted-dually'));for(const id of SUMMIT_BOSSES)if(id!=='lifted-dually')assert(MONSTERS.some(m=>m.id===id));
 assert.deepEqual(SUMMIT_VARIANTS.map(v=>v.minLevel),[1,10,20]);
 const names=new Set();for(let i=0;i<12;i++)for(let j=0;j<3;j++){let calls=0;const random=()=>calls++===0?(i+.1)/12:(j+.1)/3;const b=makeBattle('summit',{level:20,ftp:280,random});assert.equal(b.monsterId,SUMMIT_BOSSES[i]);assert(Number.isFinite(b.hp)&&Number.isFinite(b.dps));names.add(b.name);}
 assert.equal(names.size,36);for(const [level,expected] of [[1,'BASE'],[10,'EXTREME'],[20,'PSYCHO']]){const b=makeBattle('summit',{level,ftp:280,random:()=>.99999});assert.equal(b.summitVariant,expected);}
});
