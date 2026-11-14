import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDisposableClothAlternatives85} from
 '../research/mission2-source-length/alternative-photo-clearance85.mjs';
import {createDisposableUpperTorsoWorldTrial60} from
 '../research/mission2-source-length/upper-torso-clearance-trial60.mjs';
import {measureDisposableSourceSurfaceStrain61} from
 '../research/mission2-source-length/upper-torso-surface-quality61.mjs';
const params={neck:[0,.13,0],spine:[0,0,0]};
// Two adjacent genuine-shaped test triangles with nonindexed vertex dupes.
// Geometry below is an adversarial unit fixture, NOT the original photograph.
const tri=new Float32Array([
 .14,.035,0,.18,.052,.003,.15,.085,.014,
 .18,.052,.003,.19,.08,.015,.15,.085,.014
]);
test('P85: alternative solvers return four truly isolated world buffers, preserve original world and bounds',()=>{
 const before=tri.slice();
 const candidates=createDisposableClothAlternatives85(tri,null,params);
 assert.equal(candidates.length,4);
 assert.deepEqual(candidates.map(x=>x.method),[
  'quintic-height-envelope','quintic-height-envelope',
  'welded-edge-strain-projection','welded-edge-strain-projection']);
 assert.deepEqual(candidates.map(x=>x.limitMeters),[.0045,.006,.0045,.006]);
 assert.deepEqual(tri,before);
 for(const p of candidates){
  assert.notEqual(p.world,tri);
  assert.ok(p.movedVertices>0);
  assert.ok(p.maxAppliedMeters>0&&p.maxAppliedMeters<=p.limitMeters+.000002);
  assert.equal(p.originalPhotoWorldAndRestNeverModified,true);
  assert.equal(p.sourceUVTextureSkinAndBonesNeverModified,true);
  assert.equal(p.candidateNotInstalledInRenderer,true);
  assert.equal(p.releaseAuthorized,false);
  assert.equal(p.familyAlpha,'HOLD');
  const quality=measureDisposableSourceSurfaceStrain61(tri,p.world);
  assert.equal(quality.signedOriginalSourceFacesAnalyzed,2);
  assert.ok(Number.isFinite(quality.maxOriginalPhotoWorldEdgeRelativeStrain));
 }
});
test('P85: edge-projection welds shared source positions without cracking coincident source vertices',()=>{
 const all=createDisposableClothAlternatives85(tri,null,params);
 for(const p of all.filter(x=>x.method==='welded-edge-strain-projection')){
  const a=[p.world[3],p.world[4],p.world[5]];
  const b=[p.world[9],p.world[10],p.world[11]];
  assert.deepEqual(a,b,'shared photographed vertex must remain coincident');
  assert.ok(p.maxCoincidentSeamDeltaMeters<.000002);
  assert.ok(p.sourcePositionGroupCount<=tri.length/3);
  assert.ok(p.projectionIterations>=1);
 }
});
test('P85: identical source inputs have reproducible candidates, not randomized untracked fitting',()=>{
 const a=createDisposableClothAlternatives85(tri,null,params);
 const b=createDisposableClothAlternatives85(tri,null,params);
 for(let i=0;i<4;i++){
  assert.deepEqual(a[i].world,b[i].world);
  assert.equal(a[i].movedVertices,b[i].movedVertices);
 }
});
test('P85: original 6mm control remains a separate non-applied candidate',()=>{
 const control=createDisposableUpperTorsoWorldTrial60(tri,{
  ...params,outwardMeters:.006});
 const independent=createDisposableClothAlternatives85(tri,null,params);
 assert.ok(control.movedVertices>0);
 assert.ok(independent.some(c=>!c.world.every((v,i)=>v===control.world[i])));
 assert.equal(control.originalPhotographedSourceMeshChanged,false);
 assert.equal(control.releaseAuthorized,false);
});
test('P85: invalid original photo buffers, indices and source bone anchors fail closed',()=>{
 for(const [world,index,arg] of [
  [[],null,params],
  [new Float32Array(8),null,params],
  [tri,new Uint16Array([0,1,50]),params],
  [tri,new Uint32Array([0,1,2,0]),params],
  [tri,[0,1,2],params],
  [tri,null,{neck:[0,0,0],spine:[0,0,0]}],
  [tri,null,{neck:[0,NaN,0],spine:[0,0,0]}],
  [new Float32Array([NaN,0,0,...tri.slice(3)]),null,params],
 ])assert.throws(()=>createDisposableClothAlternatives85(world,index,arg));
});
test('P85: original world outside neck/spine height band is never moved',()=>{
 const p=new Float32Array([
  .1,-.5,0,.2,-.5,0,.1,-.7,.1,
  .1,.6,0,.2,.6,0,.1,.8,.1]);
 for(const c of createDisposableClothAlternatives85(p,null,params))
  assert.deepEqual(c.world,p);
});
test('P85: research helper browser-safe, detached donor hooks only, original collision definitions unchanged',async()=>{
 const helper=await readFile('research/mission2-source-length/alternative-photo-clearance85.mjs','utf8');
 const source=await readFile('research/mission2-source-length/actual-photo-contact-52.mjs','utf8');
 const installer=await readFile('scripts/install-mission2-actual-photo-contact52.mjs','utf8');
 const driver=await readFile('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const blocked of ["from 'node:","require(","process.","fetch(","XMLHttpRequest"])
  assert.equal(helper.includes(blocked),false);
 assert.ok(source.includes('createDisposableClothAlternatives85'));
 assert.ok(source.includes('bodyClothContact58(body,trial,indices,tolerance,bodyBudget)'));
 assert.ok(source.includes('measureDisposableSourceSurfaceStrain61(world,trial,indices)'));
 assert.ok(installer.includes('alternative-photo-clearance85.mjs'));
 assert.ok(driver.includes('PHOTO_DRESS_ALTERNATIVE85'));
 assert.ok(!helper.includes('localStorage')&&!helper.includes('supabase'));
});
