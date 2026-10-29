import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=src('src/coach.ts');
const strengthUI=src('src/coach-strength-ui.ts');
const css=src('src/coach-ux-polish.css');

function luminance(hex){
 const values=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return values[0]*.2126+values[1]*.7152+values[2]*.0722;
}
function contrast(a,b){const l=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (l[0]+.05)/(l[1]+.05);}
test('Core light-theme Coach labels meet WCAG AA normal-text contrast targets',()=>{
 for(const [foreground,background] of [
  ['#405a75','#ffffff'],['#34547b','#eaf2fd'],['#17479d','#ffffff'],
  ['#344b67','#e5ebf4'],['#12644e','#eaf8f4'],['#465c75','#ffffff'],
  ['#144d9c','#ffffff'],['#4e6177','#f4f7fb'],['#0b4bb9','#ffffff']
 ])assert.ok(contrast(foreground,background)>=4.5,foreground+' / '+background);
});
test('Navigation is clear, with one setup save and no unavoidable advanced trainer settings',()=>{
 assert.match(ui,/id="coachTabToday".*<span>Today<\/span>/);
 assert.match(ui,/id="coachTabPlan".*<span>My Week<\/span>/);
 assert.match(ui,/id="coachTabHistory".*<span>Progress<\/span>/);
 assert.match(ui,/id="coachTabSettings".*<span>My Setup<\/span>/);
 assert.equal((ui.match(/id="coachSaveProfile"/g)||[]).length,1);
 assert.match(ui,/SAVE MY PLAN/);
 assert.doesNotMatch(strengthUI,/id="strengthSave"/);
 assert.match(ui,/strength\?\.saveSettings\(\)/);
 assert.match(ui,/<details class="coach-trainer-options">/);
 assert.match(ui,/CONNECT MY TRAINER/);
 assert.match(ui,/id="coachDemo"/);
});
test('Cycling and strength appear on one calendar and upcoming uses its integrated schedule',()=>{
 assert.match(ui,/const upcoming=schedule\.days\.flatMap/);
 assert.match(ui,/filter\(item=>item\.day>now\)/);
 assert.match(ui,/data-upcoming-type/);
 assert.match(ui,/coach-strength-primary/);
 assert.match(ui,/strengthOnly\)todayGrid\.insertBefore/);
 assert.match(ui,/strengthOnly\?'STRENGTH DAY'/);
 assert.match(ui,/coach-library-disclosure/);
});
test('Contrast cleanup covers touch controls, visible focus, mobile sizing and exercise entries',()=>{
 assert.match(ui,/import '\.\/coach-ux-polish\.css'/);
 assert.match(css,/min-height:53px!important/);
 assert.match(css,/min-height:44px!important/);
 assert.match(css,/\.coach-v2 button:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.coach-strength-overlay \.coach-strength-set input/);
 assert.match(css,/\.coach-v2 \.coach-import-stage/);
 assert.match(css,/\.coach-hud \.coach-hud-actions button/);
 assert.match(css,/\.coach-finish-review/);
});
test('Strength overlay stays navigable with keyboard and restores focus',()=>{
 assert.match(strengthUI,/event\.key==='Escape'/);
 assert.match(strengthUI,/returnFocus\?\.focus\(\)/);
 assert.match(strengthUI,/overlay\.scrollTop=scroll/);
 assert.match(strengthUI,/restUntil>Date\.now\(\)/);
 assert.match(strengthUI,/Load \(lb \/ kg \/ BW\)/);
});
