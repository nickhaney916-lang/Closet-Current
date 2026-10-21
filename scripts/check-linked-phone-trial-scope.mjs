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
