/**
 * Reversible pixel-art transition effects over the exact Illustrator artboards.
 * The HUD remains stable, and neither uploaded SVG is modified.
 */
import './spokemon-transitions.css';
export type SpokemonTransitionStyle='rustle'|'wipe';
type Scene='explore'|'encounter';
export function createSpokemonTransitions(options:{
 stage:HTMLElement;
 preview:boolean;
 onSceneRequested:(target:Scene)=>void;
 onDone:()=>void;
}){
 const {stage,preview,onSceneRequested,onDone}=options;
 const curtain=document.createElement('div');
 curtain.className='pk-scene-transition';
 curtain.setAttribute('aria-hidden','true');
 curtain.hidden=true;
 const canopy=document.createElement('div');
 canopy.className='pk-transition-canopy';
 const left=document.createElement('div');
 left.className='pk-transition-canopy-left';
 const right=document.createElement('div');
 right.className='pk-transition-canopy-right';
 canopy.append(left,right);
 const stripes=document.createElement('div');
 stripes.className='pk-transition-stripes';
 for(let i=0;i<16;i++){
  const stripe=document.createElement('span');
  stripe.className='pk-transition-stripe';
  stripe.style.top=(i/16*100)+'%';
  stripe.style.height=(100/16+.15)+'%';
  stripe.style.transformOrigin=i%2?'right center':'left center';
  stripe.style.background=i%3===0?'#f6d58c':i%3===1?'#16383d':'#0e2930';
  stripes.append(stripe);
 }
 const leafCanvas=document.createElement('canvas');
 leafCanvas.className='pk-transition-leaves';
 leafCanvas.width=960;leafCanvas.height=480;
 canopy.append(leafCanvas);
 curtain.append(canopy,stripes);
 stage.append(curtain);
 let style:SpokemonTransitionStyle='rustle';
 let frame=0,running=false,midpoint=false,started=0;
 let pendingSwap:(()=>void)|null=null;
 const leaves=Array.from({length:72},(_,i)=>({
  x:((i*137+53)%960), y:((i*193+67)%480),
  direction:i%2?1:-1,seed:((i*47)%100)/100,
  size:6+((i*13)%5)*3
 }));
 const drawLeaves=(progress:number,coverage:number)=>{
  const ctx=leafCanvas.getContext('2d');
  if(!ctx)return;
  ctx.clearRect(0,0,960,480);
  const colors=['#9eca96','#6aad38','#989141','#d0d989','#2d6850','#f6d58c'];
  for(let i=0;i<leaves.length;i++){
   const leaf=leaves[i],t=progress;
   const x=(leaf.x+leaf.direction*(360*t+36*Math.sin(t*12+leaf.seed*9))+960)%960;
   const y=leaf.y+35*Math.sin(t*8+leaf.seed*13);
   const size=leaf.size*(.65+coverage*.7);
   ctx.fillStyle=colors[i%colors.length];
   ctx.fillRect(Math.round(x/5)*5,Math.round(y/5)*5,Math.ceil(size/5)*5,Math.ceil(size/5)*5);
   ctx.fillRect(Math.round((x+size*.55)/5)*5,Math.round((y-size*.4)/5)*5,Math.ceil(size*.6/5)*5,5);
  }
 };
 const ease=(x:number)=>x*x*(3-2*x);
 function clean(){
  if(frame)cancelAnimationFrame(frame);
  frame=0;running=false;pendingSwap=null;midpoint=false;
  curtain.hidden=true;curtain.removeAttribute('data-style');
  left.style.width='0%';right.style.width='0%';
  for(const stripe of Array.from(stripes.children) as HTMLElement[])stripe.style.transform='scaleX(0)';
  leafCanvas.getContext('2d')?.clearRect(0,0,960,480);
  onDone();
 }
 function tick(now:number){
  if(!running)return;
  const duration=style==='rustle'?960:760;
  const t=Math.min(1,(now-started)/duration);
  const coverage=t<.5?ease(t*2):1-ease((t-.5)*2);
  const quantized=Math.round(coverage*(style==='rustle'?20:16))/(style==='rustle'?20:16);
  if(style==='rustle'){
   left.style.width=(quantized*50)+'%';right.style.width=(quantized*50)+'%';
   drawLeaves(t,coverage);
  }else{
   const nodes=Array.from(stripes.children) as HTMLElement[];
   for(let i=0;i<nodes.length;i++){
    const delay=(i%5)*.045;
    const fraction=Math.min(1,Math.max(0,(quantized-delay)/(1-delay)));
    nodes[i].style.transform='scaleX('+fraction.toFixed(3)+')';
   }
  }
  if(t>=.5&&!midpoint){
   midpoint=true;
   // Swap SVGs only when the curtain fully conceals the artwork.
   pendingSwap?.();
  }
  if(t>=1){clean();return;}
  frame=requestAnimationFrame(tick);
 }
 function transition(swap:()=>void){
  if(running)return false;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   swap();onDone();return true;
  }
  running=true;midpoint=false;pendingSwap=swap;
  curtain.hidden=false;curtain.dataset.style=style;
  left.style.width='0%';right.style.width='0%';
  started=performance.now();frame=requestAnimationFrame(tick);
  return true;
 }
 let panel:HTMLElement|null=null;
 if(preview){
  panel=document.createElement('aside');
  panel.className='pk-transition-compare';
  panel.setAttribute('aria-label','Encounter transition comparison');
  panel.innerHTML=[
   '<span class="pk-transition-compare-title">ENCOUNTER TRANSITION PREVIEW</span>',
   '<label>STYLE <select class="pk-transition-select" aria-label="Choose encounter transition">',
   '<option value="rustle">Forest Rustle</option>',
   '<option value="wipe">Classic Game Boy Wipe</option>',
   '</select></label>',
   '<div class="pk-transition-actions">',
   '<button type="button" data-pk-transition-to="encounter">ENTER ENCOUNTER</button>',
   '<button type="button" data-pk-transition-to="explore">RETURN TO EXPLORE</button>',
   '<button type="button" data-pk-transition-replay>REPLAY EFFECT</button>',
   '</div>',
   '<small>Preview both animations on your approved SVGs. No ride is recorded.</small>'
  ].join('');
  stage.closest('.pk-ride-host')?.append(panel);
  const select=panel.querySelector<HTMLSelectElement>('select')!;
  select.value=style;
  select.addEventListener('change',()=>{style=select.value==='wipe'?'wipe':'rustle';});
  panel.querySelectorAll<HTMLButtonElement>('[data-pk-transition-to]').forEach(btn=>{
   btn.addEventListener('click',()=>onSceneRequested(btn.dataset.pkTransitionTo==='encounter'?'encounter':'explore'));
  });
  panel.querySelector<HTMLButtonElement>('[data-pk-transition-replay]')!.addEventListener('click',()=>transition(()=>{}));
 }
 return {
  transition,
  isRunning:()=>running,
  hasSwapped:()=>running&&midpoint,
  setStyle:(next:SpokemonTransitionStyle)=>{style=next;if(panel)panel.querySelector<HTMLSelectElement>('select')!.value=style;},
  getStyle:()=>style,
  destroy:()=>{clean();panel?.remove();curtain.remove();}
 };
}
