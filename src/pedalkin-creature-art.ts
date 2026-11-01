import type {SpokemonSpecies} from './pedalkin-creatures';

const SVG_NS='http://www.w3.org/2000/svg';
type Tone='outline'|'main'|'shade'|'leaf'|'cream'|'eye'|'cheek'|'glow';
type Piece=[number,number,number,number,Tone];

/** Temporary, original pixel silhouettes until the approved 460×370 art arrives.
 * These do NOT modify the Illustrator template or reuse the unrelated crab sprite.
 */
export function addWorkingCreatureSilhouette(svg:SVGSVGElement,species:SpokemonSpecies):void{
 svg.querySelector('#pk-encounter-crab')?.remove();
 svg.querySelector('#pk-working-creature')?.remove();
 const group=document.createElementNS(SVG_NS,'g');
 group.setAttribute('id','pk-working-creature');
 group.setAttribute('aria-label',species.name+' — provisional pixel-art silhouette');
 group.setAttribute('role','img');
 group.setAttribute('shape-rendering','crispEdges');
 const art=document.createElementNS(SVG_NS,'g');
 art.setAttribute('transform','translate(793 379) scale(8)');
 const palette:Record<Tone,string>={
  outline:'#153339',main:species.accent,shade:species.dark,leaf:'#65986c',
  cream:'#f4e5bd',eye:'#14292e',cheek:'#efa99b',glow:'#f9d88d',
 };
 const parts:Piece[]=[];
 const add=(x:number,y:number,w:number,h:number,tone:Tone)=>parts.push([x,y,w,h,tone]);
 // One coherent 16-bit-style sprite language: pronounced 1-pixel outlines.
 const body=()=>{
  add(8,21,34,16,'outline');add(10,19,30,18,'main');
  add(12,25,26,11,'shade');add(13,21,23,10,'main');
  add(14,35,7,5,'outline');add(30,35,7,5,'outline');
  add(15,34,5,4,'main');add(31,34,5,4,'main');
  add(17,11,23,15,'outline');add(19,12,19,14,'main');
 };
 const face=(left=26,top=19)=>{
  add(left,top,3,3,'eye');add(left+8,top,3,3,'eye');
  add(left+4,top+5,3,2,'cream');add(left-5,top+5,3,2,'cheek');add(left+13,top+5,3,2,'cheek');
 };
 switch(species.kind){
  case 'pinecone':
   add(16,4,17,7,'shade');add(20,1,9,5,'leaf');body();add(13,11,22,12,'shade');
   for(let j=0;j<3;j++)for(let i=0;i<3;i++)add(15+i*7+(j%2)*3,17+j*5,6,4,'main');
   face(24,23);break;
  case 'deer':
   add(17,1,3,13,'outline');add(14,3,9,3,'leaf');add(32,0,3,14,'outline');
   add(31,4,9,3,'leaf');body();add(12,13,9,8,'leaf');add(37,13,9,8,'leaf');face();break;
  case 'squirrel':
   add(3,11,13,20,'outline');add(5,9,12,8,'main');add(6,22,12,12,'main');
   body();add(18,7,7,7,'shade');add(34,7,7,7,'shade');face();break;
  case 'rabbit':
   add(19,0,8,18,'outline');add(21,2,4,14,'cheek');
   add(31,0,8,18,'outline');add(33,2,4,14,'cheek');
   body();add(5,27,11,11,'cream');face();break;
  case 'mushroom':
  case 'fungus':
   add(18,22,24,18,'outline');add(20,22,20,16,'cream');
   add(5,13,48,12,'outline');add(9,10,40,15,'main');add(16,5,28,10,'shade');
   add(20,15,7,5,'cream');add(36,14,7,6,'cream');
   add(25,26,3,3,'eye');add(34,26,3,3,'eye');
   add(15,33,7,5,'outline');add(38,33,7,5,'outline');
   if(species.kind==='fungus'){add(15,6,7,5,'glow');add(42,12,6,5,'leaf');}
   break;
  case 'owl':
   add(13,7,8,11,'outline');add(37,7,8,11,'outline');
   body();add(13,21,12,12,'shade');add(35,21,12,12,'shade');
   add(21,17,9,9,'cream');add(32,17,9,9,'cream');
   add(25,20,3,4,'eye');add(35,20,3,4,'eye');add(30,26,3,4,'glow');break;
  case 'bear':
   add(13,6,12,13,'outline');add(33,6,12,13,'outline');
   add(17,9,6,7,'cream');add(36,9,6,7,'cream');
   body();add(25,23,10,8,'cream');face(23,19);break;
  case 'moth':
   add(1,13,18,20,'outline');add(3,15,15,16,'main');
   add(39,13,18,20,'outline');add(40,15,15,16,'main');
   add(5,22,9,7,'glow');add(43,22,9,7,'glow');
   add(23,10,12,27,'outline');add(25,12,8,24,'shade');
   add(26,16,3,4,'cream');add(31,16,3,4,'cream');
   add(24,4,3,11,'outline');add(33,4,3,11,'outline');break;
  case 'rock':
   add(10,17,40,20,'outline');add(13,13,33,22,'main');
   add(18,10,21,5,'shade');add(26,6,13,6,'leaf');
   add(18,24,4,3,'eye');add(35,24,4,3,'eye');
   add(15,33,8,5,'outline');add(37,33,8,5,'outline');break;
  case 'fox':
   add(1,13,13,23,'outline');add(2,13,12,10,'main');add(7,22,14,12,'shade');
   add(18,3,9,16,'outline');add(33,3,9,16,'outline');
   add(20,6,6,10,'main');add(35,6,6,10,'main');
   body();add(25,25,12,8,'cream');face(24,19);break;
  case 'guardian':
   add(18,0,4,18,'outline');add(13,4,11,4,'leaf');
   add(36,0,4,18,'outline');add(36,4,11,4,'leaf');
   add(12,8,9,7,'shade');add(38,8,9,7,'shade');
   body();add(25,17,3,3,'glow');add(33,17,3,3,'glow');
   add(22,28,13,3,'leaf');break;
 }
 for(const [x,y,width,height,tone] of parts){
  const rect=document.createElementNS(SVG_NS,'rect');
  rect.setAttribute('x',String(x));rect.setAttribute('y',String(y));
  rect.setAttribute('width',String(width));rect.setAttribute('height',String(height));
  rect.setAttribute('fill',palette[tone]);art.append(rect);
 }
 group.append(art);
 const caption=document.createElementNS(SVG_NS,'text');
 caption.setAttribute('x','960');caption.setAttribute('y','729');
 caption.setAttribute('text-anchor','middle');caption.setAttribute('font-size','15');
 caption.setAttribute('font-family','Courier New, monospace');caption.setAttribute('font-weight','bold');
 caption.setAttribute('letter-spacing','2');caption.setAttribute('fill','#fbe6c6');
 caption.textContent='WORKING CREATURE ART';
 group.append(caption);
 svg.append(group);
}
