/** Shared Spokemon input choice. Only this game reads the preference. */
export type SpokemonInputChoice='auto'|'power'|'cadence';
export type SpokemonInputMode='power'|'cadence'|'none';
const KEY='spokemon-input-choice-v1';
export function getSpokemonInputChoice():SpokemonInputChoice{
 try{
  const value=localStorage.getItem(KEY);
  return value==='power'||value==='cadence'?value:'auto';
 }catch{return 'auto';}
}
export function setSpokemonInputChoice(value:SpokemonInputChoice):void{
 try{localStorage.setItem(KEY,value);}catch{}
 window.dispatchEvent(new CustomEvent('spokemon:input-choice',{detail:{choice:value}}));
}
export function resolveSpokemonInput(
 choice:SpokemonInputChoice,hasPower:boolean,hasCadence:boolean,demo=false
):SpokemonInputMode{
 if(demo)return choice==='power'?'power':'cadence';
 if(choice==='power')return hasPower?'power':'none';
 if(choice==='cadence')return hasCadence?'cadence':'none';
 return hasPower?'power':hasCadence?'cadence':'none';
}
