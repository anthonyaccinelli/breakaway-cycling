// Starts in the homepage click's activation stack, before beta access resolves.
export function createQuestIntroMusic(audio:HTMLAudioElement,storage:Pick<Storage,'getItem'>=localStorage){
 let active=false,enabled=true;
 const refresh=()=>{try{enabled=storage.getItem('cycle-quest-music-enabled')!=='false';}catch{}};
 const play=()=>{if(active&&enabled)void audio.play().catch(()=>{});};
 audio.loop=true;audio.volume=.6;audio.preload='none';
 return {
  start(){refresh();active=true;audio.currentTime=0;play();},
  stop(){active=false;audio.pause();audio.currentTime=0;},
  setEnabled(value:boolean){enabled=value;if(!enabled)audio.pause();else play();}
 };
}
