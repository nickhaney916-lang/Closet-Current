#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {auditCandidateCohort96} from '../research/real-multigarment-candidate-intake-96/intake-gate.mjs';
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const manifest=await json('research/real-multigarment-candidate-intake-96/candidate-manifest.json');
const locked=await json('benchmark/locked-photo-sources.json');
const pilot=await json('research/multi-review-triage-28/frozen-photo-annotations-16.json');
const fetchPinnedOriginal=async row=>{
 let error='';
 for(let attempt=0;attempt<5;attempt++){
  if(attempt)await delay(1200*(attempt+1));
  try{
   const url=new URL(row.downloadUrl);
   if(url.protocol!=='https:'||url.host!=='upload.wikimedia.org')
    throw Error('non-allowlisted remote photo host');
   const r=await fetch(url,{redirect:'manual',
    headers:{'User-Agent':'ClosetCurrentLicensedPhotoSourceVerification96/1.0'},
    signal:AbortSignal.timeout(90000)});
   if(!r.ok||r.status!==200||r.redirected)
    throw Error('original Wikimedia request not HTTP 200: '+r.status);
   const bytes=Buffer.from(await r.arrayBuffer());
   if(bytes.length>10*1024*1024)throw Error('oversized original JPEG response');
   return bytes;
  }catch(e){error=e.message;}
 }
 throw Error('SOURCE96 original Wikimedia JPEG unavailable or different: '+row.id+' '+error);
};
const result=await auditCandidateCohort96({
 manifest,lockedSources:locked,pilotSources:pilot,
 readLockedJPEG:row=>readFile('benchmark/fixtures/'+row.image),
 fetchCandidateBytes:fetchPinnedOriginal
});
assert.equal(result.newlyByteVerifiedCandidateJPEGs,2);
assert.equal(result.additionalAcceptedScientificPhotos,0);
assert.equal(result.sourceMinimumStillMissing,41);
assert.equal(result.releaseAuthorized,false);
assert.equal(result.lockedEvaluationUntouched,true);
const dir='benchmark/real-multigarment-candidate-intake-96';
await mkdir(dir,{recursive:true});
await writeFile(dir+'/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('SOURCE96 two *real* new-to-59 Wikimedia original JPEGs independently byte SHA/format/dimensions verified, visually compared with frozen 59 source fingerprints; BOTH QUARANTINED, previously model-seen; zero independent human truth, 41 unique sources still needed. NO DEPLOY. '+JSON.stringify(result.candidates.map(x=>({id:x.id,status:x.reviewState,near:x.nearDuplicateMatches}))));
