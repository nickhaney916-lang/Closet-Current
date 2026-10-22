// Scope review for original-first offline diagnostic only.
// No hosted credentials, customer runtime, database or production changes.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const BASE='44a4725efee86862949bd77b5e933bb48df29372';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:7000000}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allow=new Set([
 'scripts/linked-phone-garment-evidence.mjs',
 'scripts/build-linked-phone-evidence.mjs',
 'scripts/test-linked-phone-evidence-browsers.mjs',
 'scripts/check-linked-phone-trial-scope.mjs',
 'scripts/check-integrated-security-mobile-staging.mjs',
 'tests/linked-phone-garment-evidence.test.mjs',
 'tests/build-linked-phone-evidence.test.mjs',
 'docs/LINKED-PHONE-EVIDENCE-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md',
 '.github/workflows/linked-phone-evidence-qa.yml'
]);
// The static-asset integration is authorized only when its complete verified source
// branch is an ancestor; the merged source pins each imported blob separately.
const ACCESS_SWEEP='53c2f49517d89ef6074cdfa0eee99c4fb5fbba2d';
if(git('merge-base','--is-ancestor',ACCESS_SWEEP,'HEAD')===''){
 for(const path of ["scripts/test-staging-runtime-browsers.mjs",".github/workflows/staging-all-assets-access-qa.yml","docs/STAGING-ALL-ASSETS-ACCESS-20261021.md","scripts/check-staging-anonymous-access.mjs","tests/staging-anonymous-access.test.mjs","tests/staging-anonymous-full-bundle.test.mjs","docs/INTEGRATED-PHONE-STAGING-20261021.md",".github/workflows/integrated-phone-staging-all-assets-qa.yml","scripts/check-integrated-phone-staging-scope.mjs"])allow.add(path);
}
// Only in this successor branch, explicitly allow private aggregate diagnostics.
if(git('merge-base','--is-ancestor','15b84821c8ecd3c7ce76baf2c5835ab5742ca6ac','HEAD')==='')
 for(const p of ["scripts/phone-recognition-triage.mjs","scripts/build-phone-recognition-triage.mjs","scripts/test-phone-recognition-triage-browsers.mjs","tests/phone-recognition-triage.test.mjs","docs/PHONE-RECOGNITION-TRIAGE-20261021.md","scripts/check-phone-triage-scope.mjs"])allow.add(p);
if(git('merge-base','--is-ancestor','3b6cdcdd5b5f19887e872000009256f503112359','HEAD')==='')
 for(const p of ["docs/RESTRICTED-STAGING-SETUP-20261021.md","tests/staging-root-preview-access-coverage.test.mjs"])allow.add(p);
for(const path of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allow.has(path),'Unauthorized existing product or hosted data edit: '+path);
for(const path of ['public','supabase','scripts/build-restricted-staging.mjs',
 'scripts/staging-asset-seal.mjs','scripts/private-pilot-session.mjs',
 'scripts/build-private-pilot-kit.mjs','scripts/test-disposable-supabase-security.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
 'Customer app, cloud and pilot kit source changed: '+path);
console.log(JSON.stringify({status:'LINKED_PHONE_EVIDENCE_SCOPE_SAFE',
 sourceBaseline:BASE,customerRuntimeChanged:false,
 originalPhotoBeforeCropPreserved:true,physicalDeviceEvidence:0,
 realRecognitionAccuracyMeasured:false,productionPromotion:'BLOCKED'}));
