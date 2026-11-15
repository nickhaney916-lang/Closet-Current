/**
 * P92 independent native WebKit focus/reentry stress of EXACT M88 M51 source.
 * Real app, source JPEG, signed synthetic local DB and original assertions.
 * M88 owns failure classification; this test ONLY runs its unchanged script
 * repeatedly without retries, synthetic preview, product patches or image logs.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {join} from 'node:path';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD');
assert.equal(sha,process.env.P92_CHECKOUT_SHA,'must execute exact checked-out SHA');
const m88='45ef228ff5f5a57d840dfe65cdc41d92c71936ff';
assert.equal(git('merge-base',m88,sha),m88,'current M88 source not in ancestry');
const script='scripts/test-main51-real-app-owner-original-2d.mjs';
assert.equal(git('rev-parse','HEAD:'+script),
 '5f59269341247fa14ba346367549cb88f45e0843',
 'M88 native M51 source changed');
assert.equal(git('rev-parse','HEAD:public/app.js'),
 'd259d0b77a006d032699be50536adb2ebca459dd',
 'consumer changed outside test ownership');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),
 '153455379b0b6d777eff8c1c508c129208c7fadc',
 'Outfit Builder changed outside test ownership');
assert.ok(readFileSync(script,'utf8').includes('M88_SOURCE_SAFE_WEBKIT_PREVIEW_REFUSAL'),
 'Missing main-owned source-safe refusal diagnostics');
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
 console.log('P92_M88_NATIVE_WEBKIT_REENTRY_TRIAL',JSON.stringify(row));
 if(r.error||r.status!==0){
  console.error('P92_M88_REENTRY_FAIL',JSON.stringify({
   trial,errorName:r.error?.name||null,exitCode:r.status,
   sourceSafeRefusals:safe}));
  break; // no retry masking
 }
}
const receipt={schema:'P92_M88_UNCHANGED_M51_REAL_WEBKIT_REENTRY/v2',
 exactHead:sha,mainSourceM88:m88,
 nativeSourceBlob:'5f59269341247fa14ba346367549cb88f45e0843',
 expected:total,attempted:runs.length,
 result:runs.length===total&&runs.every(r=>r.status==='PASS')?'PASS':'FAIL',
 noSyntheticPreviewOrModel:true,realBrowser:true,realOriginalJPEG:true,
 noPrivatePhotosOrTokensInEvidence:true,hostedSignedRLS:false,
 independentHumanAccuracy:false,physicalPhone:false,full3DFitted:false,
 familyAlpha:'HOLD',releaseAllowed:false,runs};
writeFileSync(join(path,'result.json'),JSON.stringify(receipt,null,2)+'\n');
assert.equal(receipt.result,'PASS','real M88 WebKit M51 failed; do not hide or auto-retry');
console.log('P92_M88_REAL_WEBKIT_REENTRY_STRESS_PASS',JSON.stringify({
 exactHead:sha,repetitions:total,widths:[320,390,430],
 photoSourceUnchanged:true,familyAlpha:'HOLD'}));
