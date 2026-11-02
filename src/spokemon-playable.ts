import {PINE_FOREST_SPOKEMON,choosePineForestSpokemon} from './pedalkin-creatures';
import type {SpokemonSpecies} from './pedalkin-creatures';
import {addWorkingCreatureSilhouette} from './pedalkin-creature-art';
import './spokemon-playable.css';

export type SpokemonRideTelemetry={
 distanceMeters:number;totalMeters:number;samples:number[];elapsedSeconds:number;
 gradePercent:number;powerWatts?:number;cadenceRpm?:number;heartRateBpm?:number|null;
 speedMph?:number;caloriesKcal?:number;gear?:number|null;running?:boolean;connected?:boolean;
};
type Scene='explore'|'encounter';
type SavedCreature={id:string;name:string;capturedAt:string;count:number;xp?:number};
const levelAt=(xp:number)=>Math.floor(Math.sqrt(Math.max(0,xp)/120))+1;
const threshold=(level:number)=>120*level*level;
const NS='http://www.w3.org/2000/svg';
const STORAGE='spokemon-caught-v1';
const BUDDY_STORAGE='spokemon-buddy-v1';
const METERS_PER_MILE=1609.344;
const COLORS=['#f6d58c','#9eca96','#6aad38','#989141','#c6744a','#f45853'];
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const bucket=(p:number)=>p<0?0:p<1?1:p<4?2:p<8?3:p<12?4:5;
function loadCollection():SavedCreature[]{
 try{const x=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(x)?x.filter(y=>typeof y?.id==='string'&&typeof y?.count==='number'):[];}catch{return [];}
}
export function mountSpokemonPlayable(options:{
 host:HTMLElement;slot:HTMLElement;active:()=>boolean;getScene:()=>Scene;
 switchScene:(to:Scene,species?:SpokemonSpecies)=>void;
 isTransitioning?:()=>boolean;
 canPaintDuringTransition?:()=>boolean;
 onFinishRide:()=>void;
 onCollection?:(items:SavedCreature[])=>void;
}){
 const {host,slot,active,getScene,switchScene,onFinishRide}=options;
 let collection=loadCollection();
 let selectedBuddyId='';
 try{selectedBuddyId=localStorage.getItem(BUDDY_STORAGE)||'';}catch{}
 if(!collection.some(c=>c.id===selectedBuddyId))selectedBuddyId=collection[0]?.id||'';
 const buddy=()=>collection.find(c=>c.id===selectedBuddyId);
 const setBuddy=(id:string)=>{
  if(!collection.some(c=>c.id===id))return false;
  selectedBuddyId=id;
  try{localStorage.setItem(BUDDY_STORAGE,id);}catch{}
  paint();return true;
 };
 const previewSpeciesId=new URLSearchParams(location.search).has('pedalkinPreview')
  ?new URLSearchParams(location.search).get('spokemonSpecies'):null;
 let species:SpokemonSpecies=PINE_FOREST_SPOKEMON.find(x=>x.id===previewSpeciesId)
  ||PINE_FOREST_SPOKEMON.find(x=>x.id==='mossprout')||PINE_FOREST_SPOKEMON[0];
 let trust=0,patience=65,encounterCooldown=0,resolveAt=0;
 let outcome:'captured'|'escaped'|null=null;
 let message='Cruising through Pinepath Trail. Stay steady to attract nearby Spokemon.';
 let lastReal:SpokemonRideTelemetry|null=null;
 let lastSourceTime=0,lastTick=performance.now();
 let simulator=false,simulationRunning=false,simDistance=0,simPower=165,simElapsed=0,simKcal=0;
 let progressDistance=0;
 let lastXpElapsed=0;
 let levelFlashUntil=0;
 let encounterCount=0;
 let savedAt=0;
 const view=document.createElementNS(NS,'svg');
 view.setAttribute('viewBox','0 0 1920 1080');
 view.setAttribute('preserveAspectRatio','none');
 view.classList.add('pk-game-dynamic-art');
 view.setAttribute('role','img');
 view.setAttribute('aria-label','Live Spokemon ride information');
 const tool=document.createElement('div');
 tool.className='pk-game-toolbar';
 tool.innerHTML='<details><summary>GAME CONTROLS <span class="pk-game-status">OFFLINE</span></summary>'+
  '<div class="pk-game-toolbar-body"><p data-pk-game-note>No trainer detected. Use Test Ride, or connect a trainer in 02 Devices.</p>'+
  '<div class="pk-game-toolbar-buttons"><button data-pk-control="simulate">START TEST RIDE</button>'+
  '<button data-pk-control="session">START / PAUSE REAL RIDE</button>'+
  '<button data-pk-control="encounter">FIND SPOKEMON</button>'+
  '<button data-pk-control="collection">COLLECTION</button>'+ 
  '<button data-pk-control="fullscreen">FULL SCREEN</button>'+
  '<button data-pk-control="finish">SAVE & FINISH REAL RIDE</button></div>'+
  '<label>TEST EFFORT <output data-pk-game-watts>165 W</output><input data-pk-control="watts" type="range" min="60" max="310" value="165"></label>'+
  '<small>Test rides are simulated and are never recorded or exported. Real rides use your connected trainer and Breakaway recorder.</small></div></details>';
 host.append(tool);
 const status=tool.querySelector<HTMLElement>('.pk-game-status')!;
 const note=tool.querySelector<HTMLElement>('[data-pk-game-note]')!;
 const simButton=tool.querySelector<HTMLButtonElement>('[data-pk-control="simulate"]')!;
 const output=tool.querySelector<HTMLOutputElement>('[data-pk-game-watts]')!;
 const wattsControl=tool.querySelector<HTMLInputElement>('[data-pk-control="watts"]')!;
 const make=(tag:string,attrs:Record<string,string>,text?:string)=>{
  const el=document.createElementNS(NS,tag);
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  if(text!==undefined)el.textContent=text;
  return el;
 };
 const rect=(parent:SVGElement,x:number,y:number,w:number,h:number,color:string,r=0)=>parent.appendChild(make('rect',{x:String(x),y:String(y),width:String(w),height:String(h),fill:color,rx:String(r)}));
 const text=(parent:SVGElement,x:number,y:number,label:string,size=38,color='#17343b')=>parent.appendChild(make('text',{x:String(x),y:String(y),'font-size':String(size),'font-family':'Spokemon Minecraft, monospace','font-weight':'700',fill:color},label));
 const line=(parent:SVGElement,x1:number,y1:number,x2:number,y2:number,color:string,width=3)=>parent.appendChild(make('line',{x1:String(x1),y1:String(y1),x2:String(x2),y2:String(y2),stroke:color,'stroke-width':String(width)}));
 const ready=()=>Boolean(lastReal?.connected&&Date.now()-lastSourceTime<7000);
 const labelSource=()=>ready()?'TRAINER':simulator?'TEST RIDE':'READY';
 const frame=():SpokemonRideTelemetry=>{
  const route=lastReal&&Array.isArray(lastReal.samples)&&lastReal.samples.length>1?lastReal:null;
  const samples=route?.samples||Array.from({length:97},(_,i)=>85+31*Math.sin(i*.15)+22*Math.sin(i*.39)+65*Math.sin(i*.055));
  const totalMeters=route?.totalMeters||24000;
  if(ready()&&lastReal)return lastReal;
  // Use the rider's actual GPX/generated terrain even before pairing.
  // Never use stale real power, calories, speed or distance in offline mode.
  const i=clamp(Math.floor(simDistance/totalMeters*(samples.length-1)),0,samples.length-2);
  const slope=(samples[i+1]-samples[i])/Math.max(1,totalMeters/(samples.length-1))*100;
  return {distanceMeters:simulator?simDistance:0,totalMeters,samples,elapsedSeconds:simElapsed,
   gradePercent:simulator?slope:0,powerWatts:simulator?simPower:0,
   cadenceRpm:simulator?88:0,heartRateBpm:simulator?124:null,
   speedMph:simulator?simPower*.083:0,caloriesKcal:simulator?simKcal:0,
   running:simulator&&simulationRunning,connected:false,gear:null};
 };
 function drawProfile(root:SVGElement,f:SpokemonRideTelemetry){
  // Exact measured chart inset in the user's 1920x1080 Illustrator SVG.
  // Repaint ONLY this rectangle, preserving forest, cream frame and other UI.
  // In the Illustrator master, the cream frame is rect x=380..1540
  // with a 10-unit stroke CENTERED on its edge. The live chart used to
  // paint over half that stroke, leaving a dark line outside the frame.
  // Keep all dynamic pixels 5 units INSIDE each vertical/bottom border.
  const minX=385.12,maxX=1535.12,top=435.42,bottom=805.72,width=maxX-minX;
  const clipDefs=make('defs',{});
  const innerClip=make('clipPath',{id:'pk-spokemon-frame-clip',clipPathUnits:'userSpaceOnUse'});
  innerClip.appendChild(make('rect',{
   x:String(minX),y:String(top),width:String(width),height:String(bottom-top)
  }));
  clipDefs.appendChild(innerClip);
  root.appendChild(clipDefs);
  const plot=make('g',{'clip-path':'url(#pk-spokemon-frame-clip)'});
  root.appendChild(plot);
  rect(plot,minX,top,width,bottom-top,'#102e35');
  const heights=f.samples.filter(Number.isFinite);
  if(heights.length<2)return;
  for(let j=0;j<5;j++)line(plot,minX+4,480+j*63,maxX-4,480+j*63,'#355d63',1.4);
  const low=Math.min(...heights),high=Math.max(...heights),span=Math.max(1,high-low);
  const py=(i:number)=>bottom-21-(heights[i]-low)/span*215;
  const meters=Math.max(1,f.totalMeters),step=meters/(heights.length-1);
  // Trace the exact same interpolated profile used by the cream contour.
  // Sampled rectangular grade columns otherwise poke above the line on
  // descents, even when horizontal scanlines themselves are correctly clipped.
  const outline=['M '+minX.toFixed(2)+' '+py(0).toFixed(1)];
  for(let i=1;i<heights.length;i++){
   const x=minX+width*i/(heights.length-1);
   outline.push('L '+x.toFixed(2)+' '+py(i).toFixed(1));
  }
  const silhouette=outline.join(' ');
  const defs=make('defs',{});
  const clip=make('clipPath',{id:'pk-spokemon-grade-clip',clipPathUnits:'userSpaceOnUse'});
  clip.appendChild(make('path',{d:silhouette+' L '+maxX+' '+bottom+' L '+minX+' '+bottom+' Z'}));
  defs.appendChild(clip);
  plot.appendChild(defs);
  // BOTH the colored grade columns and the horizontal scanlines share one
  // closed silhouette mask. Neither can extend above the white profile line.
  const clipped=make('g',{'clip-path':'url(#pk-spokemon-grade-clip)'});
  for(let i=0;i<heights.length-1;i++){
   const x1=minX+width*i/(heights.length-1);
   const x2=minX+width*(i+1)/(heights.length-1);
   const slope=(heights[i+1]-heights[i])/step*100;
   rect(clipped,x1,top,x2-x1+0.5,bottom-top,COLORS[bucket(slope)]);
  }
  // One clipped scanline layer, not thousands of separate profile fragments.
  for(let y=Math.ceil(top/7)*7;y<bottom;y+=7){
   line(clipped,minX,y,maxX,y,'#16383d',0.9);
  }
  plot.appendChild(clipped);
  // Cream silhouette is drawn last so antialiasing never exposes a grade tip.
  plot.appendChild(make('path',{d:silhouette,fill:'none',stroke:'#fff1d7','stroke-width':'4','stroke-linejoin':'round'}));
  const position=clamp(f.distanceMeters/meters,0,1),x=minX+position*width;
  // Rider height must be evaluated at its exact fractional position.
  // Flooring the sample index made the dot teleport between jagged steps,
  // even though the cream route contour connects those samples smoothly.
  const samplePosition=position*(heights.length-1);
  const leftIndex=Math.min(heights.length-2,Math.floor(samplePosition));
  const fraction=samplePosition-leftIndex;
  const riderY=py(leftIndex)+(py(leftIndex+1)-py(leftIndex))*fraction;
  line(plot,x,top+9,x,bottom-5,'#f6d58c',2);
  plot.appendChild(make('circle',{cx:String(x),cy:String(riderY),r:'10',fill:'#f6d58c',stroke:'#17343b','stroke-width':'3'}));
  text(plot,415,766,(f.distanceMeters/METERS_PER_MILE).toFixed(1)+' mi',24,'#17343b');
  const endLabel=text(plot,1520,766,(meters/METERS_PER_MILE).toFixed(1)+' mi',24,'#17343b');
  endLabel.setAttribute('text-anchor','end');
 }
 function paint(){
  // Draw only after the new SVG has been covered and swapped, preventing
  // preauthored sample readouts from flashing on screen during reveal.
  if(!active()||(options.isTransitioning?.()&&!options.canPaintDuringTransition?.()))return;
  const object=slot.querySelector<HTMLObjectElement>('object.pk-exact-artboard');
  const doc=object?.contentDocument;
  const svg=doc?.documentElement as unknown as SVGSVGElement|null;
  // Keep the original SVG isolated; it is not rebuilt on every telemetry tick.
  if(!svg||svg.localName!=='svg')return;
  const f=frame();
  const currentBuddy=buddy();
   svg.querySelector('#pk-game-progression')?.remove();
   const hud=make('g',{id:'pk-game-progression'});
   if(getScene()==='encounter'){
    rect(hud,730,285,460,53,'#f2e8ca',5);
    text(hud,748,320,'TEMPERAMENT: '+species.personality.toUpperCase(),25,'#17343b');
   }
   if(currentBuddy){
    const xp=Math.max(0,currentBuddy.xp||0),level=levelAt(xp);
    const low=threshold(level-1),high=threshold(level);
    const ratio=clamp((xp-low)/(high-low),0,1);
    rect(hud,730,95,460,92,'#17343b',5);
    text(hud,747,124,currentBuddy.name.toUpperCase()+'  LV '+level,23,'#fff2d4');
    rect(hud,747,135,426,18,'#52665e',2);
    rect(hud,747,135,426*ratio,18,'#9eca96',2);
    text(hud,747,177,'XP '+Math.floor(xp-low)+' / '+(high-low),19,'#fff2d4');
    if(performance.now()<levelFlashUntil)text(hud,1040,124,'LEVEL UP!',22,'#f6d58c');
   }
   svg.appendChild(hud);
  const existingBuddy=svg.querySelector('#pk-active-buddy');
  if((existingBuddy?.getAttribute('data-creature-id')||'')!==(currentBuddy?.id||'')){
   existingBuddy?.remove();
   if(currentBuddy){
    const creature=PINE_FOREST_SPOKEMON.find(c=>c.id===currentBuddy.id);
    if(creature){
     const group=doc!.createElementNS(NS,'g');
     group.id='pk-active-buddy';group.setAttribute('data-creature-id',creature.id);
     const backdrop=doc!.createElementNS(NS,'rect');
     for(const [k,v] of Object.entries({x:'1660',y:'607',width:'131',height:'113',fill:'#fcf0d6'}))backdrop.setAttribute(k,v);
     group.append(backdrop);
     const sprite=doc!.createElementNS(NS,'svg');
     for(const [k,v] of Object.entries({x:'1659',y:'608',width:'132',height:'112',viewBox:'730 355 460 370',preserveAspectRatio:'xMidYMid meet'}))sprite.setAttribute(k,v);
     sprite.setAttribute('role','img');sprite.setAttribute('aria-label',creature.name+' active buddy');
     sprite.setAttribute('shape-rendering','crispEdges');
     addWorkingCreatureSilhouette(sprite,creature);
     sprite.querySelector('#pk-working-creature > text')?.remove();
     group.append(sprite);svg.append(group);
    }
   }
  }
  const example=svg.querySelector('circle[cx="1724"][cy="652.8"]');
  if(example)example.setAttribute('visibility','hidden');
  const exampleText=svg.querySelector('text[transform="translate(1675.3999 689.9976)"]');
  if(exampleText)exampleText.setAttribute('visibility','hidden');
  const set=(transform:string,value:string,maxWidth?:number)=>{
   const t=svg.querySelector<SVGTextElement>('text[transform="'+transform+'"]');
   const span=t?.querySelector<SVGTSpanElement>('tspan');
   if(!t||!span)return;
   if(span.textContent!==value)span.textContent=value;
   if(maxWidth===undefined)return;
   // The Illustrator text uses the supplied Minecraft font. Preserve its
   // baseline and original size whenever it fits; only reduce its font size
   // if the ENTIRE dynamic message would exceed the cream dialogue panel.
   const fontView=svg.ownerDocument.defaultView;
   const computed=fontView?.getComputedStyle(t).fontSize;
   const initialSize=parseFloat(computed||'');
   const baseSize=Number(t.dataset.pkOriginalFontSize)||
    (Number.isFinite(initialSize)&&initialSize>0?initialSize:44);
   if(!t.dataset.pkOriginalFontSize)t.dataset.pkOriginalFontSize=String(baseSize);
   t.style.fontSize=baseSize+'px';
   const measured=t.getComputedTextLength();
   if(Number.isFinite(measured)&&measured>maxWidth){
    const ratio=Math.min(1,(maxWidth-8)/measured);
    t.style.fontSize=(baseSize*ratio).toFixed(2)+'px';
   }
  };
  const numbers=[
   ['translate(48 161.5)',Math.round(f.powerWatts||0)+'W'],
   ['translate(177 161.5)',''], // Don't show the stale example W/kg.
   ['translate(48 284.3)',f.heartRateBpm==null?'— BPM':Math.round(f.heartRateBpm)+' BPM'],
   ['translate(48 407.1)',Math.round(f.cadenceRpm||0)+' RPM'],
   ['translate(48 529.9)',(f.speedMph||0).toFixed(1)+' MPH'],
   ['translate(48 652.8)',f.gradePercent.toFixed(1)+' %'],
   ['translate(48 778.5)',f.gear==null?'—':String(f.gear)],
   ['translate(1590.5015 183.81)',getScene()==='encounter'?Math.floor(trust)+'%':''],
   ['translate(1586.3262 368.0016)',getScene()==='encounter'?Math.ceil(patience)+' s':'—']
  ] as const;
  for(const [selector,value] of numbers)set(selector,value);
  set('translate(52 738.5)','GEAR');
  set('translate(1585.0078 740.9976)',currentBuddy?'BUDDY: '+currentBuddy.name.toUpperCase():'NO BUDDY SELECTED');
  if(getScene()==='explore'){
   const hide=(selector:string)=>{const el=svg.querySelector<SVGElement>(selector);if(el)el.style.visibility='hidden';};
   hide('rect[x="1566"][y="98.2"]');
   const biomePanel=svg.querySelector<SVGRectElement>('rect[x="1566"][y="277"]');
   if(biomePanel){biomePanel.setAttribute('y','437');biomePanel.setAttribute('height','92');}
   hide('line[x1="1586.33"][y1="439.41"]');
   hide('text[transform="translate(1590.5015 126.1968)"]');
   hide('text[transform="translate(1590.5015 183.81)"]');
   hide('rect[x="1592.9"][y="199.3"]');
   hide('text[transform="translate(1586.3262 309.9969)"]');
   hide('text[transform="translate(1586.3262 368.0016)"]');
   hide('rect[x="1588.33"][y="383.9"]');
   // Replace capture-only cards with current-session exploration statistics.
   // Values come from the same real/test ride telemetry as the other readouts.
   svg.querySelector('#pk-explore-session-stats')?.remove();
   const stats=make('g',{id:'pk-explore-session-stats'});
   const ascentMeters=(()=>{
    const samples=f.samples.filter(Number.isFinite);
    if(samples.length<2||f.totalMeters<=0)return 0;
    const completed=clamp(f.distanceMeters/f.totalMeters,0,1)*(samples.length-1);
    let sum=0;
    for(let i=1;i<=Math.floor(completed);i++)sum+=Math.max(0,samples[i]-samples[i-1]);
    const index=Math.floor(completed),fraction=completed-index;
    if(index<samples.length-1)sum+=Math.max(0,samples[index+1]-samples[index])*fraction;
    return sum;
   })();
   const duration=Math.max(0,Math.floor(f.elapsedSeconds||0));
   const clock=String(Math.floor(duration/3600)).padStart(2,'0')+':'+String(Math.floor(duration%3600/60)).padStart(2,'0')+':'+String(duration%60).padStart(2,'0');
   const card=(x:number,y:number,w:number,h:number,label:string,value:string,valueSize=36)=>{
    rect(stats,x,y,w,h,'#f2e8ca',6);
    text(stats,x+14,y+30,label,17,'#365149');
    text(stats,x+14,y+82,value,valueSize,'#102e35');
   };
   card(1566,98,162,142,'DISTANCE',(f.distanceMeters/METERS_PER_MILE).toFixed(2)+' MI',26);
   card(1736,98,168,142,'ELEVATION',Math.round(ascentMeters*3.280839895)+' FT',29);
   card(1566,250,338,170,'TIME ELAPSED',clock,48);
   svg.appendChild(stats);
  }
  // The Illustrator master includes six colored sample bars. Resize those
  // ORIGINAL paths from their left edge instead of drawing bars over them.
  const barData=[
   ['M54,171',f.powerWatts||0,450],
   ['M52.39,293.8',f.heartRateBpm||0,190],
   ['M52.88,416.6',f.cadenceRpm||0,145],
   ['M54,539.4',f.speedMph||0,40],
   ['M54,662.3',Math.max(0,f.gradePercent),15],
   ['M54,788',f.gear||0,24]
  ] as const;
  for(const [prefix,reading,limit] of barData){
   const item=Array.from(svg.querySelectorAll<SVGPathElement>('path[d]'))
    .find(p=>p.getAttribute('d')?.startsWith(prefix));
   if(!item)continue;
   const ratio=clamp(reading/limit,0,1);
   item.setAttribute('transform','translate(50 0) scale('+ratio.toFixed(4)+' 1) translate(-50 0)');
   const low=[106,173,56],high=[244,88,83];
   const rgb=low.map((a,i)=>Math.round(a+(high[i]-a)*ratio));
   item.style.fill='rgb('+rgb.join(',')+')';
  }
  // Update the exact original Illustrator fill rectangles, not new cover art.
  const trustBar=svg.querySelector<SVGRectElement>('rect[x="1592.9"][y="199.3"]');
  if(trustBar)trustBar.setAttribute('width',(288.75*clamp(trust/100,0,1)).toFixed(2));
  const patienceBar=svg.querySelector<SVGRectElement>('rect[x="1588.33"][y="383.9"]');
  if(patienceBar)patienceBar.setAttribute('width',(233.7*clamp(patience/65,0,1)).toFixed(2));
  // Do not truncate the message: size it to the available content width.
  // Dialogue panel spans x=24..1296; text starts x=56 and keeps a 28px inset.
  set('translate(56 946)',message,1212);
  const line2=ready()?(f.running?'REAL RIDE · '+(f.distanceMeters/METERS_PER_MILE).toFixed(2)+' mi':'TRAINER READY · PRESS START'):
   simulator?(simulationRunning?'TEST RIDE · '+(simDistance/METERS_PER_MILE).toFixed(2)+' mi':'TEST PAUSED'):
   'CONNECT TRAINER OR START TEST RIDE';
  set('translate(56 1001.0032)',line2,1212);
  // The original elevation artwork is replaced only within its exact bounds.
  if(getScene()==='explore'){
   if(view.parentNode!==slot)slot.append(view);
   view.replaceChildren();
   drawProfile(view,f);
  }else{
   view.remove();
  }
  status.textContent=labelSource();
  note.textContent=ready()?'Trainer detected. Real cycling data is driving the game.':'No trainer detected. Start a simulated test ride to explore.';
  simButton.textContent=simulator?(simulationRunning?'PAUSE TEST RIDE':'RESUME TEST RIDE'):'START TEST RIDE';
  tool.querySelector<HTMLButtonElement>('[data-pk-control="session"]')!.disabled=!ready();
  tool.querySelector<HTMLButtonElement>('[data-pk-control="finish"]')!.disabled=!ready();
 }
 function saveCreature(){
  const old=collection.find(x=>x.id===species.id);
  if(old)old.count+=1;
  else collection.push({id:species.id,name:species.name,capturedAt:new Date().toISOString(),count:1,xp:0});
  try{localStorage.setItem(STORAGE,JSON.stringify(collection));}catch{}
  if(!selectedBuddyId)setBuddy(species.id);
  else paint();
 }
 function encounter(){
  if(getScene()==='encounter'||!active())return;
  species=choosePineForestSpokemon();
  trust=0;patience=65;outcome=null;resolveAt=0;
  encounterCount++;
  message='A wild '+species.name+' appeared! Keep pedaling steadily to earn Trust.';
  switchScene('encounter',species);
  paint();
 }
 function returnExplore(){
  outcome=null;trust=0;patience=65;
  message='Cruising through Pinepath Trail. Stay steady to attract nearby Spokemon.';
  switchScene('explore');
  encounterCooldown=progressDistance+650+Math.random()*950;
  paint();
 }
 function resolve(success:boolean){
  if(outcome)return;
  outcome=success?'captured':'escaped';
  if(success){saveCreature();message=species.name+' joined your collection! '+collection.length+' species discovered.';}
  else message=species.name+' wandered away. Another chance awaits on the trail.';
  resolveAt=performance.now()+3600;
  paint();
 }
 const journal=()=>{
  const lines=collection.length?collection.map(c=>c.name+' ×'+c.count).join('\n'):'No Spokemon collected yet.';
  if(options.onCollection)options.onCollection(collection.slice());
  else window.alert('SPOKEMON COLLECTION\n\n'+lines+'\n\n'+collection.length+' / '+PINE_FOREST_SPOKEMON.length+' species');
 };
 tool.querySelectorAll<HTMLButtonElement>('button[data-pk-control]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.pkControl;
  if(action==='simulate'){if(ready())return;simulator=true;simulationRunning=!simulationRunning;paint();}
  else if(action==='session'){if(ready())document.getElementById('start')?.click();}
  else if(action==='encounter')encounter();
  else if(action==='collection')journal();
   else if(action==='fullscreen'){
    if(document.fullscreenElement)void document.exitFullscreen?.();
    else if(host.requestFullscreen)void host.requestFullscreen();
   }
  else if(action==='finish'&&ready())onFinishRide();
 }));
 wattsControl.addEventListener('input',()=>{simPower=Number(wattsControl.value);output.textContent=simPower+' W';paint();});
 function setFrame(f:SpokemonRideTelemetry){
  if(!f||!Number.isFinite(f.totalMeters)||f.totalMeters<=0)return;
  lastReal=f;lastSourceTime=Date.now();
  if(f.connected){simulationRunning=false;simulator=false;}
  if(active()){
   if(ready()&&f.running)progressDistance=f.distanceMeters;
   paint();
  }
 }
 let previousActive=false;
 const timer=window.setInterval(()=>{
  if(!active()){previousActive=false;lastTick=performance.now();return;}
  const now=performance.now(),dt=clamp((now-lastTick)/1000,0,1.5);
  lastTick=now;
  if(!previousActive){previousActive=true;paint();}
  if(!ready()&&simulator&&simulationRunning){
   // 5x traversal speed is exclusively a trainer-free game test. The native
   // Breakaway activity recorder never receives synthetic data.
   simElapsed+=dt*5;simDistance+=simPower*.042*dt*5;
   simKcal+=simPower*dt*5/4184;
  }
  // The smart trainer keeps running normally, but Trust/Patience and new
  // encounters pause while the wipe conceals and reveals the scene.
  if(options.isTransitioning?.())return;
  const f=frame(),moving=f.running&&f.powerWatts!==undefined&&f.powerWatts>50&&
   (f.cadenceRpm===undefined||f.cadenceRpm>35);
  const measuredDistance=Math.max(0,f.distanceMeters);
  if(ready()||simulator){progressDistance=measuredDistance;}
   if(moving&&buddy()){
    const current=buddy()!;
    const delta=ready()?clamp(f.elapsedSeconds-lastXpElapsed,0,dt+0.5):dt*5;
    const previous=levelAt(current.xp||0);
    current.xp=(current.xp||0)+Math.max(0,delta);
    if(levelAt(current.xp)>previous)levelFlashUntil=performance.now()+3500;
    try{localStorage.setItem(STORAGE,JSON.stringify(collection));}catch{}
   }
   lastXpElapsed=f.elapsedSeconds;
  if(getScene()==='explore'&&moving&&progressDistance>=encounterCooldown){
   encounter();
  }
  if(getScene()==='encounter'){
   if(outcome){
    if(now>=resolveAt)returnExplore();
   }else{
    patience=Math.max(0,patience-dt);
    if(moving){
     const effort=clamp((f.powerWatts||160)/180,0.5,1.6);
     trust=clamp(trust+dt*3.5*effort,0,100);
    }
    if(trust>=100){
     // Captures are not guaranteed. Approx. 85% success at full trust.
     resolve(Math.random()<.85);
    }else if(patience<=0)resolve(false);
   }
  }
  if(!savedAt||now-savedAt>600){
   paint();savedAt=now;
  }
 },250);
 encounterCooldown=350; // First natural appearance after roughly 350 m.
 function stopTestRide(){
  // This stops ONLY the trainer-free simulator. Captured creatures stay in
  // localStorage, while native FTMS activity and recording remain untouched.
  simulator=false;simulationRunning=false;
  simDistance=0;simElapsed=0;simKcal=0;
  progressDistance=0;
  trust=0;patience=65;outcome=null;resolveAt=0;
  encounterCooldown=350;
  message='Cruising through Pinepath Trail. Stay steady to attract nearby Spokemon.';
  if(active())paint();
 }
 function sync(){if(active()){lastTick=performance.now();paint();}else{tool.querySelector('details')?.removeAttribute('open');}}
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 sync();
 return {setFrame,paint,stopTestRide,setBuddy,getBuddy:()=>buddy(),getCollection:()=>collection.slice(),getCurrentSpecies:()=>species,isSimulating:()=>simulator,destroy:()=>{window.clearInterval(timer);view.remove();tool.remove();}};
}
