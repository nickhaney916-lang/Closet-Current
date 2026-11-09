import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {deriveOwnerBilateralContour195}
 from '../research/owner-bilateral-asymmetric-fit-195/side-profile.mjs';
import {profileOwnerAlphaGeometry190,boundedOwnerAlphaContour190,fitOwnerAlphaToSkinnedBlouse190}
 from '../research/owner-mask-geometry-190/owner-alpha-contour.mjs';
const SRC='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const MASK='5'.repeat(64),W=96,H=128;
function photo({leftTrim=0,rightTrim=0}={}){
 const out=new Uint8ClampedArray(W*H*4);
 for(let y=8;y<H-8;y++){
  const half=22+12*Math.sin(Math.PI*(y-8)/(H-16));
  const l=Math.ceil(W/2-half)+leftTrim,r=Math.floor(W/2+half)-rightTrim;
  for(let x=l;x<=r;x++){
   const p=(y*W+x)*4;out[p]=210;out[p+1]=215;out[p+2]=220;out[p+3]=240;
  }
 }
 return {naturalWidth:W,naturalHeight:H,data:out};
}
function canvas(){
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({width:W,height:H,getContext:()=>({
  drawImage(img){this.image=img;},
  getImageData(){return {data:this.image.data};}
 })})};
 return ()=>{if(previous===undefined)delete globalThis.document;
  else globalThis.document=previous;};
}
function mesh(name,side,skeleton,isBody=false){
 const count=300,coords=new Float32Array(count*3),geo=new THREE.BufferGeometry();
 for(let i=0;i<count;i++){
  const c=i%20,row=Math.floor(i/20);
  coords[i*3]=(side==='L'?-.34:side==='R'?.34:0)+(c-9.5)*.013;
  coords[i*3+1]=1.18+row*.038;coords[i*3+2]=isBody?0:.11;
 }
 geo.setAttribute('position',new THREE.BufferAttribute(coords.slice(),3));
 geo.setAttribute('panelPosition',new THREE.BufferAttribute(coords.slice(),3));
 const m=new THREE.SkinnedMesh(geo,new THREE.MeshBasicMaterial());
 m.name=name;m.bind(skeleton);
 if(side)m.userData.work45IndependentShoulderCap=side;
 if(!isBody)m.userData.work56Garment=true;
 return m;
}
test('P195 source-registered actual owner alpha extracts DIFFERENT left and right edge ratios, not cloned average width',()=>{
 const restore=canvas();
 try{
  const p=profileOwnerAlphaGeometry190({
   source:photo(),owner:photo({leftTrim:3,rightTrim:1}),maskSHA:MASK,
   independentBilateral195:true
  });
  assert.equal(p.ownerBilateralContourMeasured195,true);
  assert.equal(p.maskSHA256,MASK);assert.equal(p.sourceSHA256,SRC);
  assert.equal(p.leftRatioBands195.length,12);
  assert.equal(p.rightRatioBands195.length,12);
  assert.ok(p.ownerBilateralAsymmetry195>.02);
  assert.ok(p.leftRatioBands195[5]<p.rightRatioBands195[5]);
  const l=boundedOwnerAlphaContour190({x:-.35,y:1.45,profile:p});
  const r=boundedOwnerAlphaContour190({x:.35,y:1.45,profile:p});
  assert.ok(l.deltaX>0&&r.deltaX<0);
  assert.ok(Math.abs(l.deltaX+r.deltaX)>.0003,'real asymmetric physical shape must not be mirrored');
  assert.equal(p.rearIndependentlyPhotographed195,false);
  assert.equal(p.humanSegmentationIndependentlyApproved195,false);
  assert.equal(p.releaseAuthorized,false);
 }finally{restore();}
});
test('P195 actual skinned mesh changes both sides, retains 163 bones and sewn shoulder cap joins',()=>{
 const restore=canvas();
 try{
  const p0=profileOwnerAlphaGeometry190({
   source:photo(),owner:photo({leftTrim:3,rightTrim:1}),maskSHA:MASK,
   independentBilateral195:true});
  const profile={...p0,ownerMaskTopologyVerified191:true,
   ownerMaskTopologyIoU191:.91,ownerMaskTopologyConnected191:.99,
   ownerMaskTopologyInsideSource191:.99};
  const skeleton=new THREE.Skeleton(Array.from({length:163},()=>new THREE.Bone()));
  const root=new THREE.Group(),body=mesh('body',null,skeleton,true);
  const pieces=[mesh('Work56-independent-shirt-shell',null,skeleton),
   mesh('left-cap','L',skeleton),mesh('right-cap','R',skeleton)];
  root.add(body,...pieces);
  const shirt={meshes:pieces,stats:{sourceSHA256:SRC,
   sourceShoulderEased185:true,independentShoulderCapSeamsRetained185:true}};
  const original=pieces.map(p=>p.geometry.getAttribute('position').array.slice());
  const result=fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile);
  assert.equal(result.stats.ownerBilateralActualPhotoShape195,true);
  assert.equal(result.stats.ownerBilateralMaskSHA195,MASK);
  assert.ok(result.stats.ownerBilateralLeftVertices195>=20);
  assert.ok(result.stats.ownerBilateralRightVertices195>=20);
  assert.ok(result.stats.ownerBilateralPhysicalAsymmetryMeters195>=.0003);
  assert.equal(result.stats.ownerMaskBilateralCapJoins190,2);
  assert.equal(result.stats.ownerBilateralRearInferred195,true);
  assert.equal(result.stats.ownerBilateralHumanApprovalCertified195,false);
  assert.equal(result.stats.generalizedUserPhotoTo3D190,false);
  for(let i=0;i<pieces.length;i++)
   assert.notDeepEqual([...pieces[i].geometry.getAttribute('position').array],[...original[i]]);
  assert.equal(skeleton.bones.length,163);
 }finally{restore();}
});
test('P195 source/owner SHA, proper alpha contour, and measured asymmetry cannot be fabricated from a width',()=>{
 const restore=canvas();
 try{
  assert.throws(()=>profileOwnerAlphaGeometry190({
   source:photo(),owner:photo({leftTrim:1,rightTrim:1}),maskSHA:MASK,
   independentBilateral195:true}),/P195/);
  const source=photo(),owner=photo({leftTrim:3,rightTrim:1});
  const p=profileOwnerAlphaGeometry190({source,owner,maskSHA:MASK,independentBilateral195:true});
  assert.throws(()=>boundedOwnerAlphaContour190({x:-.35,y:1.45,profile:{
   ...p,maskSHA256:'x'
  }}),/P195/);
  assert.throws(()=>deriveOwnerBilateralContour195({
   sourceRows:[{first:0,last:6,width:7}],ownerRows:[],width:W,height:H,
   sourceSHA256:SRC,maskSHA256:MASK
  }),/P195/);
  assert.throws(()=>deriveOwnerBilateralContour195({
   sourceRows:[],ownerRows:[],width:W,height:H,
   sourceSHA256:'0'.repeat(64),maskSHA256:MASK
  }),/P195/);
 }finally{restore();}
});
test('P195 no source topology attestation means no partial 163-bone mesh mutation',()=>{
 const restore=canvas();
 try{
  const p=profileOwnerAlphaGeometry190({
   source:photo(),owner:photo({leftTrim:3,rightTrim:1}),maskSHA:MASK,
   independentBilateral195:true
  });
  const skeleton=new THREE.Skeleton(Array.from({length:163},()=>new THREE.Bone()));
  const root=new THREE.Group(),body=mesh('body',null,skeleton,true);
  const parts=[mesh('Work56-independent-shirt-shell',null,skeleton),
   mesh('left-cap','L',skeleton),mesh('right-cap','R',skeleton)];
  root.add(body,...parts);
  const snap=parts.map(m=>m.geometry.getAttribute('position').array.slice());
  assert.throws(()=>fitOwnerAlphaToSkinnedBlouse190({meshes:parts,stats:{
   sourceSHA256:SRC,sourceShoulderEased185:true,
   independentShoulderCapSeamsRetained185:true}},root,p),/P195/);
  parts.forEach((m,i)=>assert.deepEqual([...m.geometry.getAttribute('position').array],[...snap[i]]));
 }finally{restore();}
});
