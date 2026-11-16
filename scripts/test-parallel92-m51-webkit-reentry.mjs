/**
 * P92 native WebKit repeat stress of EXACT M97 original-photo source/board mutations.
 * Real app, source JPEG, signed synthetic local DB and original assertions.
 * M89 owns failure classification; this test ONLY runs its unchanged script
 * repeatedly without retries, synthetic preview, product patches or image logs.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {join} from 'node:path';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD');
assert.equal(sha,process.env.P92_CHECKOUT_SHA,'must execute exact checked-out SHA');
const m97='238577c7fc61c4c3dcb9cea11483a00ebdb9ea1b';
assert.equal(git('merge-base',m97,sha),m97,'current M90 source not in ancestry');
const script='scripts/test-main51-real-app-owner-original-2d.mjs';
assert.equal(git('rev-parse','HEAD:'+script),
 '63cc9da00eaecbeb2576482dcae1528b44ea8189',
 'M97 native M51 source changed');
assert.equal(git('rev-parse','HEAD:public/app.js'),
 '991c00457799f8e2b8ae958d5ace85cc9914aece',
 'consumer changed outside test ownership');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),
 '42dc1a7a2503a1722e6addcd0b8613a7eb029b60',
 'Outfit Builder changed outside test ownership');
assert.equal(git('rev-parse','HEAD:scripts/test-mission3-default-atomic-import-browser.mjs'),
 '20f85d5eeda42f2acd921f1393c10cc7522d22df','M91 native import acceptance changed');
assert.ok(readFileSync(script,'utf8').includes("stage='m97-live-selected-original-photo-mutation-revokes-without-board-change'")&&
 readFileSync(script,'utf8').includes("stage='m97-inflight-changed-source-must-not-publish-stale-original'"),
 'M97 live and in-flight source revocation acceptance missing');
assert.ok(readFileSync(script,'utf8').includes('M88_SOURCE_SAFE_WEBKIT_PREVIEW_REFUSAL')&&
 readFileSync(script,'utf8').includes('__m89PreviewFailure'),
 'Missing main-owned M89 source-safe refusal diagnostics');
const total=Number(process.env.P92_REENTRY_RUNS||8);
assert.ok(Number.isSafeInteger(total)&&total>=2&&total<=12);
const path='benchmark/parallel92-webkit-reentry';
mkdirSync(path,{recursive:true});
const runs=[];
for(let trial=1;trial<=total;trial++){
 const started=Date.now();
 const r=spawnSync(process.execPath,[script],{
  encoding:'utf8',maxBuffer:12_000_000,timeout:600000,
  env:{...process.env,M51_ENGINE:'webkit'}
 });
 const log=(r.stdout||'')+'\n'+(r.stderr||'');
 const safe=log.split('\n').filter(x=>
  x.includes('M88_SOURCE_SAFE_WEBKIT_PREVIEW_REFUSAL ')||
  x.includes('MAIN51_APP_SOURCE_FAIL ')).map(line=>{
   const marker=line.includes('M88_SOURCE_SAFE_WEBKIT_PREVIEW_REFUSAL ')?
    'M88_SOURCE_SAFE_WEBKIT_PREVIEW_REFUSAL ':'MAIN51_APP_SOURCE_FAIL ';
   try{
    const v=JSON.parse(line.slice(line.indexOf(marker)+marker.length));
    if(marker.startsWith('M88'))
     return {kind:'native-refusal',viewerPhase:v.viewerPhase||'unknown',
      preflight:v.preflight||'unknown',preflightCategory:v.preflightCategory||null,
      internalFailureCategory:v.internalRefusal?.category||null,
      internalFailureType:v.internalRefusal?.type||null,
      internalTicketCurrent:v.internalRefusal?.ticketCurrent===true,
      boardInitialized:v.boardInitialized===true,
      boardHasSelection:v.boardHasSelection===true,
      eligibleSlots:Number.isFinite(v.eligibleSlots)?v.eligibleSlots:null};
    return {kind:'native-test-failed',stage:v.stage||'unknown',
      width:[320,390,430].includes(v.width)?v.width:null,
      errorName:v.errorName||'unknown'};
   }catch{return {kind:'parse-unavailable'};}
  });
 const row={trial,engine:'webkit',actualNativeApp:true,widths:[320,390,430],
  genuineLicensedSource:true,syntheticOwnerReview:true,
  elapsedMs:Date.now()-started,status:r.status===0?'PASS':'FAIL',
  sourceSafeRefusals:safe};
 runs.push(row);
 console.log('P92_M97_NATIVE_WEBKIT_REENTRY_TRIAL',JSON.stringify(row));
 if(r.error||r.status!==0){
  console.error('P92_M97_REENTRY_FAIL',JSON.stringify({
   trial,errorName:r.error?.name||null,exitCode:r.status,
   sourceSafeRefusals:safe}));
  break; // no retry masking
 }
}
const receipt={schema:'P92_M97_NATIVE_SOURCE_MUTATION_WEBKIT_REENTRY/v4',
 exactHead:sha,mainSourceM97:m97,
 nativeSourceBlob:'63cc9da00eaecbeb2576482dcae1528b44ea8189',
 expected:total,attempted:runs.length,
 result:runs.length===total&&runs.every(r=>r.status==='PASS')?'PASS':'FAIL',
 noSyntheticPreviewOrModel:true,realBrowser:true,realOriginalJPEG:true,
 noPrivatePhotosOrTokensInEvidence:true,hostedSignedRLS:false,
 independentHumanAccuracy:false,physicalPhone:false,full3DFitted:false,
 familyAlpha:'HOLD',releaseAllowed:false,runs};
writeFileSync(join(path,'result.json'),JSON.stringify(receipt,null,2)+'\n');
assert.equal(receipt.result,'PASS','real M97 WebKit M51 failed; do not hide or auto-retry');
console.log('P92_M97_REAL_WEBKIT_REENTRY_STRESS_PASS',JSON.stringify({
 exactHead:sha,repetitions:total,widths:[320,390,430],
 photoSourceUnchanged:true,familyAlpha:'HOLD'}));
