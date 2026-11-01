import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=(name)=>readFile(new URL('../src/'+name,import.meta.url),'utf8');
const [main,skin,preview]=await Promise.all([
 read('main.ts'),read('pedalkin-overlay-theme.ts'),read('pedalkin-overlay-preview.ts')
]);

test('Spokemon compact overlay remains at 170px and leaves other modes unchanged',()=>{
 assert.match(main,/\['classic','survival','pedalkin'\]\.includes\(document\.body\.dataset\.rideExperience\|\|''\)/);
 assert.match(main,/height:170,preferInitialWindowPlacement:true/);
 assert.match(main,/pip\.document\.body\.classList\.toggle\('pedalkin-overlay-theme'/);
 assert.match(main,/doc\.body\.classList\.toggle\('pedalkin-overlay-theme'/);
 assert.match(main,/pip\.document\.head\.append\(pedalkinTheme\)/);
 assert.match(skin,/body\.pedalkin-overlay-theme:not\(\.expanded\) #overlayContent/);
 assert.match(skin,/grid-template-rows:27px repeat\(2,minmax\(0,1fr\)\)!important/);
 assert.match(preview,/\.pk-overlay-frame\{height:170px!important/);
});

test('Approved six metric slots are exact, and no duplicate grade tile or total-ascent tile appears',()=>{
 assert.match(main,/snapshot\.rideExperience==='pedalkin'\?\['gear','speed','elapsedTime','cadence','distance','heartRate'\]/);
 assert.match(main,/\['4 \/ span 2','2'\],\['4 \/ span 2','3'\]/);
 for(const [key,col,row] of [
  ['gear','1','2'],['speed','2','2'],['elapsedTime','1','3'],
  ['cadence','2','3'],['distance','4 / span 2','2'],['heartRate','4 / span 2','3']
 ]){
  assert.match(skin,new RegExp('\\.tile\\[data-metric-key="'+key+'"\\]'));
  assert(preview.includes('data-metric-key="'+key+'"'),key);
 }
 assert.doesNotMatch(preview,/data-metric-key="grade"/);
 assert.doesNotMatch(preview,/data-metric-key="totalGain"/);
});

test('Live metrics use real session distance, ride clock and heart-rate telemetry',()=>{
 assert.match(main,/distance:\(sessionDistanceMeters\(\)\/METERS_PER_MILE\)\.toFixed\(2\)/);
 assert.match(main,/elapsedTime:rideClock\(\)/);
 assert.match(main,/heartRate:\(\$\('heartRate'\)\.textContent\|\|''\)\.trim\(\)/);
 assert.match(main,/const values:Record<string,string>=\{distance:snapshot\.distance/);
 assert.match(main,/heartRate:snapshot\.heartRate/);
 assert.match(main,/elapsedTime:snapshot\.elapsedTime/);
});

test('Forest profile uses live terrain sampling and maintains the moving rider and zoom controls',()=>{
 assert.match(main,/if\(document\.body\.dataset\.rideExperience==='pedalkin'\)/);
 assert.match(main,/const markerPercent=Math\.max/);
 assert.match(main,/const trees=Array\.from\(\{length:36\}/);
 assert.match(main,/fillPath/);
 assert.match(main,/hud\.label/);
 assert.match(main,/overviewAt\(Math\.max\(start,Math\.min\(stop,markerDistance\)\)\)\.elevation/);
 assert.match(main,/overlayZoomFactor=Number\(button\.dataset\.zoom\)\|\|1/);
 assert.match(preview,/data-zoom="10"/);
 assert.match(preview,/pkPlaybackSeek/);
 assert.match(preview,/requestAnimationFrame\(tick\)/);
});

test('Preview is a demo, not a fake recording or a separate trainer',()=>{
 assert.match(main,/mountPedalkinOverlayPreview\(\)/);
 assert.match(preview,/pedalkinOverlayPreview/);
 assert.match(preview,/no trainer connection/);
 assert.match(preview,/nothing recorded/);
 assert.doesNotMatch(preview,/(?:sendFtms|setGrade|requestDevice|setVirtualGearResistance|startRide|writeFile)\(/);
});
