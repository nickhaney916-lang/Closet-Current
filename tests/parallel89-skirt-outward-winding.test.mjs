import test from 'node:test';
import assert from 'node:assert/strict';
import {outwardSkirtQuadTriangles89,auditOutwardSkirtRestWinding89 as audit}
 from '../research/parallel89/skirt-outward-winding89.mjs';
const rows=7,segments=48;
function source({inward=false,collapsed=false}={}){
 const worldRest=[],indices=[];
 for(let r=0;r<rows;r++)for(let j=0;j<=segments;j++){
  const a=2*Math.PI*j/segments;
  const rx=collapsed?0:.21+.015*r,rz=.15+.008*r;
  worldRest.push(1+rx*Math.sin(a),1.4-.1*r,2+rz*Math.cos(a));
 }
 for(let r=0;r<rows-1;r++)for(let j=0;j<segments;j++){
  const p=r*(segments+1)+j,q=p+segments+1;
  indices.push(...(inward?[p,p+1,q,p+1,q+1,q]:outwardSkirtQuadTriangles89(p,q)));
 }
 return {worldRest,indices,centerX:1,centerZ:2};
}
test('full genuine P89 proposal topology has 576 OUTWARD triangle normals, no 3D admission',()=>{
 const v=source(),before=v.worldRest.slice(),ib=v.indices.slice(),a=audit(v);
 assert.equal(a.outwardRestTriangleCount,576);
 assert.equal(a.expectedRestTriangleCount,576);
 assert.ok(a.minimumPositiveRadialNormalDot>0);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.originalPhoto2DFallbackRequired,true);
 assert.equal(a.originalPhotoRearUnobserved,true);
 assert.deepEqual(v.worldRest,before);assert.deepEqual(v.indices,ib);
});
test('existing source inward winding is positively identified and rejected',()=>{
 assert.throws(()=>audit(source({inward:true})),/winding-invalid/);
});
test('one reversed source face and an impossible radial center are rejected',()=>{
 const v=source();[v.indices[0],v.indices[1]]=[v.indices[1],v.indices[0]];
 assert.throws(()=>audit(v),/winding-invalid/);
 const shifted=source();shifted.centerX=20;
 assert.throws(()=>audit(shifted),/inward-or-degenerate/);
});
test('collapsed original skirt radius and malformed source indices cannot pass',()=>{
 assert.throws(()=>audit(source({collapsed:true})),/inward-or-degenerate/);
 const v=source();v.worldRest[30]=NaN;
 assert.throws(()=>audit(v),/nonfinite/);
 for(const change of [{indices:[0,1,2]},
  {worldRest:[]},{segments:49},{centerX:NaN},{centerZ:Infinity}])
  assert.throws(()=>audit({...source(),...change}),/bounded-source/);
});
test('triangle-index constructor rejects nonsensical source ring pointers',()=>{
 for(const args of [[-1,49],[0,1],[1.5,50],[0,Infinity]])
  assert.throws(()=>outwardSkirtQuadTriangles89(...args));
 assert.deepEqual(outwardSkirtQuadTriangles89(0,49),[0,49,1,1,49,50]);
});
