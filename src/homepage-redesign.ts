import './homepage-redesign.css';

/**
 * Rearrange existing homepage content without replacing handlers, routes,
 * support dialogs or owner-provided mode artwork.
 */
export function mountHomepageRedesign(home:HTMLElement):void {
 home.classList.add('home-v2');
 const brand=home.querySelector<HTMLElement>('.mode-landing-brand');
 const compatibility=home.querySelector<HTMLElement>('.beta-compat');
 // The tester check is the first content block immediately after the header.
 if(brand&&compatibility)brand.after(compatibility);
 const compatibilityCopy=compatibility?.querySelector<HTMLElement>('.beta-compat-copy');
 const details=compatibilityCopy?.querySelector<HTMLDetailsElement>('details');
 const summary=details?.querySelector('summary');
 const longCopy=compatibilityCopy?.querySelector<HTMLElement>(':scope > p');
 // Preserve the entire compatibility explanation, but put it behind its
 // existing native disclosure rather than spending a row on it.
 if(summary&&longCopy)summary.after(longCopy);
 const quickDescription=document.createElement('span');
 quickDescription.className='home-trainer-quick';
 quickDescription.textContent='Chrome or Edge · FTMS trainer · Bluetooth';
 compatibilityCopy?.querySelector('strong')?.after(quickDescription);

 const utilityBar=document.createElement('div');
 utilityBar.className='home-utility-bar';
 const existingUtilities=[
  home.querySelector<HTMLElement>('.beta-access-line'),
  home.querySelector<HTMLElement>('.mode-landing-footer'),
  home.querySelector<HTMLElement>('.mode-device-shortcut')
 ];
 existingUtilities.forEach(item=>{if(item)utilityBar.append(item);});
 home.append(utilityBar);

 const descriptions=[
  {id:'chooseClassic',title:'Classic',caption:'Routes, gradients, and freedom',number:'01'},
  {id:'chooseSurvival',title:'Survival',caption:'Outride the threat',number:'02'},
  {id:'chooseCycleQuest',title:'Cycle Quest',caption:'Pedal into an adventure',number:'03'}
 ];
 for(const item of descriptions){
  const card=home.querySelector<HTMLButtonElement>('#'+item.id);
  if(!card)continue;
  const label=document.createElement('span');
  label.className='home-mode-mobile-copy';
  label.innerHTML='<small>'+item.number+' / CHOOSE MODE</small><strong>'+item.title+'</strong><span>'+item.caption+'</span>';
  card.append(label);
 }
}
