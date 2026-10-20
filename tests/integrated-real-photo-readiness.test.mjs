import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeIntegratedReadiness} from '../scripts/check-integrated-real-photo-readiness.mjs';
import {jpegDimensions} from '../scripts/prepare-reviewed-mask-evidence.mjs';
const manifest=JSON.parse(fs.readFileSync('benchmark/local-fitting-real-photo-manifest.json'));
const locked=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json'));
const registry=JSON.parse(fs.readFileSync('benchmark/reference-mask-evidence/registry.json'));
const readSource=image=>fs.readFileSync('benchmark/fixtures/'+image);
const report=files=>makeIntegratedReadiness({manifest,locked,registry,readSource,reviewFiles:files});
test('all twelve exact real JPEGs have genuine source grids but NULL quality without independent references',()=>{
 const result=report(new Map());
 assert.equal(result.cases.length,12);
 assert.equal(result.summary.originalPhotosVerified,12);
 assert.equal(result.summary.independentlyApprovedFullMasks,0);
 assert.equal(result.summary.photosWithMaskQualityMetrics,0);
 assert.equal(result.summary.photosWithActualFitMetrics,0);
 assert.equal(result.summary.approvedForProduction,false);
 assert.equal(result.reviewHandoff.summary.firstDraftsValidated,0);
 assert.equal(result.reviewHandoff.summary.structurallyConsistentReviewPairs,0);
 assert.equal(result.originalFirstRecognitionPreserved,true);
 for(const row of result.cases){
  const original=readSource(row.image),dims=jpegDimensions(original);
  assert.deepEqual({width:row.width,height:row.height},dims);
  assert.equal(row.sourceOriginalShaVerified,true);
  assert.equal(row.maskAccuracy,null);
  assert.equal(row.falseRemovalRate,null);
  assert.equal(row.falseInclusionRate,null);
  assert.equal(row.boundaryRecall,null);
  assert.equal(row.fitAccuracy,null);
  assert.equal(row.maskQualityStatus,'blocked');
  assert.deepEqual(row.blockReasons,['missing-independent-full-garment-reference']);
 }
});
test('changed customer image bytes or silently approved policy cannot pass original human provenance',()=>{
 const badRead=image=>image===manifest.cases[0].image?
  Buffer.from(readSource(image).subarray(0,125)):readSource(image);
 assert.throws(()=>makeIntegratedReadiness({manifest,locked,registry,readSource:badRead}),
  /Original source hash mismatch|photo hash mismatch/);
 assert.throws(()=>makeIntegratedReadiness({manifest,locked,
  registry:{...registry,references:[{reviewStatus:'approved'}]},readSource}),/importer/);
 assert.throws(()=>makeIntegratedReadiness({manifest,locked,
  registry:{...registry,policy:{...registry.policy,status:'approved'}},readSource}),/external approval/);
});
test('even structurally consistent synthetic two-person files never authenticate real reviewer or report a quality score',()=>{
 const row=manifest.cases[0],size=jpegDimensions(readSource(row.image));
 const id=row.id+'-item-01',n=size.width*size.height;
 const first={schemaVersion:1,reviewStatus:'draft',nativeSourceGrid:true,
  annotationGrid:'exact-original-pixels',image:row.image,sourceSha256:row.sourceSha256,
  width:size.width,height:size.height,physicalTargetId:id,humanCategory:'Tops',humanForm:'top',
  humanTargetLabel:'Synthetic only',reviewer:'CI synthetic Alice',
  targetIndependentlyIdentifiedBy:'CI synthetic Alice',seedModel:null,runs:[0,1,n-1]};
 const second={...first,reviewStatus:'approved',approvedBy:'CI synthetic Bob',
  reviewedAt:'2026-10-20T00:00:00.000Z',verifiedSourceWidth:size.width,
  verifiedSourceHeight:size.height};
 const files=new Map([[id+'.mask.draft.json',Buffer.from(JSON.stringify(first))],
  [id+'.mask.approved.json',Buffer.from(JSON.stringify(second))]]);
 const result=report(files);
 assert.equal(result.summary.independentlyApprovedFullMasks,0);
 assert.equal(result.summary.photosWithMaskQualityMetrics,0);
 assert.equal(result.reviewHandoff.summary.structurallyConsistentReviewPairs,1);
 assert.equal(result.reviewHandoff.summary.independentlyAuthenticatedHumans,0);
 assert.equal(result.cases[0].maskAccuracy,null);
});
