import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {verifyPhysicalBilateralMesh196}
 from '../research/owner-mesh-bilateral-readback-196/real-mesh-evidence.mjs';
import {profileOwnerAlphaGeometry190,fitOwnerAlphaToSkinnedBlouse190}
 from '../research/owner-mask-geometry-190/owner-alpha-contour.mjs';
const SRC='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const MASK='6'.repeat(64),W=96,H=128;
const fixture=(leftTrim=0,rightTrim=0)=>{
 const data=new Uint8ClampedArray(W*H*4);
 for(let y=8;y<H-8;y++){
  const half=22+12*Math.sin(Math.PI*(y-8)/(H-16));
  for(let x=Math.ceil(W/2-half)+leftTrim;x<=Math.floor(W/2+half)-rightTrim;x++){
   const p=(y*W+x)*4;
   data[p]=200;data[p+1]=220;data[p+2]=208;data[p+3]=240;
  }
 }
 return {naturalWidth:W,naturalHeight:H,data};
};
const fakeCanvas=()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({width:W,height:H,getContext:()=>({
  drawImage(img){this.image=img;},getImageData(){return {data:this.image.data};}
 })})};
 return ()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;};
};
function makeMesh(role,skeleton){
 const geo=new THREE.BufferGeometry(),count=300,array=new Float32Array(count*3);
 for(let i=0;i<count;i++){
  const col=i%20,row=Math.floor(i/20);
  array[i*3]=(role==='L'?-.35:role==='R'?.35:0)+(col-9.5)*.013;
  array[i*3+1]=1.18+row*.038;
  array[i*3+2]=role?0:.11;
 }
 geo.setAttribute('position',new THREE.BufferAttribute(array.slice(),3));
 geo.setAttribute('panelPosition',new THREE.BufferAttribute(array.slice(),3));
 const mesh=new THREE.SkinnedMesh(geo,new THREE.MeshBasicMaterial());
 mesh.name=role?'cap-'+role:'Work56-independent-shirt-shell';
 mesh.bind(skeleton);
 mesh.userData.work56Garment=true;
 if(role)mesh.userData.work45IndependentShoulderCap=role;
 return mesh;
}
function createFit(){
 const p=profileOwnerAlphaGeometry190({
  source:fixture(),owner:fixture(3,1),maskSHA:MASK,independentBilateral195:true
 });
 const profile={...p,ownerMaskTopologyVerified191:true,
  ownerMaskTopologyIoU191:.91,ownerMaskTopologyConnected191:.99,
  ownerMaskTopologyInsideSource191:.99};
 const skeleton=new THREE.Skeleton(Array.from({length:163},()=>new THREE.Bone()));
 const root=new THREE.Group();
 const body=makeMesh(null,skeleton);body.name='body';body.userData.work56Garment=false;
 const pieces=[makeMesh(null,skeleton),makeMesh('L',skeleton),makeMesh('R',skeleton)];
 root.add(body,...pieces);
 const shirt={meshes:pieces,stats:{
  sourceSHA256:SRC,sourceShoulderEased185:true,
  independentShoulderCapSeamsRetained185:true
 }};
 return {shirt,root,pieces,profile,skeleton};
}
test('P196 actual THREE.BufferAttribute left/right photo mesh data and two cap joins independently verified',()=>{
 const restore=fakeCanvas();
 try{
  const {shirt,root,pieces,skeleton,profile}=createFit();
  const before=pieces.map(m=>m.geometry.getAttribute('position').array.slice());
  const after=fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile);
  assert.equal(after.stats.ownerPhysicalBilateralReadbackVerified196,true);
  assert.equal(after.stats.ownerMaskSHA256,MASK);
  assert.equal(after.stats.ownerTorsoReadbackMovedVertices196>=20,true);
  assert.equal(after.stats.ownerLeftReadbackMovedVertices196>=20,true);
  assert.equal(after.stats.ownerRightReadbackMovedVertices196>=20,true);
  assert.equal(after.stats.ownerLeftCapReadbackMovedVertices196>=1,true);
  assert.equal(after.stats.ownerRightCapReadbackMovedVertices196>=1,true);
  assert.ok(after.stats.ownerMeasuredBilateralRatioDifference196>=.001);
  assert.notEqual(after.stats.ownerLeftMeanRelativeContraction196,
   after.stats.ownerRightMeanRelativeContraction196);
  assert.equal(after.stats.humanGarmentSegmentationVerified,false);
  assert.equal(after.stats.independentlyPhotographedBack,false);
  assert.equal(after.stats.releaseAuthorized,false);
  assert.equal(after.stats.familyAlpha,'HOLD');
  for(let i=0;i<3;i++)
   assert.notDeepEqual([...pieces[i].geometry.getAttribute('position').array],[...before[i]]);
  assert.equal(skeleton.bones.length,163);
 }finally{restore();}
});
test('P196 accepts multiple authentic sewn panels per shoulder side and still verifies both real caps',()=>{
 const restore=fakeCanvas();
 try{
  const {profile,shirt,root,skeleton}=createFit();
  const leftSleevePanel=makeMesh('L',skeleton);
  root.add(leftSleevePanel);
  shirt.meshes.push(leftSleevePanel);
  const fitted=fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile);
  assert.equal(fitted.stats.ownerPhysicalBilateralReadbackVerified196,true);
  assert.ok(fitted.stats.ownerLeftCapReadbackMovedVertices196>=2);
  assert.ok(fitted.stats.ownerRightCapReadbackMovedVertices196>=1);
  assert.ok(fitted.stats.ownerMeasuredBilateralRatioDifference196>=.001);
  assert.equal(skeleton.bones.length,163);
 }finally{restore();}
});
test('P196 cannot substitute intended panel shifts for unmoved skinned mesh vertices',()=>{
 const restore=fakeCanvas();
 try{
  const {profile,shirt,root,pieces}=createFit();
  const fit=fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile);
  assert.equal(fit.stats.ownerPhysicalBilateralReadbackVerified196,true);
  const panels=pieces.map(mesh=>{
   const p=mesh.geometry.getAttribute('position'),
    panel=mesh.geometry.getAttribute('panelPosition');
   return {mesh,p,panel,positions:p.array.slice(),pan:panel.array.slice()};
  });
  // The profile and UUID are valid, but there is NO fresh vertex mutation.
  assert.throws(()=>verifyPhysicalBilateralMesh196({
   panels,profile,sourceSHA256:SRC,ownerMaskSHA256:MASK
  }),/P196/);
 }finally{restore();}
});
test('P196 incorrect owner mask source SHA or missing individual cap always fails closed',()=>{
 const restore=fakeCanvas();
 try{
  const {profile,shirt,root,pieces}=createFit();
  const after=fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile);
  assert.equal(after.stats.ownerPhysicalBilateralReadbackVerified196,true);
  assert.throws(()=>verifyPhysicalBilateralMesh196({
   panels:[],profile,sourceSHA256:SRC,ownerMaskSHA256:MASK
  }),/P196/);
  assert.throws(()=>verifyPhysicalBilateralMesh196({
   panels:[],profile,sourceSHA256:SRC,ownerMaskSHA256:'0'.repeat(64)
  }),/P196/);
  assert.throws(()=>verifyPhysicalBilateralMesh196({
   panels:[],profile,sourceSHA256:'0'.repeat(64),ownerMaskSHA256:MASK
  }),/P196/);
  const lost=pieces[2];
  const old=lost.geometry.getAttribute('position').array.slice();
  const refused=()=>fitOwnerAlphaToSkinnedBlouse190({...shirt,
   meshes:pieces.slice(0,2)},root,profile);
  assert.throws(refused,/P190/);
  assert.deepEqual([...lost.geometry.getAttribute('position').array],[...old]);
 }finally{restore();}
});
test('P196 missing owner topology attestation prevents all irreversible garment mutation',()=>{
 const restore=fakeCanvas();
 try{
  const {profile,shirt,root,pieces}=createFit();
  const old=pieces.map(m=>m.geometry.getAttribute('position').array.slice());
  assert.throws(()=>fitOwnerAlphaToSkinnedBlouse190(shirt,root,{
   ...profile,ownerMaskTopologyVerified191:false
  }),/P195|P196/);
  pieces.forEach((m,i)=>assert.deepEqual([...m.geometry.getAttribute('position').array],[...old[i]]));
 }finally{restore();}
});
