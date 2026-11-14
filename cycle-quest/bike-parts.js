export const slots=['Frame','Saddle','Chainring','Cassette'];
const maxTier=50;
export function validBike(bike){
 return bike && Array.isArray(bike.tiers) && bike.tiers.length===slots.length
  && bike.tiers.every(n=>Number.isInteger(n)&&n>=0&&n<=maxTier)
  && Number.isSafeInteger(bike.shopStop)&&bike.shopStop>=0;
}
export function bikeFor(rider){
 return rider.bike??={tiers:[0,0,0,0],shopStop:Math.floor(rider.rideMiles/20)};
}
export function multiplier(bike,slot){
 return 1+.08*((bike?.tiers[slot]??0)+(bike?.tiers[slot+1]??0));
}
export function visitShop(rider){
 const bike=bikeFor(rider),stop=Math.floor(rider.rideMiles/20);
 if(stop<=bike.shopStop)return '';
 bike.shopStop=stop;
 const purchases=[];
 while(true){
  const options=bike.tiers.map((n,i)=>({i,tier:n+1,price:100*(n+1)**2}))
   .filter(p=>p.tier<=maxTier&&p.price<=rider.coins)
   .sort((a,b)=>b.tier-a.tier||a.i-b.i);
  if(!options.length)break;
  const {i,tier,price}=options[0];
  bike.tiers[i]=tier;rider.coins-=price;purchases.push(slots[i]+' '+tier);
 }
 return purchases.length?'Shop fitted '+purchases.join(', '):'Shop visited · coins saved.';
}
export function roadsideReward(rider,random=Math.random){
 const roll=random();
 if(roll>=.16)return {repair:false,text:''};
 const repair=roll<.10;
 let text=repair?'Mechanic restored full HP.':'';
 if(!repair||random()<.20){
  const bike=bikeFor(rider),i=Math.floor(random()*slots.length);
  if(bike.tiers[i]<maxTier){
   bike.tiers[i]++;
   text+=(text?' ':'')+'Rare '+slots[i]+' '+bike.tiers[i]+' equipped.';
  }
 }
 return {repair,text};
}
