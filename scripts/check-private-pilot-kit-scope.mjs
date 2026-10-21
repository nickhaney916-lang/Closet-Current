// Preserve every verified PR #161 file except checkpoint history and this exact scope bridge.
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const pilotBase='6ed5c170f7fa2a6492f67e4d5f609b2f197c9c9d';
export const pilotFiles=['scripts/private-pilot-session.mjs','scripts/build-private-pilot-kit.mjs','scripts/test-private-pilot-kit-browsers.mjs','scripts/check-private-pilot-kit-scope.mjs','tests/private-pilot-kit.test.mjs','docs/PRIVATE-PILOT-START-HERE-20261021.md','.github/workflows/private-pilot-kit-qa.yml'];
export const pilotBridge="if(spawnSync('git',['merge-base','--is-ancestor','6ed5c170f7fa2a6492f67e4d5f609b2f197c9c9d','HEAD']).status===0){const pilot=await import('./check-private-pilot-kit-scope.mjs');pilot.checkPilotScope();for(const path of pilot.pilotFiles)own.add(path);}\n";
export function checkPilotScope(){
 const integrated='734941ae2997b74e705eb3b1d8f17d78417262cf',verifiedPilot='1572145211fbeef582f4286dd3bcb796e7ccc191';
 const isIntegrated=spawnSync('git',['merge-base','--is-ancestor',integrated,'HEAD']).status===0;
 if(isIntegrated){
  const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:5000000}).trim();
  execFileSync('git',['merge-base','--is-ancestor',verifiedPilot,'HEAD']);
  const preserved=pilotFiles.filter(path=>path!=='scripts/check-private-pilot-kit-scope.mjs');
  for(const path of preserved)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',verifiedPilot+':'+path),
   'Verified private-pilot kit file changed: '+path);
  for(const path of ['public','supabase','.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml',
   'scripts/build-restricted-staging.mjs','scripts/staging-asset-seal.mjs'])
   assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',integrated+':'+path),
    'Verified mobile/cloud source changed: '+path);
  const checkpoint=readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8');
  const evidence=git('show',verifiedPilot+':docs/PROGRESS-CHECKPOINT.md');
  const first=evidence.split('\n---\n')[0];
  assert.ok(first.includes('Work Assignment #162')&&checkpoint.includes(first),
   'Human pilot validation provenance missing');
  assert.ok(checkpoint.includes(git('show',integrated+':docs/PROGRESS-CHECKPOINT.md')),
   'Verified #164 checkpoint evidence lost');
  const guard=readFileSync('scripts/check-integrated-security-mobile-staging.mjs','utf8');
  assert.ok(guard.includes('pilot.checkPilotScope()')&&guard.includes('pilot.pilotFiles'),
   'Combined security source guard does not invoke pilot scope review');
  console.log(JSON.stringify({status:'COMBINED_PILOT_SOURCES_PINNED',
   verifiedPilot,verifiedSecurity:integrated,byteIdenticalPilotFiles:preserved.length,
   physicalHardwareVerified:false,recognitionAccuracy:null,permittedToDeploy:false}));
  return;
 }
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:5000000}).trim();
 execFileSync('git',['merge-base','--is-ancestor',pilotBase,'HEAD']);
 const changed=git('diff','--name-only',pilotBase,'HEAD').split('\n').filter(Boolean);
 for(const p of changed){if(pilotFiles.includes(p))continue;assert.ok(['docs/PROGRESS-CHECKPOINT.md','scripts/check-integrated-security-mobile-staging.mjs'].includes(p),'PR #161 source changed: '+p);}
 const oldGuard=execFileSync('git',['show',pilotBase+':scripts/check-integrated-security-mobile-staging.mjs'],{encoding:'utf8'});
 assert.equal(readFileSync('scripts/check-integrated-security-mobile-staging.mjs','utf8'),oldGuard.replace('const pinnedLock=',pilotBridge+'const pinnedLock='));
 const oldLog=execFileSync('git',['show',pilotBase+':docs/PROGRESS-CHECKPOINT.md']);assert.ok(readFileSync('docs/PROGRESS-CHECKPOINT.md').includes(oldLog),'PR #161 history removed');
 for(const p of ['public','supabase','.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',pilotBase+':'+p));
 console.log(JSON.stringify({status:'PILOT_KIT_ONLY',base:pilotBase,customerSourceByteIdentical:true,physicalHardwareVerified:false,permittedToDeploy:false}));
}
if(process.argv[1]?.endsWith('/check-private-pilot-kit-scope.mjs'))checkPilotScope();
