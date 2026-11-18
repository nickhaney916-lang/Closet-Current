import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOriginalSevenHeightIndexedShellEligibility89 as audit}
 from '../research/parallel89/skirt-original-seven-height-shell-eligibility89.mjs';
const skirt=(down=false)=>{
 const s=new Float32Array(1029);
 for(let r=0;r<7;r++)for(let j=0;j<49;j++){
  const k=3*(r*49+j),t=j*Math.PI/24;
  s[k]=Math.cos(t)*.5;s[k+1]=down?1.32-.12*r:.6+.12*r;
  s[k+2]=Math.sin(t)*.5;
 }
 return s;
};
const make=(p,indices,down=false)=>({
 bodyPositions:Float32Array.from(p),
 bodyIndices:Uint16Array.from(indices),
 selectedSourceFaceMask:new Uint8Array(indices.length/3).fill(1),
 skirtPositions:skirt(down)
});
const vertices=[
 -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
 -.2,.2,.2, .2,.2,.2, .2,1.8,.2, -.2,1.8,.2
];
const boxFaces=[
 0,2,1,0,3,2,4,5,6,4,6,7,
 0,1,5,0,5,4,3,7,6,3,6,2,
 0,4,7,0,7,3,1,2,6,1,6,5
];
const check=(x)=>{
 const saved=Object.fromEntries(Object.entries(x).map(([k,v])=>[k,v.slice()]));
 const proof=audit(x);
 for(const [k,v] of Object.entries(saved))assert.deepEqual(x[k],v);
 assert.equal(proof.schema,
  'P89-original-163bone-sevenheight-component-shell-eligibility/v1');
 assert.equal(proof.originalSkirtSampleHeightPlanes,7);
 assert.equal(proof.selectedOriginalSourceTriangleCount,
  proof.selectedSourceDegenerateTriangles+
  proof.selectedSourceNondegenerateTriangles);
 assert.equal(proof.sourceOriginalIndexedUniqueEdges,
  proof.sourceExactlyTwoIncidentFaceEdges+
  proof.sourceSingleIncidentFaceBoundaryEdges+
  proof.sourceNonmanifoldIndexedEdges);
 assert.equal(proof.sourceFaceComponentCountAtEachHeight.length,7);
 assert.equal(proof.summariesBoundedAt32SourceComponents,true);
 assert.equal(proof.originalSourceUVSeamTwinsNotWelded,true);
 assert.equal(proof.signedOriginalHumanVolumeNotCertified,true);
 assert.equal(proof.originalPhotoGarmentPhysicalDimensionsNotMeasured,true);
 assert.equal(proof.fitted3DClothContactAndHistoricalRearNotVerified,true);
 assert.equal(proof.originalPhoto2DFallbackRequired,true);
 assert.equal(proof.consumer3DAdmitted,false);
 assert.equal(proof.releaseAuthorized,false);
 assert.ok(proof.allSevenClosedOrientedIndexedShellCandidates<=
  proof.sourceComponentsIntersectingEveryOriginalSkirtHeight);
 assert.equal(proof.sourceComponentsIntersectingEveryOriginalSkirtHeight,
  proof.allSevenIndexedSourceComponentSummaries.length);
 for(const r of proof.allSevenIndexedSourceComponentSummaries)
  assert.equal(r.closedSourceFaceShellEligibleOnly,
   r.originalIndexedBoundaryEdges===0&&
   r.originalIndexedNonmanifoldEdges===0&&
   r.originalIndexedSameDirectionSharedEdges===0);
 return proof;
};
test('original closed indexed cube is only an indexed-shell CANDIDATE, not signed original human body',()=>{
 const r=check(make(vertices,boxFaces));
 assert.equal(r.selectedOriginalSourceTriangleCount,12);
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,1);
 assert.equal(r.sourceAllSevenHeightComponentBoundaryEdges,0);
 assert.equal(r.sourceAllSevenHeightComponentNonmanifoldEdges,0);
 assert.equal(r.sourceAllSevenHeightComponentWindingConflicts,0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,1);
 assert.equal(r.signedOriginalHumanVolumeNotCertified,true);
});
test('reverse original photographed sample-height direction preserves original indexed closed shell candidate',()=>{
 const r=check(make(vertices,boxFaces,true));
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,1);
});
test('remove a source body triangle: actual open boundary prevents all-seven shell candidate',()=>{
 const r=check(make(vertices,boxFaces.slice(3)));
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,1);
 assert.ok(r.sourceAllSevenHeightComponentBoundaryEdges>0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('exclude one genuinely original source body triangle: no masked face is fabricated as closing patch',()=>{
 const x=make(vertices,boxFaces);
 x.selectedSourceFaceMask[0]=0;
 const r=check(x);
 assert.equal(r.selectedOriginalSourceTriangleCount,11);
 assert.ok(r.sourceSingleIncidentFaceBoundaryEdges>0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('same world geometry with disjoint original UV index twins remains two indexed shells, not welded',()=>{
 const n=vertices.length/3;
 const r=check(make([...vertices,...vertices],
  [...boxFaces,...boxFaces.map(i=>i+n)]));
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,2);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,2);
 assert.equal(r.originalSourceUVSeamTwinsNotWelded,true);
 assert.equal(r.signedOriginalHumanVolumeNotCertified,true);
});
test('original open two-triangle sheet spanning all seven heights does not become a certified body surface',()=>{
 const r=check(make([
  0,.2,0,1,1.8,0,0,1.8,1,1,.2,1
 ],[0,1,2,0,2,3]));
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,1);
 assert.ok(r.sourceAllSevenHeightComponentBoundaryEdges>0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('reverse one original source face winding; count exact same-direction indexed shared edges',()=>{
 const wrong=boxFaces.slice();[wrong[1],wrong[2]]=[wrong[2],wrong[1]];
 const r=check(make(vertices,wrong));
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,1);
 assert.ok(r.sourceAllSevenHeightComponentWindingConflicts>0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('one source vertex index in common is not an original shared indexed edge or connected shell',()=>{
 const r=check(make([
  0,.2,0,1,1.8,0,0,1.8,1,-1,1.8,0,0,1.8,-1
 ],[0,1,2,0,3,4]));
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,2);
 assert.equal(r.sourceExactlyTwoIncidentFaceEdges,0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('three original triangles on same indexed edge are nonmanifold and cannot silently join original source shells',()=>{
 const r=check(make([
  0,.2,0,1,1.8,0,0,1.8,1,0,1.8,-1,1,1.8,1
 ],[0,1,2,1,0,3,0,1,4]));
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,3);
 assert.equal(r.sourceNonmanifoldIndexedEdges,1);
 assert.ok(r.sourceAllSevenHeightComponentNonmanifoldEdges>0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('no selected source faces never yield original 3D garment/body closure',()=>{
 const x=make(vertices,boxFaces);
 x.selectedSourceFaceMask.fill(0);
 const r=check(x);
 assert.equal(r.originalIndexedFaceSurfaceComponents,0);
 assert.equal(r.sourceComponentsIntersectingEveryOriginalSkirtHeight,0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('geometrically zero-area source body triangle is counted as excluded, never as a volume shell',()=>{
 const r=check(make([
  0,.2,0,0,.8,0,0,1.8,0,2,2,2
 ],[0,1,2]));
 assert.equal(r.selectedSourceDegenerateTriangles,1);
 assert.equal(r.selectedSourceNondegenerateTriangles,0);
 assert.equal(r.allSevenClosedOrientedIndexedShellCandidates,0);
});
test('original source arrays, face indices, sample-height ordering and selected mask are validated fail closed',()=>{
 const badSkirt=skirt();for(let j=0;j<49;j++)
  badSkirt[3*(2*49+j)+1]=.72;
 for(const x of [
  undefined,{},null,
  {...make(vertices,boxFaces),bodyIndices:Uint16Array.from([0,1,999])},
  {...make(vertices,boxFaces),bodyPositions:Float32Array.from(vertices,(v,i)=>i===0?NaN:v)},
  {...make(vertices,boxFaces),skirtPositions:new Float32Array(1029)},
  {...make(vertices,boxFaces),skirtPositions:badSkirt},
  {...make(vertices,boxFaces),selectedSourceFaceMask:new Uint8Array(1)},
  {...make(vertices,boxFaces),selectedSourceFaceMask:new Uint8Array(12).fill(2)},
  {...make(vertices,boxFaces),bodyIndices:new Float32Array(boxFaces)},
  {...make(vertices,boxFaces),bodyIndices:Uint16Array.from([0,0,2])}
 ])assert.throws(()=>audit(x));
});
