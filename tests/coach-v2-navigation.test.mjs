import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const bundle=read('src/vendor/breakaway-coach/breakaway-coach.js');
const css=read('src/vendor/breakaway-coach/breakaway-coach.css');
const main=read('src/main.ts');

test('Bundled Coach contains the same accessible navigation sections',()=>{
  for(const tab of ['Today','Plan','History','Settings']){
    assert.ok(bundle.includes('id="coachTab'+tab+'"'),'Missing '+tab+' tab');
    assert.ok(bundle.includes('id="coachView'+tab+'"'),'Missing '+tab+' panel');
  }
  assert.match(bundle,/role="tablist"/);
  assert.match(bundle,/aria-selected/);
  assert.match(bundle,/ArrowRight/);
  assert.match(bundle,/ArrowLeft/);
  assert.match(css,/\.coach-v2 \.coach-view\[hidden\]/);
});

test('Bundled Coach retains workout start, history importing and rider settings',()=>{
  for(const id of ['coachStartClassic','coachHistoryImport','coachFtp','coachWeek','coachPlanLibrary','coachSettingsFeedback']){
    assert.ok(bundle.includes('id="'+id+'"'),'Missing '+id+' entry');
  }
  assert.match(bundle,/CONNECT MY TRAINER/);
  assert.match(bundle,/data-upcoming-workout/);
  assert.match(main,/launchMode:\(_mode\)=>\{showBreakawayScreen\('setup'\);\}/);
});

test('Bundled Coach uses the independent light theme, not RPG mode CSS',()=>{
  assert.match(css,/#breakawayCoachScreen\.coach-v2/);
  assert.match(css,/background:#f5f7fb!important/);
  assert.match(css,/\.coach-v2 \.coach-nav button\[aria-selected=true\]/);
});
