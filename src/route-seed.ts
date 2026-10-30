// Auto-filled seeds describe the last preview; locked seeds recreate that route.
export function createRouteSeedSelector(random:()=>number=Math.random){
 let previous:number|null=null;
 return (text:string,locked=false,userEntered=false)=>{
  const parsed=Number(text);
  // Pasted or typed values win on the next Generate click, even when Lock is off.
  // Otherwise a displayed auto-generated seed is replaced with fresh terrain.
  let seed=text.trim()!==''&&Number.isFinite(parsed)&&(locked||userEntered||parsed!==previous)?parsed:Math.floor(random()*1_000_000_000)+1;
  if(!locked&&!userEntered&&seed===previous)seed=(seed%1_000_000_000)+1;
  previous=seed;
  return seed;
 };
}

// The calculated gain displayed after a natural-terrain preview is informational,
// not a new target. Keep user-entered targets unchanged across generation.
export function readRouteGainTarget(displayedGain:string,isCalculatedGain:boolean){
 return isCalculatedGain?'':displayedGain.trim();
}
