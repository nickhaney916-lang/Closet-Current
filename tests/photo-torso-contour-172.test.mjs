import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {SHIRT_SOURCE_SHA172,torsoOffset172,contourSourceVerifiedShirt172}
 from '../research/photo-torso-contour-172/torso-contour.mjs';
class Vec{
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 applyMatrix4(m){return this;}
}
class Matrix{clone(){return new Matrix();}invert(){return this;}}
class Attr{
 constructor(data,itemSize=3){this.array=data;this.itemSize=itemSize;this.count=data.length/itemSize;}
 getX(i){return this.array[i*this.itemSize];}
 getY(i){return this.array[i*this.itemSize+1];}
 getZ(i){return this.array[i*this.itemSize+2];}
}
function build({sourceSHA256=SHIRT_SOURCE_SHA172,sourceId='commons-0003'}={}){
 const xyz=[];
 for(const z of [-.11,.11])for(let j=0;j<=13;j++)for(let k=0;k<=16;k++){
  xyz.push(-.25+k*.03125,1.14+j*.039,z);
 }
 const pos=new Attr(new Float32Array(xyz));
 const indices=Array.from({length:pos.count},(_,i)=>i).slice(0,Math.floor(pos.count/3)*3);
 const immutable={
  panelPosition:new Attr(new Float32Array(xyz)),
  panelNormal:new Attr(new Float32Array(xyz.map(x=>x*.25))),
  skinIndex:new Attr(new Uint16Array(pos.count*4),4),
  skinWeight:new Attr(new Float32Array(pos.count*4).fill(.25),4)
 };
 const geometry={index:{count:indices.length,getX:i=>indices[i]},
  getAttribute:n=>n==='position'?pos:immutable[n],
  computeVertexNormals(){},computeBoundingBox(){},computeBoundingSphere(){}};
 const skeleton={bones:Array(163).fill({})};
 const mesh={name:'Work56-independent-shirt-shell',isSkinnedMesh:true,
  skeleton,userData:{work56Garment:true},position:new Vec(),matrixWorld:new Matrix(),geometry,
  updateWorldMatrix(){}};
 const body={isSkinnedMesh:true,skeleton,userData:{work56Garment:false}};
 const root={traverse:fn=>fn(body)};
 const shirt={meshes:[mesh],stats:{sourceSHA256,sourceId,envelope:{center:0}}};
 return {shirt,root,pos,immutable,geometry};
}
test('P172 exact public source physically changes real front vertices but not the back, seams or rig',()=>{
 const x=build(),before=x.pos.array.slice();
 const immutableBefore=Object.fromEntries(Object.entries(x.immutable).map(([k,v])=>[k,v.array.slice()]));
 const fitted=contourSourceVerifiedShirt172(x.shirt,x.root);
 assert.equal(fitted.stats.sourcePhotoTorsoContour172,true);
 assert.ok(fitted.stats.physicalTorsoContourMovedVertices172>30);
 assert.ok(fitted.stats.physicalTorsoContourMaxMeters172>.006);
 assert.ok(fitted.stats.physicalTorsoContourMaxMeters172<.0201);
 assert.equal(fitted.stats.releaseAuthorized,false);
 let frontChanged=0,backChanged=0,protectedSeams=0;
 for(let i=0;i<x.pos.count;i++){
  const dx=x.pos.getX(i)-before[i*3],dy=x.pos.getY(i)-before[i*3+1],dz=x.pos.getZ(i)-before[i*3+2];
  if(before[i*3+2]<0&&Math.hypot(dx,dy,dz)>1e-6)backChanged++;
  if(before[i*3+2]>0&&Math.hypot(dx,dy,dz)>1e-6)frontChanged++;
  if(Math.abs(before[i*3])>=.25||before[i*3+1]<1.155||before[i*3+1]>1.595){
   if(Math.abs(dx)+Math.abs(dy)+Math.abs(dz)<1e-6)protectedSeams++;
  }
 }
 assert.equal(backChanged,0);
 assert.ok(frontChanged>30);
 assert.ok(protectedSeams>20);
 for(const [name,arr] of Object.entries(immutableBefore))
  assert.deepEqual(x.immutable[name].array,arr,'P172 altered immutable photo/skin '+name);
 assert.equal(fitted.stats.originalFrontPhotoSourceSHA172,SHIRT_SOURCE_SHA172);
 assert.equal(fitted.stats.humanVisualApproved,false);
 assert.equal(fitted.stats.arbitraryOwnerPhoto3DApproved,false);
 assert.throws(()=>contourSourceVerifiedShirt172(fitted,x.root),/repeated/);
});
test('P172 front curvature is bounded, smooth, source-front-only and tapers to original garment seams',()=>{
 const center=torsoOffset172({x:0,y:1.4,z:.11,centerZ:0});
 const back=torsoOffset172({x:0,y:1.4,z:-.11,centerZ:0});
 const seam=torsoOffset172({x:.26,y:1.4,z:.11,centerZ:0});
 const neck=torsoOffset172({x:0,y:1.61,z:.11,centerZ:0});
 assert.ok(center.dz>.01&&center.dz<=.0165);
 assert.equal(back.move,0);assert.equal(seam.move,0);assert.equal(neck.move,0);
 for(const x of [-.3,-.21,-.15,0,.15,.21,.3])for(let y=1.12;y<1.7;y+=.02){
  const d=torsoOffset172({x,y,z:.15,centerZ:0});
  assert.ok(d.move<=.0201&&Number.isFinite(d.move));
 }
 assert.throws(()=>torsoOffset172({x:NaN,y:1.4,z:.1,centerZ:0}),/nonfinite/);
});
test('P172 wrong source photo SHA or unlicensed source ID always refuses before mutating',()=>{
 for(const patch of [{sourceSHA256:'a'.repeat(64)},{sourceId:'private-user-photo'}]){
  const x=build(patch),before=x.pos.array.slice();
  assert.throws(()=>contourSourceVerifiedShirt172(x.shirt,x.root),/licensed verified source/);
  assert.deepEqual(x.pos.array,before);
 }
});
test('P172 missing real 163-bone body or missing photo attribute rejects before a geometry write',()=>{
 for(const mutate of [
  x=>{x.shirt.meshes[0].skeleton.bones.pop();},
  x=>{x.root.traverse=fn=>fn({isSkinnedMesh:false});},
  x=>{x.geometry.getAttribute=name=>name==='panelPosition'?undefined:name==='position'?x.pos:x.immutable[name];},
  x=>{x.geometry.index.getX=()=>99999;}
 ]){
  const x=build(),before=x.pos.array.slice();mutate(x);
  assert.throws(()=>contourSourceVerifiedShirt172(x.shirt,x.root),/P172/);
  assert.deepEqual(x.pos.array,before);
 }
});
test('P172 actual research installer modifies ONLY disposable pinned donor after P60, not repository base',()=>{
 const d=mkdtempSync(join(tmpdir(),'p172-donor-'));
 try{
  writeFileSync(join(d,'.git'),'detached-worktree');
  const path=join(d,'research/three-d-15');mkdirSync(path,{recursive:true});
  const before="import {inspectPhotographedFit60,attachPhotographedFitReceipt60} from '../photo-garment-anatomical-fitting-60/fit-contract.mjs';\n"+
   "function fit(){\n   if(photoFabricRealism164){\n    for(const slot of Object.keys(built)){\nfoo();\n}\n}\n}";
  writeFileSync(join(path,'outfit-controller.mjs'),before);
  const scriptDir=join(d,'scripts');mkdirSync(scriptDir,{recursive:true});
  writeFileSync(join(scriptDir,'test-three-d-15-browser.mjs'),
   "assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].photoAnatomicalFit60,true,'P60 source garment must carry an independently checked 163-bone fit receipt');");
  const ran=spawnSync(process.execPath,['scripts/install-photo-torso-contour-172.mjs',d],{
   cwd:resolve('.'),encoding:'utf8'});
  assert.equal(ran.status,0,ran.stderr||ran.stdout);
  const after=readFileSync(join(path,'outfit-controller.mjs'),'utf8');
  assert.ok(after.includes('contourSourceVerifiedShirt172(built.shirt,root)'));
  assert.ok(after.indexOf('contourSourceVerifiedShirt172(built.shirt,root)')<after.indexOf('for(const slot of Object.keys(built))'));
  assert.ok(readFileSync(join(d,'research/photo-torso-contour-172/torso-contour.mjs'),'utf8').includes(SHIRT_SOURCE_SHA172));
  assert.ok(readFileSync(join(d,'scripts/test-three-d-15-browser.mjs'),'utf8').includes('physicalTorsoContourMovedVertices172>30'));
  assert.ok(!before.includes('contourSourceVerifiedShirt172'));
  const again=spawnSync(process.execPath,['scripts/install-photo-torso-contour-172.mjs',d],{
   cwd:resolve('.'),encoding:'utf8'});
  assert.notEqual(again.status,0,'reapplication must fail');
 }finally{rmSync(d,{recursive:true,force:true});}
});
