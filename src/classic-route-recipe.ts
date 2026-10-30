export type ClassicTerrain='flat'|'rolling'|'mountain'|'punchy';
export type ClassicRouteRecipe={
 seed:number; miles:number; gain_target_ft:number|null;
 terrain:ClassicTerrain; difficulty:0.55|1|1.35; generator_version:1;
};
const TERRAIN:ClassicTerrain[]=['flat','rolling','mountain','punchy'];
const DIFFICULTY=[0.55,1,1.35] as const;
export const isClassicSeed=(value:string)=>/^[0-9]{1,10}$/.test(value.trim())&&Number(value)>0&&Number(value)<=1_000_000_000;
export function validatedClassicRecipe(value:unknown):ClassicRouteRecipe|null {
 if(!value||typeof value!=='object')return null;
 const r=value as Record<string,unknown>;
 const seed=Number(r.seed),miles=Number(r.miles),gain=r.gain_target_ft===null?null:Number(r.gain_target_ft);
 const terrain=r.terrain,difficulty=Number(r.difficulty),generator_version=Number(r.generator_version);
 if(!Number.isSafeInteger(seed)||seed<1||seed>1_000_000_000)return null;
 if(!Number.isFinite(miles)||miles<=0||miles>1000)return null;
 if(gain!==null&&(!Number.isFinite(gain)||gain<0||gain>200000))return null;
 if(!TERRAIN.includes(terrain as ClassicTerrain)||!DIFFICULTY.includes(difficulty as any)||generator_version!==1)return null;
 return {seed,miles,gain_target_ft:gain,terrain:terrain as ClassicTerrain,difficulty:difficulty as ClassicRouteRecipe['difficulty'],generator_version:1};
}
export const randomClassicSeed=(random:()=>number=Math.random)=>Math.floor(random()*900_000_001)+100_000_000;

/**
 * Numeric seeds from before the shared registry did not encode their settings.
 * Give any valid unregistered seed its own stable, versioned canonical route
 * without consulting the current form; do not claim it is the historical route.
 */
export function deriveUnregisteredClassicRoute(seed:number):ClassicRouteRecipe {
 if(!Number.isSafeInteger(seed)||seed<1||seed>1_000_000_000)throw Error('Invalid route seed.');
 const mix=(salt:number)=>{
  let n=(seed ^ Math.imul(salt,0x9e3779b1))|0;
  n=Math.imul(n^(n>>>16),0x7feb352d);
  n=Math.imul(n^(n>>>15),0x846ca68b);
  return (n^(n>>>16))>>>0;
 };
 const miles=Number((5+(mix(11)%1901)/20).toFixed(2)); // 5–100 mi
 const terrain=TERRAIN[mix(13)%TERRAIN.length];
 const difficulty=DIFFICULTY[mix(17)%DIFFICULTY.length];
 return {seed,miles,gain_target_ft:null,terrain,difficulty,generator_version:1};
}

export const CLASSIC_BUILTIN_ROUTES:Readonly<Record<number,ClassicRouteRecipe>>={
 3001:{seed:3001,miles:10,gain_target_ft:null,terrain:'flat',difficulty:0.55,generator_version:1},
 4502:{seed:4502,miles:15,gain_target_ft:null,terrain:'rolling',difficulty:1,generator_version:1},
 6003:{seed:6003,miles:18,gain_target_ft:1800,terrain:'mountain',difficulty:1.35,generator_version:1},
 937093007:{seed:937093007,miles:16.7,gain_target_ft:null,terrain:'rolling',difficulty:0.55,generator_version:1}
};
