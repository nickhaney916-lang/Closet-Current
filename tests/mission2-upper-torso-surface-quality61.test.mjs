import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {measureDisposableSourceSurfaceStrain61} from
 '../research/mission2-source-length/upper-torso-surface-quality61.mjs';
const single=new Float32Array([0,0,0,1,0,0,0,1,0]);
test('C61: identity original photograph world cloth has zero face distortion and all research holds',()=>{
 const r=measureDisposableSourceSurfaceStrain61(single,single.slice());
 assert.equal(r.signedOriginalSourceFacesAnalyzed,1);
 assert.equal(r.sourceFacesWithTemporaryPositionDifferences,0);
 assert.equal(r.facesWithMaxEdgeStrainAbove2Percent,0);
 assert.equal(r.facesWithNormalTurnAbove10Degrees,0);
 assert.equal(r.facesWithReversedOrientation,0);
 assert.equal(r.provisionalMeshDistortionGuardPassed,true);
 assert.equal(r.originalPhotoTextureRestUVAndSkinNeverEdited,true);
 assert.equal(r.candidateNotAllowedInConsumer3D,true);
 assert.equal(r.releaseAuthorized,false);
});
test('C61: rigid translation has changed source coordinates but no shape degradation',()=>{
 const shifted=single.map((x,i)=>x+(i%3===0?.1:0));
 const r=measureDisposableSourceSurfaceStrain61(single,shifted);
 assert.equal(r.sourceFacesWithTemporaryPositionDifferences,1);
 assert.equal(r.maxOriginalPhotoWorldEdgeRelativeStrain,0);
 assert.equal(r.facesWithReversedOrientation,0);
 assert.equal(r.maxOriginalPhotoFaceAreaRelativeChange,0);
 assert.equal(r.provisionalMeshDistortionGuardPassed,true);
});
test('C61: source triangle 2D stretch over five percent cannot be waved away as valid fabric',()=>{
 const stretched=single.slice();stretched[3]=1.2;
 const r=measureDisposableSourceSurfaceStrain61(single,stretched);
 assert.equal(r.facesWithMaxEdgeStrainAbove2Percent,1);
 assert.equal(r.facesWithMaxEdgeStrainAbove5Percent,1);
 assert.equal(r.facesWithAreaChangeAbove10Percent,1);
 assert.equal(r.provisionalMeshDistortionGuardPassed,false);
 assert.equal(r.releaseAuthorized,false);
});
test('C61: flipped original source cloth triangle refuses any preliminary shape-stability pass',()=>{
 const flipped=new Float32Array([0,0,0,0,1,0,1,0,0]);
 const r=measureDisposableSourceSurfaceStrain61(single,flipped);
 assert.equal(r.facesWithReversedOrientation,1);
 assert.ok(r.maxOriginalPhotoFaceNormalTurnDegrees>=179.99);
 assert.equal(r.provisionalMeshDistortionGuardPassed,false);
});
test('C61: source garment triangle collapse must be explicit, not a zero-area clothing silhouette success',()=>{
 const flat=new Float32Array([0,0,0,.5,0,0,1,0,0]);
 const r=measureDisposableSourceSurfaceStrain61(single,flat);
 assert.equal(r.sourceFacesDegenerateOrCollapsed,1);
 assert.equal(r.provisionalMeshDistortionGuardPassed,false);
});
test('C61: forged indices, nonfinite source and bad original/synthetic buffer dimensions refuse real-photo geometry proof',()=>{
 for(const op of [
  ()=>measureDisposableSourceSurfaceStrain61([],single),
  ()=>measureDisposableSourceSurfaceStrain61(single,new Float32Array(8)),
  ()=>measureDisposableSourceSurfaceStrain61(single,new Float32Array([0,0,0,1,0,0,NaN,1,0])),
  ()=>measureDisposableSourceSurfaceStrain61(single,single.slice(),[0,1,2]),
  ()=>measureDisposableSourceSurfaceStrain61(single,single.slice(),new Uint16Array([0,1,6])),
  ()=>measureDisposableSourceSurfaceStrain61(single,single.slice(),new Uint16Array([0,1,2,0]))
 ])assert.throws(op);
});
test('C61: browser source helper is standalone, contains no Node-only imports, and explicitly forbids photo/owner geometry export',async()=>{
 const helper=await readFile('research/mission2-source-length/upper-torso-surface-quality61.mjs','utf8');
 assert.ok(!helper.includes("from 'node:")&&!helper.includes('from "node:'));
 assert.ok(!helper.includes('require(')&&!helper.includes('process.'));
 assert.ok(helper.includes('sourceFaceLocationsOrIdentifiersWithheld'));
});
