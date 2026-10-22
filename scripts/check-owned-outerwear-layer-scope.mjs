// Isolated feature branch: permit ONLY correct pinned outerwear styling layers.
// Prior staging/cloud/access/original-first recognition remains byte-identical.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const BASE='32ceeecdf2a249ea4c6ec1b944c8021f4fcf8122';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:9e6}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allowed=new Set([
 'public/closet-stylist-engine.js',
 'tests/closet-stylist.test.cjs',
 'tests/mobile-owned-outfit-reliability.test.cjs',
 'scripts/test-stylist-outerwear-anchors-browsers.mjs',
 'scripts/check-owned-outerwear-layer-scope.mjs',
 'docs/OWNED-OUTERWEAR-LAYER-FIX-20261021.md',
 '.github/workflows/owned-outerwear-stylist-mobile-qa.yml'
]);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
for(const f of changed)assert.ok(allowed.has(f),'Unapproved source change: '+f);
assert.ok(changed.includes('public/closet-stylist-engine.js'),'Expected customer-facing outfit fix absent');
assert.ok(changed.includes('tests/closet-stylist.test.cjs'),'Expected unit regression absent');
for(const dir of ['supabase','benchmark','.github/workflows/pages.yml',
 '.github/workflows/cloudflare-pages.yml','public/auth.js','public/app.js',
 'public/cloud-backup.js','public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/ai-tryon.js','public/outfit-board-engine.js','public/outfit-capture.js',
 'public/photo-color.js','public/closet-stylist.js','public/closet-browser.js',
 'scripts/build-restricted-staging.mjs','scripts/staging-asset-seal.mjs',
 'scripts/check-staging-anonymous-access.mjs',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md'])
 assert.equal(git('rev-parse','HEAD:'+dir),git('rev-parse',BASE+':'+dir),'Protected source changed: '+dir);
const workflow=git('show','HEAD:.github/workflows/owned-outerwear-stylist-mobile-qa.yml');
for(const key of ['check-owned-outerwear-layer-scope.mjs','tests/*.test.cjs',
 'test-stylist-outerwear-anchors-browsers.mjs','test-disposable-supabase-security.mjs'])
 assert.ok(workflow.includes(key),'Feature QA missing '+key);
console.log(JSON.stringify({status:'PINNED_OWNED_OUTERWEAR_ONLY',
 originatingVerifiedDevelopmentCommit:BASE,
 permittedChangedFiles:changed.length,customerCloudChanged:false,
 paidAICalls:false,originalFullPhotoRecognitionUnchanged:true,
 physicalDeviceVerification:false,productionPromotion:'BLOCKED'}));
