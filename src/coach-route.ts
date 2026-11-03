/** Route distance is a safety buffer, not an estimate of workout mileage.
 * Coach finishes on interval time; Classic must not auto-finish the route first.
 * 24 mph protects faster indoor riders without presenting a 39 mph itinerary.
 */
export function coachRouteMiles(durationSeconds:number):number {
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0)return 5;
  return Math.min(150,Math.max(5,Math.ceil(durationSeconds/3600*24)));
}
