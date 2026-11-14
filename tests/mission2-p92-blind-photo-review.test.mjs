import test from 'node:test';
import assert from 'node:assert/strict';
import {
 buildProvisionalCases92,checkSourceReviewedPacket92,
 P92_FIGURES,P92_POSES,P92_VIEWS,P92_SOURCE,sha256
} from '../research/mission2-p92/blind-photo-review.mjs';

const hash=s=>sha256(Buffer.from('SIGNED_SHA_FIXTURE_ONLY:'+s));
const fixture=(engine='chromium')=>{
 const screens=[],drapeVisual91=[];
 for(const figure of P92_FIGURES)for(const pose of P92_POSES)for(const view of P92_VIEWS){
  for(const mode of ['original','candidate','drape91','restored-original']){
   const canonical=figure+'-'+pose+'-'+view+'-';
   screens.push({
    figure,pose,view,mode,file:canonical+mode+'.png',
    sha256:hash(canonical+(mode==='restored-original'?'original':mode))
   });
  }
  drapeVisual91.push({figure,pose,view,
   originalVsBaselineChangedRGBPixelsAbove8:153,
   baselineVsReliefChangedRGBPixelsAbove8:42,
   restoredOriginalChangedRGBPixelsAbove8:0
  });
 }
 return {result:{
  schema:'p91-genuine-original-source-skirt-relief-A-B-Drape-restored-v1',
  engine,sourceId:'commons-0053',
  status:'PASS_REAL_PHOTO_SKINNED_HEM_RELIEF_HYPOTHESIS_NOT_RELEASE',
  familyAlpha:'HOLD',releaseAuthorized:false,researchOnly:true,
  physicalPhone:false,photoProjectionIndependentlyApproved:false,
  continuousClothSafetyCertified:false,
  drapeGate91:{status:'ACTUAL_SOURCE_DRAPE_HYPOTHESIS_RENDERED_NOT_PHOTOREALISM',
   noIndependentHumanPhotoDrapeApproval:true,releaseAuthorized:false},
  fivePoseGate90:{status:'TEN_SOURCE_POSES_CHECKED_NOT_CONTINUOUS_COLLISION_CERTIFICATE'},
  topologyGate89:{status:'SOURCE_ZERO_TOPOLOGY_CLASSIFIED_NOT_CERTIFIED'},
  contactGate88:{status:'SAMPLED_STRICT_NONCROSSING_OBSERVED_NOT_RELEASE'},
  screens,drapeVisual91,drapeSourcePoseContacts91:Array.from({length:10},(_,i)=>({i})),
  sourcePoseReceipts:Array.from({length:10},(_,i)=>({i})),
  errors:[],external:[]
 },engine,manifestRow:{
  id:'commons-0053',hasCutout:true,ownerApproved:false,
  sourceSHA256:P92_SOURCE,cutoutSHA256:hash('frozen alpha cutout'),
  attribution:{license:'CC BY 4.0',title:'original licensed source'},
 }};
};
test('P92 30 original-source A/B cases are fully hashed, balanced and remain UNREVIEWED',()=>{
 const f=fixture(),p=buildProvisionalCases92(f);
 assert.equal(p.publicPacket.cases.length,30);
 assert.equal(p.allocation.length,30);
 assert.equal(p.publicPacket.originalSourceSHA256,P92_SOURCE);
 assert.equal(p.publicPacket.independentlyHumanReviewed,false);
 assert.equal(p.publicPacket.sourceFidelityHumanAcceptance,'UNREVIEWED');
 assert.equal(p.publicPacket.releaseAuthorized,false);
 assert.equal(p.publicPacket.sourceCutoutOwnerApproved,false);
 assert.equal(p.publicPacket.cases.filter(x=>x.sourcePhotoIsFrontOnly).length,10);
 assert.equal(p.publicPacket.cases.filter(x=>x.cannotJudgeTrueSideOrBackFromSingleSourcePhoto).length,20);
 assert.equal(checkSourceReviewedPacket92(p.publicPacket).status,
  'SOURCE_GROUNDED_PACK_READY_FOR_HUMAN_REVIEW_NOT_RELEASE');
 assert.ok(p.publicPacket.cases.every(x=>x.reviewResult===null&&x.needsIndependentHumanReview));
 assert.ok(!JSON.stringify(p.publicPacket).includes('AOriginalFile'));
});
test('P92 deterministic blind allocation is stable within engine but not permission to claim visual approval',()=>{
 const a=buildProvisionalCases92(fixture('webkit'));
 const b=buildProvisionalCases92(fixture('webkit'));
 assert.deepEqual(a.allocation,b.allocation);
 for(const x of a.allocation){
  assert.notEqual(x.A,x.B);assert.ok(['P90','P91'].includes(x.A));
 }
 assert.equal(a.publicPacket.familyAlpha,'HOLD');
 assert.equal(a.publicPacket.releaseAuthorized,false);
});
test('P92 refuses wrong source hashes, owner-approved false positives and missing public attribution',()=>{
 const cases=[
  x=>x.manifestRow.sourceSHA256='0'.repeat(64),
  x=>x.manifestRow.cutoutSHA256='bogus',
  x=>x.manifestRow.ownerApproved=true,
  x=>x.manifestRow.attribution.license='',
  x=>x.manifestRow.hasCutout=false,
  x=>x.result.sourceId='fake photo'
 ];
 for(const change of cases){const x=fixture();change(x);
  assert.throws(()=>buildProvisionalCases92(x),/fail-closed/);
 }
});
test('P92 refuses forged screenshot hash, duplicate frame or missing restoration',()=>{
 const cases=[
  x=>x.result.screens[0].sha256='000',
  x=>x.result.screens[1].file='../../escape.png',
  x=>x.result.screens[0]=x.result.screens[1],
  x=>x.result.screens.pop(),
  x=>x.result.screens.find(s=>s.mode==='restored-original').sha256=hash('altered source view')
 ];
 for(const change of cases){const x=fixture();change(x);
  assert.throws(()=>buildProvisionalCases92(x),/fail-closed/);
 }
});
test('P92 real source and renderer gates cannot be faked by visual-only RGB counts',()=>{
 const cases=[
  x=>x.result.status='PASS_PHOTOREALISTIC',
  x=>x.result.drapeGate91.noIndependentHumanPhotoDrapeApproval=false,
  x=>x.result.fivePoseGate90.status='BLOCKED',
  x=>x.result.topologyGate89.status='SEAM_APPROVED',
  x=>x.result.contactGate88.status='BLOCKED',
  x=>x.result.screens[0].releaseAuthorized=true,
  x=>x.result.drapeVisual91[0].baselineVsReliefChangedRGBPixelsAbove8=0,
  x=>x.result.drapeVisual91[0].restoredOriginalChangedRGBPixelsAbove8=1,
  x=>x.result.external.push('external.example'),
  x=>x.result.releaseAuthorized=true
 ];
 for(const change of cases){const x=fixture();change(x);
  if(x.result.screens[0].releaseAuthorized===true){
   // Screenshot row does not carry release evidence by schema; top-level gate
   // remains the authority. Do not mislabel row-only noisy fields as approval.
   x.result.releaseAuthorized=true;
  }
  assert.throws(()=>buildProvisionalCases92(x),/fail-closed/);
 }
});
test('P92 packet evaluator denies manual approval flags or fabricated completeness',()=>{
 const p=buildProvisionalCases92(fixture()).publicPacket;
 assert.equal(checkSourceReviewedPacket92({...p,independentlyHumanReviewed:true}).status,'BLOCKED');
 assert.equal(checkSourceReviewedPacket92({...p,sourceFidelityHumanAcceptance:'PASS'}).status,'BLOCKED');
 assert.equal(checkSourceReviewedPacket92({...p,releaseAuthorized:true}).status,'BLOCKED');
 assert.equal(checkSourceReviewedPacket92({...p,cases:[]}).status,'BLOCKED');
});
