import {readCharacter,MAX_XP} from './save-state.js';
import {escapeHTML as safeText,formatClock,rewardButtons} from './ui-utils.js';
import {battleRewards,sessionMetrics} from './rewards.js';
import {mountQuestBaseline} from './shared-ui.js';
import {createRewardGesture} from './reward-gesture.js';
import {generateRoute,parseGPX,sample,grade,METERS_PER_MILE} from './routes.js';
import {makeBattle,enemyGroup,encounterLevel,chapterLevels,chapterMonsters,CHAPTER_BIOMES,nextChapterEncounter,advanceBattle,advanceBossBattle,bossBehavior} from './combat.js';
import {elevationSVG} from './profile.js';
import {createLevelUpQueue,levelUpMarkup} from './level-up.js';
import {initWorkoutUI} from './workout-ui.js';
import {creditWorkout,dayAt} from './workouts.js';
(()=>{
'use strict';
let questBaseline=null;
const root=document.getElementById('cq-preview'),$=s=>root.querySelector(s),all=s=>root.querySelectorAll(s),key='cycle-quest-autoplay-preview-v1';
const setStat=(name,value,html=false)=>all('[data-stat="'+name+'"]').forEach(el=>{if(html)el.innerHTML=value;else el.textContent=value;});
$('.cq-route').append($('.cq-event'));
const rewardGesture=createRewardGesture();
let rewardChoice=null,warmupSeconds=0;
const restButton=document.createElement('button');restButton.textContent='REST · RECOVER 25 HP';restButton.hidden=true;document.getElementById('pedal').after(restButton);restButton.onclick=rest;
let persistedSave=null,externalSaveChanged=false,invalidStoredSave=false;
const fresh=()=>({workouts:[],version:1,xp:570,hp:100,coins:0,pendingReward:null,miles:0,chapter:1,mode:'adventure',rideSeconds:0,rideMiles:0,nextEncounter:8,battle:null,reward:false,boss:null});
const levelUps=createLevelUpQueue();let levelUp=null;
function rest(){if(externalSaveChanged)return;s.hp=Math.min(maxHP(),s.hp+25);message='Recovered 25 HP.';save();render();}
function displayedPower(){return Number.isFinite(live.displayPower)?Math.round(Math.max(0,live.displayPower)):power;}
let summitChoices=new Map(),summitSeen=new Set();
let live={connected:false,running:false,power:0,cadence:0,heartRate:'—',speed:0,gear:6,ftp:280,distanceM:0,grade:0,elevation:0},lastLiveTime=0,lastLiveDistance=0,lastHold=null,clickArmed=true;
const parentSend=data=>window.parent.postMessage({source:'cycle-quest',...data},location.origin);
const mediaKey='cycle-quest-share-cards-v1';
function shareCard(title,lines,saveCard=true){
 try{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const c=canvas.getContext('2d');c.fillStyle='#0b1640';c.fillRect(0,0,1200,630);c.strokeStyle='#a7b2d1';c.lineWidth=6;c.strokeRect(18,18,1164,594);c.fillStyle='#ffe777';c.font='bold 54px monospace';c.fillText('CYCLE QUEST',62,95);c.fillStyle='#fff';c.font='bold 56px monospace';c.fillText(title.slice(0,30),62,190);c.font='36px monospace';lines.slice(0,7).forEach((line,i)=>c.fillText(String(line).slice(0,50),62,260+i*48));const data=canvas.toDataURL('image/png');if(saveCard)saveShareCard(title,data);return data;}catch{return null;}
}
function saveShareCard(title,data){const stored=JSON.parse(localStorage.getItem(mediaKey)||'[]'),cards=Array.isArray(stored)?stored:[];cards.unshift({title,date:new Date().toISOString(),data});localStorage.setItem(mediaKey,JSON.stringify(cards.slice(0,12)));}
let summaryCapturing=false;
const summaryDialog=document.createElement('dialog');summaryDialog.className='cq-route-dialog cq-summary-dialog';summaryDialog.innerHTML='<h2>RIDE SUMMARY</h2><div id="cq-summary-content"></div><div class="cq-eventactions"><button id="cq-summary-download">DOWNLOAD IMAGE</button><button id="cq-summary-retry" hidden>RETRY IMAGE</button><button id="cq-summary-close">CLOSE</button></div>';root.append(summaryDialog);
const galleryButton=document.createElement('button');galleryButton.textContent='Ride highlights';document.getElementById('save-tools').before(galleryButton);galleryButton.onclick=()=>{const body=summaryDialog.querySelector('#cq-summary-content');body.replaceChildren();let cards=[];try{cards=JSON.parse(localStorage.getItem(mediaKey)||'[]');}catch{}if(!Array.isArray(cards))cards=[];cards=cards.filter(card=>card&&typeof card.data==='string'&&card.data.startsWith('data:image/png;base64,'));if(!cards.length)body.textContent='No ride highlights saved yet.';for(const card of cards){const row=document.createElement('p'),a=document.createElement('a');a.href=card.data;a.download='cycle-quest-highlight.png';a.textContent=card.title+' · '+new Date(card.date).toLocaleDateString()+' · DOWNLOAD';const thumb=document.createElement('img');thumb.src=card.data;thumb.alt=card.title+' preview';thumb.style.cssText='display:block;max-width:100%;max-height:200px;margin-top:8px';row.append(a,thumb);body.append(row);}summaryImage=null;if(!summaryDialog.open)summaryDialog.showModal();};
let summaryImage=null;summaryDialog.querySelector('#cq-summary-retry').onclick=()=>finishQuestSummary(true);summaryDialog.querySelector('#cq-summary-close').onclick=()=>summaryDialog.close();summaryDialog.querySelector('#cq-summary-download').onclick=()=>{if(!summaryImage)return;const a=document.createElement('a');a.href=summaryImage;a.download='cycle-quest-ride-summary.png';a.click();};
async function finishQuestSummary(retry=false){
 const q=s.session;if(!q||summaryCapturing||(q.completed&&!retry))return;q.completed=true;summaryCapturing=true;summaryDialog.querySelector('#cq-summary-retry').hidden=true;
 const lines=['XP GAINED  +'+fmt(s.xp-q.startXP),'LEVELS GAINED  +'+(level()-q.startLevel),'ATTACK GAINED  +'+fmt(atk()-q.startAttack),'COINS GAINED  +'+fmt((s.coins||0)-(q.startCoins||0)),'MONSTERS DEFEATED  '+q.monsters,'BOSSES DEFEATED  '+q.bosses,'RIDE DISTANCE  '+sessionMetrics(s,live).miles.toFixed(2)+' MI'];
 const card=shareCard('RIDE COMPLETE',lines,false),body=summaryDialog.querySelector('#cq-summary-content');body.replaceChildren();
 for(const line of lines){const row=document.createElement('p');row.textContent=line;body.append(row);}
 if(card){const img=document.createElement('img');img.src=card;img.alt='Shareable Cycle Quest ride summary';img.style.cssText='display:block;max-width:100%;max-height:250px';body.append(img);}
 const download=summaryDialog.querySelector('#cq-summary-download');download.disabled=true;summaryImage=null;save();if(!summaryDialog.open)summaryDialog.showModal();
 try{
  await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const {default:capture}=await import('./summary-capture.js');
  const canvas=await capture(summaryDialog,{backgroundColor:null,scale:Math.min(2,window.devicePixelRatio||1),logging:false,useCORS:true,width:summaryDialog.offsetWidth,height:Math.max(summaryDialog.offsetHeight,summaryDialog.scrollHeight),onclone:doc=>{const clone=doc.querySelector('.cq-summary-dialog');if(clone){clone.style.maxHeight='none';clone.style.height='auto';clone.style.overflow='visible';clone.querySelector('#cq-summary-download').disabled=false;}}});
  summaryImage=canvas.toDataURL('image/png');try{saveShareCard('RIDE SUMMARY',summaryImage);}catch{message='Summary image could not be saved locally; use Download image.';}
  download.disabled=false;parentSend({type:'quest-summary',lines,image:summaryImage});
 }catch(error){download.disabled=true;message='Could not capture the full ride summary. Please try again.';parentSend({type:'quest-summary',lines,image:null});summaryDialog.querySelector('#cq-summary-retry').hidden=false;const note=document.createElement('p');note.textContent=message;body.append(note);console.error('Summary image capture failed',error);}finally{summaryCapturing=false;}
}

let floating=null,floatingMarkup='';
let s=fresh(),view='ride',running=false,saveTick=0,message='The road ahead is yours.',power=0;
function level(xp=s.xp){let L=1;while(xp>=cost(L)){xp-=cost(L);L++;if(L>100000)break;}return L;}
function cost(L){return Math.min(10800,600+300*(L-1));}
function threshold(L){let n=L-1,m=Math.min(n,34);return m*600+150*m*(m-1)+Math.max(0,n-34)*10800;}
function maxHP(L=level()){return 100+10*(L-1);}
function atk(L=level()){return 100*1.08**(L-1);}
function fmt(n){return Math.round(n).toLocaleString('en-US');}
function clock(t){return formatClock(t);}
function load(){
 try{persistedSave=localStorage.getItem(key);if(persistedSave){s=readCharacter(persistedSave);if(JSON.parse(persistedSave).xp>MAX_XP){localStorage.setItem(key+'-xp-limit-backup',persistedSave);message='Character recovered at the 10,000,000 XP limit. Original save backed up.';}}}
 catch{invalidStoredSave=true;externalSaveChanged=true;message='Your saved character could not be loaded. It has been preserved. Export your save before making changes.';}
 s.hp=Math.min(maxHP(),s.hp);warmupSeconds=s.mode==='boss'&&!s.bossModeComplete?Math.max(0,Math.min(600,s.bossWarmupRemaining??600)):0;if(!invalidStoredSave)restoreRewardState();else $('#save-state').textContent='Original save preserved — export to recover';
}
function save(){
 if(externalSaveChanged)return;
 try{
  if(localStorage.getItem(key)!==persistedSave){externalSaveChanged=true;running=false;parentSend({type:'pause'});message='Character changed in another tab. Export your progress or reload before continuing.';$('#save-state').textContent=message;return;}
  const text=JSON.stringify(s);localStorage.setItem(key,text);persistedSave=text;$('#save-state').textContent='Saved on this device';
 }catch{$('#save-state').textContent='Save unavailable — use Export save';}
}
function award(x){const before=level();s.xp=Math.min(MAX_XP,s.xp+Math.max(0,x));if(level()>before){s.hp=maxHP();levelUps.enqueue(before,level());message='LEVEL UP! Level '+level()+'.';shareCard('LEVEL UP!', ['LEVEL '+before+' → '+level(),'MAX HP  '+maxHP(before)+' → '+maxHP(),'ATTACK  '+fmt(atk(before))+' → '+fmt(atk())]);}if(s.xp===MAX_XP)message='Character XP limit reached (10,000,000). Export your save to keep a backup.';}
function bossStats(){if(!s.boss)s.boss=makeBattle('boss',{chapter:s.chapter});return s.boss;}
function showEncounterView(){if(view==='overlay')return;view='ride';questBaseline?.setPage('ride');}
function encounter(kind,forcedCount=null){
 if(externalSaveChanged||!live.connected)return;
 if(s.hp<=1){message='Rest to recover HP before starting another battle.';render();return;}
 if(s.battle||s.reward||levelUp){message='Finish your current encounter first.';return;}
 showEncounterView();
 if(kind==='boss'){s.bossWarmupReady=false;if(s.mode!=='boss')s.miles=100;s.battle={...bossStats(),practice:s.mode==='boss'};}
 else if(kind==='enemy'){
  const roll=Math.random(),count=forcedCount??(roll<.1?3:roll<.3?2:1),fights=[];
  for(let i=0;i<count;i++){
   const pick=nextChapterEncounter(s.chapter,s.chapterEncounter);s.chapterEncounter=pick.state;
   fights.push(makeBattle('enemy',{chapter:s.chapter,level:encounterLevel(s.chapter,s.miles),monsterId:pick.monsterId}));
  }
  s.battle=enemyGroup(fights);
 }else s.battle=makeBattle('summit',{chapter:s.chapter});
 message=kind==='summit'?'SUMMIT BOSS! Resistance held for battle.':'An enemy stands in your way.';
 save();render();
}
function restoreRewardState(){
 s.coins??=0;
 if(s.reward&&!s.pendingReward){s.pendingReward=battleRewards({kind:'enemy',reward:150});award(s.pendingReward.xp);save();}
}
function finish(win){
 const b=s.battle;if(!b)return;
 s.battle=null;s.reward=false;s.pendingReward=null;
 if(b.kind==='summit'&&!s.route?.endless)parentSend({type:'summit-resolved'});
 s.nextEncounter=35+Math.random()*20;if(b.practice){s.bossModeComplete=true;s.bossWarmupRemaining=0;}
 if(win){
  const rewards=battleRewards(b);
  if(s.session){if(b.kind==='enemy'&&!Array.isArray(b.enemies))s.session.monsters++;else if(b.kind!=='enemy')s.session.bosses++;}
  award(rewards.xp);s.pendingReward=rewards;s.reward=true;
  if(b.kind==='boss'&&!b.practice){s.chapter++;s.miles=0;s.boss=null;}
  if(b.kind!=='enemy')shareCard(b.kind==='summit'?'SUMMIT BOSS DEFEATED':'CHAPTER BOSS DEFEATED',[b.name,'XP EARNED  +'+rewards.xp,'LEVEL '+level()]);
  message='VICTORY! +'+rewards.xp+' XP earned. Choose health or coins.';
 }else{s.hp=maxHP();message='Battle lost. No bonus XP. HP fully restored. '+(b.kind==='boss'?'The same boss awaits your next attempt.':'Keep riding.');}
 save();
}
function choose(type){
 if(externalSaveChanged||!s.reward||!s.pendingReward||!['heal','coins'].includes(type))return;
 const rewards=s.pendingReward;
 if(type==='heal'){const n=Math.min(rewards.hp,maxHP()-s.hp);s.hp+=n;message='Recovered '+fmt(n)+' HP. Shifting restored.';}
 else{s.coins=(s.coins||0)+rewards.coins;message='+'+fmt(rewards.coins)+' coins! Shifting restored.';}
 s.reward=false;s.pendingReward=null;rewardChoice=null;save();render();
}

function step(dt){if(!running)return;dt=Math.min(dt,1);s.rideSeconds+=dt;if(power>0&&live.cadence>0)award(dt);if(s.reward)return;if(warmupSeconds>0){if(power>0&&live.cadence>0)warmupSeconds=Math.max(0,warmupSeconds-dt);if(s.mode==='boss')s.bossWarmupRemaining=warmupSeconds;if(warmupSeconds<=0)s.bossWarmupReady=true;return;}if(s.bossWarmupReady&&!s.battle&&!levelUp){s.bossWarmupReady=false;encounter('boss');}if(s.battle){const damage=power>0?power*atk()/100:0;const out=s.battle.kind==='enemy'?advanceBattle(s.battle,s.hp,damage,dt):advanceBossBattle(s.battle,s.hp,damage,dt,{watts:power,cadence:live.cadence,ftp:live.ftp,maxHP:maxHP()});s.battle=out.battle;s.hp=out.hp;if(s.session&&out.killed)s.session.monsters+=out.killed;if(out.outcome==='flee')fleeSummit();else if(out.outcome)finish(out.outcome==='win');}}
function fleeSummit(){s.battle=null;if(!s.route?.endless)parentSend({type:'summit-resolved'});message='Summit battle escaped. No bonus reward.';save();}
function bossPrompt(b){
 if(b.kind==='enemy')return '';
 const state=bossBehavior(b),seconds=Math.ceil(state.remaining),target=Math.round((live.ftp||280)*.5);
 const text={attack:'ATTACK · WATCH FOR THE NEXT MOVE',brace:'BRACE · EASE TO '+target+' W OR LESS',stagger:'STAGGERED · DOUBLE DAMAGE',recover:'RECOVER — ARMOR IS UP · ≤'+target+' W HEALS +5 HP/SEC'}[state.phase];
 return '<div class="cq-boss-prompt" data-phase="'+state.phase+'">'+text+' · '+seconds+'s'+(b.kind==='summit'?'<small>STOP PEDALING 15s TO EXIT'+(state.phase==='recover'?' · EXIT TIMER PAUSED':b.stopped?' · '+Math.ceil(15-b.stopped)+'s LEFT':'')+'</small>':'')+'</div>';
}
function healthColor(hp,max){const ratio=max>0?hp/max:0;return ratio>2/3?'#00ed00':ratio>1/3?'#ffcc00':'#f21d38';}
function patchMarkup(host,markup){
 const template=host.ownerDocument.createElement('template');template.innerHTML=markup;
 function patch(parent,wanted){const incoming=Array.from(wanted.childNodes);incoming.forEach((next,i)=>{let current=parent.childNodes[i];if(!current){parent.appendChild(next.cloneNode(true));return;}if(current.nodeType!==next.nodeType||(current.nodeType===1&&current.tagName!==next.tagName)){parent.replaceChild(next.cloneNode(true),current);return;}if(current.nodeType===3){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}if(current.nodeType!==1)return;for(const attr of Array.from(current.attributes))if(!next.hasAttribute(attr.name))current.removeAttribute(attr.name);for(const attr of Array.from(next.attributes))if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);patch(current,next);});while(parent.childNodes.length>incoming.length)parent.lastChild.remove();}patch(host,template.content);
}
function monsterArt(b){const enemies=Array.isArray(b.enemies)?b.enemies:[{id:b.monsterId,name:b.name,hp:b.hp,max:b.max}];const art=enemies.filter(e=>['rat','crab','roper','headwind'].includes(e.id)&&e.hp>0);return art.length?'<div class="cq-art-group" role="group" aria-label="'+art.length+' illustrated enemies">'+art.map(e=>'<div class="cq-rat-card" style="--enemy-health:'+healthColor(e.hp,e.max)+'"><strong class="cq-rat-name">'+safeText(e.name||b.name)+' - LV '+safeText(e.level||b.level||1)+'</strong><img class="cq-rat-art" src="/monsters/'+e.id+'.png" alt="'+safeText(e.name||e.id)+'"><span class="cq-rat-hp">'+fmt(e.hp)+' / '+fmt(e.max)+' HP</span><div class="cq-enemymeter"><i style="width:'+Math.max(0,Math.min(100,e.hp/e.max*100))+'%"></i></div></div>').join('')+'</div>':'';}
function groupBars(b,compact=false){if(!Array.isArray(b.enemies)||b.enemies.length<=1)return '';const hasArt=b.enemies.some(e=>['rat','crab','roper','headwind'].includes(e.id)&&e.hp>0),enemies=b.enemies.filter(e=>!['rat','crab','roper','headwind'].includes(e.id)||!hasArt);if(!enemies.length)return '';return '<div class="cq-group'+(compact?' cq-group-mini':'')+'">'+enemies.map(e=>'<div style="--enemy-health:'+healthColor(e.hp,e.max)+'"><span>'+safeText(e.name)+' · LV '+safeText(e.level||1)+' · '+fmt(e.hp)+' HP</span><div class="cq-enemymeter"><i style="width:'+Math.max(0,e.hp/e.max*100)+'%"></i></div></div>').join('')+'</div>';}



let profileInspect=null,profileDrag=null;
root.addEventListener('pointerdown',event=>{
 const el=event.target.closest('.cq-profile:not(.cq-smallprofile)');
 if(!el||!s.route||event.button!==0||event.target.closest('[data-profile-reset]'))return;
 profileDrag={id:event.pointerId,el};
 el.setPointerCapture(event.pointerId);
 moveProfileInspection(event);
 event.preventDefault();
});
root.addEventListener('pointermove',event=>{
 if(profileDrag?.id!==event.pointerId)return;
 moveProfileInspection(event);
 event.preventDefault();
});
function moveProfileInspection(event){
 const el=profileDrag.el,svg=el.querySelector('svg');
 if(!svg)return;
 const rect=svg.getBoundingClientRect(),width=svg.viewBox.baseVal.width;
 const fraction=Math.max(0,Math.min(1,((event.clientX-rect.left)/Math.max(1,rect.width)*width-14)/Math.max(1,width-28)));
 profileInspect=Number(el.dataset.profileStart)+fraction*Number(el.dataset.profileLength);
 draw();
}
function endProfileDrag(event){
 if(profileDrag?.id!==event.pointerId)return;
 const el=profileDrag.el;profileDrag=null;
 if(el.hasPointerCapture(event.pointerId))el.releasePointerCapture(event.pointerId);
}
root.addEventListener('pointerup',endProfileDrag);
root.addEventListener('pointercancel',endProfileDrag);
root.addEventListener('click',event=>{
 if(!event.target.closest('[data-profile-reset]'))return;
 profileInspect=null;draw();
});
function draw(){all('.cq-profile').forEach((el,i)=>{let w=el.clientWidth,h=el.clientHeight;if(el.classList.contains('cq-smallprofile')&&floating&&!floating.closed){w=w||Math.max(160,floating.innerWidth-440);h=h||110;}if(!w||!h)return;if(el.classList.contains('cq-smallprofile')&&warmupSeconds>0){el.setAttribute('role','group');el.setAttribute('aria-label','Boss warmup');el.innerHTML='<div class="cq-mini-battle"><strong>BOSS WARMUP</strong><span>'+clock(Math.ceil(warmupSeconds))+' LEFT · PEDAL TO WARM UP</span></div>';return;}if(el.classList.contains('cq-smallprofile')&&levelUp){el.setAttribute('role','group');el.setAttribute('aria-label','Level up celebration');el.innerHTML=levelUpMarkup(levelUp,{hp:maxHP,attack:atk},true);return;}if(el.classList.contains('cq-smallprofile')&&(s.battle||s.reward)){el.setAttribute('role','group');el.setAttribute('aria-label',s.reward?'Victory reward choice':s.battle.name+' battle');if(s.reward){patchMarkup(el,'<div class="cq-mini-battle cq-mini-reward"><span>'+rewardLabel()+'</span>'+rewardButtons(s.pendingReward,true)+'</div>');}else{const b=s.battle;patchMarkup(el,'<div class="cq-mini-battle'+(monsterArt(b)?' cq-has-art':'')+'" style="--enemy-health:'+healthColor(b.hp,b.max)+'"><div class="cq-battleheading"><span>'+safeText(b.name)+'</span><span>UNTIL 1 HP</span></div>'+bossPrompt(b)+monsterArt(b)+(groupBars(b,true)||(!monsterArt(b)?'<div class="cq-mini-enemyhp">'+fmt(b.hp)+' HP</div><div class="cq-enemymeter" style="--enemy-health:'+healthColor(b.hp,b.max)+'"><i style="width:'+Math.max(0,b.hp/b.max*100)+'%"></i></div>':''))+'</div>');}return;}el.setAttribute('role','img');el.setAttribute('aria-label','Elevation profile: downhill, 0–3%, 3–6%, 6–9%, 9%+ grades in five blue tones; yellow rider line');const offset=s.route?.windowStart||0,current=(s.routeMiles||0)*METERS_PER_MILE,climb=running&&!document.getElementById('route-dialog')?.open?(Array.isArray(live.climbs)?live.climbs:[]).find(c=>current>=c.start&&current<c.end&&c.start>=offset&&c.end<=offset+s.route.distance):null;let displayed=s.route,progress=(current-offset)/s.route.distance;if(climb){const start=climb.start-offset,end=climb.end-offset,pts=[{d:0,e:sample(s.route,start)},...s.route.points.filter(p=>p.d>start&&p.d<end).map(p=>({d:p.d-start,e:p.e})),{d:end-start,e:sample(s.route,end)}];displayed={...s.route,distance:end-start,points:pts};progress=(current-climb.start)/(climb.end-climb.start);}const inspectable=!el.classList.contains('cq-smallprofile'),profileStart=climb?climb.start:offset;el.dataset.profileStart=String(profileStart);el.dataset.profileLength=String(displayed.distance);if(inspectable&&profileInspect!==null)progress=(profileInspect-profileStart)/displayed.distance;const bosses=(Array.isArray(live.climbs)?live.climbs:[]).filter(c=>summitChoices.get(Math.round(c.end))&&!summitSeen.has(Math.round(c.end))).map(c=>(c.end-(climb?climb.start:offset))/displayed.distance).filter(v=>v>=0&&v<=1);displayed={...displayed,summits:bosses};const eta=climb&&live.speed>1?Math.ceil((climb.end-current)/(live.speed*METERS_PER_MILE/3600)/60):null;el.style.touchAction=inspectable?'none':'';el.style.cursor=inspectable?'crosshair':'';el.innerHTML=elevationSVG(displayed,sample,w,h,progress)+(inspectable&&profileInspect!==null?'<div style="position:absolute;bottom:4px;left:6px;z-index:3;background:#102052;color:#fff;padding:4px 7px;font-size:16px">PREVIEW '+(profileInspect/METERS_PER_MILE).toFixed(2)+' MI · '+Math.round(sample(s.route,Math.max(0,Math.min(s.route.distance,profileInspect-offset)))/.3048)+' FT · '+grade(s.route,Math.max(0,Math.min(s.route.distance,profileInspect-offset))).toFixed(1)+'% <button type="button" data-profile-reset style="cursor:pointer">FOLLOW RIDER</button></div>':'')+(climb?'<div class="cq-climb-hud">'+safeText(climb.category)+' · '+((climb.end-current)/METERS_PER_MILE).toFixed(2)+' MI LEFT · ETA '+(eta===null?'—':eta+' MIN')+'</div>':'')+(el.classList.contains('cq-smallprofile')?'<div class="cq-overlay-grade" aria-label="Current route grade">'+currentGrade()+'</div>':'');});}
function currentGrade(){const g=live.connected?live.grade:s.route?grade(s.route,(s.routeMiles||0)*METERS_PER_MILE-(s.route.windowStart||0)):0;return (g>=0?'+':'')+g.toFixed(1)+'%';}
let previousEvent='';
function renderRideReadouts(session, L, remaining) {
  setStat("tile-hr", safeText(live.heartRate) + " <em>BPM</em>", true);
  setStat("tile-cadence", Math.round(live.cadence) + " <em>RPM</em>", true);
  setStat("tile-gear", safeText(live.gear) + " <em>/ 24</em>", true);
  setStat("tile-power", displayedPower() + " <em>W</em>", true);
  setStat("tile-speed", live.speed.toFixed(1) + " <em>MPH</em>", true);
  setStat("tile-time", clock(session.seconds));
  setStat("tile-distance", session.miles.toFixed(2) + " <em>MI</em>", true);
  if (s.route) setStat("tile-ascent", fmt(routeAscent()) + " <em>FT</em>", true);
  $(".cq-overlayhead>span").innerHTML = 'CYCLE QUEST <span class="cq-gold">LV ' + L + '</span> <span class="cq-overlay-xp" aria-label="Experience remaining to next level"><span class="cq-overlay-xpfill" style="width:' + Math.max(0, Math.min(100, remaining / cost(L) * 100)) + '%"></span><b>' + fmt(remaining) + " XP LEFT</b></span>";
  $(".cq-overlayhead>span:nth-child(2)").textContent = "CHAPTER " + s.chapter + " \xB7 " + s.miles.toFixed(1) + " / 100 MI";
  $(".cq-elapsed").textContent = "SESSION " + session.miles.toFixed(2) + " MI \xB7 GEAR " + live.gear + " \xB7 TIME " + formatClock(session.seconds);
  setStat("overlay-power", displayedPower() + " W");
  setStat("overlay-hr", live.heartRate + " BPM");
  setStat("overlay-speed", live.speed.toFixed(1) + " MPH");
  $(".cq-overlayfoot").innerHTML = "<span>" + (s.battle ? safeText(s.battle.name) + " \xB7 " + fmt(s.battle.hp) + " HP" : s.reward ? "+" + (s.pendingReward?.xp || 0) + " XP EARNED \xB7 CHOOSE A REWARD" : " +1 XP / SEC PEDALING") + "</span><span>ATTACK " + fmt(atk()) + " \xB7 " + fmt(s.coins || 0) + " COINS</span>";
}
function battleLevelLabel(b){const levels=b.enemies?.map(e=>e.level)||[b.level];const low=Math.min(...levels),high=Math.max(...levels);return 'LV '+low+(high!==low?'–'+high:'');}
function eventMarkup() {
  let html = "";
  if (levelUp) {
    html = levelUpMarkup(levelUp, { hp: maxHP, attack: atk });
  } else if (s.battle) {
    const b = s.battle;
    html = '<div class="cq-battleheading"><span>' + { enemy: "RANDOM ENCOUNTER", summit: "SUMMIT BOSS", boss: "CHAPTER BOSS" }[b.kind] + "</span><span>NO TIME LIMIT</span></div><h3>" + safeText(b.name) + "</h3>" + bossPrompt(b) + monsterArt(b) + '<span class="cq-sub">' + (battleLevelLabel(b) + " \xB7 ") + "BASE ATTACK " + b.dps.toFixed(2) + ' HP / SEC</span><div class="cq-eventbar" style="--enemy-health:' + healthColor(b.hp, b.max) + '"><span>' + fmt(b.hp) + " / " + fmt(b.max) + " HP</span><span>LOSE AT 1 HP</span></div>" + (!monsterArt(b) ? '<div class="cq-enemymeter" style="--enemy-health:' + healthColor(b.hp, b.max) + '"><i style="width:' + Math.max(0, b.hp / b.max * 100) + '%"></i></div>' : "") + groupBars(b) + '<span class="cq-sub">' + displayedPower() + " W \u2192 " + fmt(displayedPower() * atk() / 100 * (b.kind==='enemy'?1:bossBehavior(b).phase==='recover'?0:bossBehavior(b).phase==='stagger'?2:1)) + " DAMAGE / SEC \xB7 " + (b.kind==='enemy'||bossBehavior(b).phase==='attack'?b.dps:0).toFixed(2) + ' HP LOST / SEC</span><p class="cq-sub">' + (running ? "Keep pedaling!" : "Start pedaling to continue the battle.") + "</p>";
  } else if (s.reward) {
    html = "<h3>VICTORY!</h3><p>" + rewardLabel() + "</p>" + rewardButtons(s.pendingReward) + '<p class="cq-sub" style="margin-top:12px">Keep pedaling for COINS \xB7 Stop pedaling for HEAL \xB7 \u2212 / + or click confirms now.</p>';
  } else if (s.mode==='boss'&&s.bossModeComplete) {
    html='<h3>BOSS MODE COMPLETE</h3><p>Your chapter progress is unchanged.</p><button data-warmup="600">Warm up and fight again</button>';
  } else if (warmupSeconds > 0) {
    html = "<h3>BOSS WARMUP</h3><p>Pedal to warm up \xB7 " + clock(Math.ceil(warmupSeconds)) + ' remaining</p><div class="cq-eventactions"><button data-warmup="0">Skip warmup</button></div>';
  } else if (s.miles >= 100 && s.mode === "adventure") {
    html = "<h3>" + safeText(bossStats().name) + ' AWAITS</h3><p>Choose your warmup before the boss battle.</p><div class="cq-eventactions"><button data-warmup="0">Fight now</button><button data-warmup="300">5 min warmup</button><button data-warmup="600">10 min warmup</button><button data-mode="training">Keep grinding</button></div>';
  } else {
    html = (s.hp <= 0 ? '<div class="cq-eventactions"><button data-rest="true">REST \xB7 RECOVER 25 HP</button></div>' : "") + "<h3>" + (CHAPTER_BIOMES[s.chapter]?.name || "THE IRON PASS") + "</h3><p>" + (s.mode === "training" ? "Train here. Return stronger." : "Keep pedaling. Your next level is ahead.") + '</p><span class="cq-sub">' + (running ? "Pedaling \xB7 every second earns 1 XP." : "Connect your trainer, then start pedaling.") + "</span>";
  }
  return html;
}
function render(){if(s.reward&&!rewardChoice)rewardChoice=rewardGesture.begin(performance.now());if(!s.reward)rewardChoice=null;levelUp=levelUps.update(performance.now(),!!s.battle||s.reward||view==='character');restButton.hidden=s.hp>1;const holding=!!s.battle||s.reward||!!levelUp||warmupSeconds>0;if(lastHold!==holding){lastHold=holding;clickArmed=false;parentSend({type:'hold',hold:holding,reward:s.reward});}parentSend({type:'reward-state',reward:s.reward});$('#live-status').textContent=live.connected?'Trainer connected · '+(running?'RIDING':'Ready to pedal'):'Connect your smart trainer to ride.';if(s.route){const length=s.route.distance/METERS_PER_MILE;$('.cq-route .cq-windowtitle>span').textContent=s.route.name;$('.cq-route .cq-grade').textContent=currentGrade();$('.cq-axis').innerHTML=[0,.25,.5,.75,1].map(f=>'<span>'+(length*f+(s.route.windowStart||0)/METERS_PER_MILE).toFixed(1)+(f===0||f===1?' mi':'')+'</span>').join('');$('.cq-routefoot').innerHTML='<span><i class="cq-dot"></i> YOU <b>'+(s.routeMiles||0).toFixed(1)+' MI</b></span><span>'+(s.route.endless?'ENDLESS · <b>∞ MI</b> · ':'ROUTE <b>'+length.toFixed(1)+' MI</b> · ')+(s.route.hasElevation?fmt(s.route.endless?routeAscent():s.route.gain/.3048)+' FT ASCENT':'NO ELEVATION DATA')+'</span>';}const inBattle=!!s.battle||s.reward||!!levelUp||warmupSeconds>0||s.mode==='boss'||(s.miles>=100&&s.mode==='adventure');$('.cq-route').classList.toggle('cq-combat',inBattle);$('.cq-event').hidden=!inBattle;const session=sessionMetrics(s,live);let L=level(),hp=maxHP(),remaining=threshold(L+1)-s.xp;all('.cq-coinbalance').forEach(el=>el.textContent=fmt(s.coins||0));$('.cq-full').hidden=view==='overlay'||view==='devices';$('.cq-overlay').hidden=view!=='overlay';$('.cq-layout').hidden=view==='character';$('.cq-character').hidden=view!=='character';all('.cq-hpnumber').forEach(e=>e.textContent=fmt(s.hp)+' / '+hp);all('.cq-totalxp').forEach(e=>e.textContent=fmt(s.xp));all('.cq-nextxp').forEach(e=>e.textContent=fmt(remaining)+' XP');$('.cq-hpfill').style.width=Math.max(0,s.hp/hp*100)+'%';$('.cq-xpmeter i').style.width=(s.xp-threshold(L))/cost(L)*100+'%';$('.cq-player .cq-windowtitle .cq-gold').textContent='LV '+L;setStat('attack',fmt(atk()));$('.cq-characterhead .cq-gold').textContent=L;setStat('to-next-label','To Level '+(L+1));setStat('chapter-name',s.chapter+' · '+(CHAPTER_BIOMES[s.chapter]?.name||'THE IRON PASS'));setStat('chapter-distance',s.miles.toFixed(1)+' / 100 MI');setStat('next-boss',s.boss?.name||'UNKNOWN GUARDIAN');setStat('ftp',live.ftp+' W');setStat('wkg',Number.isFinite(live.riderWeightKg)&&live.riderWeightKg>0?(live.ftp/live.riderWeightKg).toFixed(1)+' W/KG':'— W/KG');setStat('save-location','THIS DEVICE');$('.cq-statuslabel').textContent=s.mode==='boss'?'BOSS MODE':s.mode==='training'?'TRAINING / GRIND':'ADVENTURE';$('.cq-topline>span').innerHTML='<span class="cq-gold">CHAPTER '+s.chapter+'</span> &nbsp; '+(CHAPTER_BIOMES[s.chapter]?.name||'THE IRON PASS');$('.cq-game').dataset.biome=CHAPTER_BIOMES[s.chapter]?.biome||'other';$('.cq-mileage').innerHTML=s.miles.toFixed(1)+' <span>/ 100 MI</span>';$('.cq-chaptermeter i').style.width=s.miles+'%';$('.cq-chapterhint').textContent=s.mode==='training'?'Chapter distance paused during training.':(100-s.miles).toFixed(1)+' miles to the chapter boss.';$('.cq-bossname>b').textContent=s.boss?.name||'UNKNOWN GUARDIAN';$('.cq-bossname>span').textContent=s.miles>=100?'Ready to challenge':'Not yet reached';$('.cq-modehint').textContent=s.mode==='boss'?'10-minute warmup, then your chapter boss. Chapter progress stays put.':s.mode==='training'?'Earn XP. Chapter miles stay put.':'Earn XP. Advance your chapter.';all('[data-mode]').forEach(b=>b.classList.toggle('cq-active',b.dataset.mode===s.mode));$('#pedal').textContent=running?'Pause pedaling':'Begin Adventure';$('.cq-message').textContent=message;renderRideReadouts(session,L,remaining);const html=eventMarkup();if(html!==previousEvent){patchMarkup($('.cq-event'),html);previousEvent=html;}draw();questBaseline?.sync();syncFloating();}
function syncFloating(){if(!floating||floating.closed)return;const source=$('.cq-overlay');const clone=source.cloneNode(true);clone.hidden=false;clone.querySelectorAll('[data-float],[data-state]').forEach(e=>e.remove());const markup=clone.outerHTML;if(markup!==floatingMarkup){patchMarkup(floating.document.getElementById('cq-preview'),markup);floatingMarkup=markup;} }
async function openFloating(){try{if(floating&&!floating.closed){floating.focus();return;}const alwaysOnTop='documentPictureInPicture' in window||'documentPictureInPicture' in window.parent;const width=Math.max(600,Math.min(1600,Math.round(screen.availWidth*.8))),height=170,left=Math.round((screen.availWidth-width)/2),top=Math.max(0,screen.availHeight-height-40);if(window.parent!==window&&window.parent.openCycleQuestOverlay){floating=await window.parent.openCycleQuestOverlay({width,height});}else if(alwaysOnTop){floating=await window.documentPictureInPicture.requestWindow({width,height,preferInitialWindowPlacement:true});}else{floating=window.open('','cycle-quest-overlay','popup,width='+width+',height='+height+',left='+left+',top='+top);}if(!floating){message='Allow popups to open the floating overlay.';render();return;}const doc=floating.document;doc.head.replaceChildren();doc.title='Cycle Quest — Overlay';document.querySelectorAll('style,link[rel=stylesheet]').forEach(e=>doc.head.append(e.cloneNode(true)));const style=doc.createElement('style');style.textContent='html,body{margin:0!important;padding:0!important;height:100%!important;overflow:hidden!important;background:#07112c}#cq-preview{height:auto!important;max-width:none!important;width:100%!important;display:block!important}#cq-preview .cq-overlay{margin:0!important;border-radius:0!important;box-shadow:none!important}';doc.head.append(style);doc.body.replaceChildren();const host=doc.createElement('div');host.id='cq-preview';doc.body.append(host);host.addEventListener('click',e=>{const b=e.target.closest('[data-reward]');if(b)choose(b.dataset.reward);});doc.addEventListener('keydown',rewardKey);floatingMarkup='';floating.addEventListener('resize',()=>{floatingMarkup='';draw();syncFloating();});floating.addEventListener('pagehide',()=>{floating=null;floatingMarkup='';});message=alwaysOnTop?'Always-on-top overlay opened.':'Floating window opened. Always-on-top requires a browser with Document Picture-in-Picture.';render();}catch{message='Could not open the overlay. Try Chrome or Edge on desktop.';render();}}
$('#float-overlay').onclick=openFloating;
const bestiaryButton=document.createElement('button');bestiaryButton.textContent='Bestiary & credits';bestiaryButton.className='cq-choice';$('.cq-character').append(bestiaryButton);
bestiaryButton.onclick=()=>{
 const band=chapterLevels(s.chapter,s.miles),visible=[...chapterMonsters(s.chapter),{id:'headwind',name:'Headwind'}];
 document.getElementById('bestiary-current').textContent='CHAPTER '+s.chapter+' · ENEMIES LV '+band.min+'–'+band.max+' · BOSS LV '+band.boss;
 document.getElementById('bestiary-rows').innerHTML=visible.map(m=>{
  const low=makeBattle('enemy',{monsterId:m.id,level:band.min}),high=makeBattle('enemy',{monsterId:m.id,level:band.max});
  return '<tr><td>'+safeText(m.name)+'</td><td>'+band.min+'–'+band.max+'</td><td>'+fmt(low.hp)+'–'+fmt(high.hp)+'</td><td>'+low.dps.toFixed(2)+'–'+high.dps.toFixed(2)+'</td><td>'+low.reward+'–'+high.reward+'</td></tr>';
 }).join('');document.getElementById('bestiary-dialog').showModal();
};

function routeAscent(){if(s.route?.endless)return Math.max(0,Number(live.ascentFeet)||0);if(!s.route)return 642;const m=(s.routeMiles||0)*METERS_PER_MILE;let gain=0;for(let i=1;i<s.route.points.length;i++){const a=s.route.points[i-1],b=s.route.points[i];if(a.d>=m)break;gain+=Math.max(0,(m>=b.d?b.e:sample(s.route,m))-a.e);}return gain/.3048;}
let pendingRoute=null;const routeDialog=document.getElementById('route-dialog'),distanceInput=document.getElementById('route-distance'),terrainInput=document.getElementById('route-terrain'),gainInput=document.getElementById('route-gain'),routeUse=document.getElementById('route-use'),routeGenerate=document.getElementById('route-generate'),routeError=document.getElementById('route-error');
function canPlan(){if(externalSaveChanged){message='Character changed in another tab. Reload this page.';render();return false;}if(s.battle||s.reward||levelUp){message='Finish your encounter or level-up celebration before changing routes.';render();return false;}running=false;parentSend({type:'pause'});render();return true;}
function openPlanner(imported=false){pendingRoute=null;routeError.textContent='';document.getElementById('route-summary').textContent='';document.getElementById('route-preview').innerHTML='';routeUse.disabled=true;routeGenerate.hidden=imported;document.querySelector('.cq-routefields').hidden=imported;document.getElementById('route-dialog-title').textContent=imported?'UPLOADED ROUTE':'CREATE YOUR ROUTE';routeDialog.showModal();}
function previewRoute(route){pendingRoute=route;routeUse.disabled=false;document.getElementById('route-summary').textContent=route.name+' · '+(route.distance/METERS_PER_MILE).toFixed(1)+' miles · '+(route.hasElevation?fmt(route.gain/.3048)+' ft ascent':'Elevation unavailable — flat simulation');document.getElementById('route-preview').innerHTML=elevationSVG(route,sample,600,150,0,false);}
$('#create-route').onclick=()=>{if(canPlan())openPlanner();};
function useRoute(route,{grind=false}={}){profileInspect=null;s.route=route;s.routeMiles=0;if(grind)s.mode='training';s.summitDoneEnd=null;s.pendingSummit=null;summitChoices.clear();summitSeen.clear();lastLiveDistance=0;parentSend({type:'route',route:s.route});view='ride';message=route.endless?'Endless ride ready. Pedal to gain XP and battle monsters; chapter progress is paused.':'Route loaded: '+s.route.name+'. Start pedaling when ready.';if(routeDialog.open)routeDialog.close();save();render();}
$('#surprise-route').onclick=()=>{if(!canPlan())return;const terrain=['flat','rolling','climbing','punchy'][Math.floor(Math.random()*4)],miles=10+Math.floor(Math.random()*31);useRoute(generateRoute(miles,terrain));};
$('#endless-route').onclick=()=>{if(!canPlan())return;const route=generateRoute(5,terrainInput.value);route.endless=true;route.windowStart=0;route.name='Endless '+route.terrain+' ride';useRoute(route,{grind:true});};
terrainInput.onchange=()=>{gainInput.placeholder='Natural terrain';};
routeGenerate.onclick=()=>{try{routeError.textContent='';previewRoute(generateRoute(Number(distanceInput.value),terrainInput.value,gainInput.value.trim()===''?null:Number(gainInput.value)));}catch(e){routeError.textContent=e.message;}};
routeUse.onclick=()=>{if(pendingRoute)useRoute(pendingRoute);};
$('#upload-gpx').onclick=()=>{if(canPlan())$('#gpxfile').click();};$('#gpxfile').onchange=async e=>{const file=e.target.files[0];if(!file)return;openPlanner(true);try{if(file.size>8*1024*1024)throw Error('Choose a GPX file smaller than 8 MB.');previewRoute(parseGPX(await file.text()));}catch(err){routeError.textContent=err.message;}e.target.value='';};

root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.float)openFloating();if(b.dataset.state==='overlay'){openFloating();}else if(b.dataset.state){view=b.dataset.state;questBaseline?.setPage(view==='character'?'character':'ride');render();}if(b.dataset.mode){if(s.battle||s.reward)return;s.mode=b.dataset.mode;warmupSeconds=s.mode==='boss'?600:0;s.bossWarmupRemaining=warmupSeconds;s.bossModeComplete=false;s.bossWarmupReady=false;showEncounterView();save();render();}if(b.dataset.demo)encounter(b.dataset.demo);if(b.dataset.warmup!==undefined){warmupSeconds=Number(b.dataset.warmup);s.bossWarmupRemaining=warmupSeconds;s.bossModeComplete=false;if(!warmupSeconds)encounter('boss');else{message='Pedal to warm up for the boss.';render();}}if(b.dataset.reward)choose(b.dataset.reward);if(b.dataset.rest)rest();});$('#pedal').onclick=()=>parentSend({type:'toggle'});$('#quest-connect').onclick=()=>parentSend({type:'connect'});$('#quest-finish').onclick=()=>parentSend({type:'finish'});
$('#export').onclick=()=>{const blob=new Blob([invalidStoredSave&&persistedSave?persistedSave:JSON.stringify(s,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='cycle-quest-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};$('#import').onclick=()=>{if(invalidStoredSave){$('#savefile').click();return;}if(live.activityStartTime&&!live.routeComplete){message='Finish the current ride before importing another character.';render();return;}if(canPlan())$('#savefile').click();};$('#savefile').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>8*1024*1024)throw Error('Save file is too large');const v=readCharacter(await file.text());if(localStorage.getItem(key)!==persistedSave||(!invalidStoredSave&&externalSaveChanged))throw Error('Character changed in another tab. Reload before importing.');if(persistedSave&&!window.confirm('Replace this device’s character with the imported save? Your current save will be kept as a pre-import backup.'))return;if(persistedSave)localStorage.setItem(key+'-pre-import-backup',persistedSave);s=v;if(!s.route){s.route=generateRoute(15,'rolling');s.routeMiles=0;}invalidStoredSave=false;externalSaveChanged=false;levelUps.clear();levelUp=null;running=false;s.hp=Math.min(maxHP(),s.hp);warmupSeconds=s.mode==='boss'&&!s.bossModeComplete?Math.max(0,Math.min(600,s.bossWarmupRemaining??600)):0;restoreRewardState();lastLiveDistance=(s.routeMiles||0)*METERS_PER_MILE;if(s.route)parentSend({type:'route',route:s.route,restoreMiles:s.routeMiles||0});save();message='Save imported. Ready to ride.';render();}catch(err){message='Could not import: '+err.message;render();}finally{e.target.value='';}};
root.addEventListener('keydown',rewardKey);window.addEventListener('pagehide',save);window.addEventListener('storage',e=>{if(e.key===key&&e.newValue!==persistedSave){externalSaveChanged=true;running=false;parentSend({type:'pause'});message='Character changed in another tab. Reload before continuing.';render();}});new ResizeObserver(draw).observe(root);load();
questBaseline=mountQuestBaseline({
 root,
 getState:()=>s,
 getLive:()=>live,
 getView:()=>view,
 changeView:next=>{view=next;render();},
 openOverlay:openFloating,
 routeSVG:route=>elevationSVG(route,sample,1000,250,0,false),
 parentSend
});
questBaseline.sync();
if(!s.route){s.route=generateRoute(15,'rolling');s.routeMiles=0;}
function claimWorkout(workout,chapterCredit){
 if(externalSaveChanged||localStorage.getItem(key)!==persistedSave)throw Error('This character changed in another tab. Reload before claiming a workout.');
 const before=level(),{state:next,result}=creditWorkout(s,workout,chapterCredit),after=level(next.xp);
 if(after>before)next.hp=maxHP(after);
 if(next.xp>MAX_XP)throw Error('This reward exceeds the current character XP limit. Export your save first.');
 
 if(result.bossReady&&!next.boss)next.boss=makeBattle('boss',{chapter:next.chapter});
 const text=JSON.stringify(next);try{localStorage.setItem(key,text);}catch{throw Error('Could not save the reward on this device. Export your save or free browser storage, then try again.');}
 s=next;persistedSave=text;if(after>before)levelUps.enqueue(before,after);view='ride';message='Workout recorded! +'+fmt(result.xp)+' XP'+(result.miles?' · +'+result.miles.toFixed(2)+' chapter miles':'')+'.'+(result.bossReady?' Your chapter boss awaits.':'');render();
}
function rememberIndoor(m){
 if(Number.isFinite(m.demoSeconds)||!m.connected||!m.running||!(m.power>0&&m.cadence>0))return;
 const start=Date.parse(m.activityStartTime);if(!Number.isFinite(start))return;const end=Date.now(),id='indoor:'+start;
 s.workouts||=[];const entry=s.workouts.find(w=>w.id===id);if(entry)entry.end=Math.max(entry.end,end);else if(s.workouts.length<5000)s.workouts.push({id,name:'Ride Breakaway indoor ride',kind:'indoor',family:'cycling',source:'Ride Breakaway',start,end,day:dayAt(start),xp:0,miles:0});
}
initWorkoutUI({root,getState:()=>s,apply:claimWorkout,canOpen:canPlan});
// Injected into the autoplay build only. Production never accepts demo actions.
function handleDemoAction(action){
 rewardChoice=null;
 if(action==='claim'){choose('coins');return;}
 if(action==='win'||action==='lose'){if(s.battle)finish(action==='win');render();return;}
 levelUps.clear();levelUp=null;s.battle=null;s.reward=false;s.pendingReward=null;
 const crab=/^crab-([123])$/.exec(action),ratCount={rat:1,'rats-2':2,rats:3}[action];
 const fixedRat=/^rat-level-(1|6|10)$/.exec(action);
 if(crab||ratCount||fixedRat||action==='headwind'||action==='mixed-rats'){
  const id=action==='headwind'?'headwind':crab?'crab':'rat';
  const levels=action==='mixed-rats'?[1,6,10]:Array.from({length:crab?Number(crab[1]):ratCount||1},()=>fixedRat?Number(fixedRat[1]):chapterLevels(s.chapter,s.miles).min);
  s.battle=enemyGroup(levels.map(level=>makeBattle('enemy',{level,monsterId:id})));
  showEncounterView();message='Enemy-level artwork preview';
 }else if(action==='group'){encounter('enemy',3);return;}
 else if(action==='chapter-1'||action==='chapter-2'){
  s.chapter=action==='chapter-1'?1:2;s.miles=0;s.boss=null;s.chapterEncounter=null;message='Previewing '+CHAPTER_BIOMES[s.chapter].name;
 }else if(action==='reset'){
  s=fresh();s.route=generateRoute(15,'rolling',null,42077);s.routeMiles=0;lastLiveDistance=0;
  parentSend({type:'route',route:s.route});message='Autoplay preview reset.';
 }else if(action==='level'){award(threshold(level()+1)-s.xp);s.nextEncounter=20;}
 else if(action==='reward'){
  s.pendingReward=battleRewards(makeBattle('enemy',{level:chapterLevels(s.chapter,s.miles).min,monsterId:'rat'}));award(s.pendingReward.xp);s.reward=true;message='XP earned! Choose health or coins.';
 }else if(['enemy','summit','boss'].includes(action))encounter(action);
 save();render();
}

window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.parent||e.data?.source!=='breakaway')return;const m=e.data;if(externalSaveChanged){parentSend({type:'pause'});return;}
 if(m.type==='notice'){message=String(m.message||'');render();return;}
 if(m.type==='navigate'){
   if(['route','devices','ride','overlay','character'].includes(m.page)){
    view=m.page==='overlay'?'overlay':m.page==='character'?'character':m.page==='devices'?'devices':'ride';
    questBaseline?.setPage(m.page);
    render();
   }
   return;
  }
  if(m.type==='demo-action'){handleDemoAction(m.action);return;}
 if(m.type==='telemetry'){const now=performance.now(),dt=Number.isFinite(m.demoSeconds)?Math.min(30,m.demoSeconds):(lastLiveTime?Math.min(3,(now-lastLiveTime)/1000):0);lastLiveTime=now;live=m;if(m.running&&m.activityStartTime&&(!s.session||s.session.id!==m.activityStartTime)){s.session={id:m.activityStartTime,startXP:s.xp,startLevel:level(),startAttack:atk(),startMiles:s.rideMiles,startSeconds:s.rideSeconds,startCoins:s.coins||0,monsters:0,bosses:0,completed:false};}rewardGesture.sample(now,m.cadence);if(s.reward&&rewardChoice)rewardGesture.update(rewardChoice,now,m.cadence,m.power,m.connected);rememberIndoor(m);if(s.route?.endless&&m.routeProfile){s.route={...s.route,...m.routeProfile};}if(m.buttonsReleased)clickArmed=true;power=Math.max(0,Math.round(m.power));running=!!m.running&&!!m.connected;const previousDistance=lastLiveDistance;const delta=Math.max(0,m.distanceM-lastLiveDistance);lastLiveDistance=m.distanceM;if(!s.route?.endless){
  const c=m.summitBoss;
  summitChoices.clear();
  if(c&&Number.isFinite(c.end)){
   const id=Math.round(c.end);if(s.summitDoneEnd!==id)summitChoices.set(id,true);
   if(s.mode!=='boss'&&m.running&&m.distanceM>=c.end&&s.summitDoneEnd!==id&&!s.pendingSummit)s.pendingSummit={end:c.end,category:c.category};
  }
  const pending=s.pendingSummit;
  if(s.mode!=='boss'&&pending&&!s.battle&&!s.reward&&!levelUp&&s.hp>1&&m.connected){
   if(s.mode!=='boss')encounter('summit');
   if(s.battle?.kind==='summit'){
    s.battle.category=pending.category;s.summitDoneEnd=Math.round(pending.end);s.pendingSummit=null;save();
   }
  }
 }else{for(const c of (Array.isArray(m.climbs)?m.climbs:[])){const id=Math.round(c.end);if(!summitChoices.has(id))summitChoices.set(id,Math.random()<.25);if(previousDistance<c.end&&m.distanceM>=c.end&&summitChoices.get(id)&&!summitSeen.has(id)&&!s.battle&&!s.reward&&!levelUp){summitSeen.add(id);if(s.mode!=='boss')encounter('summit');if(s.battle?.kind==='summit'){s.battle.category=c.category;}}}}
 if(!s.battle&&!s.reward&&!levelUp&&running){s.rideMiles+=delta/METERS_PER_MILE;if(s.mode==='adventure')s.miles=Math.min(100,s.miles+delta/METERS_PER_MILE);s.routeMiles=m.distanceM/METERS_PER_MILE;if(s.miles>=100&&s.mode==='adventure'&&warmupSeconds<=0){running=false;parentSend({type:'pause',autoResume:false});bossStats();message='Chapter boss ready. Fight now or return next ride.';}else if(s.mode!=='boss'&&power>0&&m.cadence>0&&warmupSeconds<=0){if(!s.battle){s.nextEncounter=Math.max(0,s.nextEncounter-dt);if(s.nextEncounter<=0)encounter('enemy');}}}

 if(running){let remaining=dt;while(remaining>0){const part=Math.min(.1,remaining);step(part);remaining-=part;}}
 if(!s.route?.endless&&s.summitDoneEnd!=null&&!s.pendingSummit&&!s.battle)parentSend({type:'summit-resolved'});
 if(m.routeComplete){running=false;finishQuestSummary();message='Route complete! Choose another route to continue your adventure.';}
 render();if(++saveTick>=5){save();saveTick=0;}
 }else if(m.type==='ride-finished'){finishQuestSummary();
 }else if(m.type==='indoor-history'){s.workouts||=[];for(const w of (Array.isArray(m.workouts)?m.workouts:[]).slice(0,5000)){const start=Date.parse(w.start),end=Date.parse(w.end);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||s.workouts.length>=5000)continue;const id='indoor:'+start;if(!s.workouts.some(e=>e.id===id))s.workouts.push({id,name:'Ride Breakaway indoor ride',kind:'indoor',family:'cycling',source:'Ride Breakaway',start,end,day:dayAt(start),xp:0,miles:0});}save();
 }else if(m.type==='click'){if(!m.plus&&!m.minus){clickArmed=true;return;}if(s.reward&&clickArmed){clickArmed=false;choose(m.plus?'coins':'heal');}}
});
function rewardKey(e){if(e.target.matches('input,select,textarea,[contenteditable=true]'))return;if(s.reward&&['-','+','='].includes(e.key)){e.preventDefault();choose(e.key==='-'?'heal':'coins');}}
function rewardLabel(){const r=s.pendingReward;if(!r)return '';return '+'+r.xp+' XP EARNED · '+(rewardChoice?.selected==='heal'?'HEAL '+r.hp+' HP':'GAIN '+r.coins+' COINS')+' · '+Math.max(0,Math.ceil(((rewardChoice?.end||0)-performance.now())/1000))+'s';}

setInterval(()=>{if(externalSaveChanged)return;if(s.reward&&rewardChoice&&performance.now()>=rewardChoice.end){choose(rewardChoice.selected);return;}if(s.reward||levelUp||levelUps.waiting)render();},200);
lastLiveDistance=(s.routeMiles||0)*METERS_PER_MILE;render();if(!invalidStoredSave)parentSend({type:'route',route:s.route,restoreMiles:s.routeMiles||0});parentSend({type:'ready'});
})();
