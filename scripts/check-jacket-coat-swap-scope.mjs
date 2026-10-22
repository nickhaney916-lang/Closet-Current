// Strict successor app-only guard. Secure cloud/data/photo processing unchanged.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='53fb6a4e32a33c1f55ccac256c28a003185fd63b';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:9000000}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const allowed=new Set([
 'public/closet-stylist-engine.js','public/closet-stylist.js',
 'tests/stylist-jacket-coat-swap.test.cjs',
 'scripts/test-stylist-jacket-coat-swap-browsers.mjs',
 'scripts/check-jacket-coat-swap-scope.mjs',
 'docs/OWNED-JACKET-COAT-SWAP-20261021.md',
 '.github/workflows/owned-jacket-coat-swap-qa.yml'
]);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
for(const f of changed)assert.ok(allowed.has(f),'Unapproved source change: '+f);
for(const f of ['public/closet-stylist-engine.js','public/closet-stylist.js','tests/stylist-jacket-coat-swap.test.cjs'])
 assert.ok(changed.includes(f),'Expected actual user-visible fix missing: '+f);
for(const path of ['supabase','benchmark','public/auth.js','public/app.js','public/index.html',
 'public/outfit-board.js','public/outfit-board-engine.js','public/photo-import.js',
 'public/photo-color.js','public/photo-check.js','public/outfit-capture.js',
 'public/recognition-engine.mjs','public/recognition-photo.mjs','public/garment-mask-engine.js',
 'public/ai-tryon.js','public/cloud-backup.js','public/cloud-backup-engine.js',
 'scripts/build-restricted-staging.mjs','scripts/staging-asset-seal.mjs',
 'scripts/check-staging-anonymous-access.mjs',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),'Protected cloud/photo/security source changed: '+path);
const w=readFileSync('.github/workflows/owned-jacket-coat-swap-qa.yml','utf8');
for(const x of ['check-jacket-coat-swap-scope.mjs','node --test tests/*.test.cjs tests/*.test.mjs',
 'test-stylist-jacket-coat-swap-browsers.mjs','test-stylist-outerwear-anchors-browsers.mjs',
 'test-stylist-unpinned-layers-browsers.mjs','test-disposable-supabase-security.mjs',
 'test-staging-installed-pwa-chromium.mjs'])
 assert.ok(w.includes(x),'Required inherited/new security QA missing: '+x);
console.log(JSON.stringify({scope:'ONE_TAP_OWNED_JACKET_COAT_ONLY',base:BASE,changedFiles:changed.length,
 authCloudDataChanged:false,productionDeploymentChanged:false,
 originalFullResolutionRecognitionBeforeCropUnchanged:true,realPhones:0,promotion:'BLOCKED'}));
