import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {auditActualSkinnedOutfitLayers84}
 from '../research/parallel84-real-photo-layers/actual-skinned-layers84.mjs';
import {PARALLEL84_SOURCE_REGISTRY as SOURCES}
 from '../research/parallel84-real-photo-layers/layer-contact84.mjs';

// SYNTHETIC triangles bound to ACTUAL THREE.SkinnedMesh with 163 bones. No
// licensed JPEG pixel rendering, owner-photo 3D proof or human realism claim.
const top=[-.8,-.8,0,.8,-.8,0,0,.8,0];
const lower=[0,-.4,-.6,0,-.4,.6,0,.4,0];
function skinned(root,points,garment=true){
 const bones=Array.from({length:163},()=>new T.Bone());
 root.add(...bones);
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(points,3));
 g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1],2));
 const ids=new Uint16Array(12),w=new Float32Array(12);
 for(let i=0;i<3;i++)w[i*4]=1;
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(w,4));
 const mesh=new T.SkinnedMesh(g,new T.MeshStandardMaterial());
 mesh.userData.work56Garment=garment;root.add(mesh);
 root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));
 return {mesh,bones};
}
function scene(bottom=lower){
 const root=new T.Group(),body=skinned(root,[0,0,-2,1,0,-2,0,1,-2],false);
 const shirt=skinned(root,top),jeans=skinned(root,bottom);
 const proof={originalPhotoSHA256Verified:true,
  actualPhotoTexelsOnSkinnedMesh:true,actual163BoneSourceMesh:true,
  originalSourceGeometryUnmodified:true,rearViewPhotographed:false};
 const items=[
  {...proof,slot:'top',sourceId:'licensed-shirt',
   sourceSHA256:SOURCES['licensed-shirt'].sha,meshes:[shirt.mesh]},
  {...proof,slot:'bottom',sourceId:'licensed-jeans-1',
   sourceSHA256:SOURCES['licensed-jeans-1'].sha,meshes:[jeans.mesh]}
 ];
 return {root,body,shirt,jeans,items};
}
const audit=(f,opts={})=>auditActualSkinnedOutfitLayers84({
 root:f.root,items:f.items,avatar:'female',pose:'neutral',...opts
});
test('P84 reads synthetic actual THREE 163-bone surfaces; detects distinct-garment transverse crossing',()=>{
 const f=scene(),orig=f.shirt.mesh.geometry.attributes.position.array.slice();
 const lowerOrig=f.jeans.mesh.geometry.attributes.position.array.slice();
 const x=audit(f);
 assert.equal(x.actualSkinnedPoseSampled,true);
 assert.equal(x.anatomicalBodyMeshes,1);
 assert.equal(x.sourceBuffersPreserved,true);
 assert.equal(x.status,'STRICT_CROSSING_VETO');
 assert.ok(x.strictTransverseCrossings>0);
 assert.equal(x.safe3D,false);
 assert.deepEqual(f.shirt.mesh.geometry.attributes.position.array,orig);
 assert.deepEqual(f.jeans.mesh.geometry.attributes.position.array,lowerOrig);
});
test('P84 body, garment and sourced photo projection attributes are mandatory',()=>{
 const f=scene();
 f.shirt.mesh.geometry.deleteAttribute('uv');
 assert.equal(audit(f).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const g=scene();g.body.mesh.userData.work56Garment=true;
 assert.equal(audit(g).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const h=scene();h.jeans.mesh.skeleton.bones.pop();
 assert.equal(audit(h).status,'ORIGINAL_PHOTO_2D_FALLBACK');
});
test('P84 signed texture/source receipt failures block extraction',()=>{
 const f=scene();f.items[1].actualPhotoTexelsOnSkinnedMesh=false;
 const x=audit(f);
 assert.equal(x.status,'ORIGINAL_PHOTO_2D_FALLBACK');
 assert.equal(x.safe3D,false);
 assert.equal(x.releaseAuthorized,false);
});
test('P84 genuine THREE bone motion is evaluated in the CURRENT skinned pose, not raw rest XYZ',()=>{
 const offset=lower.map((n,i)=>i%3===2?n+1.2:n);
 const f=scene(offset);
 const before=audit(f);
 assert.equal(before.status,'UNCERTAIN_NOT_CLEARANCE');
 f.jeans.bones[1].position.z=-1.2;
 for(let i=0;i<3;i++)
  f.jeans.mesh.geometry.getAttribute('skinIndex').setX(i,1);
 const after=audit(f);
 assert.equal(after.status,'STRICT_CROSSING_VETO');
 assert.ok(after.strictTransverseCrossings>before.strictTransverseCrossings);
 assert.equal(after.measurementsAreSinglePoseOnly,true);
});
test('P84 both anatomical figure labels are supported as current-pose research samples',()=>{
 for(const avatar of ['female','male']){
  const f=scene();
  const x=audit(f,{avatar,pose:'arms-raised'});
  assert.equal(x.avatar,avatar);
  assert.equal(x.pose,'arms-raised');
  assert.equal(x.releaseAuthorized,false);
 }
});
test('P84 duplicate mesh refs and visibility failures never cause inferred layer approval',()=>{
 const f=scene();f.items[1].meshes=[f.shirt.mesh];
 assert.equal(audit(f).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const g=scene();g.jeans.mesh.visible=false;
 assert.equal(audit(g).status,'ORIGINAL_PHOTO_2D_FALLBACK');
});


test('P84 rejects collapsed and nonfinite source UVs but respects actual dressRest shader-style projection',()=>{
 const collapsed=scene();
 collapsed.shirt.mesh.geometry.getAttribute('uv').setXY(2,0,0);
 assert.equal(audit(collapsed).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 assert.equal(audit(collapsed).reason,'source-UV-collapsed');
 const nonfinite=scene();
 nonfinite.jeans.mesh.geometry.getAttribute('uv').setX(2,NaN);
 assert.equal(audit(nonfinite).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 assert.equal(audit(nonfinite).reason,'source-projection-nonfinite');
 const shaderRest=scene();
 shaderRest.shirt.mesh.geometry.setAttribute('dressRest',
  shaderRest.shirt.mesh.geometry.getAttribute('position').clone());
 shaderRest.shirt.mesh.geometry.deleteAttribute('uv');
 const x=audit(shaderRest);
 assert.equal(x.status,'STRICT_CROSSING_VETO');
 assert.equal(x.sourceBuffersPreserved,true);
});


test('P84 genuine donor shirt panelPosition and denim pantsRest/pantsSourceUV can be diagnosed read-only',()=>{
 const f=scene();
 const shirt=f.shirt.mesh.geometry;
 shirt.setAttribute('panelPosition',shirt.getAttribute('position').clone());
 shirt.setAttribute('panelNormal',new T.Float32BufferAttribute([
  0,0,1,0,0,1,0,0,1
 ],3));
 shirt.deleteAttribute('uv');
 const pants=f.jeans.mesh.geometry;
 pants.setAttribute('pantsRest',pants.getAttribute('position').clone());
 pants.setAttribute('pantsSourceUV',new T.Float32BufferAttribute([0,0,1,0,0,1],2));
 pants.deleteAttribute('uv');
 const before=Object.entries(pants.attributes).map(([k,a])=>[k,a.array.slice()]);
 const result=audit(f);
 assert.equal(result.status,'STRICT_CROSSING_VETO');
 assert.equal(result.actualSkinnedPoseSampled,true);
 assert.equal(result.sourceBuffersPreserved,true);
 for(const [key,old] of before)
  assert.deepEqual(pants.getAttribute(key).array,old);
});
test('P84 missing pantsRest, malformed shirt panels, bad denim UV and unsupported source ID refuse source 3D proof',()=>{
 const bad=scene();bad.jeans.mesh.geometry.deleteAttribute('uv');
 bad.jeans.mesh.geometry.setAttribute('pantsSourceUV',
  new T.Float32BufferAttribute([0,0,1,0,0,1],2));
 assert.equal(audit(bad).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const shirt=scene();shirt.shirt.mesh.geometry.deleteAttribute('uv');
 shirt.shirt.mesh.geometry.setAttribute('panelPosition',
  new T.Float32BufferAttribute([0,0,1,0,0,1],2));
 assert.equal(audit(shirt).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const denim=scene();denim.jeans.mesh.geometry.deleteAttribute('uv');
 denim.jeans.mesh.geometry.setAttribute('pantsRest',
  denim.jeans.mesh.geometry.getAttribute('position').clone());
 denim.jeans.mesh.geometry.setAttribute('pantsSourceUV',
  new T.Float32BufferAttribute([0,0,1,0,NaN,1],2));
 assert.equal(audit(denim).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const unknown=scene();unknown.items[1].sourceId='private-owner-unknown';
 assert.equal(audit(unknown).status,'ORIGINAL_PHOTO_2D_FALLBACK');
});


test('P84 deterministic cross-garment face sampling spans both meshes, counts omitted source faces, never grants clearance',()=>{
 const f=scene();
 const repeated=Array.from({length:10},()=>[0,1,2]).flat();
 f.shirt.mesh.geometry.setIndex(repeated);
 f.jeans.mesh.geometry.setIndex(repeated);
 const savedShirt=f.shirt.mesh.geometry.index.array.slice();
 const savedJeans=f.jeans.mesh.geometry.index.array.slice();
 const x=audit(f,{maxFaces:2});
 assert.equal(x.fullOriginalSourceFaceCount,20);
 assert.equal(x.sampledSourceFaceCount,2);
 assert.equal(x.sourceFaceSamplingStride,10);
 assert.equal(x.originalFacesOmittedByBudget,18);
 assert.equal(x.sourceFaceCoverageComplete,false);
 assert.equal(x.sampledPoseIsNotWholeGarmentClearance,true);
 assert.equal(x.status,'STRICT_CROSSING_VETO');
 assert.equal(x.actualSkinnedPoseSampled,true);
 assert.equal(x.releaseAuthorized,false);
 assert.deepEqual(f.shirt.mesh.geometry.index.array,savedShirt);
 assert.deepEqual(f.jeans.mesh.geometry.index.array,savedJeans);
});


test('P84 impossible face cap smaller than count of independent sourced panels fails without a sampling loop',()=>{
 const f=scene(),another=skinned(f.root,top);
 f.items[0].meshes.push(another.mesh);
 const x=audit(f,{maxFaces:2});
 assert.equal(x.status,'ORIGINAL_PHOTO_2D_FALLBACK');
 assert.equal(x.reason,'source-face-budget');
 assert.equal(x.safe3D,false);
});
