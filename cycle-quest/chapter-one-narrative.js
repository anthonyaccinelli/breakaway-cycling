// Chapter 1's authored text is deliberately independent of trainer and UI code.
// A scene may be read while riding, but its choices never pause the trainer.
export const CHAPTER_ONE_EVENTS = Object.freeze([
  {
    id:'fallen-courier',mile:0,title:'THE FALLEN COURIER',
    overlay:['A woman lies beside an overturned wagon.','"Deliver the vial to the Healer," she whispers.'],
    text:[
      'Salt hangs heavy in the morning air. The coastal road bends inland and disappears into fog.',
      'A bicycle lies twisted beside an overturned wagon. A woman wearing the torn insignia of a royal courier is slumped against its wheel.',
      'She presses a glass vial of silver liquid into your hand. "Deliver... to the Healer." Her hand falls still. Somewhere beyond the fog, a bell begins to toll.'
    ],
    choices:[
      {id:'examine',label:'EXAMINE THE VIAL',result:'The silver liquid moves as though it can hear your heartbeat.'},
      {id:'conceal',label:'HIDE THE VIAL',result:'You tuck the vial beneath your coat, where no passing guard will see it.'}
    ]
  },
  {
    id:'fog-bells',mile:2,title:'BELLS IN THE FOG',
    overlay:['The royal bells are tolling behind you.','Hooves strike the stones somewhere in the mist.'],
    text:[
      'The bells have not stopped. Each toll carries farther across the empty coastal road.',
      'You hear riders behind you, but the fog conceals their number. A royal search has begun. You pedal toward the inland road.'
    ]
  },
  {
    id:'king-road',mile:5,title:'THE KING\'S ROAD',
    overlay:['A royal proclamation hangs from a gate.','A courier is wanted for theft of a silver vial.'],
    text:[
      'A torn proclamation flaps against the post of an abandoned toll gate.',
      'BY ORDER OF THE KING: ALL COURIERS ARE TO BE SEARCHED. THEFT OF ROYAL PROPERTY IS PUNISHABLE BY DEATH.',
      'Your description has already reached the King. Whatever is inside the vial, he fears someone else will possess it.'
    ]
  },
  {
    id:'wilds-edge',mile:8,title:'THE EDGE OF THE WILDS',
    overlay:['Something rustles through the undergrowth.','The road ahead is no longer safe.'],
    text:[
      'The coastal road narrows into a forest track. Claw marks score the bark of the trees.',
      'A low growl answers from the brush. You reach for your handlebars and ride on.'
    ]
  },
  {
    id:'chapter-one-ten',mile:10,title:'TEN MILES FROM HOME',
    overlay:['The sea has vanished behind the pines.','Only the road and the Healer lie ahead.'],
    text:[
      'The air loses its salt. Tall pines surround the trail, swallowing the sound of the sea.',
      'For the first time, you understand that returning home is no longer an option. You have become the King\'s enemy.'
    ]
  }
]);
export const chapterOneScene=id=>CHAPTER_ONE_EVENTS.find(scene=>scene.id===id)||null;
export function nextChapterOneEvent(miles,seen=[]){
  if(!Number.isFinite(miles)||miles<0)return null;
  return CHAPTER_ONE_EVENTS.find(scene=>miles>=scene.mile&&!seen.includes(scene.id))||null;
}
// The profile is never replaced outside an actual Story or combat phase.
export function overlayContentMode({battle=false,reward=false,levelUp=false,warmup=false,story=false}={}){
  if(battle||reward||levelUp||warmup)return 'battle';
  return story?'story':'explore';
}
