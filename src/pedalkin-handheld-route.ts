import './pedalkin-handheld-route.css';

/**
 * Version 2: the user's unredrawn 1920x1080 full handheld SVG is the visual
 * background. The real route engine remains the single source of truth:
 * controls are small synchronized proxies, never a second route generator.
 */
export function mountPedalkinHandheldRoute():void {
 const route=document.getElementById('screenRoute');
 if(!route)return;
 const get=(id:string)=>document.getElementById(id);
 const original={
  miles:get('generatedMiles') as HTMLInputElement|null,
  terrain:get('generatedTerrain') as HTMLSelectElement|null,
  gain:get('generatedGain') as HTMLInputElement|null,
  seed:get('generatedSeed') as HTMLInputElement|null,
  lock:get('lockGeneratedSeed') as HTMLInputElement|null,
  gpx:get('gpx') as HTMLInputElement|null,
  generate:get('generateRoute') as HTMLButtonElement|null,
  surprise:get('surpriseRoute') as HTMLButtonElement|null,
  endless:get('endlessRoute') as HTMLButtonElement|null,
  next:get('enjoyRide') as HTMLButtonElement|null,
  chart:get('studioLiveChart') as HTMLElement|null
 };
 if(Object.values(original).some(x=>!x))return;
 const shell=document.createElement('section');
 shell.className='pk-v2-shell';
 shell.hidden=true;
 shell.setAttribute('aria-label','Pedalkin Route Maker — handheld game screen');
 shell.innerHTML=`
  <div class="pk-v2-stage">
   <img class="pk-v2-art" src="/pedalkin/route-v2.svg" alt="Pedalkin handheld console artwork, based exactly on the uploaded Illustrator file" draggable="false"/>
   <div class="pk-v2-live">
    <input class="pk-v2-miles" type="number" step="any" min="0.01" aria-label="Distance (miles)"/>
    <select class="pk-v2-biome" aria-label="Biome / terrain"></select>
    <input class="pk-v2-gain" type="number" step="1" min="0" placeholder="Natural terrain" aria-label="Total elevation gain (feet)"/>
    <input class="pk-v2-seed" type="number" step="1" min="1" max="1000000000" placeholder="Auto" aria-label="Route seed"/>
    <input class="pk-v2-lock" type="checkbox" aria-label="Lock route seed"/>
    <div class="pk-v2-route-stats" aria-live="polite">
      <div>Distance: <b data-pk-stat="miles">—</b></div>
      <div>Elevation gain: <b data-pk-stat="gain">—</b></div>
      <div>Terrain: <b data-pk-stat="terrain">—</b></div>
      <div>Est. Time: <b data-pk-stat="time">—</b></div>
      <div>Steepest Grade: <b data-pk-stat="grade">—</b></div>
    </div>
    <div class="pk-v2-live-chart" role="img" aria-label="Live generated route elevation profile"></div>
    <div class="pk-v2-scrub" aria-live="polite"></div>
    <button class="pk-v2-hit pk-v2-upload" type="button" aria-label="Upload GPX or TCX route"></button>
    <button class="pk-v2-hit pk-v2-generate" type="button" aria-label="Generate route"></button>
    <button class="pk-v2-hit pk-v2-surprise" type="button" aria-label="Surprise me with a route"></button>
    <button class="pk-v2-hit pk-v2-endless" type="button" aria-label="Start endless route"></button>
    <button class="pk-v2-hit pk-v2-recovery" type="button" aria-label="Quick start: Recovery 30"></button>
    <button class="pk-v2-hit pk-v2-rolling" type="button" aria-label="Quick start: Rolling 45"></button>
    <button class="pk-v2-hit pk-v2-climbing" type="button" aria-label="Quick start: Climbing 60"></button>
    <button class="pk-v2-hit pk-v2-next" type="button" aria-label="Ready for your adventure? Connect trainer"></button>
    <button class="pk-v2-hit pk-v2-nav-route" type="button" aria-label="01 Route (current)" aria-current="page"></button>
    <button class="pk-v2-hit pk-v2-nav-devices" type="button" aria-label="02 Devices"></button>
    <button class="pk-v2-hit pk-v2-nav-ride" type="button" aria-label="03 Ride"></button>
    <button class="pk-v2-hit pk-v2-nav-overlay" type="button" aria-label="Open the always-on-top overlay"></button>
    <button class="pk-v2-hit pk-v2-pad-a" type="button" aria-label="Handheld A: Generate route"></button>
    <button class="pk-v2-hit pk-v2-pad-b" type="button" aria-label="Handheld B: Surprise Me"></button>
    <button class="pk-v2-hit pk-v2-pad-x" type="button" aria-label="Handheld X: Endless Route"></button>
    <button class="pk-v2-hit pk-v2-pad-y" type="button" aria-label="Handheld Y: Connect devices"></button>
   </div>
  </div>`;
 route.append(shell);
 const at=<T extends Element=HTMLElement>(selector:string)=>shell.querySelector<T>(selector)!;
 const fields=[
  {proxy:at<HTMLInputElement>('.pk-v2-miles'),real:original.miles!},
  {proxy:at<HTMLSelectElement>('.pk-v2-biome'),real:original.terrain!},
  {proxy:at<HTMLInputElement>('.pk-v2-gain'),real:original.gain!},
  {proxy:at<HTMLInputElement>('.pk-v2-seed'),real:original.seed!},
  {proxy:at<HTMLInputElement>('.pk-v2-lock'),real:original.lock!}
 ];
 const select=fields[1].proxy as HTMLSelectElement;
 for(const option of Array.from(original.terrain!.options)){
  const clone=document.createElement('option');
  clone.value=option.value;clone.textContent=option.textContent;
  select.add(clone);
 }
 function syncFields(){
  for(const {proxy,real} of fields){
   if(proxy===document.activeElement)continue;
   if(proxy instanceof HTMLInputElement&&proxy.type==='checkbox')proxy.checked=(real as HTMLInputElement).checked;
   else proxy.value=real.value;
  }
 }
 for(const {proxy,real} of fields){
  const change=()=>{
   if(proxy instanceof HTMLInputElement&&proxy.type==='checkbox')(real as HTMLInputElement).checked=proxy.checked;
   else real.value=proxy.value;
   real.dispatchEvent(new Event('input',{bubbles:true}));
   real.dispatchEvent(new Event('change',{bubbles:true}));
  };
  proxy.addEventListener('input',change);
  proxy.addEventListener('change',change);
  real.addEventListener('change',syncFields);
 }
 const doAction=(selector:string,real:HTMLElement|null)=>{
  at<HTMLButtonElement>(selector).addEventListener('click',()=>{
   real?.click();
   requestAnimationFrame(syncFields);
  });
 };
 doAction('.pk-v2-upload',original.gpx);
 doAction('.pk-v2-generate',original.generate);
 doAction('.pk-v2-surprise',original.surprise);
 doAction('.pk-v2-endless',original.endless);
 doAction('.pk-v2-next',original.next);
 doAction('.pk-v2-pad-a',original.generate);
 doAction('.pk-v2-pad-b',original.surprise);
 doAction('.pk-v2-pad-x',original.endless);
 doAction('.pk-v2-pad-y',get('stepSetup'));
 doAction('.pk-v2-nav-route',get('stepRoute'));
 doAction('.pk-v2-nav-devices',get('stepSetup'));
 doAction('.pk-v2-nav-ride',get('stepRide'));
 doAction('.pk-v2-nav-overlay',get('nativeProfile'));
 for(const [selector,preset] of [
  ['.pk-v2-recovery','.quick-preset-button:nth-of-type(1)'],
  ['.pk-v2-rolling','.quick-preset-button:nth-of-type(2)'],
  ['.pk-v2-climbing','.quick-preset-button:nth-of-type(3)']
 ]){
  at<HTMLButtonElement>(selector).addEventListener('click',()=>{
   // Click the real preset and allow its existing handler to update the route.
   const all=Array.from(document.querySelectorAll<HTMLButtonElement>('.quick-preset-button'));
   const index=['.pk-v2-recovery','.pk-v2-rolling','.pk-v2-climbing'].indexOf(selector);
   (all[index]||document.querySelector<HTMLButtonElement>(preset))?.click();
   requestAnimationFrame(syncFields);
  });
 }
 const labels=['studioPreviewMiles','studioPreviewGain','studioDifficulty','studioEstimatedTime','studioSteepestGrade'];
 const keys=['miles','gain','terrain','time','grade'];
 const stats=keys.map((key,i)=>({node:at<HTMLElement>('[data-pk-stat="'+key+'"]'),real:get(labels[i])}));
 const chartNode=at<HTMLElement>('.pk-v2-live-chart');
 const scrubNode=at<HTMLElement>('.pk-v2-scrub');
 function refreshVisual(){
  if(shell.hidden)return;
  for(const {node,real} of stats)node.textContent=real?.textContent?.trim()||'—';
  const chart=original.chart!.querySelector('svg');
  if(chart){
   const clone=chart.cloneNode(true) as SVGSVGElement;
   clone.setAttribute('preserveAspectRatio','none');
   clone.removeAttribute('style');
   chartNode.replaceChildren(clone);
  }
  const mile=get('studioScrubMiles')?.textContent?.trim()||'0.00 mi';
  const elev=get('studioScrubElevation')?.textContent?.trim()||'—';
  const grade=get('studioScrubGrade')?.textContent?.trim()||'—';
  scrubNode.textContent='At mile '+mile+' · Elevation '+elev+' · Gradient '+grade;
 }
 // When the engine regenerates a route, mirror the real chart and real stats.
 const chartObserver=new MutationObserver(refreshVisual);
 chartObserver.observe(original.chart!,{childList:true,subtree:true});
 for(const x of stats){if(x.real)chartObserver.observe(x.real,{childList:true,characterData:true,subtree:true});}
 function sync(){
  const active=document.body.dataset.rideExperience==='pedalkin'&&document.body.dataset.breakawayScreen==='route';
  shell.hidden=!active;
  document.body.classList.toggle('pk-v2-route-active',active);
  if(active){syncFields();refreshVisual();}
 }
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 sync();
}
