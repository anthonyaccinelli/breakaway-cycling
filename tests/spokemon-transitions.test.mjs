import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=(file)=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [transitions,css,ride,play,explore,encounter]=await Promise.all([
 read('src/spokemon-transitions.ts'),
 read('src/spokemon-transitions.css'),
 read('src/pedalkin-ride.ts'),
 read('src/spokemon-playable.ts'),
 read('public/pedalkin/explore.svg'),
 read('public/pedalkin/encounter.svg')
]);
test('Both transition modes use the original Illustrator scene artboards',()=>{
 assert.match(ride,/createSpokemonTransitions/);
 assert.match(ride,/sceneTransitions\.transition\(\(\)=>render\(\)\)/);
 assert.match(ride,/spokemonTransitions.*compare/);
 assert.match(ride,/get\('spokemonTransitionStyle'\).*'wipe'/);
 assert.ok(explore.includes('viewBox="0 0 1920 1080"'));
 assert.ok(encounter.includes('viewBox="0 0 1920 1080"'));
});
test('Forest Rustle and Game Boy horizontal bars are animated without mutating original SVG paths',()=>{
 assert.match(transitions,/style==='rustle'/);
 assert.match(transitions,/style==='rustle'\?960:760/);
 assert.match(transitions,/curtain\.dataset\.style=style/);
 assert.match(transitions,/for\(let i=0;i<16;i\+\+\)/);
 assert.match(transitions,/leafCanvas\.width=960/);
 assert.match(transitions,/drawLeaves\(t,coverage\)/);
 assert.match(transitions,/pendingSwap\?\.\(\)/);
 assert.match(transitions,/onDone\(\)/);
 assert.match(css,/\.pk-scene-transition\[hidden\]/);
 assert.match(css,/left:19\.80%/);
});
test('Selection panel previews both styles and plays return transitions',()=>{
 assert.match(transitions,/Forest Rustle/);
 assert.match(transitions,/Classic Game Boy Wipe/);
 assert.match(transitions,/ENTER ENCOUNTER/);
 assert.match(transitions,/RETURN TO EXPLORE/);
 assert.match(transitions,/REPLAY EFFECT/);
 assert.match(transitions,/onSceneRequested/);
});
test('Transitions stop Patience ticks and respect reduced-motion users',()=>{
 assert.match(play,/options\.isTransitioning\?\.\(\)/);
 assert.match(play,/Freeze Trust and Patience/);
 assert.match(transitions,/prefers-reduced-motion: reduce/);
});
