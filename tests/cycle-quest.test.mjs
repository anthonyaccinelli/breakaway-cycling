import {QUEST_ASSETS} from '../cycle-quest/assets.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeColor,GRADE_COLORS,elevationSVG} from '../cycle-quest/profile.js';
import {generateRoute,sample} from '../cycle-quest/routes.js';
import {loadQuestModule} from './quest-loader.mjs';
const {MONSTERS,makeBattle,enemyGroup,enemyXP,chapterLevels,encounterLevel,chapterMonsters,nextChapterEncounter,advanceBattle,SUMMIT_BOSSES}=await loadQuestModule('combat.js');
const {readCharacter}=await loadQuestModule('save-state.js');
const fresh=()=>({version:1,xp:24000,hp:100,miles:50,chapter:1,mode:'adventure',rideSeconds:100,rideMiles:2,nextEncounter:0,reward:false,boss:null});

test('canonical roster has one rat and no obsolete tabletop combat numbers',()=>{
 assert.equal(MONSTERS.length,313);assert.equal(new Set(MONSTERS.map(m=>m.id)).size,313);
 assert.equal(MONSTERS.filter(m=>m.id==='rat').length,1);assert(!MONSTERS.some(m=>m.id==='giant-rat'));
 for(const m of MONSTERS){assert(m.baseHP>0&&m.baseAttack>0&&m.tier>=1);for(const key of ['hp','attack','damage','cr','level'])assert.equal(m[key],undefined);}
});
test('rider telemetry and rider progression cannot affect enemy or boss stats',()=>{
 for(const kind of ['enemy','boss','summit']){
  const options={chapter:2,monsterId:kind==='enemy'?'rat':kind==='summit'?'lifted-dually':'roper',level:6};
  const base=makeBattle(kind,options);
  for(const riderLevel of [1,8,20,100])assert.deepEqual(makeBattle(kind,{...options,riderLevel,ftp:riderLevel*30,entryPower:riderLevel*20,ceilingPercent:150}),base);
  assert.equal(base.time,undefined);assert.equal(base.targetWatts,undefined);
 }
});
test('combat has no timeout, coasting still takes damage, and simultaneous death is a loss',()=>{
 let r=advanceBattle({kind:'boss',hp:50000,max:50000,dps:.25},100,150,60);assert.equal(r.outcome,null);assert.equal(r.battle.hp,41000);assert.equal(r.hp,85);
 r=advanceBattle(r.battle,r.hp,0,400);assert.equal(r.outcome,'loss');assert.equal(r.hp,1);
 assert.equal(advanceBattle({hp:990,max:990,dps:1},100,10,100).outcome,'loss');
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
