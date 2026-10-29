import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {ARCHIVE,readApprovedGitArchivedGLB,
 recoverOriginalModels} from '../research/three-d-22/recover-original-cc0.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('Only frozen Work63 archive commit and both exact original model Git blobs are authorized',()=>{
 assert.equal(ARCHIVE.commit,'926c85ebf9d2d29c919771f3dcd6c1527208b63c');
 assert.equal(ARCHIVE.male.gitBlob,'d0f424cdeb0cbd441bba90d16a9030d5e7db0ce8');
 assert.equal(ARCHIVE.female.gitBlob,'eff0a2bde56b2e8da62c32684fb5cc11b3db0423');
 assert.throws(()=>readApprovedGitArchivedGLB('child'),/Only named original/);
 assert.equal(SOURCES.male.sha256,'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8');
 assert.equal(SOURCES.female.sha256,'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1');
});
test('Real Git archived male and female GLBs decompress to EXACT old approved SHA and original rigs',()=>{
 for(const kind of ['male','female']){
  const x=readApprovedGitArchivedGLB(kind);
  assert.equal(x.kind,kind);
  assert.equal(x.archiveCommit,ARCHIVE.commit);
  assert.equal(x.archiveBlob,ARCHIVE[kind].gitBlob);
  assert.equal(x.sourceSHA256,SOURCES[kind].sha256);
  assert.equal(sha(x.bytes),SOURCES[kind].sha256);
  assert.equal(x.verified.sha256,SOURCES[kind].sha256);
  assert.ok(x.verified.bones>=100);
  assert.ok(x.verified.triangles>=100000);
  assert.equal(x.verified.license,'CC0-1.0');
  assert.equal(x.verified.releaseAuthorized,false);
  console.log('THREE_D_22_GENUINE_ORIGINAL_GLB',JSON.stringify({
   kind,sha256:x.sourceSHA256,bones:x.verified.bones,
   triangles:x.verified.triangles,archiveBlob:x.archiveBlob
  }));
 }
});
test('Immutable archive path → blob mismatch rejects model before decompression',()=>{
 const original=readApprovedGitArchivedGLB('male');
 const fakeGit=(args,opt)=>{
  if(args[0]==='rev-parse')return '0'.repeat(40);
  return original.bytes;
 };
 assert.throws(()=>readApprovedGitArchivedGLB('male',{gitRead:fakeGit}),
  /Archive Git object identity changed/);
});
test('Offline atomic custody of BOTH original GLBs, and safe refusal of repeat overwrite',async()=>{
 const base=await mkdtemp(join(tmpdir(),'three-d-22-qa-'));
 const output=join(base,'new-original-pair');
 try{
  const result=await recoverOriginalModels({output,populateResearchRuntime:false});
  assert.equal(result.researchRuntimePopulated,false);
  assert.equal(result.productionTouched,false);
  assert.equal(result.releaseAuthorized,false);
  assert.equal(result.archiveCommit,ARCHIVE.commit);
  for(const kind of ['male','female']){
   const bytes=await readFile(join(output,SOURCES[kind].filename));
   assert.equal(sha(bytes),SOURCES[kind].sha256);
  }
  const manifest=JSON.parse(await readFile(join(output,'verified-assets.json'),'utf8'));
  assert.equal(manifest.releaseAuthorized,false);
  assert.equal(manifest.productionTouched,false);
  assert.equal(manifest.sourceFiles.length,2);
  await assert.rejects(recoverOriginalModels({output}),/Refusing to overwrite existing model custody directory/);
 }finally{await rm(base,{recursive:true,force:true});}
});
test('Two-source failure cannot create custody, cannot substitute newly changed publisher file',async()=>{
 const base=await mkdtemp(join(tmpdir(),'three-d-22-blocked-'));
 const output=join(base,'should-not-exist');
 try{
  await assert.rejects(recoverOriginalModels({
   output,populateResearchRuntime:false,
   readArchive:kind=>kind==='male'?readApprovedGitArchivedGLB('male'):{
    ...readApprovedGitArchivedGLB('female'),sourceSHA256:'f'.repeat(64)
   }
  }),/Immutable original model identity required/);
  await assert.rejects(stat(output),{code:'ENOENT'});
 }finally{await rm(base,{recursive:true,force:true});}
});
test('No model downloading, user account or deployment integration in offline recovery',async()=>{
 const code=await readFile('research/three-d-22/recover-original-cc0.mjs','utf8');
 for(const re of [/https:\/\//,/fetch\(/,/curl/,/wget/,/supabase\.co/,/getUserMedia/,/localStorage/,
  /indexedDB/,/cloudflare\.com/,/openai\.com/,/deploy\b/i])
  assert.doesNotMatch(code,re);
 assert.match(code,/importOriginalPinnedPair/);
 assert.match(code,/verifyLockedGLB/);
 assert.match(code,/gitBlob/);
 assert.match(code,/releaseAuthorized:false/);
});
