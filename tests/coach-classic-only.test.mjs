import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const coach=readFileSync(new URL('../src/coach.ts',import.meta.url),'utf8');
const engine=readFileSync(new URL('../src/coach-engine.ts',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/coach.css',import.meta.url),'utf8');
const route=readFileSync(new URL('../src/classic-route-reference.ts',import.meta.url),'utf8');
const routeCss=readFileSync(new URL('../src/classic-route-reference.css',import.meta.url),'utf8');

test('Coach is a subfeature of Classic, not a fourth home mode',()=>{
 assert.match(coach,/classicRoute=document.getElementById\('screenRoute'\)/);
 assert.match(route,/shell\.innerHTML='<button type="button" id="openBreakawayCoach"/);
 assert.match(coach,/target\.closest\('#openBreakawayCoach'\)/);
 assert.doesNotMatch(coach,/bridgeHome\(\)\.append\(trigger\)/);
 assert.match(coach,/BACK TO CLASSIC/);
 assert.match(coach,/coachStartClassic/);
 assert.match(css,/#openBreakawayCoach\{display:none!important\}/);
 assert.match(css,/\[data-ride-experience="classic"\]\[data-breakaway-screen="route"\]/);
 assert.match(main,/id="chooseClassic"/);
});
test('No Coach intervals, ERG commands, or game target adjustments are available in Survival and Cycle Quest',()=>{
 assert.match(engine,/export type CoachMode = 'classic';/);
 assert.doesNotMatch(coach,/data-coach-mode="survival"|data-coach-mode="cyclequest"|Guided pursuit|Adventure coaching/);
 assert.doesNotMatch(main,/coachRuntime\.isRecovery\(\)|coachRuntime\.onTarget\(power\)/);
 assert.match(main,/\/\/ SURVIVE is independent of the rider's pause state/);
 assert.match(main,/launchMode:\(_mode\)=>\{showBreakawayScreen\('route'\);\}/);
});
test('All three riding modes tag saved activities for training awareness only',()=>{
 assert.match(main,/mode:rideExperience,meters:distance/);
 assert.match(main,/getPlatformRides:async\(\)=> \(await savedRides\(\)\)\.map/);
 assert.match(coach,/ALL BREAKAWAY RIDES/);
 assert.match(coach,/platformRides\.some\(r=>r.mode!==null&&r.mode!=='classic'/);
});
test('Coach dashboard is a fixed overlay that is not affected by the generic main route CSS',()=>{
 assert.match(coach,/'<div class="coach-main" role="main">/);
 assert.doesNotMatch(coach,/'<main class="coach-main">/);
 assert.match(css,/\.coach-screen\{position:fixed/);
});

test('Coach banner is mounted in the visible Classic Route Studio above the upload row',()=>{
 const markup=route.slice(route.indexOf("shell.innerHTML="),route.indexOf("const uploadButton"));
 assert.match(markup,/id="openBreakawayCoach"/);
 assert.match(markup,/Train with Breakaway Coach/);
 assert.match(markup,/OPEN COACH/);
 assert.ok(markup.indexOf('id="openBreakawayCoach"')<markup.indexOf('class="cr-upload-row"'));
 assert.match(route,/coachBanner\.hidden=survival/);
 assert.match(coach,/classicRoute\?\.addEventListener\('click',event=>/);
 // Regression: the former #routeStudio is hidden by Classic's reference layout.
 // The banner must be a child of .cr-reference instead, not inserted there.
 assert.doesNotMatch(coach,/routeHeading\.insertAdjacentElement\('afterend',trigger\)/);
 assert.match(routeCss,/grid-template-rows:calc\(150 \* var\(--cr-u\)\) calc\(44 \* var\(--cr-u\)\)/);
 assert.match(css,/background:#f1f3f6!important;background-image:none!important/);
 assert.match(css,/#openBreakawayCoach\{display:none!important\}/);
 assert.doesNotMatch(css,/background-image:\s*url\(/);
});
