import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildGarmentShell} from '../research/three-d-08/garment-shell.mjs';
globalThis.ProgressEvent=class{};
const item={id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),ownerApproved:false,releaseAuthorized:false,realFabricTexture:true,humanVisualApproval:false,cutout:{decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]};
for(const kind of ['female','male'])test(kind+' separate shell preserves original geometry and binds actual skeleton',async()=>{
 const b=await readFile(`research/three-d-06/models/${kind}-cc0-rigged.glb`);
 const {scene:root}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),s=2/box.getSize(new T.Vector3()).y,c=box.getCenter(new T.Vector3());root.scale.multiplyScalar(s);root.position.set(-c.x*s,-box.min.y*s,-c.z*s);root.updateMatrixWorld(true);
 const originals=[];root.traverse(o=>{if(o.isSkinnedMesh)originals.push({o,positions:Array.from(o.geometry.attributes.position.array)});});
 assert.throws(()=>buildGarmentShell(root,item),/reviewed/);
 const shell=buildGarmentShell(root,item,{acknowledged:true});assert.ok(shell.stats.triangles>1000);assert.equal(shell.stats.skinBones,163);
 let moved=false;
 for(const mesh of shell.meshes){
  assert.ok(originals.some(x=>x.o.skeleton===mesh.skeleton));assert.ok(!originals.some(x=>x.o.geometry===mesh.geometry));
  const w=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<w.count;i++){const sum=w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i);assert.ok(Math.abs(sum-1)<.0001);}
  const p=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,0);const before=mesh.applyBoneTransform(0,p.clone());
  const bone=mesh.skeleton.bones[mesh.geometry.attributes.skinIndex.getX(0)];const old=bone.position.x;bone.position.x+=.02;root.updateMatrixWorld(true);mesh.skeleton.update();const after=mesh.applyBoneTransform(0,p.clone());if(before.distanceTo(after)>.00001)moved=true;bone.position.x=old;root.updateMatrixWorld(true);mesh.skeleton.update();
 }
 assert.ok(moved,'Garment must follow actual source skeleton');
 for(const {o,positions} of originals)assert.deepEqual(Array.from(o.geometry.attributes.position.array),positions);
 shell.dispose();assert.ok(shell.meshes.every(m=>!m.parent));assert.equal(shell.stats.releaseAuthorized,false);
});
test('No shared renderer or application change',async()=>{
 const {execFileSync}=await import('node:child_process');
 const names=execFileSync('git',['diff','--name-only','ac7d2bd1f2c223baf61fa0c3580cbc3b9b1330ec'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const p of names)assert.match(p,/^(research\/three-d-08\/|tests\/three-d-08-|scripts\/test-three-d-08-|\.github\/workflows\/three-d-08-)/);
});
