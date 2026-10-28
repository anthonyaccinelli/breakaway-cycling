// Both finite routes and Endless use the same category balance.
export const SUMMIT_CATEGORIES=Object.freeze({
 'CAT 4':{health:1,xp:600},
 'CAT 3':{health:1.15,xp:800},
 'CAT 2':{health:1.3,xp:1000},
 'CAT 1':{health:1.5,xp:1400},
 HC:{health:1.75,xp:2000}
});
export function scaleSummit(battle,category){
 const rules=SUMMIT_CATEGORIES[category]||SUMMIT_CATEGORIES['CAT 4'];
 const hp=Math.round(battle.hp*rules.health);
 return {...battle,hp,max:hp,reward:rules.xp,category};
}
