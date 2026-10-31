import './classic-route-reference.css';
import './classic-unified-header.css';
import './survival-route-reference.css';
import './survival-companion-preview.css';
import './survival-classic-color-baseline.css';
import './survival-re4-route.css';
import './survival-re4-companion.css';
import './classic-design-preview.css';

/** Reference route studio. Move the original controls so every existing listener stays attached. */
export function mountClassicRouteReference():void {
 const route=document.getElementById('screenRoute');
 const studio=document.getElementById('routeStudio');
 const builder=studio?.querySelector<HTMLElement>('.route-builder');
 const upload=studio?.querySelector<HTMLInputElement>('#gpx');
 const summary=studio?.querySelector<HTMLElement>('.route-studio-live-preview');
 const chart=studio?.querySelector<HTMLElement>('#studioLiveChart');
 const scrub=studio?.querySelector<HTMLElement>('.studio-scrub-readout');
 const edit=studio?.querySelector<HTMLElement>('.studio-elevation-controls');
 const next=studio?.querySelector<HTMLButtonElement>('#enjoyRide');
 if(!route||!studio||!builder||!upload||!summary||!chart||!scrub||!edit||!next)return;

 const shell=document.createElement('div');shell.className='cr-reference';
 shell.innerHTML='<div class="pk-classic-banner" hidden><span class="pk-banner-title">PEDALKIN</span><span class="pk-banner-subtitle">A LITTLE WONDER, EVERY MILE.</span><span class="pk-banner-detail">EXPLORE. RIDE. BEFRIEND.</span></div><button type="button" id="openBreakawayCoach" class="coach-classic-banner" aria-label="Train with Breakaway Coach — open structured training in Classic">'+
  '<span class="coach-banner-copy"><span class="coach-banner-eyebrow">BREAKAWAY COACH</span><span class="coach-banner-title">Train with Breakaway Coach</span>'+
  '<span class="coach-banner-description">Structured workouts, adaptive planning, and goal-based training for Classic mode.</span>'+
  '<span class="coach-banner-features"><span>Personalized plans</span><span>Structured workouts</span><span>Track progress</span><span>Reach your goals</span></span></span>'+
  '<span class="coach-banner-action"><span class="coach-banner-cta">OPEN COACH <span aria-hidden="true">→</span></span><span class="coach-banner-note">CLASSIC MODE ONLY</span></span></button>'+
  '<div class="cr-upload-row"><button type="button" class="cr-upload" aria-controls="gpx">Upload GPX Route</button></div><div class="sr-mode-row" hidden><span class="sr-mode-step" aria-hidden="true">1</span><div class="sr-mode-controls" role="group" aria-label="Survival game setup"></div></div><h1 class="cr-heading"><span aria-hidden="true">1</span>Create Your Route</h1><div class="cr-config"><div class="cr-controls"></div><div class="cr-summary"></div><div class="cr-actions"><div class="cr-tools"></div><div class="cr-callout"></div></div></div><div class="cr-profile"></div>';
 const uploadButton=shell.querySelector<HTMLButtonElement>('.cr-upload')!;
 uploadButton.addEventListener('click',()=>upload.click());
 upload.addEventListener('change',()=>{uploadButton.title=upload.files?.[0]?.name||'Upload a GPX or TCX route';});
 const controls=shell.querySelector<HTMLElement>('.cr-controls')!;
 const error=document.createElement('p');error.className='cr-error';error.hidden=true;error.setAttribute('role','alert');controls.append(error);
 const summaryHost=shell.querySelector<HTMLElement>('.cr-summary')!;
 const tools=shell.querySelector<HTMLElement>('.cr-tools')!;
 const callout=shell.querySelector<HTMLElement>('.cr-callout')!;
 const profile=shell.querySelector<HTMLElement>('.cr-profile')!;
 const survivalRow=shell.querySelector<HTMLElement>('.sr-mode-row')!;
 const survivalChoices=shell.querySelector<HTMLElement>('.sr-mode-controls')!;
 const survivalSelectIds=['studioChallenge','studioDifficulty','studioThreat'] as const;
 function syncSurvivalChoices(){
  survivalChoices.querySelectorAll<HTMLLabelElement>('label').forEach(label=>{
   const select=label.querySelector('select');
   if(select){
    const selected=select.selectedOptions[0]?.textContent?.trim()||'SELECT';
    label.title=selected;
    label.dataset.choice=selected;
   }
  });
 }
 const moves:{node:HTMLElement;home:Comment}[]=[];
 const copies:{node:HTMLElement;html:string}[]=[];
 function move(node:HTMLElement,to:HTMLElement){
  const home=document.createComment('classic-route-control-home');
  node.before(home);moves.push({node,home});to.append(node);
 }
 function copy(node:HTMLElement|null,text:string){
  if(!node)return;copies.push({node,html:node.innerHTML});node.textContent=text;
 }
 function editingLabel(){
  if(!document.body.classList.contains('cr-reference-mounted'))return;
  const button=document.getElementById('studioEditElevation');
  const text=chart!.classList.contains('editing')?'Done Editing':'Edit Elevation Manually';
  if(button&&button.textContent!==text)button.textContent=text;
 }
 function formatChart(){
  if(!document.body.classList.contains('cr-reference-mounted'))return;
  const svg=chart!.querySelector('svg');if(!svg)return;
  // The reference runs terrain to both edges and the bottom of the chart.
  svg.setAttribute('preserveAspectRatio','none');
  svg.setAttribute('viewBox','12 0 876 198');

 }
 function mount(){
  if(document.body.classList.contains('cr-reference-mounted'))return;
  document.body.classList.add('cr-reference-mounted');
  const isPedalkin=document.body.dataset.rideExperience==='pedalkin';
  const isSurvival=document.body.dataset.rideExperience==='survival';
  document.body.classList.toggle('pk-classic-reference',isPedalkin);
  const pedalkinBanner=shell.querySelector<HTMLElement>('.pk-classic-banner');
  if(pedalkinBanner)pedalkinBanner.hidden=!isPedalkin;
  document.body.classList.toggle('sr-reference-mounted',isSurvival);
  error.hidden=true;
  route!.append(shell);
  const survival=document.body.dataset.rideExperience==='survival';
  const coachBanner=shell.querySelector<HTMLButtonElement>('#openBreakawayCoach');
  if(coachBanner)coachBanner.hidden=survival||isPedalkin;
  survivalRow.hidden=!survival;
  if(survival){
   const prompts=['CHOOSE GAME MODE','CHOOSE DIFFICULTY','CHOOSE THREAT'];
   for(const [index,id] of survivalSelectIds.entries()){
    const select=document.getElementById(id);
    const label=select?.closest<HTMLElement>('label');
    if(label){label.dataset.prompt=prompts[index];move(label,survivalChoices);}
   }
   syncSurvivalChoices();
  }
  move(builder!,controls);move(summary!,summaryHost);move(edit!,tools);move(next!,callout);
  move(chart!,profile);move(scrub!,profile);
  copy(document.getElementById('generateRoute'),'Generate Route');
  copy(document.getElementById('surpriseRoute'),'Surprise Me!');
  copy(document.getElementById('endlessRoute'),'Endless Route');
  copies.push({node:next!,html:next!.innerHTML});
  next!.innerHTML='<span>Ready to Ride?</span><span>Connect Your Trainer!</span>';
  const note=scrub!.querySelector<HTMLElement>('.note');
  copy(note,survival?'drag the yellow line to preview your route':'drag the white line to preview your route');
  const step=summary!.querySelector<HTMLElement>('.route-step');copy(step,survival?'3':'2');
  const headingStep=shell.querySelector<HTMLElement>('.cr-heading>span');if(headingStep)headingStep.textContent=survival?'2':'1';
  copy(summary!.querySelector<HTMLElement>('h2'),'Your Route Preview');
  const statLabels=['Distance: ','Elevation gain: ','Terrain: ','Est. Time: ','Steepest Grade: '];
  summary!.querySelectorAll<HTMLElement>('.studio-live-stats>span').forEach((node,index)=>{
   const label=node.firstChild;
   if(label?.nodeType===Node.TEXT_NODE){statText.push({node:label,text:label.textContent||''});label.textContent=statLabels[index]||label.textContent;}
  });
  const gainLabel=document.getElementById('generatedGain')?.closest('label')?.firstChild;
  if(gainLabel?.nodeType===Node.TEXT_NODE){statText.push({node:gainLabel,text:gainLabel.textContent||''});gainLabel.textContent=isPedalkin?'Total Elevation':'Total elevation gain (feet)';}
  editingLabel();formatChart();
 }
 const statText:{node:Node;text:string}[]=[];
 function unmount(){
  if(!document.body.classList.contains('cr-reference-mounted'))return;
  document.body.classList.remove('cr-reference-mounted','sr-reference-mounted','pk-classic-reference');
  for(const {node,home} of moves.reverse()){home.replaceWith(node);}
  moves.length=0;
  for(const {node,html} of copies)node.innerHTML=html;
  copies.length=0;
  for(const item of statText)item.node.textContent=item.text;
  statText.length=0;
  const editButton=edit!.querySelector<HTMLButtonElement>('#studioEditElevation');
  if(editButton)editButton.textContent=chart!.classList.contains('editing')?'Done editing':'Edit elevation';
  const svg=chart!.querySelector('svg');
  if(svg){svg.querySelector('.cr-terrain')?.remove();svg.setAttribute('viewBox','0 0 900 210');svg.removeAttribute('preserveAspectRatio');}
  shell.remove();survivalRow.hidden=true;
 }
 function sync(){
  const active=['classic','survival','pedalkin'].includes(document.body.dataset.rideExperience||'')&&document.body.dataset.breakawayScreen==='route';
  if(!active){unmount();return;}
  const survival=document.body.dataset.rideExperience==='survival';
  const pedalkin=document.body.dataset.rideExperience==='pedalkin';
  if(document.body.classList.contains('cr-reference-mounted') &&
     document.body.classList.contains('pk-classic-reference')!==pedalkin)unmount();
  if(document.body.classList.contains('cr-reference-mounted') &&
     document.body.classList.contains('sr-reference-mounted')!==survival)unmount();
  mount();
 }
 for(const id of survivalSelectIds)document.getElementById(id)?.addEventListener('change',syncSurvivalChoices);
 const navigationObserver=new MutationObserver(sync);
 navigationObserver.observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 const chartObserver=new MutationObserver(()=>{formatChart();editingLabel();});
 chartObserver.observe(chart,{childList:true,attributes:true,attributeFilter:['class']});
 const status=document.getElementById('status');
 if(status){
  const statusObserver=new MutationObserver(()=>{
   if(!document.body.classList.contains('cr-reference-mounted'))return;
   const message=status.textContent||'';
   const invalid=/error|could not|invalid|must|exceeds|enter a valid|failed|unregistered seed/i.test(message);
   error.hidden=!invalid;if(invalid)error.textContent=message;
  });
  statusObserver.observe(status,{childList:true,characterData:true,subtree:true});
 }
 sync();
}
