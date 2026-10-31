import './pedalkin-ride.css';

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
   ${demo?'<div class="pk-demo-bar"><strong>DESIGN PLAYTEST · NO TRAINER / NO RECORDED RIDE</strong><div class="pk-demo-buttons"><button type="button" data-pk-demo="explore">Exploration</button><button type="button" data-pk-demo="encounter">Encounter</button><button type="button" data-pk-demo="pedal">Pedal 15 seconds</button><button type="button" data-pk-demo="escape">Let escape</button><button type="button" data-pk-demo="reset">Reset</button></div></div>':''}
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
 function render(){
  if(explored===null||encounterSvg===null){slot.textContent='Pedalkin artwork is loading…';return;}
  // Render SVG as live vector DOM so its text can update from trainer data.
  const parser=new DOMParser();
  const root=parser.parseFromString(stageName==='explore'?explored:encounterSvg,'image/svg+xml').documentElement;
  slot.replaceChildren(document.importNode(root,true));
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
 dismiss.onclick=()=>{popup.hidden=true};
 popup.addEventListener('click',e=>{if(e.target===popup)popup.hidden=true});
 host.querySelectorAll<HTMLButtonElement>('[data-pk-demo]').forEach(button=>{
  button.addEventListener('click',()=>{
   const action=button.dataset.pkDemo;
   if(action==='explore'||action==='encounter')show(action);
   if(action==='pedal')pedal(15);
   if(action==='escape'){patience=0;outcome='escaped';render();}
   if(action==='reset')show(stageName);
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
