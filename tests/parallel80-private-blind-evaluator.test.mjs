/** These are GENERATED SYNTHETIC DATA/KEYS ONLY. No human or model evaluation. */
import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync,sign,createPublicKey } from "node:crypto";
import { fixture } from "../scripts/p79-synthetic-fixtures.mjs";
import { canonical,sha256 } from "../scripts/p75-dataset-core.mjs";
import { 
  SCHEMA80, SEAL80, validCandidatePrediction80,
  summarizeConditionalCandidates80, evaluatePrivateBlind80,
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
function syntheticSeal(rows){
  const kp=generateKeyPairSync("ed25519");
  const payload={
    schema:SEAL80,
    targetCommit:"c".repeat(40),
    modelSha256:HASH,
    predictionsSha256:sha256(canonical(rows)),
    sourceCount:rows.length,
    scoredAt:new Date().toISOString(),
  };
  return {
    ...payload,
    publicKey:kp.publicKey.export({type:"spki",format:"pem"}).toString(),
    signature:sign(null,Buffer.from(canonical(payload)),kp.privateKey).toString("base64"),
    fingerprint:sha256(createPublicKey(kp.publicKey).export({type:"spki",format:"der"})),
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
        trusted:{registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:fingerprint},
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
      trusted:{registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:"0".repeat(64)},
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
      trusted={registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:fingerprint};
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
        trusted:{registrarFingerprint:f.bundle.approvedFingerprint,scorerFingerprint:s.fingerprint},
        receipts:{[rows[0].sourceSha256]:[f.receipt(0,label()),f.receipt(1,label())]},
      });
    assert.equal(report.status,"BLOCKED");
    assert.equal(report.independentlyVerifiedSubtypeAccuracy,null);
    assert.equal(report.shouldLiftFamilyAlphaHold,false);
    assert.ok(!JSON.stringify(report).includes(rows[0].sourceSha256));
    assert.ok(!JSON.stringify(report).includes("SYNTHETIC"));
  }finally{await f.cleanup()}
});
