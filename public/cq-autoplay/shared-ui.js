
/* Shared Cycle Quest workflow; gameplay, routes and live BLE stay original. */
import {mountQuestDevices} from './devices-ui.js';
export function mountQuestBaseline({root,getState,getLive,getView,changeView,openOverlay,routeSVG,parentSend}){
 const game=root.querySelector('.cq-game');
 if(!game)return {sync(){},setPage(){}};
 let page='route';
 const top=document.createElement('section');
 top.className='cq-unified-head';
 top.setAttribute('aria-label','Cycle Quest navigation');
 top.innerHTML='<div class="cq-unified-brand"><svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs><filter id="cq-wordmark-gold" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  5 0 0 0 -1"/></filter></defs></svg><img class="cq-wordmark" src="/branding/cycle-quest-wordmark.png" alt="Cycle Quest" width="632" height="102"></div><nav class="cq-unified-nav" aria-label="Ride workflow"><button type="button" data-cq-page="route">01 ROUTE</button><button type="button" data-cq-page="devices">02 DEVICES</button><button type="button" data-cq-page="ride">03 RIDE</button><button type="button" data-cq-page="overlay">OVERLAY</button></nav><button type="button" class="cq-change-mode">CHANGE MODE</button>';
 game.prepend(top);
 const section=document.createElement('section');
 section.className='cq-unified-route';
 section.setAttribute('aria-label','Create your Cycle Quest route');
 section.innerHTML='<div class="cq-workflow-overview"><button class="cq-upload-route" type="button">UPLOAD GPX ROUTE</button><div class="cq-quest-dossier"><span>✦ ADVENTURE PROTOCOL</span><b>THE ROAD IS YOUR DUNGEON</b></div></div>'
 +'<h1 class="cq-shared-section"><i>1</i> CREATE YOUR ROUTE <span>CHAPTER ROUTE STUDIO</span></h1>'
 +'<div class="cq-route-workbench"><section class="cq-workbench-controls"><span class="cq-mini-label">ADVENTURE GENERATOR</span><h2>CHOOSE YOUR TERRAIN</h2><p>Build terrain, load a GPX track, or choose a preset. Monsters, bosses and XP stay exactly as they are.</p><div class="cq-preset-grid"><button data-cq-action="custom">GENERATE ROUTE</button><button data-cq-action="surprise">SURPRISE ME!</button><button data-cq-action="endless">ENDLESS ROUTE</button><button data-mode="boss">BOSS MODE · 10 MIN</button><button data-cq-action="recovery">RECOVERY 30</button><button data-cq-action="rolling">ROLLING 45</button><button data-cq-action="climbing">CLIMBING 60</button></div><div class="cq-difficulty-label"><span>GAME MODE</span><strong class="cq-current-mode">ADVENTURE</strong></div></section>'
 +'<section class="cq-workbench-summary"><h2><i>2</i> YOUR ROUTE PREVIEW</h2><dl><div><dt>ROUTE</dt><dd class="cq-route-name">THE IRON PASS</dd></div><div><dt>DISTANCE</dt><dd class="cq-route-dist">—</dd></div><div><dt>ELEVATION GAIN</dt><dd class="cq-route-gain">—</dd></div><div><dt>TERRAIN</dt><dd class="cq-route-type">—</dd></div><div><dt>PROGRESS</dt><dd class="cq-route-progress">—</dd></div></dl></section>'
 +'<section class="cq-workbench-cta"><span class="cq-mini-label">NEXT: HARDWARE CHECK</span><h2>READY TO QUEST?</h2><p>Connect your trainer to control the road. Keep your gear, character and chapters.</p><button type="button" data-cq-action="devices">CONNECT YOUR TRAINER →</button><button type="button" class="cq-outline-action" data-cq-action="ride">ENTER THE RIDE →</button></section></div>'
 +'<div class="cq-big-profile"><div class="cq-big-profile-head"><strong>ROUTE SCANNER</strong><span class="cq-quest-route-caption">CHAPTER TERRAIN / ACTUAL SAVED ROUTE</span></div><div class="cq-route-actual-profile" role="img" aria-label="Current generated route elevation profile"></div></div><div class="cq-route-inspector"><span class="cq-route-footnote">THE ROUTE IS REAL · DRAG THE YELLOW MARKER IN RIDE TO INSPECT TERRAIN</span><span>✦ CYCLE QUEST</span></div>';
 game.querySelector('.cq-header').after(section);
 const setPage=next=>{
  if(!['route','devices','ride','overlay','character'].includes(next))return;
  page=next;game.dataset.cqPage=page;parentSend({type:'quest-page',page});
  top.querySelectorAll('[data-cq-page]').forEach(button=>{
   const current=button.dataset.cqPage===(page==='character'?'ride':page);
   button.classList.toggle('cq-unified-active',current);
   if(current)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  });
 };
 const oldAction=id=>root.querySelector('#'+id)?.click();
 const preset=(distance,terrain)=>{
  oldAction('create-route');
  const d=document.getElementById('route-distance'),t=document.getElementById('route-terrain'),g=document.getElementById('route-gain');
  if(d)d.value=String(distance);
  if(t)t.value=terrain;
  if(g)g.value='';
  oldAction('route-generate');
 };
 section.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.classList.contains('cq-upload-route')){oldAction('upload-gpx');return;}
  switch(button.dataset.cqAction){
   case 'custom':oldAction('create-route');break;
   case 'surprise':oldAction('surprise-route');sync();break;
   case 'endless':oldAction('endless-route');sync();break;
   case 'recovery':preset(7.5,'flat');break;
   case 'rolling':preset(11.25,'rolling');break;
   case 'climbing':preset(15,'climbing');break;
   case 'devices':changeView('devices');setPage('devices');sync();break;
   case 'ride':changeView('ride');setPage('ride');sync();break;
  }
 });
 top.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.classList.contains('cq-change-mode')){parentSend({type:'home'});return;}
  const dest=button.dataset.cqPage;
  if(dest==='devices'){changeView('devices');setPage('devices');sync();return;}
  if(dest==='route'){changeView('ride');setPage('route');sync();return;}
  if(dest==='overlay'){openOverlay();return;}
  if(dest==='ride'){changeView(dest);setPage(dest);sync();}
 });
 const devices=mountQuestDevices({root,requestPage:next=>{changeView(next);setPage(next);sync();}});
 let routeKey='';
 function sync(){
  const s=getState();if(!s)return;
  devices.sync();
  const live=getLive(),r=s.route;
  game.dataset.cqPage=page;
  if(getView()==='overlay'&&page!=='overlay')setPage('overlay');
  const name=section.querySelector('.cq-route-name');
  if(!r){name.textContent='NO ROUTE SELECTED';return;}
  name.textContent=r.name||'CREATED ROUTE';
  section.querySelector('.cq-route-dist').textContent=r.endless?'ENDLESS':(r.distance/1609.344).toFixed(1)+' MI';
  section.querySelector('.cq-route-gain').textContent=r.hasElevation?Math.round((r.gain||0)/.3048).toLocaleString()+' FT':'FLAT SIMULATION';
  section.querySelector('.cq-route-type').textContent=(r.terrain||'IMPORTED').toUpperCase();
  section.querySelector('.cq-route-progress').textContent=(s.routeMiles||0).toFixed(1)+' MI RIDDEN';
  section.querySelector('.cq-current-mode').textContent=(s.mode||'adventure').toUpperCase();
  const key=[r.name,r.distance,r.gain,r.points?.length,r.windowStart,r.endless].join(':');
  if(key!==routeKey){
   routeKey=key;
   try{
    // The native elevationSVG uses a landscape viewBox; its default
    // xMidYMid meet mode letterboxes wide desktop Route Scanner panels.
    // Stretch the same real terrain data to the full available scanner width.
    const svgMarkup=routeSVG(r);
    section.querySelector('.cq-route-actual-profile').innerHTML=svgMarkup.replace(
      /<svg\b/, '<svg preserveAspectRatio="none"'
    );
   }
   catch{section.querySelector('.cq-route-actual-profile').textContent='Route preview not available.';}
  }
  section.querySelector('.cq-route-footnote').textContent=live.connected?'TRAINER CONNECTED · EDIT ROUTE BEFORE RIDING':'CONNECT YOUR SMART TRAINER TO START';
 }
 setPage('route');
 return {sync,setPage,getPage:()=>page};
}
