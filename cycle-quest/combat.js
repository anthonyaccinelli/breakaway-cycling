import {MONSTERS} from '/api/cycle-quest?asset=monsters.js';
export {MONSTERS};
export const COMBAT_VERSION=2;
export const MAX_ENEMY_LEVEL=1000;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const roll=random=>clamp(Number(random())||0,0,1-Number.EPSILON);
const pick=(list,random)=>list[Math.floor(roll(random)*list.length)];
const ownLevel=value=>clamp(Math.floor(Number(value)||1),1,MAX_ENEMY_LEVEL);
const cents=value=>Math.round(value*100)/100;
const species=new Map(MONSTERS.map(m=>[m.id,m]));
export const CHAPTER_BIOMES=Object.freeze({
 1:{name:'THE VERDANT WILDS',biome:'forest',monsters:['rat','bat','snake','goblin','wolf','giant-fire-beetle','giant-spider','worg']},
 2:{name:'THE HAUNTED MOOR',biome:'moor',monsters:['skeleton','zombie','ghoul','shadow','specter','death-dog','gnoll','harpy']}
});
// Content levels only. Rider level, FTP and entering watts are never inputs.
export function chapterLevels(chapter=1,miles=0){
 const c=Math.max(1,Math.floor(Number(chapter)||1)),band=clamp(Math.floor((Number(miles)||0)/25),0,3);
 const min=ownLevel(c===1?1:12*(c-1)),boss=ownLevel(12*c+6);
 return {min,max:Math.min(boss,c===1?[5,10,14,18][band]:min+[6,10,14,18][band]),boss};
}
export function encounterLevel(chapter,miles,random=Math.random){
 const {min,max}=chapterLevels(chapter,miles);return min+Math.floor(roll(random)*(max-min+1));
}
export const enemyXP=level=>150+25*(ownLevel(level)-1);
export function monsterPool(contentLevel){
 const target=ownLevel(contentLevel),available=MONSTERS.filter(m=>m.id!=='headwind');
 const distance=Math.min(...available.map(m=>Math.abs(m.tier-target)));
 return available.filter(m=>Math.abs(m.tier-target)===distance);
}
export function chapterMonsters(chapter){
 return CHAPTER_BIOMES[chapter]?.monsters.map(id=>species.get(id))||monsterPool(chapterLevels(chapter).boss-6);
}
export function nextChapterEncounter(chapter,previousState,random=Math.random){
 const state=previousState?.chapter===chapter?previousState:null;
 if(roll(random)<.1)return {monsterId:'headwind',state};
 const ids=chapterMonsters(chapter).map(m=>m.id),valid=new Set(ids);
 let bag=Array.isArray(state?.bag)?state.bag.filter((id,i,a)=>valid.has(id)&&a.indexOf(id)===i):[];
 const last=valid.has(state?.last)?state.last:null;
 if(!bag.length){bag=[...ids];for(let i=bag.length-1;i>0;i--){const j=Math.floor(roll(random)*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.length>1&&bag[0]===last)[bag[0],bag[1]]=[bag[1],bag[0]];}
 const monsterId=bag.shift();return {monsterId,state:{chapter,bag,last:monsterId}};
}
export const SUMMIT_BOSSES=Object.freeze(['lifted-dually','oni','silver-dragon-wyrmling','kraken','ancient-green-dragon','young-bronze-dragon','doppelganger','behir','remorhaz','roc','storm-giant','wyvern']);
export const SUMMIT_VARIANTS=Object.freeze([{name:'BASE',suffix:'',levels:0},{name:'EXTREME',suffix:' EXTREME',levels:10},{name:'PSYCHO',suffix:' PSYCHO',levels:20}]);
const summitLevel=(id,variant)=>ownLevel(Math.max(8,species.get(id)?.tier||12)+variant.levels);
function summitIdentity(chapter,monsterId,variantName,random){
 if(monsterId&&SUMMIT_BOSSES.includes(monsterId)){const variant=SUMMIT_VARIANTS.find(v=>v.name===variantName)||SUMMIT_VARIANTS[0];return {id:monsterId,variant,level:summitLevel(monsterId,variant)};}
 const limit=chapterLevels(chapter).boss+4;
 return pick(SUMMIT_BOSSES.flatMap(id=>SUMMIT_VARIANTS.map(variant=>({id,variant,level:summitLevel(id,variant)}))).filter(item=>item.level<=limit),random);
}
export function chapterRandom(chapter){let n=Math.imul(chapter,0x9e3779b1);n=Math.imul(n^(n>>>16),0x7feb352d);return ((n^(n>>>16))>>>0)/4294967296;}
// Single definition of HP, attack and XP for every species/own-level pair.
export function makeBattle(kind,{chapter=1,level,monsterId,variant,random=Math.random}={}){
 if(!['enemy','boss','summit'].includes(kind))throw Error('Unknown battle kind');
 let monster,L,summit;
 if(kind==='summit'){summit=summitIdentity(chapter,monsterId,variant,random);monster=species.get(summit.id)||{id:'lifted-dually',name:'Lifted Dually',baseHP:9000,baseAttack:.2};L=summit.level;}
 else if(kind==='boss'){L=chapterLevels(chapter).boss;monster=species.get(monsterId)||pick(monsterPool(L),()=>chapterRandom(chapter));}
 else{L=ownLevel(level??chapterLevels(chapter).min);monster=species.get(monsterId)||pick(chapterMonsters(chapter),random);}
 const healthFactor=monster.baseHP/9000,attackFactor=monster.baseAttack/.2;
 const hp=Math.round((kind==='enemy'?monster.baseHP:kind==='boss'?27000*healthFactor:13500*healthFactor)*1.08**(L-1));
 const dps=cents(kind==='enemy'?monster.baseAttack*1.06**(L-1):(100+10*(L-1))*(kind==='boss'?.65/180:.4/60)*attackFactor);
 return {combatVersion:COMBAT_VERSION,kind,monsterId:monster.id,name:monster.name.toUpperCase()+(summit?.variant.suffix||''),level:L,hp,max:hp,dps,reward:enemyXP(L)*(kind==='enemy'?1:3),...(summit?{summitVariant:summit.variant.name}:{})};
}
export function enemyGroup(battles){
 if(!Array.isArray(battles)||battles.length<1||battles.length>3)throw Error('An encounter needs one to three enemies');
 const enemies=battles.map(b=>({id:b.monsterId,name:b.name,level:b.level,hp:b.hp,max:b.max,dps:b.dps,reward:b.reward}));
 return {...battles[0],name:enemies.length===1?enemies[0].name:enemies.length+' ENEMIES',enemies,hp:enemies.reduce((n,e)=>n+e.hp,0),max:enemies.reduce((n,e)=>n+e.max,0),dps:enemies.filter(e=>e.hp>0).reduce((n,e)=>n+e.dps,0),reward:enemies.reduce((n,e)=>n+e.reward,0)};
}
// Resolve kills within the tick. Dead enemies stop attacking immediately.
// Reaching 1 HP on a kill is a loss; group damage focuses the first living enemy.
export function advanceBattle(battle,playerHP,damagePerSecond,dt){
 const b={...battle,enemies:battle.enemies?.map(e=>({...e}))};
 let hp=Math.max(1,playerHP),remaining=Math.max(0,dt),killed=0,outcome=null;
 const outgoing=Math.max(0,Number(damagePerSecond)||0),group=Array.isArray(b.enemies),targets=group?b.enemies:[b];
 while(remaining>1e-9){
  const target=targets.find(e=>e.hp>1e-7);if(!target){outcome=hp<=1?'loss':'win';break;}
  const incoming=group?targets.filter(e=>e.hp>1e-7).reduce((n,e)=>n+e.dps,0):b.dps;
  const death=incoming>0?(hp-1)/incoming:Infinity,kill=outgoing>0?target.hp/outgoing:Infinity,elapsed=Math.min(remaining,death,kill);
  if(outgoing>0)target.hp=Math.max(0,target.hp-outgoing*elapsed);
  hp=Math.max(1,hp-incoming*elapsed);remaining-=elapsed;
  if(kill<=elapsed+1e-9){target.hp=0;if(group)killed++;}
  if(death<=elapsed+1e-9){outcome='loss';break;}
  if(targets.every(e=>e.hp<=1e-7)){outcome='win';break;}
  if(elapsed<=1e-9)break;
 }
 if(group){b.hp=targets.reduce((n,e)=>n+e.hp,0);b.dps=targets.filter(e=>e.hp>1e-7).reduce((n,e)=>n+e.dps,0);}
 return {battle:b,hp,killed,outcome};
}

// Boss phases use active battle time; trainer resistance is never changed here.
const PHASES={attack:20,brace:5,stagger:10,recover:5};
export function bossBehavior(battle){
 const phase=Object.hasOwn(PHASES,battle.phase)?battle.phase:'attack';
 return {phase,remaining:Math.max(0,PHASES[phase]-(battle.phaseTime||0)),target:'50% FTP'};
}
export function advanceBossBattle(battle,playerHP,damagePerSecond,dt,{watts=0,cadence=0,ftp=280,maxHP=100}={}){
 let b={...battle},hp=playerHP,remaining=Math.max(0,Number(dt)||0),outcome=null;
 const target=Math.max(1,Number(ftp)||280)*.5;
 while(remaining>1e-9&&!outcome){
  const phase=bossBehavior(b).phase;
  b.phase=phase;b.phaseTime=Math.max(0,Math.min(PHASES[phase],Number(b.phaseTime)||0));
  const slice=Math.min(remaining,PHASES[phase]-b.phaseTime);
  const stopped=watts<10&&cadence<=0;
  // Recovery suspends (rather than resets) the summit escape countdown.
  const fleeLeft=b.kind==='summit'&&phase!=='recover'&&stopped?Math.max(0,15-(b.stopped||0)):Infinity;
  const elapsed=Math.min(slice,fleeLeft);
  if(phase!=='recover')b.stopped=stopped?(b.stopped||0)+elapsed:0;
  if(phase==='brace')b.bracedSeconds=(b.bracedSeconds||0)+(watts<=target?elapsed:0);
  if(phase==='recover'){
   if(watts<=target)hp=Math.min(maxHP,hp+5*elapsed);
  }else{
   const result=advanceBattle({...b,dps:phase==='stagger'||phase==='brace'?0:b.dps},hp,damagePerSecond*(phase==='stagger'?2:1),elapsed);
   hp=result.hp;b.hp=result.battle.hp;outcome=result.outcome;
  }
  b.phaseTime+=elapsed;remaining-=elapsed;
  if(!outcome&&fleeLeft<=elapsed+1e-9)outcome='flee';
  if(!outcome&&b.phaseTime>=PHASES[phase]-1e-9){
   b.phaseTime=0;
   if(phase==='attack'){b.phase='brace';b.bracedSeconds=0;}
   else if(phase==='brace'){
    const braced=(b.bracedSeconds||0)>=3;
    hp=Math.max(1,hp-b.dps*8*(braced?.25:1));
    if(hp<=1)outcome='loss';
    b.phase=braced?'stagger':'recover';
   }else b.phase=phase==='stagger'?'recover':'attack';
  }
  if(elapsed<=1e-9&&!outcome&&slice>1e-9)break;
 }
 return {battle:b,hp,killed:0,outcome};
}
