// Pin both completed development parents and preserve every inherited source.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const STAGING='c0fecc398ea927418c5e083607bdc1cf6ea77527';
const SECURITY='cca2f7c98f69d5aad416e6174182ac3f66b9b951';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:4000000}).trim();
for(const sha of [STAGING,SECURITY])execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD']);
const common=git('merge-base',STAGING,SECURITY);
const incoming=new Set(git('diff','--name-only',common,SECURITY).split('\n'));
const own=new Set(['scripts/check-integrated-security-mobile-staging.mjs',
 'scripts/check-staging-preflight-scope.mjs','docs/PROGRESS-CHECKPOINT.md',
 'docs/INTEGRATED-SECURITY-MOBILE-STAGING-20261021.md',
 '.github/workflows/integrated-security-mobile-staging-qa.yml']);
for(const path of git('diff','--name-only',STAGING,'HEAD').split('\n').filter(Boolean)){
 if(own.has(path))continue;
 assert.ok(incoming.has(path),'Unexpected integration change: '+path);
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',SECURITY+':'+path),'Verified security source overwritten: '+path);
}
for(const path of git('diff','--name-only',SECURITY,'HEAD').split('\n').filter(Boolean)){
 if(own.has(path))continue;
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',STAGING+':'+path),'Verified staging/mobile source overwritten: '+path);
}
assert.equal(git('rev-parse','HEAD:public'),git('rev-parse',STAGING+':public'));
assert.equal(git('rev-parse','HEAD:public'),git('rev-parse',SECURITY+':public'));
assert.equal(git('rev-parse','HEAD:supabase'),git('rev-parse',SECURITY+':supabase'));
for(const p of ['supabase/cloud-backup.sql','supabase/migrations','supabase/functions',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',STAGING+':'+p),'Production source changed: '+p);
// Preserve both conflicting checkpoint histories; store the common suffix once.
const a=execFileSync('git',['show',STAGING+':docs/PROGRESS-CHECKPOINT.md']);
const b=execFileSync('git',['show',SECURITY+':docs/PROGRESS-CHECKPOINT.md']);
let n=0;while(n<Math.min(a.length,b.length)&&a[a.length-1-n]===b[b.length-1-n])n++;
const log=readFileSync('docs/PROGRESS-CHECKPOINT.md');
assert.ok(n>1000&&log.includes(a.subarray(0,a.length-n))&&log.includes(b.subarray(0,b.length-n))&&log.subarray(-n).equals(a.subarray(-n)),'Checkpoint history lost');
assert.doesNotMatch(log.toString(),/^(<<<<<<<|=======|>>>>>>>) /m);
console.log(JSON.stringify({integration:'PINNED_VERIFIED_PARENTS',staging:STAGING,security:SECURITY,
 customerRuntimeChanged:false,fullResolutionOriginalRecognitionPreserved:true,
 securityAndMobileSourcesPreserved:true,hostedStagingVerified:false,physicalPhonesVerified:false,productionPromotion:'BLOCKED'}));
