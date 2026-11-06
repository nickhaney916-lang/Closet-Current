import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeSource99Packets}
 from '../research/source97-human-adjudication-99/review-intake-gate.mjs';
import {maximumCardinalityMatches100,triageSource97Instances100,SOURCE100_SCHEMA}
 from '../research/source97-instance-conflict-triage-100/triage-gate.mjs';

const json=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=json('research/new-real-commons-candidate-cohort-97/source-candidates.json');
const original59=json('benchmark/locked-photo-sources.json');
const quarantined96=json('research/real-multigarment-candidate-intake-96/candidate-manifest.json').candidates;
const base={manifest,original59,quarantined96};
const packets=makeSource99Packets(base);
const chosen=packets.A.items[0].id;
const src=(role)=>packets[role].items.find(r=>r.id===chosen);
const poly=(dx=0,dy=0)=>[
 {x:.12+dx,y:.12+dy},{x:.7+dx,y:.13+dy},
 {x:.7+dx,y:.69+dy},{x:.13+dx,y:.69+dy}
];
const garment=(polygon=poly(),color='Red')=>({
 category:'Tops',itemType:'T-shirt',primaryColor:color,secondaryColor:null,polygon
});
function row(role,{noGarments=false,instances=[garment()],when=null,note=null}={}){
 const s=src(role);return {
  id:s.id,sourceSHA256:s.sourceSHA256,reviewerId:'human-'+role+'-case',
  reviewedAt:when||({A:'2026-11-06T10:00:00Z',B:'2026-11-06T10:01:00Z',
   C:'2026-11-06T10:02:00Z'}[role]),
  noGarments,note:note===null?(noGarments?'No recognizable garment':''):note,
  instances:noGarments?[]:instances
 };
}
function review(role,rows=[]){return {
 schema:'closet-current-human-instance-review-94/v1',role,
 packetId:packets[role].packetId,reviewerId:'human-'+role+'-case',
 method:'direct-human-visual-review',independent:true,
 identityVerification:'SELF_ATTESTED_NOT_VERIFIED',rows
};}
const triage=(exportsByRole={})=>triageSource97Instances100({...base,exportsByRole});
const item=x=>x.sourceStatus.find(s=>s.sourceId===chosen);

test('SOURCE100 maximum-cardinality garment matching fixes greedy high-IoU local-optimum defect',()=>{
 const score=[[.91,.62],[.64,.1]];
 const result=maximumCardinalityMatches100(score);
 assert.equal(result.length,2);
 assert.deepEqual(result.map(x=>[x.a,x.b]),[[0,1],[1,0]]);
 assert.deepEqual(maximumCardinalityMatches100([[.95,null],[null,.96]]).map(x=>[x.a,x.b]),
  [[0,0],[1,1]]);
 assert.deepEqual(maximumCardinalityMatches100([]),[]);
 assert.deepEqual(maximumCardinalityMatches100([[]]),[]);
 assert.deepEqual(maximumCardinalityMatches100([[.25]]),[]);
});
test('SOURCE100 refuses invalid IoU matrix, non-rectangular, infinite or non-normalized evidence',()=>{
 for(const x of [
  [[.8,.7],[.5]],[[1.01]],[[NaN]],[[Infinity]],[[-.01]],
  Array.from({length:21},()=>[.7]),[[true]]
 ])assert.throws(()=>maximumCardinalityMatches100(x),/SOURCE100/);
 assert.throws(()=>maximumCardinalityMatches100([[.8]],{threshold:0}),/SOURCE100/);
 assert.throws(()=>maximumCardinalityMatches100([[.8]],{threshold:1.2}),/SOURCE100/);
});
test('SOURCE100 absent real humans: seven remain pending, no mask accuracy, human claims or production release',()=>{
 const x=triage();
 assert.equal(x.schema,SOURCE100_SCHEMA);
 assert.equal(x.photoCohort,7);
 assert.equal(x.originalFrozen,59);
 assert.equal(x.olderQuarantine,2);
 assert.equal(x.scientificAcceptedNewSources,0);
 assert.equal(x.eligibleOriginalPhotoGapUntil100,41);
 assert.equal(x.counts.AWAITING_INDEPENDENT_A_B,7);
 assert.equal(x.independentlyVerifiedHumanReviewers,0);
 assert.equal(x.perInstanceMaskIoU,null);
 assert.equal(x.categoryAccuracy,null);
 assert.equal(x.primaryColorAccuracy,null);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.familyAlpha,'HOLD');
});
test('SOURCE100 one missing source review never counts as garment-negative or A/B agreement',()=>{
 const x=triage({A:review('A',[row('A')])});
 assert.equal(item(x).status,'AWAITING_INDEPENDENT_A_B');
 assert.equal(item(x).thirdRolePresent,false);
 assert.equal(x.counts.AWAITING_INDEPENDENT_A_B,7);
});
test('SOURCE100 differing real human garment outline can agree provisionally without being scientifically admitted',()=>{
 const x=triage({
  A:review('A',[row('A')]),
  B:review('B',[row('B',{instances:[garment(poly(.01,.01))]})])
 });
 assert.equal(item(x).status,'A_B_PROVISIONAL_MASK_AGREEMENT');
 assert.deepEqual(item(x).flags,[]);
 assert.equal(x.scientificAcceptedNewSources,0);
 assert.equal(x.perInstancePrecision,null);
});
test('SOURCE100 exact copied source polygon and timestamp are flagged for independence audit, never treated as proof',()=>{
 const x=triage({
  A:review('A',[row('A')]),
  B:review('B',[row('B',{when:'2026-11-06T10:00:00Z'})])
 });
 assert.equal(item(x).status,'A_B_MATCHABLE_BUT_INDEPENDENCE_OR_ASSOCIATION_REVIEW_REQUIRED');
 assert.ok(item(x).flags.includes('IDENTICAL_POLYGON_COORDINATES_REVIEW_INDEPENDENCE'));
 assert.ok(item(x).flags.includes('IDENTICAL_REVIEW_TIMESTAMP_REVIEW_INDEPENDENCE'));
 assert.equal(x.independentHumanIdentitiesValidated,false);
});
test('SOURCE100 per-photo C adjudication status is provisional even after label conflict',()=>{
 const a=review('A',[row('A')]);
 const b=review('B',[row('B',{instances:[garment(poly(.01,.01),'Blue')]})]);
 const pending=triage({A:a,B:b});
 assert.equal(item(pending).status,'A_B_CONFLICT_NEEDS_C');
 assert.ok(item(pending).flags.includes('CATEGORY_SUBTYPE_OR_COLOR_CONFLICT'));
 assert.ok(item(pending).flags.includes('THIRD_INDEPENDENT_REVIEW_REQUIRED'));
 const c=review('C',[row('C',{instances:[garment(poly(.02,.02),'Green')]})]);
 const done=triage({A:a,B:b,C:c});
 assert.equal(item(done).status,'C_REVIEW_PRESENT_SELF_ATTESTED_ONLY');
 assert.equal(done.scientificAcceptedNewSources,0);
 assert.equal(done.perInstanceMaskIoU,null);
});
test('SOURCE100 one negative and one photographed garment demands independent C; both explicit negatives provisional only',()=>{
 const a=review('A',[row('A',{noGarments:true})]);
 const b=review('B',[row('B',{instances:[garment()]})]);
 const x=triage({A:a,B:b});
 assert.ok(item(x).flags.includes('NO_GARMENTS_VS_GARMENTS_CONFLICT'));
 assert.ok(item(x).flags.includes('INSTANCE_COUNT_MISMATCH'));
 assert.equal(item(x).status,'A_B_CONFLICT_NEEDS_C');
 const n=triage({A:a,B:review('B',[row('B',{noGarments:true})])});
 assert.equal(item(n).status,'A_B_PROVISIONAL_NO_GARMENTS');
 assert.equal(n.scientificAcceptedNewSources,0);
});
test('SOURCE100 multi-instance count mismatch is redacted but escalated rather than silently dropping garments',()=>{
 const x=triage({
  A:review('A',[row('A',{instances:[garment(poly()),
   garment(poly(.19,.08),'Blue')]})]),
  B:review('B',[row('B',{instances:[garment(poly(.01,.01))]})])
 });
 assert.equal(item(x).status,'A_B_CONFLICT_NEEDS_C');
 assert.ok(item(x).flags.includes('INSTANCE_COUNT_MISMATCH'));
 assert.equal(x.categoryAccuracy,null);
});
test('SOURCE100 malformed exact-source SHA and robotic reviews fail closed via P99/P94 validators',()=>{
 const wrong=review('A',[row('A')]);
 wrong.rows[0].sourceSHA256='f'.repeat(64);
 assert.throws(()=>triage({A:wrong}),/SOURCE99|INSTANCE94/);
 const robot=review('A',[row('A')]);
 robot.reviewerId='qa-browser-automation';robot.rows[0].reviewerId=robot.reviewerId;
 assert.throws(()=>triage({A:robot}),/SOURCE99|INSTANCE94/);
 const leaked=review('A',[row('A')]);
 leaked.rows[0].instances[0].modelPrediction='Blue';
 assert.throws(()=>triage({A:leaked}),/SOURCE99|INSTANCE94/);
});
test('SOURCE100 report never leaks user IDs, private masks, category, color or original-photo bytes',()=>{
 const x=triage({
  A:review('A',[row('A')]),
  B:review('B',[row('B',{instances:[garment(poly(.01,.01))]})])
 });
 const serialized=JSON.stringify(x);
 for(const sensitive of ['human-A-case','human-B-case','"polygon"','"primaryColor":"Red"',
  '"itemType":"T-shirt"','"note"','"sourceSHA256"','"reviewedAt"'])
  assert.equal(serialized.includes(sensitive),false,sensitive);
 assert.equal(x.redactedNoIndividualReviewerIdentifiers,true);
 assert.equal(x.redactedNoMaskVerticesOrPhotos,true);
});
test('SOURCE100 CI enforces exact parent, only five new research paths and no scientific scores/deploy',()=>{
 const ci=readFileSync('.github/workflows/source97-instance-conflict-triage-100-no-deploy.yml','utf8');
 const cli=readFileSync('scripts/audit-source97-triage-100.mjs','utf8');
 assert.match(ci,/BASE=a096c5d9e6cea9068f145ee0712d5227bc166adb/);
 assert.match(ci,/node scripts\/audit-source97-triage-100\.mjs --empty/);
 assert.match(ci,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.mjs/);
 assert.doesNotMatch(ci,/deploy-pages|gh-pages|npm publish|real[-_]customer[-_]photos/);
 assert.match(cli,/triageSource97Instances100/);
});
