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
