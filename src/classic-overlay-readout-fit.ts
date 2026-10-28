/**
 * Fit Classic's NUMERIC overlay values into their individual cards.
 * This is deliberately visual-only: labels, tile geometry, metric order,
 * telemetry and the Survivor/Cycle Quest overlays remain unchanged.
 *
 * A fixed clamp cannot accommodate both "6" (gear) and "00:00:00" (timer)
 * across a 600–1600px window. Fit each number after its live update using
 * the actual card bounds and the explicitly loaded Host Grotesk font.
 */
export function fitClassicOverlayNumbers(doc:Document){
 const body=doc.body;
 const metrics=doc.getElementById('overlayMetrics');
 const viewport=doc.defaultView;
 if(!metrics||!viewport||!body.classList.contains('classic-design-overlay')
   ||doc.getElementById('overlayContent')?.classList.contains('survive-overlay'))return;
 const context=doc.createElement('canvas').getContext('2d');
 if(!context)return;
 for(const tile of Array.from(metrics.querySelectorAll<HTMLElement>('.tile'))){
  if(tile.style.display==='none')continue;
  const number=tile.querySelector<HTMLElement>('b');
  const label=tile.querySelector<HTMLElement>('small');
  if(!number||!label||!tile.clientWidth||!tile.clientHeight)continue;
  const style=viewport.getComputedStyle(tile);
  const numberStyle=viewport.getComputedStyle(number);
  const labelStyle=viewport.getComputedStyle(label);
  const px=(value:string)=>Number.parseFloat(value)||0;
  const availableWidth=Math.floor(tile.clientWidth-px(style.paddingLeft)-px(style.paddingRight)-px(style.borderLeftWidth)-px(style.borderRightWidth)-4);
  // Reserve full label line and breathing room, do not enlarge the label.
  const labelHeight=Math.max(label.offsetHeight,Math.ceil(px(labelStyle.fontSize)*1.1));
  const availableHeight=Math.floor(tile.clientHeight-px(style.paddingTop)-px(style.paddingBottom)
   -px(style.borderTopWidth)-px(style.borderBottomWidth)-labelHeight-px(style.rowGap)-4);
  if(availableWidth<12||availableHeight<10)continue;
  const ratio=1.05;
  const upper=Math.min(88,Math.floor(availableHeight/ratio));
  const lower=8;
  if(upper<lower)continue;
  const fontFamily=numberStyle.fontFamily||'"Host Grotesk", sans-serif';
  const fontWeight=numberStyle.fontWeight||'750';
  const text=number.textContent?.trim()||'—';
  // Canvas measures the real typeface rather than assuming short strings;
  // longer mileage, wattage and elapsed time automatically fit smaller.
  const fits=(size:number)=>{
   context.font=fontWeight+' '+size+'px '+fontFamily;
   return context.measureText(text).width<=availableWidth;
  };
  let low=lower,high=upper,chosen=lower;
  while(low<=high){
   const middle=(low+high)>>1;
   if(fits(middle)){chosen=middle;low=middle+1;}
   else high=middle-1;
  }
  number.style.setProperty('font-size',chosen+'px','important');
  number.style.setProperty('line-height','1.05','important');
  number.style.setProperty('max-width','100%','important');
  // Font loading and subpixel text rendering can differ from canvas.
  // Check actual painted DOM width so no digit is clipped by overflow.
  let safe=chosen;
  while(safe>lower&&number.scrollWidth>number.clientWidth+1){
   safe--;
   number.style.setProperty('font-size',safe+'px','important');
  }
 }
}
