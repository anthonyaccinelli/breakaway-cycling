import {MONSTERS} from '/api/cycle-quest?asset=monsters.js';
export {MONSTERS};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const attackAt=level=>1.08**(level-1);
export const hpAt=level=>100+10*(level-1);
// Curated regular encounters for the chapters designed so far. Bosses and
// summit battles retain their independent selection and saved boss identity.
export const CHAPTER_BIOMES=Object.freeze({
 1:{name:'THE VERDANT WILDS',biome:'forest',monsters:['giant-rat','stirge','kobold','goblin','wolf','giant-fire-beetle','giant-spider','worg']},
 2:{name:'THE HAUNTED MOOR',biome:'moor',monsters:['skeleton','zombie','ghoul','shadow','specter','death-dog','gnoll','harpy']}
});
// Dedicated summit lineup: one original boss and eleven fixed random roster picks.
export const SUMMIT_BOSSES=Object.freeze(['lifted-dually','oni','silver-dragon-wyrmling','kraken','ancient-green-dragon','young-bronze-dragon','doppelganger','behir','remorhaz','roc','storm-giant','wyvern']);
export const SUMMIT_VARIANTS=Object.freeze([{suffix:'',minLevel:1,scale:1},{suffix:' EXTREME',minLevel:10,scale:1.2},{suffix:' PSYCHO',minLevel:20,scale:1.4}]);
export function selectSummit(level,random=Math.random){
 const pick=list=>list[Math.min(list.length-1,Math.max(0,Math.floor(random()*list.length)))];
 const id=pick(SUMMIT_BOSSES),variant=pick(SUMMIT_VARIANTS.filter(v=>level>=v.minLevel));
 const monster=id==='lifted-dually'?null:MONSTERS.find(m=>m.id===id);
 return {id,name:(monster?.name||'Lifted Dually').toUpperCase()+variant.suffix,variant,monster};
}
export function nextChapterEncounter(chapter,previousState,random=Math.random){
 const config=CHAPTER_BIOMES[chapter];if(!config)return null;
 const valid=new Set(config.monsters),state=previousState?.chapter===chapter?previousState:null;
 let bag=Array.isArray(state?.bag)?state.bag.filter((id,i,a)=>valid.has(id)&&a.indexOf(id)===i):[];
 const last=valid.has(state?.last)?state.last:null;
 if(!bag.length){bag=[...config.monsters];for(let i=bag.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag[0]===last)[bag[0],bag[1]]=[bag[1],bag[0]];}
 const monsterId=bag.shift();return {monsterId,state:{chapter,bag,last:monsterId}};
}

// CR establishes progression. HP and attack distinguish creatures within a tier.
// Source damage is a strongest basic attack average, not a claim of tabletop DPR.
export function monsterPool(target,kind='enemy'){
 const highest=Math.max(...MONSTERS.map(m=>m.level));
 let pool=MONSTERS.filter(m=>target>highest?m.level>=highest-20:m.level>=Math.max(1,target-4)&&m.level<=target+1);
 if(!pool.length){const nearest=Math.min(...MONSTERS.map(m=>Math.abs(m.level-target)));pool=MONSTERS.filter(m=>Math.abs(m.level-target)===nearest);}
 if(kind==='summit'){const summit=pool.filter(m=>['dragon','giant','elemental','monstrosity'].includes(m.type));if(summit.length)pool=summit;}
 return pool;
}
export function selectMonster(target,kind='enemy',random=Math.random){
 const pool=monsterPool(target,kind);
 return pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))];
}
export function creatureFactors(monster){
 const peers=MONSTERS.filter(m=>m.cr===monster.cr);
 const mean=key=>peers.reduce((n,m)=>n+m[key],0)/peers.length;
 return {health:clamp(1+.16*Math.log2(monster.hp/mean('hp')),.82,1.18),attack:clamp(1+.12*Math.log2((monster.damage+Math.max(0,monster.attack))/(mean('damage')+Math.max(0,mean('attack')))),.8,1.2)};
}
export function makeBattle(kind,{level,ftp,entryPower=null,chapterLevel=level,random=Math.random,monsterId=null,ceilingPercent=100}){
 const reference=kind==='boss'?chapterLevel:level;
 const target=kind==='enemy'?Math.max(1,level-2):kind==='summit'?level+5:chapterLevel;
 const summit=kind==='summit'?selectSummit(level,random):null;
 const monster=summit?summit.monster:((kind==='enemy'&&monsterId?MONSTERS.find(m=>m.id===monsterId):null)||selectMonster(target,kind,random)),f=monster?creatureFactors(monster):{health:1,attack:1};
 const watts=Number.isFinite(ftp)&&ftp>0?ftp:280;
 // Regular enemies each have 60 seconds of damage at the chosen target.
 const ceiling=watts*clamp(Number.isFinite(ceilingPercent)?ceilingPercent:100,55,150)/100;
 const targetWatts=clamp(Number.isFinite(entryPower)?entryPower*1.25:watts*.55,watts*.55,ceiling);
 const hp=kind==='enemy'?targetWatts*60*attackAt(reference):kind==='summit'?watts*1.25*60*f.health*attackAt(reference)*summit.variant.scale:watts*.75*240*f.health*attackAt(reference);
 const dps=kind==='enemy'?.25:kind==='summit'?.8*hpAt(reference)/120*f.attack*summit.variant.scale:.8*hpAt(reference)/240*f.attack;
 return {kind,name:summit?summit.name:(target>92&&!monsterId?'ASCENDED ':'')+monster.name.toUpperCase(),monsterId:summit?summit.id:monster.id,summitVariant:summit?summit.variant.suffix.trim()||'BASE':null,level:reference,sourceCR:monster?.cr??null,sourceHP:monster?.hp??null,sourceAttack:monster?.attack??null,hp:Math.round(hp),max:Math.round(hp),dps,targetWatts:kind==='enemy'?targetWatts:null,reward:kind==='enemy'?150:kind==='summit'?600:600};
}
export function chapterRandom(chapter){let n=Math.imul(chapter,0x9e3779b1);n=Math.imul(n^(n>>>16),0x7feb352d);return ((n^(n>>>16))>>>0)/4294967296;}

// Resolve damage through the group in order. A simultaneous kill and 1 HP is a loss.
export function advanceBattle(battle,playerHP,damagePerSecond,dt){
 const b={...battle};const enemies=Array.isArray(battle.enemies)?battle.enemies.map(e=>({...e})):null;
 const incoming=Math.max(0,Number(b.dps)||0),outgoing=Math.max(0,Number(damagePerSecond)||0),health=Math.max(1,playerHP);
 const death=incoming>0?(health-1)/incoming:Infinity,kill=outgoing>0?Math.max(0,b.hp)/outgoing:Infinity;
 const elapsed=Math.min(Math.max(0,dt),death,kill),damage=outgoing*elapsed;let remaining=damage,killed=0;
 if(enemies){for(const e of enemies){if(remaining<=0)break;const before=e.hp;const dealt=Math.min(Math.max(0,before),remaining);e.hp=Math.max(0,before-dealt);remaining-=dealt;if(before>0&&e.hp<=1e-7)killed++;}b.enemies=enemies;b.hp=enemies.reduce((sum,e)=>sum+e.hp,0);}else b.hp=Math.max(0,b.hp-damage);
 const hp=Math.max(1,health-incoming*elapsed);const lost=death<=elapsed+1e-9,won=!lost&&b.hp<=1e-7;
 return {battle:b,hp,killed,outcome:lost?'loss':won?'win':null};
}
