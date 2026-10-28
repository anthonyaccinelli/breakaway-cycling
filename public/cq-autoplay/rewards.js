export function battleRewards(battle){
 const count=battle.kind==='enemy'&&Array.isArray(battle.enemies)?Math.max(1,Math.min(3,battle.enemies.length)):1;
 return {count,xp:battle.kind==='enemy'?150*count:Math.max(0,Number(battle.reward)||0),hp:25*count,coins:25*count};
}
export function validPendingReward(value){
 return value&&[1,2,3].includes(value.count)&&value.hp===25*value.count&&value.coins===25*value.count&&Number.isFinite(value.xp)&&value.xp>=0;
}
export function sessionMetrics(state,live){
 const seconds=Number.isFinite(live.sessionSeconds)?live.sessionSeconds:state.session?state.rideSeconds-(state.session.startSeconds??state.rideSeconds):0;
 const miles=Number.isFinite(live.sessionDistanceM)?live.sessionDistanceM/1609.344:state.session?state.rideMiles-state.session.startMiles:0;
 return {seconds:Math.max(0,seconds),miles:Math.max(0,miles)};
}
