/** Typed host contract for the versioned Breakaway Coach distribution bundle.
 *  Keep aligned with CoachBridge and runtime exported by breakaway-coach/src/coach.ts.
 */
export type CoachMode = 'classic';
export type CoachRideMode = 'classic'|'survival'|'cyclequest'|'pedalkin'|null;
export interface CoachBridge {
  launchMode:(mode:CoachMode)=>void;
  makeRoute:(durationSeconds:number,structured:boolean)=>void;
  setMode:(mode:'target'|'sim')=>void;
  setTarget:(watts:number)=>void;
  isRiding:()=>boolean;
  getPlatformRides:()=>Promise<Array<{
    start:number;elapsed:number;avgPower:number|null;mode:CoachRideMode;name:string;
  }>>;
}
export interface CoachSnapshot {
  name:string;
  mode:CoachMode;
  control:'structured'|'guided';
  remaining:string;
  target:number;
  done:boolean;
}
export interface CoachRuntime {
  tick(dt:number,watts:number,cadence:number,hasTelemetry:boolean):void;
  finish():HTMLElement|null;
  endCoaching():void;
  snapshot():CoachSnapshot|null;
  readonly mode:CoachMode|null;
  readonly active:boolean;
}
export declare function mountCoach(bridge:CoachBridge):CoachRuntime;
