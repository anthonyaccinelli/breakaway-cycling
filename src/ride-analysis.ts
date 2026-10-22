export type SummarySample={seconds:number;distance:number;elevation:number;power:number;cadence:number;heartRate:number|null};
type SeriesKey='power'|'cadence'|'heartRate'|'elevation';
const NS='http://www.w3.org/2000/svg';
const fmt=(n:number,d=0)=>Number.isFinite(n)?n.toFixed(d):'—';
function element<K extends keyof HTMLElementTagNameMap>(tag:K,className='',text=''):HTMLElementTagNameMap[K]{
 const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;
}
function svgNode(name:string,attrs:Record<string,string>={}):SVGElement{
 const e=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;
}
function average(a:number[]){return a.length?a.reduce((s,n)=>s+n,0)/a.length:0;}
function weightedBest(samples:SummarySample[],windowSeconds:number){
 if(samples.length<2)return null;
 let best=0,found=false,left=0,sum=0;
 for(let right=0;right<samples.length;right++){
  const current=samples[right];sum+=Math.max(0,current.power);
  while(current.seconds-samples[left].seconds>=windowSeconds&&left<right){sum-=Math.max(0,samples[left].power);left++;}
  if(current.seconds-samples[left].seconds>=windowSeconds-1){best=Math.max(best,sum/(right-left+1));found=true;}
 }
 return found?best:null;
}
function normalizedPower(samples:SummarySample[]){
 if(samples.length<30)return null;
 const values=samples.map(s=>Math.max(0,s.power));const rolling:number[]=[];
 let sum=0;
 for(let i=0;i<values.length;i++){sum+=values[i];if(i>=30)sum-=values[i-30];if(i>=29)rolling.push(Math.pow(sum/30,4));}
 return Math.pow(average(rolling),0.25);
}
function chart(samples:SummarySample[],key:SeriesKey,label:string,unit:string,color:string){
 const card=element('section','advanced-chart-card');const heading=element('div','advanced-chart-heading');
 heading.append(element('h3','',label),element('span','',unit));card.append(heading);
 const usable=samples.filter(s=>Number.isFinite(s.seconds)&&Number.isFinite(key==='heartRate'?s.heartRate:s[key]));
 if(usable.length<2){card.append(element('p','note','Not enough recorded data for this chart.'));return card;}
 const values=usable.map(s=>Number(key==='heartRate'?s.heartRate:s[key]));
 const min=Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);
 const start=usable[0].seconds,end=usable[usable.length-1].seconds,range=Math.max(1,end-start);
 const svg=svgNode('svg',{viewBox:'0 0 760 195',role:'img','aria-label':label+' over ride time',preserveAspectRatio:'none'});
 for(let i=0;i<4;i++){const y=15+i*48;svg.append(svgNode('line',{x1:'45',x2:'750',y1:String(y),y2:String(y),stroke:'#385064','stroke-dasharray':'4 5'}));
 const tick=svgNode('text',{x:'38',y:String(y+4),'text-anchor':'end',fill:'#b8cbd5','font-size':'12'});tick.textContent=fmt(max-i*span/3,0);svg.append(tick);}
 const limit=700,step=Math.max(1,Math.ceil(usable.length/limit));const selected=usable.filter((_,i)=>i%step===0);
 if(selected.at(-1)!==usable.at(-1))selected.push(usable[usable.length-1]);
 const coords=selected.map(s=>[45+(s.seconds-start)/range*705,159-(Number(key==='heartRate'?s.heartRate:s[key])-min)/span*144]);
 const path=svgNode('polyline',{points:coords.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':'2.5','stroke-linecap':'round','stroke-linejoin':'round'});svg.append(path);
 const time=svgNode('text',{x:'748',y:'189','text-anchor':'end',fill:'#b8cbd5','font-size':'12'});time.textContent=fmt(end/60,1)+' min';svg.append(time);
 card.append(svg);return card;
}
export function renderAdvancedRideCharts(root:HTMLElement,samples:SummarySample[],ftp:number){
 const section=element('section','advanced-ride-analysis');
 section.append(element('h2','','Ride analysis'));
 const valid=samples.filter(s=>Number.isFinite(s.seconds)&&Number.isFinite(s.power)).sort((a,b)=>a.seconds-b.seconds);
 if(valid.length<2){section.append(element('p','note','Charts become available once ride telemetry has been recorded.'));root.append(section);return;}
 const powers=valid.map(s=>Math.max(0,s.power)),active=powers.filter(n=>n>0),np=normalizedPower(valid),avg=average(powers);
 const best5=weightedBest(valid,5),best60=weightedBest(valid,60),best300=weightedBest(valid,300),best1200=weightedBest(valid,1200);
 const hr=valid.map(s=>s.heartRate).filter((n):n is number=>n!==null&&n>0);
 const cards=element('div','advanced-ride-stats');
 const stats:[string,string][]=[['Normalized power',np===null?'—':fmt(np)+' W'],['Variability index',np===null||avg<=0?'—':fmt(np/avg,2)],['Best 5 sec',best5===null?'—':fmt(best5)+' W'],['Best 1 min',best60===null?'—':fmt(best60)+' W'],['Best 5 min',best300===null?'—':fmt(best300)+' W'],['Best 20 min',best1200===null?'—':fmt(best1200)+' W'],['Pedaling samples',fmt(active.length/powers.length*100)+'%'],['Average HR',hr.length?fmt(average(hr))+' bpm':'—']];
 for(const [label,value] of stats){const c=element('div','ride-summary-stat');c.append(element('small','',label),element('strong','',value));cards.append(c);}section.append(cards);
 const charts=element('div','advanced-ride-charts');
 charts.append(chart(valid,'power','Power','W','#45d6aa'),chart(valid,'cadence','Cadence','rpm','#e6b86b'),chart(valid,'heartRate','Heart rate','bpm','#f17d91'),chart(valid,'elevation','Elevation','m','#8baef4'));section.append(charts);
 const zones=element('div','advanced-zone-panel');zones.append(element('h3','','Power distribution'));
 const safeFtp=Number.isFinite(ftp)&&ftp>0?ftp:250;
 const thresholds=[0,.55,.75,.90,1.05,1.20,1.50,Infinity];const labels=['Z1 Recovery','Z2 Endurance','Z3 Tempo','Z4 Threshold','Z5 VO₂ max','Z6 Anaerobic','Z7 Sprint'];
 const counts=Array(7).fill(0) as number[];
 for(const s of valid){const ratio=Math.max(0,s.power)/safeFtp;const idx=thresholds.findIndex((_,i)=>i<7&&ratio>=thresholds[i]&&ratio<thresholds[i+1]);counts[Math.max(0,idx)]++;}
 labels.forEach((label,i)=>{const row=element('div','advanced-zone-row');const pct=counts[i]/valid.length*100;row.append(element('span','',label));const track=element('div','advanced-zone-track');const fill=element('div','advanced-zone-fill');fill.style.width=pct+'%';track.append(fill);row.append(track,element('span','',fmt(pct,1)+'%'));zones.append(row);});
 const note=element('p','note','Power zones use FTP '+fmt(safeFtp)+' W. Normalized power is estimated from recorded samples; charts show available ride data only.');zones.append(note);section.append(zones);
 root.append(section);
}
