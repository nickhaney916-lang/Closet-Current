/** Synthetic public-skinned-joint topology tests. These are NOT genuine
 * original CC0 GLB or photographic garment acceptance; genuine source
 * native Chromium/WebKit runs independently and must show real landmarks.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {auditOriginalSkirtWaistBoneAttachment89}
 from '../research/parallel89/skirt-waist-bone-landmarks89.mjs';
function setup(){
 const root=new T.Group(),bones=Array.from({length:163},(_,i)=>{
  const b=new T.Bone();b.name='joint'+i;b.position.y=.5;return b;
 });
 const spine=['spine01','spine02','spine03','spine04','spine05'];
 spine.forEach((name,i)=>{bones[i].name=name;bones[i].position.y=.75+i*.16;});
 root.add(...bones);
 const g=new T.BufferGeometry(),pos=[],rest=[],uv=[],skin=[],weights=[],index=[];
 for(let row=0;row<7;row++)for(let sector=0;sector<49;sector++){
  const a=sector*Math.PI*2/48;
  const p=[Math.sin(a)*(.2+.015*row),1.23-.1*row,
   Math.cos(a)*(.17+.01*row)];
  pos.push(...p);rest.push(...p);uv.push(sector/48,row/6);
  skin.push(3,0,0,0);weights.push(1,0,0,0);
  if(row<6&&sector<48){const k=row*49+sector,l=k+49;index.push(k,k+1,l,k+1,l+1,l);}
 }
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setAttribute('sourceSkirt89Rest',new T.Float32BufferAttribute(rest,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 g.setIndex(index);
 const mesh=new T.SkinnedMesh(g,new T.MeshBasicMaterial());
 root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));
 return {root,mesh,bones,original:g.getAttribute('position').array.slice(),
  uv:g.getAttribute('uv').array.slice()};
}
test('source CC0 skeletal waist labels are public vertical measurements and never garment fitting approval',()=>{
 const x=setup(),r=auditOriginalSkirtWaistBoneAttachment89({
  root:x.root,skirt:x.mesh,avatar:'female'});
 assert.equal(r.schema,'P89-public-anatomical-waist-bone-attachment-audit/v1');
 assert.equal(r.status,'ORIGINAL_SOURCE_RIG_WAIST_ANCHOR_VERTICAL_LANDMARKS_MEASURED_NOT_FIT');
 assert.equal(r.boneCount,163);
 assert.equal(r.actualOriginalWaistBinding,'spine04');
 assert.equal(r.trueNamedPelvisExists,false);
 assert.equal(r.originalPublicBodyJointHeightCandidates.length,5);
 assert.equal(r.originalSourceWaistRimVerticalHeightMeters,1.23);
 assert.equal(r.originalSourceSpine04VerticalHeightMeters,1.23);
 assert.equal(r.originalWaistRimAndSpine04HeightMismatchMeters,0);
 assert.ok(r.nearestObservedNamedOriginalRigLandmarks.some(x=>x.sourceOriginalBoneName==='spine04'));
 assert.equal(r.independentPhysicalWaistMeasurementExists,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.sourcePhotoBackSideObserved,false);
 assert.equal(r.ownerApproved,false);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(x.mesh.geometry.getAttribute('position').array,x.original);
 assert.deepEqual(x.mesh.geometry.getAttribute('uv').array,x.uv);
 assert.ok(!JSON.stringify(r).includes('"sourceX"'));
});
test('must have actual 163-bone source spine landmarks and 343 original source photo skirt rim',()=>{
 const x=setup();
 for(const bad of [
  {avatar:'owner'},{root:{}},
  {skirt:{isSkinnedMesh:true,skeleton:{bones:[]}}}
 ]){
  const r=auditOriginalSkirtWaistBoneAttachment89({
   root:x.root,skirt:x.mesh,avatar:'male',...bad});
  assert.equal(r.status,'ORIGINAL_RIG_WAIST_SOURCE_NOT_VERIFIED');
  assert.equal(r.releaseAuthorized,false);
 }
 x.bones[3].name='fabricated-pelvis';
 const r=auditOriginalSkirtWaistBoneAttachment89({root:x.root,skirt:x.mesh,avatar:'female'});
 assert.equal(r.status,'ORIGINAL_RIG_WAIST_SOURCE_NOT_VERIFIED');
 assert.equal(r.originalPhoto2DFallbackRequired,true);
});
test('source garment waist rim must be level and plausible, but cannot prove human fit',()=>{
 const x=setup();
 x.mesh.geometry.getAttribute('sourceSkirt89Rest').setY(3,3.2);
 const r=auditOriginalSkirtWaistBoneAttachment89({root:x.root,skirt:x.mesh,avatar:'male'});
 assert.equal(r.status,'ORIGINAL_RIG_WAIST_SOURCE_NOT_VERIFIED');
 assert.equal(r.releaseAuthorized,false);
});
