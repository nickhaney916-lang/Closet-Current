import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {VIEW_DEGREES,normalizedView,cameraOrbitPoint,viewAngleFromCamera,setAnatomicalCameraView,advanceAnatomicalTurntable} from '../research/three-d-67/premium-orbit-camera.mjs';
import {INDEX_CATEGORIES,validateIndexedWardrobeItem,arrangeIndexedOutfit,swapIndexedOutfitItem} from '../research/three-d-67/indexed-closet-3d-contract.mjs';
const close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e,'Expected '+a+' ~ '+b);
test('full real camera 360° rotation is closed, not body/yaw spin',()=>{
 const camera=new THREE.PerspectiveCamera(34,1,.03,100),controls={target:new THREE.Vector3(0,1.04,0),update(){}};
 camera.position.set(0,1.04,4.25);
 const front=camera.position.clone();
 assert.deepEqual(VIEW_DEGREES,[0,45,90,135,180,225,270,315,360]);
 for(const a of VIEW_DEGREES){
  const x=setAnatomicalCameraView(camera,controls,a);
  close(x.actual,normalizedView(a),1e-7);
  close(camera.position.distanceTo(controls.target),4.25,1e-7);
  assert.ok(Number.isFinite(camera.quaternion.w));
 }
 close(camera.position.distanceTo(front),0,1e-9);
 close(viewAngleFromCamera(camera,controls.target),0);
 close(normalizedView(-90),270);
 close(normalizedView(450),90);
 const right=cameraOrbitPoint(90,4.25,controls.target);
 close(right.x,4.25);close(right.z,0);close(right.y,1.04);
 assert.throws(()=>setAnatomicalCameraView(camera,controls,Infinity),/Finite/);
});
test('fixed-time auto orbit caps motion, has no camera drift and resets exactly',()=>{
 const camera=new THREE.PerspectiveCamera(34,1,.03,100),controls={target:new THREE.Vector3(0,1.04,0),update(){}};
 camera.position.set(0,1.04,4.25);
 const step=advanceAnatomicalTurntable(camera,controls,.1,18);
 close(step.actual,1.8);
 assert.throws(()=>advanceAnatomicalTurntable(camera,controls,2),/Time step/);
 assert.throws(()=>advanceAnatomicalTurntable(camera,controls,.1,100),/speed/);
 setAnatomicalCameraView(camera,controls,360,{radius:4.25,elevation:0});
 close(viewAngleFromCamera(camera,controls.target),0);
});
const ownerId='private-test-account-1';
const make=(id,category,itemType,color,suffix,extras={})=>({
 id,ownerId,sourceId:'original-'+suffix,sourceSHA256:suffix.repeat(64),
 category,itemType,color,recognitionStatus:'confirmed',ownerReviewed:true,
 sourcePhotoOriginal:true,threeDimensionalMeshApproved:false,garmentMeshVerified:false,...extras
});
test('source-original AI categories mapped without assuming photo 3D conversion',()=>{
 assert.deepEqual(INDEX_CATEGORIES,['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
 const shirt=make('one','Tops','Blouse','Red','a');
 const jeans=make('two','Bottoms','Jeans','Indigo','b');
 const x=arrangeIndexedOutfit([shirt,jeans],{ownerId});
 assert.equal(x.slots.shirt.category,'Tops');assert.equal(x.slots.pants.category,'Bottoms');
 assert.equal(x.threeDReady,false);assert.equal(x.fallback,'original-camera-photo-or-2d');
 assert.equal(x.categoryVerified,true);assert.equal(x.sourcePhotoIdentityPreserved,true);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(validateIndexedWardrobeItem(shirt,{ownerId}).sourceSHA256,'a'.repeat(64));
 const swap=swapIndexedOutfitItem(x,'one',make('three','Tops','Sweater','Cream','c'));
 assert.equal(swap.slots.shirt.id,'three');assert.equal(swap.slots.pants.id,'two');
 assert.notEqual(x.slots.shirt.id,swap.slots.shirt.id);
 const approved=arrangeIndexedOutfit([make('four','Tops','T-shirt','White','d',{threeDimensionalMeshApproved:true,garmentMeshVerified:true})],{ownerId});
 assert.equal(approved.threeDReady,true);
});
test('uncertain, cross-account, duplicated or generated garments rejected',()=>{
 const shirt=make('one','Tops','Blouse','Red','a'),pants=make('two','Bottoms','Jeans','Blue','b');
 const fails=[
 [make('wrong','Tops','Top','Blue','c',{ownerId:'other-account'}),/owner mismatch/],
 [make('unknown','Uncategorized','Unknown','Blue','c'),/Uncertain category/],
 [make('weak','Tops','Unknown','Blue','c'),/Uncertain category/],
 [make('color','Tops','Shirt','Unknown','c'),/Minimum color/],
 [make('ai','Tops','Blouse','Green','c',{ownerReviewed:false}),/user review/],
 [make('fake','Tops','Blouse','Green','c',{sourcePhotoOriginal:false}),/original full-resolution/],
 [make('hash','Tops','Blouse','Green','c',{sourceSHA256:'not-a-sha'}),/source identity/]
 ];
 for(const [input,message] of fails)assert.throws(()=>validateIndexedWardrobeItem(input,{ownerId}),message);
 assert.throws(()=>arrangeIndexedOutfit([shirt,shirt],{ownerId}),/Duplicate source/);
 assert.throws(()=>arrangeIndexedOutfit([shirt,make('other','Tops','Shirt','White','c')],{ownerId}),/same initial 3D outfit slot/);
 assert.throws(()=>arrangeIndexedOutfit([make('dress','Dresses','Dress','Blue','d'),pants],{ownerId}),/One-piece dress hides/);
 assert.throws(()=>swapIndexedOutfitItem(arrangeIndexedOutfit([shirt,pants],{ownerId}),'absent',shirt),/Replace an item/);
});
