import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkStagingArtifactIntegrity} from '../scripts/check-staging-artifact-integrity.mjs';

async function scratch(fn){
 const root=await mkdtemp(join(tmpdir(),'cc-artifact-'));
 const dir=join(root,'staging-dist');await mkdir(dir);
 try{return await fn({root,dir});}
 finally{await rm(root,{recursive:true,force:true});}
}
test('ordinary generated-looking bundle is reviewable but never deploy-approved',async()=>{
 await scratch(async({dir})=>{
  await mkdir(join(dir,'assets'));
  await writeFile(join(dir,'index.html'),'PRIVATE STAGING — DISPOSABLE TEST ACCOUNTS ONLY');
  await writeFile(join(dir,'assets','app.js'),'const endpoint="https://abcdefghijklmnopqrst.supabase.co";');
  const report=await checkStagingArtifactIntegrity(dir);
  assert.equal(report.fileCount,2);
  assert.equal(report.knownLiveServiceRefsAbsent,true);
  assert.equal(report.buildLockAbsent,true);
  assert.equal(report.permittedToDeploy,false);
  assert.equal(report.productionPromotion,'BLOCKED');
 });
});
test('in-progress or stale staging build lock refuses review and preserves candidate contents',async()=>{
 await scratch(async({dir})=>{
  await writeFile(join(dir,'index.html'),'safe source');
  await writeFile(dir+'.build.lock','synthetic interrupted builder');
  await assert.rejects(checkStagingArtifactIntegrity(dir),/staging build lock exists/);
  assert.equal(await readFile(join(dir,'index.html'),'utf8'),'safe source');
 });
});
test('orphaned incomplete sibling refuses review without deleting any files',async()=>{
 await scratch(async({dir})=>{
  await writeFile(join(dir,'index.html'),'safe source');
  await writeFile(dir+'.incomplete-999999-deadbeef','not safe');
  await assert.rejects(checkStagingArtifactIntegrity(dir),/unfinished staging candidate/);
  assert.equal(await readFile(join(dir,'index.html'),'utf8'),'safe source');
 });
});
test('live Closet Current and Drive Duel references refuse review even in unrelated JS/JSON',async()=>{
 await scratch(async({dir})=>{
  await mkdir(join(dir,'assets'));
  await writeFile(join(dir,'index.html'),'safe');
  for(const ref of ['hlkgymugtfbirlpunsra','qlwotqbqxpgkheitsboe']){
   const path=join(dir,'assets','other.json');
   await writeFile(path,JSON.stringify({backend:'https://'+ref+'.supabase.co'}));
   await assert.rejects(checkStagingArtifactIntegrity(dir),/live-service reference/);
  }
 });
});
test('symbolic links to outside file or folder refuse review', {skip:process.platform==='win32'},async()=>{
 await scratch(async({root,dir})=>{
  await writeFile(join(dir,'index.html'),'safe');
  await writeFile(join(root,'outside.txt'),'no external file');
  await symlink(join(root,'outside.txt'),join(dir,'linked.txt'));
  await assert.rejects(checkStagingArtifactIntegrity(dir),/linked or special staging entry/);
  await rm(join(dir,'linked.txt'));
  await symlink(root,join(dir,'linked-directory'));
  await assert.rejects(checkStagingArtifactIntegrity(dir),/linked or special staging entry/);
 });
});
test('the staging root itself cannot be a symlink', {skip:process.platform==='win32'},async()=>{
 await scratch(async({root,dir})=>{
  const outside=join(root,'outside');
  await mkdir(outside);await writeFile(join(outside,'index.html'),'looks safe');
  const alias=join(root,'alternate-staging');
  await symlink(outside,alias);
  await assert.rejects(checkStagingArtifactIntegrity(alias),/staging root must be a real directory/);
 });
});
test('empty staging candidate and invalid paths fail closed',async()=>{
 await scratch(async({dir})=>{
  await assert.rejects(checkStagingArtifactIntegrity(dir),/empty staging bundle/);
  await assert.rejects(checkStagingArtifactIntegrity(''),{name:'TypeError'});
 });
});
