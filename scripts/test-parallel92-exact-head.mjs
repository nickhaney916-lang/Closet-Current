// P92 strict replay of existing REAL native app; no mocks and no private photos in evidence.
// Genuine P88 model proposals precede a synthetic (NOT independent human) owner approval.
// Actual native owner-local save/outfit, source-safe 2D, owner A/B/A and v4 restore.
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
const base='93696bfa890f573fbbb23da3530da27c45d4b890';
const engine=process.env.P92_ENGINE,trial=Number(process.env.P92_TRIAL);
assert.ok(['chromium','webkit'].includes(engine));
assert.ok(trial===1||trial===2);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
assert.equal(head,process.env.P92_CHECKOUT_SHA,'refuse unpinned or merge ref');
assert.equal(git('merge-base',base,head),base,'M4 ancestry changed');
const allowed=new Set(['scripts/test-parallel92-exact-head.mjs','scripts/test-parallel92-independent-browser.mjs','scripts/test-parallel92-m51-webkit-reentry.mjs','.github/workflows/parallel92-m4-exact-head-no-deploy.yml','research/parallel92-integration/LEDGER.md']);
for(const f of git('diff','--name-only',base,head).split('\n').filter(Boolean))assert.ok(allowed.has(f),'protected change: '+f);
const pins={
 'public/app.js':'991c00457799f8e2b8ae958d5ace85cc9914aece',
 'public/outfit-board.js':'153455379b0b6d777eff8c1c508c129208c7fadc',
 'public/native-owner-wardrobe-index-167.mjs':'b940b6c4ec040464d7d8b6686c45b5c3767fb859',
 'public/native-canonical-photo-source-167.mjs':'526d6d984bdb27cf775497132d2cf581ea2d3195',
 'research/main-thread-integration-1054/source-to-outfit.mjs':'5ea1e0e9b9f938fd98e7cb8875cc8ed8b68324b9',
 'public/native-default-atomic-import-m3.mjs':'3a83e3336ce36334a49708d1c7b90cc27194c7b9',
 'scripts/test-main51-real-app-owner-original-2d.mjs':'16cd06bcc1b1ef6bf8a6df3e3790c9abe2785167',
 'scripts/test-main58-actual-p88-wasm-browser.mjs':'96ba2f5ee2420de52f45911881fdcc139455c353',
 'scripts/test-mission3-default-atomic-import-browser.mjs':'20f85d5eeda42f2acd921f1393c10cc7522d22df',
 'tests/mission3-default-atomic-backup-source-guard.test.mjs':'5220f1a483604065446ce5fb07f8d1074e18df80'
};
for(const [p,blob] of Object.entries(pins))assert.equal(git('rev-parse','HEAD:'+p),blob,'source changed: '+p);
// Standalone-safe: reconstruct byte-for-byte immutable Worker import graph.
// Never substitute default branch models or synthetic worker events.
const donor='cc4554ef0104506a72bf0a28423fee52b6e4fff2';
git('cat-file','-e',donor+'^{commit}');
const donorDir='.m57-exact-p88-donor/public';
mkdirSync(donorDir,{recursive:true});
for(const name of ['outfit-worker.mjs','outfit-segmentation.mjs','outfit-instance-review-840.mjs','photo-color.js']){
 const blob=execFileSync('git',['show',donor+':public/'+name],{maxBuffer:8*1024*1024});
 const target=join(donorDir,name);
 writeFileSync(target,blob);
 assert.equal(git('hash-object',target),git('rev-parse',donor+':public/'+name),'P88 donor changed: '+name);
}
assert.equal(git('hash-object',join(donorDir,'outfit-worker.mjs')),'ab7d3837139c5b7d693383f9d6617e199ec8de4f');
function run(path,args=[],env={}){
 console.log('P92_RUN',JSON.stringify({engine,trial,path}));
 const p=spawnSync(process.execPath,[path,...args],{stdio:'inherit',env:{...process.env,...env},timeout:3900000});
 if(p.error)throw p.error;
 assert.equal(p.status,0,'native integration failed: '+path);
}
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const started=Date.now(),out=join('benchmark','parallel92',engine,'trial-'+trial);
mkdirSync(out,{recursive:true});
// Require fresh receipts for every trial; never reuse stale previous-trial files.
for(const name of ['M58-ACTUAL-P88-BROWSER-NO-SILENT-SAVE.json','P91-LIFECYCLE.json'])
 rmSync(join('benchmark','main58-real-p88-browser-worker',engine,name),{force:true});
rmSync(join('benchmark','main51-real-app-owner-2d',engine,'M51-native-owner-source-2d-NOT-RELEASE.json'),{force:true});
run('scripts/test-browser-owner-mutation91.mjs',[],{P91_ENGINE:engine});
// Diagnostic runner only: exact original M58 source, real immutable P88
// browser model and original assertions; append FAIL-ONLY numeric/enum
// diagnostics to a disposable same-directory test copy. Never retry a failed
// browser or supply any mock model proposals.
const mainM58File='scripts/test-main58-actual-p88-wasm-browser.mjs';
const immutableM58=readFileSync(mainM58File,'utf8');
const match=" assert.ok(state.cards>0&&state.cards<=12,\n  'Genuine P88 browser worker did not produce a bounded actual model proposal');";
assert.equal(immutableM58.split(match).length,2,'P92 must not replace altered real M58 assertion');
const numericAndEnumOnly=String.raw`
  if(!(state.cards>0&&state.cards<=12)){
   const statusText=String(state.status||'');
   const category=/automatic extraction unavailable/i.test(statusText)?
     'automatic-extraction-unavailable':/timed out/i.test(statusText)?
     'extraction-timeout':/could not start/i.test(statusText)?
     'extraction-start-error':/unverified region/i.test(statusText)?
     'unverified-status-no-card':'unknown-status';
   console.error('P92_P88_GENUINE_MODEL_NO_PROPOSAL',JSON.stringify({
    engine,category,originalWorkerAndSourcePinned:true,
    proposalCards:state.cards,working:state.debug?.working===true,
    p88Transport57:state.debug?.p88Transport57===true,
    passedNetworkResponses:modelResponses.filter(x=>x.status>=200&&x.status<300).length,
    unexpectedOutbound:rejected.length,browserIssues:issues.length,
    browserConsoleErrorClasses:p92ConsoleErrorClasses.slice(0,6),
    releaseAllowed:false,familyAlpha:'HOLD'
   }));
  }
`;
const errorsMarker="const external=[],rejected=[],issues=[],modelResponses=[];";
const eventMarker=" page.on('pageerror',e=>issues.push('pageerror-'+String(e.message).slice(0,120)));";
assert.equal(immutableM58.split(errorsMarker).length,2,'M58 error accounting altered');
assert.equal(immutableM58.split(eventMarker).length,2,'M58 real page accounting altered');
const disposableM58=immutableM58
 .replace(errorsMarker,errorsMarker+"\nconst p92ConsoleErrorClasses=[];")
 .replace(eventMarker,eventMarker+String.raw`
  page.on('console',msg=>{
   if(msg.type()!=='error')return;
   const s=String(msg.text()||'').toLowerCase();
   p92ConsoleErrorClasses.push(/memory|allocation/.test(s)?'memory':
     /wasm|webassembly/.test(s)?'wasm':
     /onnx|inference|execution/.test(s)?'inference':
     /network|fetch|timeout/.test(s)?'network':'other');
  });
`)
 .replace(match,numericAndEnumOnly+match);
const instrumentedFile='scripts/.parallel92-m58-diagnostic.generated.mjs';
writeFileSync(instrumentedFile,disposableM58);
try{run(instrumentedFile,[],{M58_ENGINE:engine});}
finally{rmSync(instrumentedFile,{force:true});}

const m=read(join('benchmark','main58-real-p88-browser-worker',engine,'M58-ACTUAL-P88-BROWSER-NO-SILENT-SAVE.json'));
const l=read(join('benchmark','main58-real-p88-browser-worker',engine,'P91-LIFECYCLE.json'));
for(const [key,value] of Object.entries({actualBrowser:engine,sourceVerified:true,actualNativeApp:true,viewportWidth:390,actualP88ModuleWorkerExecuted:true,noSyntheticWorker:true,ownerPrivateSaves:0,syntheticLogin:true,localIndexedDBOnly:true,humanAccuracyMeasured:false,full3DReady:false,hostedSignedRLS:false,familyAlpha:'HOLD',releaseAllowed:false}))
 assert.deepEqual(m[key],value,'real worker receipt: '+key);
assert.ok(m.sourceGroupsUnverified>=1&&m.sourceGroupsUnverified<=12);
assert.deepEqual(m.unexpectedOutbound,[]);
for(const [key,value] of Object.entries({engine,uninterruptedSourceExportRestore:true,writeRetries:0,extraTamperReloads:0,ownerRecovery:true,originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',releaseAuthorized:false}))
 assert.deepEqual(l[key],value,'whole session lifecycle: '+key);
// P92 exact native M51 source-only failure diagnosis. Test uses the same
// real original JPEG, auth fixture, UI and ONE photo count assertion; there
// are no retries, extra previews, synthetic pixels or bypasses. A diagnostic
// copy is created only in this disposable native CI workspace.
const originalM51File='scripts/test-main51-real-app-owner-original-2d.mjs';
const sourceM51=readFileSync(originalM51File,'utf8');
const originalCountCheck="  assert.equal(await count(page),1);";
assert.equal(sourceM51.split(originalCountCheck).length,2,'M51 native photo count contract changed');
const diagnosticCountCheck=[
 "  const p92Count=await count(page);",
 "  if(p92Count!==1){",
 "   const details=await page.evaluate(()=>{",
 "    const status=String(document.getElementById('mission4Preview1054Status')?.textContent||'');",
 "    const viewer=mission4Preview1054Viewer?.status;",
 "    const id=window.closetAuth?.user?.id;",
 "    return {",
 "     previewStatusCategory:status.includes('2D only')?'success-text-no-photo':status.includes('Preview refused')?'refused':'other',",
 "     viewerPhase:viewer?.phase||'missing',",
 "     viewerReportsPhotos:viewer?.hasOwnerPhotos===true,",
 "     documentHidden:document.hidden,",
 "     browserHasFocus:document.hasFocus(),",
 "     realOwnerDBPresent:!!db&&!!id,",
 "     realOwnerDbNameMatches:!!id&&db?.name==='closet-current-user-'+id,",
 "     outfitHasSelectedTop:!!currentBoard?.slots?.top,",
 "     previewButtonDisabled:!!document.querySelector('#mission4Preview1054Section button')?.disabled,",
 "     previewTransitionKinds:Array.isArray(window.__p92NativePreviewEventLog)?window.__p92NativePreviewEventLog.slice(-32):[]",
 "    };",
 "   });",
 "   console.error('P92_M51_NATIVE_ORIGINAL_MISSING_PIXELS',JSON.stringify({",
 "    engine,width,photoCount:p92Count,...details,realOriginalTest:true,",
 "    releaseAuthorized:false,familyAlpha:'HOLD'",
 "   }));",
 "  }",
 "  assert.equal(p92Count,1);"
].join(String.fromCharCode(10));
// Read-only transition probe in the disposable M51 test, *not* app code.
// It records only event kinds and counts; it never reads a JPEG URL, owner ID,
// private row or credentials. A photo-free success still fails the same assert.
const previewMarker="  await clickPreview(page);\n  assert.equal(await count(page),1);";
assert.equal(sourceM51.split(previewMarker).length,2,'M51 first original-photo preview contract changed');
const previewEventProbe=String.raw\`
  await page.evaluate(()=>{
   const root=document.getElementById('mission4Preview1054Photos');
   const status=document.getElementById('mission4Preview1054Status');
   const events=[];
   const mark=kind=>{
    if(events.length>=32)return;
    const message=String(status?.textContent||'');
    events.push({kind,photoCount:root?.querySelectorAll('img').length||0,
     statusCategory:message.includes('2D only')?'success':
      message.includes('Verifying')?'verifying':
      message.includes('Preview refused')?'refused':'other'});
   };
   Object.defineProperty(window,'__p92NativePreviewEventLog',
    {value:events,configurable:true});
   if(root)new MutationObserver(()=>mark('photo-dom-mutation'))
    .observe(root,{childList:true,subtree:true});
   if(status)new MutationObserver(()=>mark('status-dom-mutation'))
    .observe(status,{childList:true,characterData:true,subtree:true});
   window.addEventListener('focus',()=>mark('window-focus'),{capture:true});
   document.addEventListener('visibilitychange',()=>mark('visibility-change'),{capture:true});
   window.addEventListener('closet:style-owned-inventory-committed',
    ()=>mark('wardrobe-commit'),{capture:true});
   window.addEventListener('closet:session-locked',
    ()=>mark('session-locked'),{capture:true});
   mark('probe-start');
  });
\`;
const p92NativeFile='scripts/.parallel92-m51-visibility-diagnostic.generated.mjs';
writeFileSync(p92NativeFile,sourceM51.replace(previewMarker,previewEventProbe+previewMarker).replace(originalCountCheck,diagnosticCountCheck));
try{run(p92NativeFile,[],{M51_ENGINE:engine});}
finally{rmSync(p92NativeFile,{force:true});}

const n=read(join('benchmark','main51-real-app-owner-2d',engine,'M51-native-owner-source-2d-NOT-RELEASE.json'));
for(const [key,value] of Object.entries({engine,actualNativeAppShell:true,actualAppOwnerButtonUsed:true,screenshotCount:3,consumer3D:false,releaseAuthorized:false,realUserAccounts:false,hostedJWTAndRLS:false,physicalAndroidIphone:false,familyAlpha:'HOLD'}))
 assert.deepEqual(n[key],value,'native 2D receipt: '+key);
for(const width of [320,390,430]){
 const c=n.cases.find(x=>x.width===width);
 assert.ok(c&&c.ownerBDeniedOldOwnerPhoto===true&&c.sourceTamperRejected===true&&c.originalPhoto2DOnly===true,'native 2D/source/owner '+width);
}
run('scripts/test-main1054-duplicate-fence-browser.mjs');
const dir=join(out,'v4');
run('scripts/test-mission3-lossless-v4-owner-acceptance-browser.mjs',[dir]);
const v=read(join(dir,'results.json'));
assert.equal(v.status,'PASS');assert.equal(v.familyAlpha,'HOLD');
assert.equal(v.realChromiumWebKit,true);assert.equal(v.realDevice,false);
assert.equal(v.realHostedCloud,false);assert.equal(v.independentPhotoAccuracy,false);
assert.equal(v.cases.length,6);
for(const c of v.cases)for(const key of ['originalSavedJPEGRetained','pendingDraftJPEGIncluded','tamperedDraftRejected','foreignOwnerRejected','ownerCancellationUntouched','originalOwnerV4AtomicRestore','failedMidTransactionRollback','revokedPreviousOwnerRejected','crossOwnerIsolated','realNativeIndexedDB'])
 assert.equal(c[key],true,'v4: '+key);
const receipt={schema:'P92_STRICT_M4_REPLAY/v1',sourceBase:base,exactHead:head,engine,trial,status:'PASS',
 actualNativeApp:true,realBrowserSegFormerWorker:true,modelUnverifiedRegions:m.sourceGroupsUnverified,
 zeroSilentWorkerSaves:true,syntheticOwnerApprovalNotHumanGroundTruth:true,
 actualNativePrivateSaveOutfitV4Restore:true,actualOwnerAtoBtoAOriginalRehash:true,
 realNative2DWidths:[320,390,430],twoWriterDuplicateBrowser:true,v4BrowserCases:6,
 totalElapsedMs:Date.now()-started,independentHumanGroundTruth:false,
 hostedRLS:false,realMobilePhones:false,verifiedPhotoDerived3D:false,modelWeightsIndependentlyHashed:false,
 familyAlpha:'HOLD',releaseAllowed:false};
writeFileSync(join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log('P92_STRICT_PASS',JSON.stringify(receipt));
