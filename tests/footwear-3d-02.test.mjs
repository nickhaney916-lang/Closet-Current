import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import * as THREE from 'three';
import {loadApprovedFootwear02,createFootwear02Session,FOOTWEAR02_SOURCES} from '../research/footwear-3d-02/source-shoes.mjs';
globalThis.crypto ||= webcrypto;
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=async id=>{
 const bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 return {bytes,pin:FOOTWEAR02_SOURCES[id],record:manifest.find(x=>x.id===id)};
};
function fetcher(bytes,entries=manifest){
 return async path=>({ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),json:async()=>entries});
}
test('two CC0 original low-top references are immutable, byte-SHA verified, and only partial photographed views',async()=>{
 for(const id of ['commons-0080','commons-0081']){
  const {bytes,pin,record}=await source(id);assert.equal(sha(bytes),pin.sha);
  assert.equal(record.attribution.license,'CC0');assert.ok(record.attribution.source.startsWith('https://commons.wikimedia.org/'));
  const cap=await loadApprovedFootwear02(id,{fetcher:fetcher(bytes)});
  assert.equal(cap.sourceSHA256,sha(bytes));assert.equal(cap.originalPhotoPreserved,true);
  assert.equal(cap.photoProjectedOn3D,false);assert.equal(cap.secondSidePhotographed,false);
  assert.equal(cap.releaseAuthorized,false);
  assert.equal(sha(await readFile('benchmark/fixtures/'+id+'.jpg')),pin.sha,'original bytes remain unchanged');
 }
});
test('modified source bytes or unsupported license never authenticate footwear',async()=>{
 const {bytes}=await source('commons-0080');let fake=Buffer.from(bytes);fake[100]^=1;
 await assert.rejects(loadApprovedFootwear02('commons-0080',{fetcher:fetcher(fake)}),/SHA-256 mismatch/);
 const wrong=manifest.map(x=>x.id==='commons-0080'?{...x,attribution:{...x.attribution,license:'unknown'}}:x);
 await assert.rejects(loadApprovedFootwear02('commons-0080',{fetcher:fetcher(bytes,wrong)}),/License\/source/);
 await assert.rejects(loadApprovedFootwear02('unsupported'),/No approved source/);
});
function anatomy(){
 const pts=[];
 for(const sign of [-1,1])for(let i=0;i<60;i++){
  const z=-.07+(i%15)*(.26/14),x=sign*(.12+((i/15)|0)*.017),y=.009+((i/7)|0)%4*.015;
  pts.push(x,y,z);
 }
 for(const sign of [-1,1])for(let i=0;i<18;i++)pts.push(sign*(.11+(i%3)*.02),.20+(i%3)*.02,-.045);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
 const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial());
 mesh.isSkinnedMesh=true;mesh.skeleton={bones:new Array(163)};
 const group=new THREE.Group();group.add(mesh);return group;
}
test('two independent real-proportion meshes, bounded floor, repeated swaps dispose, preserve camera and 163 rig',async()=>{
 const root=anatomy(),attached=new Set(),owner={ownerId:'A',generation:4};
 const viewer={getState:()=>({stats:{bones:163},cameraPosition:[0,1.3,4.25],kind:'female'}),
 getResearchFootwearAnchor:()=>({root,add:n=>{attached.add(n);root.add(n);},remove:n=>{attached.delete(n);root.remove(n);}})};
 assert.throws(()=>createFootwear02Session({viewer,checkOwner:()=>owner,ownerId:'A',generation:4}),/OFF by default/);
 const session=createFootwear02Session({viewer,checkOwner:()=>owner,ownerId:'A',generation:4,enabled:true});
 const {bytes:a}=await source('commons-0080'),{bytes:b}=await source('commons-0081');
 const ca=await loadApprovedFootwear02('commons-0080',{fetcher:fetcher(a)});
 const cb=await loadApprovedFootwear02('commons-0081',{fetcher:fetcher(b)});
 for(let i=0;i<24;i++){
  const result=session.swap(i%2?ca:cb);
  assert.equal(result.status,'PROVISIONAL_SOURCE_INFORMED_MESH');
  assert.equal(result.footMeasurements.length,2);assert.equal(result.independentLeftRight,true);
  assert.ok(result.groundErrors.every(v=>v<=.012));
  const state=session.state();assert.equal(state.pairCount,2);assert.equal(state.meshCount,6);
  assert.notEqual(state.geometryIds[0],state.geometryIds[1]);
  assert.deepEqual(state.camera,[0,1.3,4.25]);
  assert.equal(attached.size,2,'old shoe pairs must detach before next swap');
 }
 assert.equal(session.state().swaps,24);
 assert.equal(session.swap({id:'commons-0080',sourceSHA256:ca.sourceSHA256}).status,'PHOTO_ONLY_FALLBACK','forged source objects never pass WeakSet');
 assert.equal(attached.size,0);
 session.swap(ca);
 owner.ownerId='B';assert.throws(()=>session.state(),/Owner changed/);
 assert.equal(attached.size,0,'owner invalidation removes all preview meshes');
});
test('missing source leaves existing outfit and original anatomical geometry unchanged',async()=>{
 const root=anatomy(),before=root.children[0].geometry.uuid,owner={ownerId:'A',generation:1};
 const session=createFootwear02Session({viewer:{getState:()=>({stats:{bones:163},kind:'male'}),getResearchFootwearAnchor:()=>({root,add:x=>root.add(x),remove:x=>root.remove(x)})},
 checkOwner:()=>owner,ownerId:'A',generation:1,enabled:true});
 assert.equal(session.swap(null).status,'PHOTO_ONLY_FALLBACK');assert.equal(root.children[0].geometry.uuid,before);
 assert.equal(root.children.length,1);session.dispose();
});
