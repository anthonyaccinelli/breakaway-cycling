/** Export legacy browser-local Pedalkin data before moving to a new origin.
 * Matches pedalkin/src/portable-save.ts exactly for round-trip compatibility.
 * This module never deletes or mutates the original save.
 */
const KEYS=['spokemon-caught-v1','spokemon-buddy-v1','spokemon-input-choice-v1'] as const;
export function mountLegacyPedalkinExport():void {
  const button=document.createElement('button');
  button.type='button';
  button.id='pedalkinMigrationBackup';
  button.textContent='BACK UP PEDALKIN SAVE';
  button.title='Download a copy of your creature collection and buddy before the standalone migration';
  button.setAttribute('aria-label','Back up Pedalkin collection before moving to the standalone game');
  Object.assign(button.style,{
    position:'fixed',bottom:'14px',left:'14px',zIndex:'2147483000',
    background:'#fcf0d6',color:'#173c40',border:'2px solid #173c40',
    borderRadius:'6px',padding:'9px 12px',fontWeight:'bold',cursor:'pointer',
    fontFamily:'system-ui,sans-serif',fontSize:'12px'
  });
  const update=()=>{
    button.hidden=document.body.dataset.rideExperience!=='pedalkin';
  };
  button.addEventListener('click',()=>{
    try {
      const data:Record<string,string|null>={};
      for(const key of KEYS)data[key]=localStorage.getItem(key);
      const output=JSON.stringify({
        format:'spokemon-portable-save',version:1,
        exportedAt:new Date().toISOString(),data
      },null,2);
      const url=URL.createObjectURL(new Blob([output],{type:'application/json'}));
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download='pedalkin-save-'+new Date().toISOString().slice(0,10)+'.json';
      document.body.append(anchor);anchor.click();anchor.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){
      window.alert('Pedalkin backup failed. Your existing save has not been changed. '+String(e));
    }
  });
  document.body.append(button);
  const observer=new MutationObserver(update);
  observer.observe(document.body,{attributes:true,attributeFilter:['data-ride-experience']});
  update();
}
