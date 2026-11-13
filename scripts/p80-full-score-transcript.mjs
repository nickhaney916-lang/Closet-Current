/**
 * Parallel #80 — fail-closed, offline FULL VOCABULARY score transcript check.
 * No network, file access, training, photos, model inference or label access.
 *
 * This verifies INTERNAL consistency between an independently scorer-signed
 * transcript and proposed candidates. A signer might still forge both: this
 * does NOT prove that FashionCLIP ran, that weights are genuine, that an
 * operator is independent, or that human ground truth is trustworthy.
 */
import {CATEGORIES, canonical, isHex64} from "./p75-dataset-core.mjs";
import {localCandidates} from "../public/local-catalog.mjs";
import {POLICY} from "../public/subtype-review-80.mjs";

export const PROOF_SCHEMA80="p80-private-full-score-transcript-v1";
const hex40=x=>typeof x==="string"&&/^[a-f0-9]{40}$/.test(x);
const exact=(v,keys)=>v!==null&&typeof v==="object"&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&
  keys.every(k=>Object.hasOwn(v,k)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),"value"));
const time=s=>typeof s==="string"&&/^\d{4}-\d\d-\d\dT/.test(s)&&
  Number.isFinite(Date.parse(s))?Date.parse(s):NaN;
const vocabulary=Object.freeze(localCandidates.map(r=>r.label).sort());
if(new Set(vocabulary).size!==localCandidates.length)throw Error("P80_INVALID_VOCAB");
const byLabel=new Map(localCandidates.map(c=>[c.label,c]));
const truthyCategories=new Set(Object.keys(CATEGORIES));

/** Returns sorted full scores, or null. All 47 frozen labels, two views. */
function completeView80(rows) {
  if (!Array.isArray(rows)||rows.length!==vocabulary.length ||
      rows.length<2||rows.length>POLICY.maxRows)return null;
  const seen=new Set(),out=[];
  let sum=0;
  for(const r of rows){
    if(!exact(r,["label","score"])||
       !byLabel.has(r.label)||seen.has(r.label)||
       typeof r.score!=="number"||!Number.isFinite(r.score)||
       r.score<0||r.score>1)return null;
    seen.add(r.label);
    sum+=r.score;
    out.push({label:r.label,score:r.score,...byLabel.get(r.label)});
  }
  if(seen.size!==vocabulary.length||Math.abs(sum-1)>0.0001)return null;
  return out.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}

/**
 * Relabels are impossible without changing the signed full score arrays.
 * Conservative P80 candidate projection: require compatible top categories,
 * agreement on top garment, adequate two-view margin and absolute support.
 * All weak/conflicted cases return abstain with ZERO candidate alternatives.
 */
export function deriveConditionalCandidates80(proof,operatorCategory,trusted,scoreSealAt,categoryLockedAt) {
  if(!truthyCategories.has(operatorCategory)||!trusted||
     !exact(proof,[
       "schema","sourceSha256","inputSha256","modelArtifactSha256",
       "model","computedAt","views",
     ]) || proof.schema!==PROOF_SCHEMA80 ||
     !isHex64(proof.sourceSha256)||proof.inputSha256!==proof.sourceSha256 ||
     !isHex64(proof.modelArtifactSha256)||
     proof.modelArtifactSha256!==trusted.modelSha256 ||
     !exact(proof.model,["name","revision","vectorsSha256","sourceCodeSha256"])||
     proof.model.name!=="ff13/fashion-clip"||
     !hex40(proof.model.revision)||
     proof.model.revision!==trusted.modelRevision||
     !isHex64(proof.model.vectorsSha256)||
     proof.model.vectorsSha256!==trusted.vectorsSha256||
     !isHex64(proof.model.sourceCodeSha256)||
     proof.model.sourceCodeSha256!==trusted.workerSourceCodeSha256||
     !exact(proof.views,["whole","confirmation"])||
     !(time(categoryLockedAt)<time(proof.computedAt) &&
       time(proof.computedAt)<=time(scoreSealAt)))return null;
  const a=completeView80(proof.views.whole),b=completeView80(proof.views.confirmation);
  if(!a||!b)return null;
  const abstain=()=>({status:"abstain",alternatives:[]});
  if(a[0].category!==operatorCategory||b[0].category!==operatorCategory||
      a[0].label!==b[0].label)return abstain();
  if(a[0].score-a[1].score<POLICY.margin||
     b[0].score-b[1].score<POLICY.margin)return abstain();

  const confirmation=new Map(b.map(x=>[x.label,x.score]));
  const candidates=a.filter(x=>x.category===operatorCategory)
    .map(x=>({
      category:operatorCategory,itemType:x.itemType,
      relativeScore:Math.min(x.score,confirmation.get(x.label)),
    }))
    .sort((x,y)=>y.relativeScore-x.relativeScore||
      x.itemType.localeCompare(y.itemType));
  const first=candidates[0];
  if(!first||first.relativeScore<POLICY.minimum||
      first.relativeScore-(candidates[1]?.relativeScore||0)<POLICY.margin)
    return abstain();
  const alternatives=candidates.filter(x=>
    x.relativeScore>=Math.max(0.02,first.relativeScore*0.1))
    .slice(0,POLICY.maxCandidates)
    .map((x,i)=>({...x,rank:i+1}));
  return alternatives.length?{status:"hypotheses",alternatives}:abstain();
}

/** Score transcript AND deterministic candidate projection are immutable
 * contents of the separate signer seal (source set and entire proof digest). */
export function validateFullScoreProofs80(proofs,predictions,trusted,seal,categoryLock) {
  if(!Array.isArray(proofs)||!Array.isArray(predictions)||
     proofs.length!==predictions.length||proofs.length<60||
     proofs.length>500||!Array.isArray(categoryLock?.rows)||
     categoryLock.rows.length!==proofs.length)return false;
  const bySource=new Map();
  for(const proof of proofs){
    if(!proof||!isHex64(proof.sourceSha256)||bySource.has(proof.sourceSha256))
      return false;
    bySource.set(proof.sourceSha256,proof);
  }
  const categories=new Map(categoryLock.rows.map(x=>[x.sourceSha256,x.operatorCategory]));
  if(categories.size!==categoryLock.rows.length)return false;
  const seen=new Set();
  for(const prediction of predictions){
    const sha=prediction?.sourceSha256;
    if(!isHex64(sha)||seen.has(sha)||!bySource.has(sha)||
       !categories.has(sha))return false;
    seen.add(sha);
    const result=deriveConditionalCandidates80(bySource.get(sha),
      categories.get(sha),trusted,seal.scoredAt,categoryLock.recordedAt);
    if(!result||result.status!==prediction.status||
       prediction.itemType!=="Unknown"||
       prediction.automaticallyCertified!==false||
       prediction.requiresOwnerConfirmation!==true||
       !Array.isArray(prediction.alternatives)||
       result.alternatives.length!==prediction.alternatives.length)return false;
    for(let i=0;i<result.alternatives.length;i++){
      const expected=result.alternatives[i],actual=prediction.alternatives[i];
      if(!actual||actual.category!==expected.category||
         actual.itemType!==expected.itemType||
         actual.rank!==expected.rank||
         !Number.isFinite(actual.relativeScore)||
         Math.abs(actual.relativeScore-expected.relativeScore)>1e-10)
        return false;
    }
  }
  return seen.size===categoryLock.rows.length;
}
