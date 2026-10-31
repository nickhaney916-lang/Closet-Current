/** 3D58 strictly presentation-only original-source texture sharpness.
 * No garment source/photo pixels, UV, body, skinned cloth position, surface
 * normals, source hashes, skin weights, private photos or default UI changed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {configureOriginalPhotoSampling,originalSourceDisplayPixelRatio} from
 '../research/three-d-58/crisp-original-source-rendering.mjs';

test('3D58 mobile detail changes only opt-in bounded render pixel ratio',()=>{
 assert.equal(originalSourceDisplayPixelRatio(1),1);
 assert.equal(originalSourceDisplayPixelRatio(3),1.5);
 assert.equal(originalSourceDisplayPixelRatio(1,{enabled:true}),2);
 assert.equal(originalSourceDisplayPixelRatio(3,{enabled:true}),2);
 assert.throws(()=>originalSourceDisplayPixelRatio(0,{enabled:true}));
 assert.throws(()=>originalSourceDisplayPixelRatio(NaN,{enabled:true}));
});
test('3D58 samples genuine source photo and jeans without altering textures or cloth',()=>{
 const body=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(.3,.8,.2));
 mesh.userData.work56Garment=true;
 const material=new THREE.MeshStandardMaterial();
 const textureA=new THREE.Texture({width:1200,height:1500});
 const textureB=new THREE.Texture({width:880,height:1600});
 textureA.colorSpace=textureB.colorSpace=THREE.SRGBColorSpace;
 const sources=[textureA,textureB].map(t=>({image:t.image,color:t.colorSpace,flip:t.flipY,wrapS:t.wrapS,wrapT:t.wrapT}));
 let previous=0;
 material.onBeforeCompile=shader=>{previous++;shader.uniforms.uPhoto={value:textureA};
  shader.uniforms.uPantsOriginalPhoto={value:textureB};};
 mesh.material=material;body.add(mesh);
 const originalPositions=mesh.geometry.attributes.position.array.slice(),
  originalNormal=mesh.geometry.attributes.normal.array.slice();
 const gl={capabilities:{getMaxAnisotropy:()=>16}};
 assert.equal(configureOriginalPhotoSampling(body,gl).enabled,false);
 assert.equal(material.userData.cc58SharpOriginalPhotoInstalled,undefined);
 const state=configureOriginalPhotoSampling(body,gl,{enabled:true});
 assert.equal(state.enabled,true);
 assert.equal(state.targetAnisotropy,8);
 assert.equal(state.materialCount,1);
 assert.equal(state.configuredSamplers,0,'Do not claim source texture GPU was compiled before actual shader creation');
 const shader={uniforms:{}};
 material.onBeforeCompile(shader,gl);
 assert.equal(previous,1,'Original authored source UV/photo shader must run first');
 assert.equal(state.configuredSamplers,2,'Both actual original photographed shirt and denim samplers configured');
 for(const [i,t] of [textureA,textureB].entries()){
  assert.equal(t.anisotropy,8);
  assert.equal(t.minFilter,THREE.LinearMipmapLinearFilter);
  assert.equal(t.magFilter,THREE.LinearFilter);
  assert.equal(t.generateMipmaps,true);
  assert.equal(t.image,sources[i].image,'Unchanged actual original image bytes/reference');
  assert.equal(t.colorSpace,sources[i].color);
  assert.equal(t.flipY,sources[i].flip);
  assert.equal(t.wrapS,sources[i].wrapS);
  assert.equal(t.wrapT,sources[i].wrapT);
 }
 assert.deepEqual(mesh.geometry.attributes.position.array,originalPositions);
 assert.deepEqual(mesh.geometry.attributes.normal.array,originalNormal);
 assert.ok(state.images.some(x=>x.sampler==='uPhoto'&&x.width===1200&&x.height===1500));
 assert.ok(state.images.some(x=>x.sampler==='uPantsOriginalPhoto'&&x.width===880&&x.height===1600));
 assert.equal(state.originalSourcesByteUnchanged,true);
 assert.equal(state.releaseAuthorized,false);
 assert.equal(state.humanVisualApproved,false);
 assert.equal(state.physicalPhoneTested,false);
 // Reinvoking on a shared material must be idempotent. No double-source
 // wrapping, memory leaks, or a hidden material replacement.
 const newer=configureOriginalPhotoSampling(body,gl,{enabled:true});
 assert.equal(newer.materialCount,1);
 assert.equal(newer.configuredSamplers,0);
 material.onBeforeCompile({uniforms:{}},gl);
 assert.equal(previous,2,'Original image sampling shader must still execute exactly once per compile');
 mesh.geometry.dispose();material.dispose();textureA.dispose();textureB.dispose();
});
test('3D58 fails closed on non-sRGB or unlicensed tiny garment textures',()=>{
 const body=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;body.add(mesh);
 const t=new THREE.Texture({width:2,height:2});
 mesh.material.onBeforeCompile=shader=>{shader.uniforms.uPhoto={value:t};};
 const state=configureOriginalPhotoSampling(body,{capabilities:{getMaxAnisotropy:()=>4}},{enabled:true});
 assert.throws(()=>mesh.material.onBeforeCompile({uniforms:{}},{}),/small/);
 assert.equal(state.configuredSamplers,0);
 t.image={width:512,height:512};
 assert.throws(()=>mesh.material.onBeforeCompile({uniforms:{}},{}),/source-sRGB/);
 t.colorSpace=THREE.SRGBColorSpace;
 mesh.material.onBeforeCompile({uniforms:{}},{});
 assert.equal(t.anisotropy,4,'Actual device capability must cap source photo anisotropy');
 mesh.geometry.dispose();mesh.material.dispose();t.dispose();
});
