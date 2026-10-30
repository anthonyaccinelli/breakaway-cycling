import {createClient, type SupabaseClient} from '@supabase/supabase-js';

// A seed identifies a persisted, immutable Classic route recipe rather than just
// the terrain RNG. The same public code resolves distance, gain, terrain and pace.
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
export const randomClassicSeed=(random:()=>number=Math.random)=>Math.floor(random()*1_000_000_000)+1;
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY) as string|undefined;
let cloud:SupabaseClient|null=null;
function client():SupabaseClient {
 if(!url||!key)throw Error('Route sharing is not configured for this deployment.');
 return cloud??(cloud=createClient(url,key));
}
export async function findClassicRoute(seed:number):Promise<ClassicRouteRecipe|null>{
 const {data,error}=await client().from('classic_route_seeds')
  .select('seed,miles,gain_target_ft,terrain,difficulty,generator_version')
  .eq('seed',seed).maybeSingle();
 if(error)throw Error('Unable to look up route seed: '+error.message);
 if(!data)return null;
 const recipe=validatedClassicRecipe(data);
 if(!recipe)throw Error('Saved route has unsupported settings.');
 return recipe;
}
export async function registerClassicRoute(recipe:ClassicRouteRecipe):Promise<'saved'|'collision'>{
 const validated=validatedClassicRecipe(recipe);
 if(!validated)throw Error('Invalid route settings; seed was not saved.');
 const {error}=await client().from('classic_route_seeds').insert(validated);
 if(error?.code==='23505')return 'collision'; // no overwrites; assign a new code
 if(error)throw Error('Unable to save shareable route seed: '+error.message);
 return 'saved';
}
