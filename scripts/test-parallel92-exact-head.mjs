// P92 strict replay of existing REAL native app; no mocks and no private photos in evidence.
// Genuine P88 model proposals precede a synthetic (NOT independent human) owner approval.
// Actual native owner-local save/outfit, source-safe 2D, owner A/B/A and v4 restore.
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
const base='878d624d8963109143c8775bb156bda4ba12a196';
const engine=process.env.P92_ENGINE,trial=Number(process.env.P92_TRIAL);
assert.ok(['chromium','webkit'].includes(engine));
assert.ok(trial===1||trial===2);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
assert.equal(head,process.env.P92_CHECKOUT_SHA,'refuse unpinned or merge ref');
assert.equal(git('merge-base',base,head),base,'M4 ancestry changed');
const allowed=new Set(['scripts/test-parallel92-exact-head.mjs','scripts/test-parallel92-independent-browser.mjs','.github/workflows/parallel92-m4-exact-head-no-deploy.yml','research/parallel92-integration/LEDGER.md']);
for(const f of git('diff','--name-only',base,head).split('\n').filter(Boolean))assert.ok(allowed.has(f),'protected change: '+f);
const pins={
 'public/app.js':'d259d0b77a006d032699be50536adb2ebca459dd',
 'public/outfit-board.js':'153455379b0b6d777eff8c1c508c129208c7fadc',
 'public/native-owner-wardrobe-index-167.mjs':'b940b6c4ec040464d7d8b6686c45b5c3767fb859',
 'public/native-canonical-photo-source-167.mjs':'526d6d984bdb27cf775497132d2cf581ea2d3195',
 'research/main-thread-integration-1054/source-to-outfit.mjs':'5ea1e0e9b9f938fd98e7cb8875cc8ed8b68324b9',
 'public/native-default-atomic-import-m3.mjs':'8d0153671de7b7542b0178c4ed616c68da24cb95',
 'scripts/test-main51-real-app-owner-original-2d.mjs':'1150a6db461b1d5968183d1c9e798cac7ae88478',
 'scripts/test-main58-actual-p88-wasm-browser.mjs':'96ba2f5ee2420de52f45911881fdcc139455c353'
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
run('scripts/test-main58-actual-p88-wasm-browser.mjs',[],{M58_ENGINE:engine});
const m=read(join('benchmark','main58-real-p88-browser-worker',engine,'M58-ACTUAL-P88-BROWSER-NO-SILENT-SAVE.json'));
const l=read(join('benchmark','main58-real-p88-browser-worker',engine,'P91-LIFECYCLE.json'));
for(const [key,value] of Object.entries({actualBrowser:engine,sourceVerified:true,actualNativeApp:true,viewportWidth:390,actualP88ModuleWorkerExecuted:true,noSyntheticWorker:true,ownerPrivateSaves:0,syntheticLogin:true,localIndexedDBOnly:true,humanAccuracyMeasured:false,full3DReady:false,hostedSignedRLS:false,familyAlpha:'HOLD',releaseAllowed:false}))
 assert.deepEqual(m[key],value,'real worker receipt: '+key);
assert.ok(m.sourceGroupsUnverified>=1&&m.sourceGroupsUnverified<=12);
assert.deepEqual(m.unexpectedOutbound,[]);
for(const [key,value] of Object.entries({engine,uninterruptedSourceExportRestore:true,writeRetries:0,extraTamperReloads:0,ownerRecovery:true,originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',releaseAuthorized:false}))
 assert.deepEqual(l[key],value,'whole session lifecycle: '+key);
run('scripts/test-main51-real-app-owner-original-2d.mjs',[],{M51_ENGINE:engine});
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
