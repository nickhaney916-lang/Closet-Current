/** Synthetic source metadata only: authentic P541/163bone original GLB
 * Chromium + WebKit data proven independently in held no-deploy CI. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {isOriginalUpperLimbOrHeadBone89,attestOriginalSourceCoreUpperLimbFaceVeto89 as audit}
 from '../research/parallel89/skirt-original-upper-limb-core-veto89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture(){
 const count=300,idx=Uint16Array.from({length:count},(_,i)=>i),
  mask=new Uint8Array(count/3).fill(1);
 mask[0]=0;mask[1]=0;mask[2]=0;
 const boneNames=Array.from({length:163},(_,i)=>{
  if(i===0)return 'spine01';
  if(i===1)return 'wristL';
  if(i===2)return 'metacarpal4R';
  if(i===3)return 'finger2L';
  return 'SOURCE_BONE_'+i;
 });
 const jointIDs=new Uint16Array(count*4),
  weights=new Float32Array(count*4);
 for(let v=0;v<count;v++){
  jointIDs[4*v]=v<3?1:v<6?2:v<9?3:0;
  weights[4*v]=1;
 }
 return {bodyIndices:idx,coreBodyFaceMask:mask,skinIndices:jointIDs,
  skinWeights:weights,sourceMeshIds:new Uint16Array(count),
  sourceMeshNames:['base'],sourceBoneNamesByMesh:[boneNames],
  avatar:'female',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:RIG,originalRig163Bones:true};
}
test('authentic source wrist/metacarpal/carpal/finger names are upper limb; spine/pelvis/leg/foot remain core',()=>{
 for(const name of ['wristL','wristR','metacarpal1R','metacarpal4L',
  'carpal','handL','finger1-1R','thumbL','forearmL','clavicleR',
  'scapulaL','head','neck','jaw'])assert.equal(
   isOriginalUpperLimbOrHeadBone89(name),true,name);
 for(const name of ['spine01','spine04','pelvis','hipL','kneeR',
  'thighL','upperlegL','calfR','ankle','footL','root'])assert.equal(
   isOriginalUpperLimbOrHeadBone89(name),false,name);
 for(const name of ['',null,'bad\u0000bone','x'.repeat(97)])
  assert.throws(()=>isOriginalUpperLimbOrHeadBone89(name));
});
test('original indexed face mask excludes every high-weight wrist metacarpal and finger face with no source mutation',()=>{
 const x=fixture(),before=Object.fromEntries(
  Object.entries(x).filter(([,v])=>ArrayBuffer.isView(v))
   .map(([k,v])=>[k,v.slice()]));
 const r=audit(x);
 assert.equal(r.status,
  'TRUE_ORIGINAL_SOURCE_UPPER_EXTREMITY_FACE_VETOED_NOT_WEARABLE');
 assert.equal(r.actualOriginalUpperLimbHeadWeightedFaces,3);
 assert.equal(r.originalUpperLimbHeadFacesConservativelyExcluded,3);
 assert.equal(r.originalUpperLimbHeadFacesLeakedIntoCore,0);
 assert.equal(r.selectedTorsoLegOriginalSourceFaces,97);
 assert.deepEqual(r.observedRealOriginalExcludedBoneNames,
  ['finger2L','metacarpal4R','wristL']);
 assert.equal(r.originalMetacarpalAndWristBoneNamesClassifiedAsUpperExtremity,true);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 for(const [k,v] of Object.entries(before))assert.deepEqual(x[k],v);
});
test('a single selected metacarpal original face is a hard failure not a source torso fit',()=>{
 const x=fixture();x.coreBodyFaceMask[1]=1;
 const r=audit(x);
 assert.equal(r.status,'ORIGINAL_UPPER_LIMB_FACE_MASK_UNVERIFIABLE');
 assert.equal(r.reason,
  'original-source-metacarpal-wrist-or-hand-face-leaked-into-torso-core');
 assert.equal(r.consumer3DAdmitted,false);
});
test('a single selected original wrist face is also forbidden, even when other hands are rejected',()=>{
 const x=fixture();x.coreBodyFaceMask[0]=1;
 assert.equal(audit(x).reason,
  'original-source-metacarpal-wrist-or-hand-face-leaked-into-torso-core');
});
test('original bone influences below half never automatically mark a torso vertex as an upper-limb surface',()=>{
 const x=fixture();
 // Convert finger face to 49% upper and 51% spine: original 50%
 // exclusion threshold uses the ORIGINAL source per-vertex weights.
 for(let v=6;v<9;v++){
  x.skinWeights[4*v]=.49;x.skinWeights[4*v+1]=.51;
  x.skinIndices[4*v+1]=0;
 }
 x.coreBodyFaceMask[2]=1;
 const r=audit(x);
 assert.equal(r.status,
  'TRUE_ORIGINAL_SOURCE_UPPER_EXTREMITY_FACE_VETOED_NOT_WEARABLE');
 assert.equal(r.actualOriginalUpperLimbHeadWeightedFaces,2);
 assert.equal(r.originalUpperLimbHeadFacesConservativelyExcluded,2);
});
test('spoofed original photo, avatar and 163bone chain cannot attest anatomical core',()=>{
 const x=fixture();
 for(const patch of [
  {sourcePhotoSHA256:'forged'},
  {sourceAnatomyGLBSHA256:'forged'},
  {originalRig163Bones:false},{avatar:'other'},
  {sourceBoneNamesByMesh:[]},
  {sourceBoneNamesByMesh:[['spine01']]},
  {sourceMeshIds:new Uint16Array(300).fill(9)},
  {sourceMeshNames:['bad\u0000name']},
  {sourceMeshNames:[]}
 ]){
  const r=audit({...x,...patch});
  assert.equal(r.status,'ORIGINAL_UPPER_LIMB_FACE_MASK_UNVERIFIABLE');
 }
});
test('invalid source index / weights / bone ID / mask refuse instead of inventing a body core',()=>{
 const x=fixture(),index=x.bodyIndices.slice();index[9]=300;
 for(const patch of [
  {bodyIndices:index},
  {coreBodyFaceMask:new Uint8Array(100).fill(1)},
  {coreBodyFaceMask:new Uint8Array(1)},
  {skinWeights:new Float32Array(4)},
  {skinWeights:Float32Array.from(x.skinWeights,(w,i)=>i===0?2:w)},
  {skinIndices:Uint16Array.from(x.skinIndices,(w,i)=>i===0?163:w)},
  {skinWeights:Float32Array.from(x.skinWeights,(w,i)=>i===0?.01:w)},
  {skinWeights:Float32Array.from(x.skinWeights,(w,i)=>i===0?NaN:w)},
  {bodyIndices:new Float32Array(x.bodyIndices)}
 ]){
  const q=audit({...x,...patch});
  assert.equal(q.status,'ORIGINAL_UPPER_LIMB_FACE_MASK_UNVERIFIABLE');
  assert.equal(q.releaseAuthorized,false);
 }
});
test('selected original hand face never becomes safe merely because 2D or whole-body BVH checks are hypothetically green',()=>{
 const x=fixture();x.coreBodyFaceMask[1]=1;
 const q=audit({...x,claimedZeroBvhCrossings:true,claimedPhysicalFit:true});
 assert.equal(q.status,'ORIGINAL_UPPER_LIMB_FACE_MASK_UNVERIFIABLE');
 assert.equal(q.releaseAuthorized,false);
 assert.equal(q.originalPhoto2DFallbackRequired,true);
});
