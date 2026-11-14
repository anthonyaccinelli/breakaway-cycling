export const slots=['Frame','Saddle','Chainring','Cassette'];
const maxTier=50;
export function validBike(bike){
 return bike && Array.isArray(bike.tiers) && bike.tiers.length===slots.length
  && bike.tiers.every(n=>Number.isInteger(n)&&n>=0&&n<=maxTier)
  && (bike.roadsideRemaining===undefined || (Number.isFinite(bike.roadsideRemaining)&&bike.roadsideRemaining>=0&&bike.roadsideRemaining<=8))
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
// Sample the next find in active exploration miles so telemetry frequency has no effect.
export function exploreRoadside(rider,miles,random=Math.random){
 if(!Number.isFinite(miles)||miles<=0)return null;
 const bike=bikeFor(rider);
 bike.roadsideRemaining??=4+4*random();
 bike.roadsideRemaining=Math.max(0,bike.roadsideRemaining-miles);
 if(bike.roadsideRemaining>0)return null;
 bike.roadsideRemaining=4+4*random();
 const repair=random()<.5;
 const eligible=slots.map((_,i)=>i).filter(i=>bike.tiers[i]<maxTier);
 const upgrade=eligible.length>0&&(!repair||random()<.2);
 let text=repair?'Mechanic · full HP':'';
 if(upgrade){
  const i=eligible[Math.floor(random()*eligible.length)];
  bike.tiers[i]++;
  text+=(repair?' + ':'Found ')+slots[i]+' T'+bike.tiers[i];
 }else if(!repair){
  text='Found a part · equipped bike is stronger';
 }
 return {repair,text};
}
