import './pedalkin-ride.css';

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
 const demo=['route','setup','ride','encounter','explore'].includes(previewChoice||'');
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
   ${demo?'<div class="pk-demo-bar"><strong>DESIGN PLAYTEST · NO TRAINER / NO RECORDED RIDE</strong><div class="pk-demo-buttons"><button type="button" data-pk-demo="explore">Exploration</button><button type="button" data-pk-demo="encounter">Encounter</button><button type="button" data-pk-demo="pedal">Pedal 15 seconds</button><button type="button" data-pk-demo="escape">Let escape</button><button type="button" data-pk-demo="reset">Reset</button></div></div>':''}
   ${demo?'<div class="pk-profile-bar"><button type="button" data-pk-profile="toggle">Pause preview</button><input type="range" data-pk-profile="seek" min="0" max="1000" value="0" aria-label="Preview rider position along elevation profile"/><span class="pk-profile-status">0.0 / 25.0 km · Fast-forward playtest</span></div>':''}
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
  updateText('48%',Math.max(0,Math.round(wildness))+'%');
  updateText('48 s',Math.max(0,Math.round(patience))+' s');
  // The exact author artboard stays intact; change only two bar widths.
  const svg=slot.querySelector('svg');
  const colored=Array.from(svg?.querySelectorAll<SVGRectElement>('rect')||[]);
  const red=colored.find(el=>el.getAttribute('fill')==='#cf716e' || el.classList.contains('st7') || el.classList.contains('st8'));
  if(red){const original=Number(red.dataset.pkFullWidth||red.getAttribute('width')||0);if(!red.dataset.pkFullWidth)red.dataset.pkFullWidth=String(original); if(original>40&&original<260)red.setAttribute('width',String(original*Math.max(0,wildness)/48));}
  if(outcome==='captured'){
    updateText('A wild Mossprout appeared!','The crab joined your collection!');
    updateText('Keep a steady pace to calm it down.','What a wonderful new friend!');
  }else if(outcome==='escaped'){
    updateText('A wild Mossprout appeared!','The crab wandered away.');
    updateText('Keep a steady pace to calm it down.','Keep riding to discover another.');
  }
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
 function animateDemo(now:number){
  if(!active()){demoAnimationFrame=0;previousAnimationAt=0;return;}
  if(previousAnimationAt>0&&demoPlaying){
   const delta=Math.min(100,Math.max(0,now-previousAnimationAt));
   // Entire 25 km illustrated profile takes 80 seconds in fast-forward.
   demoKm=Math.min(demoTotalKm,demoKm+demoTotalKm*delta/80000);
   if(demoKm>=demoTotalKm)demoPlaying=false;
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
 function render(){
  if(explored===null||encounterSvg===null){slot.textContent='Pedalkin artwork is loading…';return;}
  // Render SVG as live vector DOM so its text can update from trainer data.
  const parser=new DOMParser();
  const root=parser.parseFromString(stageName==='explore'?explored:encounterSvg,'image/svg+xml').documentElement;
  slot.replaceChildren(document.importNode(root,true));
  const svg=slot.querySelector('svg');
  const tspans=Array.from(svg?.querySelectorAll<SVGTSpanElement>('tspan')||[]);
  distanceText=tspans.find(el=>el.textContent?.trim()==='8.4 / 25.0 km')||null;
  elapsedText=tspans.find(el=>el.textContent?.trim()==='1:23:47')||null;
  if(stageName==='explore'){
   if(!demo&&liveFrame)paintRealElevation(liveFrame);
   paintRiderOnProfile();
  }
  updateProfileControls();
  updateCapture();
  updateActualReadouts();
  host.querySelectorAll<HTMLButtonElement>('[data-pk-demo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pkDemo===stageName)));
 }
 function show(which:'explore'|'encounter'){
  stageName=which;wildness=48;patience=48;outcome=null;render();
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
   if(action==='reset'){demoKm=0;demoPlaying=true;previousAnimationAt=0;show(stageName);}
  });
 });
 host.querySelectorAll<HTMLButtonElement>('[data-pk-action]').forEach(button=>button.addEventListener('click',()=>{
  switch(button.dataset.pkAction){
   case 'journal':popupOpen('CREATURE JOURNAL','A cozy home for your discovered Pedalkin. This first preview demonstrates the artwork and navigation.');break;
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
  if(stageName==='encounter'&&demo&&!outcome){
   const now=Date.now();
   if(lastEncounterTick>0&&now-lastEncounterTick>=1000){patience=Math.max(0,patience-1);if(!patience)outcome='escaped';render();}
   lastEncounterTick=now;
  }else{lastEncounterTick=0;updateActualReadouts();}
 },1000);
 sync();
}
