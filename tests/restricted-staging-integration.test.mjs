import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,readdir,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {probeAnonymousAccess} from '../scripts/check-staging-anonymous-access.mjs';
const fixture={CLOSET_STAGING_APP_ORIGIN:'https://preview.closet-current-staging.pages.dev/',CLOSET_STAGING_SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_STAGING_TEST_FIXTURE_XYZ001'};
const live=['hlkgymugtfbirlpunsra','qlwotqbqxpgkheitsboe'];
async function files(dir,prefix=''){
 const paths=[];for(const e of await readdir(dir,{withFileTypes:true})){
 const p=prefix+e.name;if(e.isDirectory())paths.push(...await files(join(dir,e.name),p+'/'));else paths.push(p);
 }return paths;
}
async function sandbox(fn){
 const root=await mkdtemp(join(tmpdir(),'closet-stage-integration-'));
 try{
 await cp('public',join(root,'public'),{recursive:true});
 await cp('scripts',join(root,'scripts'),{recursive:true,filter:p=>!p.includes('__pycache__')});
 await fn(root);
 }finally{await rm(root,{recursive:true,force:true});}
}
function build(root,env={}){
 return spawnSync(process.execPath,['scripts/build-restricted-staging.mjs'],{cwd:root,env:{...process.env,...fixture,...env},encoding:'utf8',timeout:30000});
}
async function absent(root){
 assert.ok(!(await readdir(root)).some(p=>p==='staging-dist'||p.startsWith('staging-dist.incomplete-')));
}
test('actual atomic staging bundle isolates backends and preserves every untransformed wardrobe/photo asset',async()=>sandbox(async root=>{
 const r=build(root);assert.equal(r.status,0,r.stderr);
 const verify=spawnSync(process.execPath,['scripts/verify-restricted-staging-bundle.mjs'],{cwd:root,encoding:'utf8'});
 assert.equal(verify.status,0,verify.stderr);
 const changed=new Set(['auth.js','cloud-backup.js','ai-tryon.js','index.html','sw.js','phone-photo-check.html','saved-closet-audit.html','_headers','robots.txt']);
 for(const p of await files(join(root,'dist'))){
  const original=await readFile(join(root,'dist',p)),staged=await readFile(join(root,'staging-dist',p));
  if(!changed.has(p))assert.deepEqual(staged,original,'Unexpected asset change: '+p);
  for(const ref of live)assert.equal(staged.includes(Buffer.from(ref)),false,'Live backend in '+p);
 }
 for(const p of ['auth.js','cloud-backup.js','ai-tryon.js'])assert.ok((await readFile(join(root,'staging-dist',p),'utf8')).includes(fixture.CLOSET_STAGING_SUPABASE_URL));
 const proof=JSON.parse(await readFile(join(root,'staging-dist/staging-preflight.json')));
 assert.equal(proof.backendProjectRef,'abcdefghijklmnopqrst');assert.equal(proof.paidAIHardBlocked,true);assert.equal(proof.releasePromotion,'BLOCKED');
 // A successful atomic build does not allow public access to one script.
 const origins=['https://closet-current-staging.pages.dev','https://preview.closet-current-staging.pages.dev'];
 const report=await probeAnonymousAccess(origins,{request:async url=>url===origins[1]+'/auth.js'?new Response('public'):new Response(null,{status:302,headers:{location:'https://pilot.cloudflareaccess.com/cdn-cgi/access/login/staging'}})});
 assert.equal(report.anonymousProbePassed,false);assert.equal(report.productionPromotion,'BLOCKED');
}));
test('actual builder refuses both live targets and invalidates stale output on each failure',async()=>sandbox(async root=>{
 for(const ref of live){
  assert.equal(build(root).status,0);
  const r=build(root,{CLOSET_STAGING_SUPABASE_URL:'https://'+ref+'.supabase.co'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/Staging may never access/);await absent(root);
 }
}));
test('late forbidden-reference scan failure after copying source cannot publish any partial bundle',async()=>sandbox(async root=>{
 assert.equal(build(root).status,0);
 await writeFile(join(root,'public/synthetic-forbidden.json'),JSON.stringify({endpoint:'https://'+live[1]+'.supabase.co'}));
 const r=build(root);assert.notEqual(r.status,0);assert.match(r.stderr,/Existing live service/);await absent(root);
}));
test('actual auth source mismatch after copying removes stale and incomplete bundles',async()=>sandbox(async root=>{
 assert.equal(build(root).status,0);
 const path=join(root,'public/auth.js');await writeFile(path,(await readFile(path,'utf8')).replace('const URL=','const CHANGED_URL='));
 const r=build(root);assert.notEqual(r.status,0);assert.match(r.stderr,/Unexpected auth backend/);await absent(root);
}));

test('builder refuses abandoned staging source until its manual inspection and cleanup',async()=>sandbox(async root=>{
 const initial=build(root);assert.equal(initial.status,0,initial.stderr);
 const oldProof=await readFile(join(root,'staging-dist/staging-preflight.json'),'utf8');
 const orphan=join(root,'staging-dist.incomplete-999999-interrupted');
 await writeFile(orphan,'unverified synthetic bytes');
 const refused=build(root);
 assert.notEqual(refused.status,0);
 assert.match(refused.stderr,/Interrupted staging candidate found/);
 assert.equal(await readFile(join(root,'staging-dist/staging-preflight.json'),'utf8'),oldProof);
 await rm(orphan,{force:true});
 const retry=build(root);assert.equal(retry.status,0,retry.stderr);
}));

test('bundle verifier refuses build lock, incomplete file and live reference even after a valid build',async()=>sandbox(async root=>{
 const built=build(root);assert.equal(built.status,0,built.stderr);
 const verify=()=>spawnSync(process.execPath,['scripts/verify-restricted-staging-bundle.mjs'],
  {cwd:root,encoding:'utf8',timeout:15000});
 const valid=verify();assert.equal(valid.status,0,valid.stderr);
 const lock=join(root,'staging-dist.build.lock');
 await writeFile(lock,'fake interrupted process');
 const blockedLock=verify();assert.notEqual(blockedLock.status,0);
 assert.match(blockedLock.stderr,/staging build lock exists/);
 await rm(lock);
 const abandoned=join(root,'staging-dist.incomplete-interrupted');
 await writeFile(abandoned,'not verified');
 const blockedOrphan=verify();assert.notEqual(blockedOrphan.status,0);
 assert.match(blockedOrphan.stderr,/unfinished staging candidate/);
 await rm(abandoned);
 const tampered=join(root,'staging-dist','unrelated-artifact.json');
 await writeFile(tampered,JSON.stringify({api:'https://'+live[1]+'.supabase.co'}));
 const blockedLive=verify();assert.notEqual(blockedLive.status,0);
 assert.match(blockedLive.stderr,/live-service reference/);
 await rm(tampered);
 const final=verify();assert.equal(final.status,0,final.stderr);
}));
