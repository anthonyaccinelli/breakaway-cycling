import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const coach=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/coach-v2.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');

test('Coach has four distinct accessible sections rather than a scrolling dashboard',()=>{
 const tabs=['Today','Plan','History','Settings'];
 for(const tab of tabs){
  assert.match(coach,new RegExp('id="coachTab'+tab+'" role="tab"'));
  assert.match(coach,new RegExp('id="coachView'+tab+'" role="tabpanel"'));
 }
 assert.match(coach,/role="tablist"/);
 assert.match(coach,/view\.hidden=view\.dataset\.coachView!==tab/);
 assert.match(coach,/button\.setAttribute\('aria-selected',String\(selected\)\)/);
 assert.match(coach,/ArrowRight/);
 assert.match(coach,/ArrowLeft/);
 assert.match(css,/\.coach-v2 \.coach-view\[hidden\]\{display:none!important\}/);
});
test('One clear route from recommended workout to Classic Devices, and game modes never get Coach commands',()=>{
 assert.match(coach,/id="coachStartClassic"/);
 assert.match(coach,/CONTINUE TO CONNECT TRAINER/);
 assert.match(coach,/Next: Classic Devices/);
 assert.match(main,/launchMode:\(_mode\)=>\{showBreakawayScreen\('setup'\);\}/);
 assert.doesNotMatch(coach,/data-coach-mode="survival"|data-coach-mode="cyclequest"/);
});
test('History importer and profile controls remain functional but are in dedicated sections',()=>{
 const history=coach.indexOf('id="coachViewHistory"'),settings=coach.indexOf('id="coachViewSettings"');
 assert.ok(coach.indexOf('id="coachHistoryImport"')>history);
 assert.ok(coach.indexOf('id="coachHistoryImport"')<settings);
 assert.ok(coach.indexOf('id="coachFtp"')>settings);
 assert.match(coach,/id="coachWeek"/);
 assert.match(coach,/id="coachPlanLibrary"/);
 assert.match(coach,/data-library-workout/);
 assert.match(coach,/data-upcoming-workout/);
 assert.match(coach,/id="coachSettingsFeedback"/);
});
test('Coach uses a quiet, legible light UI independent of the dark RPG themes',()=>{
 assert.match(css,/#breakawayCoachScreen\.coach-v2/);
 assert.match(css,/background:#f5f7fb!important/);
 assert.match(css,/\.coach-v2 \.coach-nav button\[aria-selected=true\]/);
 assert.match(css,/\.coach-v2 \.coach-panel\{/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(coach,/import '\.\/coach-v2\.css'/);
});
