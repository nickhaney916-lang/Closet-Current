import {bodySurface,fitContinuousShirt} from '../research/three-d-20/surface-fit.mjs';
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
test('Continuous fitting requires an actual separately reviewed garment',()=>{assert.throws(()=>fitContinuousShirt(null,new THREE.Group()));});
for(const kind of ['female','male'])test(kind+' continuous source-pose relaxation preserves source pixels, skinning, body and disposal',async()=>{
 const a=await person(kind),b=await person(kind);
 const old=createOutfitController(a,{naturalFit:false}),current=createOutfitController(b,{naturalFit:true});
 const first=old.setOutfit('shirt-pants',source(),{reviewed:true}),next=current.setOutfit('shirt-pants',source(),{reviewed:true});
 assert.equal(next.shirt.continuousSurfaceFit,true);assert.ok(next.shirt.fitMovedVertices>1000);
 assert.ok(next.shirt.maxSurfaceMovement>.005&&next.shirt.maxSurfaceMovement<=.035001);
 assert.equal(next.shirt.sourceSHA256,first.shirt.sourceSHA256);assert.equal(next.shirt.collisionValidated,false);
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

test('Triangle query reaches face interiors, with correct transformed distance and outward normal',()=>{
 const root=new THREE.Group(),mesh=new THREE.SkinnedMesh(new THREE.BoxGeometry(1,1,1));root.add(mesh);
 mesh.position.set(.2,1,0);mesh.scale.set(2,2,2);root.updateMatrixWorld(true);
 const q=bodySurface(root)(new THREE.Vector3(.33,1.17,1.3));
 assert.ok(q.point.distanceTo(new THREE.Vector3(.33,1.17,1))<1e-6);
 assert.ok(Math.abs(q.distance-.3)<1e-6);assert.ok(q.normal.z>.999);
});
