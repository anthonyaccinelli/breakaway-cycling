import './pedalkin-ride.css';
import {mountSpokemonPlayable} from './spokemon-playable';
import type {SpokemonRideTelemetry} from './spokemon-playable';
import {PINE_FOREST_SPOKEMON,choosePineForestSpokemon,nextPreviewSpokemon} from './pedalkin-creatures';
import type {SpokemonSpecies} from './pedalkin-creatures';
import {addWorkingCreatureSilhouette} from './pedalkin-creature-art';
import {pixelateElevation} from './pedalkin-pixel-elevation';
import {createSpokemonClassicWipe} from './spokemon-classic-wipe';

type PedalkinRideFrame={
 distanceMeters:number;
 totalMeters:number;
 samples:number[];
 elapsedSeconds:number;
 gradePercent:number;
};

/**
 * Pedalkin 03 Ride: user's exact 1920 x 1080 Illustrator templates.
 * No SVG screenshot approximation: the uploaded artboards are served unchanged
 * except for the user's crab sprites and removal of the old buddy placeholder.
 * No trainer command or route hold is issued by this module.
 */
export function mountPedalkinRide():void {
 const ride=document.getElementById('screenRide');
 if(!ride)return;
 const previewChoice=new URLSearchParams(location.search).get('pedalkinPreview');
 // Approval baseline: display the exact supplied SVG as an immutable image.
 // No imported stylesheet or JavaScript may restyle/move/replace its paths,
 // pixel artwork, typography, metrics, overlays, or companion illustration.
 // Dynamic rendering remains available for subsequent, separately approved work.
 const exactArtwork=new URLSearchParams(location.search).get('spokemonDynamic')!=='1';
 const playingPreview=previewChoice==='playing'||previewChoice==='encounters';
 const demo=playingPreview||['route','setup','ride','encounter','explore'].includes(previewChoice||'');
 // The full-screen gameplay view shows no developer controls, but the route
 // marker and illustrative data still animate without a trainer connection.
 const showPlaytestControls=demo&&!playingPreview;
 const host=document.createElement('section');
 host.className='pk-ride-host';
 host.hidden=true;
 if(exactArtwork)host.classList.add('pk-exact-artwork-mode');
 host.setAttribute('aria-label','Pedalkin ride');
 host.innerHTML=`
   <header class="pk-ride-nav" aria-label="Pedalkin ride navigation">
     <span class="pk-ride-nav-name">SPOKEMON <small> / 03 RIDE</small></span>
     <nav class="pk-ride-tabs" aria-label="Ride navigation">
       <button type="button" data-pk-nav="route">01 ROUTE</button>
       <button type="button" data-pk-nav="devices">02 DEVICES</button>
       <button type="button" data-pk-nav="ride" aria-current="page">03 RIDE</button>
       <button type="button" data-pk-nav="overlay" aria-label="Open always-on-top overlay">04 OVERLAY</button>
     </nav>
     <span class="pk-ride-nav-state">PINE FOREST</span>
   </header>
   ${showPlaytestControls?'<div class="pk-demo-bar"><strong>DESIGN PLAYTEST · NO TRAINER / NO RECORDED RIDE</strong><div class="pk-demo-buttons"><button type="button" data-pk-demo="explore">Exploration</button><button type="button" data-pk-demo="encounter">Encounter</button><button type="button" data-pk-demo="pedal">Pedal 15 seconds</button><button type="button" data-pk-demo="escape">Let escape</button><button type="button" data-pk-demo="reset">Reset</button></div></div>':''}
   ${showPlaytestControls?'<div class="pk-profile-bar"><button type="button" data-pk-profile="toggle">Pause preview</button><input type="range" data-pk-profile="seek" min="0" max="1000" value="0" aria-label="Preview rider position along elevation profile"/><span class="pk-profile-status">0.0 / 25.0 km · Fast-forward playtest</span></div>':''}
   <div class="pk-ride-stage"><div class="pk-svg-slot" role="region" aria-label="Pedalkin 03 Ride screen"></div>
     <button type="button" class="pk-hitspot pk-journal" aria-label="Open creature journal" data-pk-action="journal"></button>
     <button type="button" class="pk-hitspot pk-buddy" aria-label="Open buddy" data-pk-action="buddy"></button>
     <button type="button" class="pk-hitspot pk-stats" aria-label="Open ride stats" data-pk-action="stats"></button>
     <button type="button" class="pk-hitspot pk-save" aria-label="Save and close ride" data-pk-action="save"></button>
   </div>
   <div class="pk-popup" hidden role="dialog" aria-label="Pedalkin menu" aria-modal="true">
     <div class="pk-popup-content"><div class="pk-popup-title"></div><div class="pk-popup-body"></div><button type="button" class="pk-popup-dismiss">CLOSE ×</button></div>
   </div>
 `;
 // Move the exact-artboard view to document.body. The legacy #screenRide
 // container has layout offsets / stacking contexts that clipped its top
 // and bottom on common 16:9 desktop browser viewports.
 if(exactArtwork)document.body.append(host);
 else ride.append(host);
 const slot=host.querySelector<HTMLElement>('.pk-svg-slot')!;
 const stage=host.querySelector<HTMLElement>('.pk-ride-stage')!;
 const popup=host.querySelector<HTMLElement>('.pk-popup')!;
 const dismiss=host.querySelector<HTMLButtonElement>('.pk-popup-dismiss')!;
 let explored:string|null=null;
 let encounterSvg:string|null=null;
 let stageName:'explore'|'encounter'=previewChoice==='encounter'?'encounter':'explore';
 let trust=0;
 let patience=48;
 let outcome:'captured'|'escaped'|null=null;
 let lastEncounterTick=0;
 const previewSpeciesId=demo?new URLSearchParams(location.search).get('spokemonSpecies'):null;
 let currentSpecies:SpokemonSpecies=
  PINE_FOREST_SPOKEMON.find(creature=>creature.id===previewSpeciesId) || nextPreviewSpokemon(0);
 let encounterCount=0;
 let nextEncounterKm=1.35;
 let resolveAfter=0;
 let demoOutcomeIsEscape=false;
 const demoTotalKm=25;
 let demoKm=0;
 let demoPlaying=demo;
 let demoAnimationFrame=0;
 let previousAnimationAt=0;
 let liveFrame:PedalkinRideFrame|null=null;
 let distanceText:SVGTSpanElement|null=null;
 let elapsedText:SVGTSpanElement|null=null;
 const profileToggle=host.querySelector<HTMLButtonElement>('[data-pk-profile="toggle"]');
 const profileSeek=host.querySelector<HTMLInputElement>('[data-pk-profile="seek"]');
 const profileStatus=host.querySelector<HTMLElement>('.pk-profile-status');
 const profileBar=host.querySelector<HTMLElement>('.pk-profile-bar');
 const navButtons=host.querySelectorAll<HTMLButtonElement>('[data-pk-nav]');
 const active=()=>document.body.dataset.rideExperience==='pedalkin'&&document.body.dataset.breakawayScreen==='ride';
 let playable:ReturnType<typeof mountSpokemonPlayable>|null=null;
 let classicWipe:ReturnType<typeof createSpokemonClassicWipe>|null=null;
 const svgUrl=(s:string)=>'/pedalkin/'+s+'.svg';
 function loadArt(){
  if(explored!==null&&encounterSvg!==null)return Promise.resolve();
  return Promise.all([fetch(svgUrl('explore')),fetch(svgUrl('encounter'))]).then(async ([a,b])=>{
   if(!a.ok||!b.ok)throw Error('Could not load Pedalkin artboards');
   explored=await a.text();encounterSvg=await b.text();
  });
 }
 function textNodes():SVGTextElement[]{
  return Array.from(slot.querySelectorAll<SVGTextElement>('text'));
 }
 function updateText(oldText:string,value:string){
  const el=textNodes().find(item=>item.textContent?.trim()===oldText);
  if(!el)return;
  const tspans=Array.from(el.querySelectorAll('tspan'));
  if(tspans.length===1)tspans[0].textContent=value;
  else el.textContent=value;
 }
 function updateCapture(){
  if(stageName!=='encounter')return;
  const name=currentSpecies.name;
  const mood=currentSpecies.personality;
  const prompts:Record<SpokemonSpecies['personality'],string>={
   shy:'Keep an easy, steady rhythm so it feels safe.',
   curious:'Stay relaxed and let it come closer.',
   stubborn:'Keep a smooth pace and be patient.',
   gentle:'Ride comfortably and let it settle.',
   playful:'Stay steady while it plays alongside you.',
  };
  updateText('48%',Math.max(0,Math.round(trust))+'%');
  updateText('48 s',Math.max(0,Math.round(patience))+' s');
  const svg=slot.querySelector('svg');
  // Preserve Illustrator geometry and update only the visible fill length.
  // Original Illustrator artwork shows 48%, with a 138.6px fill.
  // The full 100% track is 138.6/0.48 = 288.75px, within the panel.
  const bar=svg?.querySelector<SVGRectElement>('rect[x="1592.9"][y="199.3"]');
  if(bar)bar.setAttribute('width',(288.75*Math.max(0,Math.min(100,trust))/100).toFixed(2));
  const oldHeadline='A wild Mossprout appeared!';
  const oldPrompt='Keep a steady pace to calm it down.';
  if(outcome==='captured'){
   updateText(oldHeadline,name+' joined your collection!');
   updateText(oldPrompt,'What a wonderful new friend!');
  }else if(outcome==='escaped'){
   updateText(oldHeadline,name+' wandered away.');
   updateText(oldPrompt,'Keep riding to discover another.');
  }else{
   updateText(oldHeadline,'A wild '+name+' appeared!');
   updateText(oldPrompt,prompts[mood]);
  }
  const rarityText=svg?.querySelector<SVGTextElement>('#pk-creature-rarity');
  if(rarityText)rarityText.textContent=currentSpecies.rarity.toUpperCase()+' · '+mood.toUpperCase();
 }
 function updateActualReadouts(){
  if(demo||!active())return;
  // Read real UI telemetry only; no synthetic wattage, no trainer control.
  const value=(id:string)=>(document.getElementById(id)?.textContent||'').trim();
  const power=value('power'),cadence=value('cadence'),hr=value('heartRate'),speed=value('speed'),grade=value('profileBarGrade')||value('grade'),
    calories=value('calories')||value('energyKcal'),elapsed=value('elapsedTime');
  if(power){const metric=textNodes().find(x=>x.textContent?.startsWith('182W '));const spans=metric?.querySelectorAll('tspan');if(spans?.[0])spans[0].textContent=power.replace(/\s*W.*$/i,'')+'W ';}
  if(hr)updateText('123 BPM',hr.toUpperCase().includes('BPM')?hr:hr+' BPM');
  if(cadence)updateText('92 RPM',cadence.toUpperCase().includes('RPM')?cadence:cadence+' RPM');
  if(speed)updateText('14.7 MPH',speed.toUpperCase().includes('MPH')?speed:speed+' MPH');
  if(grade)updateText('2.0 %',grade.includes('%')?grade:grade+' %');
  if(calories)updateText('984 KCAL',calories.toUpperCase().includes('KCAL')?calories:calories+' KCAL');
  if(elapsed)updateText('1:23:47',elapsed);
 }

 // SVG geometry comes from the user-authored 1920 x 1080 Exploration artboard.
 // On real rides we replace only its elevation trace using the actual generated
 // route elevations. No modification is made to the source artwork or trainer.
 const profileMinX=383,profileMaxX=1498;
 const clamp01=(n:number)=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
 function paintRealElevation(frame:PedalkinRideFrame|null){
  if(stageName!=='explore')return;
  const svg=slot.querySelector<SVGSVGElement>('svg');
  // The latest Illustrator master uses path.st8 (a CLOSED fill); the earlier
  // source used path.st32 (an open elevation trace). Support both exactly.
  const path=svg?.querySelector<SVGPathElement>('path.st8[d^="M380.12"],path.st32');
  if(!svg||!path)return;
  const ns='http://www.w3.org/2000/svg';
  const baseD=path.dataset.pkBaseD||path.getAttribute('d')||'';
  if(!path.dataset.pkBaseD)path.dataset.pkBaseD=baseD;
  // Trim the closing valley/floor of the user's filled SVG shape. All grade
  // sampling must use the unmodified smooth upper contour, not the closure.
  const topD=path.classList.contains('st8')
   ?baseD.replace(/v[+-]?\d[\s\S]*$/i,'')
   :baseD;
  const smoothSource=svg.querySelector<SVGPathElement>('#pk-smooth-profile-source')
   ||document.createElementNS(ns,'path');
  smoothSource.id='pk-smooth-profile-source';
  smoothSource.setAttribute('d',topD);
  smoothSource.setAttribute('fill','none');
  smoothSource.setAttribute('stroke','none');
  smoothSource.setAttribute('pointer-events','none');
  smoothSource.setAttribute('opacity','0');
  if(!smoothSource.parentNode)path.parentNode!.insertBefore(smoothSource,path);
  const valid=frame?.samples.filter(Number.isFinite)||[];
  let heights:number[];
  if(valid.length>1){
   const low=Math.min(...valid),high=Math.max(...valid),range=Math.max(0.5,high-low);
   heights=valid.map(e=>700-(e-low)/range*195);
  }else{
   const len=smoothSource.getTotalLength();
   if(len<=0)return;
   heights=Array.from({length:113},(_,i)=>{
    const wanted=profileMinX+(profileMaxX-profileMinX)*i/112;
    let lo=0,hi=len;
    for(let j=0;j<22;j++){
     const mid=(lo+hi)/2;
     if(smoothSource.getPointAtLength(mid).x<wanted)lo=mid;else hi=mid;
    }
    return smoothSource.getPointAtLength((lo+hi)/2).y;
   });
  }
  // Quantization is purely visual. It NEVER changes route grades, trainer
  // commands, TCX elevations, or the recorded rider data.
  const pixels=pixelateElevation(heights,profileMinX,profileMaxX,445,809,112,6);
  const oldLayer=svg.querySelector('#pk-grade-stripes');
  oldLayer?.remove();
  svg.querySelector('#pk-grade-clip')?.remove();
  const defs=svg.querySelector('defs')||svg.insertBefore(document.createElementNS(ns,'defs'),svg.firstChild);
  const clip=document.createElementNS(ns,'clipPath');
  clip.id='pk-grade-clip';
  clip.setAttribute('clipPathUnits','userSpaceOnUse');
  const clipShape=document.createElementNS(ns,'path');
  clipShape.setAttribute('d',pixels.fill);
  clip.appendChild(clipShape);
  defs.appendChild(clip);
  const stripes=document.createElementNS(ns,'g');
  stripes.id='pk-grade-stripes';
  stripes.setAttribute('clip-path','url(#pk-grade-clip)');
  stripes.setAttribute('aria-label','Grade-colored horizontal lines clipped inside the elevation profile');
  const colors=['#f6d58c','#9eca96','#6aad38','#989141','#c6744a','#f45853'];
  const bucket=(grade:number)=>grade<0?0:grade<1?1:grade<4?2:grade<8?3:grade<12?4:5;
  const xStep=(profileMaxX-profileMinX)/112;
  const yAt=(fraction:number)=>{
   const t=Math.max(0,Math.min(heights.length-1,fraction*(heights.length-1)));
   const i=Math.min(heights.length-2,Math.floor(t));
   return heights[i]+(heights[i+1]-heights[i])*(t-i);
  };
  for(let i=0;i<112;i++){
   const left=profileMinX+i*xStep;
   const f=(i+0.5)/112;
   let grade:number;
   if(valid.length>1&&frame&&frame.totalMeters>0){
    const leftIndex=Math.min(valid.length-2,Math.max(0,Math.floor(f*(valid.length-1))));
    grade=(valid[leftIndex+1]-valid[leftIndex])/
      (frame.totalMeters/Math.max(1,valid.length-1))*100;
   }else{
    const before=yAt(Math.max(0,f-.016));
    const after=yAt(Math.min(1,f+.016));
    grade=-(after-before)/(Math.max(.001,Math.min(1,f+.016)-Math.max(0,f-.016))*(profileMaxX-profileMinX))*14;
   }
   const segment=document.createElementNS(ns,'rect');
   segment.setAttribute('x',(left-.15).toFixed(2));
   segment.setAttribute('y','435');
   segment.setAttribute('width',(xStep+.35).toFixed(2));
   segment.setAttribute('height','376');
   segment.setAttribute('fill',colors[bucket(grade)]);
   stripes.appendChild(segment);
  }
  // Horizontal grade scanlines run across the chart, but stop precisely at
  // the pixelated elevation silhouette. One continuous line per scan row.
  for(let y=438;y<811;y+=6){
   const line=document.createElementNS(ns,'line');
   line.setAttribute('x1',String(profileMinX));
   line.setAttribute('x2',String(profileMaxX));
   line.setAttribute('y1',String(y));
   line.setAttribute('y2',String(y));
   line.setAttribute('stroke','#17343b');
   line.setAttribute('stroke-opacity','0.20');
   line.setAttribute('stroke-width','1.5');
   line.setAttribute('shape-rendering','crispEdges');
   stripes.appendChild(line);
  }
  path.parentNode!.insertBefore(stripes,path);
  // The original green fill must not obscure the new palette, while the
  // cream contour stays visible above the colored, clipped horizontal lines.
  path.setAttribute('d',pixels.line);
  path.setAttribute('style','fill:none;stroke:#fcf0d6;stroke-width:4;stroke-linecap:square;stroke-linejoin:miter;shape-rendering:crispEdges');
 }
 function paintRiderOnProfile(){
  if(stageName!=='explore')return;
  const svg=slot.querySelector('svg');
  const path=svg?.querySelector<SVGPathElement>('#pk-smooth-profile-source');
  if(!svg||!path)return;
  const fraction=demo?clamp01(demoKm/demoTotalKm):
   (liveFrame?clamp01(liveFrame.distanceMeters/liveFrame.totalMeters):0);
  const targetX=profileMinX+(profileMaxX-profileMinX)*fraction;
  // Invert the authored profile's path length to find X at a real
  // distance fraction. Elevation changes never accelerate the marker.
  const pathLength=path.getTotalLength();
  const atProfileX=(x:number)=>{
   let lo=0,hi=pathLength;
   for(let i=0;i<22;i++){
    const mid=(lo+hi)/2;
    if(path.getPointAtLength(mid).x<x)lo=mid;else hi=mid;
   }
   return path.getPointAtLength((lo+hi)/2);
  };
  const point=atProfileX(targetX);
  const guide=svg.querySelector<SVGLineElement>('line.st1,line.st25');
  const rider=svg.querySelector<SVGCircleElement>('circle.st30,circle.st45');
  const baseline=svg.querySelector<SVGCircleElement>('circle.st38');
  const you=Array.from(svg.querySelectorAll<SVGTextElement>('text'))
   .find(el=>el.textContent?.trim()==='YOU');
  if(guide){guide.setAttribute('x1',String(point.x));guide.setAttribute('x2',String(point.x));}
  if(rider){rider.setAttribute('cx',String(point.x));rider.setAttribute('cy',String(point.y));}
  if(baseline)baseline.setAttribute('cx',String(392+(1485-392)*fraction));
  if(you)you.setAttribute('transform','translate('+Math.max(382,Math.min(1475,point.x-17.1)).toFixed(1)+' 519)');
  // Actual rides use the original route grade (never the rendered pixels).
  // In the no-trainer demo, sample the ORIGINAL unquantized Illustrator
  // curve over a continuous 80px span. The moving-average slope stays
  // smooth even as the display steps up and down in six-pixel increments.
  const smoothGradient=()=>{
   const source=svg.querySelector<SVGPathElement>('#pk-smooth-profile-source');
   if(!source)return null;
   const length=source.getTotalLength();
   if(length<=0)return null;
   const smoothYAt=(x:number)=>{
    let lo=0,hi=length;
    for(let i=0;i<22;i++){
     const mid=(lo+hi)/2;
     if(source.getPointAtLength(mid).x<x)lo=mid;else hi=mid;
    }
    return source.getPointAtLength((lo+hi)/2).y;
   };
   const beforeX=Math.max(profileMinX,targetX-40);
   const afterX=Math.min(profileMaxX,targetX+40);
   const slope=-(smoothYAt(afterX)-smoothYAt(beforeX))/Math.max(1,afterX-beforeX)*14;
   return Math.max(-15,Math.min(15,slope));
  };
  const gradient=demo?smoothGradient():
   (liveFrame&&Number.isFinite(liveFrame.gradePercent)?liveFrame.gradePercent:null);
  let badge=svg.querySelector<SVGGElement>('#pk-rider-gradient');
  if(!badge){
   const ns='http://www.w3.org/2000/svg';
   badge=document.createElementNS(ns,'g');
   badge.setAttribute('id','pk-rider-gradient');
   badge.setAttribute('role','img');
   badge.setAttribute('pointer-events','none');
   const border=document.createElementNS(ns,'rect');
   border.setAttribute('width','140');
   border.setAttribute('height','49');
   border.setAttribute('rx','11');
   border.setAttribute('fill','#102f36');
   border.setAttribute('stroke','#ffc197');
   border.setAttribute('stroke-width','3');
   const label=document.createElementNS(ns,'text');
   label.setAttribute('x','70');
   label.setAttribute('y','35');
   label.setAttribute('text-anchor','middle');
   label.setAttribute('font-family','Courier New, monospace');
   label.setAttribute('font-size','32');
   label.setAttribute('font-weight','800');
   label.setAttribute('letter-spacing','1');
   label.setAttribute('fill','#fff0d4');
   badge.append(border,label);
   svg.appendChild(badge);
  }
  const percentage=gradient===null?'—%':(Math.abs(gradient)<0.05?0:gradient).toFixed(1)+'%';
  const label=badge.querySelector<SVGTextElement>('text');
  if(label){
   label.textContent=percentage;
   label.setAttribute('font-size',percentage.length>5?'27':'32');
  }
  badge.setAttribute('aria-label','Current gradient '+percentage);
  // Reference placement: below and just left of YOU. Clamp to the SVG
  // graph so neither steep climbs nor the last kilometers clip the badge.
  const pillX=Math.max(376,Math.min(1370,point.x-155));
  const pillY=Math.max(527,Math.min(662,point.y+40));
  badge.setAttribute('transform','translate('+pillX.toFixed(1)+' '+pillY.toFixed(1)+')');
  const totalKm=demo?demoTotalKm:(liveFrame?.totalMeters||25000)/1000;
  const distanceKm=demo?demoKm:(liveFrame?.distanceMeters||0)/1000;
  if(distanceText)distanceText.textContent=distanceKm.toFixed(1)+' / '+totalKm.toFixed(1)+' km';
  if(elapsedText&&demo)elapsedText.textContent='0:'+String(Math.floor(demoKm/demoTotalKm*80/60)).padStart(2,'0')+':'+String(Math.floor(demoKm/demoTotalKm*80)%60).padStart(2,'0');
  if(profileSeek&&document.activeElement!==profileSeek)profileSeek.value=String(Math.round(fraction*1000));
  if(profileStatus)profileStatus.textContent=distanceKm.toFixed(1)+' / '+totalKm.toFixed(1)+' km · '+(demoPlaying?'Fast-forward preview':'Paused');
 }
 function updateProfileControls(){
  if(profileBar)profileBar.hidden=stageName!=='explore';
  if(profileToggle)profileToggle.textContent=demoPlaying?'Pause preview':'Play preview';
 }
 function beginEncounter(){
  if(stageName==='encounter')return;
  currentSpecies=demo?nextPreviewSpokemon(encounterCount):choosePineForestSpokemon();
  encounterCount++;
  demoOutcomeIsEscape=demo&&encounterCount%4===0;
  stageName='encounter';trust=0;patience=48;outcome=null;
  resolveAfter=0;lastEncounterTick=0;
  render();
 }
 function closeEncounter(){
  stageName='explore';
  nextEncounterKm=demoKm+2.15;
  resolveAfter=0;
  lastEncounterTick=0;
  render();
 }
 function animateDemo(now:number){
  if(!active()){demoAnimationFrame=0;previousAnimationAt=0;return;}
  if(previousAnimationAt>0&&demoPlaying){
   const delta=Math.min(100,Math.max(0,now-previousAnimationAt));
   // Entire 25 km illustrated profile takes 80 seconds in fast-forward.
   demoKm=Math.min(demoTotalKm,demoKm+demoTotalKm*delta/80000);
   if(demoKm>=demoTotalKm){
    // Loop this no-trainer story preview so all twelve encounter concepts
    // can eventually appear instead of stopping at a static end screen.
    if(playingPreview){demoKm=0;nextEncounterKm=1.35;}
    else demoPlaying=false;
   }
   if(playingPreview&&stageName==='explore'&&demoKm>=nextEncounterKm)beginEncounter();
   paintRiderOnProfile();
   updateProfileControls();
  }
  previousAnimationAt=now;
  demoAnimationFrame=requestAnimationFrame(animateDemo);
 }
 if(profileToggle)profileToggle.addEventListener('click',()=>{
  if(demoKm>=demoTotalKm)demoKm=0;
  demoPlaying=!demoPlaying;
  previousAnimationAt=0;
  updateProfileControls();paintRiderOnProfile();
 });
 if(profileSeek)profileSeek.addEventListener('input',()=>{
  demoKm=demoTotalKm*Number(profileSeek.value)/1000;
  demoPlaying=false;
  previousAnimationAt=0;
  updateProfileControls();paintRiderOnProfile();
 });
 window.addEventListener('pedalkin:ride-frame',(event:Event)=>{
  const frame=(event as CustomEvent<PedalkinRideFrame>).detail;
  if(exactArtwork){if(frame&&Array.isArray(frame.samples))playable?.setFrame(frame as SpokemonRideTelemetry);return;}
  if(demo||!frame||!Number.isFinite(frame.totalMeters)||frame.totalMeters<=0||!Array.isArray(frame.samples))return;
  liveFrame=frame;
  if(!active()||stageName!=='explore')return;
  paintRealElevation(frame);
  paintRiderOnProfile();
 });
 /**
  * Encounter and Exploration were exported from independent Illustrator
  * artboards. Their shared chrome is offset by 2–4.2 Illustrator units.
  * Reconcile only the shared chrome at runtime; never rescale either screen,
  * touch creature placement / forest art, or rewrite the user's SVG files.
  *
  * Measured reference: Exploration left panels y=95, right y=98.2,
  * bottom y=836.2, logo y=21.5. Encounter: 93, 95.2, 832, 17.6.
  */
 function render(onReady?:()=>void){
  if(exactArtwork){
   // A real <img> is deliberate: inline SVG inherited Minecraft/global CSS,
   // and the old render logic shifted elements, rewrote text, modified elevation
   // paths, and injected creatures. An image of the supplied SVG changes NONE
   // of its authored content. It scales as one 1920x1080 artboard only.
   const artwork=slot.querySelector<HTMLObjectElement>('object.pk-exact-artboard');
   if(artwork?.dataset.artboard===stageName){playable?.paint();onReady?.();return;}
   // Keep the original uploaded SVG as an isolated same-origin document.
   // Updating its native text elements retains the exact Illustrator fonts
   // and positioning, and avoids duplicate numbers painted over old values.
   const untouched=document.createElement('object');
   untouched.className='pk-exact-artboard';
   untouched.dataset.artboard=stageName;
   untouched.type='image/svg+xml';
   untouched.data=svgUrl(stageName);
   untouched.setAttribute('aria-label','Original Spokemon '+(stageName==='explore'?'Explore':'Encounter')+' Illustrator screen');
   untouched.addEventListener('load',()=>{
    // Illustrator uses font-family: Minecraft, but does not embed its TTF.
    // An external SVG document cannot inherit @font-face from the page.
    const child=untouched.contentDocument;
    const svg=child?.documentElement;
    if(svg?.localName==='svg'&&!svg.querySelector('#pk-minecraft-font')){
     let source='';
     for(const sheet of Array.from(document.styleSheets)){
      try{
       for(const rule of Array.from(sheet.cssRules)){
        if(rule.type!==CSSRule.FONT_FACE_RULE)continue;
        const face=rule as CSSFontFaceRule;
        if(!face.style.fontFamily.includes('Spokemon Minecraft'))continue;
        source=face.style.getPropertyValue('src');
        if(source)break;
       }
      }catch{/* external stylesheets may be restricted */}
      if(source)break;
     }
     if(source){
      const style=child!.createElementNS('http://www.w3.org/2000/svg','style');
      style.id='pk-minecraft-font';
      style.textContent='@font-face{font-family:Minecraft;src:'+source+';font-display:swap;}';
      svg.querySelector('defs')?.appendChild(style) || svg.insertBefore(style,svg.firstChild);
     }
    }
    playable?.paint();
    onReady?.();
   });
   slot.replaceChildren(untouched);
   if(stageName==='encounter'){
    // Show one existing, original Pine Forest Spokemon without changing a
    // single pixel in the user's encounter.svg file. Render the temporary
    // Mossprout artwork as a separate transparent 460x370 layer positioned
    // at the exact creature slot (x=730, y=355) from the Illustrator canvas.
    const sprite=document.createElementNS('http://www.w3.org/2000/svg','svg');
    sprite.classList.add('pk-encounter-preview-creature');
    sprite.setAttribute('viewBox','730 355 460 370');
    sprite.setAttribute('preserveAspectRatio','xMidYMid meet');
    sprite.setAttribute('role','img');
    sprite.setAttribute('aria-label',currentSpecies.name+' — example Spokemon placement');
    sprite.setAttribute('shape-rendering','crispEdges');
    addWorkingCreatureSilhouette(sprite,currentSpecies);
    sprite.querySelector('#pk-working-creature > text')?.remove();
    slot.appendChild(sprite);
   }
   playable?.paint();
   return;
  }
  if(explored===null||encounterSvg===null){slot.textContent='Pedalkin artwork is loading…';return;}
  // Render SVG as live vector DOM so its text can update from trainer data.
  const parser=new DOMParser();
  const root=parser.parseFromString(stageName==='explore'?explored:encounterSvg,'image/svg+xml').documentElement;
  // Illustrator exported a second set of POWER / CADENCE / SPEED / GRADE
  // labels at x=2013, outside the 1920px artboard. Remove those only,
  // preserving the four legitimate metric panels at x=52.
  root.querySelectorAll<SVGTextElement>('text[transform^="translate(2013 "]')
   .forEach(node=>node.parentElement?.remove());
  slot.replaceChildren(document.importNode(root,true));
  const svg=slot.querySelector<SVGSVGElement>('svg');
  // Use the supplied artboards without shifting any original SVG geometry.
  const tspans=Array.from(svg?.querySelectorAll<SVGTSpanElement>('tspan')||[]);
  distanceText=tspans.find(el=>el.textContent?.trim()==='8.4 / 25.0 km')||null;
  elapsedText=tspans.find(el=>el.textContent?.trim()==='1:23:47')||null;
  if(stageName==='explore'){
   paintRealElevation(!demo?liveFrame:null);
   paintRiderOnProfile();
  }else if(svg){
   // Future species will replace this temporary visual with approved art.
   addWorkingCreatureSilhouette(svg,currentSpecies);
   const ns='http://www.w3.org/2000/svg';
   const rarityLabel=document.createElementNS(ns,'text');
   rarityLabel.setAttribute('id','pk-creature-rarity');
   rarityLabel.setAttribute('x','960');rarityLabel.setAttribute('y','348');
   rarityLabel.setAttribute('text-anchor','middle');
   rarityLabel.setAttribute('font-family','Courier New,monospace');
   rarityLabel.setAttribute('font-size','19');rarityLabel.setAttribute('font-weight','bold');
   rarityLabel.setAttribute('fill','#fbe6c6');
   svg.append(rarityLabel);
  }
  updateProfileControls();
  updateCapture();
  // The Explore and Encounter artboards both show Trust. Keep it in sync.
  if(stageName==='explore'){
   updateText('48%',Math.round(trust)+'%');
   const bar=svg?.querySelector<SVGRectElement>('rect[x="1592.9"][y="199.3"]');
   if(bar)bar.setAttribute('width',(288.75*Math.max(0,Math.min(100,trust))/100).toFixed(2));
  }
  updateActualReadouts();
  host.querySelectorAll<HTMLButtonElement>('[data-pk-demo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pkDemo===stageName)));
 }
 function show(which:'explore'|'encounter'){
  if(which==='encounter'){
   stageName='explore';
   beginEncounter();
  }else{
   stageName='explore';trust=0;patience=48;outcome=null;render();
  }
 }
 function pedal(seconds:number){
  if(stageName!=='encounter'||outcome)return;
  trust=Math.min(100,trust+seconds*2.8);
  patience=Math.max(0,patience-seconds);
  if(trust>=100)outcome='captured';
  else if(patience===0)outcome='escaped';
  render();
 }
 function popupOpen(title:string,body:string){
  popup.querySelector('.pk-popup-title')!.textContent=title;
  popup.querySelector('.pk-popup-body')!.textContent=body;
  popup.hidden=false;
  dismiss.focus();
 }
 function triggerNavigation(target:'route'|'devices'|'ride'|'overlay'){
  if(target==='overlay'){
   // The same native always-on-top command used by Classic and Survival.
   // Mobile browsers may not support Document Picture-in-Picture.
   if(!window.breakawayDesktop&&!('documentPictureInPicture' in window)){
    popupOpen('ALWAYS-ON-TOP OVERLAY','The separate overlay requires desktop Chrome, Edge, or the Breakaway desktop app. This browser cannot open an always-on-top window.');
    return;
   }
   (document.getElementById('nativeProfile') as HTMLButtonElement|null)?.click();
   return;
  }
  const id=target==='route'?'stepRoute':target==='devices'?'stepSetup':'stepRide';
  (document.getElementById(id) as HTMLButtonElement|null)?.click();
 }
 navButtons.forEach(button=>button.addEventListener('click',()=>{
  const target=button.dataset.pkNav as 'route'|'devices'|'ride'|'overlay'|undefined;
  if(target)triggerNavigation(target);
 }));
 // Screen switching remains available without placing new UI over artboards.
 if(exactArtwork)window.addEventListener('keydown',event=>{
  if(!active()||event.ctrlKey||event.altKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes((event.target as HTMLElement|null)?.tagName||''))return;
  if(event.key==='1')triggerNavigation('route');
  else if(event.key==='2')triggerNavigation('devices');
  else if(event.key==='e'||event.key==='E')show('encounter');
  else if(event.key==='x'||event.key==='X')show('explore');
 });
 dismiss.onclick=()=>{popup.hidden=true};
 popup.addEventListener('click',e=>{if(e.target===popup)popup.hidden=true});
 host.querySelectorAll<HTMLButtonElement>('[data-pk-demo]').forEach(button=>{
  button.addEventListener('click',()=>{
   const action=button.dataset.pkDemo;
   if(action==='explore'||action==='encounter')show(action);
   if(action==='pedal')pedal(15);
   if(action==='escape'){patience=0;outcome='escaped';render();}
   if(action==='reset'){demoKm=0;demoPlaying=true;previousAnimationAt=0;encounterCount=0;nextEncounterKm=1.35;show('explore');}
  });
 });
 host.querySelectorAll<HTMLButtonElement>('[data-pk-action]').forEach(button=>button.addEventListener('click',()=>{
  switch(button.dataset.pkAction){
   case 'journal':popupOpen('SPOKEMON JOURNAL',exactArtwork?(playable?.getCollection().map(c=>c.name+' ×'+c.count).join('\n')||'No Spokemon collected yet.'):PINE_FOREST_SPOKEMON.map((c,i)=>(i+1)+'. '+c.name).join('\n'));break;
   case 'buddy':popupOpen('YOUR BUDDY',exactArtwork?(playable?.getCollection()[0]?.name||'Befriend your first Spokemon to choose a companion.'):'Companionship 12.');break;
   case 'stats':popupOpen('RIDE STATS',exactArtwork?'Distance: '+(document.getElementById('distance')?.textContent||'0')+' miles\nPower: '+(document.getElementById('power')?.textContent||'—')+' W\nCollected: '+(playable?.getCollection().length||0):'Legacy preview state');break;
   case 'save':
    if(exactArtwork){
     if(!playable){popupOpen('SAVE & CLOSE','Game is loading.');break;}
     finishThroughNative();break;
    }
    if(demo){(document.getElementById('stepRoute') as HTMLButtonElement|null)?.click();break;}
    popupOpen('SAVE & CLOSE','Use the existing Finish Ride control to save your ride; this preview does not auto-finish it.');break;
  }
 }));
 function finishThroughNative(){
  const finish=document.getElementById('rideFinishNow') as HTMLButtonElement|null;
  // Only real recorded rides have an available native Finish button.
  // The old handler hid the Spokemon viewport even if no ride existed,
  // exposing the legacy Survival-themed #screenRide underneath.
  if(finish&&!finish.hidden&&!finish.disabled){
   // Keep Spokemon visible; the native dialog and summary are now stacked
   // above the artboard, and Keep Riding simply closes the native dialog.
   finish.click();
   return;
  }
  // No native activity exists: creature catches already persist locally.
  // End a trainer-free test and return to Spokemon's OWN 01 Route screen.
  playable?.stopTestRide();
  stageName='explore';
  popup.hidden=true;
  triggerNavigation('route');
 }
 function changeSpokemonScene(which:'explore'|'encounter',species?:SpokemonSpecies){
  if(stageName===which||classicWipe?.isRunning())return;
  if(!exactArtwork||!classicWipe){
   stageName=which;if(species)currentSpecies=species;render();return;
  }
  classicWipe.transition(()=>new Promise<void>(resolve=>{
   stageName=which;
   if(species)currentSpecies=species;
   // Resolve on actual same-origin SVG object load, after live values paint.
   render(resolve);
  }));
 }
 if(exactArtwork)classicWipe=createSpokemonClassicWipe({
  stage,onDone:()=>playable?.paint()
 });
 if(exactArtwork)playable=mountSpokemonPlayable({
  host,slot,active,getScene:()=>stageName,
  switchScene:changeSpokemonScene,
  isTransitioning:()=>classicWipe?.isRunning()===true,
  canPaintDuringTransition:()=>classicWipe?.hasSwapped()===true,
  onFinishRide:finishThroughNative,
  onCollection:(items)=>popupOpen('YOUR COLLECTION',items.length?items.map(c=>c.name+' ×'+c.count).join('\n')+'\n\n'+items.length+' of '+PINE_FOREST_SPOKEMON.length+' species discovered.':'No Spokemon collected yet. Keep riding to find a friend.')
 });
 function sync(){
  const on=active();host.hidden=!on;
  document.body.classList.toggle('pk-riding',on);
  if(on){
   if(exactArtwork)render();
   else void loadArt().then(()=>render()).catch(error=>{slot.textContent='Unable to load Pedalkin artboards';console.error(error);});
   if(demo&&!demoAnimationFrame)demoAnimationFrame=requestAnimationFrame(animateDemo);
  }
 }
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 window.setInterval(()=>{
  if(!active()||exactArtwork)return;
  if(stageName==='encounter'&&demo){
   if(!outcome){
    // The full-screen showcase simulates calm Zone 2 progress for preview
    // only. Every fourth encounter demonstrates an escape. Real capture
    // behavior will be wired to measured power/cadence separately.
    if(demoOutcomeIsEscape&&playingPreview){
     patience=Math.max(0,patience-9);
     trust=Math.max(0,trust-1);
    }else{
     patience=Math.max(0,patience-3);
     trust=Math.min(100,trust+14);
    }
    if(trust>=100)outcome='captured';
    else if(patience<=0)outcome='escaped';
    if(outcome)resolveAfter=Date.now()+2100;
    render();
   }else if(playingPreview&&Date.now()>=resolveAfter){
    closeEncounter();
   }
  }else{lastEncounterTick=0;updateActualReadouts();}
 },1000);
 sync();
}
