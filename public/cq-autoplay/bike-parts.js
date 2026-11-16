export const slots=['Frame','Seat','Pedals','Wheels'];
export const catalog=[
 ['Steel Frame','Trail Frame','Road Frame'],
 ['Touring Seat','Endurance Seat','Race Seat'],
 ['Standard Pedals','Trail Pedals','Race Pedals'],
 ['Standard Wheels','Trail Wheels','Road Wheels']
].flatMap((names,slot)=>names.map((name,variant)=>({id:slot*3+variant,name,slot})));
export const grades=['Stock','Bronze','Silver','Gold','Platinum'];
const prices=[800,550,700,650];
export const unlockedGrade=rider=>Math.min(4,Math.max(1,rider.chapter));
export function riderLevel(rider){let xp=rider.xp||0,level=1;while(xp>=Math.min(10800,600+300*(level-1))){xp-=Math.min(10800,600+300*(level-1));level++;}return level;}
const validTier=n=>Number.isInteger(n)&&n>=0&&n<=50;
export function validBike(bike){
 if(!bike||!Array.isArray(bike.tiers)||bike.tiers.length!==4||!bike.tiers.every(validTier))return false;
 if(bike.roadsideRemaining!==undefined&&(!Number.isFinite(bike.roadsideRemaining)||bike.roadsideRemaining<0||bike.roadsideRemaining>8))return false;
 if(!Number.isSafeInteger(bike.shopStop)||bike.shopStop<0)return false;
 if(bike.owned===undefined&&bike.equipped===undefined)return true;
 if(!Array.isArray(bike.owned)||bike.owned.length!==12||!bike.owned.every(n=>n===null||validTier(n)))return false;
 if(bike.grades!==undefined&&(!Array.isArray(bike.grades)||bike.grades.length!==12||!bike.grades.every(n=>Number.isInteger(n)&&n>=0&&n<=4)))return false;
 return Array.isArray(bike.equipped)&&bike.equipped.length===4&&bike.equipped.every((id,slot)=>
  Number.isInteger(id)&&catalog[id]?.slot===slot&&bike.owned[id]!==null&&bike.tiers[slot]===bike.owned[id]);
}
export function bikeFor(rider){
 const bike=rider.bike??={tiers:[0,0,0,0],shopStop:0};
 if(!bike.owned){
  bike.owned=catalog.map(part=>part.id%3===0?bike.tiers[part.slot]:null);
  bike.equipped=slots.map((_,i)=>i*3);
 }
 bike.grades??=Array(12).fill(0);
 return bike;
}
export function partBonus(bike,id){
 return 24*(bike.grades?.[id]||0)+8*(bike.owned[id]||0);
}
export function multiplier(bike,slot){
 if(!bike?.owned)return 1+.08*((bike?.tiers[slot]??0)+(bike?.tiers[slot+1]??0));
 return 1+(partBonus(bike,bike.equipped[slot])+partBonus(bike,bike.equipped[slot+1]))/100;
}
export function partPrice(bike,id,action='upgrade',grade=1){
 if(action==='buy')return prices[catalog[id].slot]*grade;
 if(action==='promote')return prices[catalog[id].slot]*(grade-bike.grades[id]);
 return 150*((bike.owned[id]??0)+1)**2;
}
export function changePart(rider,id,action,grade=1){
 const part=catalog[id];
 if(!part||!['buy','upgrade','equip','promote'].includes(action))return false;
 const bike=bikeFor(rider),owned=bike.owned[id];
 if(action==='equip'){
  if(owned===null)return false;
  bike.equipped[part.slot]=id;bike.tiers[part.slot]=owned;
  return true;
 }
 if(!Number.isInteger(grade)||grade<1||grade>unlockedGrade(rider))return false;
 if(action==='buy'&&owned!==null)return false;
 if(action==='upgrade'&&(owned===null||owned>=Math.min(50,riderLevel(rider))))return false;
 if(action==='promote'&&(owned===null||grade<=bike.grades[id]))return false;
 const price=partPrice(bike,id,action,grade);
 if(rider.coins<price)return false;
 rider.coins-=price;
 if(action==='buy'){bike.owned[id]=0;bike.grades[id]=grade;}
 if(action==='promote')bike.grades[id]=grade;
 if(action==='upgrade')bike.owned[id]++;
 if(bike.equipped[part.slot]===id)bike.tiers[part.slot]=bike.owned[id];
 return true;
}
export function exploreRoadside(rider,miles,random=Math.random){
 if(!Number.isFinite(miles)||miles<=0)return null;
 const bike=bikeFor(rider);
 bike.roadsideRemaining??=4+4*random();
 bike.roadsideRemaining=Math.max(0,bike.roadsideRemaining-miles);
 if(bike.roadsideRemaining>0)return null;
 bike.roadsideRemaining=4+4*random();
 const repair=random()<.5;
 let text=repair?'Mechanic · full HP':'';
 if(!repair||random()<.2){
  const available=catalog.filter(p=>bike.owned[p.id]===null);
  if(available.length){
   const part=available[Math.floor(random()*available.length)];
   bike.owned[part.id]=0;bike.grades[part.id]=0;
   text+=(repair?' + ':'Found ')+part.name+' · stored';
  }else{
   rider.coins+=50;
   text+=(repair?' + ':'Salvaged parts · ')+'50 coins';
  }
 }
 return {repair,text};
}
