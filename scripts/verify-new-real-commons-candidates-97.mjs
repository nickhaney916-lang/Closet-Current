#!/usr/bin/env node
/**
 * SOURCE97: first run --discover to produce exact remote SHA receipts.
 * Freeze those receipts in the reviewed research manifest, then run --strict
 * in a different commit/run, independently re-downloading every original.
 * No photo bytes, original model predictions or human-review output written.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {setTimeout as sleep} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditRealSourceCohort97} from '../research/new-real-commons-candidate-cohort-97/source-gate.mjs';
const discover=process.argv.includes('--discover'),strict=process.argv.includes('--strict');
if(discover===strict)throw Error('SOURCE97 select exactly --discover OR --strict');
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const manifest=await json('research/new-real-commons-candidate-cohort-97/source-candidates.json');
const old=await json('benchmark/locked-photo-sources.json');
const prior=await json('research/real-multigarment-candidate-intake-96/candidate-manifest.json');
const allowedURL=raw=>{
 const u=new URL(raw);
 if(u.protocol!=='https:'||u.hostname!=='upload.wikimedia.org'||
  !u.pathname.startsWith('/wikipedia/commons/')||u.search||u.hash||
  u.username||u.password||u.port)
  throw Error('SOURCE97 refuse nonoriginal or redirected external source');
 return u.toString();
};
// Wikimedia may apply per-IP/public-download rate limiting (HTTP 429).
// Honor Retry-After and pace EVERY original download. Never bypass the
// upstream host, accept a thumbnail or skip source-byte verification.
let nextAllowedDownload=0;
async function obtainOriginal(url,id){
 const exact=allowedURL(url);
 let reason='not requested';
 for(let n=0;n<6;n++){
  const remaining=nextAllowedDownload-Date.now();
  if(remaining>0)await sleep(remaining);
  nextAllowedDownload=Date.now()+18000;
  try{
   const r=await fetch(exact,{redirect:'manual',
    headers:{'User-Agent':'ClosetCurrentResearchOriginalPhotoVerification97/1.0 (independent JPEG science, no upload)'},
    signal:AbortSignal.timeout(70000)});
   if(r.status===429||r.status===503){
    const retryRaw=r.headers.get('retry-after')||'';
    const retrySeconds=/^\d+$/.test(retryRaw)?Number(retryRaw):0;
    const backoffMs=Math.max(25000*(n+1),Math.min(180000,retrySeconds*1000));
    nextAllowedDownload=Math.max(nextAllowedDownload,Date.now()+backoffMs);
    throw Error('Wikimedia HTTP '+r.status+'; honored retry-after/backoff '+backoffMs+'ms');
   }
   if(r.status!==200||r.redirected||
     !String(r.headers.get('content-type')||'').toLowerCase().includes('image/jpeg'))
    throw Error('Wikimedia original HTTP/content-type not JPEG 200 '+r.status);
   const length=Number(r.headers.get('content-length')||0);
   if(length>15*1024*1024)throw Error('refused oversized JPEG');
   const data=Buffer.from(await r.arrayBuffer());
   if(data.length<10000||data.length>15*1024*1024)
    throw Error('source JPEG missing or oversized');
   return data;
  }catch(e){reason=String(e?.message||e);}
 }
 throw Error('SOURCE97 cannot independently retrieve original '+id+': '+reason);
}
const proof=await auditRealSourceCohort97({
 manifest,original59:old,quarantined96:prior.candidates,
 readFrozenPhoto:row=>readFile('benchmark/fixtures/'+row.image),
 fetchPriorQuarantinePhoto:row=>obtainOriginal(row.downloadUrl,row.id),
 fetchOriginal:async row=>{
  const bytes=await obtainOriginal(row.originalURL,row.id);
  // Discovery logs are not an acceptance or independent SHA pin. Logging
  // the original response digest permits forensic review if later 429 occurs.
  if(discover)console.log('SOURCE97_UNPINNED_DOWNLOADED '+JSON.stringify({
   id:row.id,sha256:createHash('sha256').update(bytes).digest('hex'),
   bytes:bytes.length,discoveryNotVerifiedPinned:true
  }));
  return bytes;
 },
 requirePinned:strict
});
assert.equal(proof.distinctPhotoSHAsAcrossAll68,68);
assert.equal(proof.newOriginalJPEGsDownloaded,7);
assert.equal(proof.frozenOriginalPhotoBytesVerified,41198733);
assert.equal(proof.scientificallyAcceptedNewSources,0);
assert.equal(proof.releaseAuthorized,false);
assert.equal(proof.familyAlpha,'HOLD');
assert.equal(proof.confirmedHumanInstanceMasks,0);
if(strict)assert.equal(proof.newSourcesSHAIndependentlyPinned,7);
else assert.equal(proof.newSourcesSHAIndependentlyPinned,0);
const dir='benchmark/new-real-commons-candidate-cohort-97';
await mkdir(dir,{recursive:true});
await writeFile(dir+'/source-acceptance.json',JSON.stringify(proof,null,2)+'\n');
for(const c of proof.candidates){
 console.log('SOURCE97_DISCOVERED_ORIGINAL_SHA '+JSON.stringify({
  id:c.id,sha256:c.originalSourceSHA256,bytes:c.originalJPEGBytes,
  width:c.width,height:c.height,dHash64:c.perceptual64bitHash,
  nearDuplicates:c.possibleVisualDuplicates
 }));
}
console.log('SOURCE97 '+(strict?'PINNED_SECOND_INDEPENDENT_DOWNLOAD_PASS':'DISCOVERY_ONLY_SHA_PIN_PENDING')+
 ' 59 locked unchanged + 2 older model-exposed quarantine + 7 NEW real Commons original JPEGs. NO HUMAN LABELS, NO SCIENTIFIC PROMOTION. 41 scientifically eligible sources still missing. NO DEPLOY.');
