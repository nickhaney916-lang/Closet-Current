import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {setFashionPose,softenNormalSeams} from '../research/work57-showroom/relaxed-pose.mjs';import {SOURCES,validateGLB} from '../research/three-d-06/fetch-licensed-avatars.mjs';
globalThis.ProgressEvent=class{};
for(const kind of ['female','male'])test(kind+': exact licensed source; reversible bone-only pose and cloned normal smoothing',async()=>{
 const b=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);assert.equal(createHash('sha256').update(b).digest('hex'),SOURCES[kind].sha256);assert.equal(validateGLB(b).bones,163);
 const {scene:root}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),scale=2/box.getSize(new T.Vector3()).y,center=box.getCenter(new T.Vector3());root.scale.multiplyScalar(scale);root.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);root.updateMatrixWorld(true);
 const meshes=[],bones=[];root.traverse(o=>{if(o.isSkinnedMesh)meshes.push({o,g:o.geometry,p:Array.from(o.geometry.attributes.position.array),w:Array.from(o.geometry.attributes.skinWeight.array),n:Array.from(o.geometry.attributes.normal.array),s:o.skeleton});if(o.isBone)bones.push([o,o.quaternion.clone()]);});
 const world=name=>bones.find(([o])=>o.name===name)[0].getWorldPosition(new T.Vector3());
 const wrist=world('wristL'),pelvis=world('pelvisL'),foot=world('footL');
 const result=setFashionPose(root,'relaxed');assert.equal(result.bones,163);assert.ok(world('wristL').y<wrist.y-.035,'Arm should lower visibly');assert.ok(world('wristL').x>.20,'Hand remains away from hip');assert.ok(world('pelvisL').distanceTo(pelvis)<1e-8);assert.ok(world('footL').distanceTo(foot)<1e-8);
 const first=bones.map(([o])=>o.quaternion.clone());setFashionPose(root,'relaxed');bones.forEach(([o],i)=>assert.ok(o.quaternion.toArray().every((v,k)=>Math.abs(v-first[i].toArray()[k])<1e-12),'Pose must not accumulate'));setFashionPose(root,'source');bones.forEach(([o,q])=>assert.ok(o.quaternion.equals(q)));
 assert.throws(()=>setFashionPose(root,'arbitrary'),/Unsupported/);softenNormalSeams(root);
 for(const {o,g,p,w,n,s} of meshes){assert.notEqual(o.geometry,g);assert.deepEqual(Array.from(g.attributes.normal.array),n);assert.equal(o.skeleton,s);assert.deepEqual(Array.from(o.geometry.attributes.position.array),p);assert.deepEqual(Array.from(o.geometry.attributes.skinWeight.array),w);}
 console.log('POSE_LANDMARK',kind,{sourceWrist:wrist.toArray(),relaxedWrist:(setFashionPose(root,'relaxed'),world('wristL').toArray())});
});
test('Exact original renderer and application scope preserved',async()=>{
 const base='e24dcbe417fcca9e52f412f83e65f8ebe58a49c3';
 const expected=execFileSync('git',['show',base+':research/three-d-06/anatomical-showroom.mjs']);assert.deepEqual(await readFile('research/three-d-06/anatomical-showroom.mjs'),expected);
 const files=execFileSync('git',['diff','--name-only',base],{encoding:'utf8'}).trim().split('\n').filter(Boolean);for(const p of files)assert.match(p,/^(research\/work57-showroom\/|scripts\/test-work57-|tests\/work57-|\.github\/workflows\/work57-)/);
});
