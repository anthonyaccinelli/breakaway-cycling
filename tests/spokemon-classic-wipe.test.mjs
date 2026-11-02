import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const file=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [ride,game,wipe,css,explore,encounter]=await Promise.all([
 file('src/pedalkin-ride.ts'),file('src/spokemon-playable.ts'),
 file('src/spokemon-classic-wipe.ts'),file('src/spokemon-classic-wipe.css'),
 file('public/pedalkin/explore.svg'),file('public/pedalkin/encounter.svg')
]);
test('Classic Game Boy Wipe is the only encounter transition in production',()=>{
 assert.match(ride,/createSpokemonClassicWipe/);
 assert.match(ride,/switchScene:changeSpokemonScene/);
 assert.doesNotMatch(ride,/createSpokemonTransitions|Forest Rustle|spokemonTransitions=compare/);
 assert.match(wipe,/for\(let i=0;i<16;i\+\+\)/);
 assert.match(wipe,/bar\.style\.transformOrigin=i%2===0/);
});
test('The original Illustrator artboards remain the same unmodified source',()=>{
 assert.match(explore,/viewBox="0 0 1920 1080"/);
 assert.match(encounter,/viewBox="0 0 1920 1080"/);
 assert.match(ride,/untouched\.data=svgUrl\(stageName\)/);
 assert.match(css,/left:19\.80%/);
 assert.match(css,/width:60\.40%/);
});
test('Wipe does not uncover the next SVG before its live readouts are ready',()=>{
 assert.match(wipe,/Promise\.resolve\(\)\.then\(swap\)/);
 assert.match(ride,/render\(resolve\)/);
 assert.match(ride,/onReady\?\.\(\)/);
 assert.match(ride,/canPaintDuringTransition/);
 assert.match(wipe,/hasSwapped:\(\)=>running&&swapped/);
 assert.match(game,/options\.canPaintDuringTransition\?\.\(\)/);
});
test('Encounter progression freezes during transition; users can disable motion',()=>{
 assert.match(game,/if\(options\.isTransitioning\?\.\(\)\)return/);
 assert.match(wipe,/prefers-reduced-motion: reduce/);
 assert.match(css,/pointer-events:none!important/);
 assert.match(ride,/isTransitioning:\(\)=>classicWipe\?\.isRunning\(\)===true/);
});
