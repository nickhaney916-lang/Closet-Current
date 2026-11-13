/** These are GENERATED SYNTHETIC DATA/KEYS ONLY. No human or model evaluation. */
import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync,sign,createPublicKey } from "node:crypto";
import { fixture } from "../scripts/p79-synthetic-fixtures.mjs";
import { canonical,sha256 } from "../scripts/p75-dataset-core.mjs";
import {CATEGORY_LOCK80, verifyOperatorCategoryLock80, blindTemporalOrder80, strictUtcInstant80} from "../scripts/p80-operator-category-lock.mjs";
import { 
  SCHEMA80, SEAL80, validCandidatePrediction80,
  summarizeConditionalCandidates80, evaluatePrivateBlind80,
  verifyScorerSeal80,
} from "../scripts/p80-private-blind-evaluator.mjs";
const HASH = "a".repeat(64);
const photoSha = "b".repeat(64);
const prediction = (p={}) => ({
  sourceSha256:photoSha, modelSha256:HASH,
  operatorCategory:"Bottoms",
  operatorCategoryProvenance:"blind-operator-before-truth-reveal",
  status:"hypotheses", itemType:"Unknown",
  requiresOwnerConfirmation:true, automaticallyCertified:false,
  alternatives:[
    {category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:0.7},
    {category:"Bottoms",itemType:"Skirt",rank:2,relativeScore:0.12},
  ],
  ...p,
});
const label = (patch={}) => ({
  presence:"single-garment", category:"Bottoms", subtype:"Shorts",
  primaryColor:"Blue", secondaryColor:"Unknown",
  multicolor:false, colorCast:false,
  instanceCount:1,
  instances:[{
    id:"SYNTHETIC-instance",box:[0.1,0.1,0.6,0.5],
    maskSha256:null, clipped:false, occluded:false,
  }],
  wardrobeUnit:"single-unit",
  quality:{lighting:"ok",focus:"ok",framing:"ok",background:"ok"},
  ...patch,
});
function syntheticSeal(rows, scoredAt=new Date().toISOString()){
  const kp=generateKeyPairSync("ed25519");
  const payload={
    schema:SEAL80,
    targetCommit:"c".repeat(40),
    modelSha256:HASH,
    predictionsSha256:sha256(canonical(rows)),
    sourceCount:rows.length,
    scoredAt,
  };
  return {
    ...payload,
    publicKey:kp.publicKey.export({type:"spki",format:"pem"}).toString(),
    signature:sign(null,Buffer.from(canonical(payload)),kp.privateKey).toString("base64"),
    fingerprint:sha256(kp.publicKey.export({type:"spki",format:"der"})),
  };
}
test("P80 refuses to describe private-scoring readiness with no sources, labels or scores", async()=>{
  assert.equal(SCHEMA80,"p80-private-candidate-eval-v1");
  const report=await evaluatePrivateBlind80();
  assert.equal(report.status,"BLOCKED");
  assert.equal(report.scoredSources,0);
  assert.equal(report.independentlyVerifiedSubtypeAccuracy,null);
  assert.equal(report.shouldLiftFamilyAlphaHold,false);
  assert.equal(report.releaseAuthorized,false);
  assert.throws(()=>summarizeConditionalCandidates80([]));
});
test("P80 strict candidate capsule rejects wrong subtypes, rank, category, score, early certification and metadata",()=>{
  assert.equal(validCandidatePrediction80(prediction()),true);
  for(const patch of [
    {itemType:"Shorts"},
    {status:"identified"},
    {status:"hypotheses",alternatives:[]},
    {status:"abstain"}, // an abstention cannot quietly contribute candidate hits

    {requiresOwnerConfirmation:false},
    {automaticallyCertified:true},
    {operatorCategoryProvenance:"from-human-truth"},
    {modelSha256:"bad"},
    {sourceSha256:"bad"},
    {operatorCategory:"Magic"},
    {alternatives:[{category:"Bottoms",itemType:"Tall boots",rank:1,relativeScore:.7}]},
    {alternatives:[{category:"Shoes",itemType:"Sneakers",rank:1,relativeScore:.7}]},
    {alternatives:[{category:"Bottoms",itemType:"Shorts",rank:2,relativeScore:.7}]},
    {alternatives:[{category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:1.1}]},
    {alternatives:[{category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:NaN}]},
    {alternatives:[
      {category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:.1},
      {category:"Bottoms",itemType:"Skirt",rank:2,relativeScore:.5},
    ]},
    {alternatives:[
      {category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:.7},
      {category:"Bottoms",itemType:"Shorts",rank:2,relativeScore:.2},
    ]},
    {unexpected:"raw photo or key must not be in prediction"},
  ])assert.equal(validCandidatePrediction80(prediction(patch)),false,JSON.stringify(patch));
  assert.equal(validCandidatePrediction80(prediction({
    status:"abstain",alternatives:[]
  })),true,"Unknown with no hypotheses is valid");
});
test("P80 synthetic-only arithmetic separately counts candidate inclusion, abstention and owner-category disagreement",()=>{
  const pairs=[
    {labels:label(),prediction:prediction()},
    {labels:label({subtype:"Skirt"}),prediction:prediction({
      alternatives:[{category:"Bottoms",itemType:"Shorts",rank:1,relativeScore:.5}]
    })},
    {labels:label({subtype:"Skirt"}),prediction:prediction({
      status:"abstain",alternatives:[]
    })},
    {labels:label({category:"Shoes",subtype:"Sneakers"}),
      prediction:prediction({status:"abstain",alternatives:[]})},
  ];
  const stats=summarizeConditionalCandidates80(pairs);
  assert.equal(stats.sources,4);
  assert.equal(stats.candidateSetHits,1);
  assert.equal(stats.candidateSetCoverage,.25);
  assert.equal(stats.categoryHintDisagreements,1);
  assert.equal(stats.abstentionStatuses,2);
  assert.equal(stats.candidateSuggestions,3);
  assert.equal(stats.perCategory.Bottoms.sourceCount,3);
  assert.equal(stats.perCategory.Shoes.sourceCount,1);
  assert.equal(stats.perCategory.Shoes.conditionalCoverage,0);
  assert.equal(stats.independentlyVerifiedSubtypeAccuracy,null);
  assert.equal(stats.releaseAuthorized,false);
  assert.equal(stats.shouldLiftFamilyAlphaHold,false);
});
test("P80 cannot cherry-pick non-single, ambiguous, uncertain or clipped human truth out of denominators",()=>{
  for(const bad of [
    {presence:"whole-outfit"},
    {instanceCount:2},
    {wardrobeUnit:"matching-pair"},
    {category:"Unknown"},
    {subtype:"Other"},
    {quality:{lighting:"dim",focus:"ok",framing:"ok",background:"ok"}},
    {quality:{lighting:"ok",focus:"soft",framing:"ok",background:"ok"}},
    {quality:{lighting:"ok",focus:"ok",framing:"clipped",background:"ok"}},
  ])assert.throws(
    ()=>summarizeConditionalCandidates80([{
      labels:label(bad),prediction:prediction(),
    }]),/P80_INELIGIBLE/,
    JSON.stringify(bad)
  );
});
test("P79 generated registrar/reviewer signatures are NOT a real blind cohort and cannot score",async()=>{
  const f=await fixture(1);
  try{
    const rows=[prediction({sourceSha256:f.bundle.sources[0].source.sha256})],
      s=syntheticSeal(rows),
      {fingerprint,...seal}=s,
      report=await evaluatePrivateBlind80({
        bundle:f.bundle,
        receipts:{[rows[0].sourceSha256]:[f.receipt(0,label()),f.receipt(1,label())]},
        predictions:rows, seal,
        trusted:{registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:fingerprint,
        targetCommit:seal.targetCommit,modelSha256:seal.modelSha256,
        approvedAt:new Date(Date.now()-3600000).toISOString()},
      });
    assert.equal(report.status,"BLOCKED","development-fixture cannot become blind accuracy");
    assert.equal(report.scoredSources,0);
    assert.equal(report.independentlyVerifiedSubtypeAccuracy,null);
  }finally{await f.cleanup()}
});
test("P80 synthetic scorer signature cannot bypass explicitly untrusted scoring fingerprint",async()=>{
  const f=await fixture(1);
  try{
    const rows=[prediction({sourceSha256:f.bundle.sources[0].source.sha256})],
      s=syntheticSeal(rows),
      {fingerprint,...seal}=s;
    const report=await evaluatePrivateBlind80({
      bundle:{...f.bundle,authorization:{...f.bundle.authorization,access:"blind"}},
      predictions:rows,seal,
      trusted:{registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:"0".repeat(64),
        targetCommit:seal.targetCommit,modelSha256:seal.modelSha256,
        approvedAt:new Date(Date.now()-3600000).toISOString()},
      receipts:{[rows[0].sourceSha256]:[f.receipt(0,label()),f.receipt(1,label())]},
    });
    assert.equal(report.status,"BLOCKED");
    assert.equal(report.scoredSources,0);
    assert.equal(report.releaseAuthorized,false);
    assert.notEqual(fingerprint,"0".repeat(64));
  }finally{await f.cleanup()}
});
test("P80 never scores forged blind flags, revoked rights or incomplete human receipt sets",async()=>{
  const f=await fixture(1);
  try{
    const rows=[prediction({sourceSha256:f.bundle.sources[0].source.sha256})],
      s=syntheticSeal(rows),
      {fingerprint,...seal}=s,
      trusted={registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:fingerprint,
        targetCommit:seal.targetCommit,modelSha256:seal.modelSha256,
        approvedAt:new Date(Date.now()-3600000).toISOString()};
    for(const mutate of [
      b=>{b.synthetic=true;},
      b=>{b.sources[0].source.split="blind";},
      b=>{b.sources[0].source.rightsReview="manual-review-required";},
      b=>{b.approvedFingerprint="0".repeat(64);},
    ]){
      const b=structuredClone(f.bundle);mutate(b);
      const report=await evaluatePrivateBlind80({
        bundle:b,predictions:rows,seal,trusted,
        receipts:{[rows[0].sourceSha256]:[f.receipt(0,label())]},
      });
      assert.equal(report.status,"BLOCKED");
      assert.equal(report.scoredSources,0);
    }
  }finally{await f.cleanup()}
});
test("PRIVATE evaluator and native module do not turn synthetic test fixtures into release evidence",async()=>{
  const f=await fixture();
  try{
    const rows=[prediction({sourceSha256:f.bundle.sources[0].source.sha256})],
      s=syntheticSeal(rows),
      report=await evaluatePrivateBlind80({
        bundle:f.bundle,
        predictions:rows,
        seal:{...s,signature:"AAAA"},
        trusted:{registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:s.fingerprint,
          targetCommit:s.targetCommit,modelSha256:s.modelSha256,
          approvedAt:new Date(Date.now()-3600000).toISOString()},
        receipts:{[rows[0].sourceSha256]:[f.receipt(0,label()),f.receipt(1,label())]},
      });
    assert.equal(report.status,"BLOCKED");
    assert.equal(report.independentlyVerifiedSubtypeAccuracy,null);
    assert.equal(report.shouldLiftFamilyAlphaHold,false);
    assert.ok(!JSON.stringify(report).includes(rows[0].sourceSha256));
    assert.ok(!JSON.stringify(report).includes("SYNTHETIC"));
  }finally{await f.cleanup()}
});

test("scorer Ed25519 seal is mechanically verified only with exact independently pinned key and immutable prediction digest (SYNTHETIC)",()=>{
  const rows=[prediction()],
    result=syntheticSeal(rows),
    {fingerprint,...seal}=result;
  assert.equal(verifyScorerSeal80(rows,seal,fingerprint,Date.now()),true);
  assert.equal(verifyScorerSeal80(rows,seal,"0".repeat(64),Date.now()),false);
  assert.equal(verifyScorerSeal80(rows,{...seal,modelSha256:"d".repeat(64)},fingerprint,Date.now()),false);
  assert.equal(verifyScorerSeal80(rows,{...seal,targetCommit:"d".repeat(40)},fingerprint,Date.now()),false);
  assert.equal(verifyScorerSeal80(rows,{...seal,sourceCount:2},fingerprint,Date.now()),false);
  assert.equal(verifyScorerSeal80(rows,{...seal,signature:"AAAA"},fingerprint,Date.now()),false);
  assert.equal(verifyScorerSeal80([prediction({status:"abstain",alternatives:[]})],seal,fingerprint,Date.now()),false);
  assert.equal(verifyScorerSeal80(rows,seal,fingerprint,Date.now()+31*86400000),false);
});


/**
 * SYNTHETIC LOCK ONLY. The 60 rows below are fabricated hashes/categories
 * for cryptographic mechanics, never photographs, people or accuracy.
 */
function fakeOperatorLock80(predictions, params={}) {
  const kp=generateKeyPairSync("ed25519");
  const rows=predictions.map(p=>({
    sourceSha256:p.sourceSha256,operatorCategory:p.operatorCategory,
    predictionsHidden:true,blindLabelsHidden:true,
  }));
  const recordedAt=params.recordedAt||new Date(Date.now()-80000).toISOString();
  const payload={
    schema:CATEGORY_LOCK80,
    targetCommit:"c".repeat(40),
    modelSha256:HASH,
    sourceSetSha256:sha256(canonical(rows.map(r=>r.sourceSha256).sort())),
    recordedAt,
    rows,
  };
  const lock={
    ...payload,
    publicKey:kp.publicKey.export({type:"spki",format:"pem"}).toString(),
    signature:sign(null,Buffer.from(canonical(payload)),kp.privateKey).toString("base64"),
  };
  const trusted={
    registrarFingerprint:"d".repeat(64),
    scorerFingerprint:"e".repeat(64),
    operatorFingerprint:sha256(kp.publicKey.export({type:"spki",format:"der"})),
    targetCommit:payload.targetCommit,
    modelSha256:payload.modelSha256,
    approvedAt:new Date(Date.now()-100000).toISOString(),
  };
  return {lock,trusted};
}
test("independent operator-lock signature mechanically protects ALL 60 synthetic source->category mappings",()=>{
  const now=Date.now();
  const predicted=Array.from({length:60},(_,i)=>prediction({
    sourceSha256:i.toString(16).padStart(64,"0"),
    operatorCategory:i%2?"Shoes":"Bottoms",
    alternatives:[],
    status:"abstain",
  }));
  const {lock,trusted}=fakeOperatorLock80(predicted);
  const scoringTime=new Date(now-60000).toISOString();
  assert.equal(verifyOperatorCategoryLock80(lock,predicted,trusted,scoringTime,now),true);
  assert.equal(verifyOperatorCategoryLock80(lock,predicted,{
    ...trusted,operatorFingerprint:trusted.scorerFingerprint
  },scoringTime,now),false,"Operator key may not be scorer key");
  assert.equal(verifyOperatorCategoryLock80(lock,predicted,{
    ...trusted,operatorFingerprint:"a".repeat(64)
  },scoringTime,now),false,"Operator key needs a separate external pin");
  assert.equal(verifyOperatorCategoryLock80(lock,predicted,{
    ...trusted,approvedAt:new Date(now-70000).toISOString()
  },scoringTime,now),false,"Owner approvals must predate category lock");
  assert.equal(verifyOperatorCategoryLock80(lock,predicted,trusted,
    new Date(now-90000).toISOString(),now),false,
    "Model may not be scored before locked operator categories");
  assert.equal(verifyOperatorCategoryLock80(lock,predicted,trusted,
    new Date(now+100000).toISOString(),now),false,
    "Future scoring claim prohibited");
  for(const changed of [
    {...lock,rows:[...lock.rows.slice(0,59)]},
    {...lock,rows:lock.rows.map((x,i)=>i?x:{...x,operatorCategory:"Dresses"})},
    {...lock,rows:lock.rows.map((x,i)=>i?x:{...x,blindLabelsHidden:false})},
    {...lock,rows:lock.rows.map((x,i)=>i?x:{...x,predictionsHidden:false})},
    {...lock,sourceSetSha256:"f".repeat(64)},
    {...lock,modelSha256:"f".repeat(64)},
    {...lock,signature:"AAAA"},
    {...lock,untrustedExtra:"not permitted"},
  ])assert.equal(verifyOperatorCategoryLock80(changed,predicted,trusted,scoringTime,now),
      false,"Any changed category, photo set, label-visibility flag or signature must fail");
  const swapped=predicted.map((p,i)=>i? p: {...p,operatorCategory:"Shoes"});
  assert.equal(verifyOperatorCategoryLock80(lock,swapped,trusted,scoringTime,now),false,
    "Operator signed category must exactly equal model request category");
  assert.equal(verifyOperatorCategoryLock80(lock,predicted.slice(1),trusted,scoringTime,now),false);
  const duplicate=predicted.map((p,i)=>i? p: {...p,sourceSha256:predicted[1].sourceSha256});
  assert.equal(verifyOperatorCategoryLock80(lock,duplicate,trusted,scoringTime,now),false);
  const flipped=predicted.map((p,i)=>i? p: {...p,operatorCategoryProvenance:"self-reported"});
  assert.equal(verifyOperatorCategoryLock80(lock,flipped,trusted,scoringTime,now),false);
  assert.equal(verifyOperatorCategoryLock80(lock,predicted,trusted,scoringTime,
      now+31*86400000),false,"stale category lock cannot revive on old signature");
  assert.equal(verifyOperatorCategoryLock80(lock,predicted.slice(0,59),
      trusted,scoringTime,now),false,"small-cohort disclosure must not pass");
});
test("P80 rejects label-before-scoring chronology and permits only pretruth scores (synthetic timestamps)",()=>{
  const now=Date.now(), iso=n=>new Date(now+n).toISOString(),
    a=iso(-100000),cat=iso(-80000),score=iso(-60000),
    reviews=[iso(-40000),iso(-30000)];
  assert.equal(blindTemporalOrder80(a,cat,score,reviews,now),true);
  for(const [aa,cc,ss,rr] of [
    [a,cat,score,[iso(-70000),iso(-30000)]],
    [a,cat,score,[iso(-60000),iso(-30000)]],
    [a,cat,score,[iso(10000),iso(20000)]],
    [a,iso(-40000),score,reviews],
    [iso(-70000),cat,score,reviews],
    [a,cat,iso(10000),reviews],
    [a,cat,score,[iso(-40000)]],
    [a,cat,score,[]],
    [a,cat,score,["invalid",iso(-30000)]],
  ])assert.equal(blindTemporalOrder80(aa,cc,ss,rr,now),false);
});
test("evaluator rejects unsigned/unpinned operator lock even with valid synthetic scorer signer",async()=>{
  const now=Date.now();
  const rows=Array.from({length:60},(_,i)=>prediction({
    sourceSha256:i.toString(16).padStart(64,"0"),status:"abstain",alternatives:[],
  }));
  const synthetic=syntheticSeal(rows);
  const {fingerprint,...seal}=synthetic;
  const {lock,trusted}=fakeOperatorLock80(rows);
  const bundle={authorization:{access:"blind"},sources:rows.map(p=>({
    source:{sha256:p.sourceSha256}
  })),approvedFingerprint:trusted.registrarFingerprint};
  for(const badLock of [null,{...lock,signature:"AAAA"},{...lock,
    rows:lock.rows.map((r,i)=>i? r:{...r,operatorCategory:"Shoes"})}]) {
    const result=await evaluatePrivateBlind80({
      bundle,operatorLock:badLock,receipts:{},predictions:rows,
      seal,trusted:{...trusted,scorerFingerprint:fingerprint,
        approvedAt:new Date(now-180000).toISOString()},
      now
    });
    assert.equal(result.status,"BLOCKED");
    assert.equal(result.scoredSources,0);
    assert.equal(result.independentlyVerifiedSubtypeAccuracy,null);
    assert.equal(result.shouldLiftFamilyAlphaHold,false);
  }
});

test("P80 custody chronology demands canonical UTC and rejects Date.parse rollover (GENERATED SYNTHETIC)",()=>{
  const leap="2024-02-29T15:30:22.123Z";
  assert.equal(strictUtcInstant80(leap),Date.parse(leap));
  const invalid=[
    "2026-02-31T12:00:00.000Z",
    "2026-02-29T12:00:00.000Z",
    "2026-03-03T12:00:00",
    "2026-03-03T12:00:00+00:00",
    "2026-03-03T12:00:00Z",
    "2026-03-03T25:00:00.000Z",
    "2026-03-03T12:61:00.000Z",
    "2026-03-03T12:00:60.000Z",
    "2026-03-03T12:00:00.000Zextra",
  ];
  for(const s of invalid)assert.ok(Number.isNaN(strictUtcInstant80(s)),s);
  const now=Date.parse("2026-03-05T00:00:00.000Z");
  const approved="2026-03-01T00:00:00.000Z";
  const scored="2026-03-04T12:00:00.000Z";
  const reviewed=["2026-03-04T13:00:00.000Z","2026-03-04T14:00:00.000Z"];
  for(const s of invalid){
    assert.equal(blindTemporalOrder80(s,"2026-03-04T00:00:00.000Z",scored,reviewed,now),false);
    assert.equal(blindTemporalOrder80(approved,s,scored,reviewed,now),false);
    assert.equal(blindTemporalOrder80(approved,"2026-03-04T00:00:00.000Z",s,reviewed,now),false);
    assert.equal(blindTemporalOrder80(approved,"2026-03-04T00:00:00.000Z",scored,[s,reviewed[1]],now),false);
  }
  const preds=Array.from({length:60},(_,i)=>prediction({
    sourceSha256:i.toString(16).padStart(64,"0"),status:"abstain",alternatives:[]
  }));
  const forgedCategory=fakeOperatorLock80(preds,{
    recordedAt:"2026-02-31T12:00:00.000Z"
  });
  assert.equal(verifyOperatorCategoryLock80(forgedCategory.lock,preds,{
    ...forgedCategory.trusted,approvedAt:approved
  },scored,now),false,
  "A correctly signed category receipt cannot pass with normalized February 31");
  const validCategory=fakeOperatorLock80(preds,{
    recordedAt:"2026-03-04T00:00:00.000Z"
  });
  assert.equal(verifyOperatorCategoryLock80(validCategory.lock,preds,{
    ...validCategory.trusted,approvedAt:approved
  },scored,now),true);
  assert.equal(verifyOperatorCategoryLock80(validCategory.lock,preds,{
    ...validCategory.trusted,approvedAt:"2026-02-31T12:00:00.000Z"
  },scored,now),false,
  "An invalid owner approval timestamp cannot be silently normalized");
  const single=[prediction()];
  for(const badTime of ["2026-02-31T12:00:00.000Z","2026-03-03T12:00:00+00:00"]){
    const {fingerprint,...seal}=syntheticSeal(single,badTime);
    assert.equal(verifyScorerSeal80(single,seal,fingerprint,now),false,
      "Even a cryptographically valid signature must not bless noncanonical scoring time");
  }
  const {fingerprint,...validSeal}=syntheticSeal(single,"2026-03-03T12:00:00.000Z");
  assert.equal(verifyScorerSeal80(single,validSeal,fingerprint,now),true);
});
