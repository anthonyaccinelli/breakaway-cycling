import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import vm from 'node:vm';
import {scaleSummit,SUMMIT_CATEGORIES} from '../cycle-quest/summits.js';
import {escapeHTML,formatClock,rewardButtons} from '../cycle-quest/ui-utils.js';
import {QUEST_ASSETS} from '../cycle-quest/assets.js';
const base=new URL('../cycle-quest/',import.meta.url);
const saveSource=(await readFile(new URL('save-state.js',base),'utf8')).replace(/\/api\/cycle-quest\?asset=([a-z.-]+)/g,(_,name)=>new URL(name,base).href);
const {readCharacter,validCharacter}=await import('data:text/javascript;base64,'+Buffer.from(saveSource).toString('base64'));
const game=await readFile(new URL('game.js',base),'utf8');
function fn(name){const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);return game.slice(start,end);}
const fresh=()=>({version:1,xp:450,hp:50,miles:2,chapter:1,mode:'adventure',rideSeconds:100,rideMiles:2,nextEncounter:0,reward:false,boss:null});
const battle=()=>({kind:'enemy',name:'GOBLIN',hp:100,max:100,dps:.25,reward:150,enemies:[{id:'goblin',name:'GOBLIN',hp:100,max:100}]});

test('encounters preserve Overlay and synchronize the Ride tab when leaving Status',()=>{
 const pages=[],c={view:'overlay',questBaseline:{setPage:page=>pages.push(page)}};
 vm.createContext(c);vm.runInContext(fn('showEncounterView'),c);vm.runInContext('showEncounterView()',c);
 assert.equal(c.view,'overlay');assert.deepEqual(pages,[]);
 c.view='character';vm.runInContext('showEncounterView()',c);assert.equal(c.view,'ride');assert.deepEqual(pages,['ride']);
});

test('saved encounters with the old negative timer recover rather than losing the character',()=>{
 const saved={...fresh(),nextEncounter:-.18,battle:battle()};
 const repaired=readCharacter(JSON.stringify(saved));assert.equal(repaired.xp,450);assert.equal(repaired.nextEncounter,0);assert.equal(repaired.battle.name,'GOBLIN');assert(validCharacter(repaired));
 assert.throws(()=>readCharacter(JSON.stringify({...saved,battle:{...battle(),dps:-1}})));
});
test('malformed route, battle and reward payloads fail validation without runtime crashes',()=>{
 for(const changed of [
  {route:{name:'bad',points:[null,null]}},
  {battle:{...battle(),hp:-1}},
  {battle:{...battle(),enemies:[null]}},
  {battle:{...battle(),level:'<img src=x onerror=alert(1)>'}},
  {pendingReward:{count:1,xp:150,hp:25,coins:25}},
  {coins:-1},{session:{id:'bad'}}
 ])assert.equal(validCharacter({...fresh(),...changed}),false);
 assert(validCharacter({...fresh(),battle:battle()}));
});
test('unreadable stored character is retained and autosave is blocked',()=>{
 let writes=0;const status={textContent:''};
 const c={key:'fixture',s:fresh(),persistedSave:null,invalidStoredSave:false,externalSaveChanged:false,message:'',localStorage:{getItem:()=>'{broken',setItem(){writes++;}},readCharacter,maxHP:()=>100,restoreRewardState(){throw Error('Must not migrate invalid save');},$:()=>status};
 vm.createContext(c);vm.runInContext(fn('load')+'\n'+fn('save'),c);vm.runInContext('load();save()',c);
 assert.equal(c.persistedSave,'{broken');assert.equal(c.invalidStoredSave,true);assert.equal(c.externalSaveChanged,true);assert.equal(writes,0);
});
test('autosave checks for a newer tab write even before the storage event arrives',()=>{
 let writes=0,pauses=0;const status={textContent:''};
 const c={key:'fixture',s:fresh(),persistedSave:'old save',externalSaveChanged:false,running:true,message:'',localStorage:{getItem:()=> 'newer save',setItem(){writes++;}},parentSend:()=>pauses++,$:()=>status};
 vm.createContext(c);vm.runInContext(fn('save'),c);vm.runInContext('save()',c);
 assert.equal(writes,0);assert.equal(pauses,1);assert.equal(c.running,false);assert.equal(c.externalSaveChanged,true);
});
test('summit rules apply once with the same rewards on both route types',()=>{
 const original={kind:'summit',hp:1000,max:1000,reward:600,dps:1};
 for(const [category,rule] of Object.entries(SUMMIT_CATEGORIES)){
  const result=scaleSummit(original,category);assert.equal(result.hp,Math.round(1000*rule.health));assert.equal(result.max,result.hp);assert.equal(result.reward,rule.xp);assert.equal(original.hp,1000);
 }
});
test('text escaping, session clocks and shared reward buttons handle edge cases consistently',()=>{
 assert.equal(escapeHTML('<img src="x" onerror=\'bad\'>&'),'&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;&amp;');
 assert.equal(formatClock(59.99),'00:00:59');assert.equal(formatClock(3600),'01:00:00');assert.equal(formatClock(-1),'00:00:00');
 for(const compact of [true,false]){const html=rewardButtons({hp:75,coins:75},compact);assert.match(html,/HEAL 75 HP/);assert.match(html,/GAIN 75 COINS/);assert.doesNotMatch(html,/data-reward="xp"/);}
});
test('every protected asset and its local autoplay counterpart exist with no missing module dependencies',async()=>{
 for(const name of Object.keys(QUEST_ASSETS)){
  const source=await readFile(new URL(name,base),'utf8');
  const generated=await readFile(new URL('../public/cq-autoplay/'+(name==='index.html'?'ride.html':name),import.meta.url),'utf8');
  assert(source.length>0&&generated.length>0,name);
  for(const match of source.matchAll(/\/api\/cycle-quest\?asset=([A-Za-z0-9.-]+)/g))assert(Object.hasOwn(QUEST_ASSETS,match[1]),name+' references '+match[1]);
 }
});
test('asset allowlist rejects inherited object properties even with a valid beta session',async()=>{
 const {default:handler}=await import('../api/cycle-quest.js');
 const password=process.env.CYCLE_QUEST_PASSWORD,secret=process.env.CYCLE_QUEST_SESSION_SECRET;
 process.env.CYCLE_QUEST_PASSWORD='fixture';process.env.CYCLE_QUEST_SESSION_SECRET='fixture-secret';
 const expiry=String(Date.now()+60000),signature=createHmac('sha256','fixture-secret').update(expiry).digest('base64url');
 try{for(const asset of ['constructor','__proto__','toString']){
  let status;const res={setHeader(){},status(code){status=code;return this;},end(){},json(){},send(){}};
  await handler({method:'GET',url:'/api/cycle-quest?asset='+asset,headers:{host:'localhost',cookie:'breakaway_quest_beta='+expiry+'.'+signature}},res);assert.equal(status,404);
 }}finally{if(password===undefined)delete process.env.CYCLE_QUEST_PASSWORD;else process.env.CYCLE_QUEST_PASSWORD=password;if(secret===undefined)delete process.env.CYCLE_QUEST_SESSION_SECRET;else process.env.CYCLE_QUEST_SESSION_SECRET=secret;}
});

test('over-limit legacy XP recovers into a valid character instead of invalidating the save',()=>{
 const saved={...fresh(),xp:10000001};const recovered=readCharacter(JSON.stringify(saved));
 assert.equal(recovered.xp,10000000);assert(validCharacter(recovered));
 assert.throws(()=>readCharacter(JSON.stringify({...saved,hp:-1})));
});
test('enemy levels reject markup and battle art escapes even unvalidated labels',()=>{
 assert(!validCharacter({...fresh(),battle:{...battle(),enemies:[{...battle().enemies[0],level:'<img onerror=bad>'}]}}));
 const c={safeText:escapeHTML,healthColor:()=> '#fff',fmt:String};vm.createContext(c);vm.runInContext(fn('monsterArt'),c);
 c.b={name:'RAT',level:1,enemies:[{id:'rat',name:'RAT',level:'<img onerror=bad>',hp:1,max:1}]};
 const html=vm.runInContext('monsterArt(b)',c);assert.match(html,/&lt;img onerror=bad&gt;/);assert.doesNotMatch(html,/<img onerror/);
});
test('named stat hooks match the HTML and tolerate missing or reordered readouts',async()=>{
 const html=await readFile(new URL('index.html',base),'utf8');
 const names=[...game.matchAll(/setStat\(['"]([^'"]+)['"]/g)].map(m=>m[1]);
 for(const name of names)assert(html.includes('data-stat="'+name+'"'),name);
 const declaration=game.match(/const setStat=[^\n]+/)[0];const first={},second={};
 const c={all:selector=>selector.includes('missing')?[]:[second,first]};vm.createContext(c);vm.runInContext(declaration+'\nsetStat("power","250 W");setStat("missing","ignored");',c);
 assert.equal(first.textContent,'250 W');assert.equal(second.textContent,'250 W');
 assert.doesNotMatch(game,/\b(?:cr|pr|tiles|os)\[\d+\]/);
});
test('save import confirms replacement, backs up raw progress, and refuses stale tabs or failed backup writes',async()=>{
 const start=game.indexOf("$('#savefile').onchange=async e=>")+"$('#savefile').onchange=".length;
 const end=game.indexOf('\nroot.addEventListener',start);
 const handler=game.slice(start,end).replace(/;\s*$/,'');
 for(const scenario of ['cancel','stale','quota','ok']){
  const original=JSON.stringify(fresh()),replacement={...fresh(),xp:999};const writes=[];let routes=0;
  const c={s:fresh(),key:'save',persistedSave:original,externalSaveChanged:false,invalidStoredSave:false,readCharacter,window:{confirm:()=>scenario!=='cancel'},localStorage:{getItem:()=>scenario==='stale'?'newer':original,setItem:(key,value)=>{if(scenario==='quota')throw Error('Quota exceeded');writes.push([key,value]);}},levelUps:{clear(){}},levelUp:null,running:false,maxHP:()=>100,restoreRewardState(){},METERS_PER_MILE:1609.344,parentSend(){routes++;},save(){},render(){},message:''};
  c.generateRoute=()=>({});vm.createContext(c);const run=vm.runInContext('('+handler+')',c);
  const e={target:{files:[{size:100,text:async()=>JSON.stringify(replacement)}],value:'chosen'}};await run(e);
  assert.equal(e.target.value,'');
  if(scenario==='ok'){assert.equal(c.s.xp,999);assert.equal(writes[0][0],'save-pre-import-backup');assert.equal(writes[0][1],original);}
  else{assert.equal(c.s.xp,450);assert.equal(routes,0);assert.equal(writes.length,0);}
 }
});
