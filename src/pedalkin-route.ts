import './pedalkin-route.css';

/**
 * Pedalkin Route Studio. Reparents the REAL Breakaway route form and the live
 * chart; never clones inputs or replaces the existing generator/FTMS handlers.
 * Runs only on the Pedalkin Create Route screen.
 */
export function mountPedalkinRouteStudio():void {
 const byId=(id:string)=>document.getElementById(id);
 const route=byId('screenRoute');
 const studio=route?.querySelector<HTMLElement>('#routeStudio');
 const builder=studio?.querySelector<HTMLElement>('.route-builder');
 const preview=studio?.querySelector<HTMLElement>('.route-studio-live-preview');
 const input=byId('gpx') as HTMLInputElement|null;
 const difficulty=byId('generatedDifficulty') as HTMLSelectElement|null;
 const hiddenUpload=input?.closest<HTMLElement>('.route-import');
 const hiddenDifficulty=difficulty?.closest<HTMLElement>('label');
 const status=byId('status');
 if(!route||!studio||!builder||!preview||!input||!hiddenUpload||!hiddenDifficulty)return;

 const shell=document.createElement('div');
 shell.className='pk-route-shell';
 shell.innerHTML=`
  <header class="pk-header">
   <div class="pk-brand"><span class="pk-brand-star" aria-hidden="true">✳</span><div>
    <strong>PEDALKIN</strong><small>A LITTLE WONDER, EVERY MILE.</small>
   </div></div>
   <nav class="pk-nav" aria-label="Pedalkin ride steps">
    <button type="button" class="pk-nav-active" data-pk-step="route" aria-current="step"><span>01</span> CREATE ROUTE</button>
    <button type="button" data-pk-step="setup"><span>02</span> CONNECT TRAINER</button>
    <button type="button" data-pk-step="ride"><span>03</span> RIDE</button>
   </nav>
   <button type="button" class="pk-home" id="pkHome" title="Return to ride modes">← ALL MODES</button>
  </header>
  <div class="pk-scroll">
   <div class="pk-intro">
    <div><div class="pk-kicker">✦ YOUR NEXT LITTLE ADVENTURE</div>
    <h1>Choose your path<span>.</span></h1>
    <p>Winding woods, gentle hills, and discoveries along the way. Every mile is a chance to meet a new Pedalkin.</p></div>
    <div class="pk-intro-right"><span class="pk-leaf" aria-hidden="true">❀</span><span>MADE FOR THE LONG RIDE<br>TAKE THE SCENIC ROUTE</span></div>
   </div>
   <div class="pk-columns">
    <section class="pk-panel pk-builder-panel" aria-labelledby="pkBuilderTitle">
     <div class="pk-panel-top"><div><span class="pk-step-number">01 / ROUTE MAKER</span>
      <h2 id="pkBuilderTitle">Let's go exploring.</h2>
      <p>Pick a path, then we'll find the way.</p></div>
      <span class="pk-sprig" aria-hidden="true">✿</span>
     </div>
     <div class="pk-import-line"><button type="button" id="pkUpload">↑ UPLOAD GPX / TCX</button><span id="pkUploadName">Or make a route below</span></div>
     <div class="pk-builder-host"></div>
     <div class="pk-hidden-controls" hidden aria-hidden="true"></div>
     <p id="pkStatus" class="pk-status" role="status" aria-live="polite"></p>
    </section>
    <section class="pk-panel pk-preview-panel" aria-labelledby="pkPreviewTitle">
     <div class="pk-panel-top pk-preview-top"><div>
       <span class="pk-step-number">02 / A LOOK AHEAD</span><h2 id="pkPreviewTitle">Your route preview</h2>
       <p>Every hill is a new little adventure.</p>
      </div><span class="pk-route-mark" aria-hidden="true">⌁ ⛰ ⌁</span></div>
     <div class="pk-preview-host"></div>
     <div class="pk-preview-bottom"><span>✧</span> YOUR ROUTE IS READY WHEN YOU ARE <span>✧</span></div>
    </section>
   </div>
   <footer class="pk-footer"><span><b>♥</b> A COZY RIDE IS A GOOD RIDE.</span>
    <span>ZONE 2 FRIENDLY · ROUTES AND RESISTANCE USE THE REAL BREAKAWAY CYCLING ENGINE</span>
   </footer>
  </div>`;
 const builderHost=shell.querySelector<HTMLElement>('.pk-builder-host')!;
 const previewHost=shell.querySelector<HTMLElement>('.pk-preview-host')!;
 const hiddenControls=shell.querySelector<HTMLElement>('.pk-hidden-controls')!;
 const moves:{node:HTMLElement;home:Comment}[]=[];
 function move(node:HTMLElement,target:HTMLElement){
  const home=document.createComment('pedalkin-original-position');
  node.before(home);moves.push({node,home});target.append(node);
 }
 function mount(){
  if(shell.isConnected)return;
  route!.append(shell);
  move(builder!,builderHost);
  move(preview!,previewHost);
  // Preserve the actual file picker and difficulty select for the shared engine,
  // but don't render the original browser picker or a Difficulty field twice.
  move(hiddenUpload!,hiddenControls);
  move(hiddenDifficulty!,hiddenControls);
  document.body.classList.add('pk-route-mounted');
  updateStatus();
 }
 function unmount(){
  if(!shell.isConnected)return;
  for(const {node,home} of moves.reverse())home.replaceWith(node);
  moves.length=0;
  shell.remove();
  document.body.classList.remove('pk-route-mounted');
 }
 function updateStatus(){
  const el=shell.querySelector<HTMLElement>('#pkStatus');
  if(!el)return;
  const message=(status?.textContent||'').trim();
  const isError=/error|invalid|fail|could not|exceeds|enter a valid|must|unregistered seed/i.test(message);
  el.textContent=isError?message:'';
  el.hidden=!isError;
 }
 const sync=()=>{
  const active=document.body.dataset.rideExperience==='pedalkin'&&
   document.body.dataset.breakawayScreen==='route';
  if(active)mount();else unmount();
 };
 shell.querySelector('#pkHome')?.addEventListener('click',()=>byId('modeHomeButton')?.click());
 shell.querySelector('#pkUpload')?.addEventListener('click',()=>input.click());
 input.addEventListener('change',()=>{
  const name=shell.querySelector<HTMLElement>('#pkUploadName');
  if(name)name.textContent=input.files?.[0]?.name||'Or make a route below';
 });
 shell.querySelectorAll<HTMLButtonElement>('[data-pk-step]').forEach(button=>{
  button.addEventListener('click',()=>{
   const id=button.dataset.pkStep==='route'?'stepRoute':button.dataset.pkStep==='setup'?'stepSetup':'stepRide';
   (byId(id) as HTMLButtonElement|null)?.click();
  });
 });
 status&&new MutationObserver(updateStatus).observe(status,{childList:true,characterData:true,subtree:true});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ride-experience','data-breakaway-screen']});
 sync();
}
