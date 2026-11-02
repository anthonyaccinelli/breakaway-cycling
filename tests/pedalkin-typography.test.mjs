import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=name=>readFile(new URL('../src/'+name,import.meta.url),'utf8');
const [css,svg,route,devices,ride,overlay,overlayPreview,main]=await Promise.all([
 load('pedalkin-universal-font.css'),load('pedalkin-font-artwork.ts'),
 load('pedalkin-handheld-route.ts'),load('pedalkin-handheld-devices.ts'),
 load('pedalkin-ride.css'),load('pedalkin-overlay-theme.ts'),
 load('pedalkin-overlay-preview.ts'),load('main.ts'),
]);
test('User supplied Minecraft is embedded as valid self-contained WOFF2 font',()=>{
 const data=css.match(/data:font\/woff2;base64,([A-Za-z0-9+/=]+)/)?.[1];
 assert(data,'embedded font data must be present');
 const bytes=Buffer.from(data,'base64');
 assert.equal(data.length,4184);
 assert.equal(bytes.length,3136);
 assert.equal(bytes.toString('ascii',0,4),'wOF2');
 assert.match(css,/font-family:"Spokemon Minecraft"/);
 assert.match(css,/font-weight:400 900/);
});
test('01 Route and 02 Devices display same untouched SVG as inline vector using the approved v3 Illustrator artboard',()=>{
 assert.match(svg,/fetch\('\/pedalkin\/route-v3.svg'\)/);
 assert.match(svg,/new DOMParser\(\)\.parseFromString/);
 assert.match(svg,/existing\.replaceWith\(svg\)/);
 assert.match(svg,/svg\.classList\.add/);
 assert.match(route,/void enableSpokemonHandheldFont\(shell\)/);
 assert.match(devices,/void enableSpokemonHandheldFont\(shell\)/);
 assert.match(css,/body \.pk-v2-stage svg text/);
 assert.match(css,/body \.pk-dev-stage svg text/);
 assert.match(css,/body \.pk-v2-live :is\(input,select\)/);
 assert.match(css,/body \.pk-dev-screen button/);
});
test('03 Ride includes headings, readouts, dialogue, menu, and newly created SVG labels',()=>{
 assert.match(css,/body \.pk-ride-host svg text/);
 assert.match(css,/body \.pk-ride-host svg tspan/);
 assert.match(css,/body \.pk-ride-host :is\(button,label,div,span,b,small,h1,h2,p\)/);
 assert.match(css,/font-family:var\(--spokemon-game-font\)!important/);
 assert.match(css,/body \.pk-ride-host :is\(\.pk-popup-title,\.pk-popup-body\)/);
});
test('170px overlay uses the same font in normal, simulated, and floating PiP views',()=>{
 assert.match(css,/body\.pedalkin-overlay-theme #overlayContent \*/);
 assert.match(css,/body\.pk-overlay-preview-mode #pkOverlayPreviewRoot \*/);
 assert.match(main,/import SPOKEMON_FONT_CSS from '\.\/pedalkin-universal-font\.css\?inline'/);
 assert.match(main,/pedalkinTheme\.textContent=PEDALKIN_OVERLAY_CSS\+'\\n'\+SPOKEMON_FONT_CSS/);
 assert.match(overlayPreview,/SPOKEMON_FONT_CSS/);
 assert.match(overlay,/grid-template-rows:27px repeat\(2,minmax\(0,1fr\)\)!important/);
 assert.match(css,/body\.pedalkin-overlay-theme #overlayContent \.tile b/);
});
