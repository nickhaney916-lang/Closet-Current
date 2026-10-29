import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {bridgeSourceCuffHem} from '../research/three-d-18/wrist-hem-bridge.mjs';
globalThis.ProgressEvent=class {};
const source=()=>({id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,realFabricTexture:true,
 cutout:{width:1920,height:2880,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]});
const fingerprint=g=>Object.fromEntries(['position','normal','panelPosition','panelNormal','skinIndex','skinWeight']
 .filter(n=>g.attributes[n]).map(n=>[n,Buffer.from(g.attributes[n].array.buffer,
 g.attributes[n].array.byteOffset,g.attributes[n].array.byteLength).toString('hex')]));
async function person(kind){
 const buf=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);
 assert.equal(createHash('sha256').update(buf).digest('hex'),SOURCES[kind].sha256);
 const parsed=await new GLTFLoader().parseAsync(buf.buffer.slice(
  buf.byteOffset,buf.byteOffset+buf.byteLength),'');
 const root=parsed.scene;root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root),scale=2/box.getSize(new THREE.Vector3()).y,
  center=box.getCenter(new THREE.Vector3());
 root.scale.multiplyScalar(scale);root.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
 root.updateMatrixWorld(true);return root;
}
test('No independent fabricated cuff without verified source-facing and original anatomical rig',()=>{
 for(const [source,body,options] of [
  [null,null,{}],[{meshes:[]},new THREE.Group(),{}],
  [{meshes:[]},new THREE.Group(),{extend:.04}],
  [{meshes:[]},new THREE.Group(),{radial:.05}]
 ])assert.throws(()=>bridgeSourceCuffHem(source,body,options));
});
for(const kind of ['female','male'])test(kind+
 ' bounded wrist continuation retains original photographed shirt, 3D17 facing and body byte identical',async()=>{
 const beforeBody=await person(kind),afterBody=await person(kind),candidate=source();
 const old=createOutfitController(beforeBody,{enableCuffBridge:false}),
  current=createOutfitController(afterBody,{enableCuffBridge:true});
 const oldState=old.setOutfit('shirt-pants',candidate,{reviewed:true}),
  after=current.setOutfit('shirt-pants',candidate,{reviewed:true});
 assert.equal(oldState.shirt.innerCuffFacing,true);
 assert.equal(oldState.shirt.anatomicalWristHemBridge,undefined);
 assert.equal(after.shirt.anatomicalWristHemBridge,true);
 assert.equal(after.shirt.collisionValidated,false);
 assert.equal(after.shirt.originalPhotoPixelsUnchanged,true);
 assert.equal(after.shirt.originalSkeletonUnchanged,true);
 assert.equal(after.shirt.photographicBridgePixels,false);
 assert.equal(after.shirt.sameSourceMedianMaterial,true);
 assert.equal(after.shirt.cuffBridgeExtension,.009);
 assert.equal(after.shirt.cuffBridgeRadial,.0008);
 assert.ok(after.shirt.cuffBridgeTriangles>=12);
 assert.ok(after.shirt.cuffBridgeEdges.L>=3&&after.shirt.cuffBridgeEdges.R>=3);
 assert.ok(after.shirt.cuffBridgeMaxMovement.L<=.0091);
 assert.ok(after.shirt.cuffBridgeMaxMovement.R<=.0091);
 assert.equal(after.garmentMeshes,oldState.garmentMeshes+1);
 assert.equal(after.shirt.sourceSHA256,oldState.shirt.sourceSHA256);
 assert.equal(after.pants.photoApplied,false);
 const find=(root,name)=>root.getObjectByName(name);
 const shellNames=['Work56-independent-shirt-shell','3D17-neutral-inner-cuff-facing'];
 for(const name of shellNames){
  const g1=find(beforeBody,name)?.geometry,g2=find(afterBody,name)?.geometry;
  assert.ok(g1&&g2,'Each original source garment mesh remains');
  assert.deepEqual(fingerprint(g1),fingerprint(g2),name+' shader source/skin must not be changed');
  assert.deepEqual(Array.from(g1.index.array),Array.from(g2.index.array));
 }
 const bodies=root=>{
  const x=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)x.push(o);});
  return x;
 };
 const a=bodies(beforeBody),b=bodies(afterBody);assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i++)assert.deepEqual(fingerprint(a[i].geometry),
  fingerprint(b[i].geometry),'Original CC0 skin never edited');
 const bridge=find(afterBody,'3D18-neutral-wrist-hem-bridge');
 const facing=find(afterBody,'3D17-neutral-inner-cuff-facing');
 assert.ok(bridge?.isSkinnedMesh&&bridge.skeleton===facing.skeleton);
 assert.equal(bridge.material,facing.material,'Original source-median material reused, no shader copy');
 assert.equal(bridge.geometry.getAttribute('position').count,
  facing.geometry.getAttribute('position').count);
 assert.ok(Array.from(bridge.geometry.getAttribute('panelPosition').array)
  .every((n,i)=>n===[0,-99,0][i%3]),'NO logo may be repeated at wrist');
 const w=bridge.geometry.getAttribute('skinWeight');
 for(let i=0;i<w.count;i++)
  assert.ok(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<.01);
 for(const pose of ['source','relaxed','source','relaxed']){
  current.setPose(pose);
  assert.equal(current.getState().shirt.sourceSHA256,candidate.sourceSHA256);
  assert.equal(current.getState().shirt.anatomicalWristHemBridge,true);
 }
 current.setOutfit('pants');
 assert.equal(bridge.parent,null,'Outfit removal must fully remove cuff extension');
 assert.equal(current.getState().garmentMeshes,1);
 old.dispose();current.dispose();
 assert.equal(afterBody.getObjectByName('3D18-neutral-wrist-hem-bridge'),undefined);
});
test('Cutout, account, model, privacy, staged release and paid service boundaries remain unchanged',async()=>{
 const paths=['research/three-d-18/wrist-hem-bridge.mjs',
 'research/three-d-15/outfit-controller.mjs','research/three-d-15/showroom.mjs',
 'research/three-d-15/demo.mjs'];
 for(const f of paths){
  const text=await readFile(f,'utf8');
  for(const pattern of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,
   /sendBeacon/,/openai\.com/,/cdn\.jsdelivr/,/unpkg\.com/])
   assert.doesNotMatch(text,pattern);
 }
 const s=await readFile(paths[0],'utf8'),ctrl=await readFile(paths[1],'utf8');
 assert.match(s,/panelPosition/);
 assert.match(s,/panels\.push\(0,-99,0\)/);
 assert.match(s,/collisionValidated:false/);
 assert.match(ctrl,/enableCuffBridge/);
 assert.match(ctrl,/enableCuffFacing&&enableCuffBridge/);
 assert.match(ctrl,/requireAnatomicalShirtPreview/);
});
