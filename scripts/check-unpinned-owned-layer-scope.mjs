// Fail closed: exact predecessor plus a small customer-only, unpinned layer change.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='abdc2ea5a001ba3f357863f89d5281615178e7a3';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:10000000}).trim();
execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD']);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
const allowed=new Set([
 'public/closet-stylist-engine.js',
 'tests/mobile-owned-outfit-reliability.test.cjs',
 'tests/stylist-unpinned-layer-placement.test.cjs',
 'scripts/test-stylist-unpinned-layers-browsers.mjs',
 'scripts/check-unpinned-owned-layer-scope.mjs',
 'docs/UNPINNED-OWNED-LAYER-PLACEMENT-20261021.md',
 '.github/workflows/unpinned-owned-outfit-layers-qa.yml'
]);
for(const path of changed)assert.ok(allowed.has(path),'Unexpected change on feature branch: '+path);
for(const path of ['public/closet-stylist-engine.js','tests/stylist-unpinned-layer-placement.test.cjs',
 'scripts/test-stylist-unpinned-layers-browsers.mjs'])assert.ok(changed.includes(path),'Missing feature fix: '+path);
for(const dir of ['supabase','benchmark','public/auth.js','public/app.js','public/index.html','public/closet-stylist.js',
 'public/outfit-board-engine.js','public/outfit-board.js','public/outfit-capture.js','public/closet-browser.js',
 'public/photo-color.js','public/photo-import.js','public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/ai-tryon.js','public/cloud-backup.js','public/cloud-backup-engine.js','public/garment-mask-engine.js',
 'scripts/build-restricted-staging.mjs','scripts/staging-asset-seal.mjs','scripts/check-staging-anonymous-access.mjs',
 'docs/RESTRICTED-STAGING-SETUP-20261021.md','.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+dir),git('rev-parse',BASE+':'+dir),'Protected customer/cloud/security source changed: '+dir);
const w=readFileSync('.github/workflows/unpinned-owned-outfit-layers-qa.yml','utf8');
for(const str of ['check-unpinned-owned-layer-scope.mjs','node --test tests/*.test.cjs tests/*.test.mjs',
 'test-stylist-unpinned-layers-browsers.mjs','test-stylist-outerwear-anchors-browsers.mjs',
 'test-disposable-supabase-security.mjs','test-staging-installed-pwa-chromium.mjs'])
 assert.ok(w.includes(str),'Missing required inherited or new QA: '+str);
console.log(JSON.stringify({check:'UNPINNED_STYLING_FEATURE_SCOPE_PASSED',
 inheritedFeatureHead:BASE,changes:changed.length,
 originalRecognitionPhotoBeforeCropUnchanged:true,liveProductionUnchanged:true,
 hostedSupabaseUnchanged:true,privatePilotRelease:'BLOCKED',realPhysicalPhonesVerified:0}));
