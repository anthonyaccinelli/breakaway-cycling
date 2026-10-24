/**
 * Editable browser-to-SVG exporter for design review.
 * Generates real SVG rects, text, lines, and nested SVG artwork; no screenshot image.
 * Browser CSS (gradients, filters, pseudo-elements, canvas and advanced clipping)
 * cannot always be represented exactly by this conversion.
 */
const NS='http://www.w3.org/2000/svg';
const svgEl=(tag:string)=>document.createElementNS(NS,tag);
const visible=(el:Element,style:CSSStyleDeclaration)=>{
 const r=el.getBoundingClientRect();
 return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&r.width>0&&r.height>0;
};
const set=(el:Element,attrs:Record<string,string|number>)=>Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
function color(c:string){return c==='transparent'||c==='rgba(0, 0, 0, 0)'?'none':c;}
function fontAttrs(s:CSSStyleDeclaration){
 return {'font-family':s.fontFamily,'font-size':s.fontSize,'font-weight':s.fontWeight,'font-style':s.fontStyle,'letter-spacing':s.letterSpacing,'fill':s.color};
}
function isExcluded(el:Element){return !!el.closest('[data-svg-export-ui]')||['SCRIPT','STYLE','NOSCRIPT','TEMPLATE'].includes(el.tagName);}
export function exportEditableSvg(){
 const root=document.querySelector('main')||document.body;
 const rect=root.getBoundingClientRect();
 const width=Math.ceil(Math.max(rect.width,window.innerWidth));
 const height=Math.ceil(Math.max(rect.height,window.innerHeight));
 const svg=svgEl('svg');set(svg,{xmlns:NS,width,height,viewBox:`0 0 ${width} ${height}`});
 const title=svgEl('title');title.textContent='Ride Breakaway — editable UI export';svg.append(title);
 const background=svgEl('rect');set(background,{width,height,fill:getComputedStyle(document.body).backgroundColor||'#0b1520'});svg.append(background);
 const originX=Math.min(0,rect.left),originY=Math.min(0,rect.top);
 const px=(x:number)=>Number((x-originX).toFixed(2));
 const py=(y:number)=>Number((y-originY).toFixed(2));
 let shapes=0,texts=0;
 function walk(el:Element,depth:number){
  if(depth>70||isExcluded(el))return;
  const s=getComputedStyle(el);
  if(!visible(el,s))return;
  const r=el.getBoundingClientRect();
  const x=px(r.left),y=py(r.top);
  const bg=color(s.backgroundColor);
  if(bg!=='none'||parseFloat(s.borderTopWidth)>0){
   const shape=svgEl('rect');
   const border=parseFloat(s.borderTopWidth)||0;
   set(shape,{x,y,width:r.width,height:r.height,rx:Math.min(parseFloat(s.borderTopLeftRadius)||0,r.width/2,r.height/2),fill:bg,stroke:border?color(s.borderTopColor):'none','stroke-width':border});
   svg.append(shape);shapes++;
  }
  if(el instanceof SVGSVGElement){
   const clone=el.cloneNode(true) as SVGSVGElement;
   clone.removeAttribute('id');
   clone.setAttribute('x',String(x));clone.setAttribute('y',String(y));
   clone.setAttribute('width',String(r.width));clone.setAttribute('height',String(r.height));
   clone.setAttribute('xmlns',NS);
   svg.append(clone);shapes++;return;
  }
  if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement){
   const value=el instanceof HTMLSelectElement?el.selectedOptions[0]?.textContent||'':el.value;
   if(value){
    const t=svgEl('text');set(t,{x:x+12,y:y+r.height/2,'dominant-baseline':'middle',...fontAttrs(s)});
    t.textContent=value;svg.append(t);texts++;
   }
   return;
  }
  for(const node of Array.from(el.childNodes)){
   if(node.nodeType===Node.TEXT_NODE&&node.textContent?.trim()){
    const range=document.createRange();range.selectNodeContents(node);
    const rr=range.getBoundingClientRect();
    if(rr.width>0&&rr.height>0){
     const t=svgEl('text');
     set(t,{x:px(rr.left),y:py(rr.top)+rr.height*.78,...fontAttrs(s)});
     t.textContent=node.textContent.replace(/\s+/g,' ').trim();svg.append(t);texts++;
    }
   }else if(node instanceof Element)walk(node,depth+1);
  }
 }
 walk(root,0);
 const serializer=new XMLSerializer();
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+serializer.serializeToString(svg);
 const screen=document.querySelector('.screen-step.active')?.textContent?.trim()||'Ride Breakaway';
 const filename='Breakaway-'+screen.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')+'-editable.svg';
 const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 return {filename,shapes,texts};
}
export function installEditableSvgExport(){
 const btn=document.createElement('button');btn.type='button';btn.dataset.svgExportUi='true';
 btn.textContent='Export current screen · Editable SVG';
 btn.title='Exports vector shapes and live text from the currently visible screen for Adobe Illustrator. Some CSS effects may differ.';
 btn.style.cssText='position:fixed;left:16px;bottom:16px;z-index:10001;padding:12px 16px;background:#40d2aa;color:#071a24;border:2px solid #102938;border-radius:10px;font:800 13px system-ui;box-shadow:0 8px 24px #0008';
 btn.onclick=()=>{try{const r=exportEditableSvg();btn.textContent=`Exported ${r.shapes} shapes · ${r.texts} text`;setTimeout(()=>btn.textContent='Export current screen · Editable SVG',2800)}catch(e){console.error(e);btn.textContent='Export failed — check console'}};
 document.body.append(btn);
}
