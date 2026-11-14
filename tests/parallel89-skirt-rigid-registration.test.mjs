/** P89 synthetic structural tests, NOT original-photo / real-avatar evidence.
 * Real native original Commons-0043 skirt & P84 full-body BVH screenshots
 * run separately in Chromium/WebKit CI. Source texture/UV safety fail closed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {compareActualOriginalPhotoSkirtRegistration89}
 from '../research/parallel89/skirt-rigid-registration89.mjs';

function fixture(){
 const root=new T.Group(),g=new T.BufferGeometry();
 const pos=[],uv=[],rest=[],skin=[],weight=[],ix=[];
 for(let row=0;row<7;row++)for(let j=0;j<=48;j++){
  const a=j*Math.PI/24,x=Math.sin(a),z=Math.cos(a);
  const p=[x*.24*(1+.1*row),1.3-row*.1,z*.16*(1+.1*row)];
  pos.push(...p);rest.push(...p);uv.push(j/48,row/6);
  skin.push(0,0,0,0);weight.push(1,0,0,0);
  if(row<6&&j<48){
   const a=row*49+j,b=a+49;
   ix.push(a,a+1,b,a+1,b+1,b);
  }
 }
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setAttribute('sourceSkirt89Rest',new T.Float32BufferAttribute(rest,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(weight,4));
 g.setIndex(ix);
 const bones=Array.from({length:163},()=>new T.Bone());
 root.add(...bones);
 const mesh=new T.SkinnedMesh(g,new T.MeshBasicMaterial());
 root.add(mesh);root.updateMatrixWorld(true);
 mesh.bind(new T.Skeleton(bones));
 return {root,mesh,original:g,photoPositions:g.getAttribute('position').array.slice(),
  sourceUV:g.getAttribute('uv').array.slice(),weight:g.getAttribute('skinWeight').array.slice()};
}
function run(x,mode='reduce',overrides={}){
 const poseNames=[];
 const receipt=compareActualOriginalPhotoSkirtRegistration89({
  mesh:x.mesh,avatar:'female',
  applyPose:p=>{assert.ok(['source','blend-50','relaxed'].includes(p));poseNames.push(p);},
  sampleContact:()=>{
   const changed=x.mesh.geometry!==x.original,
    geom=x.mesh.geometry,base=x.photoPositions;
   const dz=geom.getAttribute('position').array[2]-base[2];
   let pairs=['0|45','1|58','2|72','3|99'];
   if(changed&&mode==='reduce'&&dz>.01)pairs=['0|45','1|58'];
   else if(changed&&mode==='introduce')pairs=['0|45','1|58','3|99','5|108'];
   else if(changed&&mode==='depth')pairs=['0|45'];
   return {count:pairs.length,pairs:new Set(pairs),
    maxDepth:changed&&mode==='depth'?.02:.001};
  },
  ...overrides
 });
 return {...receipt,poseNames};
}
test('test-only photo-skirt rigid registration can find a reduction but never authorize wearable 3D',()=>{
 const x=fixture(),row=run(x);
 assert.equal(row.schema,'P89-genuine-skirt-photo-rigid-registration-AB/v1');
 assert.equal(row.status,'RESEARCH_REGISTRATION_REDUCED_STATIC_PAIRS_NOT_WEARABLE');
 assert.equal(row.trials.length,5);
 assert.equal(row.bestResearchOnly.name,'front-15mm');
 assert.equal(row.original3PoseStrictBodyCrossingPairs,12);
 assert.equal(row.bestResearchOnly.trialThreePoseStrictCrossingPairSum,6);
 assert.equal(row.bestResearchOnly.introducedOriginalSourceFacePairIDs,0);
 assert.equal(row.bestResearchOnly.maxPlaneDepthWorsened,false);
 assert.equal(row.allCandidatesDisposedAndRestored,true);
 assert.equal(row.originalPhoto2DFallbackRequired,true);
 assert.equal(row.continuousCollisionAndClothDynamicsCertified,false);
 assert.equal(row.consumer3DAdmitted,false);
 assert.equal(row.releaseAuthorized,false);
 assert.equal(x.mesh.geometry,x.original);
 assert.deepEqual(x.mesh.geometry.getAttribute('position').array,x.photoPositions);
 assert.deepEqual(x.mesh.geometry.getAttribute('uv').array,x.sourceUV);
 assert.deepEqual(x.mesh.geometry.getAttribute('skinWeight').array,x.weight);
});
test('fake gross count decrease with new exact real-body pair is a rejected registration',()=>{
 const x=fixture(),row=run(x,'introduce');
 assert.equal(row.status,'NO_SAFE_REDUCING_ORIGINAL_SKIRT_REGISTRATION_WITNESSED');
 assert.equal(row.bestResearchOnly,null);
 assert.ok(row.trials.every(v=>v.releaseAuthorized===false));
 assert.ok(row.trials.some(v=>v.introducedOriginalSourceFacePairIDs>=1));
 assert.equal(x.mesh.geometry,x.original);
});
test('worsened original oriented triangle plane depth vetoes registration even if counts improve',()=>{
 const x=fixture(),row=run(x,'depth');
 assert.equal(row.status,'NO_SAFE_REDUCING_ORIGINAL_SKIRT_REGISTRATION_WITNESSED');
 assert.equal(row.bestResearchOnly,null);
 assert.ok(row.trials.some(v=>v.maxPlaneDepthWorsened));
 assert.equal(x.mesh.geometry,x.original);
});
test('forged source anatomy/crossing receipts cannot create a 3D outfit',()=>{
 const x=fixture();
 for(const overrides of [
  {avatar:'owner'}, {applyPose:null},
  {sampleContact:()=>({count:1,pairs:new Set(['0|1','2|3']),maxDepth:0})},
  {sampleContact:()=>({count:0,pairs:new Set(),maxDepth:NaN})}
 ]){
  const row=run(x,'reduce',overrides);
  assert.equal(row.status,'REAL_PHOTOGRAPHED_SKIRT_REGISTRATION_NOT_VERIFIED');
  assert.equal(row.consumer3DAdmitted,false);
  assert.equal(row.releaseAuthorized,false);
  assert.equal(x.mesh.geometry,x.original);
 }
});
