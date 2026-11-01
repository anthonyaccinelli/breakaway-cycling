import {PEDALKIN_OVERLAY_CSS} from './pedalkin-overlay-theme';

/** Read-only no-trainer preview of the same compact overlay DOM/CSS.
 * The preview data is explicitly illustrative and never sent to the ride engine.
 */
export function mountPedalkinOverlayPreview():void{
 if(new URLSearchParams(location.search).get('pedalkinOverlayPreview')!=='1')return;
 document.body.classList.add('pedalkin-overlay-theme','pk-overlay-preview-mode');
 const skin=document.createElement('style');
 skin.textContent=PEDALKIN_OVERLAY_CSS+`
 body.pk-overlay-preview-mode{overflow:hidden!important;background:#e9eee9!important}
 #pkOverlayPreviewRoot{position:fixed;inset:0;z-index:999999;background:#e9eee9;
  font:14px system-ui,sans-serif;color:#17383c;display:flex;align-items:center;
  justify-content:center;flex-direction:column;gap:18px;padding:22px}
 #pkOverlayPreviewRoot>h1{font:900 clamp(18px,3vw,30px)/1.1 Georgia,serif;margin:0;color:#10343b}
 #pkOverlayPreviewRoot>p{margin:0;text-align:center;max-width:900px}
 .pk-overlay-frame{height:170px!important;width:min(96vw,1600px)!important;
  min-width:0;box-sizing:border-box;background:#0f292f;border-radius:16px;overflow:hidden;
  padding:4px 7px 6px!important;box-shadow:0 14px 40px #0f292f25}
 .pk-overlay-frame #overlayContent{width:100%!important;height:100%!important}
 .pk-overlay-playback{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}
 .pk-overlay-playback button{background:#21484e;color:#fff0d4;border:1px solid #fbc5ab;
  border-radius:8px;padding:9px 16px;font:700 13px system-ui;cursor:pointer}
 .pk-overlay-playback input{width:min(38vw,270px);accent-color:#21484e}
 .pk-overlay-preview-note{font-size:12px;color:#516467}
 .pk-overlay-frame .tile{cursor:default}
 @media(max-width:740px){.pk-overlay-frame{width:100%!important;}
  #pkOverlayPreviewRoot{padding:10px;gap:10px}
  #pkOverlayPreviewRoot>h1{font-size:18px}
  .pk-overlay-preview-note{font-size:10px}
 }
 `;
 document.head.append(skin);
 const root=document.createElement('div');
 root.id='pkOverlayPreviewRoot';
 root.innerHTML=`<h1>SPOKEMON · 170 px Overlay Preview</h1>
 <p class="pk-overlay-preview-note">Interactive design playtest · illustrative cycling values · no trainer connection · nothing recorded</p>
 <div class="pk-overlay-frame"><div id="overlayContent">
 <div id="overlayTop"><strong>SPOKEMON / PEDALKIN</strong><div id="overlayLabel">♠ PINE FOREST ♠</div>
 <div id="overlayActions"><button id="overlayMode" type="button">Expand</button>
 <div id="overlayZoomControls" role="group" aria-label="Elevation zoom">
 <button data-zoom="1" class="active" aria-pressed="true">1×</button>
 <button data-zoom="2" aria-pressed="false">2×</button>
 <button data-zoom="5" aria-pressed="false">5×</button>
 <button data-zoom="10" aria-pressed="false">10×</button>
 </div><button id="overlaySettingsToggle" type="button" aria-label="Overlay opacity">⚙</button></div></div>
 <div id="overlayMetrics">
 <div class="tile" data-metric-key="gear"><b>6</b><small>GEAR</small></div>
 <div class="tile" data-metric-key="speed"><b>14.7 MPH</b><small>SPEED</small></div>
 <div class="tile" data-metric-key="elapsedTime"><b>0:32:18</b><small>TIME ELAPSED</small></div>
 <div class="tile" data-metric-key="cadence"><b>92 RPM</b><small>CADENCE</small></div>
 <div class="tile" data-metric-key="distance"><b>2.7 MI</b><small>TOTAL DISTANCE</small></div>
 <div class="tile" data-metric-key="heartRate"><b>123 BPM</b><small>HEART RATE</small></div></div>
 <div id="overlayChart"></div>
 </div></div>
 <div class="pk-overlay-playback"><button id="pkPlaybackToggle">Pause demo</button>
 <label for="pkPlaybackSeek">Ride progress</label><input id="pkPlaybackSeek" type="range" min="0" max="1000" step="1" value="108"/>
 <button id="pkOpenPictureInPicture">Open floating overlay</button></div>
 <p class="pk-overlay-preview-note">Zoom buttons, pause/play, and progress scrubber are interactive. Live trainer values replace these samples during actual rides.</p>`;
 document.body.append(root);
 const overlay=root.querySelector<HTMLElement>('#overlayContent')!;
 const chart=root.querySelector<HTMLElement>('#overlayChart')!;
 const zoomButtons=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-zoom]'));
 const frame=root.querySelector<HTMLElement>('.pk-overlay-frame')!;
 let zoom=1,active=true,progress=.108,started=performance.now(),last=0;
 let pip:Window|null=null;
 const points=[.33,.44,.42,.56,.48,.24,.43,.53,.48,.69,.59,.66,.87,.99,.86,.58,.49,.62,.51,.67];
 const heightAt=(f:number)=>{
  const scaled=Math.max(0,Math.min(points.length-1,f*(points.length-1)));
  const lo=Math.floor(scaled),hi=Math.min(points.length-1,lo+1);
  return points[lo]+(points[hi]-points[lo])*(scaled-lo);
 };
 const fmtTime=(t:number)=>{const h=Math.floor(t/3600),m=Math.floor(t/60)%60,s=Math.floor(t)%60;
  return h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');};
 const metric=(key:string,value:string)=>{
  root.querySelector<HTMLElement>('.tile[data-metric-key="'+key+'"] b')!.textContent=value;
 };
 const forest=(viewStart:number,viewEnd:number)=>{
  const w=900,h=190,pad=10;
  const curve=Array.from({length:90},(_,i)=>{
   const f=viewStart+(viewEnd-viewStart)*i/89;
   return [pad+(w-2*pad)*i/89, h-pad-heightAt(f)*130];
  });
  const poly=curve.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1)).join(' ');
  const outline=curve.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join(' ');
  const forestTrees=Array.from({length:32},(_,i)=>{
   const x=8+i*(w-16)/31,tall=17+(i*13%22);
   return '<path d="M'+x+' '+(h-tall)+' l-9 15 h5 l-7 12 h22 l-7 -12 h5 Z" fill="'+(i%2?'#0d4040':'#123438')+'"/>';
  }).join('');
  const px=Math.min(.92,Math.max(.05,(progress-viewStart)/(viewEnd-viewStart)));
  const riderX=pad+px*(w-pad*2),riderY=h-pad-heightAt(progress)*130;
  const ahead=Math.min(1,progress+.006),behind=Math.max(0,progress-.006);
  const grade=-(heightAt(ahead)-heightAt(behind))*10/(ahead-behind)*.035;
  return '<div class="overlay-profile-graphic" style="height:100%;position:relative;overflow:hidden">'
   +'<svg viewBox="0 0 900 190" preserveAspectRatio="none" width="100%" height="100%">'
   +'<defs><linearGradient id="pk-preview-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#619f85"/><stop offset="100%" stop-color="#28594c"/></linearGradient></defs>'
   +'<path d="'+outline+' L890 190 L10 190 Z" fill="url(#pk-preview-fill)"/>'
   +forestTrees+'<polyline points="'+poly+'" fill="none" stroke="#f9ebcb" stroke-width="4"/>'
   +'<line x1="'+riderX+'" y1="20" x2="'+riderX+'" y2="181" stroke="#ffd17d" stroke-dasharray="8 7" stroke-width="2"/>'
   +'<circle cx="'+riderX+'" cy="'+riderY+'" r="7" fill="#ffd17d" stroke="#0f292f" stroke-width="2"/></svg>'
   +'<div class="overlay-profile-grade" style="left:calc('+(px*100)+'% - 37px)">'+grade.toFixed(1)+'%</div></div>';
 };
 const refresh=()=>{
  const span=1/zoom,start=Math.max(0,Math.min(1-span,progress-span/2)),end=start+span;
  chart.innerHTML=forest(start,end);
  metric('distance',(progress*25).toFixed(1)+' MI');
  metric('elapsedTime',fmtTime(32*60+18+Math.round((progress-.108)*80*60)));
  const content=overlay.cloneNode(true) as HTMLElement;
  if(pip&&!pip.closed){pip.document.body.replaceChildren(content);}
 };
 function tick(now:number){
  if(active&&last){progress=(progress+(Math.min(now-last,150)/90000))%1;refresh();}
  root.querySelector<HTMLInputElement>('#pkPlaybackSeek')!.value=String(Math.round(progress*1000));
  last=now;
  requestAnimationFrame(tick);
 }
 root.querySelector<HTMLButtonElement>('#pkPlaybackToggle')!.addEventListener('click',e=>{
  active=!active;(e.currentTarget as HTMLButtonElement).textContent=active?'Pause demo':'Resume demo';
 });
 root.querySelector<HTMLInputElement>('#pkPlaybackSeek')!.addEventListener('input',e=>{
  progress=Number((e.currentTarget as HTMLInputElement).value)/1000;refresh();
 });
 zoomButtons.forEach(button=>button.addEventListener('click',()=>{
  zoom=Number(button.dataset.zoom)||1;
  zoomButtons.forEach(x=>{const on=x===button;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
  refresh();
 }));
 root.querySelector<HTMLButtonElement>('#overlayMode')!.addEventListener('click',()=>{
  // The approved compact view always remains at 170px.
  active=!active;
  root.querySelector<HTMLButtonElement>('#pkPlaybackToggle')!.textContent=active?'Pause demo':'Resume demo';
 });
 root.querySelector<HTMLButtonElement>('#overlaySettingsToggle')!.addEventListener('click',()=>{
  frame.style.opacity=frame.style.opacity==='0.7'?'1':'0.7';
 });
 root.querySelector<HTMLButtonElement>('#pkOpenPictureInPicture')!.addEventListener('click',async()=>{
  if(!('documentPictureInPicture' in window)){
   alert('Floating always-on-top overlays require current desktop Chrome or Edge.');
   return;
  }
  try{
   const opened=await (window as any).documentPictureInPicture.requestWindow({width:1200,height:170}) as Window;
   pip=opened;
   const style=opened.document.createElement('style');style.textContent=PEDALKIN_OVERLAY_CSS+`
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%}
    body{overflow:hidden!important}.tile{grid-column:auto;grid-row:auto}
    #overlayContent{height:100%;width:100%}`;
   opened.document.head.append(style);
   opened.document.body.classList.add('pedalkin-overlay-theme');
   refresh();
  }catch{alert('The browser could not open the always-on-top preview.');}
 });
 refresh();
 requestAnimationFrame(tick);
}
