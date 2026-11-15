/**
 * MAIN1054 M48 — read the actual native original-photo M47 browser receipt
 * after it is generated in this very job. Does not simulate physical seams.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {auditNativePhotoNecklinePhysicalEdge48} from
 '../research/main1054-3d48/photo-neckline-edge-admission48.mjs';

const engine=process.env.M47_ENGINE;
assert.ok(['chromium','webkit'].includes(engine),
 'M48 native check REQUIRES explicit M47_ENGINE, never defaults to Chromium');
const dir=join('benchmark','main47-original-vneck-alpha-visibility',engine);
const src=join(dir,'M47-real-source-P93-M45-alpha-visibility-3D-receipt.json');
const receipt=JSON.parse(await readFile(src,'utf8'));
const verdict=auditNativePhotoNecklinePhysicalEdge48(receipt,{expectedEngine:engine});
assert.equal(verdict.consumer3DAdmitted,false);
assert.equal(verdict.releaseAuthorized,false);
assert.equal(verdict.actualSewnCollarEdgeReconstructed,false);
assert.equal(verdict.originalBacksidePhotographicallyObserved,false);
assert.equal(verdict.familyAlpha,'HOLD');

const outDir=join('benchmark','main48-source-neckline-physical-edge-veto',engine);
await mkdir(outDir,{recursive:true});
await writeFile(join(outDir,'M48-actual-source-physical-cloth-NO-GO.json'),
 JSON.stringify({
  ...verdict,
  originalM47SourceReceipt:src,
  ciRealBrowserEvidenceRead:true,
  comparisonSource:'actual M47 original-photo skinned WebGL job, NOT unit mocks',
  noPhotographicRearTexture:true,
  bodyContactOnlySampledNotContinuous:true,
  nextRealWorldDependency:'Mission 2 source-supported sewn neckline, genuine material/contact/human visual acceptance',
  valid3DCustomerGarment:false,
  privateAccountCloudOrPhysicalPhoneTested:false,
  released:false
 },null,2)+'\n',{flag:'wx'});
console.log('MAIN48_ACTUAL_SOURCE_NECKLINE_3D_ADMISSION_DENIED',JSON.stringify({
 engine,sourceScenes:verdict.genuineSourceScenesAudited,
 changedOriginalPhotoShaderPixels:verdict.observedFragmentVisibilityPixels,
 actualPhysicalSewnVEdge:false,consumer3D:false,familyAlpha:'HOLD'
}));
