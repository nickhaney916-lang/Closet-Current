import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {applyDualHumanoidFace131,measureSkinnedFace131}
 from '../research/dual-humanoid-face-definition-131/face-definition.mjs';

function riggedSource(){
 // Synthetic, license-clean test fixture proves the actual Three.js skin
 // transforms and head-bone parenting without any personal/user face image.
 // Genuine CC0 original 163-bone models are exercised separately in WebGL CI.
 const vertices=new T.SphereGeometry(1,48,32);
 vertices.scale(.105,.13,.088);
 vertices.translate(0,1.85,0);
 const pos=vertices.getAttribute('position'),n=pos.count;
 const skinIndex=new Uint16Array(n*4),skinWeight=new Float32Array(n*4);
 for(let i=0;i<n;i++)skinWeight[i*4]=1;
 vertices.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndex,4));
 vertices.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeight,4));
 const material=new T.MeshStandardMaterial({color:0xb98972,roughness:.7});
 const model=new T.SkinnedMesh(vertices,material);model.name='OriginalCC0FaceFixture';
 const pelvis=new T.Bone();pelvis.name='Hips';
 const head=new T.Bone();head.name='Head';
 pelvis.add(head);
 const bones=[pelvis,head];
 for(let i=2;i<163;i++){
  const b=new T.Bone();b.name='Other'+i;pelvis.add(b);bones.push(b);
 }
 model.add(pelvis);
 model.updateMatrixWorld(true);
 model.bind(new T.Skeleton(bones));
 model.updateMatrixWorld(true);
 const root=new T.Group();root.add(model);root.updateMatrixWorld(true);
 return {root,model,head,material,vertices,bones};
}
const coords=x=>x.getWorldPosition(new T.Vector3()).toArray();
test('FACE131 both figures derive paired anterior eye anchors from skin vertices, not clothing or procedural hair',()=>{
 const {root}=riggedSource(),face=measureSkinnedFace131(root);
 assert.ok(face.sampledSkinnedVertices>=1200);
 assert.ok(face.sampledHeadVertices>=80);
 assert.equal(face.anchors.length,2);
 assert.equal(face.anchors[0].side,-1);
 assert.equal(face.anchors[1].side,1);
 assert.ok(face.anchors[0].x<face.anchors[1].x);
 assert.ok(face.anchors.every(x=>x.samples>=4&&Number.isFinite(x.skinZ)));
 assert.equal(face.faceForward,'positive-z');
 assert.equal(face.bodyMeshUnmodified,true);
});
for(const figure of ['male','female'])test('FACE131 '+figure+' adds subtle paired eyes/irises/pupils/lids/brows to existing head bone without changing skin mesh or rig',()=>{
 const {root,model,head,material,vertices,bones}=riggedSource();
 const positionBefore=Array.from(vertices.getAttribute('position').array);
 const nBefore=bones.length,skinnedGeometry=model.geometry,skinMaterial=model.material;
 const output=applyDualHumanoidFace131(root,figure);
 assert.equal(output.figure,figure);
 assert.equal(output.sourceRigBones,163);
 assert.equal(output.eyeCount,2);
 assert.equal(output.faceMeshes,14);
 assert.equal(output.sourceGeometryChanged,false);
 assert.equal(output.sourceGarmentGeometryChanged,false);
 assert.equal(output.photorealismProven,false);
 assert.equal(output.ownerFaceOrBiometricsUsed,false);
 assert.equal(output.personalPhotoPixelsUsed,false);
 assert.equal(output.familyAlpha,'HOLD');
 assert.equal(output.releaseAuthorized,false);
 assert.equal(head.getObjectByName('research-face-definition-131')?.children.length,14);
 assert.equal(model.geometry,skinnedGeometry);
 assert.equal(model.material,skinMaterial);
 assert.equal(material,model.material);
 assert.deepEqual(Array.from(vertices.getAttribute('position').array),positionBefore);
 assert.equal(bones.length,nBefore);
 assert.equal(model.skeleton.bones.length,163);
 const eyes=[];
 head.traverse(o=>{if(o.isMesh&&o.name.startsWith('research-face131-iris-'))eyes.push(o);});
 assert.equal(eyes.length,2);
 const before=eyes.map(coords);
 head.rotation.y+=.19;
 root.updateMatrixWorld(true);
 const after=eyes.map(coords);
 assert.ok(after.some((pos,i)=>Math.hypot(...pos.map((x,k)=>x-before[i][k]))>.002),
  'facial geometry must follow actual existing head articulation');
 assert.throws(()=>applyDualHumanoidFace131(root,figure),/only be applied once/);
});
test('FACE131 refuses unsupported source, nonhumanoid rig and missing head bone',()=>{
 assert.throws(()=>applyDualHumanoidFace131(null,'female'),/source-rig/);
 assert.throws(()=>applyDualHumanoidFace131(riggedSource().root,'unknown'),/female\/male/);
 assert.throws(()=>measureSkinnedFace131(new T.Group()),/anatomical skinned/);
 const {root,head}=riggedSource();head.name='OtherBone';
 assert.throws(()=>applyDualHumanoidFace131(root,'male'),/head bone absent/);
});
test('FACE131 rejects 2D-only non-163-bone source even if face geometry exists',()=>{
 const {root,model}=riggedSource();
 model.skeleton.bones.pop();
 assert.throws(()=>applyDualHumanoidFace131(root,'female'),/163-bone/);
});
test('FACE131 consent, source identity and security boundaries remain research-only',()=>{
 const module=readFileSync('research/dual-humanoid-face-definition-131/face-definition.mjs','utf8');
 const installer=readFileSync('scripts/install-dual-humanoid-face-131.mjs','utf8');
 const tester=readFileSync('scripts/prepare-dual-humanoid-face-131-webgl-test.mjs','utf8');
 for(const part of ['measureSkinnedFace131','applyDualHumanoidFace131',
  'o.isSkinnedMesh','!o.userData?.work56Garment',
  'head.attach(group)','sourceGeometryChanged:false',
  'photorealismProven:false',"familyAlpha:'HOLD'"])
  assert.ok(module.includes(part),part);
 assert.doesNotMatch(module,/\bfetch\s*\(|XMLHttpRequest|https?:\/\/|localStorage|supabase/);
 assert.ok(installer.includes("face131"));
 assert.ok(installer.includes("realism118"));
 assert.ok(tester.includes('webkit')&&tester.includes('chromium'));
 assert.ok(tester.includes('P118 actual WebGL'));
 assert.ok(tester.includes("const lifecycleAnchor='const errors=[]"),'must target actual source server');
 assert.ok(tester.includes("String.fromCharCode(10)+'try {'"),'generated harness must start try block');
 assert.ok(tester.includes('server.closeAllConnections()'),'must prevent held-open keep-alive connections');
 assert.ok(tester.includes('server.close(error=>error?reject(error):resolve())'),'must close HTTP test server on success and error');
});
