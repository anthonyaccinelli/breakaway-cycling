// Independent progressive enhancement for the Classic Trainer settings.
// Runs even if the main ride controller fails during initialization.
const toggle=document.getElementById('classicToggle') as HTMLInputElement|null;
const panel=document.getElementById('classicPanel') as HTMLElement|null;
const smartCard=document.getElementById('connect')?.closest<HTMLElement>('.device-connect-card');
const shifting=document.getElementById('drivetrainSection') as HTMLElement|null;
if(toggle&&panel){
 const sync=()=>{
  const enabled=toggle.checked;
  panel.hidden=!enabled;
  panel.style.setProperty('display',enabled?'flex':'none','important');
  panel.style.flexDirection='column';
  if(smartCard){smartCard.hidden=enabled;smartCard.style.setProperty('display',enabled?'none':'','important');if(!enabled)smartCard.style.removeProperty('display');}
  if(shifting){shifting.hidden=enabled;shifting.style.setProperty('display',enabled?'none':'','important');if(!enabled)shifting.style.removeProperty('display');}
 };
 toggle.addEventListener('change',sync);
 sync();
}
