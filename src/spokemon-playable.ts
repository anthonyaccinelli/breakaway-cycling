import {PINE_FOREST_SPOKEMON,choosePineForestSpokemon} from './pedalkin-creatures';
import type {SpokemonSpecies} from './pedalkin-creatures';
import {addWorkingCreatureSilhouette} from './pedalkin-creature-art';
import './spokemon-playable.css';

export type SpokemonRideTelemetry={
 distanceMeters:number;totalMeters:number;samples:number[];elapsedSeconds:number;
 gradePercent:number;powerWatts?:number;cadenceRpm?:number;heartRateBpm?:number|null;
 speedMph?:number;caloriesKcal?:number;running?:boolean;connected?:boolean;
};
type Scene='explore'|'encounter';
type SavedCreature={id:string;name:string;capturedAt:string;count:number};
const NS='http://www.w3.org/2000/svg';
const STORAGE='spokemon-caught-v1';
const COLORS=['#f6d58c','#9eca96','#6aad38','#989141','#c6744a','#f45853'];
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const bucket=(p:number)=>p<0?0:p<1?1:p<4?2:p<8?3:p<12?4:5;
function loadCollection():SavedCreature[]{
 try{const x=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(x)?x.filter(y=>typeof y?.id==='string'&&typeof y?.count==='number'):[];}catch{return [];}
}
export function mountSpokemonPlayable(options:{
 host:HTMLElement;slot:HTMLElement;active:()=>boolean;getScene:()=>Scene;
 switchScene:(to:Scene,species?:SpokemonSpecies)=>void;
 onFinishRide:()=>void;
 onCollection?:(items:SavedCreature[])=>void;
}){
 const {host,slot,active,getScene,switchScene,onFinishRide}=options;
 let collection=loadCollection();
 let species:SpokemonSpecies= PINE_FOREST_SPOKEMON.find(x=>x.id==='mossprout')||PINE_FOREST_SPOKEMON[0];
 let trust=0,patience=65,encounterCooldown=0,resolveAt=0;
 let outcome:'captured'|'escaped'|null=null;
 let message='Cruising through Pinepath Trail. Stay steady to attract nearby Spokemon.';
 let lastReal:SpokemonRideTelemetry|null=null;
 let lastSourceTime=0,lastTick=performance.now();
 let simulator=false,simulationRunning=false,simDistance=0,simPower=165,simElapsed=0,simKcal=0;
 let progressDistance=0;
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
  if(ready()&&lastReal) return lastReal;
  const samples=Array.from({length:97},(_,i)=>85+31*Math.sin(i*.15)+22*Math.sin(i*.39)+65*Math.sin(i*.055));
  return {distanceMeters:simDistance,totalMeters:lastReal?.totalMeters||24000,samples,elapsedSeconds:simElapsed,gradePercent:Math.sin(simDistance/180)*4,powerWatts:simulator?simPower:0,cadenceRpm:simulator?88:0,heartRateBpm:simulator?124:null,speedMph:simulator?simPower*.083:0,caloriesKcal:simKcal,running:simulationRunning,connected:false};
 };
 function drawProfile(root:SVGElement,f:SpokemonRideTelemetry){
  const minX=390,maxX=1518,top=445,bottom=807,width=maxX-minX;
  rect(root,minX,435,width,bottom-435,'#102e35');
  for(let j=0;j<6;j++)line(root,minX,470+j*64,maxX,470+j*64,'#386369',2);
  if(f.samples.length<2)return;
  const heights=f.samples.filter(Number.isFinite);
  if(heights.length<2)return;
  const lowest=Math.min(...heights),highest=Math.max(...heights),range=Math.max(1,highest-lowest);
  const point=(i:number)=>bottom-14-(heights[i]-lowest)/range*215;
  const total=Math.max(1,f.totalMeters);
  const segmentDistance=total/(heights.length-1);
  const path=['M '+minX+' '+point(0).toFixed(1)];
  for(let i=0;i<heights.length-1;i++){
   const x1=minX+width*i/(heights.length-1),x2=minX+width*(i+1)/(heights.length-1);
   const p=(heights[i+1]-heights[i])/segmentDistance*100;
   const clippedTop=Math.max(top,Math.min(bottom,point(i)));
   rect(root,x1,clippedTop,x2-x1+0.6,bottom-clippedTop,COLORS[bucket(p)]);
   // Thin horizontal scan lines, clipped to each colored vertical segment.
   for(let y=Math.ceil(clippedTop/7)*7;y<bottom;y+=7)line(root,x1,y,x2,y,'#17343b',1);
   path.push('L '+x2.toFixed(1)+' '+point(i+1).toFixed(1));
  }
  root.appendChild(make('path',{d:path.join(' '),fill:'none',stroke:'#fff1d7','stroke-width':'4'}));
  const progress=clamp(f.distanceMeters/total,0,1),x=minX+progress*width;
  const idx=clamp(Math.floor(progress*(heights.length-1)),0,heights.length-1);
  line(root,x,435,x,bottom,'#f6d58c',3);
  root.appendChild(make('circle',{cx:String(x),cy:String(point(idx)),r:'11',fill:'#f6d58c',stroke:'#143940','stroke-width':'4'}));
  text(root,407,785,(f.distanceMeters/1000).toFixed(1)+' km',21,'#17343b');
  text(root,1357,785,(total/1000).toFixed(1)+' km',21,'#17343b');
 }
 function paint(){
  if(!active())return;
  if(view.parentNode!==slot)slot.append(view);
  view.replaceChildren();
  const f=frame();
  const metrics=[
   [138,(f.powerWatts||0).toFixed(0)+'W'],
   [261,f.heartRateBpm==null?'— BPM':f.heartRateBpm.toFixed(0)+' BPM'],
   [384,(f.cadenceRpm||0).toFixed(0)+' RPM'],
   [507,(f.speedMph||0).toFixed(1)+' MPH'],
   [630,f.gradePercent.toFixed(1)+' %'],
   [755,(f.caloriesKcal||0).toFixed(0)+' KCAL']
  ] as const;
  // Keep all authored borders and headings; repaint only the numeric areas.
  for(const [y,value] of metrics){
   rect(view,48,y,286,47,'#f1e6c7');
   text(view,49,y+38,value,value.length>11?30:37);
  }
  rect(view,1590,144,290,52,'#f1e6c7');
  text(view,1590,188,getScene()==='encounter'?Math.round(trust)+'%':'—',48);
  rect(view,1592,199,290,43,'#f1e6c7',4);
  rect(view,1593,200,289*clamp(trust/100,0,1),38,'#ce7276',5);
  rect(view,1588,331,295,45,'#f1e6c7');
  text(view,1588,370,getScene()==='encounter'?Math.ceil(patience)+' S':'—',43);
  rect(view,1587,384,290,42,'#f1e6c7');
  rect(view,1588,385,288*clamp(patience/65,0,1),39,'#f6d58c',6);
  // The sample forest/companion remain exact; update only the live profile area.
  if(getScene()==='explore')drawProfile(view,f);
  // The prompt overlays the baked-in sample dialogue, not the SVG asset.
  rect(view,50,906,1197,122,'#f1e6c7');
  text(view,55,954,message.length>65?message.slice(0,62)+'…':message,26);
  text(view,55,996,ready()?(f.running?'REAL RIDE · '+(f.distanceMeters/1000).toFixed(2)+' km':'TRAINER READY · PRESS START'):
   simulator?(simulationRunning?'TEST RIDE · '+(simDistance/1000).toFixed(2)+' km':'TEST PAUSED'):
   'CONNECT TRAINER OR START TEST RIDE',22);
  status.textContent=labelSource();
  note.textContent=ready()?'Trainer detected. Real cycling data is driving the game.':'No trainer detected. Start a simulated test ride to explore.';
  simButton.textContent=simulator?(simulationRunning?'PAUSE TEST RIDE':'RESUME TEST RIDE'):'START TEST RIDE';
  tool.querySelector<HTMLButtonElement>('[data-pk-control="session"]')!.disabled=!ready();
  tool.querySelector<HTMLButtonElement>('[data-pk-control="finish"]')!.disabled=!ready();
 }
 function saveCreature(){
  const old=collection.find(x=>x.id===species.id);
  if(old)old.count+=1;
  else collection.push({id:species.id,name:species.name,capturedAt:new Date().toISOString(),count:1});
  try{localStorage.setItem(STORAGE,JSON.stringify(collection));}catch{}
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
  const f=frame(),moving=f.running&&f.powerWatts!==undefined&&f.powerWatts>50&&
   (f.cadenceRpm===undefined||f.cadenceRpm>35);
  const measuredDistance=Math.max(0,f.distanceMeters);
  if(ready()||simulator){progressDistance=measuredDistance;}
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
 function sync(){if(active()){lastTick=performance.now();paint();}else{tool.querySelector('details')?.removeAttribute('open');}}
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 sync();
 return {setFrame,paint,getCollection:()=>collection.slice(),getCurrentSpecies:()=>species,isSimulating:()=>simulator,destroy:()=>{window.clearInterval(timer);view.remove();tool.remove();}};
}
