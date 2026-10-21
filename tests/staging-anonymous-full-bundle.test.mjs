import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStagingAssetSeal,SEAL_FILE} from '../scripts/staging-asset-seal.mjs';
import {pathsFromVerifiedStaging,probeAnonymousAccess} from '../scripts/check-staging-anonymous-access.mjs';
const origins=['https://closet-current-staging.pages.dev','https://x.closet-current-staging.pages.dev'];
const login=()=>new Response(null,{status:302,headers:{location:'https://pilot.cloudflareaccess.com/cdn-cgi/access/login/staging'}});
async function kit(fn){
 const root=await mkdtemp(join(tmpdir(),'closet-preview-inventory-'));
 const dir=join(root,'staging-dist');
 await mkdir(join(dir,'icons'),{recursive:true});
 await mkdir(join(dir,'ai-models'),{recursive:true});
 await writeFile(join(dir,'index.html'),'<html>test</html>');
 await writeFile(join(dir,'auth.js'),'const live=false');
 await writeFile(join(dir,'icons','app-icon.png'),Buffer.from([0,255,18,1]));
 await writeFile(join(dir,'ai-models','female-preview.webp'),Buffer.from([82,73,70,70]));
 try{await createStagingAssetSeal(dir);await fn({root,dir});}
 finally{await rm(root,{recursive:true,force:true});}
}
test('sealed full asset inventory covers all generated files, nested binaries, manifest and query bypasses',async()=>{
 await kit(async({dir})=>{
  const paths=await pathsFromVerifiedStaging(dir);
  for(const p of ['/', '/index.html','/auth.js','/icons/app-icon.png',
   '/ai-models/female-preview.webp','/staging-asset-seal.json',
   '/auth.js?v=anonymous-access-probe'])
   assert.ok(paths.includes(p),'Missing generated route '+p);
  const manifest=JSON.parse(await readFile(join(dir,SEAL_FILE),'utf8'));
  for(const entry of manifest.files)assert.ok(paths.includes('/'+entry.path));
  assert.equal(new Set(paths).size,paths.length);
  const seen=[];
  const report=await probeAnonymousAccess(origins,{paths,request:async(url,options)=>{
   seen.push(url);assert.equal(options.credentials,'omit');assert.equal(options.redirect,'manual');
   return login();
  }});
  assert.equal(report.anonymousProbePassed,true);
  assert.equal(report.privateCloudflareAccessPolicyVerified,false);
  assert.equal(report.previewInventoryComplete,false);
  assert.equal(report.totalRoutes,paths.length);
  assert.equal(seen.length,origins.length*paths.length);
 });
});
test('a single unprotected image is detected on one preview while home is challenged',async()=>{
 await kit(async({dir})=>{
  const paths=await pathsFromVerifiedStaging(dir);
  const r=await probeAnonymousAccess(origins,{paths,request:async url=>
   url===origins[1]+'/ai-models/female-preview.webp'?
    new Response('public binary',{status:200}):login()});
  assert.equal(r.anonymousProbePassed,false);
  assert.deepEqual(r.results.filter(x=>x.outcome==='PUBLIC_RESPONSE').map(x=>x.path),
   ['/ai-models/female-preview.webp']);
 });
});
test('changed or removed asset prevents generation of an access-check inventory',async()=>{
 await kit(async({dir})=>{
  await writeFile(join(dir,'icons','app-icon.png'),Buffer.from([0,255,18,2]));
  await assert.rejects(pathsFromVerifiedStaging(dir),/STAGING_SEAL_REFUSED: changed asset/);
 });
});
test('an active build lock or interrupted candidate refuses all access path generation',async()=>{
 await kit(async({root,dir})=>{
  await writeFile(dir+'.build.lock','synthetic');
  await assert.rejects(pathsFromVerifiedStaging(dir),/staging build lock exists/);
  await rm(dir+'.build.lock');
  await writeFile(join(root,'staging-dist.incomplete-crashed'),'synthetic');
  await assert.rejects(pathsFromVerifiedStaging(dir),/unfinished staging candidate/);
 });
});
test('safe encoding of nested filenames without browsing outside the staged root',async()=>{
 await kit(async({dir})=>{
  await writeFile(join(dir,'icons','photo 1.png'),Buffer.from([1,2]));
  // New asset invalidates the hash seal, so no unverified route can be listed.
  await assert.rejects(pathsFromVerifiedStaging(dir),/added or deleted asset/);
 });
});
