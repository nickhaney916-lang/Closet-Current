import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDisposableUpperTorsoWorldTrial60}
 from '../research/mission2-source-length/upper-torso-clearance-trial60.mjs';
import {LOCAL_TRIALS63,makeSourceOnlyLocalContactTrial63}
 from '../research/mission2-source-length/upper-torso-contact-local-feather63.mjs';
const source=()=>new Float32Array([
 .2,.5,0,.3,.5,0,.2,.6,0,
 -.2,.5,0,-.3,.5,0,-.2,.6,0
]);
const run=(before=source(),opts={})=>{
 const two=createDisposableUpperTorsoWorldTrial60(before,{
  neck:[0,1.1,0],spine:[0,0,0],outwardMeters:.002
 });
 return makeSourceOnlyLocalContactTrial63({
  originalWorld:before,base2mmWorld:two.world,
  originalCrossingClothFaceIds:new Set([0]),spine:[0,0,0],
  boostMeters:.004,radiusMeters:.25,...opts
 });
};
test('C63: local strict garment/source contact field moves only target source patch and never original buffers',()=>{
 const original=source(),snapshot=original.slice();
 const two=createDisposableUpperTorsoWorldTrial60(original,{
  neck:[0,1.1,0],spine:[0,0,0],outwardMeters:.002
 }),twoCopy=two.world.slice();
 const r=run(original);
 assert.equal(r.strictSourceClothTriangleCount,1);
 assert.equal(r.actualUniqueWorldTargetVertexReferences,3);
 assert.ok(r.affectedVertexReferences>=3);
 assert.ok(r.maximumAdditionalWorldDisplacementMeters>0);
 assert.ok(r.maximumAdditionalWorldDisplacementMeters<=.004002);
 assert.ok(r.maximumOriginalWorldDisplacementMeters<=.006002);
 assert.deepEqual(original,snapshot);
 assert.deepEqual(two.world,twoCopy);
 assert.deepEqual(Array.from(r.proposalWorld.slice(9)),
  Array.from(two.world.slice(9)),
  'unrelated distant garment source triangle stays at its exact immutable 2mm base pose');
 assert.equal(r.originalSourcePhotoClothAnd2mmBaselineBuffersUnchanged,true);
 assert.equal(r.noActualGarmentGeometryOrPhotoUVOrSkinWritten,true);
 assert.equal(r.rawWorldCoordinatesAndSourceClothFaceIdsNotExported,true);
 assert.equal(r.candidateNotRenderedOrHumanPhotorealismApproved,true);
 assert.equal(r.releaseAuthorized,false);
});
test('C63: all three source-only local profile candidates are strictly bounded and nonproduction',()=>{
 assert.equal(LOCAL_TRIALS63.length,3);
 const old=source();
 for(const c of LOCAL_TRIALS63){
  const r=run(old,c);
  assert.ok(r.maximumAdditionalWorldDisplacementMeters<=c.boostMeters+.000002);
  assert.equal(r.boostMeters,c.boostMeters);
  assert.equal(r.radiusMeters,c.radiusMeters);
  assert.equal(r.releaseAuthorized,false);
 }
});
test('C63: only genuine strict body-crossing cloth faces can seed temporary targeted world-coordinates',()=>{
 const old=source();
 for(const extra of [
  {originalCrossingClothFaceIds:new Set()},
  {originalCrossingClothFaceIds:new Set([-1])},
  {originalCrossingClothFaceIds:new Set([2])},
  {originalCrossingClothFaceIds:new Set([0.5])},
  {originalCrossingClothFaceIds:[0]},
  {radiusMeters:0},
  {radiusMeters:1.2},
  {boostMeters:0},
  {boostMeters:.01},
  {spine:[Infinity,0,0]},
  {indices:new Uint16Array([0,1,7])}
 ])assert.throws(()=>run(old,extra));
});
test('C63: malicious nonfinite original-world photo rig vertices fail closed instead of creating plausible-looking garment fit',()=>{
 const old=source();old[5]=NaN;
 assert.throws(()=>run(old));
});
test('C63: actual signed photographed source helper cannot import server-only Node code and withholds cloth face identities',async()=>{
 const s=await readFile(
  'research/mission2-source-length/upper-torso-contact-local-feather63.mjs','utf8');
 assert.ok(!s.includes("from 'node:")&&!s.includes('from "node:'));
 assert.ok(!s.includes('require(')&&!s.includes('process.'));
 assert.ok(s.includes('noActualGarmentGeometryOrPhotoUVOrSkinWritten'));
 assert.ok(s.includes('rawWorldCoordinatesAndSourceClothFaceIdsNotExported'));
});
