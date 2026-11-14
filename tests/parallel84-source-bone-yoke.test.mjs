import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {trialSourceBoneShoulderYoke84} from '../research/parallel84-real-photo-layers/source-bone-yoke-trial84.mjs';

// Deliberately SYNTHETIC geometries bound to real THREE SkinnedMeshes and 163
// original-shaped joint identifiers. These tests are not original JPEG,
/// independent human photographic or smartphone acceptance.
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DENIM='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
const snapshot=(mesh,keys=['position','panelPosition','panelNormal','skinIndex','skinWeight','uv'])=>
 Object.fromEntries(keys.filter(k=>mesh.geometry.getAttribute(k)).map(k=>
  [k,mesh.geometry.getAttribute(k).array.slice()]));
function fabric(root,bones,xyz,index,{tag='shell',garment=true}={}){
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
 g.setIndex(index);
 g.computeVertexNormals();
 const vertexCount=xyz.length/3;
 g.setAttribute('panelPosition',new T.Float32BufferAttribute(xyz,3));
 g.setAttribute('panelNormal',new T.Float32BufferAttribute(Array.from({length:vertexCount},
  ()=>[0,0,1]).flat(),3));
 g.setAttribute('uv',new T.Float32BufferAttribute(Array.from({length:vertexCount},
  (_,i)=>[Math.abs(xyz[i*3]),xyz[i*3+1]/2]).flat(),2));
 const ids=new Uint16Array(vertexCount*4),weights=new Float32Array(vertexCount*4);
 for(let i=0;i<vertexCount;i++)weights[4*i]=1;
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const mesh=new T.SkinnedMesh(g,new T.MeshStandardMaterial());
 mesh.name=tag==='shell'?'Work56-independent-shirt-shell':tag;
 mesh.userData.work56Garment=garment;
 if(tag.endsWith('-L')||tag.endsWith('-R'))
  mesh.userData.work45IndependentShoulderCap=tag.slice(-1);
 root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));
 return mesh;
}
function patch(startX,endX,startY,endY,z,step=.04){
 const x=[],ix=[],nx=Math.round((endX-startX)/step)+1,
  ny=Math.round((endY-startY)/step)+1;
 for(let iy=0;iy<ny;iy++)for(let i=0;i<nx;i++)
  x.push(Number((startX+step*i).toFixed(5)),
   Number((startY+step*iy).toFixed(5)),z);
 for(let iy=0;iy<ny-1;iy++)for(let i=0;i<nx-1;i++){
  const at=iy*nx+i;
  ix.push(at,at+1,at+nx,at+1,at+nx+1,at+nx);
 }
 return {xyz:x,index:ix};
}
function scene(){
 const root=new T.Group(),bones=Array.from({length:163},()=>new T.Bone());
 bones[1].name='upperarm01L';bones[1].position.set(.45,1.52,0);
 bones[2].name='upperarm01R';bones[2].position.set(-.45,1.52,0);
 root.add(...bones);root.updateMatrixWorld(true);
 const torso=patch(-.6,.6,1.30,1.70,0);
 const shell=fabric(root,bones,torso.xyz,torso.index);
 const lc=patch(.32,.52,1.38,1.62,0),
  rc=patch(-.52,-.32,1.38,1.62,0);
 const left=fabric(root,bones,lc.xyz,lc.index,{tag:'cap-L'});
 const right=fabric(root,bones,rc.xyz,rc.index,{tag:'cap-R'});
 const pantsP=patch(-.55,.55,1.0,1.3,2.4,.05);
 const jeans=fabric(root,bones,pantsP.xyz,pantsP.index,{tag:'jeans'});
 const bodyP=patch(-.55,.55,1.2,1.7,-2.4,.05);
 const body=fabric(root,bones,bodyP.xyz,bodyP.index,{tag:'body',garment:false});
 const shirt={meshes:[shell,left,right],stats:{
  sourceSHA256:SHIRT,trueSourceShoulderTopSlope:true,
  sourceRigNaturalShoulderFall:true}};
 const pants={meshes:[jeans],stats:{photoApplied:true,
  sourceId:'commons-public-domain-jeans-2005',sourceSHA256:DENIM}};
 return {root,shirt,pants,shell,left,right,jeans,body};
}
function trial(s,options={}){return trialSourceBoneShoulderYoke84({
 root:s.root,shirt:s.shirt,pants:s.pants,avatar:'female',...options});}
test('P84 source-attested BOTH original sewn caps move jointly while protecting original source RGB/UV/skin and no new actual triangle contacts',()=>{
 const s=scene(),before=[s.shell,s.left,s.right].map(m=>snapshot(m));
 const bpos=s.shell.geometry.getAttribute('position').array.slice();
 const out=trial(s);
 assert.equal(out.status,'SAMPLED_CONTACT_NONWORSENING_ONLY',JSON.stringify(out));
 assert.equal(out.trialApplied,true);
 assert.equal(out.newlyIntroducedBodyTrianglePairs,0);
 assert.equal(out.newlyIntroducedLayerTrianglePairs,0);
 assert.ok(out.movedOriginalRenderedVertices>=24);
 assert.ok(out.maxShoulderWorldDisplacementMeters>=.003&&
  out.maxShoulderWorldDisplacementMeters<=.0255);
 assert.ok(out.protectedFrontCenterOriginalVertices>=100);
 assert.ok(out.actualSeamMaxWorldGapMeters<=5e-5);
 assert.ok(out.shoulderCounts.L.caps>=5&&out.shoulderCounts.R.caps>=5);
 assert.ok(out.shoulderCounts.L.shells>=5&&out.shoulderCounts.R.shells>=5);
 assert.notDeepEqual(s.shell.geometry.getAttribute('position').array,bpos);
 for(const [i,m] of [s.shell,s.left,s.right].entries())
  for(const name of ['panelPosition','panelNormal','skinIndex','skinWeight','uv'])
   assert.deepEqual(m.geometry.getAttribute(name).array,before[i][name]);
 assert.equal(out.humanVisualRealismApproved,false);
 assert.equal(out.releaseAuthorized,false);
});
test('P84 opt-out, invalid source identity or invalid required source anatomical structure never edit geometry',()=>{
 const s=scene(),original=s.shell.geometry.getAttribute('position').array.slice();
 const off=trial(s,{enabled:false});
 assert.equal(off.status,'REFUSED_UNCHANGED');assert.equal(off.trialApplied,false);
 assert.deepEqual(s.shell.geometry.getAttribute('position').array,original);
 s.shirt.stats.sourceSHA256='0'.repeat(64);
 const wrong=trial(s);assert.equal(wrong.trialApplied,false);
 assert.equal(wrong.reason,'source-or-geometry-unverified');
 assert.deepEqual(s.shell.geometry.getAttribute('position').array,original);
 s.shirt.stats.sourceSHA256=SHIRT;
 s.root.remove(s.root.children.find(n=>n.name==='upperarm01L'));
 const noJoint=trial(s);assert.equal(noJoint.trialApplied,false);
 assert.equal(noJoint.reason,'two-source-shoulder-bones-missing');
 assert.deepEqual(s.shell.geometry.getAttribute('position').array,original);
});
test('P84 rejects a larger-than-25mm or negative manipulated displacement budget',()=>{
 for(const amount of [-.002,0,.03,NaN]){
  const s=scene(),old=s.shell.geometry.getAttribute('position').array.slice();
  const a=trial(s,{requestedDropMeters:amount});
  assert.equal(a.status,'REFUSED_UNCHANGED');
  assert.equal(a.trialApplied,false);
  assert.deepEqual(s.shell.geometry.getAttribute('position').array,old);
 }
});
test('P84 original source identification cannot be an arbitrary private wardrobe or a dress',()=>{
 const s=scene(),old=s.left.geometry.getAttribute('position').array.slice();
 s.pants.stats.photoApplied=false;
 assert.equal(trial(s).trialApplied,false);
 s.pants.stats.photoApplied=true;
 s.pants.stats.sourceId='private-unapproved-denim';
 assert.equal(trial(s).reason,'source-or-geometry-unverified');
 s.pants.stats.sourceId='commons-public-domain-jeans-2005';
 s.shirt.meshes=[s.shell];
 assert.equal(trial(s).reason,'source-or-geometry-unverified');
 assert.deepEqual(s.left.geometry.getAttribute('position').array,old);
});


test('P84 searches smaller ORIGINAL-source yoke displacement when full source move first crosses a real posed skinned body triangle',()=>{
 const s=scene();
 // This synthetic, precisely located thin transverse skin sheet is 1.7mm
 // beneath the original 1.30m low shirt row at the source yoke. It is not a
 // genuine anatomical body shape. The full 14mm-request yoke moves this row
 // across the sheet; at half the initial movement it should not touch.
 const sourceBoneArray=s.body.skeleton.bones;
 fabric(s.root,sourceBoneArray,[
  .30,1.2983,-.24,
  .52,1.2983,-.24,
  .30,1.2983,.24,
  .52,1.2983,.24
 ],[0,1,2,1,3,2],{tag:'thin-contact-gate',garment:false});
 const original=s.shell.geometry.getAttribute('position').array.slice();
 const result=trial(s,{requestedDropMeters:.014,outwardClearanceMeters:.0025});
 assert.equal(result.adaptiveOriginalSourceDisplacement,true);
 assert.equal(result.firstFullAmplitudeBodyIntroduced>0,true,
  'The source yoke MUST actually intersect the negative control sheet at full amplitude: '+JSON.stringify(result));
 assert.equal(result.status,'SAMPLED_CONTACT_NONWORSENING_ONLY',
  'A smaller original-source move is allowed only after exact full-posed-contact safety: '+JSON.stringify(result));
 assert.ok(result.candidateAmplitudesTested>1);
 assert.ok(result.acceptedTrialAmplitude<1&&result.acceptedTrialAmplitude>=.125);
 assert.equal(result.newlyIntroducedBodyTrianglePairs,0);
 assert.equal(result.newlyIntroducedLayerTrianglePairs,0);
 assert.notDeepEqual(s.shell.geometry.getAttribute('position').array,original);
 assert.equal(result.humanVisualRealismApproved,false);
 assert.equal(result.releaseAuthorized,false);
});
