import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {HAIR153,applySourceHeadHair153,clearSourceHeadHair153}
 from '../research/dual-humanoid-head-hair-153/source-head-hair.mjs';

test('P153 remains an isolated source-head research overlay; full photographed private data never needed',()=>{
 assert.deepEqual(HAIR153.figures,['female','male']);
 assert.equal(HAIR153.donor,'df6885d6011cb33fb22dceb81a08f35a0ac4dd61');
 assert.equal(HAIR153.familyAlpha,'HOLD');
 assert.equal(HAIR153.releaseAuthorized,false);
 assert.equal(HAIR153.sourceBodyModified,false);
 assert.equal(HAIR153.garmentSourceModified,false);
 assert.equal(HAIR153.personalHairIdentity,false);
});
test('P153 fails closed without actual original 163-bone skinned head and genuine P150/P131 source markers',()=>{
 assert.throws(()=>applySourceHeadHair153(null,'female'),/HAIR153/);
 const root=new THREE.Group();
 assert.throws(()=>applySourceHeadHair153(root,'other'),/HAIR153/);
 assert.throws(()=>applySourceHeadHair153(root,'male'),/HAIR153/);
 const cap=new THREE.Group();cap.name='research-procedural-hair-118';root.add(cap);
 const face=new THREE.Group();face.name='research-face-definition-131';root.add(face);
 assert.throws(()=>applySourceHeadHair153(root,'female'),/HAIR153/);
});
test('P153 idempotent clear leaves original source hair cap visible and never mutates skinned meshes',()=>{
 const root=new THREE.Group();
 const original=new THREE.Group();original.name='research-procedural-hair-118';
 const shell=new THREE.Mesh(new THREE.SphereGeometry(),new THREE.MeshStandardMaterial());
 original.add(shell);root.add(original);
 shell.visible=false;
 assert.equal(clearSourceHeadHair153(root),false);
 assert.equal(shell.visible,true);
 assert.equal(clearSourceHeadHair153(root),false);
 assert.equal(shell.visible,true);
 shell.geometry.dispose();shell.material.dispose();
});
test('P153 dispose only owned head-hair geometry and NEVER original body, original skin or photographed clothes',()=>{
 const root=new THREE.Group();
 const old=new THREE.Group();old.name='research-procedural-hair-118';
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.1),new THREE.MeshStandardMaterial());
 old.add(cap);root.add(old);cap.visible=false;
 const hair=new THREE.Group();hair.name='research-source-head-hair-153';
 const ownedGeom=new THREE.SphereGeometry(.1),ownedMat=new THREE.MeshStandardMaterial();
 const owned=new THREE.Mesh(ownedGeom,ownedMat);owned.userData.ownedMaterial=true;hair.add(owned);
 root.add(hair);
 assert.equal(clearSourceHeadHair153(root),true);
 assert.equal(cap.visible,true);
 assert.equal(root.getObjectByName('research-source-head-hair-153'),undefined);
 assert.equal(root.getObjectByName('research-procedural-hair-118'),old);
 assert.equal(clearSourceHeadHair153(root),false);
 cap.geometry.dispose();cap.material.dispose();
});
test('P153 installer refuses any production, staging, repository root or nonexact detached destination',()=>{
 const s=readFileSync('scripts/install-dual-humanoid-head-hair-153.mjs','utf8');
 assert.match(s,/input!=='\.p150-donor-541'/);
 assert.match(s,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(s,/P153 exact parallel P150 donor anchor mismatch/);
 const module=readFileSync('research/dual-humanoid-head-hair-153/source-head-hair.mjs','utf8');
 assert.match(module,/head\.attach\(hair\)/);
 assert.match(module,/sampledHeadVertices/);
 assert.match(module,/originalGarmentGeometryChanged:false/);
 assert.doesNotMatch(module,/https?:\/\//);
});
