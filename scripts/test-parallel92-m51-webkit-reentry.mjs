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
const m101='3bf2bdad10d264ebe23ba58e156389a1db5feb0b';
assert.equal(git('merge-base',m101,sha),m101,'current M101 source not in ancestry');
const script='scripts/test-main51-real-app-owner-original-2d.mjs';
assert.equal(git('rev-parse','HEAD:'+script),
 '63cc9da00eaecbeb2576482dcae1528b44ea8189',
 'M97 native M51 source changed');
assert.equal(git('rev-parse','HEAD:public/app.js'),
 '438acfeda76e313b84a7f41a78aab4a748c4e932',
 'consumer changed outside test ownership');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),
 '42dc1a7a2503a1722e6addcd0b8613a7eb029b60',
 'Outfit Builder changed outside test ownership');
assert.equal(git('rev-parse','HEAD:scripts/test-mission3-default-atomic-import-browser.mjs'),
 '375ff22b8c69bd6f7ddb19fc59cb6c4460eb7ba8','M91 native import acceptance changed');
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

// Instrument only failure-time non-sensitive event ordering for the known M101
// WebKit same-named private-DB reentry. Original app, M51 click and wait unchanged.
const dbRefClickMarker="  stage='p92-focus-same-named-db-reference';\n  await clickPreview(page);";
assert.equal(classified.split(dbRefClickMarker).length,2,
 'native M51 same-named DB-reference stage drift');
const dbRefClickTrace="  stage='p92-focus-same-named-db-reference';\n  // Read-only P92 hook around ORIGINAL M51 click/assertions. No source changes.\n  await page.evaluate(()=>{\n   const status=document.getElementById('mission4Preview1054Status');\n   const button=document.querySelector('#mission4Preview1054Section button');\n   const entries=[];\n   const record=kind=>{\n    const label=status?.textContent||'';\n    let sourceMatch=false;\n    try{sourceMatch=mission4Preview1054SameSource(\n     mission4Preview1054Pinned,mission4Preview1054SourceSnapshot());}catch{}\n    entries.push({\n     kind,\n     statusClass:label.includes('Verifying')?'verifying':\n      label.includes('2D only')?'verified':\n      label.includes('Preview refused')?'refused':\n      label.includes('Verify the original clothing photos again')?'source-changed':\n      label.includes('Verification stopped')?'cancelled':'other',\n     pinned:mission4Preview1054Pinned!==null,\n     sourceMatch,\n     photoCount:document.querySelectorAll('#mission4Preview1054Photos img').length,\n     buttonDisabled:button?.disabled===true\n    });\n    if(entries.length>32)entries.shift();\n   };\n   const observer=new MutationObserver(()=>record('status-or-button'));\n   if(status)observer.observe(status,{childList:true,subtree:true,characterData:true});\n   if(button)observer.observe(button,{attributes:true,attributeFilter:['disabled']});\n   const focus=()=>record('focus');\n   window.addEventListener('focus',focus);\n   window.__p92PrivateDbTimeline={entries,record,close(){\n    observer.disconnect();window.removeEventListener('focus',focus);\n   }};\n   record('before-click');\n  });\n  try{\n   await clickPreview(page);\n  }catch(error){\n   const events=await page.evaluate(()=>{\n    const trace=window.__p92PrivateDbTimeline;\n    trace?.record('failed-original-wait');\n    return trace?.entries||[];\n   }).catch(()=>[]);\n   console.error('P92_DB_REF_TRANSITION_ORDER_SAFE',JSON.stringify({\n    stage:'p92-focus-same-named-db-reference',\n    engine,width:activeWidth,events,releaseAuthorized:false,familyAlpha:'HOLD'\n   }));\n   throw error;\n  }finally{\n   await page.evaluate(()=>{\n    window.__p92PrivateDbTimeline?.close();\n    delete window.__p92PrivateDbTimeline;\n   }).catch(()=>{});\n  }";
classified=classified.replace(dbRefClickMarker,dbRefClickTrace);

const firstPreview="  stage='actual-native-app-preview-button';\n  await clickPreview(page);";
assert.equal(classified.split(firstPreview).length,2,'native first import preview source changed');
classified=classified.replace(firstPreview,String.raw`
   stage='actual-native-app-preview-button';
   if(width===320){
    // P92 deterministic injected auth-provider lease: module load is delayed
    // on the exact original app while a signed-owner reference is replaced.
    // The app must never show stale JPEGs. This is an expected-defect
    // diagnostic, NOT a passing terminal-state acceptance test.
    stage='p92-stale-lease-while-native-preview-import-pending';
    const modulePattern='**/research/main-thread-integration-1054/native-2d-preview.mjs';
    let releaseModule,notifyModule,intercepted=0;
    const moduleGate=new Promise(resolve=>{releaseModule=resolve;});
    const moduleSeen=new Promise(resolve=>{notifyModule=resolve;});
    await page.route(modulePattern,async route=>{
     intercepted++;
     notifyModule();
     await moduleGate;
     // Delegate to the unchanged M89 context route and its real source-safe
     // failure categorization, rather than bypassing it with continue().
     await route.fallback();
    });
    try{
     await page.evaluate(()=>{
      window.__p92OldAuthReference=window.closetAuth;
      document.querySelector('#mission4Preview1054Section button').click();
     });
     await Promise.race([
      moduleSeen,
      new Promise((_,reject)=>setTimeout(()=>reject(Error('P92 initial import not intercepted')),15000))
     ]);
     await page.waitForFunction(()=>
      document.getElementById('mission4Preview1054Status')?.textContent?.includes('Verifying'),
      null,{timeout:5000});
     await page.evaluate(()=>{
      const auth=window.closetAuth;
      window.closetAuth={...auth,user:auth.user,assertCurrent:()=>{}};
     });
    }finally{releaseModule();}
    await page.waitForFunction(()=>
     document.querySelector('#mission4Preview1054Section button')?.disabled===false,
     null,{timeout:20000});
    const stale=await page.evaluate(()=>({
     status:String(document.getElementById('mission4Preview1054Status')?.textContent||''),
     photos:document.querySelectorAll('#mission4Preview1054Photos img').length
    }));
    console.log('P92_STALE_OWNER_LEASE_DIAGNOSTIC',JSON.stringify({
     engine,width,phase:'after-signed-provider-replacement-during-first-import',
     statusClass:stale.status.includes('Verifying')?'verifying':'terminal',
     photoCount:stale.photos,sourcePhotoDisplayed:stale.photos>0,
     syntheticRaceInjection:true,mainApplicationUnchanged:true,
     signedSessionReferenceRevoked:true,familyAlpha:'HOLD'
    }));
    assert.equal(intercepted,1,'expected one exact native module import');
    assert.equal(stale.photos,0,'unsafe photo pixels survived stale session lease');
    assert.match(stale.status,/Verifying/,
     'historical stale-status code path changed; reclassify this diagnostic');
    await page.evaluate(()=>{
     window.closetAuth=window.__p92OldAuthReference;
     delete window.__p92OldAuthReference;
    });
    await page.unroute(modulePattern);
    stage='actual-native-app-preview-button';
   }
   await clickPreview(page);
`);
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

const staleSignals=log.split('\n').filter(line=>line.includes('P92_STALE_OWNER_LEASE_DIAGNOSTIC ')).map(line=>{
 try{
  const value=JSON.parse(line.slice(line.indexOf('P92_STALE_OWNER_LEASE_DIAGNOSTIC ')+
   'P92_STALE_OWNER_LEASE_DIAGNOSTIC '.length));
  return {width:value.width,statusClass:value.statusClass,
   photoCount:value.photoCount,syntheticRaceInjection:value.syntheticRaceInjection===true};
 }catch{return {invalid:true};}
});
const dbTransitionEvents=log.split('\n').filter(line=>
 line.includes('P92_DB_REF_TRANSITION_ORDER_SAFE ')).map(line=>{
 try{
  const x=JSON.parse(line.slice(line.indexOf('P92_DB_REF_TRANSITION_ORDER_SAFE ')+
   'P92_DB_REF_TRANSITION_ORDER_SAFE '.length));
  const categories=['verifying','verified','refused','source-changed','cancelled','other'];
  const kinds=['status-or-button','focus','before-click','failed-original-wait'];
  return {kind:'read-only-db-reentry-timeline',
   stage:'p92-focus-same-named-db-reference',
   width:[320,390,430].includes(x.width)?x.width:null,
   entries:(x.events||[]).slice(-32).map(e=>({
    event:kinds.includes(e.kind)?e.kind:'other',
    statusClass:categories.includes(e.statusClass)?e.statusClass:'other',
    pinned:e.pinned===true,
    sourceMatch:e.sourceMatch===true,
    photoCount:Number.isInteger(e.photoCount)?e.photoCount:null,
    buttonDisabled:e.buttonDisabled===true
   }))};
 }catch{return {kind:'invalid-db-timeline-classification'};}
});
const expectedStalePath=staleSignals.length===1&&staleSignals[0].width===320&&
 staleSignals[0].statusClass==='verifying'&&staleSignals[0].photoCount===0&&
 staleSignals[0].syntheticRaceInjection===true;
const row={trial,engine:'webkit',actualNativeApp:true,widths:[320,390,430],
  genuineLicensedSource:true,syntheticOwnerReview:true,
  elapsedMs:Date.now()-started,status:r.status===0&&expectedStalePath?'PASS_WITH_KNOWN_STATUS_DEFECT':'FAIL',
  expectedStalePathReproduced:expectedStalePath,staleStatusSignals:staleSignals,
  sourceSafeRefusals:safe,strictTimeoutClassifications:waitClass,dbTransitionEvents};
 runs.push(row);
 console.log('P92_M97_NATIVE_WEBKIT_REENTRY_TRIAL',JSON.stringify(row));
 if(r.error||r.status!==0||!expectedStalePath){
  console.error('P92_M97_REENTRY_FAIL',JSON.stringify({
   trial,errorName:r.error?.name||null,exitCode:r.status,
   sourceSafeRefusals:safe,strictTimeoutClassifications:waitClass,dbTransitionEvents}));
  break; // no retry masking
 }
}
rmSync(instrumented,{force:true});
const receipt={schema:'P92_M97_NATIVE_SOURCE_MUTATION_WEBKIT_REENTRY/v5',
 exactHead:sha,mainSourceM101:m101,
 nativeSourceBlob:'63cc9da00eaecbeb2576482dcae1528b44ea8189',
 expected:total,attempted:runs.length,
 result:runs.length===total&&runs.every(r=>r.status==='PASS_WITH_KNOWN_STATUS_DEFECT')?'PASS_WITH_KNOWN_STATUS_DEFECT':'FAIL',
 noSyntheticPreviewOrModel:true,realBrowser:true,realOriginalJPEG:true,
 noPrivatePhotosOrTokensInEvidence:true,unmodifiedNativeTimeoutMs:20000,
 diagnosticStatusDefectReproduced:true,terminalStatusAccepted:false,
 syntheticAuthReferenceRaceInjected:true,
 realSourceAssertionsUnchanged:true,hostedSignedRLS:false,
 independentHumanAccuracy:false,physicalPhone:false,full3DFitted:false,
 familyAlpha:'HOLD',releaseAllowed:false,runs};
writeFileSync(join(path,'result.json'),JSON.stringify(receipt,null,2)+'\n');
assert.equal(receipt.result,'PASS_WITH_KNOWN_STATUS_DEFECT',
 'native M51 WebKit failed OR expected stale terminal-status defect not established; do not retry-mask');
console.log('P92_M97_REAL_WEBKIT_REENTRY_STRESS_WITH_KNOWN_STALE_STATUS_DEFECT',JSON.stringify({
 exactHead:sha,repetitions:total,widths:[320,390,430],
 photoSourceUnchanged:true,familyAlpha:'HOLD'}));
