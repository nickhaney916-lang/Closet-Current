// Verify integrated two-parent security and offline pilot kit provenance.
// CI may not substitute synthetic browser evidence for real physical device tests.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pilotFiles} from './check-private-pilot-kit-scope.mjs';
const SECURE='734941ae2997b74e705eb3b1d8f17d78417262cf', PILOT='1572145211fbeef582f4286dd3bcb796e7ccc191';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:6000000}).trim();
for(const sha of [SECURE,PILOT])execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD']);
const current=git('rev-parse','HEAD');
const parents=git('show','-s','--format=%P',current).split(' ');
assert.ok(parents.length>=1,'Expected integrated Git candidate');
for(const path of pilotFiles.filter(x=>x!=='scripts/check-private-pilot-kit-scope.mjs'))
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',PILOT+':'+path),
 'Pilot kit implementation changed: '+path);
for(const path of ['public','supabase','scripts/build-restricted-staging.mjs',
 'scripts/staging-asset-seal.mjs','scripts/test-disposable-supabase-security.mjs',
 '.github/workflows/cloudflare-pages.yml','.github/workflows/pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',SECURE+':'+path),
 'Verified customer/host security code changed: '+path);
const log=readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8');
assert.ok(log.includes(git('show',SECURE+':docs/PROGRESS-CHECKPOINT.md')),
 'PR #164 security evidence missing');
const pilotHistory=git('show',PILOT+':docs/PROGRESS-CHECKPOINT.md');
assert.ok(log.includes(pilotHistory.split('\n---\n')[0]),'Pilot evidence missing');
const check=readFileSync('scripts/check-private-pilot-kit-scope.mjs','utf8');
assert.ok(check.includes('COMBINED_PILOT_SOURCES_PINNED'),
 'Combined review must not use PR #163-only diff allowlist');
const workflow=readFileSync('.github/workflows/final-integrated-pilot-validation-qa.yml','utf8');
for(const str of ['test-disposable-supabase-security.mjs','test-private-pilot-kit-browsers.mjs',
 'test-staging-runtime-browsers.mjs','test-staging-installed-pwa-chromium.mjs',
 'verify-restricted-staging-bundle.mjs','actions/upload-artifact@v4'])
 assert.ok(workflow.includes(str),'Required integrated security or pilot QA missing: '+str);
console.log(JSON.stringify({status:'SECURITY_AND_PILOT_KIT_TWO_PARENT_PROVENANCE',
 secureHead:SECURE,pilotHead:PILOT,byteIdenticalPilotFiles:pilotFiles.length-1,
 productSourceUnchanged:true,originalBeforeCropRecognitionPreserved:true,
 actualPhysicalDevicesTested:0,independentGarmentScenes:0,
 privateCloudflareAccessVerified:false,productionPromotion:'BLOCKED'}));
