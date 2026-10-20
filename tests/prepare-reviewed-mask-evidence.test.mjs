import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {jpegDimensions,prepareReviewedMaskEvidence} from '../scripts/prepare-reviewed-mask-evidence.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 // Synthetic SOF metadata fixture; NOT a real photograph or verified legal proof.
 const source=Buffer.from([255,216,255,192,0,17,8,0,8,0,10,3,1,17,0,2,17,0,3,17,0,255,217]);
 const digest=sha(source),review=Buffer.from('Synthetic reviewer evidence only: test cannot authenticate real humans');
 const ir=Buffer.from('Synthetic mock image license: no real redistribution authorization');
 const ar=Buffer.from('Synthetic mock annotation license: no real authorization');
 const annotation={schemaVersion:1,reviewStatus:'approved',nativeSourceGrid:true,annotationGrid:'exact-original-pixels',
  image:'commons-0001.jpg',sourceSha256:digest,width:10,height:8,verifiedSourceWidth:10,verifiedSourceHeight:8,
  physicalTargetId:'commons-0001-item-01',humanCategory:'Bottoms',humanForm:'skirt',humanTargetLabel:'test skirt',
  reviewer:'Synthetic-A',approvedBy:'Synthetic-B',targetIndependentlyIdentifiedBy:'Synthetic-A',
  reviewedAt:'2026-10-20T12:00:00.000Z',seedModel:null,runs:[0,6,74]};
 const first={...annotation,reviewStatus:'draft'};
 delete first.approvedBy;delete first.reviewedAt;delete first.verifiedSourceWidth;delete first.verifiedSourceHeight;
 const firstDraftBytes=Buffer.from(JSON.stringify(first));
 const raw=Buffer.from(JSON.stringify(annotation));
 const receipt={schemaVersion:1,sourceId:'commons-0001',sourceSha256:digest,
  firstDraftSha256:sha(firstDraftBytes),approvedAnnotationSha256:sha(raw),
  physicalTargetId:annotation.physicalTargetId,firstReviewer:'Synthetic-A',secondReviewer:'Synthetic-B',reviewDate:'2026-10-20',
  review:{sha256:sha(review)},
  imageRights:{sha256:sha(ir),status:'verified-for-test-redistribution',license:'SYNTHETIC',sourceUrl:'https://invalid.example/test'},
  annotationRights:{sha256:sha(ar),status:'verified-for-test-redistribution',license:'SYNTHETIC',sourceUrl:'https://invalid.example/test'}};
 return {sourceBytes:source,firstDraftBytes,annotationBytes:raw,
  manifest:{cases:[{id:'commons-0001',image:'commons-0001.jpg',sourceSha256:digest}]},
  locked:[{id:'commons-0001',image:'commons-0001.jpg',sha256:digest}],
  receipt,reviewEvidenceBytes:review,imageRightsEvidenceBytes:ir,annotationRightsEvidenceBytes:ar};
}
function mutate(fn){const f=fixture();fn(f);return f;}
function changeAnnotation(change){
 return mutate(f=>{const a=JSON.parse(f.annotationBytes);change(a);f.annotationBytes=Buffer.from(JSON.stringify(a));f.receipt.approvedAnnotationSha256=sha(f.annotationBytes);});
}
test('proposal validates native-grid metadata but NEVER registers or authorizes quality',()=>{
 const p=prepareReviewedMaskEvidence(fixture());
 assert.deepEqual(jpegDimensions(fixture().sourceBytes),{width:10,height:8});
 assert.equal(p.status,'MANUAL-REVIEW-REQUIRED-NOT-REGISTERED');
 assert.equal(p.productionAuthorized,false);
 assert.equal(p.reviewerIdentitiesAuthenticated,false);
 assert.equal(p.record.reviewStatus,'approved');
 assert.equal(p.record.scope,'full-visible-garment');
 assert.equal(p.record.referenceSha256,sha(Buffer.from(JSON.stringify(p.reference))));
 assert.equal(p.firstDraftSha256,sha(fixture().firstDraftBytes));
});
test('photo must match TWO independent locked hashes',()=>{
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.sourceBytes=Buffer.concat([f.sourceBytes,Buffer.from([0])]))),/digest/);
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.locked[0].sha256='0'.repeat(64))),/digest/);
});
test('resized, forged metadata, seed predictions and draft are blocked',()=>{
 for(const change of [a=>a.width=9,a=>a.verifiedSourceHeight=7,a=>a.nativeSourceGrid=false,
  a=>a.seedModel='inferred',a=>a.modelProposalId='commons-0001-candidate-01',a=>a.reviewStatus='draft'])
  assert.throws(()=>prepareReviewedMaskEvidence(changeAnnotation(change)));
});
test('background-only, foreground-only and incomplete run-length masks are rejected',()=>{
 for(const runs of [[80],[0,80],[0,1,1],[0,90]])
  assert.throws(()=>prepareReviewedMaskEvidence(changeAnnotation(a=>a.runs=runs)));
});
test('same reviewer, mismatched garment, wrong form and forged receipt blocked',()=>{
 for(const change of [a=>a.approvedBy='synthetic-a',a=>a.physicalTargetId='commons-0002-item-01',
  a=>a.humanForm='shorts-wrong',a=>a.targetIndependentlyIdentifiedBy='Someone Else'])
  assert.throws(()=>prepareReviewedMaskEvidence(changeAnnotation(change)));
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.receipt.reviewDate='bad')),/receipt/);
});
test('missing human/rights evidence and changed rights hashes blocked',()=>{
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.receipt.imageRights.status='unreviewed')),/Rights proof/);
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.reviewEvidenceBytes=Buffer.from('torn evidence'))),/evidence/);
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.receipt.annotationRights.sha256='0'.repeat(64))),/evidence/);
});

function changeFirstDraft(change){
 return mutate(f=>{
  const first=JSON.parse(f.firstDraftBytes);
  change(first);
  f.firstDraftBytes=Buffer.from(JSON.stringify(first));
  f.receipt.firstDraftSha256=sha(f.firstDraftBytes);
 });
}
test('second approval MUST have original first-human draft with locked bytes',()=>{
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.firstDraftBytes=undefined)),/first draft/);
 assert.throws(()=>prepareReviewedMaskEvidence(mutate(f=>f.receipt.firstDraftSha256='0'.repeat(64))),/receipt/);
 for(const change of [a=>a.reviewStatus='approved',a=>a.seedModel='AI mask',a=>a.modelProposalId='commons-0001-candidate-01'])
  assert.throws(()=>prepareReviewedMaskEvidence(changeFirstDraft(change)),/first-human draft/);
});
test('second approval cannot alter drawn RLE even if its own checksum is refreshed',()=>{
 const revised=changeAnnotation(a=>a.runs=[0,7,73]);
 assert.throws(()=>prepareReviewedMaskEvidence(revised),/changed first-human draft content|Review changed/);
 assert.throws(()=>prepareReviewedMaskEvidence(changeFirstDraft(a=>a.runs=[0,7,73])),/changed first-human draft content|Review changed/);
 assert.throws(()=>prepareReviewedMaskEvidence(changeFirstDraft(a=>a.humanForm='shorts')),/changed first-human draft content/);
});
test('second reviewer cannot silently change first reviewer identity or invent new fields',()=>{
 assert.throws(()=>prepareReviewedMaskEvidence(changeAnnotation(a=>a.reviewer='Synthetic-C')),/changed first-human draft content/);
 assert.throws(()=>prepareReviewedMaskEvidence(changeAnnotation(a=>a.unreviewedInjectedLabel='skirt')),/Unrecognized injected approval field/);
});
