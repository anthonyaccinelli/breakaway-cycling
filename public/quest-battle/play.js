import {advanceTurnBattle, guardBand, makeBattle} from '../cq-autoplay/combat.js';

const el=id=>document.getElementById(id);
const hud=document.querySelector('.hud');
let battle,hp,potions,running,outcome,last,overlay,round=0;
const enemies=['rat','bat','snake'];
function reset(){
 const id=enemies[round%enemies.length];
 battle=makeBattle('enemy',{monsterId:id,level:1});
 // Playtest tuning: a minute-long encounter with a meaningful cost for missed guards.
 Object.assign(battle,{hp:13200,max:13200,dps:1.8});
 hp=100;potions=1;running=false;outcome=null;
 el('art').src='/monsters/'+id+'.png';
 el('again').hidden=true;el('play').hidden=false;el('play').textContent='Start battle';
 draw();
}
function draw(){
 const guard=battle.turn==='guard',watts=Number(el('effort').value);
 hud.classList.toggle('guard',guard);
 el('owner').textContent=outcome?'BATTLE OVER':guard?'ENEMY TURN':'YOUR TURN';
 el('phase').textContent=outcome?(outcome==='win'?'VICTORY':'DEFEAT'):guard?'GUARD':battle.drinking?'POTION':battle.special?'SPECIAL':'ATTACK';
 const feedback=battle.lastHit!=null&&battle.turnTime<2;
 el('cue').textContent=outcome?'':guard?'Hold '+guardBand(battle.guardTarget).join('–')+' W':battle.drinking?'Health restored':battle.special?'Charged strike':feedback?Number(battle.lastBlock.toFixed(1))+' blocked · '+Number(battle.lastHit.toFixed(1))+' taken':'Pedal to strike';
 el('clock').textContent=outcome?'—':Math.ceil(5-(battle.turnTime||0))+'s';
 el('power').textContent=el('reading').textContent=watts+' W';
 el('rhp').textContent=Math.ceil(hp)+' HP';el('ehp').textContent=Math.ceil(battle.hp)+' HP';
 el('enemy').textContent=battle.name;el('rbar').style.width=hp+'%';el('ebar').style.width=100*battle.hp/battle.max+'%';
 if(overlay&&!overlay.closed)overlay.document.body.replaceChildren(hud.cloneNode(true));
}
el('effort').oninput=draw;
el('play').onclick=()=>{
 running=!running;last=performance.now();el('play').textContent=running?'Pause':'Resume';
 el('notice').textContent=running?'Guard charges your special. You carry one potion, used automatically below 25 HP.':'Battle paused.';
 draw();
};
el('again').onclick=()=>{round++;reset();el('play').click()};
setInterval(()=>{
 if(!running)return;
 const now=performance.now(),dt=Math.min(.4,(now-last)/1000);last=now;
 const watts=Number(el('effort').value);
 const next=advanceTurnBattle(battle,hp,watts,dt,{watts,cadence:watts?80:0,potions,maxHP:100});
 ({battle,hp,potions,outcome}=next);
 if(outcome){running=false;el('play').hidden=true;el('again').hidden=false;el('notice').textContent=outcome==='win'?'Enemy defeated. Ready for the next encounter?':'You reached 1 HP. Try guarding within the displayed range.'}
 draw();
},100);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&(!overlay||overlay.closed))el('play').click()});
el('overlay').onclick=async()=>{
 try{
 if(overlay&&!overlay.closed){overlay.focus();return}
 overlay=window.documentPictureInPicture?await documentPictureInPicture.requestWindow({width:740,height:170}):window.open('','cq-turn-hud','popup,width=740,height=170');
 if(!overlay)throw Error();
 overlay.document.title='Cycle Quest · Battle overlay';overlay.document.head.append(document.querySelector('style').cloneNode(true));overlay.document.body.className='floating';draw();
 }catch{el('notice').textContent='Your browser could not open a floating window. The same 170 px battle overlay is playable here.'}
};
reset();
