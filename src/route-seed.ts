// Auto-filled seeds describe the last preview; explicitly entered seeds reproduce it.
export function createRouteSeedSelector(random:()=>number=Math.random){
 let previous:number|null=null;
 return (text:string,explicit=false)=>{
  const parsed=Number(text);
  let seed=text.trim()!==''&&Number.isFinite(parsed)&&(explicit||parsed!==previous)?parsed:Math.floor(random()*1_000_000_000)+1;
  if(!explicit&&seed===previous)seed=(seed%1_000_000_000)+1;
  previous=seed;
  return seed;
 };
}
