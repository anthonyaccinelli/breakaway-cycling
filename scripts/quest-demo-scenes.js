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
