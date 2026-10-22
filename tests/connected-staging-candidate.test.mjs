import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateKnownStagingEnvironment} from '../scripts/build-connected-staging-candidate.mjs';
const STAGE='fbnplztkbsteuzrmbgib';
const env={
 CLOSET_STAGING_APP_ORIGIN:'https://preview.closet-current-staging.pages.dev/',
 CLOSET_STAGING_SUPABASE_URL:'https://'+STAGE+'.supabase.co',
 CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_SYNTHETIC_NOT_CONNECTED_2026'
};
test('known verified Supabase staging ref is pinned, with no false hosted-access proof',()=>{
 const r=validateKnownStagingEnvironment(env);
 assert.equal(r.backendProjectRef,STAGE);
 assert.equal(r.cloudflareAccessVerified,false);
 assert.equal(r.publicKeyMatchedToLiveProject,false);
 assert.equal(r.readyToDeploy,false);
 assert.equal(r.allowedToUseCustomerPhotos,false);
});
test('rejects production Closet Current, Drive Duel, and plausible but wrong third-party stage refs',()=>{
 for(const bad of ['hlkgymugtfbirlpunsra','qlwotqbqxpgkheitsboe',
 'abcdefghijklmnopqrst','fbnplztkbsteuzrmbgic']){
  assert.throws(()=>validateKnownStagingEnvironment({...env,
   CLOSET_STAGING_SUPABASE_URL:'https://'+bad+'.supabase.co'}),/CONNECTED_STAGING_REFUSED/);
 }
});
test('secret role, missing keys and public Pages root cannot be interpreted as protected staging',()=>{
 for(const patch of [
  {CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_secret_forged'},
  {CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:''},
  {CLOSET_STAGING_APP_ORIGIN:'https://closet-current-staging.pages.dev/'},
  {CLOSET_STAGING_APP_ORIGIN:'https://closet-current.pages.dev/'},
  {CLOSET_STAGING_APP_ORIGIN:'https://pilot.evil.invalid/'},
  {CLOSET_STAGING_APP_ORIGIN:'http://preview.closet-current-staging.pages.dev/'}
 ])assert.throws(()=>validateKnownStagingEnvironment({...env,...patch}),
  /CONNECTED_STAGING_REFUSED/);
});
test('the verified-staging wrapper builds a sealed OFFLINE candidate with real project ID and synthetic public key',async()=>{
 const root=await mkdtemp(join(tmpdir(),'cc-connected-stage-'));
 try{
  await Promise.all(['public','scripts'].map(path=>cp(path,join(root,path),{recursive:true})));
  const r=spawnSync(process.execPath,['scripts/build-connected-staging-candidate.mjs'],
   {cwd:root,env:{...process.env,...env},encoding:'utf8',timeout:45000});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/CONNECTED_STAGING_OFFLINE_CANDIDATE/);
  const proof=JSON.parse(await readFile(join(root,'staging-dist/staging-preflight.json'),'utf8'));
  assert.equal(proof.backendProjectRef,STAGE);
  assert.equal(proof.privateCloudflareAccessPolicyVerified,false);
  assert.equal(proof.restrictedStagingDeployed,false);
  assert.equal(proof.releasePromotion,'BLOCKED');
  const auth=await readFile(join(root,'staging-dist/auth.js'),'utf8');
  const cloud=await readFile(join(root,'staging-dist/cloud-backup.js'),'utf8');
  assert.ok(auth.includes('https://'+STAGE+'.supabase.co'));
  assert.ok(cloud.includes('https://'+STAGE+'.supabase.co'));
  for(const ref of ['hlkgymugtfbirlpunsra','qlwotqbqxpgkheitsboe']){
   assert.equal(auth.includes(ref),false);
   assert.equal(cloud.includes(ref),false);
  }
  assert.ok((await readdir(root)).includes('staging-dist'));
 }finally{await rm(root,{recursive:true,force:true})}
});
