import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 P95_INSTANCE_CANDIDATE_SCHEMA,auditGenuinePhotoModelEvidence95,
 validateTrueInstanceModelPredictions95,gateIndependentInstanceAccuracy95
} from '../research/real-model-instance-scientific-bridge-95/model-instance-gate.mjs';
import {P86_MODEL_ORIGIN_95,FASHION86_PHOTO_ROWS_95,
 SEGFORMER86_SEMANTIC_MAPS_95} from '../research/real-model-instance-scientific-bridge-95/p86-model-snapshot.mjs';
import {makeInstancePacket94}
 from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';

const json=p=>JSON.parse(readFileSync(p,'utf8'));
const sources=json('benchmark/locked-photo-sources.json');
const extraSegformerSources=json('research/multi-review-triage-28/frozen-photo-annotations-16.json');
const partitions={
 development:json('benchmark/manifest-reviewed-32.json'),
 validation:json('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':json('benchmark/manifest-holdout-16.json')
};
const run=()=>auditGenuinePhotoModelEvidence95({
 sources,partitions,extraSegformerSources
});
const quad=[{x:.1,y:.1},{x:.4,y:.1},{x:.4,y:.4},{x:.1,y:.4}];
const piece=()=>({category:'Tops',itemType:'T-shirt',primaryColor:'Blue',
 secondaryColor:null,polygon:quad});
const candidate=()=>({
 schema:P95_INSTANCE_CANDIDATE_SCHEMA,
 model:{name:'VerifiedNativeInstanceModel',revision:'a'.repeat(40),
  mode:'learned-independent-instance-identity',semanticBoxProxy:false},
 predictions:partitions['locked-evaluation'].map(p=>({
  id:p.id,sourceSHA256:sources.find(x=>x.id===p.id).sha256,
  independentModelExecutionClaim:true,
  derivation:'native-individual-pixel-mask',
  instances:[piece()]
 }))
});
function review(packet,reviewerId){
 return {schema:'closet-current-human-instance-review-94/v1',
  role:packet.role,packetId:packet.packetId,
  reviewerId,method:'direct-human-visual-review',independent:true,
  identityVerification:'SELF_ATTESTED_NOT_VERIFIED',
  rows:packet.items.map(x=>({
   id:x.id,sourceSHA256:x.sourceSHA256,reviewerId,
   reviewedAt:'2026-11-06T03:00:00.000Z',
   noGarments:false,note:'SYNTHETIC QA label only, NOT an actual independent human.',
   instances:[piece()]
  }))
 };
}
test('MODEL95 exactly 59 genuine actual FashionCLIP outputs pinned across frozen 32/11/16 source photo IDs',()=>{
 const r=run();
 assert.equal(r.fashionCLIPRealPhotoRuns,59);
 assert.equal(r.photoOnlyPredictions.length,59);
 assert.deepEqual(r.partitions,{development:32,validation:11,'locked-evaluation':16});
 assert.equal(new Set(r.photoOnlyPredictions.map(x=>x.id)).size,59);
 assert.equal(r.photoOnlyPredictions.filter(x=>x.split==='locked-evaluation').length,16);
 assert.ok(r.photoOnlyPredictions.every(x=>x.wholePhotoOnly&&x.individualGarmentPolygon===null));
 assert.equal(r.releaseAuthorized,false);
});
test('MODEL95 actual SegFormer browser semantic label maps are pinned, six runs over three licensed source IDs; NOT individual masks',()=>{
 const r=run();
 assert.equal(r.segFormerRealSemanticRuns,6);
 assert.equal(r.segFormerUniqueLicensedSources,3);
 assert.equal(new Set(r.semanticEvidence.map(x=>x.id)).size,3);
 assert.ok(r.semanticEvidence.every(x=>x.actualPinnedSemanticMap===true&&
  x.individualGarmentPolygons===null&&x.instanceIdentityModel===false));
 assert.ok(r.reference.segFormerLicenseStatus==='UNSPECIFIED_BLOCKED');
});
test('MODEL95 preserves real model abstentions and unsupported Accessories/Scarf, never hiding historical out-of-scope data',()=>{
 const r=run();
 assert.ok(r.unsupported.some(x=>x.id==='validation-0008'&&x.category==='Accessories'&&
  x.itemType==='Scarf'));
 assert.ok(r.uncertainPhotoIds.includes('commons-0016'));
 assert.ok(r.uncertainPhotoIds.includes('commons-0049'));
 assert.ok(r.uncertainPhotoIds.length>=8);
 assert.equal(r.historicalHumanLabelsUsed,false);
});
test('MODEL95 source SHA and license mismatches, duplicates and cross-partition model labels fail closed',()=>{
 const s=structuredClone(sources);
 s[0].sha256=s[1].sha256;
 assert.throws(()=>auditGenuinePhotoModelEvidence95({sources:s,partitions,extraSegformerSources}),
  /duplicated original JPEG identity/);
 const l=structuredClone(sources);l[0].attribution.license=null;
 assert.throws(()=>auditGenuinePhotoModelEvidence95({sources:l,partitions,extraSegformerSources}),
  /unlicensed/);
 const p=structuredClone(partitions);
 p['locked-evaluation'][0].id=p.development[0].id;
 assert.throws(()=>auditGenuinePhotoModelEvidence95({sources,partitions:p,extraSegformerSources}),
  /duplicated, unlicensed or cross-split/);
 const e=structuredClone(extraSegformerSources);
 const shared=e.find(x=>x.id==='commons-0021');
 shared.sha256='f'.repeat(64);
 assert.throws(()=>auditGenuinePhotoModelEvidence95({sources,partitions,extraSegformerSources:e}),
  /SegFormer\/classifier original SHA mismatch/);
});
test('MODEL95 no actual independent masks: null precision/recall/IoU/colors, never 0%/100% fake scores',()=>{
 const r=gateIndependentInstanceAccuracy95({
  modelAudit:run(),sourceRows:sources,partitions
 });
 assert.equal(r.realModelInstanceMaskAccuracy,null);
 assert.equal(r.scientificVerdict,'NEEDS_REWORK');
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.evidence.genuineClassifierPhotoRuns,59);
 assert.equal(r.evidence.genuineSegFormerSemanticRuns,6);
 assert.equal(r.evidence.actualIndependentlyAuditedHumanInstancePhotos,0);
 assert.equal(r.evaluationStatus,'BLOCKED_NO_INDEPENDENT_INSTANCE_TRUTH');
 assert.equal(r.familyAlpha,'HOLD');
});
test('MODEL95 semantic SegFormer and photo-level FashionCLIP cannot masquerade as an instance model',()=>{
 for(const name of ['SegFormer','fashion-clip','FashionCLIP']){
  const x=candidate();x.model.name=name;
  assert.throws(()=>validateTrueInstanceModelPredictions95({
   submission:x,sources,partitions
  }),/semantic SegFormer/);
 }
 const x=candidate();x.model.semanticBoxProxy=true;
 assert.throws(()=>validateTrueInstanceModelPredictions95({
  submission:x,sources,partitions
 }),/semantic SegFormer/);
});
test('MODEL95 synthetic bounding boxes and semantic label groups cannot be promoted to individual garment polygons',()=>{
 for(const patch of [
  {boundingBoxOnly:true},
  {semanticLabelGroup:4},
  {itemType:'Scarf'},
  {primaryColor:'not-a-real-color'},
  {polygon:quad.map((p,i)=>i===1?{...p,x:2}:p)}
 ]){
  const x=candidate();Object.assign(x.predictions[0].instances[0],patch);
  assert.throws(()=>validateTrueInstanceModelPredictions95({
   submission:x,sources,partitions
  }),/semantic box|polygon|out of range/);
 }
 const x=candidate();x.predictions[0].derivation='bbox-converted-to-polygon';
 assert.throws(()=>validateTrueInstanceModelPredictions95({
  submission:x,sources,partitions
 }),/untrusted\/missing/);
});
test('MODEL95 wrong original photo SHA, copied locked ID, extra development prediction or missed locked row fail',()=>{
 const samples=[
  x=>x.predictions[0].sourceSHA256='f'.repeat(64),
  x=>x.predictions[0].id=x.predictions[1].id,
  x=>x.predictions.push({...x.predictions[0],id:partitions.development[0].id,
   sourceSHA256:sources.find(y=>y.id===partitions.development[0].id).sha256}),
  x=>x.predictions.pop()
 ];
 for(const mutate of samples){
  const x=candidate();mutate(x);
  assert.throws(()=>validateTrueInstanceModelPredictions95({
   submission:x,sources,partitions
  }),/untrusted\/missing|complete locked/);
 }
});
test('MODEL95 candidate is only STRUCTURALLY admissible: source-bound polygon JSON does not prove model ran',()=>{
 const x=validateTrueInstanceModelPredictions95({submission:candidate(),sources,partitions});
 assert.equal(x.predictions.length,16);
 assert.equal(x.independentModelExecutionVerified,false);
 assert.equal(x.scientificClaimsAuthorized,false);
 assert.equal(x.predictions[0].instances[0].polygon.length,4);
});
test('MODEL95 a single fake reviewer or model-only evidence cannot trigger an accuracy score',()=>{
 const r=gateIndependentInstanceAccuracy95({
  modelAudit:run(),sourceRows:sources,partitions,candidateSubmission:candidate()
 });
 assert.equal(r.realModelInstanceMaskAccuracy,null);
 assert.equal(r.scientificVerdict,'NEEDS_REWORK');
 assert.throws(()=>gateIndependentInstanceAccuracy95({
  modelAudit:run(),sourceRows:sources,partitions,packetA:{}
 }),/independent role A and role B/);
});
test('MODEL95 even perfectly agreeing SYNTHETIC A/B and model labels are exploratory, NEVER scientific/release acceptance',()=>{
 const locked=partitions['locked-evaluation'].map(x=>x.id);
 const packetA=makeInstancePacket94({sources,role:'A',onlyIds:locked});
 const packetB=makeInstancePacket94({sources,role:'B',onlyIds:locked});
 const r=gateIndependentInstanceAccuracy95({
  modelAudit:run(),sourceRows:sources,partitions,
  packetA,reviewA:review(packetA,'qa-only-human-A'),
  packetB,reviewB:review(packetB,'qa-only-human-B'),
  candidateSubmission:candidate(),
  auditedRealHumanProcess:false,auditedRealModelExecution:true
 });
 assert.equal(r.realModelInstanceMaskAccuracy.sourceCount,16);
 assert.equal(r.realModelInstanceMaskAccuracy.detectionPrecision,1);
 assert.equal(r.realModelInstanceMaskAccuracy.detectionRecall,1);
 assert.equal(r.evaluationStatus,'EXPLORATORY_NOT_RELEASE_VALIDATED');
 assert.equal(r.evidence.actualIndependentlyAuditedHumanInstancePhotos,0);
 assert.equal(r.scientificVerdict,'NEEDS_REWORK');
 assert.equal(r.releaseAuthorized,false);
});
test('MODEL95 original actual artifact lineage frozen at exact source commits, SHA manifests and genuine model-revision IDs',()=>{
 assert.equal(P86_MODEL_ORIGIN_95.runId,42143014654);
 assert.equal(P86_MODEL_ORIGIN_95.artifactId,13469256263);
 assert.equal(P86_MODEL_ORIGIN_95.fashionCLIP.rawOutputSHA256['locked-evaluation'],
  'c57427f65a616cdb6fb8469f94ffa46b32339a24af92f4bc647156a610ec193b');
 assert.equal(P86_MODEL_ORIGIN_95.segFormer.rawReportSHA256,
  '0188f49f5650a244316c12861dc0f23c1344f93d19d2d9882b4b066989402581');
 assert.equal(FASHION86_PHOTO_ROWS_95.development.length,32);
 assert.equal(FASHION86_PHOTO_ROWS_95.validation.length,11);
 assert.equal(FASHION86_PHOTO_ROWS_95['locked-evaluation'].length,16);
 assert.equal(SEGFORMER86_SEMANTIC_MAPS_95.length,6);
 const js=readFileSync('research/real-model-instance-scientific-bridge-95/p86-model-snapshot.mjs','utf8');
 assert.doesNotMatch(js,/recognitionMemory|features:|Float32Array|data:image|previousExpectedCategory/);
});
