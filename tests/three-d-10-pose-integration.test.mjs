import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {setFashionPose} from '../research/three-d-10/relaxed-pose.mjs';
import {buildGarmentShell} from '../research/three-d-08/garment-shell.mjs';
globalThis.ProgressEvent ??= class {};
const SOURCE='593a9044ab3c79ce9d99537648f57c680342c46f';
test('Work57 relaxed pose module reused without editing its content and Work56 shell original remains immutable',async()=>{
 const code=await readFile('research/three-d-10/relaxed-pose.mjs');
 assert.equal(createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+code.length+'\0'),code
 ])).digest('hex'),SOURCE,'Copied pose module no longer byte-identical to verified Work57');
 const shell=await readFile('research/three-d-08/garment-shell.mjs','utf8');
 assert.match(shell,/originalPhotoSpan/);
 assert.match(shell,/requireAnatomicalShirtPreview/);
 assert.match(shell,/shell\.bind\(original\.skeleton,original\.bindMatrix\)/);
 assert.doesNotMatch(shell,/setFashionPose/,'Shared Work56 shell builder remains unedited');
});
const candidate={id:'commons-0003',type:'shirt',sourceSHA256:'b'.repeat(64),
 ownerApproved:false,releaseAuthorized:false,realFabricTexture:true,humanVisualApproval:false,
 cutout:{width:1920,height:2880,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]};
for(const kind of ['male','female'])test(kind+' actual Work56 shirt skeleton follows Work57 relaxed arm rotations and restores source pose',async()=>{
 const b=await readFile('research/three-d-06/models/'+kind+'-cc0-rigged.glb');
 const {scene:root}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root),s=2/box.getSize(new THREE.Vector3()).y,
  c=box.getCenter(new THREE.Vector3());
 root.scale.multiplyScalar(s);root.position.set(-c.x*s,-box.min.y*s,-c.z*s);
 root.updateMatrixWorld(true);
 const originals=[];root.traverse(o=>{if(o.isSkinnedMesh)originals.push(o);});
 const beforeQuats=new Map();root.traverse(o=>{if(o.isBone)beforeQuats.set(o,o.quaternion.clone());});
 assert.equal(setFashionPose(root,'source').mode,'source');
 const garment=buildGarmentShell(root,candidate,{acknowledged:true});
 // Work56 attaches newly skinned geometry after the glTF scene was first
 // normalized. In the browser, renderer.render refreshes the world pose.
 // For a rigorous Node before/after test, refresh those matrices explicitly.
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 assert.ok(garment.stats.triangles>1000);
 assert.equal(garment.stats.skinBones,163);
 const sample=garment.meshes.find(m=>m.geometry.attributes.position.count>100);
 assert.ok(sample);
 assert.ok(originals.some(m=>m.skeleton===sample.skeleton),'Both meshes must reuse exact original skeleton');
 const arm=()=>{let v;root.traverse(o=>{if(o.isBone&&o.name.replaceAll('.','')==='wristL')v=o.getWorldPosition(new THREE.Vector3());});return v;};
 const wristSource=arm(),geoVertices=new Float32Array(sample.geometry.attributes.position.array);
 const q0=sample.geometry.attributes.position;
 const index=sample.geometry.attributes.skinIndex;
 let chosen=-1;
 for(let i=0;i<Math.min(index.count,10000);i++){
  const influences=[index.getX(i),index.getY(i),index.getZ(i),index.getW(i)];
  const weights=sample.geometry.attributes.skinWeight;
  const values=[weights.getX(i),weights.getY(i),weights.getZ(i),weights.getW(i)];
  const armW=influences.some((id,k)=>values[k]>.03&&
    /(?:upperarm|lowerarm|wrist)/i.test(sample.skeleton.bones[id]?.name||''));
  if(armW){chosen=i;break;}
 }
 assert.ok(chosen>=0,'A real shirt-sleeve vertex must be influenced by the rig arm');
 const rest=new THREE.Vector3().fromBufferAttribute(q0,chosen);
 const before=sample.applyBoneTransform(chosen,rest.clone());
 const relaxed=setFashionPose(root,'relaxed');
 const wristRelaxed=arm();
 const after=sample.applyBoneTransform(chosen,rest.clone());
 assert.ok(wristRelaxed.distanceTo(wristSource)>.018,'Actual lower arm moved from frozen A-pose');
 assert.ok(before.distanceTo(after)>.005,'Actual separate garment sleeve deforms with shared arm skeleton');
 assert.equal(relaxed.measurementFit,false);
 assert.deepEqual(sample.geometry.attributes.position.array,geoVertices,'Garment rest-space photos/mesh bytes remain unchanged');
 const q=setFashionPose(root,'source');
 const returned=sample.applyBoneTransform(chosen,rest.clone());
 assert.equal(q.mode,'source');
 const roundTripDrift=returned.distanceTo(before);
 const maxBoneError=Math.max(...[...beforeQuats].flatMap(([bone,quat])=>
  ['x','y','z','w'].map(axis=>Math.abs(bone.quaternion[axis]-quat[axis]))));
 console.log('THREE_D_10_POSE_RETURN_DIAGNOSTIC',JSON.stringify({
  kind,sourceVertex:before.toArray(),returnedVertex:returned.toArray(),
  roundTripDrift,maxBoneError,relaxedVertex:after.toArray(),
  originalSourceQuaternionRestored:maxBoneError<.00002
 }));
 assert.ok(roundTripDrift<.0003,'Round trip pose must restore source garment position');
 for(const [bone,quat] of beforeQuats)assert.ok(['x','y','z','w'].every(axis=>Math.abs(bone.quaternion[axis]-quat[axis])<.000002),'Source rig quaternion components must restore precisely');
 garment.dispose();assert.ok(garment.meshes.every(m=>!m.parent));
});
test('Experimental shell viewer guards fit-in-source-pose before rendering relaxed and refuses body-paint',async()=>{
 const s=await readFile('research/three-d-08/shell-showroom.mjs','utf8');
 assert.match(s,/setFashionPose\(selected,'source'\)/);
 assert.match(s,/buildGarmentShell\(selected,candidate,\{acknowledged\}\)/);
 assert.match(s,/setFashionPose\(selected,pose\)/);
 assert.match(s,/Body-paint photography cannot safely follow relaxed bones/);
 assert.match(s,/setPose,/);
 assert.match(s,/garmentFollowsSameSkeleton/);
 const ui=await readFile('research/three-d-08/demo.mjs','utf8');
 const html=await readFile('research/three-d-08/index.html','utf8');
 assert.ok(ui.includes("$('pose')"),'Pose must be a controlled element in original shirt viewer');
 assert.ok(ui.includes('clear()'),'Review withdrawal must clear photo even when posing');
 assert.match(html,/id="pose"/);
 assert.match(html,/value="source"/);
 assert.match(html,/value="relaxed"/);
 for(const str of [ui,s,html]){
  for(const re of [/supabase\.co/,/localStorage/,/indexedDB/,/sendBeacon/,/getUserMedia/,/openai\.com/])
   assert.doesNotMatch(str,re);
 }
});
