import {PINE_FOREST_SPOKEMON} from './pedalkin-creatures';
import type {SpokemonSpecies} from './pedalkin-creatures';
import './pedaldex.css';

type CollectedCreature={id:string;name:string;count:number};
const NS='http://www.w3.org/2000/svg';
const TOTAL_PINE_FOREST=40;
const aliases:Record<string,string>={'bob-moss':'mossgob'};
// Keep the approved Mossgob artwork in the first slot, as in the Illustrator layout.
const orderedSpecies=[...PINE_FOREST_SPOKEMON].sort((a,b)=>
 a.id==='mossgob'?-1:b.id==='mossgob'?1:0);
const el=(name:string,attributes:Record<string,string>={})=>{
 const node=document.createElementNS(NS,name);
 for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);
 return node;
};
export function openPedaldex(getCollection:()=>readonly CollectedCreature[]):void{
 document.querySelector('.pk-pedaldex')?.remove();
 const overlay=document.createElement('section');
 overlay.className='pk-pedaldex';
 overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','Pedaldex — Pine Forest');
 const screen=document.createElement('div');
 screen.className='pk-pedaldex-screen';
 const close=document.createElement('button');
 close.type='button';close.className='pk-pedaldex-back';
 close.textContent='← BACK TO RIDE';
 close.setAttribute('aria-label','Close Pedaldex and return to ride');
 const message=document.createElement('div');
 message.className='pk-pedaldex-message';
 message.hidden=true;
 message.setAttribute('role','status');
 const dismiss=()=>{
  overlay.remove();
  window.removeEventListener('keydown',onKey);
 };
 const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')dismiss();};
 close.addEventListener('click',dismiss);
 overlay.append(screen,close,message);
 document.body.append(overlay);
 window.addEventListener('keydown',onKey);
 close.focus();
 void fetch('/pedalkin/pedaldex-pineforest.svg')
  .then(response=>{if(!response.ok)throw new Error('Artboard missing');return response.text();})
  .then(source=>{
   if(!overlay.isConnected)return;
   const doc=new DOMParser().parseFromString(source,'image/svg+xml');
   if(doc.querySelector('parsererror'))throw new Error('Invalid artboard');
   const svg=document.importNode(doc.documentElement,true) as unknown as SVGSVGElement;
   svg.classList.add('pk-pedaldex-artboard');
   svg.setAttribute('role','img');
   svg.setAttribute('aria-label','Pine Forest Pedaldex with forty creature spaces');
   const existing=new Set(getCollection().map(creature=>aliases[creature.id]||creature.id));
   let count=0;
   for(let i=0;i<TOTAL_PINE_FOREST;i++){
    const species:SpokemonSpecies|undefined=orderedSpecies[i];
    if(!species||!existing.has(species.id))continue;
    count++;
    const rect=svg.querySelector<SVGRectElement>('[data-pedaldex-slot="'+i+'"]');
    if(!rect)continue;
    const x=Number(rect.getAttribute('x')),y=Number(rect.getAttribute('y'));
    // Illustrator stylesheet sets .st0 fill:none; override its class rule explicitly.
    rect.style.setProperty('fill','#fcf0d6');
    rect.style.setProperty('stroke','none');
    const image=el('image',{
     x:String(x+10),y:String(y+5),width:'143.8',height:'130',
     href:species.artSrc||'',preserveAspectRatio:'xMidYMid meet',
     'image-rendering':'pixelated'
    });
    if(species.artSrc)svg.append(image);
    const label=el('text',{
     x:String(x+81.9),y:String(y+154),fill:'#214f55',
     'font-family':'Minecraft, monospace','font-size':'17',
     'text-anchor':'middle'
    });
    label.textContent=species.name.toUpperCase();
    svg.append(label);
   }
   const counter=svg.querySelector('[data-pedaldex-count]');
   if(counter)counter.textContent='PEDALKIN COLLECTED '+count+' / '+TOTAL_PINE_FOREST;
   screen.append(svg);
   const next=document.createElement('button');
   next.className='pk-pedaldex-next';
   next.type='button';
   next.setAttribute('aria-label','Next biome');
   next.addEventListener('click',()=>{
    message.hidden=false;
    message.textContent='NEXT BIOME COMING SOON — PINE FOREST IS THE ONLY AVAILABLE BIOME.';
   });
   screen.append(next);
  }).catch(()=>{
   message.hidden=false;
   message.textContent='Unable to load Pedaldex artwork. Please reload the game.';
  });
}
