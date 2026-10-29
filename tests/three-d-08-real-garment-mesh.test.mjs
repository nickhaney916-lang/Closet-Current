import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {shirtZone,addFittedFrontPanel,buildSeparateShirtShell,makeSourceClothingMaterial}
 from '../research/three-d-08/garment-shell.mjs';
test('3D shell uses separate anatomical torso and sleeve surfaces with sane bounds',()=>{
 assert.equal(shirtZone({x:0,y:1.4,z:.2}),'torso');
 assert.equal(shirtZone({x:.59,y:1.4,z:0}),'sleeve');
 for(const p of [{x:0,y:1.9,z:0},{x:0,y:.4,z:0},{x:1.4,y:1.4,z:0},
  {x:0,y:1.4,z:1.2},{x:NaN,y:1.4,z:0}])
  assert.equal(shirtZone(p),null);
 assert.throws(()=>buildSeparateShirtShell(null,null),/Verified rigged/);
});
test('Real 3D front panel uses sampled body curvature and leaves no center chest hole',()=>{
 const body=[];
 for(let j=0;j<=32;j++)for(let i=0;i<=32;i++){
  const x=-.42+i*.84/32,y=1.06+j*.64/32;
  const z=.17+.11*(1-(x/.5)**2)+.03*Math.cos(y*5);
  body.push({x,y,z});
 }
 const coords=[],UV=[],panel=addFittedFrontPanel(body,coords,UV);
 assert.equal(panel.triangles,640);
 assert.equal(coords.length,640*3*3);
 assert.equal(UV.length,640*3*2);
 assert.equal(panel.sourceDerivedDepth,true);
 assert.ok(coords.filter((_,i)=>i%3===2).every(z=>z>.1));
 // The panel must not be a flat sticker; center and shoulder differ in depth.
 const depths=coords.filter((_,i)=>i%3===2);
 assert.ok(Math.max(...depths)-Math.min(...depths)>.04);
 assert.throws(()=>addFittedFrontPanel([],[],[]));
});

test('Separate shirt material accepts only source-bound original RGB and alpha',()=>{
 assert.throws(()=>makeSourceClothingMaterial(null),/verified/);
 assert.throws(()=>makeSourceClothingMaterial({verified:true}),/verified/);
 const material=makeSourceClothingMaterial({
  verified:true,releaseAuthorized:false,cropRect:[.1,.2,.8,.65],
  baseColor:[.12,.11,.1],textureImage:{width:480,height:640}
 });
 assert.ok(material.material instanceof THREE.MeshStandardMaterial);
 assert.ok(material.texture instanceof THREE.Texture);
 assert.equal(material.originalSourcePixels,true);
 assert.equal(material.photoBackKnown,false);
 assert.equal(material.photographedSleeves,false);
 material.texture.dispose();material.material.dispose();
});
test('The actual body and garment have distinct THREE geometry and scene objects',async()=>{
 const s=await readFile('research/three-d-06/anatomical-showroom.mjs','utf8');
 const shell=await readFile('research/three-d-08/garment-shell.mjs','utf8');
 assert.match(s,/const build=buildSeparateShirtShell\(selected,group\)/);
 assert.match(s,/const garment=new THREE\.Mesh\(build\.geometry,m\.material\)/);
 assert.match(s,/group\.add\(garment\)/);
 assert.match(s,/group\.remove\(shellMesh\)/);
 assert.match(s,/shellMesh\.geometry\.dispose/);
 assert.match(s,/applySeparateGarment/);
 assert.match(shell,/applyBoneTransform/);
 assert.match(shell,/new THREE\.BufferGeometry/);
 assert.match(shell,/computeVertexNormals/);
 assert.match(shell,/original=texture2D\(uActualSource,uv\)/);
 assert.match(shell,/photoBackKnown:false/);
 assert.match(shell,/garmentRigged:false/);
});
test('Original Work47 reviewed JPEG/PNG hashes and human review remain mandatory',async()=>{
 const [demo,upstream]=await Promise.all([
  readFile('research/three-d-08/demo.mjs','utf8'),
  readFile('research/three-d-02/reviewed-texture.mjs','utf8')
 ]);
 assert.match(demo,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+LICENSED_SHIRT\+'\.jpg'/);
 assert.match(demo,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+LICENSED_SHIRT\+'\.png'/);
 assert.match(demo,/loadLicensedCutout\(LICENSED_SHIRT/);
 assert.match(demo,/event\?\.isTrusted/);
 assert.match(demo,/app\.applySeparateGarment\(source,\{acknowledged:true\}\)/);
 assert.match(demo,/app\.clearShirt\(\)/);
 assert.match(upstream,/adaptGarmentFor3D/);
});
test('No external services or user image/account storage and no false realism promises',async()=>{
 const paths=['research/three-d-08/garment-shell.mjs','research/three-d-08/demo.mjs',
  'research/three-d-08/index.html','research/three-d-06/anatomical-showroom.mjs'];
 for(const path of paths){
  const s=await readFile(path,'utf8');
  for(const bad of [/supabase\.co/,/indexedDB/,/localStorage/,/getUserMedia/,
   /openai\.com/,/unpkg\.com/,/jsdelivr/,/sendBeacon/])assert.doesNotMatch(s,bad);
 }
 const page=await readFile('research/three-d-08/index.html','utf8');
 assert.match(page,/SEPARATE 3D SHIRT MESH/);
 assert.match(page,/not<\/strong> tailored, fully rigged, or cloth-simulated/);
 assert.match(page,/type="button" disabled/);
});
