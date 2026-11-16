/**
 * Parallel #92 separate native app regressions; independent of genuine P88
 * model/network. This is intentionally NOT full model-to-outfit acceptance.
 */
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
const engine=process.env.P92_ENGINE,trial=Number(process.env.P92_TRIAL);
assert.ok(['chromium','webkit'].includes(engine));
assert.ok([1,2].includes(trial));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const exact=git('rev-parse','HEAD'),base='238577c7fc61c4c3dcb9cea11483a00ebdb9ea1b';
assert.equal(exact,process.env.P92_CHECKOUT_SHA);
assert.equal(git('merge-base',base,exact),base);
const files=git('diff','--name-only',base,exact).split('\n').filter(Boolean);
const allowed=new Set(['scripts/test-parallel92-exact-head.mjs','scripts/test-parallel92-independent-browser.mjs','scripts/test-parallel92-m51-webkit-reentry.mjs',
 '.github/workflows/parallel92-m4-exact-head-no-deploy.yml','research/parallel92-integration/LEDGER.md']);
for(const f of files)assert.ok(allowed.has(f),'protected source change '+f);
assert.equal(git('rev-parse','HEAD:public/app.js'),'991c00457799f8e2b8ae958d5ace85cc9914aece');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),'42dc1a7a2503a1722e6addcd0b8613a7eb029b60');
assert.equal(git('rev-parse','HEAD:scripts/test-mission3-default-atomic-import-browser.mjs'),'20f85d5eeda42f2acd921f1393c10cc7522d22df');
assert.equal(git('rev-parse','HEAD:tests/mission3-default-atomic-backup-source-guard.test.mjs'),'5220f1a483604065446ce5fb07f8d1074e18df80');
const started=Date.now(),out=join('benchmark','parallel92-independent',engine,'trial-'+trial);
mkdirSync(out,{recursive:true});
const run=(file,args=[],env={})=>{
 console.log('P92_SEPARATE_NATIVE_REGRESSION',JSON.stringify({engine,trial,file}));
 const p=spawnSync(process.execPath,[file,...args],{env:{...process.env,...env},stdio:'inherit',timeout:1500000});
 if(p.error)throw p.error;
 assert.equal(p.status,0,'native test failed: '+file);
};
const read=p=>JSON.parse(readFileSync(p,'utf8'));
run('scripts/test-browser-owner-mutation91.mjs',[],{P91_ENGINE:engine});
// P92 exact native M51 source-only failure diagnosis. Test uses the same
// real original JPEG, auth fixture, UI and ONE photo count assertion; there
// are no retries, extra previews, synthetic pixels or bypasses. A diagnostic
// copy is created only in this disposable native CI workspace.
const originalM51File='scripts/test-main51-real-app-owner-original-2d.mjs';
const sourceM51=readFileSync(originalM51File,'utf8');
const originalCountCheck="  assert.equal(await count(page),1);";
const firstPreviewMarker="  stage='actual-native-app-preview-button';\n  await clickPreview(page);\n  assert.equal(await count(page),1);";
assert.equal(sourceM51.split(firstPreviewMarker).length,2,'M97 first approved original-photo preview contract changed');
assert.ok(sourceM51.includes("stage='m97-live-selected-original-photo-mutation-revokes-without-board-change'"),'M97 real-source mutation guard removed');
assert.ok(sourceM51.includes("stage='m97-inflight-changed-source-must-not-publish-stale-original'"),'M97 real-source mutation guard removed');
assert.ok(sourceM51.includes("stage='m95-inflight-unchanged-rerender-keeps-source-verified-preview'"),'M97 real-source mutation guard removed');
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
// Diagnostic is attached only to the UNIQUE first M97 owner-photo preview;
// all subsequent M95/M96/M97 source-mutation assertions run unchanged.
const previewEventProbe=String.raw`
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
`;
const p92NativeFile='scripts/.parallel92-m51-visibility-diagnostic.generated.mjs';
const firstPreviewWithProbe=firstPreviewMarker
 .replace('  await clickPreview(page);',previewEventProbe+'  await clickPreview(page);')
 .replace(originalCountCheck,diagnosticCountCheck);
assert.notEqual(firstPreviewWithProbe,firstPreviewMarker,'M97 preview diagnostic was not attached');
writeFileSync(p92NativeFile,sourceM51.replace(firstPreviewMarker,firstPreviewWithProbe));
try{run(p92NativeFile,[],{M51_ENGINE:engine});}
finally{rmSync(p92NativeFile,{force:true});}

const n=read(join('benchmark','main51-real-app-owner-2d',engine,'M51-native-owner-source-2d-NOT-RELEASE.json'));
for(const [k,v] of Object.entries({engine,actualNativeAppShell:true,actualAppOwnerButtonUsed:true,
 screenshotCount:3,consumer3D:false,releaseAuthorized:false,realUserAccounts:false,
 hostedJWTAndRLS:false,physicalAndroidIphone:false,familyAlpha:'HOLD'}))
 assert.deepEqual(n[k],v,'M51 '+k);
assert.equal(n.cases.length,3);
for(const width of [320,390,430]){
 const c=n.cases.find(x=>x.width===width);
 assert.ok(c&&c.ownerBDeniedOldOwnerPhoto===true&&c.sourceTamperRejected===true&&
 c.originalPhoto2DOnly===true,'original owner/2D: '+width);
}
run('scripts/test-main1054-duplicate-fence-browser.mjs');
run('scripts/test-mission3-lossless-v4-owner-acceptance-browser.mjs',[join(out,'v4')]);
const v=read(join(out,'v4','results.json'));
assert.equal(v.status,'PASS');assert.equal(v.familyAlpha,'HOLD');
assert.equal(v.realChromiumWebKit,true);assert.equal(v.realDevice,false);
assert.equal(v.realHostedCloud,false);assert.equal(v.independentPhotoAccuracy,false);
assert.equal(v.cases.length,6);
for(const c of v.cases)for(const key of ['originalSavedJPEGRetained','pendingDraftJPEGIncluded',
 'tamperedDraftRejected','foreignOwnerRejected','ownerCancellationUntouched','originalOwnerV4AtomicRestore',
 'failedMidTransactionRollback','revokedPreviousOwnerRejected','crossOwnerIsolated','realNativeIndexedDB'])
 assert.equal(c[key],true,'native V4 '+key);
const receipt={schema:'P92_INDEPENDENT_NATIVE_FALLBACK_REGRESSION/v1',exactHead:exact,
 engine,trial,status:'PASS',nativeM51OriginalSource2DWidths:[320,390,430],
 twoWriterDuplicateBrowser:true,realNativeV4SixCrossEngineCases:true,ownerDocumentIdbMutation:true,
 modelToOutfitJourney:'NOT_RUN_IN_THIS_JOB',modelInference:'NOT_RUN_IN_THIS_JOB',
 photo3DFitted:false,hostedSignedRLS:false,realDevices:false,
 independentHumanGroundTruth:false,elapsedWallMs:Date.now()-started,
 familyAlpha:'HOLD',releaseAllowed:false};
writeFileSync(join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log('P92_SEPARATE_NATIVE_REGRESSION_PASS',JSON.stringify(receipt));
