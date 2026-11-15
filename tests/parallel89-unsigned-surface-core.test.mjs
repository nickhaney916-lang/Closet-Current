import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {unsignedStaticSourceSurfaceGap89} from
 '../research/parallel89/unsigned-surface-core89.mjs';
function plane(z,x=0){
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([
  x+0,0,z, x+1,0,z, x+0,1,z
 ],3));g.setIndex([0,1,2]);return g;
}
test('exact temporary BVH world-surface distances measured in meters without modifying geometry',()=>{
 const a=plane(0),b=plane(.012),position=a.getAttribute('position').array.slice();
 const originalTree={marker:'keep'};b.boundsTree=originalTree;
 const result=unsignedStaticSourceSurfaceGap89(a,b);
 assert.deepEqual(result.sourceTriangleCounts,[1,1]);
 assert.ok(Math.abs(result.unsignedMinimumSurfaceDistanceMeters-.012)<.000002);
 assert.equal(result.signedExteriorClearanceMeasured,false);
 assert.equal(result.bodyContainmentMeasured,false);
 assert.equal(result.continuousMovementMeasured,false);
 assert.equal(b.boundsTree,originalTree);
 assert.deepEqual([...a.getAttribute('position').array],[...position]);
 a.dispose();b.dispose();
});
test('exact touch and overlapping triangles have zero unsigned min distance, never signed clearance',()=>{
 const a=plane(0),touch=plane(0);
 const r=unsignedStaticSourceSurfaceGap89(a,touch);
 assert.equal(r.unsignedMinimumSurfaceDistanceMeters,0);
 assert.equal(r.signedExteriorClearanceMeasured,false);
 a.dispose();touch.dispose();
});
test('adversarial empty, invalid indexed, and nonfinite source geometry fail closed',()=>{
 const a=plane(0),b=plane(.01),bad=plane(0);
 bad.getAttribute('position').setX(0,Number.NaN);
 const invalid=plane(0);invalid.setIndex([0,1,9]);
 const empty=new T.BufferGeometry();
 for(const g of [bad,invalid,empty])
  assert.throws(()=>unsignedStaticSourceSurfaceGap89(g,b));
 assert.equal(b.boundsTree,undefined);
 const tiny=unsignedStaticSourceSurfaceGap89(a,plane(.0004));
 assert.equal(tiny.unsignedMinimumSurfaceDistanceMeters,.0004);
 a.dispose();b.dispose();bad.dispose();invalid.dispose();empty.dispose();
});
