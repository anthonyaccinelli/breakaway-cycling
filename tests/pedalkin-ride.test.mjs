import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const view=await readFile(new URL('../src/pedalkin-ride.ts',import.meta.url),'utf8');
const style=await readFile(new URL('../src/pedalkin-ride.css',import.meta.url),'utf8');
const explore=await readFile(new URL('../public/pedalkin/explore.svg',import.meta.url),'utf8');
const encounter=await readFile(new URL('../public/pedalkin/encounter.svg',import.meta.url),'utf8');

test('ride uses the two exact 1920x1080 Illustrator artboards rather than a redrawn layout',()=>{
 for(const s of [explore,encounter]){
  assert.match(s,/viewBox="0 0 1920 1080"/);
  assert.match(s,/Generator: Adobe Illustrator/);
  assert.match(s,/DIALOGUE \/ PROMPTS/);
  assert.match(s,/COMPANIONSHIP 12/);
  assert.match(s,/SPOKEMON/);
 }
 assert.match(explore,/ELEVATION PROFILE/);
 assert.match(encounter,/CREECH BAR/);
 assert.doesNotMatch(encounter,/WILD PEDALKIN ART/);
});

test('latest Illustrator artboards use the uploaded pixel forest image without changing alignment',()=>{
 for(const svg of [explore,encounter]){
  assert.match(svg,/xlink:href="\/pedalkin\/forest-from-illustrator\.png"/);
  assert.match(svg,/transform="translate\(360 111\.27\) scale\(1\.75 1\.78\)"/);
  assert.doesNotMatch(svg,/\/pedalkin\/forest-placeholder\.svg/);
 }
});
test('exact new buddy positions follow each uploaded alignment',()=>{
 assert.match(explore,/<image id="pk-buddy-crab" x="1664" y="603\.8" width="120" height="98"/);
 assert.match(encounter,/<image id="pk-buddy-crab" x="1664" y="600\.8" width="120" height="98"/);
 for(const svg of [explore,encounter]){
  assert.doesNotMatch(svg,/<circle class="st\d+" cx="1724" cy="(?:649\.8|652\.8)" r="37"/);
  assert.doesNotMatch(svg,/BUDDY ART/);
  assert.match(svg,/xlink:href="data:image\/png;base64,/);
 }
});
test('encounter preserves 460x370 crab in the original creature bounding area',()=>{
 assert.match(encounter,/<image id="pk-encounter-crab" x="730" y="355" width="460" height="370"/);
 assert.doesNotMatch(encounter,/<rect class="st\d+" x="725" y="360" width="470" height="360"/);
 assert.doesNotMatch(explore,/id="pk-encounter-crab"/);
});
test('four menu hotspots remain interactive without legacy blue button rectangles',()=>{
 assert.match(style,/body\.pk-riding #screenRide \.pk-ride-host button\.pk-hitspot/);
 assert.match(style,/opacity:0!important;/);
 assert.match(style,/background:transparent!important;/);
 assert.match(style,/box-shadow:none!important;/);
 assert.match(style,/button\.pk-hitspot:focus-visible/);
 assert.equal((view.match(/class="pk-hitspot /g)||[]).length,4);
});
test('both states retain vector typography and panel geometry after inserting crab',()=>{
 assert((explore.match(/<text\b/g)||[]).length>=40);
 assert((encounter.match(/<text\b/g)||[]).length>=33);
 assert.match(explore,/Cruising through Pinepath Trail/);
 assert.match(encounter,/Keep a steady pace to calm it down/);
});
test('new 03 Ride screens are on Pedalkin only; preview works without trainer and never invents ride data',()=>{
 assert.match(main,/mountPedalkinRide\(\)/);
 assert.match(main,/pedalkinPreviewScreen/);
 assert.match(main,/showBreakawayScreen\(\['ride','explore','encounter','playing','encounters'\]/);
 assert.match(view,/rideExperience==='pedalkin'/);
 assert.match(view,/NO TRAINER \/ NO RECORDED RIDE/);
 assert.match(view,/no synthetic wattage, no trainer control/);
 assert.doesNotMatch(view,/(?:setGrade|sendFtms|requestDevice|cycleQuestHold|setVirtualGearResistance)\(/);
 assert.match(style,/\.pk-ride-stage/);
});
test('preview navigation and capture demos are interactive; route remains unaltered',()=>{
 assert.match(view,/data-pk-demo="explore"/);
 assert.match(view,/data-pk-demo="encounter"/);
 assert.match(view,/data-pk-demo="pedal"/);
 assert.match(view,/data-pk-demo="escape"/);
 assert.match(view,/data-pk-action="journal"/);
 assert.match(view,/data-pk-action="save"/);
 assert.match(view,/wildness=Math\.max\(0,wildness-seconds\*1\.55\)/);
 assert.match(main,/rideExperience==='pedalkin'&&\['route','setup','ride','explore','encounter','playing','encounters'\]/);
});

test('Exploration player follows the authored profile at uniform horizontal distance',()=>{
 assert.match(explore,/<path class="st32" d="M383,658/);
 assert.match(explore,/<circle class="st45" cx="798" cy="647"/);
 assert.match(explore,/<line class="st25" x1="798"/);
 assert.match(view,/const profileMinX=383,profileMaxX=1498/);
 assert.match(view,/path\.getTotalLength\(\)/);
 assert.match(view,/path\.getPointAtLength\(mid\)\.x<x/);
 assert.match(view,/rider\.setAttribute\('cy',String\(point\.y\)\)/);
 assert.match(view,/guide\.setAttribute\('x1',String\(point\.x\)\)/);
 assert.match(view,/baseline\.setAttribute\('cx'/);
 assert.match(view,/you\.setAttribute\('transform'/);
});

test('Current live route data replaces ONLY the illustrative elevation trace',()=>{
 assert.match(main,/function publishPedalkinRideFrame\(\)/);
 assert.match(main,/window\.dispatchEvent\(new CustomEvent\('pedalkin:ride-frame'/);
 assert.match(main,/overviewAt\(totalMeters\*i\/96\)\.elevation/);
 assert.match(view,/window\.addEventListener\('pedalkin:ride-frame'/);
 assert.match(view,/paintRealElevation\(frame\)/);
 assert.match(view,/path\.setAttribute\('d',pixels\.line\)/);
 assert.match(view,/pixelateElevation\(heights,profileMinX,profileMaxX,500,718,112,6\)/);
 assert.match(view,/liveFrame\.distanceMeters\/liveFrame\.totalMeters/);
 assert.match(view,/if\(demo\|\|!frame/);
});

test('Design playtest auto-runs and lets riders pause, scrub or reset without a trainer',()=>{
 assert.match(view,/data-pk-profile="toggle"/);
 assert.match(view,/data-pk-profile="seek"/);
 assert.match(view,/demoTotalKm=25/);
 assert.match(view,/requestAnimationFrame\(animateDemo\)/);
 assert.match(view,/demoKm\+demoTotalKm\*delta\/80000/);
 assert.match(view,/demoPlaying=false/);
 assert.match(view,/profileSeek\.addEventListener\('input'/);
 assert.match(view,/if\(action==='reset'\)\{demoKm=0/);
 assert.match(style,/\.pk-profile-bar/);
 assert.match(style,/\.pk-profile-status/);
});

test('following gradient badge matches reference and tracks the same rider marker',()=>{
 assert.match(view,/id','pk-rider-gradient'/);
 assert.match(view,/const gradient=demo\?/);
 assert.match(view,/smoothYAt\(afterX\)-smoothYAt\(beforeX\)/);
 assert.match(view,/liveFrame\.gradePercent/);
 assert.match(view,/const percentage=gradient===null\?'—%'/);
 assert.match(view,/border\.setAttribute\('stroke','#ffc197'\)/);
 assert.match(view,/border\.setAttribute\('fill','#102f36'\)/);
 assert.match(view,/label\.setAttribute\('fill','#fff0d4'\)/);
 assert.match(view,/Math\.min\(1370,point\.x-155\)/);
 assert.match(view,/Math\.min\(662,point\.y\+40\)/);
 assert.match(view,/badge\.setAttribute\('transform'/);
 assert.match(view,/badge\.setAttribute\('aria-label','Current gradient '/);
 assert.match(view,/paintRiderOnProfile\(\)/);
});

test('real live gradient is the route grade, not visual slope or synthetic trainer data',()=>{
 assert.match(main,/gradePercent:displayGrade\(\)/);
 assert.match(main,/function publishPedalkinRideFrame\(\)/);
 assert.match(view,/gradePercent:number;/);
 assert.match(view,/const gradient=demo\?smoothGradient\(\)/);
 assert.match(view,/\(liveFrame&&Number\.isFinite\(liveFrame\.gradePercent\)\?liveFrame\.gradePercent:null\)/);
 assert.doesNotMatch(view,/(?:setGrade|sendFtms|requestDevice|cycleQuestHold|setVirtualGearResistance)\(/);
});

test('Ride displays one branded four-button navigation instead of the hidden legacy tabs',()=>{
 assert.match(view,/<header class="pk-ride-nav"/);
 assert.match(view,/<nav class="pk-ride-tabs" aria-label="Ride navigation">/);
 for(const name of ['route','devices','ride','overlay'])assert.match(view,new RegExp('data-pk-nav="'+name+'"'));
 assert.equal((view.match(/data-pk-nav="/g)||[]).length,4);
 assert.match(view,/data-pk-nav="ride" aria-current="page"/);
 assert.match(style,/body\.pk-riding main>\.screen-progress/);
 assert.match(style,/body\.pk-riding #screenRide>\.sc-masthead/);
 assert.match(style,/body\.pk-riding #screenRide>\.ride-screen-content/);
 assert.match(style,/body\.pk-riding #screenRide \.pk-ride-tabs>button\[aria-current="page"\]/);
 assert.match(style,/border:2px solid #fbc5ab!important/);
});
test('Pedalkin Ride navigation reuses real Breakaway steps and actual overlay command',()=>{
 assert.match(view,/function triggerNavigation\(target:'route'\|'devices'\|'ride'\|'overlay'\)/);
 for(const id of ['stepRoute','stepSetup','stepRide','nativeProfile'])assert(view.includes("'"+id+"'"));
 assert.match(view,/document\.getElementById\(id\) as HTMLButtonElement\|null\)\?\.click\(\)/);
 assert.match(view,/document\.getElementById\('nativeProfile'\)/);
 assert.match(view,/documentPictureInPicture/);
 assert.match(view,/ALWAYS-ON-TOP OVERLAY/);
 assert.doesNotMatch(view,/(?:setGrade|sendFtms|requestDevice|cycleQuestHold|setVirtualGearResistance)\(/);
});

test('Illustrator off-artboard duplicate metrics are removed at runtime and the viewport is clipped',()=>{
 assert.match(explore,/<text class="st16" transform="translate\(2013 126\.9\)">/);
 assert.match(view,/root\.querySelectorAll<SVGTextElement>\('text\[transform\^="translate\(2013 "\]'\)/);
 assert.match(view,/node\.parentElement\?\.remove\(\)/);
 assert.match(style,/\.pk-svg-slot\{overflow:hidden;contain:paint\}/);
 assert.match(style,/\.pk-svg-slot>svg\{overflow:hidden!important;clip-path:inset\(0\)!important\}/);
 assert.match(explore,/<text class="st16" transform="translate\(52 127\.5\)">/);
});

test('Playing preview shows true game UI without developer bars while preserving moving player and controls',()=>{
 assert.match(view,/const playingPreview=previewChoice==='playing'\|\|previewChoice==='encounters'/);
 assert.match(view,/const showPlaytestControls=demo&&!playingPreview/);
 assert.match(view,/showPlaytestControls\?'<div class="pk-demo-bar">/);
 assert.match(view,/showPlaytestControls\?'<div class="pk-profile-bar">/);
 assert.match(view,/const demo=playingPreview\|\|/);
 assert.match(main,/\['ride','explore','encounter','playing','encounters'\]/);
 assert.match(main,/\['route','setup','ride','encounter','explore','playing','encounters'\]/);
 assert.match(style,/\.pk-ride-host:not\(:has\(\.pk-demo-bar\)\) \.pk-ride-stage/);
 assert.match(view,/requestAnimationFrame\(animateDemo\)/);
});

test('Biome 01 encounter pool contains all 12 catalogued Spokemon and preserves rarity tiers',async()=>{
 const source=await readFile(new URL('../src/pedalkin-creatures.ts',import.meta.url),'utf8');
 const species=['Pipcone','Mossprout','Dear','Fernbit','Hedgie','Hootwig',
  'Bumblebark','Glimmoth','Pebblit','Bob Moss','Shroomble','Elderoot'];
 for(const name of species)assert.match(source,new RegExp("name:'"+name+"'"));
 assert.equal((source.match(/name:'(?:Pipcone|Mossprout|Dear|Fernbit|Hedgie|Hootwig|Bumblebark|Glimmoth|Pebblit|Bob Moss|Shroomble|Elderoot)'/g)||[]).length,12);
 assert.equal((source.match(/rarity:'common'/g)||[]).length,5);
 assert.equal((source.match(/rarity:'uncommon'/g)||[]).length,4);
 assert.equal((source.match(/rarity:'rare'/g)||[]).length,2);
 assert.equal((source.match(/rarity:'extremely rare'/g)||[]).length,1);
 assert.match(source,/function choosePineForestSpokemon/);
 assert.match(source,/function nextPreviewSpokemon/);
});
test('Encounters show correct species and temporary distinct illustrations, never the unrelated crab',async()=>{
 const artwork=await readFile(new URL('../src/pedalkin-creature-art.ts',import.meta.url),'utf8');
 assert.match(view,/addWorkingCreatureSilhouette\(svg,currentSpecies\)/);
 assert.match(artwork,/svg\.querySelector\('#pk-encounter-crab'\)\?\.remove\(\)/);
 assert.match(artwork,/id','pk-working-creature'/);
 assert.match(artwork,/WORKING CREATURE ART/);
 assert.match(artwork,/species\.kind/);
 assert.match(view,/updateText\(oldHeadline,'A wild '\+name\+' appeared!'\)/);
 assert.match(view,/updateText\(oldHeadline,name\+' joined your collection!'\)/);
 assert.match(view,/updateText\(oldHeadline,name\+' wandered away.'\)/);
 assert.match(view,/prompts\[mood\]/);
});
test('Full-screen preview cycles through exploration, diverse encounters, captures and escapes',()=>{
 assert.match(view,/const playingPreview=previewChoice==='playing'\|\|previewChoice==='encounters'/);
 assert.match(view,/nextPreviewSpokemon\(encounterCount\)/);
 assert.match(view,/demoOutcomeIsEscape=demo&&encounterCount%4===0/);
 assert.match(view,/playingPreview&&stageName==='explore'&&demoKm>=nextEncounterKm/);
 assert.match(view,/if\(wildness<=0\)outcome='captured'/);
 assert.match(view,/else if\(patience<=0\)outcome='escaped'/);
 assert.match(view,/closeEncounter\(\)/);
 assert.match(view,/nextEncounterKm=demoKm\+2\.15/);
 assert.match(view,/if\(playingPreview\)\{demoKm=0;nextEncounterKm=1\.35;\}/);
 assert.match(view,/showPlaytestControls=demo&&!playingPreview/);
});

test('Encounter and Exploration share precisely aligned chrome after runtime normalization',()=>{
 // Values from both original Illustrator artboards, not approximate pixels.
 const leftY=(xml)=>Number(xml.match(/<rect[^>]*x="24" y="(\d+(?:\.\d+)?)" width="304" height="99\.3"/)?.[1]);
 const rightY=(xml)=>Number(xml.match(/<rect[^>]*x="1552" y="(\d+(?:\.\d+)?)" width="344"/)?.[1]);
 const bottom=(xml)=>xml.match(/<rect[^>]*x="24" y="(\d+(?:\.\d+)?)" width="1272" height="(\d+(?:\.\d+)?)"/).slice(1).map(Number);
 const logoY=(xml)=>Number(xml.match(/<rect[^>]*x="746\.3" y="(\d+(?:\.\d+)?)" width="427\.3"/)?.[1]);
 assert.equal(leftY(explore)-leftY(encounter),2);
 assert.equal(rightY(explore)-rightY(encounter),3);
 assert.ok(Math.abs(bottom(explore)[0]-bottom(encounter)[0]-4.2)<1e-6);
 assert.equal(bottom(explore)[1],219.8);
 assert.equal(bottom(encounter)[1],224);
 assert.ok(Math.abs(logoY(explore)-logoY(encounter)-3.9)<1e-6);
 assert.match(view,/function alignEncounterChrome\(svg:SVGSVGElement\)/);
 assert.match(view,/if\(stageName!=='encounter'\)return/);
 assert.match(view,/dy=2; \/\/ power/);
 assert.match(view,/dy=3; \/\/ wildness/);
 assert.match(view,/dy=3\.9; \/\/ center/);
 assert.match(view,/dy=4\.2; \/\/ two bottom boxes/);
 assert.match(view,/if\(el\.tagName\.toLowerCase\(\)==='text'&&left>=45&&left<1290\)dx=-12/);
 assert.match(view,/panel\.setAttribute\('height','219\.8'\)/);
 assert.match(view,/if\(svg\)alignEncounterChrome\(svg\)/);
 // User-authored SVGs stay exactly as supplied rather than mutated.
 assert.match(encounter,/viewBox="0 0 1920 1080"/);
 assert.match(explore,/viewBox="0 0 1920 1080"/);
});

test('Pixel-stepped 03 Ride profile retains rider geometry and never changes real trainer data',async()=>{
 const helper=await readFile(new URL('../src/pedalkin-pixel-elevation.ts',import.meta.url),'utf8');
 assert.match(helper,/export function pixelateElevation/);
 assert.match(helper,/\.map\(p=>' H '\+fixed\(p\.x\)\+' V '\+fixed\(p\.y\)\)/);
 assert.match(helper,/const fill=line\+' L '/);
 assert.match(view,/fill\.setAttribute\('fill','#a7d49c'\)/);
 assert.match(view,/outline\.setAttribute\('stroke','#10282c'\)/);
 assert.match(view,/path\.setAttribute\('d',pixels\.line\)/);
 assert.match(view,/path\.dataset\.pkBaseD/);
 assert.match(view,/paintRiderOnProfile\(\)/);
 assert.doesNotMatch(helper,/(?:sendFtms|setGrade|requestDevice|trainerWrite|setResistance)\(/);
});

test('trainer-free demo gradient follows unpixelated source independently of stepped visual',()=>{
 assert.match(view,/getOrMake\('pk-smooth-profile-source'\)/);
 assert.match(view,/smoothSource\.setAttribute\('d',baseD\)/);
 assert.match(view,/smoothSource\.setAttribute\('opacity','0'\)/);
 assert.match(view,/const source=svg\.querySelector<SVGPathElement>\('#pk-smooth-profile-source'\)/);
 assert.match(view,/source\.getPointAtLength\(mid\)\.x<x/);
 assert.match(view,/targetX-40/);
 assert.match(view,/targetX\+40/);
 assert.match(view,/const gradient=demo\?smoothGradient\(\)/);
 assert.match(view,/liveFrame&&Number\.isFinite\(liveFrame\.gradePercent\)\?liveFrame\.gradePercent:null/);
 assert.match(view,/path\.setAttribute\('d',pixels\.line\)/);
});
