// Injected into the autoplay build only. Production never accepts demo actions.
function handleDemoAction(action){
 rewardChoice=null;
 if(action==='claim'){choose('coins');return;}
 if(action==='win'||action==='lose'){if(s.battle)finish(action==='win');render();return;}
 levelUps.clear();levelUp=null;s.battle=null;s.reward=false;s.pendingReward=null;
 const crab=/^crab-([123])$/.exec(action);
 const ratCount={rat:1,'rats-2':2,rats:3}[action];
 if(crab||ratCount||action==='headwind'){
  const id=action==='headwind'?'headwind':crab?'crab':'rat',count=action==='headwind'?1:crab?Number(crab[1]):ratCount;
  const one=makeBattle('enemy',{level:level(),ftp:live.ftp,monsterId:id});
  const enemies=Array.from({length:count},()=>({id,name:id.toUpperCase(),hp:one.hp,max:one.max}));
  s.battle={...one,name:count===1?one.name:count+' '+id.toUpperCase()+'S',reward:150*count,enemies,hp:one.hp*count,max:one.max*count};
  showEncounterView();message=count+' '+id+' artwork preview';
 }else if(action==='group'){encounter('enemy',3);return;}
 else if(action==='chapter-1'||action==='chapter-2'){
  s.chapter=action==='chapter-1'?1:2;s.miles=0;s.boss=null;s.chapterEncounter=null;message='Previewing '+CHAPTER_BIOMES[s.chapter].name;
 }else if(action==='reset'){
  s=fresh();s.route=generateRoute(15,'rolling',null,42077);s.routeMiles=0;lastLiveDistance=0;
  parentSend({type:'route',route:s.route});message='Autoplay preview reset.';
 }else if(action==='level'){award(threshold(level()+1)-s.xp);s.nextEncounter=20;}
 else if(action==='reward'){
  s.pendingReward=battleRewards({kind:'enemy'});award(s.pendingReward.xp);s.reward=true;message='XP earned! Choose health or coins.';
 }else if(['enemy','summit','boss'].includes(action))encounter(action);
 save();render();
}
