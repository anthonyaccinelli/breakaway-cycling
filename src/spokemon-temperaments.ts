/** Encounter temperament is an INDIVIDUAL creature attribute, not a species lock.
 * Most temperaments reward sustainable Zone 2 riding. Chaotic is optional,
 * ultra-rare (~1-2 appearances per 50 mi at the current encounter spacing).
 */
export type Temperament='shy'|'calm'|'energetic'|'playful'|'stubborn'|'unpredictable'|'chaotic';
const weights:[Temperament,number][]=[
 ['shy',20],['calm',25],['energetic',16],['playful',16],
 ['stubborn',12],['unpredictable',9],['chaotic',1.8]
];
export function chooseTemperament(random=Math.random):Temperament{
 const total=weights.reduce((a,[,w])=>a+w,0);
 let n=Math.min(1-Number.EPSILON,Math.max(0,random()))*total;
 for(const [name,w] of weights){n-=w;if(n<0)return name;}
 return 'calm';
}
export const descriptions:Record<Temperament,string>={
 shy:'Gentle and steady power earns trust.',
 calm:'Settle into a comfortable Zone 2 rhythm.',
 energetic:'Slightly stronger sustainable efforts help.',
 playful:'Alternate two comfortable riding intensities.',
 stubborn:'Be patient; this one warms up slowly.',
 unpredictable:'Its preferred effort changes every 15 seconds.',
 chaotic:'RARE: hold at least 90% FTP for 10 seconds.'
};
export function preferredEffort(t:Temperament,seconds:number):string{
 const phase=Math.floor(seconds/(t==='playful'?20:15));
 if(t==='playful')return phase%2?'upper Zone 2':'lower Zone 2';
 if(t==='unpredictable')return ['gentle','upper Zone 2','steady'][phase%3];
 return descriptions[t];
}
export function trustRate(t:Temperament,watts:number,ftp:number,seconds:number):number{
 const f=Math.max(50,ftp),ratio=watts/f;
 if(t==='chaotic')return 0;
 const target=t==='unpredictable'?(['shy','energetic','calm'] as const)[Math.floor(seconds/15)%3]:t;
 let factor=1;
 if(target==='shy')factor=ratio>=0.45&&ratio<=0.72?1.35:0.65;
 else if(target==='calm')factor=ratio>=0.52&&ratio<=0.8?1.4:0.75;
 else if(target==='energetic')factor=ratio>=0.68&&ratio<=0.92?1.4:0.75;
 else if(target==='playful'){
  const upper=Math.floor(seconds/20)%2===1;
  factor=upper?(ratio>=0.69&&ratio<=0.88?1.5:0.8):(ratio>=0.48&&ratio<=0.7?1.5:0.8);
 }else if(target==='stubborn')factor=0.65;
 return 3.5*factor;
}
export function chanceAtFullTrust(t:Temperament):number{
 if(t==='chaotic')return 0.7;
 if(t==='stubborn')return 0.8;
 if(t==='shy')return 0.83;
 return 0.85;
}
