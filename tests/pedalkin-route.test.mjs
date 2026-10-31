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
