import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
const start = source.indexOf('function openModeLanding(){');
const end = source.indexOf("modeLanding.querySelector('#modeDevices')", start);
if (start < 0 || end < 0) throw new Error('Mode navigation was not found');
const modeFunction = ts.transpile(source.slice(start, end));

test('changing modes pauses the ride and preserves the connected trainer', () => {
  const context = vm.createContext({window:{scrollTo(){}}, document:{body:{dataset:{rideExperience:'cyclequest',deviceShortcut:'true'}},getElementById:()=>null},modeLanding:{},modeHomeButton:{},screenRoute:{},screenSetup:{},screenRide:{}});
  vm.runInContext(`let surviveOn=false,running=true,rideAwaitingPedaling=false,pedalSince=42,cycleQuestHold=true,connected=true,controlGranted=true; function status(){} function pauseRide(){running=false;rideAwaitingPedaling=true}`, context);
  vm.runInContext(modeFunction, context);
  assert.equal(vm.runInContext('openModeLanding()', context), true);
  assert.equal(vm.runInContext('running', context), false);
  assert.equal(vm.runInContext('rideAwaitingPedaling', context), false);
  assert.equal(vm.runInContext('pedalSince', context), 0);
  assert.equal(vm.runInContext('connected && controlGranted', context), true);
  assert.equal(context.document.body.dataset.breakawayScreen, 'home');
  assert.equal(context.modeLanding.hidden, false);
});

test('an active Survival session cannot be abandoned by changing modes', () => {
  const context = vm.createContext({document:{body:{dataset:{}}},status(){}});
  vm.runInContext('let surviveOn=true;', context);
  vm.runInContext(modeFunction, context);
  assert.equal(vm.runInContext('openModeLanding()', context), false);
});
