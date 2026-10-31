import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const classic=await readFile(new URL('../src/classic-route-reference.ts',import.meta.url),'utf8');
const cockpit=await readFile(new URL('../src/classic-cockpit.ts',import.meta.url),'utf8');
const classicCss=await readFile(new URL('../src/classic-route-reference.css',import.meta.url),'utf8');
const pedalkinCss=await readFile(new URL('../src/pedalkin-classic-route.css',import.meta.url),'utf8');

test('Pedalkin is a selectable separate mode with navigable deep-link',()=>{
 assert.match(main,/type RideExperience='classic'\|'survival'\|'cyclequest'\|'pedalkin'/);
 assert.match(main,/chooseRideExperience\('pedalkin'\)/);
 assert.match(main,/pedalkinPreview/);
 assert.match(main,/breakawayMode==='pedalkin'/);
});

test('Pedalkin reuses the exact Classic route implementation, rather than a parallel layout',()=>{
 assert.match(classic,/\['classic','survival','pedalkin'\]/);
 assert.match(classic,/move\(builder!,controls\);move\(summary!,summaryHost\);move\(edit!,tools\);move\(next!,callout\)/);
 assert.match(classic,/move\(chart!,profile\);move\(scrub!,profile\)/);
 assert.match(main,/import '\.\/pedalkin-classic-route\.css'/);
 assert.doesNotMatch(main,/mountPedalkinRouteStudio\(/);
 assert.match(cockpit,/dataset\.rideExperience==='pedalkin'&&document\.body\.dataset\.breakawayScreen==='route'/);
});

test('Classic dimensions 2048 by 1044 and 3-panel grid are inherited without changes',()=>{
 assert.match(classicCss,/2048x1044 reference/);
 assert.match(classicCss,/--cr-u:min\(calc\(100vw \/ 2048\),calc\(100dvh \/ 1044\)\)/);
 assert.match(classicCss,/grid-template-columns:minmax\(0,770fr\) minmax\(0,502fr\) minmax\(0,576fr\)/);
 assert.match(classicCss,/calc\(385 \* var\(--cr-u\)\)/);
 assert.match(pedalkinCss,/--cr-u:min\(calc\(100vw \/ 2048\),calc\(100dvh \/ 1044\)\)/);
});

test('Palette matches the uploaded color swatch exactly',()=>{
 for(const hex of ['#0f292f','#21484e','#fbc5ab','#ffffff'])assert(pedalkinCss.includes(hex),hex);
 assert.match(pedalkinCss,/#0F292F \/ #21484E \/ #FBC5AB \/ #FFFFFF/);
});

test('Route maker keeps the actual generator, upload and equipment connection',()=>{
 assert.match(classic,/uploadButton\.addEventListener\('click',\(\)=>upload\.click\(\)\)/);
 assert.match(classic,/copy\(document\.getElementById\('generateRoute'\),'Generate Route'\)/);
 assert.match(classic,/copy\(document\.getElementById\('surpriseRoute'\),'Surprise Me!'\)/);
 assert.match(classic,/copy\(document\.getElementById\('endlessRoute'\),'Endless Route'\)/);
 assert.match(classic,/copy\(summary!\.querySelector<HTMLElement>\('h2'\),'Your Route Preview'\)/);
 assert.match(classic,/copy\(note,survival\?/);
});

test('Difficulty remains hidden in Pedalkin but the original generator select is not removed',()=>{
 assert.match(pedalkinCss,/\.route-fields>label:has\(> #generatedDifficulty\)/);
 assert.match(pedalkinCss,/display:none!important;/);
 assert.match(pedalkinCss,/\.route-seed-field/);
 assert.match(pedalkinCss,/\.route-seed-lock/);
 assert.match(classic,/gainLabel\.textContent=isPedalkin\?'Total Elevation'/);
});

test('Only Pedalkin gets the new banner; Coach stays in Classic',()=>{
 assert.match(classic,/class="pk-classic-banner" hidden/);
 assert.match(classic,/coachBanner\.hidden=survival\|\|isPedalkin/);
 assert.match(classic,/pedalkinBanner\.hidden=!isPedalkin/);
 assert.match(classic,/document\.body\.classList\.remove\('cr-reference-mounted','sr-reference-mounted','pk-classic-reference'\)/);
 assert.match(pedalkinCss,/\.pk-classic-banner:not\(\[hidden\]\)/);
});

test('The route skin does not change actual SIM grade, shifting or ride recording',()=>{
 assert.doesNotMatch(pedalkinCss,/(?:simRequestedGrade|setVirtualGearResistance|setGrade|rideMeters)/);
 assert.doesNotMatch(classic,/(?:simRequestedGrade|setVirtualGearResistance|setGrade)\(/);
});
