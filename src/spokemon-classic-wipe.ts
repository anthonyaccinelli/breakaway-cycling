/**
 * Classic 16-band Game Boy encounter transition.
 * Covers only the central play field, not the metric HUD.
 * The Illustrator Explore and Encounter SVGs remain untouched.
 */
import './spokemon-classic-wipe.css';

export function createSpokemonClassicWipe(options:{
 stage:HTMLElement;
 onDone:()=>void;
}){
 const overlay=document.createElement('div');
 overlay.className='pk-classic-wipe';
 overlay.setAttribute('aria-hidden','true');
 overlay.hidden=true;
 const bars:HTMLSpanElement[]=[];
 for(let i=0;i<16;i++){
  const bar=document.createElement('span');
  bar.className='pk-classic-wipe-bar';
  bar.style.top=(i*100/16)+'%';
  bar.style.height=(100/16+.1)+'%';
  bar.style.transformOrigin=i%2===0?'left center':'right center';
  bar.style.backgroundColor=i%4===0?'#f6d58c':i%4===1?'#14353b':i%4===2?'#2b654f':'#0f292f';
  overlay.append(bar);
  bars.push(bar);
 }
 options.stage.append(overlay);
 let running=false;
 let swapped=false;
 let frame=0;
 let start=0;
 let opening=false;
 let swapStarted=false;
 const duration=360;
 const ease=(v:number)=>v*v*(3-2*v);
 const coverage=(progress:number)=>{
  for(let i=0;i<bars.length;i++){
   const stagger=(i%4)*.055;
   const value=Math.max(0,Math.min(1,(progress-stagger)/(1-stagger)));
   bars[i].style.transform='scaleX('+ease(value).toFixed(4)+')';
  }
 };
 const complete=()=>{
  if(frame)cancelAnimationFrame(frame);
  frame=0;running=false;swapped=false;opening=false;swapStarted=false;
  overlay.hidden=true;
  coverage(0);
  options.onDone();
 };
 function transition(swap:()=>Promise<void>|void){
  if(running)return false;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   Promise.resolve().then(swap).catch(e=>console.error('Spokemon scene swap failed',e)).finally(options.onDone);
   return true;
  }
  running=true;swapped=false;opening=false;swapStarted=false;
  overlay.hidden=false;
  coverage(0);
  start=performance.now();
  const tick=(now:number)=>{
   if(!running)return;
   const progress=Math.min(1,(now-start)/duration);
   coverage(opening?1-progress:progress);
   if(progress<1){
    frame=requestAnimationFrame(tick);
    return;
   }
   if(!opening){
    coverage(1);
    if(swapStarted)return;
    swapStarted=true;
    swapped=true;
    // Never uncover the raw 48% sample value in the uploaded SVG.
    // Wait until its object onload handler applies the live readouts.
    Promise.resolve().then(swap).catch(e=>console.error('Spokemon scene swap failed',e)).finally(()=>{
     if(!running)return;
     opening=true;
     start=performance.now();
     frame=requestAnimationFrame(tick);
    });
   }else complete();
  };
  frame=requestAnimationFrame(tick);
  return true;
 }
 return {
  transition,
  isRunning:()=>running,
  hasSwapped:()=>running&&swapped,
  destroy:()=>{if(frame)cancelAnimationFrame(frame);overlay.remove();running=false;}
 };
}
