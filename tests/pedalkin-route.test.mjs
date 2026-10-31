import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const main=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
const route=await readFile(new URL('../src/pedalkin-route.ts',import.meta.url),'utf8');
const css=await readFile(new URL('../src/pedalkin-route.css',import.meta.url),'utf8');

test('Pedalkin is separate selectable mode and deep-linkable to Create Route',()=>{
 assert.match(main,/type RideExperience='classic'\|'survival'\|'cyclequest'\|'pedalkin'/);
 assert.match(main,/chooseRideExperience\('pedalkin'\)/);
 assert.match(main,/pedalkinPreview/);
 assert.match(main,/mountPedalkinRouteStudio\(\)/);
 assert.match(main,/breakawayMode==='pedalkin'/);
});

test('Pedalkin does not fork generator, BLE ownership, or duplicate live route inputs',()=>{
 assert.match(main,/\['classic','pedalkin'\]\.includes\(document\.body\.dataset\.rideExperience\|\|''\)\)void generateClassicRoute/);
 assert.match(route,/move\(builder!,builderHost\)/);
 assert.match(route,/move\(preview!,previewHost\)/);
 assert.match(route,/home\.replaceWith\(node\)/);
 assert.doesNotMatch(route,/(?:cloneNode|setGrade\(|requestDevice\(|connect\(|simulatePower|fakeTrainer)/);
 assert.match(route,/\('pkUpload'\).*input\.click|#pkUpload/);
});

test('Pedalkin navigation uses original app step buttons, never fake links',()=>{
 for(const id of ['stepRoute','stepSetup','stepRide','modeHomeButton'])assert(route.includes(id),id);
 assert.match(route,/\[data-pk-step\]/);
 assert.match(route,/\.click\(\)/);
});

test('Route studio is scoped to Pedalkin and leaves existing modes alone',()=>{
 assert.match(css,/body\.pk-route-mounted/);
 assert.match(route,/rideExperience==='pedalkin'/);
 assert.match(route,/breakawayScreen==='route'/);
 assert.doesNotMatch(route,/cycleQuestHold|setVirtualGearResistance|simRequestedGrade/);
});

test('Pedalkin has one visible upload action; the native chooser stays attached but hidden',()=>{
 assert.match(route,/id="pkUpload"/);
 assert.match(route,/const hiddenUpload=input\?\.closest<HTMLElement>\('\.route-import'\)/);
 assert.match(route,/move\(hiddenUpload!,hiddenControls\)/);
 assert.match(route,/class="pk-hidden-controls" hidden aria-hidden="true"/);
 assert.match(css,/\.pk-hidden-controls(?:,|\s*\{)/);
});

test('Difficulty is not a visible Pedalkin field; generator still retains the original select',()=>{
 assert.match(route,/const hiddenDifficulty=difficulty\?\.closest<HTMLElement>\('label'\)/);
 assert.match(route,/move\(hiddenDifficulty!,hiddenControls\)/);
 assert.match(route,/home\.replaceWith\(node\)/);
 assert.doesNotMatch(route,/hidden(?:Upload|Difficulty)\??\.remove\(\)/);
});

test('Terrain, miles and gain align in three columns, with the seed and lock below',()=>{
 assert.match(css,/\.pk-builder-host \.route-fields\s*\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;/);
 assert.match(css,/\.route-seed-field\s*\{[\s\S]*?grid-column:1 \/ -1!important;[\s\S]*?grid-row:2!important;/);
 assert.match(css,/\.route-seed-inline > \.route-seed-lock/);
 assert.match(css,/\.route-seed-lock > #lockGeneratedSeed/);
});

test('Field labels and values explicitly use dark text to defeat global white-label CSS',()=>{
 assert.match(css,/\.route-fields > label\s*\{[\s\S]*?color:#122d32!important;/);
 assert.match(css,/\.route-fields > label > :is\(input,select\)/);
 assert.match(css,/-webkit-text-fill-color:#112d32!important;/);
 assert.match(css,/color-scheme:light!important;/);
});
