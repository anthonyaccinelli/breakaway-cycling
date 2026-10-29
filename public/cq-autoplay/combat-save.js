import {COMBAT_VERSION,MONSTERS,makeBattle,enemyGroup,chapterLevels} from './combat.js';
const canonical=id=>id==='giant-rat'?'rat':id;
const ids=new Set(MONSTERS.map(m=>m.id));
const contentLevel=(level,chapter)=>Math.max(chapterLevels(chapter).min,Math.min(chapterLevels(chapter,100).max,Math.floor(level)||chapterLevels(chapter).min));
const fraction=b=>b.max>0?Math.max(0,Math.min(1,b.hp/b.max)):1;
// The only compatibility boundary. No retired balancing formula is kept.
export function migrateCombatSave(state){
 delete state.battleCapPct;
 if(state.chapterEncounter){if(Array.isArray(state.chapterEncounter.bag))state.chapterEncounter.bag=[...new Set(state.chapterEncounter.bag.map(canonical))];state.chapterEncounter.last=canonical(state.chapterEncounter.last);}
 for(const key of ['battle','boss']){
  const old=state[key];if(!old||old.combatVersion===COMBAT_VERSION)continue;
  const kind=key==='boss'?'boss':old.kind,identity=canonical(old.monsterId);let fresh;
  if(kind==='enemy'){
   const entries=old.enemies||[{id:identity,name:old.name,hp:old.hp,max:old.max,level:old.level}];
   fresh=enemyGroup(entries.map(e=>{
    const id=canonical(e.id)||MONSTERS.find(m=>m.name.toUpperCase()===e.name?.toUpperCase())?.id;
    const next=makeBattle('enemy',{chapter:state.chapter,monsterId:ids.has(id)?id:'rat',level:contentLevel(e.level||old.level,state.chapter)});next.hp=next.max*fraction(e);return next;
   }));
  }else{
   fresh=makeBattle(kind,{chapter:state.chapter,monsterId:identity,variant:old.summitVariant});
   if(key==='battle')fresh.hp=fresh.max*fraction(old);
   if(old.category)fresh.category=old.category;
  }
  state[key]=fresh;
 }
 return state;
}
