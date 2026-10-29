import {neckSection,finishNecklineAndSeams,blendPhotoSeams} from '../research/three-d-22/neckline-seams.mjs';
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
test('Neckline requires original anatomical landmark and reviewed shirt',()=>{assert.throws(()=>finishNecklineAndSeams(null,new THREE.Group()));assert.throws(()=>neckSection(new THREE.Group()));});
for(const kind of ['female','male'])test(kind+' collar fit preserves original panels, source, body, sleeves and disposal',async()=>{
 const a=await person(kind),b=await person(kind);
 const old=createOutfitController(a,{necklineSeams:false}),current=createOutfitController(b,{necklineSeams:true});
 const first=old.setOutfit('shirt-pants',source(),{reviewed:true}),next=current.setOutfit('shirt-pants',source(),{reviewed:true});
 assert.equal(next.shirt.necklineSeams,true);assert.ok(next.shirt.necklineMovedVertices>100);assert.ok(next.shirt.maxNecklineMovement>.005&&next.shirt.maxNecklineMovement<=.065001);
 assert.ok(next.shirt.maxSurfaceMovement>.005&&next.shirt.maxSurfaceMovement<=.035001);
 assert.equal(next.shirt.sourceSHA256,first.shirt.sourceSHA256);const retained=current.getState();assert.throws(()=>current.setOutfit('shirt',source()),/reviewed/);assert.deepEqual(current.getState(),retained,'Unreviewed replacement must preserve current outfit');assert.equal(next.shirt.collisionValidated,false);
 const meshes=r=>{const out=[];r.traverse(m=>{if(m.isSkinnedMesh)out.push(m);});return out;};
 const left=meshes(a),right=meshes(b);assert.equal(left.length,right.length);
 let moved=0;
 for(let j=0;j<left.length;j++){
  const x=left[j],y=right[j];assert.equal(x.name,y.name);
  assert.deepEqual(Array.from(x.geometry.index?.array||[]),Array.from(y.geometry.index?.array||[]));
  const fx=fingerprint(x.geometry),fy=fingerprint(y.geometry);
  if(!x.userData.work56Garment){assert.deepEqual(fx,fy,'Body remains byte identical');continue;}
  for(const name of ['panelPosition','panelNormal','skinIndex','skinWeight'])assert.equal(fx[name],fy[name],name+' unchanged');
  if(fx.position!==fy.position)moved++;
  for(let i=0;i<x.geometry.attributes.position.count;i++){const px=new THREE.Vector3().fromBufferAttribute(x.geometry.attributes.position,i).applyMatrix4(x.matrixWorld),py=new THREE.Vector3().fromBufferAttribute(y.geometry.attributes.position,i).applyMatrix4(y.matrixWorld);if(Math.abs(px.x)>.23||px.y<1.45)assert.ok(px.distanceTo(py)<1e-7,'Existing sleeve/cuff and lower torso must remain fixed');assert.ok(px.distanceTo(py)<=.065001,'Bounded local displacement');}
  if(x.geometry.attributes.panelPosition)assert.deepEqual(x.geometry.attributes.panelPosition.array,y.geometry.attributes.panelPosition.array);
  assert.equal(y.skeleton.bones.length,163);
 }
 assert.ok(moved>=2,'Main shirt and neckline both fitted');
 current.setPose('source');const original=right.filter(m=>m.userData.work56Garment).map(m=>fingerprint(m.geometry));
 current.setPose('relaxed');current.setPose('source');
 assert.deepEqual(right.filter(m=>m.userData.work56Garment).map(m=>fingerprint(m.geometry)),original,'Pose changes do not rebuild geometry');
 const shirt=b.getObjectByName('Work56-independent-shirt-shell');let disposed=0;shirt.geometry.addEventListener('dispose',()=>disposed++);
 current.setOutfit('pants');assert.equal(disposed,1);assert.equal(shirt.parent,null);assert.equal(current.getState().garmentMeshes,1);
 current.setOutfit('shirt-pants',source(),{reviewed:true});current.setOutfit('none');assert.equal(current.getState().garmentMeshes,0);
 old.dispose();current.dispose();
});


test('Source photo seam blending preserves the central original sample and fails on contract drift',()=>{
 const material=new THREE.MeshStandardMaterial();material.onBeforeCompile=s=>{s.fragmentShader='photo.a*smoothstep(.95,1.,interiorAlpha)*front*chest*necklineInterior';};
 blendPhotoSeams(material);const shader={};material.onBeforeCompile(shader);assert.match(shader.fragmentShader,/smoothstep\(0.,.14,min\(panel.x,1.-panel.x\)\)/);
 assert.match(shader.fragmentShader,/photo.a/);assert.equal(material.customProgramCacheKey(),'3D22-original-photo-edge-feather-v1');
 const bad=new THREE.MeshStandardMaterial();blendPhotoSeams(bad);assert.throws(()=>bad.onBeforeCompile({fragmentShader:''}),/contract changed/);
});
