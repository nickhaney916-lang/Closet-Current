/**
 * SOURCE97 — genuine *candidate* Wikimedia JPEG source intake only.
 * No recognizer, no model scoring, no human masks, no customer photos.
 * Important: discovering SHA on a network response is not a pinned,
 * independently source-identical photograph. Strict mode requires all seven
 * published SHA+length receipts to match a second genuine download.
 */
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {perceptualFingerprintJPEG96,hammingDistance64_96}
 from '../real-multigarment-candidate-intake-96/intake-gate.mjs';

const SHA=/^[a-f0-9]{64}$/;
const ID=/^r97-[a-z-]{6,50}$/;
const TYPES=new Set(['folded-multiple-items','mixed-outfit-with-footwear',
 'non-garment-control-candidate','occluded-overlapping-clothes',
 'hanger-closeup-and-background','lowlight-color-and-occlusion',
 'crowded-colorful-rack']);
const LICENSES=new Map([
 ['CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'],
 ['CC BY 2.0','https://creativecommons.org/licenses/by/2.0/'],
 ['CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'],
 ['CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/'],
 ['Public domain (author dedication)','https://commons.wikimedia.org/wiki/File:Clothing.jpg']
]);
const throwError=(msg)=>{throw Error('SOURCE97 '+msg);};
const hex=bytes=>createHash('sha256').update(bytes).digest('hex');
const validObject=x=>x&&typeof x==='object'&&!Array.isArray(x);
const exactKeys=(x,allowed)=>Object.keys(x).every(k=>allowed.includes(k));
function parseURL(url,host,pathPrefix){
 try{
  const u=new URL(url);
  return u.protocol==='https:'&&u.hostname===host&&!u.username&&!u.password&&
   !u.port&&!u.search&&!u.hash&&u.pathname.startsWith(pathPrefix);
 }catch{return false;}
}
export function verifyProvenance97({manifest,original59,quarantined96,requirePinned=true}={}){
 if(!validObject(manifest)||manifest.schema!=='closet-current-original-source-candidate-intake-97/v1'||
    manifest.researchOnly!==true||manifest.frozenOriginalCount!==59||
    manifest.previousModelExposedQuarantinedCount!==2||
    manifest.existingHoldoutNeverRepartitioned!==true||
    manifest.currentVerifiedHumanInstanceMasks!==0||
    manifest.independentRealHumanReviews!==0||
    manifest.scientificAcceptedCandidateCount!==0||
    manifest.candidateExposurePolicy!=='NOT_AUDITED_FOR_MODEL_EXPOSURE_CANNOT_RESERVE_AS_UNSEEN_TEST'||
    manifest.possibleFutureSourceCount!==7||
    !Array.isArray(manifest.candidates)||manifest.candidates.length!==7||
    !Array.isArray(original59)||original59.length!==59||
    !Array.isArray(quarantined96)||quarantined96.length!==2)
  throwError('source cohorts or research-only scientific HOLD not preserved');
 const shaSeen=new Set(),urlSeen=new Set(),ids=new Set(),sourceH=null;
 for(const row of [...original59,...quarantined96]){
  const hash=row.sha256;
  const url=row.downloadUrl||row.originalURL;
  if(!SHA.test(hash||'')||shaSeen.has(hash))throwError('frozen or older quarantine SHA invalid or duplicate');
  shaSeen.add(hash);
  if(url&&urlSeen.has(url))throwError('existing source URL duplicate');
  if(url)urlSeen.add(url);
  if(ids.has(row.id))throwError('frozen source ID duplicate');
  ids.add(row.id);
 }
 const local=new Set();
 for(const c of manifest.candidates){
  if(!validObject(c)||!ID.test(c.id||'')||
     typeof c.originFileName!=='string'||!/^[A-Za-z0-9 _(),.-]+\.jpg$/i.test(c.originFileName)||
     !parseURL(c.originalURL,'upload.wikimedia.org','/wikipedia/commons/')||
     !parseURL(c.commonsPage,'commons.wikimedia.org','/wiki/File:')||
     !LICENSES.has(c.license)||c.licenseURL!==LICENSES.get(c.license)||
     typeof c.author!=='string'||!c.author||c.author.length>100||
     !TYPES.has(c.scenarioForSourceCoverageOnly)||
     c.originalURL.split('/').pop()!==encodeURIComponent(c.originFileName).replace(/%20/g,'_')&&
       c.originalURL.split('/').pop()!==c.originFileName.replaceAll(' ','_')&&
       c.originalURL.split('/').pop()!==c.originFileName.replace(/[(]/g,'%28').replace(/[)]/g,'%29').replaceAll(' ','_')||
     !Number.isInteger(c.advertisedWidth)||c.advertisedWidth<300||
     !Number.isInteger(c.advertisedHeight)||c.advertisedHeight<300||
     c.publishedLicenseSource!=='Wikimedia Commons file page; independent legal review pending'||
     c.humanLabel!==null||!Array.isArray(c.humanInstanceMasks)||c.humanInstanceMasks.length!==0||
     c.independentHumanReview!==false||c.knownModelExposure!=='NOT_AUDITED'||
     c.holdoutEligible!==false||c.quarantine!==true||
     ids.has(c.id)||local.has(c.id)||urlSeen.has(c.originalURL))
    throwError('invalid, unlicensed, model-exposed, unsafely sourced or incorrectly relabeled candidate '+c?.id);
  if(requirePinned){
   if(!SHA.test(c.pinnedSourceSHA256||'')||
      !Number.isInteger(c.pinnedOriginalBytes)||c.pinnedOriginalBytes<10000||
      c.pinnedOriginalBytes>15*1024*1024||shaSeen.has(c.pinnedSourceSHA256))
    throwError('exact real original JPEG SHA+size must be independently pinned '+c.id);
   shaSeen.add(c.pinnedSourceSHA256);
  }else if(c.pinnedSourceSHA256!==null||c.pinnedOriginalBytes!==null)
    throwError('discovery cannot silently accept half-pinned or already-certified source');
  local.add(c.id);ids.add(c.id);urlSeen.add(c.originalURL);
 }
 if(local.size!==7)throwError('seven distinct real source candidate IDs required');
 return {candidateCount:7,existingFrozen:59,oldQuarantine:2,
  additionalScientificAcceptance:0,sourceGapUntil100:41,
  originalSHAReceiptsPinned:requirePinned,modelAccuracyMeasured:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
export async function verifySourceOriginal97(candidate,raw,{requirePinned=true}={}){
 if(!(raw instanceof Uint8Array))throwError('JPEG binary response required');
 const bytes=Buffer.from(raw);
 if(bytes.length<10000||bytes.length>15*1024*1024||
  bytes[0]!==0xff||bytes[1]!==0xd8)
  throwError('original JPEG binary size or SOI marker invalid');
 const sha=hex(bytes);
 if(requirePinned&&(sha!==candidate.pinnedSourceSHA256||
   bytes.length!==candidate.pinnedOriginalBytes))
  throwError('pinned JPEG bytes SHA-256 or length mismatched: '+candidate.id);
 const meta=await sharp(bytes,{failOn:'truncated'}).metadata();
 if(meta.format!=='jpeg'||meta.width!==candidate.advertisedWidth||
  meta.height!==candidate.advertisedHeight||
  (meta.pages!==undefined&&meta.pages!==1))
  throwError('decoded original JPEG width/height or format mismatched: '+candidate.id);
 const dHash64=await perceptualFingerprintJPEG96(bytes);
 return Object.freeze({id:candidate.id,sourceSHA256:sha,
  originalBytes:bytes.length,originalWidth:meta.width,
  originalHeight:meta.height,dHash64,bytesVerified:true,
  pinnedSourceReceiptMatches:requirePinned});
}
export async function auditRealSourceCohort97({
 manifest,original59,quarantined96,
 readFrozenPhoto,fetchPriorQuarantinePhoto,fetchOriginal,
 requirePinned=true
}={}){
 const gate=verifyProvenance97({manifest,original59,quarantined96,requirePinned});
 if(typeof readFrozenPhoto!=='function'||
  typeof fetchPriorQuarantinePhoto!=='function'||
  typeof fetchOriginal!=='function')
  throwError('real original-JPEG reader functions required; no simulated photos');
 const seen=new Map(),totalSources=[],newIDs=new Set();
 let oldOriginalBytes=0;
 for(const row of original59){
  const b=Buffer.from(await readFrozenPhoto(row));
  if(hex(b)!==row.sha256)throwError('a frozen original source changed '+row.id);
  const meta=await sharp(b,{failOn:'truncated'}).metadata();
  if(meta.format!=='jpeg'||!meta.width||!meta.height)
   throwError('frozen original JPEG undecodable '+row.id);
  totalSources.push({id:row.id,dHash64:await perceptualFingerprintJPEG96(b)});
  seen.set(row.sha256,row.id);oldOriginalBytes+=b.length;
 }
 for(const row of quarantined96){
  const b=Buffer.from(await fetchPriorQuarantinePhoto(row));
  if(hex(b)!==row.sha256||b.length!==row.bytes)
   throwError('P96 prior model-seen original source changed '+row.id);
  const meta=await sharp(b,{failOn:'truncated'}).metadata();
  if(meta.format!=='jpeg'||meta.width!==row.width||meta.height!==row.height)
   throwError('P96 prior model-seen original dimensions changed '+row.id);
  totalSources.push({id:row.id,dHash64:await perceptualFingerprintJPEG96(b)});
  seen.set(row.sha256,row.id);
 }
 const candidates=[];
 for(const candidate of manifest.candidates){
  const bytes=Buffer.from(await fetchOriginal(candidate));
  const proof=await verifySourceOriginal97(candidate,bytes,{requirePinned});
  if(seen.has(proof.sourceSHA256))
   throwError('actual new JPEG SHA matches an earlier original '+seen.get(proof.sourceSHA256));
  seen.set(proof.sourceSHA256,candidate.id);
  if(newIDs.has(candidate.id))throwError('reused source intake ID');
  newIDs.add(candidate.id);
  const near=totalSources.map(x=>({
   id:x.id,bitDistance:hammingDistance64_96(x.dHash64,proof.dHash64)
  })).filter(x=>x.bitDistance<=6).sort((a,b)=>a.bitDistance-b.bitDistance);
  totalSources.push({id:candidate.id,dHash64:proof.dHash64});
  candidates.push({
   id:candidate.id,scenarioForCoverageOnly:candidate.scenarioForSourceCoverageOnly,
   originalURL:candidate.originalURL,sourcePage:candidate.commonsPage,
   author:candidate.author,publishedLicense:candidate.license,
   originalSourceSHA256:proof.sourceSHA256,originalJPEGBytes:proof.originalBytes,
   width:proof.originalWidth,height:proof.originalHeight,
   perceptual64bitHash:proof.dHash64,possibleVisualDuplicates:near,
   sourceBytesVerified:true,pinnedSourceReceiptMatches:requirePinned,
   alreadyInFrozenCohort:false,quarantine:true,approvedForLockedEvaluation:false,
   confirmedIndependentHumanMasks:0,confirmedNoGarment:false,
   humanLabelVerified:false,modelNeverSeenVerified:false,
   reviewState:near.length?'NEAR_DUPLICATE_MANUAL_REVIEW_REQUIRED':
    requirePinned?'SHA_PINNED_QUARANTINED_HUMAN_REVIEW_REQUIRED':'DISCOVERED_SHA_PIN_PENDING',
   releaseAuthorized:false
  });
 }
 return {
  schema:'closet-current-new-real-originals-97/evidence-v1',
  exactSourceCountFrozen:gate.existingFrozen,
  oldModelExposedQuarantined:gate.oldQuarantine,
  newOriginalJPEGsDownloaded:candidates.length,
  newSourcesSHAIndependentlyPinned:requirePinned?candidates.length:0,
  distinctPhotoSHAsAcrossAll68:seen.size,
  frozenOriginalPhotoBytesVerified:oldOriginalBytes,
  sourcePoolOnlyCount:gate.existingFrozen+gate.oldQuarantine+candidates.length,
  frozenBenchmarkStill59:true,scientificallyAcceptedNewSources:0,
  futureIndependentEligibleSourceGapStill41:true,
  confirmedHumanInstanceMasks:0,independentHumanReviewers:0,
  modelNeverSeenStatus:'NOT_AUDITED_NOT_HELD_OUT',
  imageCategorySubtypeColorAccuracy:null,
  realModelInstanceIoU:null,
  sourceQualificationVerdict:requirePinned?'SHA_PINNED_BUT_QUARANTINED':'DISCOVERY_NOT_VERIFIED_PINNED',
  researchOnly:true,releaseAuthorized:false,familyAlpha:'HOLD',
  originalPhotosStoredInGit:false,originalPhotosPublishedToCI:false,
  candidates
 };
}
