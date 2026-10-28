import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SOURCES,validateGLB} from '../research/three-d-06/fetch-licensed-avatars.mjs';
test('Two independently sourced commercial-reusable human figures, no paid models or personal data',()=>{
 assert.deepEqual(Object.keys(SOURCES),['male','female']);
 for(const [key,x]of Object.entries(SOURCES)){
  assert.equal(x.license,'CC0-1.0');
  assert.equal(x.sha256,null,'Discovery branch must not impersonate verified immutable SHA lock');
  assert.ok(x.source.startsWith('https://www.innerscene.com/tools/library/3d-parts/'));
  assert.ok(x.download.startsWith('https://www.innerscene.com/api/library/'));
  assert.equal(x.filename,key+'-cc0-rigged.glb');
 }
});
function fakeGLB({bones=163,triangles=100050,skinCount=1}={}){
 const json=JSON.stringify({asset:{version:'2.0'},meshes:[{primitives:[{mode:4,indices:0}]}],
  accessors:[{count:triangles*3}],nodes:Array.from({length:170},(_,i)=>({name:'bone-'+i})),
  skins:Array.from({length:skinCount},()=>({joints:Array.from({length:bones},(_,i)=>i)}))});
 const pad=(4-json.length%4)%4;
 const padded=json+' '.repeat(pad),chunk=Buffer.from(padded,'utf8');
 const bytes=Buffer.alloc(Math.max(11000,20+chunk.length));
 bytes.write('glTF',0,'ascii');bytes.writeUInt32LE(2,4);bytes.writeUInt32LE(bytes.length,8);
 bytes.writeUInt32LE(chunk.length,12);bytes.write('JSON',16,'ascii');chunk.copy(bytes,20);
 return bytes;
}
test('Binary GLB and nontrivial rig/geometry are validated before local browser use',()=>{
 const x=validateGLB(fakeGLB());
 assert.equal(x.bones,163);assert.equal(x.triangles,100050);
 assert.equal(x.meshes,1);assert.equal(x.skinCount,1);
 for(const invalid of [fakeGLB({bones:0}),fakeGLB({bones:6}),fakeGLB({triangles:50}),fakeGLB({skinCount:0}),
  new Uint8Array(10240),new Uint8Array(12000001)])assert.throws(()=>validateGLB(invalid));
});
test('This model branch cannot write private original clothing or retrieve customer-specific models',async()=>{
 const paths=['research/three-d-06/fetch-licensed-avatars.mjs','research/three-d-06/anatomical-showroom.mjs',
 'research/three-d-06/demo.mjs','research/three-d-06/index.html'];
 for(const path of paths){
  const text=await readFile(path,'utf8');
  for(const banned of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,/openai\.com/,/api\.openai\.com/,
   /jsdelivr\.net/,/unpkg\.com/,/readyplayer\.me/,/sessionStorage/,/navigator\.sendBeacon/])
   assert.doesNotMatch(text,banned);
 }
 const loader=await readFile('research/three-d-06/anatomical-showroom.mjs','utf8');
 assert.match(loader,/GLTFLoader/);assert.match(loader,/isSkinnedMesh/);
 assert.match(loader,/new THREE\.WebGLRenderer/);assert.match(loader,/localModel:true,releaseAuthorized:false/);
 const html=await readFile('research/three-d-06/index.html','utf8');
 assert.match(html,/node_modules\/three\/build\/three\.module\.js/);
 assert.match(html,/RESEARCH ONLY/);
});
