/**
 * Maximize the numeric readouts in each always-on-top overlay card.
 *
 * Shared between Classic and Survival, but never changes labels, metrics,
 * the terrain chart, windows, or either game's visual theme.
 * Each number is measured using that tile's computed font, width and height.
 * It is re-measured after content updates or window resizing.
 */
function fitOverlayNumbers(doc:Document, tiles:HTMLElement[]){
 const viewport=doc.defaultView;
 if(!viewport)return;
 const context=doc.createElement('canvas').getContext('2d');
 if(!context)return;
 const px=(value:string)=>Number.parseFloat(value)||0;
 for(const tile of tiles){
  if(tile.style.display==='none'||!tile.clientWidth||!tile.clientHeight)continue;
  const number=tile.querySelector<HTMLElement>('b, strong');
  const label=tile.querySelector<HTMLElement>('small');
  if(!number||!label)continue;
  const style=viewport.getComputedStyle(tile);
  const numberStyle=viewport.getComputedStyle(number);
  const labelStyle=viewport.getComputedStyle(label);
  const availableWidth=Math.floor(tile.clientWidth-px(style.paddingLeft)-px(style.paddingRight)
   -px(style.borderLeftWidth)-px(style.borderRightWidth)-6);
  // Labels stay exactly as designed. Reserve their full rendered height.
  const labelHeight=Math.max(label.offsetHeight,Math.ceil(px(labelStyle.fontSize)*1.2));
  const availableHeight=Math.floor(tile.clientHeight-px(style.paddingTop)-px(style.paddingBottom)
   -px(style.borderTopWidth)-px(style.borderBottomWidth)-labelHeight-px(style.rowGap)-6);
  if(availableWidth<10||availableHeight<9)continue;
  const lower=8;
  const upper=Math.min(88,Math.floor(availableHeight/1.05));
  if(upper<lower)continue;
  const weight=numberStyle.fontWeight||'700';
  const family=numberStyle.fontFamily||'sans-serif';
  const content=number.textContent?.trim()||'—';
  const fits=(size:number)=>{
   context.font=weight+' '+size+'px '+family;
   return context.measureText(content).width<=availableWidth;
  };
  let low=lower,high=upper,chosen=lower;
  while(low<=high){
   const midpoint=(low+high)>>1;
   if(fits(midpoint)){chosen=midpoint;low=midpoint+1;}
   else high=midpoint-1;
  }
  number.style.setProperty('font-size',chosen+'px','important');
  number.style.setProperty('line-height','1.05','important');
  number.style.setProperty('max-width','100%','important');
  number.style.setProperty('min-width','0','important');
  // Check DOM rendering as a final safety net for letter-spacing and
  // font rasterization differences from canvas measurements.
  while(chosen>lower&&number.scrollWidth>number.clientWidth+1){
   chosen--;
   number.style.setProperty('font-size',chosen+'px','important');
  }
 }
}

export function fitClassicOverlayNumbers(doc:Document){
 if(!doc.body.classList.contains('classic-design-overlay')
    ||doc.getElementById('overlayContent')?.classList.contains('survive-overlay'))return;
 const metrics=doc.getElementById('overlayMetrics');
 if(metrics)fitOverlayNumbers(doc,Array.from(metrics.querySelectorAll<HTMLElement>('.tile')));
}

export function fitSurvivalOverlayNumbers(doc:Document){
 if(!doc.body.classList.contains('survival-overlay-theme'))return;
 const content=doc.getElementById('overlayContent');
 if(!content)return;
 if(content.classList.contains('survive-overlay')){
  const chaseTiles=Array.from(content.querySelectorAll<HTMLElement>(
   '#surviveHud .survive-hud-metric, #surviveHud .survive-hud-timer > div'
  ));
  fitOverlayNumbers(doc,chaseTiles);
 }else{
  const metrics=doc.getElementById('overlayMetrics');
  if(metrics)fitOverlayNumbers(doc,Array.from(metrics.querySelectorAll<HTMLElement>('.tile')));
 }
}
