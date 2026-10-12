'use strict';
// Capture on a regular cadence. Similar colors and hand movement must not
// prevent an entire session from producing reviewable candidate images.
class CaptureCadence {
 constructor(intervalMs){this.intervalMs=intervalMs;this.last=null;}
 due(now,ready){return ready&&(this.last===null||now-this.last>=this.intervalMs);}
 captured(now){this.last=now;}
}
