/** Fullscreen must be requested directly from a trusted button click. */
export function bindFullscreenButton(button:HTMLButtonElement,doc:Document=document,reportError:(message:string)=>void=()=>{}):()=>void {
 let pending=false;
 const available=typeof doc.documentElement.requestFullscreen==='function'&&doc.fullscreenEnabled!==false;
 const sync=()=>{
  const active=!!doc.fullscreenElement;
  button.textContent=active?'EXIT FULL SCREEN':'FULL SCREEN';
  button.setAttribute('aria-pressed',String(active));
  button.title=available?(active?'Return to your browser · Esc also exits':'Hide browser tabs and fill the display'):'Fullscreen is unavailable in this browser';
  button.disabled=pending||!available;
 };
 const toggle=async()=>{
  if(pending||!available)return;
  pending=true;sync();
  try {
   if(doc.fullscreenElement)await doc.exitFullscreen();
   else await doc.documentElement.requestFullscreen({navigationUI:'hide'});
  }catch {
   reportError('Could not enter or exit fullscreen. Try the Full Screen button again, or use your browser’s fullscreen command.');
  }finally {pending=false;sync();}
 };
 button.addEventListener('click',toggle);
 doc.addEventListener('fullscreenchange',sync);
 sync();
 return ()=>{button.removeEventListener('click',toggle);doc.removeEventListener('fullscreenchange',sync);};
}
