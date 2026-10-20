import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditReviewHandoff} from '../scripts/preflight-human-review-handoff.mjs';
import {jpegDimensions} from '../scripts/prepare-reviewed-mask-evidence.mjs';

const manifest=JSON.parse(fs.readFileSync('benchmark/local-fitting-real-photo-manifest.json','utf8'));
const locked=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json','utf8'));
const readSource=name=>fs.readFileSync('benchmark/fixtures/'+name);
const source=manifest.cases.find(c=>c.id==='commons-0001');
const size=jpegDimensions(readSource(source.image)),pixels=size.width*size.height;
const name='commons-0001-item-01';
function pair(){
 const draft={schemaVersion:1,reviewStatus:'draft',nativeSourceGrid:true,annotationGrid:'exact-original-pixels',
  image:source.image,sourceSha256:source.sourceSha256,width:size.width,height:size.height,
  physicalTargetId:name,humanCategory:'Tops',humanForm:'top',
  humanTargetLabel:'Synthetic shape, not real review',reviewer:'Synthetic First',
  targetIndependentlyIdentifiedBy:'Synthetic First',seedModel:null,
  runs:[0,1,pixels-1],note:'Synthetic only'};
 const approved={...draft,reviewStatus:'approved',approvedBy:'Synthetic Second',
  reviewedAt:'2026-10-20T12:00:00.000Z',
  verifiedSourceWidth:size.width,verifiedSourceHeight:size.height,note:'Synthetic approval only'};
 return {draft,approved};
}
function files(draft,approved){
 const map=new Map();
 if(draft)map.set(name+'.mask.draft.json',Buffer.from(JSON.stringify(draft)));
 if(approved)map.set(name+'.mask.approved.json',Buffer.from(JSON.stringify(approved)));
 return map;
}
const audit=reviewFiles=>auditReviewHandoff({manifest,locked,readSource,reviewFiles});
test('all 12 licensed original photos have no invented human review by default',()=>{
 const r=audit(new Map());
 assert.equal(r.cases.length,12);
 assert.equal(r.summary.lockedOriginalsVerified,12);
 assert.equal(r.summary.photosWithHumanFiles,0);
 assert.equal(r.summary.independentlyApprovedFullGarmentMasks,0);
 assert.equal(r.summary.productionAuthorized,false);
 assert.equal(r.registryModified,false);
});
test('one actual-sha synthetically generated first draft is an unapproved draft only',()=>{
 const {draft}=pair(),r=audit(files(draft));
 assert.equal(r.summary.firstDraftsValidated,1);
 assert.equal(r.summary.structurallyConsistentReviewPairs,0);
 assert.equal(r.cases[0].items[0].state,'first-draft-present');
 assert.equal(r.summary.realPhotoMaskAccuracyMeasured,0);
});
test('synthetic first and second review file pair is only structurally consistent, never authenticated',()=>{
 const {draft,approved}=pair(),r=audit(files(draft,approved));
 assert.equal(r.summary.structurallyConsistentReviewPairs,1);
 assert.equal(r.summary.independentlyApprovedFullGarmentMasks,0);
 assert.equal(r.summary.independentlyAuthenticatedHumans,0);
 assert.equal(r.summary.legallyAuditedAnnotationRights,0);
 assert.equal(r.privateReviewerNamesExcluded,true);
 assert.ok(!JSON.stringify(r).includes('Synthetic First'));
 assert.ok(!JSON.stringify(r).includes('Synthetic Second'));
 assert.equal(r.cases[0].items[0].topologyFlagCount>0,true);
});
test('changed outline, source, category or same reviewer fails closed per item',()=>{
 const mutate=[a=>a.runs=[0,2,pixels-2],a=>a.sourceSha256='0'.repeat(64),
  a=>a.humanForm='skirt',a=>a.approvedBy='Synthetic First'];
 for(const update of mutate){
  const {draft,approved}=pair();update(approved);
  const r=audit(files(draft,approved));
  assert.equal(r.summary.invalidItems,1);
  assert.equal(r.summary.structurallyConsistentReviewPairs,0);
  assert.equal(r.cases[0].items[0].state,'invalid-hold');
 }
});
test('review without first draft is blocked; no automatic promotion',()=>{
 const {approved}=pair();
 const r=audit(files(undefined,approved));
 assert.equal(r.summary.invalidItems,1);
 assert.equal(r.summary.firstDraftsValidated,0);
 assert.equal(r.summary.independentlyApprovedFullGarmentMasks,0);
});
test('source ID not in locked photos is rejected instead of counted',()=>{
 const {draft}=pair();
 assert.throws(()=>audit(new Map([['commons-9999-item-01.mask.draft.json',
  Buffer.from(JSON.stringify({...draft,physicalTargetId:'commons-9999-item-01'}))]])),
 /source absent/);
 assert.throws(()=>audit(new Map([['../escape.mask.draft.json',Buffer.from('{}')]])),/path must be a flat filename/);
});
test('independently locked source JPEG hashes are always rechecked',()=>{
 const {draft}=pair();
 const manipulatedRead=name=>name===source.image?Buffer.from('not original photo'):readSource(name);
 assert.throws(()=>auditReviewHandoff({manifest,locked,readSource:manipulatedRead,reviewFiles:files(draft)}),/Original source hash mismatch/);
});
