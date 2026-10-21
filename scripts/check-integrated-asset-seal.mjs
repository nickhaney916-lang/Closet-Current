// Exact SHA source review for a two-parent production-independent merge.
// The approved seal differs from PR #160 only in staging-owned files.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const BASE='6ed5c170f7fa2a6492f67e4d5f609b2f197c9c9d',SEAL='a62f12448671eaa5a85bd2d45bd1382d1fd699f4',ARTIFACT='3e594a5714b7822ada852cd74d8bc5dc2d51c6ad';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:6500000}).trim();
for(const sha of [BASE,SEAL,ARTIFACT])execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD']);
const updates=git('diff','--name-only',ARTIFACT,SEAL).split('\n').filter(Boolean);
const exclusions=new Set(['docs/PROGRESS-CHECKPOINT.md','scripts/check-staging-preflight-scope.mjs']);
const pinned=updates.filter(p=>!exclusions.has(p));
for(const expected of [".github/workflows/staging-asset-seal-qa.yml","docs/STAGING-ASSET-SEAL-20261021.md","scripts/build-restricted-staging.mjs","scripts/staging-asset-seal.mjs","scripts/verify-restricted-staging-bundle.mjs","tests/restricted-staging-integration.test.mjs","tests/staging-asset-seal.test.mjs"])
 assert.ok(pinned.includes(expected),'Unmerged PR #162 code: '+expected);
for(const path of pinned){
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',SEAL+':'+path),
  'Verified staging SHA-256 seal source modified: '+path);
}
for(const path of ['public','supabase','scripts/atomic-staging-output.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml',
 'scripts/test-disposable-supabase-security.mjs']){
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
  'Customer/cloud/source identity drift: '+path);
}
const checkpoint=readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8');
const baseLog=git('show',BASE+':docs/PROGRESS-CHECKPOINT.md');
const sealLog=git('show',SEAL+':docs/PROGRESS-CHECKPOINT.md');
const stanza=sealLog.split('\n---\n')[0];
assert.ok(stanza.includes('Draft PR #162')&&checkpoint.includes(stanza),'PR #162 evidence missing');
assert.ok(checkpoint.includes(baseLog),'Integrated #161 checkpoint history was lost');
const verifier=readFileSync('scripts/verify-restricted-staging-bundle.mjs','utf8');
assert.ok(verifier.includes('checkStagingArtifactIntegrity(dir)'));
assert.ok(verifier.includes('verifyStagingAssetSeal(dir)'));
const builder=readFileSync('scripts/build-restricted-staging.mjs','utf8');
assert.ok(builder.includes('createStagingAssetSeal(stageDir)'));
assert.ok(builder.includes('verifyStagingAssetSeal(stageDir)'));
console.log(JSON.stringify({status:'ASSET_SEAL_EXACT_SOURCE_PIN_PASS',verifiedParent:SEAL,
 integratedParent:BASE,sealFilesPreserved:pinned.length,
 originalFullResolutionRecognitionPreserved:true,customerSourcesIdentical:true,
 deployAuthorized:false,productionPromotion:'BLOCKED'}));
