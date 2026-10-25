import test from 'node:test';
import assert from 'node:assert/strict';
import {
 STAGING_ROOT,OBSERVED_STAGE_DEPLOYMENT,exactObservedStagingRoot,
 classifyAssets,makeGate
} from '../scripts/audit-family-alpha-staging-root-handoff.mjs';

const candidate=()=>classifyAssets([
 'index.html','app.js','auth.js','cloud-backup.js','alpha-stage-config.js',
 'family-alpha-preview-boot.js','family-alpha-2d-saved-board.mjs',
 'family-alpha-2d-auth-preflight.mjs','recognition-engine.mjs',
 'local-worker.mjs','wardrobe-backup-engine.js','style.css'
]);
const config='intent: HOLD-NO-CALLBACK-OR-KEY "key":"" "redirect":""';
const boot="host!=='localhost'&&host!=='127.0.0.1'";
const index='<script src="alpha-stage-config.js"></script><script src="family-alpha-preview-boot.js"></script>';
const manifest={
 releaseGate:'HOLD',stageAuthBlocked:true,missingPublishableKey:true,
 missingApprovedCallback:true,previewOffOutsideLocalhost:true,
 stagingProjectRef:'fbnplztkbsteuzrmbgib'
};
const gate=overrides=>makeGate({
 candidate:candidate(),config,boot,index,manifest,
 ...overrides
});
test('exact approved staging root cannot be confused with live, branch, hash, pilot or unknown hosts',()=>{
 assert.equal(exactObservedStagingRoot(STAGING_ROOT),true);
 for(const bad of [
  'https://closet-current.pages.dev/',
  'https://pilot-access-check.closet-current-staging.pages.dev/',
  'https://a15254d6.closet-current-staging.pages.dev/',
  'https://random.closet-current-staging.pages.dev/',
  'https://closet-current-staging.pages.dev/Closet-Current/',
  'http://closet-current-staging.pages.dev/',
  'https://closet-current-staging.pages.dev:444/',
  'https://bad@closet-current-staging.pages.dev/',
  'https://closet-current-staging.pages.dev/?bypass=1',
  'https://closet-current-staging.pages.dev/#login',
  'https://closet-current-staging.pages.dev.evil.example/',
  'https://closet-current-staging.pages.dev.evil.example@evil.example/'
 ])assert.equal(exactObservedStagingRoot(bad),false,bad);
});
test('owner deployment screenshot is explicitly classified as one-file access placeholder',()=>{
 assert.deepEqual(OBSERVED_STAGE_DEPLOYMENT.uploadedAssets,['index.html']);
 const p=classifyAssets(OBSERVED_STAGE_DEPLOYMENT.uploadedAssets);
 assert.equal(p.kind,'ACCESS_TEST_PLACEHOLDER');
 assert.equal(p.assetCount,1);
 assert.ok(p.missing.includes('app.js'));
});
test('full candidate inventory requires the actual app, Auth/backup, recognition and photo avatar assets',()=>{
 const good=candidate();
 assert.equal(good.kind,'OFFLINE_FULL_APP_FILES');
 assert.equal(good.missing.length,0);
 const broken=classifyAssets(['index.html','app.js']);
 assert.equal(broken.kind,'INCOMPLETE_BUNDLE');
 assert.ok(broken.missing.includes('family-alpha-2d-saved-board.mjs'));
});
test('malicious and duplicated asset filenames cannot bypass the preflight',()=>{
 for(const list of [
  ['index.html','index.html'],['../app.js'],['/app.js'],
  ['sub/../../app.js'],['app.js\\x'],['app.js?key=1'],[''],
  [null],null,'index.html'
 ])assert.throws(()=>classifyAssets(list));
});
test('even complete held application, verified owner Access login and SMTP milestone never enable deploy',()=>{
 const g=gate();
 assert.equal(g.actualDeployedStaging,'ACCESS_TEST_PLACEHOLDER');
 assert.equal(g.offlineCandidate,'OFFLINE_FULL_APP_FILES');
 assert.equal(g.expectedRoot,STAGING_ROOT);
 assert.equal(g.releaseGate,'HOLD');
 assert.equal(g.stagingAuthDefaultBlocked,true);
 for(const key of ['actualFullAppDeployed','ownerAuthorizedRelease','deployAllowed',
  'familyInvitesAllowed','stagingCallbackRegisteredWithLiveAuth',
  'unauthorizedAccountDenialTested','realStagingJwtRlsAndStorageTested',
  'nativePhoneCaptureTested'])assert.equal(g[key],false,key);
 assert.ok(g.remainingBlockers.length>=5);
});
test('changed HOLD flag, disabled Auth proof, local-only boot or production routing fails closed',()=>{
 for(const m of [
  {...manifest,releaseGate:'GO'},
  {...manifest,stageAuthBlocked:false},
  {...manifest,missingPublishableKey:false},
  {...manifest,missingApprovedCallback:false},
  {...manifest,previewOffOutsideLocalhost:false},
  {...manifest,stagingProjectRef:'hlkgymugtfbirlpunsra'}
 ])assert.throws(()=>gate({manifest:m}));
 for(const c of [
  'intent: READY "key":"sb_publishable_fake" "redirect":"https://closet-current-staging.pages.dev/"',
  config+' https://hlkgymugtfbirlpunsra.supabase.co'
 ])assert.throws(()=>gate({config:c}));
 assert.throws(()=>gate({boot:'preview enabled at staging'}));
 assert.throws(()=>gate({index:'<script src="auth.js"></script>'}));
 assert.throws(()=>gate({candidate:classifyAssets(['index.html'])}));
});
