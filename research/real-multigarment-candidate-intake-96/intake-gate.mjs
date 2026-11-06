/**
 * PRIORITY96 — Real multi-garment candidate intake. Quarantine ONLY.
 * Two previously real-ONNX-tested licensed public JPEGs are not part of the
 * frozen 59-photo benchmark. The historical single-reviewer's proposed
 * regions ARE NOT independent truth, and model exposure excludes locked tests.
 */
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const SHA=/^[a-f0-9]{64}$/;
const VALID_ID=/^[a-z0-9][a-z0-9-]{4,70}$/;
const VALID_SCENARIOS=new Set(['overlapping-clothing','multiple-garments-flatlay']);
const EXACT_LICENSES=new Map([
 ['CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0/'],
 ['CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/']
]);
const fail=s=>{throw Error('INTAKE96 '+s);};
const sha=b=>createHash('sha256').update(b).digest('hex');
const clean=x=>x&&typeof x==='object'&&!Array.isArray(x);
const wikimediaURL=x=>{
 try{
  const u=new URL(x);
  if(u.protocol!=='https:'||u.hostname!=='upload.wikimedia.org'||
   u.username||u.password||u.port||u.search||u.hash||
   !u.pathname.startsWith('/wikipedia/commons/'))return false;
  return true;
 }catch{return false;}
};
export const TARGET_SCIENCE_96=Object.freeze({
 minimumTotal:100,minimumLockedGarments:30,minimumLockedNegatives:10,
 minimumPerCategory:5,minimumIndependentHumanReviewers:2,
 additionalSourcesNeededFrom59:41
});
export function validateCandidateIntake96({manifest,lockedSources,pilotSources}={}){
 if(!clean(manifest)||manifest.schema!=='closet-current-multigarment-source-intake-96/v1'||
   manifest.researchOnly!==true||manifest.existingFrozenSources!==59||
   manifest.lockedEvaluationModified!==false||
   manifest.priorModelSeen!==true||
   manifest.realHumanInstanceMasks!==0||
   manifest.additionalAcceptedScientificPhotos!==0||
   manifest.licenseVerification!=='ATTRIBUTION_RECORDED_NOT_INDEPENDENTLY_LEGALLY_ADJUDICATED'||
   !Array.isArray(manifest.candidates)||manifest.candidates.length!==2||
   !Array.isArray(lockedSources)||lockedSources.length!==59||
   !Array.isArray(pilotSources))fail('invalid frozen cohort or unapproved candidate-science claims');
 const byPilot=new Map(pilotSources.map(x=>[x.id,x]));
 const seenIDs=new Set(),seenHash=new Set();
 const lockedHashes=new Set(),lockedIds=new Set();
 for(const s of lockedSources){
  if(!VALID_ID.test(s.id||'')||!SHA.test(s.sha256||'')||
    s.verified!==true||!s.attribution?.source||!s.attribution?.license||
    lockedIds.has(s.id)||lockedHashes.has(s.sha256))
    fail('historical frozen 59-source manifest invalid');
  lockedIds.add(s.id);lockedHashes.add(s.sha256);
 }
 for(const row of manifest.candidates){
  if(!VALID_ID.test(row?.id||'')||
   !['two-shirts','flatlay-outfit'].includes(row.existingPilotId)||
   !/^[a-z0-9-]+\.jpg$/.test(row.filename||'')||
   !VALID_SCENARIOS.has(row.scenario)||
   !SHA.test(row.sha256||'')||!Number.isInteger(row.bytes)||row.bytes<5000||
   !Number.isInteger(row.width)||row.width<200||
   !Number.isInteger(row.height)||row.height<200||
   row.originalModelSeen!==true||
   row.independentHumanAnnotation!==false||
   row.independentGarmentCount!==null||
   !wikimediaURL(row.downloadUrl)||
   !clean(row.provenance)||
   !EXACT_LICENSES.has(row.provenance.license)||
   row.provenance.licenseUrl!==EXACT_LICENSES.get(row.provenance.license)||
   !row.provenance.title||!row.provenance.author||
   !row.provenance.source?.startsWith('https://commons.wikimedia.org/wiki/File:')||
   seenIDs.has(row.id)||seenHash.has(row.sha256)||
   lockedIds.has(row.id)||lockedHashes.has(row.sha256))
   fail('unverified provenance, missing real source or duplicate source candidate');
  const pilot=byPilot.get(row.existingPilotId);
  if(!pilot||pilot.sha256!==row.sha256||
   pilot.source!==row.downloadUrl||pilot.bytes!==row.bytes||
   pilot.width!==row.width||pilot.height!==row.height||
   pilot.attribution?.license!==row.provenance.license||
   pilot.attribution?.source!==row.provenance.source||
   pilot.attribution?.author!==row.provenance.author||
   pilot.attribution?.title!==row.provenance.title)
   fail('candidate source contradicts the pre-existing genuine pilot photo evidence');
  seenIDs.add(row.id);seenHash.add(row.sha256);
 }
 if(seenIDs.size!==2||manifest.candidates.map(x=>x.existingPilotId).sort().join(',')!=='flatlay-outfit,two-shirts')
  fail('must match two exact real model-seen original photo references');
 return Object.freeze({
  existingFrozen:59,quarantinedCandidates:2,
  historicalScienceSourceCount:59,promotedIndependentHumanLabeledSources:0,
  modelSeenCandidateCount:2,currentlyMissingTo100:41,
  allCandidatesResearchOnly:true,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
export async function verifyOriginalCandidateJPEG96(row,bytes){
 if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array))
  fail('original photo must arrive as real JPEG bytes');
 const data=Buffer.from(bytes);
 if(data.length!==row.bytes||sha(data)!==row.sha256)
  fail('original JPEG byte length or SHA-256 changed');
 const meta=await sharp(data,{failOn:'truncated'}).metadata();
 if(meta.format!=='jpeg'||meta.width!==row.width||meta.height!==row.height)
  fail('original JPEG image format or dimensions changed');
 if(meta.pages!==undefined&&meta.pages!==1)fail('unexpected multi-page original photo');
 return Object.freeze({id:row.id,sourceSHA256:row.sha256,
  width:meta.width,height:meta.height,bytes:data.length,originalVerified:true});
}
export async function perceptualFingerprintJPEG96(bytes){
 const {data,info}=await sharp(bytes,{failOn:'truncated'})
  .rotate().greyscale().resize(9,8,{fit:'fill'})
  .raw().toBuffer({resolveWithObject:true});
 if(info.width!==9||info.height!==8||info.channels!==1||data.length!==72)
  fail('unexpected near-duplicate digest dimensions');
 let value=0n;
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  value=(value<<1n)|BigInt(data[y*9+x]>data[y*9+x+1]?1:0);
 }
 return value.toString(16).padStart(16,'0');
}
export function hammingDistance64_96(a,b){
 if(!/^[0-9a-f]{16}$/.test(a)||!/^[0-9a-f]{16}$/.test(b))
  fail('unverified 64-bit photo perceptual hash');
 let n=BigInt('0x'+a)^BigInt('0x'+b),count=0;
 while(n){count+=Number(n&1n);n>>=1n;}
 return count;
}
export async function auditCandidateCohort96({
 manifest,lockedSources,pilotSources,readLockedJPEG,fetchCandidateBytes
}={}){
 const verified=validateCandidateIntake96({manifest,lockedSources,pilotSources});
 if(typeof readLockedJPEG!=='function'||typeof fetchCandidateBytes!=='function')
  fail('real-byte source reader required');
 const fingerprints=[],seenHashes=new Set(),seenIDs=new Set();
 let totalFrozenBytes=0;
 for(const row of lockedSources){
  const bytes=Buffer.from(await readLockedJPEG(row));
  if(sha(bytes)!==row.sha256)fail('frozen original 59-JPEG byte mismatch: '+row.id);
  const meta=await sharp(bytes,{failOn:'truncated'}).metadata();
  if(meta.format!=='jpeg'||!meta.width||!meta.height)fail('frozen source not decodable '+row.id);
  totalFrozenBytes+=bytes.length;
  fingerprints.push({id:row.id,sourceSHA256:row.sha256,
   dHash64:await perceptualFingerprintJPEG96(bytes)});
  seenHashes.add(row.sha256);seenIDs.add(row.id);
 }
 const audit=[],dhashes=[];
 for(const c of manifest.candidates){
  if(seenHashes.has(c.sha256)||seenIDs.has(c.id))
   fail('source duplicate detected after full frozen byte read');
  const original=Buffer.from(await fetchCandidateBytes(c));
  await verifyOriginalCandidateJPEG96(c,original);
  const dHash64=await perceptualFingerprintJPEG96(original);
  const near=fingerprints.concat(dhashes).map(x=>({
   id:x.id,distance:hammingDistance64_96(dHash64,x.dHash64)
  })).filter(x=>x.distance<=6).sort((a,b)=>a.distance-b.distance);
  audit.push({
   id:c.id,existingPilotId:c.existingPilotId,sourceSHA256:c.sha256,
   sourceLicense:c.provenance.license,sourceAttributionPage:c.provenance.source,
   originalJPEGBytesVerified:true,sourceDimensionsVerified:true,
   dHash64,possibleVisualNearDuplicate:near.length>0,
   nearDuplicateMatches:near,
   previouslyModelSeen:true,independentlyHumanLabeled:false,
   scientificallyEligibleForFrozenHoldout:false,
   reviewState:near.length?'POSSIBLE_NEAR_DUPLICATE_MANUAL_REVIEW':'QUARANTINED_PENDING_INDEPENDENT_REVIEW',
   approvedForModelAccuracy:false
  });
  dhashes.push({id:c.id,dHash64});
 }
 return {
  schema:'closet-current-source-intake-96/audit-v1',
  existingFrozenOriginalJPEGsVerified:verified.existingFrozen,
  existingOriginalTotalBytesRead:totalFrozenBytes,
  newlyByteVerifiedCandidateJPEGs:audit.length,
  cohortContainsNow:59,
  researchQuarantinedCandidateCount:audit.length,
  additionalAcceptedScientificPhotos:0,
  additionalIndependentHumanInstanceTruth:0,
  sourceMinimumStillMissing:41,
  sourceSampleSizeGatePassed:false,
  allInputsPreviouslyModelSeen:true,
  candidatePhotoPacketsMayBeReleasedForBlindHumanReview:false,
  // Prior model exposure can only permit developmental diagnostics;
  // never present such photographs as fresh unseen locked evaluation data.
  lockedEvaluationUntouched:true,
  realModelAccuracyRecalculated:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  candidates:audit
 };
}
