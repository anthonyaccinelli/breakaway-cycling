import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const main = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
const transpile = s => ts.transpile(s, { target: ts.ScriptTarget.ES2022 });
function fn(name) {
  const start = main.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  let depth = 0,
    i = main.indexOf('{', start);
  for (; ; i++) {
    if (main[i] === '{') depth++;
    else if (main[i] === '}' && --depth === 0) return main.slice(start, i + 1);
  }
}
const code = transpile(
  [
    fn('advanceRide'),
    fn('setCycleQuestHold'),
    fn('sessionDistanceMeters'),
    fn('checkpointOdometer'),
    fn('sampleOdometer')
  ].join('\n')
);

// A flat-out simple trainer: constant 8 m/s, and a route that climbs at 6%.
function harness() {
  const roads = [];
  const c = {
    Math,
    Number,
    performance: { now: () => 0 },
    running: true,
    connected: true,
    controlGranted: true,
    realTelemetry: true,
    points: [
      { distance: 0, elevation: 0, grade: 6 },
      { distance: 50000, elevation: 3000, grade: 6 }
    ],
    procedural: false,
    endless: true,
    routeLimit: 0,
    distance: 1000,
    speed: 8,
    power: 250,
    cadence: 90,
    last: 0,
    activeRideMs: 0,
    energyKcal: 0,
    avgPowerEnergy: 0,
    avgPowerDuration: 0,
    rideOdometer: 0,
    rideSessionStartDistance: 1000,
    cycleQuestHold: false,
    cycleQuestHeldSlope: null,
    cycleQuestHeldRequestedGrade: 0,
    cycleQuestHeldGrade: null,
    cycleQuestHeldSpeed: 0,
    cycleQuestHeldErgTarget: 0,
    cycleQuestHeldGear: 6,
    trainerGrade: 4,
    lastTarget: 0,
    gear: 6,
    trainerMode: 'sim',
    lastGearUpdate: 0,
    lastChartUpdate: 0,
    GROSS_EFFICIENCY: 0.24,
    coachRuntime: undefined,
    rideExperience: 'cyclequest',
    questStoryChapter: 1,
    questFinalSummitResolved: false,
    cscLastSpeedAt: 0,
    cscSpeedMps: 0,
    cscLastCadenceAt: 0,
    sensorRideOnly: () => false,
    weightKg: () => 40,
    num: id => (id === 'difficulty' ? 100 : 1),
    at: d => ({ grade: 6, elevation: d * 0.06 }),
    ensureTerrain() {},
    svg() {},
    checkStationaryRide() {},
    finishRide() {},
    status() {},
    updateSimResistance: async () => {},
    setVirtualGearResistance: async () => {},
    setFixedErgPower: async () => {},
    recordRideSample() {},
    update() {},
    questHighestSummit: () => null,
    simRequestedGrade: () => 6,
    advanceRoadSpeed: (v, w, dt, road) => {
      roads.push(road.gradePercent);
      return v;
    }
  };
  vm.createContext(c);
  vm.runInContext(code, c);
  return { c, roads };
}
const ride = (c, seconds) => {
  for (let i = 0; i < seconds; i++) {
    c.clock = (c.clock || 0) + 1000;
    vm.runInContext('advanceRide(clock)', c);
  }
};

test('outside battles the odometer follows the route exactly', () => {
  const { c } = harness();
  ride(c, 10);
  assert.equal(Math.round(c.distance), 1080);
  assert.equal(Math.round(c.rideOdometer), 80);
  assert.equal(Math.round(vm.runInContext('sessionDistanceMeters()', c)), 80);
});
test('during a Cycle Quest battle the route waits, the grade stays locked and real distance still counts', () => {
  const { c, roads } = harness();
  ride(c, 5);
  vm.runInContext('setCycleQuestHold(true)', c);
  roads.length = 0;
  assert.equal(c.cycleQuestHeldGrade, 6, 'the 6% climb the rider was on');
  assert.equal(c.cycleQuestHeldSlope, 6);
  ride(c, 30);
  assert.equal(Math.round(c.distance), 1040, 'route position waits where the battle began');
  assert.equal(Math.round(c.rideOdometer), 40 + 240, 'the 30 battle seconds are real miles in the ride file');
  assert(roads.length > 0 && roads.every(g => g === 6), 'battle speed uses the locked grade');
  vm.runInContext('setCycleQuestHold(false)', c);
  ride(c, 5);
  assert.equal(Math.round(c.distance), 1080, 'the rider resumes from the battle start');
  assert.equal(Math.round(c.rideOdometer), 320);
});
test('the locked battle grade is capped at -3% to +8%', () => {
  for (const [grade, locked] of [
    [12, 8],
    [-9, -3],
    [2.5, 2.5]
  ]) {
    const { c } = harness();
    c.at = () => ({ grade, elevation: 0 });
    vm.runInContext('setCycleQuestHold(true)', c);
    assert.equal(c.cycleQuestHeldGrade, locked, String(grade));
  }
});
test('ride files and saved rides use the odometer; old samples and checkpoints still work', () => {
  const { c } = harness();
  c.rideSessionStartDistance = 500;
  assert.equal(vm.runInContext('sampleOdometer({distance:900,odometer:1234})', c), 1234);
  assert.equal(vm.runInContext('sampleOdometer({distance:900})', c), 400);
  assert.equal(
    vm.runInContext('checkpointOdometer({distance:900,rideOdometer:2000,rideSamples:[]})', c),
    2000
  );
  assert.equal(
    vm.runInContext('checkpointOdometer({distance:900,rideSessionStartDistance:100,rideSamples:[]})', c),
    800
  );
  assert(main.includes('<DistanceMeters>${sampleOdometer(s).toFixed(2)}</DistanceMeters>'));
  assert(main.includes('rideSamples.push({seconds,distance,odometer:rideOdometer,'));
});
