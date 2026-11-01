/** Pedalkin – Biome 01 encounter catalogue.
 * Working species names from docs/spokemon-names.md.
 * Rarity affects *selection weight*, not effort required to capture.
 * Artwork is provisional until each species has approved 460x370 art.
 */
export type SpokemonRarity='common'|'uncommon'|'rare'|'extremely rare';
export type SpokemonSpecies={
 id:string;name:string;rarity:SpokemonRarity;weight:number;
 kind:'pinecone'|'deer'|'squirrel'|'rabbit'|'mushroom'|'owl'|'bear'|'moth'|'rock'|'fox'|'fungus'|'guardian';
 accent:string;dark:string;personality:'shy'|'curious'|'stubborn'|'gentle'|'playful';
};
export const PINE_FOREST_SPOKEMON:readonly SpokemonSpecies[]=[
 {id:'pipcone',name:'Pipcone',rarity:'common',weight:14,kind:'pinecone',accent:'#b9874e',dark:'#67492f',personality:'curious'},
 {id:'mossprout',name:'Mossprout',rarity:'common',weight:14,kind:'deer',accent:'#96bf74',dark:'#55744a',personality:'shy'},
 {id:'scampernut',name:'Scampernut',rarity:'common',weight:14,kind:'squirrel',accent:'#e3a261',dark:'#8d593e',personality:'playful'},
 {id:'fernbit',name:'Fernbit',rarity:'common',weight:14,kind:'rabbit',accent:'#a4d096',dark:'#5b9277',personality:'shy'},
 {id:'toadstoolie',name:'Toadstoolie',rarity:'common',weight:14,kind:'mushroom',accent:'#eab4a4',dark:'#b96961',personality:'gentle'},
 {id:'hootwig',name:'Hootwig',rarity:'uncommon',weight:8,kind:'owl',accent:'#c4a27a',dark:'#816746',personality:'curious'},
 {id:'bumblebark',name:'Bumblebark',rarity:'uncommon',weight:8,kind:'bear',accent:'#b28b62',dark:'#765a43',personality:'gentle'},
 {id:'glimmoth',name:'Glimmoth',rarity:'uncommon',weight:8,kind:'moth',accent:'#c4c9e9',dark:'#717ba3',personality:'shy'},
 {id:'pebblit',name:'Pebblit',rarity:'uncommon',weight:8,kind:'rock',accent:'#9eac91',dark:'#69776c',personality:'stubborn'},
 {id:'foxfire',name:'Foxfire',rarity:'rare',weight:3,kind:'fox',accent:'#e9a466',dark:'#b05d41',personality:'playful'},
 {id:'shroomble',name:'Shroomble',rarity:'rare',weight:3,kind:'fungus',accent:'#a997d6',dark:'#73629f',personality:'shy'},
 {id:'elderoot',name:'Elderoot',rarity:'extremely rare',weight:0.6,kind:'guardian',accent:'#adbe83',dark:'#6e8b59',personality:'stubborn'},
];
export function choosePineForestSpokemon(random= Math.random):SpokemonSpecies{
 const weight=PINE_FOREST_SPOKEMON.reduce((sum,creature)=>sum+creature.weight,0);
 let draw=Math.max(0,Math.min(1-Number.EPSILON,random()))*weight;
 for(const creature of PINE_FOREST_SPOKEMON){draw-=creature.weight;if(draw<0)return creature;}
 return PINE_FOREST_SPOKEMON[0];
}
export function nextPreviewSpokemon(index:number):SpokemonSpecies{
 // A curated showcase order (all 12 are reachable on repeated encounters).
 // Normal encounters use the weighted random picker above.
 const order=['mossprout','pipcone','fernbit','hootwig','scampernut','glimmoth',
  'toadstoolie','bumblebark','pebblit','foxfire','shroomble','elderoot'];
 const id=order[((index%order.length)+order.length)%order.length];
 return PINE_FOREST_SPOKEMON.find(c=>c.id===id)!;
}
