import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/spokemon-playable.ts',import.meta.url),'utf8');
const game=await readFile(new URL('../src/pedalkin-ride.ts',import.meta.url),'utf8');
const explore=await readFile(new URL('../public/pedalkin/explore.svg',import.meta.url),'utf8');
const encounter=await readFile(new URL('../public/pedalkin/encounter.svg',import.meta.url),'utf8');
const original=[
 'translate(48 161.5)','translate(177 161.5)','translate(48 284.3)',
 'translate(48 407.1)','translate(48 529.9)','translate(48 652.8)',
 'translate(48 778.5)','translate(1590.5015 183.81)',
 'translate(1586.3262 368.0016)','translate(56 946)',
 'translate(56 1001.0032)'
];
test('Every live value writes to native Illustrator text on both screens',()=>{
 for(const t of original){
  assert.ok(explore.includes(t),'Explore: '+t);
  assert.ok(encounter.includes(t),'Encounter: '+t);
  assert.ok(source.includes(t),'dynamic binding: '+t);
 }
 assert.match(game,/document\.createElement\('object'\)/);
 assert.match(game,/contentDocument/);
 assert.match(game,/font-family:Minecraft/);
 assert.doesNotMatch(source,/rect\(view,48,y/);
 assert.doesNotMatch(source,/rect\(view,1590,144/);
});
test('Native Illustrator metric fill paths and trust bars update without cover rectangles',()=>{
 for(const d of ['M54,171','M52.39,293.8','M52.88,416.6','M54,539.4','M54,662.3','M54,788']){
  assert.ok(explore.includes(d));
  assert.ok(encounter.includes(d));
  assert.ok(source.includes(d));
 }
 assert.match(source,/rect\[x="1592.9"\]\[y="199.3"\]/);
 assert.match(source,/rect\[x="1588.33"\]\[y="383.9"\]/);
});
test('Generated elevation masks exact profile area and leaves forest untouched',()=>{
 assert.match(source,/minX=385\.12,maxX=1535\.12,top=435\.42,bottom=805\.72/);
 assert.match(source,/const samples=route\?\.samples\|\|Array\.from/);
 assert.match(source,/const endLabel=text\(plot,1520,766/);
 assert.match(source,/endLabel\.setAttribute\('text-anchor','end'\)/);
});

test('Elevation bands and horizontal scanlines both use the SAME closed silhouette clip',()=>{
 const chartStart=source.indexOf(' function drawProfile(');
 const chartEnd=source.indexOf(' function paint()',chartStart);
 const chart=source.slice(chartStart,chartEnd);
 assert.ok(chartStart>=0&&chartEnd>chartStart);
 assert.match(chart,/const silhouette=outline\.join\(' '\)/);
 assert.match(chart,/clip\.appendChild\(make\('path',\{d:silhouette\+' L '\+maxX\+' '\+bottom\+' L '\+minX\+' '\+bottom\+' Z'\}\)\)/);
 assert.match(chart,/const clipped=make\('g',\{'clip-path':'url\(#pk-spokemon-grade-clip\)'\}\)/);
 assert.match(chart,/rect\(clipped,x1,top,x2-x1\+0\.5,bottom-top,COLORS\[bucket\(slope\)\]\)/);
 assert.match(chart,/line\(clipped,minX,y,maxX,y,'#16383d',0\.9\)/);
 assert.doesNotMatch(chart,/rect\(root,x1/);
 assert.doesNotMatch(chart,/line\(root,minX,y,maxX,y/);
 assert.ok(chart.indexOf('plot.appendChild(clipped)')<chart.lastIndexOf("plot.appendChild(make('path',{d:silhouette"),'cream contour should be drawn on top');
});

test('Chart stays inside the exact 10-unit cream frame, including border and rider marker',()=>{
 const start=source.indexOf(' function drawProfile(');
 const end=source.indexOf(' function paint()',start);
 const chart=source.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.match(chart,/const minX=385\.12,maxX=1535\.12,top=435\.42,bottom=805\.72,width=maxX-minX/);
 assert.match(chart,/clipPath',\{id:'pk-spokemon-frame-clip',clipPathUnits:'userSpaceOnUse'\}/);
 assert.match(chart,/const plot=make\('g',\{'clip-path':'url\(#pk-spokemon-frame-clip\)'\}\)/);
 assert.match(chart,/rect\(plot,minX,top,width,bottom-top,'#102e35'\)/);
 assert.match(chart,/plot\.appendChild\(clipped\)/);
 assert.match(chart,/plot\.appendChild\(make\('path',\{d:silhouette/);
 assert.match(chart,/line\(plot,x,top\+9,x,bottom-5/);
 assert.doesNotMatch(chart,/rect\(root,minX/);
 assert.doesNotMatch(chart,/line\(root,x,top\+9/);
});

test('Full encounter prompts are font-fitted rather than truncated',()=>{
 const paint=source.slice(source.indexOf(' function paint(){'),source.indexOf(' function saveCreature(){'));
 assert.match(paint,/set\('translate\(56 946\)',message,1212\)/);
 assert.match(paint,/set\('translate\(56 1001\.0032\)',line2,1212\)/);
 assert.match(paint,/getComputedTextLength\(\)/);
 assert.match(paint,/t\.dataset\.pkOriginalFontSize/);
 assert.match(paint,/t\.style\.fontSize=\(baseSize\*ratio\)\.toFixed\(2\)\+'px'/);
 assert.doesNotMatch(paint,/message\.length>52/);
 assert.doesNotMatch(paint,/message\.slice\(0,49\)/);
});
test('Yellow rider follows continuous interpolated cream profile line',()=>{
 const chart=source.slice(source.indexOf(' function drawProfile('),source.indexOf(' function paint(){'));
 assert.match(chart,/const samplePosition=position\*\(heights\.length-1\)/);
 assert.match(chart,/const leftIndex=Math\.min\(heights\.length-2,Math\.floor\(samplePosition\)\)/);
 assert.match(chart,/const fraction=samplePosition-leftIndex/);
 assert.match(chart,/const riderY=py\(leftIndex\)\+\(py\(leftIndex\+1\)-py\(leftIndex\)\)\*fraction/);
 assert.match(chart,/cy:String\(riderY\)/);
 assert.doesNotMatch(chart,/cy:String\(py\(index\)\)/);
});
