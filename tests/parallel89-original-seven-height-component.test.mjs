import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOriginalIndexedSevenHeightComponents89 as audit}
 from '../research/parallel89/skirt-original-seven-height-component89.mjs';
const skirt=(reverse=false)=>{
 const p=new Float32Array(343*3);
 for(let row=0;row<7;row++)for(let j=0;j<49;j++){
  const k=3*(row*49+j),t=j*Math.PI/24;
  p[k]=Math.cos(t)*.5;
  p[k+1]=reverse?1.32-.12*row:.6+.12*row;
  p[k+2]=Math.sin(t)*.5;
 }
 return p;
};
const input=(points,indices,reverse=false)=>({
 bodyPositions:Float32Array.from(points),
 bodyIndices:Uint16Array.from(indices),
 selectedSourceFaceMask:new Uint8Array(indices.length/3).fill(1),
 skirtPositions:skirt(reverse)
});
const box=input([
 -.2,.2,-.2,.2,.2,-.2,.2,1.8,-.2,-.2,1.8,-.2,
 -.2,.2,.2,.2,.2,.2,.2,1.8,.2,-.2,1.8,.2
 ],[0,2,1,0,3,2,4,5,6,4,6,7,
 0,1,5,0,5,4,3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5]);
function verified(x){
 const copy=Object.fromEntries(Object.entries(x).map(([k,v])=>[k,v.slice()]));
 const receipt=audit(x);
 for(const [k,v] of Object.entries(copy))assert.deepEqual(x[k],v);
 assert.equal(receipt.schema,'P89-original-163bone-seven-photographed-height-source-component/v1');
 assert.equal(receipt.originalPhotographedSkirtHeightCount,7);
 assert.equal(receipt.originalPhotographedSkirtSlabCount,6);
 assert.equal(receipt.originalSixClippedSourceSlabs.length,6);
 assert.equal(receipt.oneBodyExteriorProven,false);
 assert.equal(receipt.sourceShellSignedAndWatertight,false);
 assert.equal(receipt.originalPhysicalGarmentFitProven,false);
 assert.equal(receipt.sourceOriginalUVSeamNeverWelded,true);
 assert.equal(receipt.onlyOriginalIndexedOpenSlabAndOriginalInterfaceEdgesJoined,true);
 assert.equal(receipt.originalPhoto2DFallbackRequired,true);
 assert.equal(receipt.consumer3DAdmitted,false);
 assert.equal(receipt.releaseAuthorized,false);
 assert.equal(receipt.trueSourceConnectedComponentsAcrossSixSlabs,
  receipt.sourceComponentsCrossingAllSevenHeightPlanes+
  receipt.sourceComponentsCoveringFewerThanSevenHeightPlanes+
  receipt.sourceComponentsTouchingNoMeasuredHeightPlane);
 assert.equal(receipt.originalSourceSlabFaceOccurrences,
  receipt.originalSixClippedSourceSlabs.reduce((n,r)=>n+r.originalActiveSourceTriangles,0));
 for(const band of receipt.originalSixClippedSourceSlabs){
  assert.equal(band.pointOnlyCutDoesNotCountAsSourceSegment,true);
  assert.ok(band.trueSourceIndexedComponentsReachingBothPlanes<=
   band.originalIndexedLocalSurfaceComponents);
 }
 return receipt;
}
test('actual shared-original-index cube body has one seven-height spanning source component, still not certified closed human exterior',()=>{
 const r=verified(box);
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,1);
 assert.deepEqual(r.trueOriginalSourceComponentCountPerHeight,[1,1,1,1,1,1,1]);
 assert.ok(r.authenticOriginalSameFaceCrossPlaneLinks>0);
});
test('reversed skirt height ordering preserves one globally connected source component',()=>{
 const r=verified({...box,skirtPositions:skirt(true)});
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,1);
});
test('two disconnected original 3D panels each cover all seven planes but do not prove one continuous body exterior',()=>{
 const p=Array.from(box.bodyPositions),i=Array.from(box.bodyIndices);
 const count=p.length/3;
 const two=input([...p,...p.map((v,k)=>k%3===0?v+3:v)],
  [...i,...i.map(v=>v+count)]);
 const r=verified(two);
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,2);
 assert.deepEqual(r.trueOriginalSourceComponentCountPerHeight,[2,2,2,2,2,2,2]);
 assert.equal(r.oneBodyExteriorProven,false);
});
test('six independent original source sheets bridge every pair of heights but NONE spans all seven original height planes',()=>{
 const sp=skirt(),coords=[],idx=[];
 for(let band=0;band<6;band++){
  const lo=sp[3*(49*band)+1],hi=sp[3*(49*(band+1))+1],k=coords.length/3;
  coords.push(-1,lo-.009,0, 1,hi+.009,0, 0,hi+.009,1);
  idx.push(k,k+1,k+2);
 }
 const r=verified(input(coords,idx));
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,0);
 assert.ok(r.originalSixClippedSourceSlabs.every(v=>v.trueSourceIndexedComponentsReachingBothPlanes>=1));
 assert.deepEqual(r.trueOriginalSourceComponentCountPerHeight.map(v=>v>0),
  [true,true,true,true,true,true,true]);
});
test('same-world-coordinates duplicated original UV index mesh is NOT welded across seven planes',()=>{
 const points=[0,.2,0,1,1.8,0,0,1.8,1,
  0,.2,0,1,1.8,0,0,1.8,1];
 const r=verified(input(points,[0,1,2,3,4,5]));
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,2);
 assert.equal(r.originalIndexedOpenSlabEdgeLinks,0);
});
test('two faces with a genuine horizontal original indexed edge at a skirt ring PLANE join across original bands',()=>{
 const plane=skirt()[3*(3*49)+1];
 const r=verified(input([
  -1,.2,0, 0,plane,0, 1,plane,0, 0,1.8,1
 ],[0,1,2,1,2,3]));
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,1);
 assert.ok(r.originalIndexedHorizontalPlaneEdgeLinks>0);
 assert.ok(r.authenticOriginalSameFaceCrossPlaneLinks>0);
});
test('two original triangles meeting ONLY at a single exact vertex on original ring plane are disconnected',()=>{
 const plane=skirt()[3*(3*49)+1];
 const r=verified(input([
  0,plane,0, 1,.2,0, 0,.2,1,
  -1,1.8,0, 0,1.8,1
 ],[0,1,2,0,3,4]));
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,0);
 assert.equal(r.originalIndexedHorizontalPlaneEdgeLinks,0);
});
test('zero source-face selection is not body-continuity evidence',()=>{
 const x={...box,selectedSourceFaceMask:new Uint8Array(box.bodyIndices.length/3)};
 const r=verified(x);
 assert.equal(r.selectedOriginalIndexedFaceCount,0);
 assert.equal(r.trueSourceConnectedComponentsAcrossSixSlabs,0);
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,0);
});
test('nonmanifold exact original index edge is not authorizing cross-face continuity',()=>{
 const r=verified(input([
  0,.2,0,1,1.8,0,0,1.8,1,0,1.8,-1,1,1.8,1
 ],[0,1,2,1,0,3,0,1,4]));
 assert.ok(r.originalNonmanifoldWithinSlabEdges>0);
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,3);
});
test('original zero-area/collinear 3D source face is excluded from connectivity, not physical garment proof',()=>{
 const r=verified(input([0,.2,0,0,.9,0,0,1.8,0],[0,1,2]));
 assert.equal(r.originalSelectedGeometricDegenerateFaceCount,1);
 assert.equal(r.sourceComponentsCrossingAllSevenHeightPlanes,0);
});
test('invalid/malformed/nonfinite original source bodies and rings are rejected, never claim source shell',()=>{
 const s=skirt();for(let j=0;j<49;j++)s[3*(2*49+j)+1]=.72;
 const mutated=[{...box,skirtPositions:s},
  {...box,bodyIndices:Uint16Array.from(box.bodyIndices,(v,i)=>i===0?999:v)},
  {...box,bodyPositions:Float32Array.from(box.bodyPositions,(v,i)=>i===0?Infinity:v)},
  {...box,skirtPositions:new Float32Array(1029)},
  {...box,selectedSourceFaceMask:new Uint8Array(1)},
  {...box,selectedSourceFaceMask:new Uint8Array(box.bodyIndices.length/3).fill(2)},
  {...box,bodyIndices:Uint16Array.from([0,0,1])},
  {...box,bodyIndices:new Float32Array(box.bodyIndices)}];
 for(const x of mutated)assert.throws(()=>audit(x));
});
