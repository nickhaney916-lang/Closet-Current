/**
 * Parallel #92 separate native app regressions; independent of genuine P88
 * model/network. This is intentionally NOT full model-to-outfit acceptance.
 */
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const engine=process.env.P92_ENGINE,trial=Number(process.env.P92_TRIAL);
assert.ok(['chromium','webkit'].includes(engine));
assert.ok([1,2].includes(trial));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const exact=git('rev-parse','HEAD'),base='7710fafdb03fd64a1de0cc6419a9aa1e0883f2c1';
assert.equal(exact,process.env.P92_CHECKOUT_SHA);
assert.equal(git('merge-base',base,exact),base);
const files=git('diff','--name-only',base,exact).split('\n').filter(Boolean);
const allowed=new Set(['scripts/test-parallel92-exact-head.mjs','scripts/test-parallel92-independent-browser.mjs','scripts/test-parallel92-m51-webkit-reentry.mjs',
 '.github/workflows/parallel92-m4-exact-head-no-deploy.yml','research/parallel92-integration/LEDGER.md']);
for(const f of files)assert.ok(allowed.has(f),'protected source change '+f);
assert.equal(git('rev-parse','HEAD:public/app.js'),'d259d0b77a006d032699be50536adb2ebca459dd');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),'153455379b0b6d777eff8c1c508c129208c7fadc');
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
run('scripts/test-main51-real-app-owner-original-2d.mjs',[],{M51_ENGINE:engine});
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
