import './pedalkin-ride.css';
import {PINE_FOREST_SPOKEMON,choosePineForestSpokemon,nextPreviewSpokemon} from './pedalkin-creatures';
import type {SpokemonSpecies} from './pedalkin-creatures';
import {addWorkingCreatureSilhouette} from './pedalkin-creature-art';

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
 const playingPreview=previewChoice==='playing'||previewChoice==='encounters';
 const demo=playingPreview||['route','setup','ride','encounter','explore'].includes(previewChoice||'');
 // The full-screen gameplay view shows no developer controls, but the route
 // marker and illustrative data still animate without a trainer connection.
 const showPlaytestControls=demo&&!playingPreview;
 const host=document.createElement('section');
 host.className='pk-ride-host';
 host.hidden=true;
 host.setAttribute('aria-label','Pedalkin ride');
 host.innerHTML=`
   <header class="pk-ride-nav" aria-label="Pedalkin ride navigation">
     <span class="pk-ride-nav-name">SPOKEMON <small> / 03 RIDE</small></span>
     <nav class="pk-ride-tabs" aria-label="Ride navigation">
       <button type="button" data-pk-nav="route">01 ROUTE</button>
       <button type="button" data-pk-nav="devices">02 DEVICES</button>
       <button type="button" data-pk-nav="ride" aria-current="page">03 RIDE</button>
       <button type="button" data-pk-nav="overlay" aria-label="Open always-on-top overlay">OVERLAY ↗</button>
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
 ride.append(host);
 const slot=host.querySelector<HTMLElement>('.pk-svg-slot')!;
 const stage=host.querySelector<HTMLElement>('.pk-ride-stage')!;
 const popup=host.querySelector<HTMLElement>('.pk-popup')!;
 const dismiss=host.querySelector<HTMLButtonElement>('.pk-popup-dismiss')!;
 let explored:string|null=null;
 let encounterSvg:string|null=null;
 let stageName:'explore'|'encounter'=previewChoice==='encounter'?'encounter':'explore';
 let wildness=48;
 let patience=48;
 let outcome:'captured'|'escaped'|null=null;
 let lastEncounterTick=0;
 let currentSpecies:SpokemonSpecies=nextPreviewSpokemon(0);
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
  updateText('48%',Math.max(0,Math.round(wildness))+'%');
  updateText('48 s',Math.max(0,Math.round(patience))+' s');
  const svg=slot.querySelector('svg');
  // Preserve Illustrator geometry and update only the visible fill length.
  const colored=Array.from(svg?.querySelectorAll<SVGRectElement>('rect')||[]);
  const red=colored.find(el=>el.getAttribute('fill')==='#cf716e'||el.classList.contains('st7')||el.classList.contains('st8'));
  if(red){
   const original=Number(red.dataset.pkFullWidth||red.getAttribute('width')||0);
   if(!red.dataset.pkFullWidth)red.dataset.pkFullWidth=String(original);
   if(original>40&&original<260)red.setAttribute('width',String(original*Math.max(0,wildness)/48));
  }
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
 function paintRealElevation(frame:PedalkinRideFrame){
  if(stageName!=='explore')return;
  const path=slot.querySelector<SVGPathElement>('svg path.st32');
  const valid=frame.samples.filter(Number.isFinite);
  if(!path||valid.length<2)return;
  const low=Math.min(...valid),high=Math.max(...valid),range=Math.max(0.5,high-low);
  const d=valid.map((e,i)=>{
   const x=profileMinX+(profileMaxX-profileMinX)*i/(valid.length-1);
   const y=683-(e-low)/range*167;
   return (i===0?'M':'L')+x.toFixed(2)+','+y.toFixed(2);
  }).join(' ');
  path.setAttribute('d',d);
 }
 function paintRiderOnProfile(){
  if(stageName!=='explore')return;
  const svg=slot.querySelector('svg');
  const path=svg?.querySelector<SVGPathElement>('path.st32');
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
  const guide=svg.querySelector<SVGLineElement>('line.st25');
  const rider=svg.querySelector<SVGCircleElement>('circle.st45');
  const baseline=svg.querySelector<SVGCircleElement>('circle.st38');
  const you=Array.from(svg.querySelectorAll<SVGTextElement>('text'))
   .find(el=>el.textContent?.trim()==='YOU');
  if(guide){guide.setAttribute('x1',String(point.x));guide.setAttribute('x2',String(point.x));}
  if(rider){rider.setAttribute('cx',String(point.x));rider.setAttribute('cy',String(point.y));}
  if(baseline)baseline.setAttribute('cx',String(392+(1485-392)*fraction));
  if(you)you.setAttribute('transform','translate('+Math.max(382,Math.min(1475,point.x-17.1)).toFixed(1)+' 519)');
  // In a real ride use Breakaway's actual instantaneous route grade.
  // The playtest instead estimates a *visual* gradient from the supplied
  // sample illustration; it is not presented as recorded ride data.
  const left=atProfileX(Math.max(profileMinX,targetX-14));
  const right=atProfileX(Math.min(profileMaxX,targetX+14));
  const visualGrade=-(right.y-left.y)/Math.max(1,right.x-left.x)*6.5;
  const gradient=demo?Math.max(-15,Math.min(15,visualGrade)):
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
  stageName='encounter';wildness=48;patience=48;outcome=null;
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
 function alignEncounterChrome(svg:SVGSVGElement){
  if(stageName!=='encounter')return;
  const bounds=svg.getBoundingClientRect();
  if(bounds.width<=0||bounds.height<=0)return;
  const xFactor=1920/bounds.width,yFactor=1080/bounds.height;
  const artboardElements=svg.querySelectorAll<SVGGraphicsElement>('rect,path,line,circle,ellipse,polygon,polyline,image,text');
  artboardElements.forEach(el=>{
   // Bounding client boxes include Illustrator text transforms, whereas
   // SVG getBBox() does not account for the text translate(...) position.
   const box=el.getBoundingClientRect();
   if(!box.width&&!box.height)return;
   const left=(box.left-bounds.left)*xFactor;
   const right=(box.right-bounds.left)*xFactor;
   const top=(box.top-bounds.top)*yFactor;
   const bottom=(box.bottom-bounds.top)*yFactor;
   let dx=0,dy=0;
   if(left>=0&&right<=350&&top>=80&&top<820){
    dy=2; // power, heart rate, cadence, speed, grade, calories
   }else if(left>=1540&&right<=1918&&top>=80&&top<820){
    dy=3; // wildness/distance, patience/time, biome and buddy panels
   }else if(left>=720&&right<=1210&&top>=12&&bottom<=110){
    dy=3.9; // center SPOKEMON wordmark and its outlined pill
   }else if(left>=0&&right<=1910&&top>=819){
    dy=4.2; // two bottom boxes, all dialogue/menu labels and contents
    if(el.tagName.toLowerCase()==='text'&&left>=45&&left<1290)dx=-12;
   }
   if(!dx&&!dy)return;
   // Translate leaf objects in place to preserve their layer/z-order and
   // Illustrator grouping. The existing transform must remain intact.
   const existing=el.getAttribute('transform')||'';
   el.setAttribute('transform',`translate(${dx} ${dy}) ${existing}`.trim());
  });
  // Encounter's bottom boxes are 224 high; Exploration's are 219.8.
  // Shift their top edge down 4.2 while retaining an identical bottom edge.
  svg.querySelectorAll<SVGRectElement>('rect[x="24"][y="832"][width="1272"],rect[x="1312"][y="832"][width="584"]')
   .forEach(panel=>panel.setAttribute('height','219.8'));
 }
 function render(){
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
  if(svg)alignEncounterChrome(svg);
  const tspans=Array.from(svg?.querySelectorAll<SVGTSpanElement>('tspan')||[]);
  distanceText=tspans.find(el=>el.textContent?.trim()==='8.4 / 25.0 km')||null;
  elapsedText=tspans.find(el=>el.textContent?.trim()==='1:23:47')||null;
  if(stageName==='explore'){
   if(!demo&&liveFrame)paintRealElevation(liveFrame);
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
  updateActualReadouts();
  host.querySelectorAll<HTMLButtonElement>('[data-pk-demo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pkDemo===stageName)));
 }
 function show(which:'explore'|'encounter'){
  if(which==='encounter'){
   stageName='explore';
   beginEncounter();
  }else{
   stageName='explore';wildness=48;patience=48;outcome=null;render();
  }
 }
 function pedal(seconds:number){
  if(stageName!=='encounter'||outcome)return;
  wildness=Math.max(0,wildness-seconds*1.55);
  patience=Math.max(0,patience-seconds);
  if(wildness===0)outcome='captured';
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
   case 'journal':popupOpen('PINE FOREST JOURNAL',PINE_FOREST_SPOKEMON.map((species,i)=>String(i+1).padStart(2,'0')+'  '+species.name+'  ·  '+species.rarity).join('\n')+'\n\nWorking names and temporary encounter art.');break;
   case 'buddy':popupOpen('YOUR BUDDY','Crab · companionship 12. Buddy management will live here.');break;
   case 'stats':popupOpen('RIDE STATS',demo?'Design playtest: these sample numbers are not ride data.':'Your real ride data continues to be recorded by Breakaway.');break;
   case 'save':
    if(demo){(document.getElementById('stepRoute') as HTMLButtonElement|null)?.click();break;}
    popupOpen('SAVE & CLOSE','Use the existing Finish Ride control to save your ride; this preview does not auto-finish it.');break;
  }
 }));
 function sync(){
  const on=active();host.hidden=!on;
  document.body.classList.toggle('pk-riding',on);
  if(on){
   void loadArt().then(render).catch(error=>{slot.textContent='Unable to load Pedalkin artboards';console.error(error);});
   if(demo&&!demoAnimationFrame)demoAnimationFrame=requestAnimationFrame(animateDemo);
  }
 }
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 window.setInterval(()=>{
  if(!active())return;
  if(stageName==='encounter'&&demo){
   if(!outcome){
    // The full-screen showcase simulates calm Zone 2 progress for preview
    // only. Every fourth encounter demonstrates an escape. Real capture
    // behavior will be wired to measured power/cadence separately.
    if(demoOutcomeIsEscape&&playingPreview){
     patience=Math.max(0,patience-9);
     wildness=Math.max(1,wildness-1);
    }else{
     patience=Math.max(0,patience-3);
     wildness=Math.max(0,wildness-10);
    }
    if(wildness<=0)outcome='captured';
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
