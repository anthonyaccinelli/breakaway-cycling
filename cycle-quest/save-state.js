import {validLedger} from '/api/cycle-quest?asset=workouts.js';
import {validPendingReward} from '/api/cycle-quest?asset=rewards.js';

export const MAX_XP=10000000;

const nonnegative=value=>Number.isFinite(value)&&value>=0;
const label=value=>typeof value==='string'&&value.length>0&&value.length<=160;
const optional=(value,check)=>value===undefined||check(value);

export function validRoute(route){
 if(!route)return true;
 if(typeof route!=='object')return false;
 const points=route.points;
 return typeof route.name==='string'&&route.name.length<=80&&nonnegative(route.distance)&&route.distance>0&&nonnegative(route.gain)&&typeof route.hasElevation==='boolean'
  &&Array.isArray(points)&&points.length>=2&&points.length<=1000&&points[0]?.d===0
  &&points.every((point,index)=>point&&nonnegative(point.d)&&Number.isFinite(point.e)&&(!index||point.d>points[index-1].d))
  &&points.at(-1).d===route.distance
  &&(route.endless!==true||(Number.isInteger(route.seed)&&['flat','rolling','mountain','punchy'].includes(route.terrain)&&nonnegative(route.windowStart??0)));
}

function validBattle(battle,active=false){
 if(!battle)return true;
 if(typeof battle!=='object'||!label(battle.name)||!nonnegative(battle.hp)||!nonnegative(battle.dps))return false;
 if(!active)return battle.hp>0;
 if(!optional(battle.level,n=>Number.isInteger(n)&&n>=1)||!optional(battle.targetWatts,n=>n===null||nonnegative(n)))return false;
 if(!['enemy','summit','boss'].includes(battle.kind)||!nonnegative(battle.reward)||!nonnegative(battle.max)||battle.max<=0||battle.hp>battle.max)return false;
 if(!battle.enemies)return true;
 return battle.kind==='enemy'&&Array.isArray(battle.enemies)&&battle.enemies.length>=1&&battle.enemies.length<=3
  &&battle.enemies.every(enemy=>enemy&&label(enemy.name)&&label(enemy.id)&&optional(enemy.level,n=>Number.isInteger(n)&&n>=1)&&nonnegative(enemy.hp)&&nonnegative(enemy.max)&&enemy.max>0&&enemy.hp<=enemy.max)
  &&Math.abs(battle.enemies.reduce((sum,enemy)=>sum+enemy.hp,0)-battle.hp)<1;
}

export function validCharacter(state){
 return !!state&&typeof state==='object'&&state.version===1
  &&nonnegative(state.xp)&&state.xp<=MAX_XP&&nonnegative(state.hp)
  &&nonnegative(state.miles)&&state.miles<=100&&Number.isInteger(state.chapter)&&state.chapter>=1
  &&['adventure','training'].includes(state.mode)&&nonnegative(state.rideSeconds)&&nonnegative(state.rideMiles)&&nonnegative(state.nextEncounter)
  &&typeof state.reward==='boolean'&&optional(state.coins,n=>Number.isSafeInteger(n)&&n>=0)
  &&(!state.pendingReward||(state.reward&&validPendingReward(state.pendingReward)))
  &&optional(state.routeMiles,nonnegative)&&validRoute(state.route)&&validLedger(state.workouts)
  &&validBattle(state.boss)&&validBattle(state.battle,true)
  &&(!state.session||(typeof state.session.id==='string'&&['startXP','startLevel','startAttack','startMiles','monsters','bosses'].every(key=>nonnegative(state.session[key]))&&optional(state.session.startSeconds,nonnegative)&&optional(state.session.startCoins,nonnegative)))
  &&!(state.battle&&state.reward)
  &&optional(state.battleCapPct,n=>Number.isFinite(n)&&n>=55&&n<=150);
}

// Older versions saved a slightly negative countdown on the frame an encounter
// started or was blocked. Repair that known case without accepting unrelated invalid fields.
export function readCharacter(text){
 const state=JSON.parse(text);
 if(state&&Number.isFinite(state.xp)&&state.xp>MAX_XP)state.xp=MAX_XP;
 if(state&&Number.isFinite(state.nextEncounter)&&state.nextEncounter<0)state.nextEncounter=0;
 if(!validCharacter(state))throw Error('Invalid Cycle Quest save');
 return state;
}
