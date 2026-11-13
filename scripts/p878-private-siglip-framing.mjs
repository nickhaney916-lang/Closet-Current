#!/usr/bin/env node
/**
 * Mission 1 P878: PRIVATE, source-disjoint, two-human-approved matched
 * baseline/full-frame SigLIP research handoff.
 *
 * This NEVER runs private labels, images, or scoring in CI, and never
 * authorizes release or alters model weights. A signed transcript is NOT
 * independent proof that a vision model actually ran or that people are real:
 * those facts require external scorer/registrar custody.
 */
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createPublicKey,verify as verifySignature} from 'node:crypto';
import {canonical,sha256,isHex64,CATEGORIES} from './p75-dataset-core.mjs';
import {externalPath} from './p79-workstation-core.mjs';
import {evaluatePrivateBlind80} from './p80-private-blind-evaluator.mjs';
import {MODELS81} from '../public/model-arbitration-81.mjs';
import {MODEL_ASSETS82} from '../public/dual-core-82.mjs';
import {localCandidates} from '../public/local-catalog.mjs';

export const PAIR_SCHEMA878='p878-private-paired-full-frame-v1';
export const SEAL_SCHEMA878='p878-private-paired-score-seal-v1';
export const POLICY_SCHEMA878='p878-preapproved-full-frame-policy-v1';
const minN=60,maxN=60,hex40=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const exact=(x,fields)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const blocked=reason=>({schema:PAIR_SCHEMA878,status:'BLOCKED',reason,scoredSources:0,
  baselineTop1Consensuses:null,alternativeTop1Consensuses:null,
  pairedImprovements:null,pairedRegressions:null,releaseAuthorized:false,
  independentlyVerifiedSubtypeAccuracy:null,shouldLiftFamilyAlphaHold:false});
const date=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT/.test(s)&&
 Number.isFinite(Date.parse(s))?Date.parse(s):NaN;
const vocab=new Map(localCandidates.map((x,i)=>[x.label,{...x,index:i}]));
const labels=Object.freeze(localCandidates.map(x=>x.label));

export function policy878(targetCommit){
 if(!hex40(targetCommit))throw Error('P878_TARGET_COMMIT');
 return {schema:POLICY_SCHEMA878,targetCommit,modelId:MODELS81.fashionSiglip.id,
  modelRevision:MODELS81.fashionSiglip.revision,
  vectorSha256:MODEL_ASSETS82.fashionSiglip.vectorsSha256,
  original:'processor-defined-original-image',alternate:'fitWholePhoto224-white',
  pairedFamilyIndependent:false,automaticCertification:false};
}
export function rank878(rank){
 if(!Array.isArray(rank)||rank.length!==labels.length||new Set(rank.map(x=>x?.label)).size!==labels.length)return false;
 for(let i=0;i<rank.length;i++){
  const x=rank[i];
  if(!exact(x,['label','score'])||!vocab.has(x.label)||!Number.isFinite(x.score)||
     x.score < -1.00001||x.score > 1.00001||
     (i>0&&(rank[i-1].score<x.score||
       (rank[i-1].score===x.score&&rank[i-1].label.localeCompare(x.label)>0))))return false;
 }
 return true;
}
export function validPair878(pair,targetCommit){
 const keys=['schema','sourceSha256','inputSha256','targetCommit','modelKey',
  'modelRevision','vectorSha256','workerSourceCodeSha256','baseline','alternate',
  'sameModelNotIndependent','automaticAdmissions'];
 return exact(pair,keys)&&pair.schema===PAIR_SCHEMA878&&isHex64(pair.sourceSha256)&&
  pair.inputSha256===pair.sourceSha256&&pair.targetCommit===targetCommit&&
  pair.modelKey==='fashionSiglip'&&pair.modelRevision===MODELS81.fashionSiglip.revision&&
  pair.vectorSha256===MODEL_ASSETS82.fashionSiglip.vectorsSha256&&
  isHex64(pair.workerSourceCodeSha256)&&
  pair.sameModelNotIndependent===true&&pair.automaticAdmissions===0&&
  rank878(pair.baseline)&&rank878(pair.alternate);
}
export function verifySignedPair878(pairs,seal,trusted,baseSeal,{now=Date.now()}={}){
 if(!Array.isArray(pairs)||pairs.length!==minN||!Number.isFinite(now)||!trusted||!baseSeal||
    !hex40(trusted.targetCommit)||!isHex64(trusted.scorerFingerprint)||
    !isHex64(trusted.p878PolicySha256)||
    trusted.p878PolicySha256!==sha256(canonical(policy878(trusted.targetCommit)))||
    !exact(seal,['schema','targetCommit','policySha256','pairSha256','precedingSealSha256',
        'sourceCount','scoredAt','publicKey','signature'])||
    seal.schema!==SEAL_SCHEMA878||seal.targetCommit!==trusted.targetCommit||
    seal.policySha256!==trusted.p878PolicySha256||
    seal.pairSha256!==sha256(canonical(pairs))||
    seal.precedingSealSha256!==sha256(canonical(baseSeal))||
    seal.sourceCount!==pairs.length||
    !Number.isFinite(date(seal.scoredAt))||date(seal.scoredAt)>now||
    now-date(seal.scoredAt)>30*86400000||
    !(date(trusted.approvedAt)<date(seal.scoredAt))||
    !(date(baseSeal.scoredAt)<=date(seal.scoredAt))||
    pairs.some(x=>!validPair878(x,trusted.targetCommit))||
    new Set(pairs.map(x=>x.sourceSha256)).size!==pairs.length)return false;
 try{
  const key=createPublicKey(seal.publicKey);
  if(key.asymmetricKeyType!=='ed25519'||
     sha256(key.export({type:'spki',format:'der'}))!==trusted.scorerFingerprint)return false;
  const {signature,publicKey,...payload}=seal;
  return verifySignature(null,Buffer.from(canonical(payload)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
/** Arithmetic only on already externally authenticated independent humans
 * and a matched signed scorer transcript. Synthetic examples are NOT accuracy. */
export function summarizePairs878(verifiedPairs){
 if(!Array.isArray(verifiedPairs)||verifiedPairs.length!==minN)throw Error('P878_NOT_ENOUGH_VERIFIED_SOURCES');
 let before=0,after=0,gained=0,lost=0,changed=0;
 const uniq=new Set();
 for(const x of verifiedPairs){
  const truth=x?.labels,pair=x?.pair;
  if(!validPair878(pair,pair?.targetCommit)||uniq.has(pair.sourceSha256)||
      truth?.presence!=='single-garment'||truth.instanceCount!==1||
      truth.wardrobeUnit!=='single-unit'||
      !CATEGORIES[truth.category]?.includes(truth.subtype)||
      truth.subtype==='Other'||truth.subtype==='Unknown'||
      Object.keys(truth.quality||{}).length!==4||
      Object.values(truth.quality||{}).some(v=>v!=='ok'))throw Error('P878_SOURCE_OR_LABEL_NOT_ELIGIBLE');
  uniq.add(pair.sourceSha256);
  const b=vocab.get(pair.baseline[0].label),a=vocab.get(pair.alternate[0].label);
  const bHit=b.category===truth.category&&b.itemType===truth.subtype;
  const aHit=a.category===truth.category&&a.itemType===truth.subtype;
  before+=Number(bHit);after+=Number(aHit);
  gained+=Number(!bHit&&aHit);lost+=Number(bHit&&!aHit);
  changed+=Number(b.label!==a.label);
 }
 if(after!==before+gained-lost)throw Error('P878_ARITHMETIC');
 return {schema:PAIR_SCHEMA878,status:'PRIVATE_RESEARCH_ONLY_NOT_RELEASE',
  scoredSources:verifiedPairs.length,baselineTop1Consensuses:before,
  alternativeTop1Consensuses:after,pairedImprovements:gained,pairedRegressions:lost,
  changedFirstRanks:changed,sameWeightsDifferentFraming:true,
  candidateIsNotIndependentlyValidated:true,
  independentlyVerifiedSubtypeAccuracy:null,releaseAuthorized:false,
  shouldLiftFamilyAlphaHold:false};
}

/** External trusted P80 source, permissions, independent annotation, review
 * and signed prior scorer seal MUST succeed first, before reading private labels.
 * There must also be a different, approved, precommitted SigLIP paired seal. */
export async function evaluatePrivatePairs878({bundle,receipts,operatorLock,predictions,proofs,
  seal,trusted,pairs,pairedSeal,now=Date.now()}={}){
 if(process.env.CI||process.env.GITHUB_ACTIONS)
  return blocked('private blind evidence never evaluated in CI');
 const upstream=await evaluatePrivateBlind80({bundle,receipts,operatorLock,predictions,proofs,
   seal,trusted,now});
 if(upstream.status!=='PRIVATE_RESEARCH_ONLY_NOT_RELEASE'||upstream.scoredSources!==minN)
  return blocked('missing independent original, two-human, operator and scorer validation');
 if(!verifySignedPair878(pairs,pairedSeal,trusted,seal,{now}))
  return blocked('untrusted or unapproved paired framing score receipt');
 if(!Array.isArray(bundle?.sources)||bundle.sources.length!==minN||
    !receipts||typeof receipts!=='object'||Array.isArray(receipts))
  return blocked('missing exact matched human-source cohort');
 const bySha=new Map(pairs.map(p=>[p.sourceSha256,p]));
 if(bySha.size!==minN||Object.keys(receipts).length!==minN)
  return blocked('wrong paired photo or human receipt cardinality');
 const verified=[];
 for(const item of bundle.sources){
  const sha=item?.source?.sha256,pair=bySha.get(sha),reviews=receipts[sha];
  if(!pair||!Array.isArray(reviews)||reviews.length!==2||
     canonical(reviews[0].labels)!==canonical(reviews[1].labels)||
     !reviews.every(r=>Number.isFinite(date(r.reviewedAt))&&date(r.reviewedAt)>date(pairedSeal.scoredAt)))
    return blocked('missing matched post-score human consensus');
  verified.push({pair,labels:reviews[0].labels});
 }
 let stats;try{stats=summarizePairs878(verified);}catch{
  return blocked('unscorable individual source; no silent denominator exclusions');
 }
 return stats;
}
async function main(){
 if(process.env.CI||process.env.GITHUB_ACTIONS){
  console.log('P878_PRIVATE_FRAME_AUDIT '+JSON.stringify(blocked('CI has no human blind evidence')));return;
 }
 const args=process.argv.slice(2);
 if(!args.length){
  console.log('P878_PRIVATE_FRAME_AUDIT '+JSON.stringify(blocked('independently vetted sources, reviewers, and scorer not supplied')));return;
 }
 if(args.length!==9)throw Error('Usage: p878-private-siglip-framing.mjs ABS_SOURCE_BUNDLE ABS_REVIEW_RECEIPTS ABS_OPERATOR_LOCK ABS_PREDICTIONS ABS_FULL_SCORE_PROOFS ABS_P80_SCORER_SEAL ABS_TRUSTED_FINGERPRINTS ABS_PAIRED_RANKS ABS_P878_PAIRED_SEAL');
 const data=[];
 for(const arg of args){
  const p=await externalPath(arg),s=await stat(p);
  if(!s.isFile()||s.size>16*1024*1024)throw Error('P878_EXTERNAL_EVIDENCE_LIMIT');
  data.push(JSON.parse(await readFile(p,'utf8')));
 }
 const result=await evaluatePrivatePairs878({bundle:data[0],receipts:data[1],
  operatorLock:data[2],predictions:data[3],proofs:data[4],seal:data[5],
  trusted:data[6],pairs:data[7],pairedSeal:data[8]});
 console.log('P878_PRIVATE_FRAME_AUDIT '+JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=3;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
