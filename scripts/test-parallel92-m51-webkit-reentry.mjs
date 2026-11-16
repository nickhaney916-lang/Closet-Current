/**
 * P92 native WebKit repeat stress of EXACT M97 original-photo source/board mutations.
 * Real app, source JPEG, signed synthetic local DB and original assertions.
 * M89 owns failure classification; this test ONLY runs its unchanged script
 * repeatedly without retries, synthetic preview, product patches or image logs.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {join} from 'node:path';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD');
assert.equal(sha,process.env.P92_CHECKOUT_SHA,'must execute exact checked-out SHA');
const m98='c387be237600bb93ce86f7955c2bb86692f80a26';
assert.equal(git('merge-base',m98,sha),m98,'current M90 source not in ancestry');
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
 '9e98aa31d26a3fda0594e1c76e995d55e7844b3a','M91 native import acceptance changed');
assert.ok(readFileSync(script,'utf8').includes("stage='m97-live-selected-original-photo-mutation-revokes-without-board-change'")&&
 readFileSync(script,'utf8').includes("stage='m97-inflight-changed-source-must-not-publish-stale-original'"),
 'M97 live and in-flight source revocation acceptance missing');
assert.ok(readFileSync(script,'utf8').includes('M88_SOURCE_SAFE_WEBKIT_PREVIEW_REFUSAL')&&
 readFileSync(script,'utf8').includes('__m89PreviewFailure'),
 'Missing main-owned M89 source-safe refusal diagnostics');
const total=Number(process.env.P92_REENTRY_RUNS||12);
assert.ok(Number.isSafeInteger(total)&&total>=8&&total<=24);
const path='benchmark/parallel92-webkit-reentry';
mkdirSync(path,{recursive:true});
const runs=[];
// P92 targeted real-native WebKit failure classification. The actual M97
// 20-second wait, all M51 source/owner assertions and viewer consumer files
// are strictly unchanged. Only the on-failure code path produces safe enums.
const native=readFileSync(script,'utf8');
const realWait=" await page.waitForFunction(approve=>{\n  const text=document.getElementById('mission4Preview1054Status')?.textContent||'';\n  return approve?text.includes('2D only')||text.includes('Preview refused'):\n   text.includes('Preview refused');\n },approved,{timeout:20000});";
assert.equal(native.split(realWait).length,2,'native 20-second preview contract changed');
const stageReentries=[["  await page.evaluate(()=>{currentBoard.occasion='Casual';});\n  await clickPreview(page);","occasion-reentry"],["  await blank(page,'same owner new auth reference');\n  await clickPreview(page);","same-owner-auth-reference"],["  await blank(page,'same named private DB connection changed');\n  await clickPreview(page);","same-named-db-reference"],["  await blank(page,'native owner generation changed');\n  await clickPreview(page);","owner-epoch"]];
let classified=native;
for(const [segment,name] of stageReentries){
 assert.equal(classified.split(segment).length,2,
  'native source reentry stage changed '+name);
 classified=classified.replace(segment,segment.replace(
   '  await clickPreview(page);',
   "  stage='p92-focus-"+name+"';\n  await clickPreview(page);"));
}
const resultWait=realWait.replace(' await page.waitForFunction',' try{\n await page.waitForFunction')+
String.raw`
 }catch(error){
  let detail={state:'unavailable'};
  try{
   detail=await page.evaluate(()=>{
    const status=String(document.getElementById('mission4Preview1054Status')?.textContent||'');
    const viewer=typeof mission4Preview1054Viewer!=='undefined'
      ?mission4Preview1054Viewer?.status:null;
    let sameSource=false;
    try{sameSource=mission4Preview1054SameSource(mission4Preview1054Pinned,mission4Preview1054SourceSnapshot());}catch{}
    return {
     state:status.includes('2D only')?'verified':status.includes('Verifying')?'verifying':
       status.includes('Preview refused')?'refused':status.includes('Verify the original clothing photos again')?
       'source-changed':status.includes('cleared on account-session change')?'session-locked':'other',
     viewerPhase:viewer?.phase||'unavailable',
     photoCount:document.querySelectorAll('#mission4Preview1054Photos img').length,
     ownerPhotoVisible:viewer?.hasOwnerPhotos===true,
     previewButtonDisabled:document.querySelector('#mission4Preview1054Section button')?.disabled===true,
     sourcePinned:mission4Preview1054Pinned!==null,
     sourceSame:sameSource,documentHidden:document.hidden,
     leaseSessionPresent:!!window.closetAuth?.user?.id
    };
   });
  }catch{}
  console.error('P92_M97_WEBKIT_REENTRY_TIMEOUT_SAFE',JSON.stringify({
   stage,engine,width:activeWidth,errorClass:error?.name||'Error',
   ...detail,familyAlpha:'HOLD',releaseAllowed:false
  }));
  throw error;
 }
`;
classified=classified.replace(realWait,resultWait);
const instrumented='scripts/.parallel92-webkit-reentry.generated.mjs';
writeFileSync(instrumented,classified);
for(let trial=1;trial<=total;trial++){
 const started=Date.now();
 const r=spawnSync(process.execPath,[instrumented],{
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
  const waitClass=log.split('\n').filter(x=>x.includes('P92_M97_WEBKIT_REENTRY_TIMEOUT_SAFE ')).map(line=>{
  try{
   const v=JSON.parse(line.slice(line.indexOf('P92_M97_WEBKIT_REENTRY_TIMEOUT_SAFE ')+
    'P92_M97_WEBKIT_REENTRY_TIMEOUT_SAFE '.length));
   return {kind:'webKit-preview-wait-timeout',
    stage:v.stage||'unknown',width:[320,390,430].includes(v.width)?v.width:null,
    state:['verifying','source-changed','verified','refused','session-locked','other','unavailable'].includes(v.state)?v.state:'unknown',
    viewerPhase:['visible','refused','checking','idle','revoked','closed','unavailable'].includes(v.viewerPhase)?v.viewerPhase:'other',
    photoCount:Number.isInteger(v.photoCount)?v.photoCount:null,
    sourcePinned:v.sourcePinned===true,sourceSame:v.sourceSame===true,
    ownerPhotoVisible:v.ownerPhotoVisible===true,previewButtonDisabled:v.previewButtonDisabled===true};
  }catch{return {kind:'failed-to-classify'};}
 });
const row={trial,engine:'webkit',actualNativeApp:true,widths:[320,390,430],
  genuineLicensedSource:true,syntheticOwnerReview:true,
  elapsedMs:Date.now()-started,status:r.status===0?'PASS':'FAIL',
  sourceSafeRefusals:safe,strictTimeoutClassifications:waitClass};
 runs.push(row);
 console.log('P92_M97_NATIVE_WEBKIT_REENTRY_TRIAL',JSON.stringify(row));
 if(r.error||r.status!==0){
  console.error('P92_M97_REENTRY_FAIL',JSON.stringify({
   trial,errorName:r.error?.name||null,exitCode:r.status,
   sourceSafeRefusals:safe,strictTimeoutClassifications:waitClass}));
  break; // no retry masking
 }
}
rmSync(instrumented,{force:true});
const receipt={schema:'P92_M97_NATIVE_SOURCE_MUTATION_WEBKIT_REENTRY/v5',
 exactHead:sha,mainSourceM98:m98,
 nativeSourceBlob:'63cc9da00eaecbeb2576482dcae1528b44ea8189',
 expected:total,attempted:runs.length,
 result:runs.length===total&&runs.every(r=>r.status==='PASS')?'PASS':'FAIL',
 noSyntheticPreviewOrModel:true,realBrowser:true,realOriginalJPEG:true,
 noPrivatePhotosOrTokensInEvidence:true,unmodifiedNativeTimeoutMs:20000,
 realSourceAssertionsUnchanged:true,hostedSignedRLS:false,
 independentHumanAccuracy:false,physicalPhone:false,full3DFitted:false,
 familyAlpha:'HOLD',releaseAllowed:false,runs};
writeFileSync(join(path,'result.json'),JSON.stringify(receipt,null,2)+'\n');
assert.equal(receipt.result,'PASS','real M97 WebKit M51 failed; do not hide or auto-retry');
console.log('P92_M97_REAL_WEBKIT_REENTRY_STRESS_PASS',JSON.stringify({
 exactHead:sha,repetitions:total,widths:[320,390,430],
 photoSourceUnchanged:true,familyAlpha:'HOLD'}));
