/** Pure synthetic adversarial P89 topology tests. Browser CI separately
 * executes identical checks on the original SHA-attested Commons-0043 PNG
 * and the authentic male/female CC0 skinned 163-bone P541 GLBs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveTwoDetachedPanelHypothesis89 as derive}
 from '../research/parallel89/skirt-provisional-open-panel89.mjs';
const SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
function source(){
 const positions=new Float32Array(343*3),restPositions=new Float32Array(343*3),
  uv=new Float32Array(343*2),skinIndices=new Uint16Array(343*4),
  skinWeights=new Float32Array(343*4),indices=new Uint16Array(576*3);
 let i=0;
 for(let r=0;r<7;r++)for(let c=0;c<49;c++){
  const id=r*49+c,angle=2*Math.PI*c/48,rad=.22+r*.02;
  positions[id*3]=rad*Math.sin(angle);
  positions[id*3+1]=1.42-r*.1;
  positions[id*3+2]=rad*Math.cos(angle);
  restPositions.set(positions.slice(id*3,id*3+3),id*3);
  uv[id*2]=c/48;uv[id*2+1]=r/6;
  skinIndices[id*4]=34;skinWeights[id*4]=1;
 }
 for(let r=0;r<6;r++)for(let c=0;c<48;c++){
  const a=r*49+c,b=a+49;
  indices.set([a,a+1,b,a+1,b+1,b],i);i+=6;
 }
 return {positions,restPositions,uv,skinIndices,skinWeights,indices};
}
const run=(over={})=>derive({
 sourceId:'commons-0043',originalPhotoSHA256:SHA,
 originalSourceAttested:true,avatar:'female',pose:'source',
 rigBoneCount:163,...source(),...over
});
test('two disjoint independently indexed hypothetical cloth panels, open not sewn',()=>{
 const r=run(),m=r.metrics;
 assert.equal(r.status,'TWO_DISCONNECTED_PROVISIONAL_PANELS_NO_SOURCE_CLOSURE_PROOF');
 assert.equal(m.separateHypotheticalPanelCount,2);
 assert.deepEqual(m.separatePanelVertexCounts,[189,182]);
 assert.deepEqual(m.separatePanelTriangleCounts,[312,300]);
 assert.equal(m.sourceOriginalShellTriangles,576);
 assert.equal(m.resultingResearchTriangleCount,612);
 assert.equal(m.arbitraryDuplicatedAngularSectors,3);
 assert.equal(m.detachedOpenVerticalPanelEdges,4);
 assert.equal(m.overlapWidthMeasuredOnRealGarment,false);
 assert.equal(m.physicalClothClosureMade,false);
 assert.equal(m.consumer3DAdmitted,false);
 assert.equal(m.originalPhoto2DFallbackRequired,true);
 assert.equal(r.panels.length,2);
 assert.notEqual(r.panels[0].positions,r.panels[1].positions);
 assert.notEqual(r.panels[0].indices,r.panels[1].indices);
});
test('source positions, rest, UV, 163bone indices/weights are copied exactly and not edited',()=>{
 const input=source(),before=Object.fromEntries(Object.entries(input).map(([k,v])=>[k,v.slice()]));
 const r=run(input);
 assert.equal(r.metrics.sourceRestUVAnd163BoneWeightsCopiedUnchanged,true);
 assert.equal(r.metrics.sourceOriginalArraysUnmodified,true);
 for(const [key,arr] of Object.entries(input))assert.deepEqual(arr,before[key],key);
 for(const panel of r.panels)
  for(let i=0;i<panel.sourceVertexIds.length;i++){
   const id=panel.sourceVertexIds[i];
   for(const [key,step] of [['positions',3],['restPositions',3],['uv',2],
    ['skinIndices',4],['skinWeights',4]])
    for(let k=0;k<step;k++)
     assert.equal(panel[key][step*i+k],input[key][step*id+k],
      'original indexed source not preserved: '+key);
  }
});
test('each original angular sector covered once or twice, no invented topology bridge',()=>{
 const r=run();
 const coverage=new Uint8Array(48);
 for(const panel of r.panels){
  const ids=panel.sourceVertexIds,cols=ids.length/7,nseg=cols-1;
  for(let c=0;c<nseg;c++)coverage[ids[c]]++;
  for(let row=0;row<6;row++)for(let c=0;c<nseg;c++){
   const a=row*cols+c,b=a+cols,k=(row*nseg+c)*6;
   assert.deepEqual(Array.from(panel.indices.slice(k,k+6)),[a,a+1,b,a+1,b+1,b]);
  }
 }
 assert.equal(coverage.filter(v=>v===1).length,45);
 assert.equal(coverage.filter(v=>v===2).length,3);
 assert.equal(coverage.filter(v=>v===0).length,0);
});
test('all five authentic research pose identifiers and both rig labels stay research only',()=>{
 for(const avatar of ['male','female'])
  for(const pose of ['source','blend-25','blend-50','blend-75','relaxed']){
   const r=run({avatar,pose});
   assert.equal(r.metrics.avatar,avatar);
   assert.equal(r.metrics.pose,pose);
   assert.equal(r.metrics.familyAlpha,'HOLD');
   assert.equal(r.metrics.humanAppearanceReviewed,false);
  }
});
test('identity and real-source context required: fabricated receipt, model, photo or pose blocked',()=>{
 for(const bad of [
  {sourceId:'commons-0053'},{originalPhotoSHA256:'f'.repeat(64)},
  {originalSourceAttested:false},{originalSourceAttested:'true'},
  {avatar:'unknown'},{pose:'invented'},{rigBoneCount:162},
  {rigBoneCount:undefined}
 ]){
  const r=run(bad);
  assert.equal(r.status,'ORIGINAL_WRAP_PANEL_HYPOTHESIS_REFUSED');
  assert.equal(r.consumer3DAdmitted,false);
 }
});
test('corrupt, rewired or unnormalized real-index grids cannot be repackaged',()=>{
 const fixture=source();
 const cases=[];
 {const v=source();v.indices[2]=222;cases.push(v);}
 {const v=source();v.uv[0]=NaN;cases.push(v);}
 {const v=source();v.skinIndices[0]=163;cases.push(v);}
 {const v=source();v.skinWeights[0]=.4;cases.push(v);}
 {const v=source();v.positions[0]=NaN;cases.push(v);}
 {const v=source();v.positions[3*48]+=.08;cases.push(v);}
 {const v=source();v.uv[1]=1.2;cases.push(v);}
 {const v=source();v.restPositions=new Float32Array(77);cases.push(v);}
 {const v=source();v.indices=new Uint32Array(2);cases.push(v);}
 {const v=source();v.skinWeights=new Uint8Array(343*4);cases.push(v);}
 for(const attrs of cases){
  const r=run(attrs);
  assert.equal(r.status,'ORIGINAL_WRAP_PANEL_HYPOTHESIS_REFUSED');
  assert.equal(r.originalPhoto2DFallbackRequired,true);
 }
 assert.equal(fixture.indices.length,1728);
});
test('external seam claims, reviewer badges and historical pattern guesses cannot authorize 3D',()=>{
 const r=run({actualSpecimenPanelCount:2,actualSeamObserved:true,
   realSourceBackside:true,photoVerifiedFromOriginalPublicJpegOnly:false,
   overlapMeasured:true,physicalFitAccepted:true,customerWoreGarment:true,
   tieAttachmentApproved:true,ownerApproved:true,consumer3DAdmitted:true});
 assert.equal(r.metrics.originalHistoricalPanelCountVerified,false);
 assert.equal(r.metrics.exactSpecimenPleatsAndFastenersVerified,false);
 assert.equal(r.metrics.photoMeasuredPanelBoundaries,false);
 assert.equal(r.metrics.sourceBacksideObserved,false);
 assert.equal(r.metrics.bodyGarmentSignedClearanceVerified,false);
 assert.equal(r.metrics.consumer3DAdmitted,false);
 assert.equal(r.metrics.releaseAuthorized,false);
});
test('derived buffer mutations never change real original shell',()=>{
 const input=source(),snapshot=input.positions.slice();
 const output=run(input);
 output.panels[0].positions.fill(999);
 output.panels[0].uv.fill(.2);
 output.panels[0].indices.fill(0);
 assert.deepEqual(input.positions,snapshot);
 assert.equal(input.uv[0],0);
 assert.notEqual(input.indices[0],999);
});
