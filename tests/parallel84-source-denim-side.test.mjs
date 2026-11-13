import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {trialSourceMeasuredDenimSide84} from '../research/parallel84-real-photo-layers/source-denim-side-trial84.mjs';

// SYNTHETIC source-like garment topology + *real THREE* SkinnedMesh with 163
// bone influences. This fixture is never represented as a genuine garment
// photograph, actual human labels, or user physical-device acceptance.
const sha='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
function skinned(root,bones,xyz,indices,{garment=true,front=null,denim=false}={}){
 const g=new T.BufferGeometry(),count=xyz.length/3;
 g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
 g.setIndex(indices);
 g.computeVertexNormals();
 const ids=new Uint16Array(4*count),weight=new Float32Array(4*count);
 for(let i=0;i<count;i++)weight[4*i]=1;
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(weight,4));
 g.setAttribute('uv',new T.Float32BufferAttribute(
  Array.from({length:count},(_,i)=>[i/count,(i*7%count)/count]).flat(),2));
 if(denim){
  g.setAttribute('pantsRest',g.getAttribute('position').clone());
  g.setAttribute('pantsSourceUV',g.getAttribute('uv').clone());
  g.setAttribute('pantsSourceFront',new T.Float32BufferAttribute(front,1));
 }
 const m=new T.SkinnedMesh(g,new T.MeshStandardMaterial({side:T.DoubleSide}));
 m.userData.work56Garment=garment;root.add(m);
 root.updateMatrixWorld(true);m.bind(new T.Skeleton(bones));
 return m;
}
function sourceDenim(){
 const xyz=[],index=[],front=[],angular=24,rings=15,deltaY=.043;
 for(const side of [1,-1]){
  const offset=xyz.length/3;
  for(let ring=0;ring<rings;ring++){
   const y=.66+ring*deltaY,cx=side*(.125+.055*(y-.66));
   for(let a=0;a<angular;a++){
    const theta=2*Math.PI*a/angular,z=.12*Math.sin(theta),
     x=cx+side*.09*Math.cos(theta);
    xyz.push(x,y,z);front.push(z>.04?1:0);
   }
  }
  for(let ring=0;ring<rings-1;ring++)for(let a=0;a<angular;a++){
   const n=(a+1)%angular,lo=offset+ring*angular,
    hi=offset+(ring+1)*angular;
   index.push(lo+a,lo+n,hi+a,lo+n,hi+n,hi+a);
  }
 }
 return {xyz,index,front};
}
function setup(){
 const root=new T.Group(),bones=Array.from({length:163},()=>new T.Bone());
 root.add(...bones);root.updateMatrixWorld(true);
 const cloth=sourceDenim(),
  pantsMesh=skinned(root,bones,cloth.xyz,cloth.index,{front:cloth.front,denim:true});
 const shirtMesh=skinned(root,bones,
  [-.5,1.1,2.4,.5,1.1,2.4,-.5,1.5,2.4,.5,1.5,2.4],
  [0,1,2,1,3,2]);
 const bodyMesh=skinned(root,bones,
  [-.6,.4,-2,.6,.4,-2,-.6,1.6,-2,.6,1.6,-2],
  [0,1,2,1,3,2],{garment:false});
 const landmarks=[1,-1].map(side=>({
  hip:[side*.165,1.35,0],
  knee:[side*.125,.59,0],
  ankle:[side*.11,.07,0]
 }));
 const pants={meshes:[pantsMesh],stats:{
  originalCrotchSaddle:true,independentSewnPattern:true,
  photoApplied:true,sourceId:'commons-public-domain-jeans-2005',
  sourceSHA256:sha,landmarks
 }};
 return {root,pants,shirt:{meshes:[shirtMesh]},body:bodyMesh,mesh:pantsMesh};
}
const inspect=mesh=>Object.fromEntries(['position','pantsRest','pantsSourceUV',
 'pantsSourceFront','skinIndex','skinWeight','uv'].map(name=>
 [name,mesh.geometry.getAttribute(name).array.slice()]));
function run(f,settings={}){return trialSourceMeasuredDenimSide84({
 root:f.root,pants:f.pants,shirt:f.shirt,avatar:'female',...settings});}
test('P84 indexed independent denim 163-bone SOURCE-NEUTRAL side shaping does not edit photo front, UV, rest, bone weights, faces or original body',()=>{
 const f=setup(),was=inspect(f.mesh),beforeFaces=f.mesh.geometry.index.array.slice();
 const result=run(f);
 assert.equal(result.status,'SAMPLED_SOURCE_PANEL_CONTACT_NONWORSENING_ONLY',JSON.stringify(result));
 assert.equal(result.trialApplied,true);
 assert.ok(result.sourceNeutralRearSideVerticesCandidate>85);
 assert.equal(result.sourceMeasuredNeutralSideStations.length,2);
 assert.ok(result.sourceOriginalPhotographFrontProtectedReferences>100);
 assert.ok(result.maxAppliedWorldShiftMeters>.004);
 assert.equal(result.newlyIntroducedBodyTrianglePairs,0);
 assert.equal(result.newlyIntroducedShirtTrianglePairs,0);
 assert.equal(result.photoReverseInvented,false);
 assert.equal(result.humanRealismApproved,false);
 assert.equal(result.releaseAuthorized,false);
 assert.notDeepEqual(f.mesh.geometry.getAttribute('position').array,was.position);
 const finalPosition=f.mesh.geometry.getAttribute('position');
 for(let i=0;i<finalPosition.count;i++){
  if(was.pantsSourceFront[i]<.18)continue;
  for(let component=0;component<3;component++)
   assert.equal(finalPosition.array[i*3+component],was.position[i*3+component],
    'One original photographed-front coordinate was silently displaced');
 }
 for(const name of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight','uv'])
  assert.deepEqual(f.mesh.geometry.getAttribute(name).array,was[name]);
 assert.deepEqual(f.mesh.geometry.index.array,beforeFaces);
});
test('P84 does not accept garment source by plausible-looking SHA without licensed original identity, confirmed photos or independent pattern',()=>{
 const f=setup(),before=f.mesh.geometry.getAttribute('position').array.slice();
 assert.equal(run(f,{enabled:false}).status,'REFUSED_UNCHANGED');
 f.pants.stats.sourceId='private-unknown';
 assert.equal(run(f).trialApplied,false);
 f.pants.stats.sourceId='commons-public-domain-jeans-2005';
 f.pants.stats.sourceSHA256='0'.repeat(64);
 assert.equal(run(f).trialApplied,false);
 f.pants.stats.sourceSHA256=sha;f.pants.stats.photoApplied=false;
 assert.equal(run(f).trialApplied,false);
 f.pants.stats.photoApplied=true;f.pants.stats.independentSewnPattern=false;
 assert.equal(run(f).trialApplied,false);
 assert.deepEqual(f.mesh.geometry.getAttribute('position').array,before);
});
test('P84 rejects invalid, overlarge, nonfinite or negative source side/rear movement without modifying any triangles',()=>{
 for(const [a,b] of [[.05,.009],[.01,-.02],[NaN,.003],[.01,Infinity],[-.005,.01]]){
  const f=setup(),before=f.mesh.geometry.getAttribute('position').array.slice();
  assert.equal(run(f,{sideEaseMeters:a,rearEaseMeters:b}).trialApplied,false);
  assert.deepEqual(f.mesh.geometry.getAttribute('position').array,before);
 }
});
test('P84 missing genuine original photo projection and 163-source bones fail closed',()=>{
 const f=setup(),p=f.mesh.geometry.getAttribute('position').array.slice();
 f.mesh.geometry.deleteAttribute('pantsSourceFront');
 assert.equal(run(f).trialApplied,false);
 assert.deepEqual(f.mesh.geometry.getAttribute('position').array,p);
 const g=setup();
 g.mesh.skeleton.bones.pop();
 assert.equal(run(g).trialApplied,false);
});
