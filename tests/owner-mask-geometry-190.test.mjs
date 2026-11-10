import {fitReviewedUpperPhoto62} from '../research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {profileOwnerAlphaGeometry190,boundedOwnerAlphaContour190,
 fitOwnerAlphaToSkinnedBlouse190} from '../research/owner-mask-geometry-190/owner-alpha-contour.mjs';
const sourceSHA='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const maskSHA='1'.repeat(64);
function fixtures(){
 const w=96,h=128;
 const make=(privateMask)=>{
  const data=new Uint8ClampedArray(w*h*4);
  for(let y=8;y<h-8;y++){
   const center=w/2;
   const reach=22+12*Math.sin(Math.PI*(y-8)/(h-16));
   const trim=privateMask?Math.max(2,Math.floor(reach*.055)):0;
   for(let x=Math.ceil(center-reach)+trim;x<=Math.floor(center+reach)-trim;x++){
    const pos=(y*w+x)*4;data[pos]=255;data[pos+1]=245;data[pos+2]=235;data[pos+3]=240;
   }
  }
  return {naturalWidth:w,naturalHeight:h,data};
 };
 const source=make(false),owner=make(true);
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({width:w,height:h,getContext:()=>({
  drawImage(image){this.image=image;},
  getImageData(){return {data:this.image.data};}
 })})};
 return {source,owner,restore(){if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}};
}
function shell190(name,side,skeleton,body=false){
 const geo=new THREE.BufferGeometry(),count=300,coords=new Float32Array(count*3);
 for(let i=0;i<count;i++){
  const col=i%20,row=Math.floor(i/20);
  coords[i*3]=(side==='L'?-.36:side==='R'?.36:0)+(col-9.5)*.013;
  coords[i*3+1]=1.18+row*.038;
  coords[i*3+2]=body?0:.11;
 }
 geo.setAttribute('position',new THREE.BufferAttribute(coords.slice(),3));
 geo.setAttribute('panelPosition',new THREE.BufferAttribute(coords.slice(),3));
 const mesh=new THREE.SkinnedMesh(geo,new THREE.MeshBasicMaterial());
 mesh.name=name;mesh.bind(skeleton);
 if(side)mesh.userData.work45IndependentShoulderCap=side;
 if(!body)mesh.userData.work56Garment=true;
 return mesh;
}
test('P190 genuine alpha widths produce bounded, distinct measured owner profile without claiming real human approval',()=>{
 const f=fixtures();
 try{
  const p=profileOwnerAlphaGeometry190({source:f.source,owner:f.owner,maskSHA});
  assert.equal(p.sourceId,'commons-0016');
  assert.equal(p.sourceSHA256,sourceSHA);
  assert.equal(p.ratioBands.length,12);
  assert.ok(p.widthEvidenceRows>40);
  assert.ok(p.maxRelativeDifference>.01);
  assert.equal(p.independentReviewWitness,false);
  assert.equal(p.generalizedToOtherGarments,false);
  const a=boundedOwnerAlphaContour190({x:.32,y:1.4,profile:p});
  const b=boundedOwnerAlphaContour190({x:-.32,y:1.4,profile:p});
  assert.ok(a.deltaX<-.0005);
  assert.ok(Math.abs(a.deltaX+b.deltaX)<1e-10);
  assert.ok(Math.abs(a.deltaX)<=.009);
 }finally{f.restore();}
});
test('P190 rejects exact identical masks and unregistered PNG shapes without physical fit',()=>{
 const f=fixtures();
 try{
  assert.throws(()=>profileOwnerAlphaGeometry190({source:f.source,owner:f.source,maskSHA}),/P190/);
  assert.throws(()=>profileOwnerAlphaGeometry190({source:f.source,
   owner:{...f.owner,naturalWidth:97},maskSHA}),/P190/);
  assert.throws(()=>profileOwnerAlphaGeometry190({source:f.source,owner:f.owner,maskSHA:'?'}),/P190/);
 }finally{f.restore();}
});
test('P190 physically adjusts original 163-bone shell and both real cap meshes with same owner mask, atomic after validation',()=>{
 const f=fixtures();
 try{
  const p=profileOwnerAlphaGeometry190({source:f.source,owner:f.owner,maskSHA});
  const root=new THREE.Group(),bones=Array.from({length:163},()=>new THREE.Bone());
  const skeleton=new THREE.Skeleton(bones);
  const body=shell190('body',null,skeleton,true);
  const targets=[
   shell190('Work56-independent-shirt-shell',null,skeleton),
   shell190('cap-left','L',skeleton),
   shell190('cap-right','R',skeleton)];
  root.add(body,...targets);
  const before=targets.map(m=>m.geometry.getAttribute('position').array.slice());
  const shirt={meshes:targets,stats:{sourceSHA256:sourceSHA,
   sourceShoulderEased185:true,independentShoulderCapSeamsRetained185:true}};
  const fitted=fitOwnerAlphaToSkinnedBlouse190(shirt,root,p);
  assert.equal(fitted.stats.ownerAlphaMaskBasedPhysicalGeometry190,true);
  assert.equal(fitted.stats.ownerAlphaMaskSHA256_190,maskSHA);
  assert.ok(fitted.stats.ownerMaskAdjustedVertices190>=20);
  assert.ok(fitted.stats.ownerMaskMaxMoveMeters190>=.0005);
  assert.ok(fitted.stats.ownerMaskMaxMoveMeters190<=.00901);
  assert.equal(fitted.stats.ownerMaskBilateralCapJoins190,2);
  assert.equal(fitted.stats.generalizedUserPhotoTo3D190,false);
  for(let j=0;j<targets.length;j++)
   assert.notDeepEqual([...targets[j].geometry.getAttribute('position').array], [...before[j]]);
  assert.equal(skeleton.bones.length,163);
  assert.equal(fitted.stats.releaseAuthorized,false);
 }finally{f.restore();}
});
test('P190 rejects unsupported garment or missing left/right cap without mutating original skinned photo shell',()=>{
 const f=fixtures();
 try{
  const p=profileOwnerAlphaGeometry190({source:f.source,owner:f.owner,maskSHA});
  const root=new THREE.Group(),skeleton=new THREE.Skeleton(Array.from({length:163},()=>new THREE.Bone()));
  const shell=shell190('Work56-independent-shirt-shell',null,skeleton);
  root.add(shell190('body',null,skeleton,true),shell);
  const old=shell.geometry.getAttribute('position').array.slice();
  assert.throws(()=>fitOwnerAlphaToSkinnedBlouse190({meshes:[shell],stats:{
   sourceSHA256:sourceSHA,sourceShoulderEased185:true,
   independentShoulderCapSeamsRetained185:true}},root,p),/P190/);
  assert.deepEqual([...shell.geometry.getAttribute('position').array],[...old]);
  const forged={...p,ownerMaskSHA256:'invalid'};
  assert.throws(()=>boundedOwnerAlphaContour190({x:.33,y:1.4,profile:forged}),/P190/);
 }finally{f.restore();}
});
test('P190 installer and native gate require owner-specific geometry and never replace original photo/cutout or hosted cloud',()=>{
 const i=readFileSync('scripts/install-owner-alpha-geometry-190.mjs','utf8');
 const n=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const s=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 const c=readFileSync('research/owner-reviewed-cutout-texture-188/private-cutout-texture.mjs','utf8');
 for(const str of ['fitOwnerAlphaToSkinnedBlouse190',
  'sourceSHA256','ownerMaskGeometryProfile190','ownerMaskBilateralCapJoins190'])
  assert.ok(i.includes(str),str);
 for(const str of ["photoOwnerGeometry190","ownerAlphaPhysicalMeshFit190:active",
  "fit190?.ownerMaskBilateralCapJoins190!==2","photoOwnerAlpha189"])
  assert.ok(n.includes(str),str);
 for(const str of ['PHOTO_OWNER_GEOMETRY190','sourceOwnerAlphaPhysicalMeshFitted190:true',
  'ownerAlphaPhysicalMeshFit190,true','ownerAlphaBilateralCapJoins190,2'])
  assert.ok(s.includes(str),str);
 assert.ok(c.includes('profileOwnerAlphaGeometry190'));
 assert.equal(i.includes('public/index.html'),false);
});

function transactionFixture(){
 const root=new THREE.Group(),skeleton=new THREE.Skeleton(Array.from({length:163},()=>new THREE.Bone()));
 const targets=[shell190('Work56-independent-shirt-shell',null,skeleton),shell190('left','L',skeleton),shell190('right','R',skeleton)];
 root.add(shell190('body',null,skeleton,true),...targets);
 return {root,targets,shirt:{meshes:targets,stats:{sourceSHA256:sourceSHA,sourceShoulderEased185:true,independentShoulderCapSeamsRetained185:true}}};
}
for(const corruption of ['singular','nan-position','interleaved','aliased-panels','duplicate-mesh'])
 test('Mission2 refuses '+corruption+' without mutating any garment panel',()=>{
  const f=fixtures();
  try{
   const profile=profileOwnerAlphaGeometry190({source:f.source,owner:f.owner,maskSHA});
   const {root,targets,shirt}=transactionFixture();
   const last=targets[2],g=last.geometry;
   if(corruption==='singular')last.scale.x=0;
   if(corruption==='nan-position')g.getAttribute('position').array[0]=NaN;
   if(corruption==='interleaved'){
    const data=new THREE.InterleavedBuffer(new Float32Array(1200),4);
    g.setAttribute('position',new THREE.InterleavedBufferAttribute(data,3,0));
   }
   if(corruption==='aliased-panels')g.setAttribute('panelPosition',g.getAttribute('position'));
   if(corruption==='duplicate-mesh')shirt.meshes.push(last);
   const originals=targets.map(m=>['position','panelPosition'].map(n=>{
    const a=m.geometry.getAttribute(n);return Array.from(a.array||a.data.array);
   }));
   assert.throws(()=>fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile),/P190/);
   targets.forEach((m,i)=>['position','panelPosition'].forEach((n,j)=>{
    const a=m.geometry.getAttribute(n);assert.deepEqual(Array.from(a.array||a.data.array),originals[i][j]);
   }));
  }finally{f.restore();}
 });
test('Mission2 transformed garment preserves bounded world-space contour displacement',()=>{
 const f=fixtures();
 try{
  const profile=profileOwnerAlphaGeometry190({source:f.source,owner:f.owner,maskSHA});
  const {root,targets,shirt}=transactionFixture();
  root.rotation.set(.12,.3,-.2);root.scale.set(1.2,.9,1.1);root.position.set(.1,.2,-.3);
  root.updateMatrixWorld(true);
  const before=targets.map(m=>Array.from({length:300},(_,i)=>new THREE.Vector3().fromBufferAttribute(m.geometry.getAttribute('position'),i).applyMatrix4(m.matrixWorld)));
  fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile);
  for(let j=0;j<targets.length;j++)for(let i=0;i<300;i++){
   const after=new THREE.Vector3().fromBufferAttribute(targets[j].geometry.getAttribute('position'),i).applyMatrix4(targets[j].matrixWorld);
   const delta=after.sub(before[j][i]);assert.ok(Math.abs(delta.x)<=.009001);assert.ok(Math.abs(delta.y)<1e-6);assert.ok(Math.abs(delta.z)<1e-6);
  }
 }finally{f.restore();}
});

for(const stage of ['source','owner'])test('Mission2 '+stage+' preflights corrupt last cap before any source fitting mutation',()=>{
 const f=fixtures();
 try{
  const {root,targets,shirt}=transactionFixture();
  targets[2].scale.y=0;
  const before=targets.map(m=>m.geometry.getAttribute('position').array.slice());
  const run=stage==='source'?()=>fitReviewedUpperPhoto62(shirt,root,{
   accepted:true,sourceSHA256:sourceSHA,itemType:'Blouse',inferredBack:true,
   releaseAuthorized:false,shoulderToTorso:1.1,hemToTorso:1.05
  },{naturalShoulder185:true}):()=>fitOwnerAlphaToSkinnedBlouse190(shirt,root,
   profileOwnerAlphaGeometry190({source:f.source,owner:f.owner,maskSHA}));
  assert.throws(run,/finite invertible/);
  targets.forEach((m,i)=>assert.deepEqual(m.geometry.getAttribute('position').array,before[i]));
 }finally{f.restore();}
});
