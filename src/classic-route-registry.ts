import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {validatedClassicRecipe,type ClassicRouteRecipe} from './classic-route-recipe';
export {randomClassicSeed,isClassicSeed,validatedClassicRecipe} from './classic-route-recipe';
export type {ClassicRouteRecipe,ClassicTerrain} from './classic-route-recipe';

// Read-only seed lookups work for everyone. Registry writes are immutable,
// public recipe settings only, and restricted by Supabase row-level policies.
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
