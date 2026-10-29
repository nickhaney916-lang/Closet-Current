import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {buildGarmentShell} from '../research/three-d-08/garment-shell.mjs';
import {prepareBodyPresentation,releaseBodyPresentation} from '../research/three-d-11/dress-in-source-pose.mjs';
import {refineGarment} from '../research/three-d-11/natural-drape.mjs';
import {repairCuffBoundary} from '../research/three-d-13/cuff-boundary.mjs';
globalThis.ProgressEvent=class{};
const candidate={id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),
 ownerApproved:false,releaseAuthorized:false,realFabricTexture:true,
 humanVisualApproval:false,cutout:{width:1920,height:2880,decode(){}},
 cropRect:[0,0,1,1],baseColor:[.08,.08,.08]};
async function body(kind){
 const bytes=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SOURCES[kind].sha256);
 const root=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
 root.updateMatrixWorld(true);
 const b=new T.Box3().setFromObject(root),s=2/b.getSize(new T.Vector3()).y,c=b.getCenter(new T.Vector3());
 root.scale.multiplyScalar(s);root.position.set(-c.x*s,-b.min.y*s,-c.z*s);
 root.updateMatrixWorld(true);prepareBodyPresentation(root);
 return root;
}
for(const kind of ['male','female'])test(kind+' wrist cutoff is extended on SAME original garment topology without affecting body or print',async()=>{
 const root=await body(kind);
 const originalBody=[];
 root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)
  originalBody.push([o,Buffer.from(o.geometry.attributes.position.array.buffer).toString('base64')]);});
 const before=refineGarment(buildGarmentShell(root,candidate,{acknowledged:true}),root,{repairCuffs:false});
 const originalMesh=before.meshes.map(m=>({
  position:new Float32Array(m.geometry.attributes.position.array),
  panel:new Float32Array(m.geometry.attributes.panelPosition.array),
  weights:new Float32Array(m.geometry.attributes.skinWeight.array),
  indices:new Uint16Array(m.geometry.attributes.skinIndex.array),
  geometry:m.geometry
 }));
 const fixed=repairCuffBoundary(before,root);
 assert.equal(fixed.originalPixelsUnchanged,true);
 assert.equal(fixed.skinWeightsUnchanged,true);
 assert.equal(fixed.noNewGeometry,true);
 assert.equal(fixed.collisionsValidated,false);
 assert.equal(fixed.humanVisualApproval,false);
 assert.ok(fixed.repairedVertices>40,JSON.stringify(fixed));
 assert.ok(fixed.byArm.every(a=>a.vertices>8&&a.peak>.002),JSON.stringify(fixed));
 assert.ok(fixed.byArm.some(a=>a.nearestAfter<a.nearestBefore),JSON.stringify(fixed));
 assert.equal(before.meshes.length,originalMesh.length,'No extra shell meshes or textures');
 let changed=0;
 for(let n=0;n<before.meshes.length;n++){
  const m=before.meshes[n],g=m.geometry,a=originalMesh[n];
  assert.equal(g,a.geometry,'No replacement mesh');
  assert.deepEqual(Array.from(g.attributes.skinWeight.array),Array.from(a.weights));
  assert.deepEqual(Array.from(g.attributes.skinIndex.array),Array.from(a.indices));
  const p=g.attributes.panelPosition.array;
  for(let i=0;i<p.length;i+=3){
   const d=Math.hypot(p[i]-a.panel[i],p[i+1]-a.panel[i+1],p[i+2]-a.panel[i+2]);
   if(d>.00001){
    changed++;
    assert.ok(d<=.0241,'Cuff patch must be locally bounded');
    assert.ok(Math.abs(p[i])>.28,'Cuff patch may not alter central chest print');
   }
  }
 }
 assert.ok(changed>40);
 for(const [m,old] of originalBody)
  assert.equal(Buffer.from(m.geometry.attributes.position.array.buffer).toString('base64'),old);
 before.dispose();releaseBodyPresentation(root);
});
test('Full Work59 default now applies cuff fix exactly once, with no new geometry/texture handles',async()=>{
 const root=await body('male');
 const shirt=refineGarment(buildGarmentShell(root,candidate,{acknowledged:true}),root);
 assert.equal(shirt.stats.cuffRepair?.mechanism,'source-rig-cuff-tapered-axial-reach');
 assert.ok(shirt.stats.cuffRepair.repairedVertices>40);
 assert.ok(shirt.stats.cuffRepair.byArm.every(a=>a.peak>.002));
 assert.equal(shirt.stats.cuffRepair.releaseAuthorized,false);
 assert.equal(shirt.stats.collisionValidated,false);
 assert.equal(shirt.stats.minClearance,null);
 shirt.dispose();releaseBodyPresentation(root);
});
test('Absent or unsafe cuff landmarks and exaggerated reach must fail closed',()=>{
 for(const options of [{reach:0},{reach:.1},{reach:NaN}])
  assert.throws(()=>repairCuffBoundary({meshes:[{}]}, {traverse(){}}, options));
 assert.throws(()=>repairCuffBoundary({meshes:[]},{traverse(){}}));
 assert.throws(()=>repairCuffBoundary({meshes:[{}]},{traverse(){}},{reach:.016}),/forearm/);
});
test('Only experimental 3D shell source changed; original images, model hashes and owner review untouched',async()=>{
 for(const path of ['research/three-d-13/cuff-boundary.mjs','research/three-d-11/natural-drape.mjs']){
  const s=await readFile(path,'utf8');
  for(const banned of [/supabase\.co/,/localStorage/,/indexedDB/,/sendBeacon/,/getUserMedia/,/api\.openai/,/work47\/assets.*writeFile/])
   assert.doesNotMatch(s,banned);
 }
 const drape=await readFile('research/three-d-11/natural-drape.mjs','utf8');
 assert.match(drape,/repairCuffBoundary\(shirt,root\)/);
 assert.match(drape,/cuffRepair:cuff/);
});
