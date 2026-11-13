/** Synthetic score tensors + keys ONLY; no real model, photos or human truth. */
import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync, sign} from "node:crypto";
import {localCandidates} from "../public/local-catalog.mjs";
import {canonical,sha256} from "../scripts/p75-dataset-core.mjs";
import {validCandidatePrediction80,verifyScorerSeal80,SEAL80}
  from "../scripts/p80-private-blind-evaluator.mjs";
import {PROOF_SCHEMA80,deriveConditionalCandidates80,validateFullScoreProofs80}
  from "../scripts/p80-full-score-transcript.mjs";

const MODEL_SHA="a".repeat(64),
  VECTOR_SHA="b".repeat(64),
  WORKER_SHA="c".repeat(64),
  REVISION="d".repeat(40),
  now=Date.now(),
  ts=(delta)=>new Date(now+delta).toISOString(),
  lockAt=ts(-150000),
  computedAt=ts(-110000),
  sealedAt=ts(-90000);
const trusted={
  modelSha256:MODEL_SHA,
  modelRevision:REVISION,
  vectorsSha256:VECTOR_SHA,
  workerSourceCodeSha256:WORKER_SHA,
};
const id=(i)=>i.toString(16).padStart(64,"0");
function scores(category="Bottoms",order=false){
  const winner=category==="Shoes"?"sneakers":"a pair of shorts",
    runner=category==="Shoes"?"ankle boots":"a skirt";
  const others=(1-.68-.1)/(localCandidates.length-2);
  const rows=localCandidates.map(r=>({
    label:r.label,
    score:r.label===winner ? 0.68 : r.label===runner ? 0.1 : others,
  }));
  return order?rows.reverse():rows;
}
function proof(sha,category="Bottoms"){
  return {
    schema:PROOF_SCHEMA80,
    sourceSha256:sha,inputSha256:sha,
    modelArtifactSha256:MODEL_SHA,
    model:{
      name:"ff13/fashion-clip",
      revision:REVISION,
      vectorsSha256:VECTOR_SHA,
      sourceCodeSha256:WORKER_SHA,
    },
    computedAt,
    views:{whole:scores(category),confirmation:scores(category,true)},
  };
}
function cohort(){
  const proofs=[],predictions=[],rows=[];
  for(let i=0;i<60;i++){
    const hash=id(i),category=i%2?"Shoes":"Bottoms",
      p=proof(hash,category);
    const derived=deriveConditionalCandidates80(p,category,trusted,sealedAt,lockAt);
    assert.equal(derived?.status,"hypotheses");
    proofs.push(p);
    rows.push({sourceSha256:hash,operatorCategory:category});
    predictions.push({
      sourceSha256:hash,modelSha256:MODEL_SHA,
      operatorCategory:category,
      operatorCategoryProvenance:"blind-operator-before-truth-reveal",
      status:derived.status,itemType:"Unknown",
      requiresOwnerConfirmation:true,automaticallyCertified:false,
      alternatives:derived.alternatives,
    });
  }
  return {proofs,predictions,rows};
}
function createSeal(proofs,predictions){
  const k=generateKeyPairSync("ed25519"),payload={
    schema:SEAL80,targetCommit:"e".repeat(40),
    modelSha256:MODEL_SHA,
    predictionsSha256:sha256(canonical(predictions)),
    proofsSha256:sha256(canonical(proofs)),
    sourceCount:predictions.length,scoredAt:sealedAt,
  };
  return {
    seal:{...payload,publicKey:k.publicKey.export({type:"spki",format:"pem"}).toString(),
      signature:sign(null,Buffer.from(canonical(payload)),k.privateKey).toString("base64")},
    fingerprint:sha256(k.publicKey.export({type:"spki",format:"der"})),
  };
}
test("SYNTHETIC: both complete 47-vocabulary score framings deterministically bind signed conditional hypotheses",()=>{
  assert.equal(localCandidates.length,47,"Frozen actual FashionCLIP vocabulary required");
  const {proofs,predictions,rows}=cohort(),
    categoryLock={recordedAt:lockAt,rows},
    {seal,fingerprint}=createSeal(proofs,predictions);
  for(const p of predictions)assert.equal(validCandidatePrediction80(p),true);
  assert.equal(validateFullScoreProofs80(proofs,predictions,trusted,seal,categoryLock),true);
  assert.equal(verifyScorerSeal80(predictions,seal,fingerprint,now,proofs),true);
  assert.equal(proofs.length,60);
  assert.equal(predictions[0].alternatives.length,2);
  assert.equal(predictions[0].alternatives[0].itemType,"Shorts");
  assert.equal(predictions[1].alternatives[0].itemType,"Sneakers");
});
test("SYNTHETIC: full scores cannot support invented, wrong-ranked, withheld or category-switched predictions",()=>{
  const {proofs,predictions,rows}=cohort(),
    categoryLock={recordedAt:lockAt,rows},
    {seal}=createSeal(proofs,predictions);
  const alteredPred=[
    {...predictions[0],status:"abstain",alternatives:[]},
    {...predictions[0],alternatives:predictions[0].alternatives.slice(1)},
    {...predictions[0],alternatives:[{...predictions[0].alternatives[0],relativeScore:.01},predictions[0].alternatives[1]]},
    {...predictions[0],alternatives:predictions[0].alternatives.toReversed()},
    {...predictions[0],operatorCategory:"Shoes"},
    {...predictions[0],modelSha256:"f".repeat(64)},
    {...predictions[0],operatorCategoryProvenance:"self-declared"},
    {...predictions[0],automaticallyCertified:true},
  ];
  for(const candidate of alteredPred)assert.equal(
    validateFullScoreProofs80(proofs,[candidate,...predictions.slice(1)],
      trusted,seal,categoryLock),
    false,"Altered candidates must never be accepted merely because source hashes agree");
});
test("SYNTHETIC: full score transcript rejects missing, duplicate, renormalized, NaN, reversed model/custody revisions",()=>{
  const {proofs,predictions,rows}=cohort(),
    categoryLock={recordedAt:lockAt,rows},
    {seal,fingerprint}=createSeal(proofs,predictions),
    first=proofs[0],
    replace=(patch)=>[{...first,...patch},...proofs.slice(1)],
    reject=(v)=>assert.equal(validateFullScoreProofs80(
      v,predictions,trusted,seal,categoryLock),false);
  reject(replace({inputSha256:"f".repeat(64)}));
  reject(replace({modelArtifactSha256:"f".repeat(64)}));
  reject(replace({model:{...first.model,sourceCodeSha256:"f".repeat(64)}}));
  reject(replace({model:{...first.model,vectorsSha256:"f".repeat(64)}}));
  reject(replace({model:{...first.model,revision:"f".repeat(40)}}));
  reject(replace({computedAt:ts(-200000)}));
  reject(replace({computedAt:ts(100000)}));
  reject(replace({views:{...first.views,whole:first.views.whole.slice(1)}}));
  reject(replace({views:{...first.views,whole:[first.views.whole[0],...first.views.whole.slice(0,-1)]}}));
  reject(replace({views:{...first.views,whole:first.views.whole.map((x,i)=>
    i===0?{...x,score:Number.NaN}:x)}}));
  reject(replace({views:{...first.views,whole:first.views.whole.map((x,i)=>
    i===0?{...x,score:.75}:x)}}));
  reject(replace({views:{...first.views,whole:first.views.whole.map((x,i)=>
    i===0?{...x,unexpected:"raw"}:x)}}));
  reject([...proofs.slice(1),proofs[1]]);
  reject(proofs.slice(0,59));
  reject(replace({unexpected:"cannot copy source photos"}));
  assert.equal(verifyScorerSeal80(predictions,seal,fingerprint,now,proofs),true);
  assert.equal(verifyScorerSeal80(predictions,seal,fingerprint,now,
    replace({computedAt:ts(-80000)})),false,"Signer's proof digest must change if any score proof changes");
});
test("SYNTHETIC: conflicting same-model views, weak margins or unknown categories enforce abstain with zero candidates",()=>{
  const p=proof(id(1));
  const a=deriveConditionalCandidates80(p,"Bottoms",trusted,sealedAt,lockAt);
  assert.equal(a.status,"hypotheses");
  const conflict=structuredClone(p);
  const winner=conflict.views.confirmation.find(x=>x.label==="a pair of shorts"),
    loser=conflict.views.confirmation.find(x=>x.label==="a skirt");
  [winner.score,loser.score]=[loser.score,winner.score];
  assert.deepEqual(deriveConditionalCandidates80(conflict,"Bottoms",trusted,sealedAt,lockAt),
    {status:"abstain",alternatives:[]},"Same model disagreement isn't independent proof");
  const weak=structuredClone(p);
  for(const view of [weak.views.whole,weak.views.confirmation]){
    const first=view.find(x=>x.label==="a pair of shorts"),
      second=view.find(x=>x.label==="a skirt");
    first.score=0.34;second.score=0.28;
    for(const row of view)if(row!==first&&row!==second)
      row.score=0.38/(localCandidates.length-2);
  }
  assert.deepEqual(deriveConditionalCandidates80(weak,"Bottoms",trusted,sealedAt,lockAt),
    {status:"abstain",alternatives:[]});
  assert.deepEqual(deriveConditionalCandidates80(p,"Shoes",trusted,sealedAt,lockAt),
    {status:"abstain",alternatives:[]});
});
