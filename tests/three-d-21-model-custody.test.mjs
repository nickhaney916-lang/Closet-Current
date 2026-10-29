import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,stat,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {verifyLockedGLB,verifyTwoOriginals,importOriginalPinnedPair,
 CUSTODY_STATUS} from '../research/three-d-21/verified-model-import.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function syntheticGLB({bones=163,triangles=109064}={}){
 const j=JSON.stringify({asset:{version:'2.0'},
  nodes:Array.from({length:bones+5},(_,i)=>({name:'bone'+i})),
  skins:[{joints:Array.from({length:bones},(_,i)=>i)}],
  meshes:[{primitives:[{indices:0,mode:4}]}],
  accessors:[{count:triangles*3}]});
 const payload=Buffer.from(j+' '.repeat((4-j.length%4)%4));
 const data=Buffer.alloc(Math.max(11000,20+payload.length));
 data.write('glTF',0,'ascii');data.writeUInt32LE(2,4);
 data.writeUInt32LE(data.length,8);
 data.writeUInt32LE(payload.length,12);
 data.write('JSON',16,'ascii');payload.copy(data,20);
 return new Uint8Array(data);
}
test('Exactly two original independently SHA-pinned adult CC0 skeletons remain the only accepted inputs',()=>{
 assert.deepEqual(Object.keys(SOURCES),['male','female']);
 assert.ok(Object.values(SOURCES).every(s=>s.license==='CC0-1.0'&&
  /^[a-f0-9]{64}$/.test(s.sha256)&&s.filename.endsWith('.glb')));
 assert.notEqual(SOURCES.male.sha256,SOURCES.female.sha256);
 assert.equal(CUSTODY_STATUS.releaseAuthorized,false);
});
test('Reproducible GLB verifier recognizes true rig topology and immutable source bytes',()=>{
 const data=syntheticGLB(),expectedSHA=sha(data);
 const actual=verifyLockedGLB(data,{kind:'male',expectedSHA});
 assert.equal(actual.sha256,expectedSHA);
 assert.equal(actual.bones,163);
 assert.equal(actual.triangles,109064);
 assert.equal(actual.releaseAuthorized,false);
 assert.equal(actual.originalSourcePreserved,true);
});
test('A changed publisher response or malformed rig NEVER gets automatically re-pinned',()=>{
 const good=syntheticGLB();
 for(const bad of [
  {bytes:good,kind:'male',expectedSHA:'f'.repeat(64)},
  {bytes:good,kind:'unknown',expectedSHA:sha(good)},
  {bytes:good,kind:'male',expectedSHA:'not-a-hash'},
  {bytes:good,kind:'male',expectedSHA:sha(good),license:'restricted'},
  {bytes:syntheticGLB({bones:6}),kind:'male',expectedSHA:sha(syntheticGLB({bones:6}))},
  {bytes:good.subarray(0,9000),kind:'male',expectedSHA:sha(good.subarray(0,9000))}
 ]) assert.throws(()=>verifyLockedGLB(bad.bytes,bad),/required|mismatch|limits|skeleton/i);
});
test('Full-pair source custody refuses a good-shaped but hash-drifted model and writes nothing',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-3d21-'));
 try{
  const male=join(dir,'male.glb'),female=join(dir,'female.glb'),dest=join(dir,'verified-pair');
  await writeFile(male,syntheticGLB());await writeFile(female,syntheticGLB());
  await assert.rejects(verifyTwoOriginals({malePath:male,femalePath:female}),/LOCKED_SHA_MISMATCH/);
  await assert.rejects(importOriginalPinnedPair({malePath:male,femalePath:female,output:dest}),/LOCKED_SHA_MISMATCH/);
  await assert.rejects(stat(dest),{code:'ENOENT'});
  await assert.rejects(verifyTwoOriginals({malePath:male,femalePath:male}),/independent/);
  await assert.rejects(importOriginalPinnedPair({malePath:male,femalePath:female,output:resolve('research/three-d-06/models')}),/active research model/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('No network, overwrite, original-pixels mutation, cloud apps, paid inference or backup token use',async()=>{
 const s=await readFile('research/three-d-21/verified-model-import.mjs','utf8');
 assert.doesNotMatch(s,/fetch\(|axios|supabase\.co|Cloudflare|readyplayer|openai\.com|localStorage|indexedDB|getUserMedia/);
 assert.match(s,/sha256/);assert.match(s,/const actualSHA=sha\(bytes\)/);
 assert.match(s,/releaseAuthorized:false/);
 assert.match(s,/readBounded\(resolve\(tmp,SOURCES\[kind\]\.filename\)\)/);
 assert.match(s,/LOCKED_SHA_MISMATCH/);
 const w=await readFile('.github/workflows/three-d-21-pinned-model-custody-no-deploy.yml','utf8');
 assert.doesNotMatch(w,/supabase-cli|wrangler publish|npm run build:production|cloudflare deploy/i);
 assert.match(w,/node --test tests\/three-d-21-model-custody\.test\.mjs/);
});
