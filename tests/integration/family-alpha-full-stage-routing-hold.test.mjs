import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {
 OUTPUT,buildFullStagingRoutingHOLD,assertFullStagingRoutingHOLD,
 assertStagingLockedRouting
} from '../../scripts/build-family-alpha-full-stage-routing-hold.mjs';
import {PROD_BASE,STAGE_BASE} from '../../scripts/build-family-alpha-staging-auth-hold.mjs';
test('exact original 2D style and atomic wardrobe compile with staging-only auth/backup guard',async()=>{
 const manifest=await assertFullStagingRoutingHOLD();
 assert.equal(manifest.releaseGate,'HOLD');
 assert.equal(manifest.authEnabled,false);
 assert.equal(manifest.cloudEnabled,false);
 assert.equal(manifest.liveJwtIsolationProved,false);
 assert.equal(manifest.ownerAppearanceApproved,false);
 assert.equal(manifest.familyFourAccountsCertified,false);
 assert.equal(manifest.originalGarmentPixelsUnchanged,true);
 assert.equal(manifest.atomicSaveOverlayUnchanged,true);
 for(const path of ['auth.js','cloud-backup.js','family-alpha-2d-auth-preflight.mjs']){
  const source=await readFile(OUTPUT+'/'+path,'utf8');
  assert.ok(!source.includes(PROD_BASE),'Production URL still referenced in '+path);
  assert.ok(source.includes(STAGE_BASE)||source.includes('stage.base'),'Staging route missing '+path);
 }
});
test('offline candidate blank public key refuses Auth and cloud even on exact staging root',async()=>{
 const calls=[];
 const sandbox={
  window:{},document:{getElementById:()=>null},
  location:{protocol:'https:',origin:'https://closet-current-staging.pages.dev',pathname:'/'},
  fetch:()=>{calls.push('fetch');throw Error('Network called from HOLD');},
  console
 };
 const script=async path=>vm.runInNewContext(await readFile(OUTPUT+'/'+path,'utf8'),sandbox,{timeout:1000});
 await script('alpha-stage-config.js');
 assert.equal(sandbox.window.__CLOSET_ALPHA_STAGE_AUTH__.ready,false);
 assert.equal(sandbox.window.__CLOSET_ALPHA_STAGE_AUTH__.key,'');
 assert.equal(sandbox.window.__CLOSET_ALPHA_STAGE_AUTH__.redirect,'');
 await script('auth.js');
 await script('cloud-backup.js');
 assert.equal(sandbox.window.closetAuth.user,null);
 assert.equal(sandbox.window.closetAuth.getSessionGeneration(),0);
 await assert.rejects(()=>sandbox.window.closetAuth.getAccessToken(),/Staging sign-in unavailable/);
 await assert.rejects(()=>sandbox.window.closetCloud.start(),/Staging cloud unavailable/);
 assert.deepEqual(calls,[],'Offline guard must not fetch production or staging API');
});
test('host mismatch cannot permit Auth through stage guard, including local and production origin',async()=>{
 const config=await readFile(OUTPUT+'/alpha-stage-config.js','utf8');
 for(const origin of ['https://nickhaney916-lang.github.io','https://closet-current.com','http://localhost:3000']){
  const fetches=[];const target=new URL(origin);
  const ctx={window:{},location:{origin:target.origin,protocol:target.protocol,pathname:'/'},
   document:{getElementById:()=>null},fetch:()=>fetches.push(1)};
  vm.runInNewContext(config,ctx,{timeout:1000});
  assert.equal(ctx.window.__CLOSET_ALPHA_STAGE_AUTH__.ready,false);
  assert.deepEqual(fetches,[]);
 }
});
test('forged production endpoints or release claims fail closed without changing upstream',async()=>{
 const source=await readFile(OUTPUT+'/auth.js','utf8');
 const backup=await readFile(OUTPUT+'/cloud-backup.js','utf8');
 const preflight=await readFile(OUTPUT+'/family-alpha-2d-auth-preflight.mjs','utf8');
 const config=await readFile(OUTPUT+'/alpha-stage-config.js','utf8');
 const index=await readFile(OUTPUT+'/index.html','utf8');
 const pwa=await readFile(OUTPUT+'/pwa.js','utf8');
 const files={'auth.js':source,'cloud-backup.js':backup,
  'family-alpha-2d-auth-preflight.mjs':preflight,
  'alpha-stage-config.js':config,'index.html':index,'pwa.js':pwa};
 assert.equal(assertStagingLockedRouting(files),true);
 assert.throws(()=>assertStagingLockedRouting({...files,'cloud-backup.js':backup+PROD_BASE}),/Production project/);
 assert.throws(()=>assertStagingLockedRouting({...files,'auth.js':source+PROD_BASE}),/Production project/);
 assert.throws(()=>assertStagingLockedRouting({...files,'alpha-stage-config.js':config.replace('"key":""','"key":"sb_publishable_dummy"')}),/AssertionError|actual expected|\bfalse\b/);
 const path=OUTPUT+'/alpha-stage-full-routing-HOLD-manifest.json';
 const original=await readFile(path,'utf8');
 try{
  for(const [key,value]of [['releaseGate','READY'],['authEnabled',true],
   ['cloudEnabled',true],['releaseAuthorized',true],
   ['liveJwtIsolationProved',true],['familyFourAccountsCertified',true],
   ['ownerAppearanceApproved',true]]){
   const data=JSON.parse(original);data[key]=value;await writeFile(path,JSON.stringify(data));
   await assert.rejects(()=>assertFullStagingRoutingHOLD());
  }
 }finally{await writeFile(path,original);}
 await assertFullStagingRoutingHOLD();
});
