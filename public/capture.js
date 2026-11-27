'use strict';
// Capture on a regular cadence. Similar colors and hand movement must not
// prevent an entire session from producing reviewable candidate images.
class CaptureCadence {
 constructor(intervalMs,startedAt=null){this.intervalMs=intervalMs;this.last=startedAt;}
 due(now,ready){
  // Wall-clock corrections must not leave the hands-free countdown stalled.
  // Rebase on a backwards jump and wait a full interval before another photo.
  if(this.last!==null&&now<this.last)this.last=now;
  return ready&&(this.last===null||now-this.last>=this.intervalMs);
 }
 captured(now){this.last=now;}
}
