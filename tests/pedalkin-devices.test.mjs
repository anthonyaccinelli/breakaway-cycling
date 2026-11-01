import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=n=>readFile(new URL('../src/'+n,import.meta.url),'utf8');
const [main,devices,styles,route]=await Promise.all([
 read('main.ts'),read('pedalkin-handheld-devices.ts'),
 read('pedalkin-handheld-devices.css'),read('pedalkin-handheld-route.ts')
]);
test('02 Devices uses the same unmodified console SVG as 01 Route',()=>{
 assert.match(route,/src="\/pedalkin\/route-v2\.svg"/);
 assert.match(devices,/src="\/pedalkin\/route-v2\.svg"/);
 assert.match(devices,/class="pk-dev-screen"/);
 assert.match(styles,/left:29\.24%!important;top:20\.05%!important/);
 assert.match(styles,/width:41\.56%!important;height:62\.8%!important/);
 assert.match(styles,/aspect-ratio:16\/9!important/);
 assert.match(styles,/\.pk-dev-frame-nav button\[aria-current="page"\]/);
 assert.match(devices,/data-pk-nav="stepSetup" aria-current="page"/);
});
test('Connect buttons reuse actual BLE handlers without a second connection implementation',()=>{
 for(const [proxy,id] of [
  ['trainer','connect'],['hr','connectHr'],['click','connectClick'],
  ['down','down'],['up','up'],['continue','goToRide']]){
  assert.match(devices,new RegExp("data-pk-action=\\""+proxy+"\\""));
  assert.match(devices,new RegExp("el<HTMLButtonElement>\\('"+id+"'\\)"));
 }
 assert.match(devices,/buttons\[name\]\?\.click\(\)/);
 assert.doesNotMatch(devices,/(?:requestDevice|connectGatt|sendFtms|setTrainerResistance|setVirtualGearResistance)\(/);
});
test('Trainer readiness gates the ride button, while HR and Click remain optional',()=>{
 assert.match(devices,/const ready=!buttons\.continue\.disabled/);
 assert.match(devices,/next\.disabled=!ready/);
 assert.match(devices,/if\(name==='continue'&&buttons\.continue\.disabled\)return/);
 assert.match(devices,/PAIR YOUR TRAINER TO ENABLE THE NEXT STEP/);
 assert.match(devices,/HR and Click are optional/);
 assert.match(devices,/dataset\.connectionState/);
});
test('Ride settings are paired to original drivetrain and FTMS controls',()=>{
 for(const id of ['drivetrainMode','trainerMode','autoBluetooth','fixedErgWatts']){
  assert(devices.includes("'"+id+"'"));
 }
 assert.match(devices,/dest\.dispatchEvent\(new Event\('change'/);
 assert.match(devices,/real\.auto\.dispatchEvent\(new Event\('change'/);
 assert.match(devices,/real\.watts\.dispatchEvent\(new Event\('input'/);
 assert.match(devices,/control\.value!=='target'/);
 assert.match(devices,/shifting\.value!=='virtual'/);
});
test('The body dataset controls the screen without altering other Ride Breakaway modes',()=>{
 assert.match(main,/mountPedalkinHandheldDevices\(\)/);
 assert.match(devices,/dataset\.rideExperience==='pedalkin'&&document\.body\.dataset\.breakawayScreen==='setup'/);
 assert.match(devices,/shell\.hidden=!active/);
 assert.match(devices,/document\.body\.classList\.toggle\('pk-dev-active',active\)/);
 assert.match(styles,/\.pk-dev-shell\[hidden\]\{display:none!important\}/);
});
