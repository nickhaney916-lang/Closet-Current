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


const withOriginalProof=x=>{
 x.restPositions=x.bodyPositions.slice();
 const n=x.bodyPositions.length/3;
 x.skinIndices=new Uint16Array(n*4);
 x.skinWeights=new Float32Array(n*4);
 x.sourceMeshIds=new Uint16Array(n);
 for(let v=0;v<n;v++)x.skinWeights[4*v]=1;
 return x;
};
const cause=x=>{
 const input=withOriginalProof(x),saved=Object.fromEntries(
  Object.entries(input).map(([k,v])=>[k,v.slice()]));
 const sh=audit(input),c=sh.originalSevenHeightBoundaryCauseAudit;
 for(const [k,v] of Object.entries(saved))assert.deepEqual(input[k],v);
 assert.equal(c.schema,'P89-original-sevenheight-source-boundary-causes/v1');
 assert.equal(c.originalSelectedIndexedOpenEdges,
  sh.sourceAllSevenHeightComponentBoundaryEdges);
 assert.equal(c.originalMaskExcludedSameIndexedEdge+
  c.originalDegenerateSelectedNeighborEdge+
  c.originalNoIndexedNeighborEdges,c.originalSelectedIndexedOpenEdges);
 assert.equal(c.exactRestPoseSkinMeshUVTwinCandidateEdges+
  c.ambiguousExactRestPoseSkinMeshCandidateEdges+
  c.noExactRestPoseSkinMeshTwinEdges,c.originalNoIndexedNeighborEdges);
 assert.equal(c.candidateUVTwinsAreNotSewnOrSignedBody,true);
 assert.equal(c.originalPhoto2DFallbackRequired,true);
 assert.equal(c.consumer3DAdmitted,false);
 assert.equal(c.releaseAuthorized,false);
 return c;
};
const wallVertices=[0,.2,0,1,1.8,0,0,1.8,1,1,.2,1];
const wallFaces=[0,1,2,0,2,3];
const repeatedWalls=(copies=2)=>make(
 Array.from({length:copies},()=>wallVertices).flat(),
 Array.from({length:copies},(_,i)=>wallFaces.map(x=>x+4*i)).flat());
test('original closed indexed face shell has zero all-seven boundary causes',()=>{
 const c=cause(make(vertices,boxFaces));
 assert.equal(c.originalSelectedIndexedOpenEdges,0);
});
test('mask-excluded original indexed source face is a source selection cut, not glTF repair',()=>{
 const x=make(vertices,boxFaces);x.selectedSourceFaceMask[0]=0;
 const c=cause(x);
 assert.ok(c.originalMaskExcludedSameIndexedEdge>=3);
 assert.equal(c.exactRestPoseSkinMeshUVTwinCandidateEdges,0);
});
test('truly missing original face has no original indexed neighbor',()=>{
 const c=cause(make(vertices,boxFaces.slice(3)));
 assert.ok(c.originalNoIndexedNeighborEdges>=3);
 assert.equal(c.originalMaskExcludedSameIndexedEdge,0);
});
test('split original rest+pose+skin+mesh twins are potential UV only and do not seal an open wall',()=>{
 const c=cause(repeatedWalls());
 assert.equal(c.originalNoIndexedNeighborEdges,8);
 assert.equal(c.exactRestPoseSkinMeshUVTwinCandidateEdges,8);
 assert.equal(c.originalSelectedIndexedOpenEdges,8);
});
test('three coincident source sheets are ambiguous multi-candidates never automatically joined',()=>{
 const c=cause(repeatedWalls(3));
 assert.equal(c.ambiguousExactRestPoseSkinMeshCandidateEdges,12);
 assert.equal(c.exactRestPoseSkinMeshUVTwinCandidateEdges,0);
});
test('same posed sheets with different original rest points cannot claim a UV split',()=>{
 const x=withOriginalProof(repeatedWalls());
 for(let i=4;i<8;i++)x.restPositions[3*i]+=.05;
 const c=audit(x).originalSevenHeightBoundaryCauseAudit;
 assert.equal(c.exactRestPoseSkinMeshUVTwinCandidateEdges,0);
 assert.equal(c.noExactRestPoseSkinMeshTwinEdges,8);
});
test('same rest sheet but different original bone weights cannot claim a UV split',()=>{
 const x=withOriginalProof(repeatedWalls());
 for(let i=4;i<8;i++){x.skinWeights[4*i]=.75;x.skinWeights[4*i+1]=.25;x.skinIndices[4*i+1]=1;}
 const c=audit(x).originalSevenHeightBoundaryCauseAudit;
 assert.equal(c.exactRestPoseSkinMeshUVTwinCandidateEdges,0);
});
test('coincident different original source mesh is never an attested seam',()=>{
 const x=withOriginalProof(repeatedWalls());
 x.sourceMeshIds.fill(2,4);
 const c=audit(x).originalSevenHeightBoundaryCauseAudit;
 assert.equal(c.exactRestPoseSkinMeshUVTwinCandidateEdges,0);
});
test('missing or malformed original skin/rest/mesh proof fails closed, not as a known source edge',()=>{
 const x=withOriginalProof(repeatedWalls());
 for(const bad of [
  {...x,restPositions:new Float32Array(3)},
  {...x,sourceMeshIds:new Uint16Array(1)},
  {...x,skinWeights:new Float32Array(2)},
  {...x,restPositions:Float32Array.from(x.restPositions,(v,i)=>i===1?NaN:v)},
  {...x,skinWeights:Float32Array.from(x.skinWeights,(v,i)=>i===0?2:v)}
 ])assert.throws(()=>audit(bad));
});


const namedProof=x=>{
 const v=withOriginalProof(x);
 v.sourceMeshNames=['originalCore'];
 v.sourceBoneNamesByMesh=[Array.from({length:163},(_,i)=>
  i===0?'pelvis':i===1?'upperleg_L':'sourceBone'+i)];
 v.originalFaceExclusionReasons=Array.from(v.selectedSourceFaceMask,(flag)=>
  flag?'SELECTED_ORIGINAL_SOURCE_FACE':
   'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK');
 return v;
};
const namedCheck=x=>{
 const saved=Object.fromEntries(Object.entries(x)
  .filter(([,v])=>ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const p=audit(x);
 const c=p.originalSevenHeightBoundaryCauseAudit;
 const r=c.originalUnmatchedAndMaskedEdgeRegions;
 assert.equal(r.schema,'P89-original-unmatched-masked-edge-region-proof/v1');
 assert.equal(r.allSevenHeightActualUnpairedIndexedEdges,
  c.noExactRestPoseSkinMeshTwinEdges);
 assert.equal(r.allSevenHeightMaskedOriginalNeighbourEdges,
  c.originalMaskExcludedSameIndexedEdge);
 assert.equal(r.anonymousUnpairedEdgeRegions.length,r.allSevenHeightActualUnpairedIndexedEdges);
 assert.equal(r.groupedOriginalExcludedFaceRegions.reduce((n,g)=>n+g.count,0),
  r.allSevenHeightMaskedOriginalNeighbourEdges);
 assert.equal(r.noUVSeamWelding,true);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.noSourceFaceVertexIndicesOrCoordinatesReleased,true);
 assert.equal(JSON.stringify(r).includes('bodyPositions'),false);
 assert.equal(JSON.stringify(r).includes('sourceFaceId'),false);
 for(const [k,v] of Object.entries(saved))assert.deepEqual(x[k],v);
 return r;
};
test('source original closed box has zero unmatched and excluded open edges with bone metadata',()=>{
 const r=namedCheck(namedProof(make(vertices,boxFaces)));
 assert.equal(r.allSevenHeightActualUnpairedIndexedEdges,0);
 assert.equal(r.allSevenHeightMaskedOriginalNeighbourEdges,0);
});
test('unmatched genuine open wall edges locate source mesh and dominant original pelvis bone',()=>{
 const r=namedCheck(namedProof(make(wallVertices,wallFaces)));
 assert.equal(r.allSevenHeightActualUnpairedIndexedEdges,4);
 assert.equal(r.allSevenHeightMaskedOriginalNeighbourEdges,0);
 for(const edge of r.anonymousUnpairedEdgeRegions){
  assert.equal(edge.originalSourceMesh,'originalCore');
  assert.deepEqual(edge.originalDominantSourceBoneNames,['pelvis']);
  assert.deepEqual(edge.originalDominantBoneRegions,['SOURCE_TORSO_HIP']);
  assert.match(edge.midpointSkirtPhotoHeightBand,/PHOTO_HEIGHT_BAND/);
 }
});
test('authentic indexed excluded source face is grouped by actual original face reason not declared a UV stitch',()=>{
 const x=namedProof(make(vertices,boxFaces));
 x.selectedSourceFaceMask[0]=0;
 x.originalFaceExclusionReasons[0]='ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_ANATOMY';
 const r=namedCheck(x);
 assert.equal(r.allSevenHeightMaskedOriginalNeighbourEdges,3);
 assert.ok(r.groupedOriginalExcludedFaceRegions.every(g=>
  g.originalExcludedReason==='ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_ANATOMY'&&
  g.originalExcludedNeighbourMeshes==='originalCore'&&g.count>=1));
});
test('original selection mask reason remains independently visible, not silently reclassified as anatomy',()=>{
 const x=namedProof(make(vertices,boxFaces));
 x.selectedSourceFaceMask[0]=0;
 x.originalFaceExclusionReasons[0]='ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK';
 const r=namedCheck(x);
 assert.equal(r.allSevenHeightMaskedOriginalNeighbourEdges,3);
 assert.equal(r.groupedOriginalExcludedFaceRegions.reduce((n,g)=>n+g.count,0),3);
 assert.ok(r.groupedOriginalExcludedFaceRegions.every(g=>
  g.originalExcludedReason==='ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK'));
});
test('original skin mismatch resolves coincident walls as unpaired edges in distinct source bone regions',()=>{
 const x=namedProof(repeatedWalls());
 for(let i=4;i<8;i++){
  x.skinIndices[4*i]=1;
  x.skinWeights[4*i]=1;
 }
 const r=namedCheck(x);
 assert.equal(r.allSevenHeightActualUnpairedIndexedEdges,8);
 const names=new Set(r.anonymousUnpairedEdgeRegions.map(e=>
  e.originalDominantSourceBoneNames.join(',')));
 assert.ok(names.has('pelvis'));assert.ok(names.has('upperleg_L'));
});
test('original different-mesh same-world duplicate walls never become one physical anatomical surface',()=>{
 const x=namedProof(repeatedWalls());
 x.sourceMeshNames=['originalCore','secondOriginalMesh'];
 x.sourceBoneNamesByMesh.push(x.sourceBoneNamesByMesh[0].slice());
 x.sourceMeshIds.fill(1,4);
 const r=namedCheck(x);
 assert.equal(r.allSevenHeightActualUnpairedIndexedEdges,8);
 assert.deepEqual(new Set(r.anonymousUnpairedEdgeRegions.map(z=>z.originalSourceMesh)),
  new Set(['originalCore','secondOriginalMesh']));
});
test('exact original UV twins are not emitted as unmatched repair candidates',()=>{
 const r=namedCheck(namedProof(repeatedWalls()));
 assert.equal(r.allSevenHeightActualUnpairedIndexedEdges,0);
 assert.equal(r.allSevenHeightMaskedOriginalNeighbourEdges,0);
});
test('source face exclusion labels must match original selection mask, no forged anatomical attribution',()=>{
 const x=namedProof(make(vertices,boxFaces));
 x.originalFaceExclusionReasons[0]='ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_ANATOMY';
 assert.throws(()=>audit(x),/region-proof-names-and-source-selection/);
});
test('invalid source mesh name or absent 163bone names refuses region annotation',()=>{
 const x=namedProof(make(wallVertices,wallFaces));
 for(const bad of [
  {...x,sourceMeshNames:['']},
  {...x,sourceMeshNames:['bad\u0000name']},
  {...x,sourceBoneNamesByMesh:[]},
  {...x,sourceBoneNamesByMesh:[['pelvis']]},
  {...x,originalFaceExclusionReasons:[]},
  {...x,sourceMeshIds:new Uint16Array(4).fill(99)}
 ])assert.throws(()=>audit(bad));
});
