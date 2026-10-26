import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MONSTERS} from '../cycle-quest/monsters.js';
import {gradeColor,GRADE_COLORS,elevationSVG} from '../cycle-quest/profile.js';
import {generateRoute,sample} from '../cycle-quest/routes.js';
const source=(await readFile(new URL('../cycle-quest/combat.js',import.meta.url),'utf8')).replace("'/api/cycle-quest?asset=monsters.js'",JSON.stringify(new URL('../cycle-quest/monsters.js',import.meta.url).href));
const {makeBattle,monsterPool,chapterRandom}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('roster contains unique numerical SRD creatures at appropriate progression tiers',()=>{
 assert.equal(MONSTERS.length,314);assert.equal(new Set(MONSTERS.map(m=>m.id)).size,314);
 for(const m of MONSTERS)assert(m.hp>0&&Number.isFinite(m.attack)&&m.damage>=0&&m.level>=1);
 assert(MONSTERS.find(m=>m.id==='goblin').level<MONSTERS.find(m=>m.id==='adult-red-dragon').level);
});
test('all playable tiers have forgiving regular fights and bounded summit/boss time',()=>{
 for(let level=1;level<=200;level++)for(const random of [()=>0,()=>.5,()=>.999999]){
  assert(monsterPool(level).length>0);
  const enemy=makeBattle('enemy',{level,ftp:280,random});const seconds=enemy.hp/(140*1.08**(level-1));
  assert(seconds>=10&&seconds<=16);assert(enemy.dps<=1&&enemy.dps>0);assert.equal(enemy.time,30);assert.equal(enemy.reward,60);
  const summit=makeBattle('summit',{level,ftp:280,random});assert.equal(summit.time,60);assert.equal(summit.reward,1200);assert(summit.hp>enemy.hp);
  const boss=makeBattle('boss',{level,chapterLevel:level,ftp:280,random});assert.equal(boss.time,300);assert(boss.hp>enemy.hp&&boss.dps>0);
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
 try{for(const asset of ['monsters.js','combat.js','profile.js','level-up.js','workouts.js','workout-ui.js','fit-decoder.js']){let status;const res={setHeader(){},status(n){status=n;return this;},json(){return this;},end(){}};await handler({method:'GET',url:'/api/cycle-quest?asset='+asset,headers:{host:'localhost'}},res);assert.equal(status,401);}}
 finally{if(oldPassword===undefined)delete process.env.CYCLE_QUEST_PASSWORD;else process.env.CYCLE_QUEST_PASSWORD=oldPassword;if(oldSecret===undefined)delete process.env.CYCLE_QUEST_SESSION_SECRET;else process.env.CYCLE_QUEST_SESSION_SECRET=oldSecret;}
});
