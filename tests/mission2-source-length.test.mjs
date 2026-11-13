import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {deriveSourceLength,fitSourceLength,stageSourceFabricSeamNormals} from '../research/mission2-source-length/source-length.mjs';
import {createPosedBodyIntersectionAudit} from '../research/mission2-source-length/posed-intersections.mjs';
const SHA='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const profile={accepted:true,sourceSHA256:SHA,cutoutSHA256:'a'.repeat(64),inferredBack:true,releaseAuthorized:false,
 silhouetteAspect:.8534,bands:[.44,.74,.92,.89,.78,.86,.95,.67]};
function fixture(){
 const root=new THREE.Group(),bones=Array.from({length:163},()=>new THREE.Bone()),skeleton=new THREE.Skeleton(bones);root.add(...bones);
 function mesh(radius,height,y,x,role){
  const g=new THREE.CylinderGeometry(radius,radius,height,32,20,true);g.translate(x,y,0);
  const count=g.getAttribute('position').count,si=new Uint16Array(count*4),sw=new Float32Array(count*4);
  for(let i=0;i<count;i++)sw[i*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));
  g.setAttribute('panelPosition',g.getAttribute('position').clone());
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());m.bind(skeleton);
  if(role==='body')m.name='body';else{m.userData.work56Garment=true;
   if(role==='torso')m.name='Work56-independent-shirt-shell';else m.userData.work45IndependentShoulderCap=role;}
  root.add(m);return m;
 }
 const body=mesh(.15,1,1.05,0,'body');
 const meshes=[mesh(.23,.57,1.365,0,'torso'),mesh(.04,.2,1.45,-.45,'L'),mesh(.04,.2,1.45,.45,'R')];
 const shirt={meshes,stats:{sourceSHA256:SHA,cutoutSHA256:profile.cutoutSHA256,ownerAlphaMaskBasedPhysicalGeometry190:true,
  ownerPhysicalBilateralReadbackVerified196:true,envelope:{center:0}}};
 return {root,shirt,body};
}
test('source aspect and actual garment span drive bounded extension and observed lower flare',()=>{
 const a=deriveSourceLength({profile,minY:1.08,maxY:1.65,spanX:.98});
 assert.equal(a.extension,.38);assert.ok(a.flare>1.2);assert.equal(a.absoluteSizeMeasured,false);
 const short=deriveSourceLength({profile:{...profile,silhouetteAspect:1.4},minY:1.08,maxY:1.65,spanX:.98});
 assert.ok(short.extension<a.extension);
 for(const mutation of [{sourceSHA256:'0'.repeat(64)},{bands:Array(8).fill(NaN)},{silhouetteAspect:0},{cutoutSHA256:'x'}])
  assert.throws(()=>deriveSourceLength({profile:{...profile,...mutation},minY:1.08,maxY:1.65,spanX:.98}),/M2/);
});
test('real 163-bone physical lower shell extends while panel/photo coordinates and skin weights remain byte-identical',()=>{
 const {root,shirt}=fixture();
 const before=shirt.meshes.map(m=>({p:m.geometry.getAttribute('position').array.slice(),
  panel:m.geometry.getAttribute('panelPosition').array.slice(),weights:m.geometry.getAttribute('skinWeight').array.slice()}));
 const after=fitSourceLength(shirt,root,profile);
 assert.ok(after.stats.sourceLengthNewHemY<after.stats.sourceLengthOldHemY-.3);
 assert.ok(after.stats.sourceLengthMovedVertices>=100);
 assert.equal(after.stats.sourceLengthIntersectionPairsBefore,0);
 assert.equal(after.stats.sourceLengthIntersectionPairsAfter,0);
 assert.equal(after.stats.sourceLengthCollisionCertified,false);
 assert.equal(after.stats.sourceLengthSeamShadingApplied,true);
 assert.equal(after.stats.sourceLengthSeamShadingEvidence.checkedGarmentMeshes,3);
 assert.equal(after.stats.sourceLengthSeamShadingEvidence.positionsPhotoPixelsUVIndicesAndSkinPreservedByShading,true);
 assert.equal(after.stats.sourceLengthSeamShadingEvidence.releaseAuthorized,false);
 assert.equal(after.stats.sourceLengthPhysicalSizeMeasured,false);
 shirt.meshes.forEach((m,i)=>{
  assert.deepEqual(m.geometry.getAttribute('panelPosition').array,before[i].panel);
  assert.deepEqual(m.geometry.getAttribute('skinWeight').array,before[i].weights);
  if(i>0)assert.deepEqual(m.geometry.getAttribute('position').array,before[i].p);
 });
 assert.notDeepEqual(shirt.meshes[0].geometry.getAttribute('position').array,before[0].p);
});
test('source swap and corrupt late cap refuse extension without partial garment updates',()=>{
 for(const corruption of ['source','late-transform']){
  const {root,shirt}=fixture(),before=shirt.meshes.map(m=>m.geometry.getAttribute('position').array.slice());
  if(corruption==='late-transform')shirt.meshes[2].scale.x=0;
  assert.throws(()=>fitSourceLength(shirt,root,corruption==='source'?{...profile,cutoutSHA256:'b'.repeat(64)}:profile),/M2/);
  shirt.meshes.forEach((m,i)=>assert.deepEqual(m.geometry.getAttribute('position').array,before[i]));
 }
});
test('posed triangle diagnostic detects crossing surface and actually applies bone transforms',()=>{
 const {root,shirt}=fixture();
 const g=shirt.meshes[0].geometry,p=g.getAttribute('position');
 const shifted=p.array.slice();for(let i=0;i<p.count;i++)shifted[i*3]+=.18;
 const audit=createPosedBodyIntersectionAudit(root);
 try{
  const before=audit.measure([shirt.meshes[0]]);
  const crossing=audit.measure([shirt.meshes[0]],new Map([[shirt.meshes[0],shifted]]));
  const indices=g.getAttribute('skinIndex');for(let i=0;i<indices.count;i++)indices.setX(i,1);
  shirt.meshes[0].skeleton.bones[1].position.x=.18;root.updateMatrixWorld(true);
  const posedCrossing=audit.measure([shirt.meshes[0]]);assert.equal(posedCrossing.intersectingPairs,1);
  assert.equal(before.intersectingPairs,0);assert.equal(crossing.intersectingPairs,1);
  assert.equal(crossing.signedClearanceVerified,false);
  assert.equal(crossing.continuousCollisionVerified,false);
 }finally{audit.dispose();}
});
test('a new staged lower-body intersection rejects before modifying any original garment positions',()=>{
 const {root,shirt}=fixture(),g=new THREE.BoxGeometry(.6,.18,.3);g.translate(0,.82,0);
 const count=g.getAttribute('position').count,weights=new Float32Array(count*4);
 for(let i=0;i<count;i++)weights[i*4]=1;
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(new Uint16Array(count*4),4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const obstacle=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());obstacle.bind(shirt.meshes[0].skeleton);root.add(obstacle);
 const before=shirt.meshes.map(m=>m.geometry.getAttribute('position').array.slice());
 assert.throws(()=>fitSourceLength(shirt,root,profile),/new posed body intersection/);
 shirt.meshes.forEach((m,i)=>assert.deepEqual(m.geometry.getAttribute('position').array,before[i]));
});
import {patchSourceProjectionShader,prepareSourceProjection} from '../research/mission2-source-length/source-projection.mjs';
function sourceShader(){return {uniforms:{},vertexShader:'void main() {\n#include <worldpos_vertex>\n}',fragmentShader:`void main() {
 vec2 panel=vec2(.5+vPanel.x/uPhotoSpan.x,(vPanel.y-1.11)/uPhotoSpan.y);
 float front=frontNormal; float necklineInterior=neckline; vec3 rear=uFabric;
 float chest=1.-smoothstep(.22,.29,abs(vPanel.x));
 diffuseColor.rgb=mix(uFabric,photo.rgb,photo.a*smoothstep(.95,1.,interiorAlpha)*front*chest*necklineInterior);
}`};}
test('registered front shader uses actual extended geometry while retaining original alpha/front/rear guards',()=>{
 const shader=sourceShader();patchSourceProjectionShader(shader,[0,.98,.95,.7]);
 assert.ok(shader.vertexShader.includes('vSourceProjectionPosition=sourceProjectionPosition'));
 assert.ok(shader.fragmentShader.includes('uM2SourceProjection'));
 assert.ok(shader.fragmentShader.includes('front*chest*m2SourcePhotoEdgeWeight*necklineInterior'));
 assert.ok(shader.fragmentShader.includes('smoothstep(0.0,0.012,panel.x)'));
 assert.ok(shader.fragmentShader.includes('1.0-smoothstep(0.988,1.0,panel.y)'));
 assert.ok(shader.fragmentShader.includes('vec3 rear=uFabric'));
 assert.ok(shader.fragmentShader.includes('smoothstep(.95,.975,interiorAlpha)'));
 assert.deepEqual(shader.uniforms.uM2SourceProjection.value.toArray(),[0,.98,.95,.7]);
 assert.throws(()=>patchSourceProjectionShader(sourceShader(),[0,100,.95,.7]),/M2 source projection/);
 assert.throws(()=>patchSourceProjectionShader({...sourceShader(),fragmentShader:'unrelated'},[0,.98,.95,.7]),/M2 source projection/);
});
test('projection preparation has no precommit mutation and actual shader callbacks produce bounded numeric compilation receipts',()=>{
 const {shirt}=fixture(),material=shirt.meshes[0].material;
 material.onBeforeCompile=function(shader){shader.fragmentShader=sourceShader().fragmentShader;shader.uniforms.uPhoto={value:new THREE.Texture()};};
 assert.equal(material.onBeforeCompile.toString().includes('vec2 panel=vec2('),false);
 const before=material.onBeforeCompile;
 const plan=prepareSourceProjection(shirt,[],[0,.98,.95,.7]);
 assert.equal(material.onBeforeCompile,before);assert.equal(plan.runtime.compiledMaterialCount,0);
 assert.equal(shirt.meshes[0].geometry.hasAttribute('sourceProjectionPosition'),false);
 plan.commit();assert.equal(shirt.meshes[0].geometry.hasAttribute('sourceProjectionPosition'),true);
 material.onBeforeCompile(sourceShader());assert.equal(plan.runtime.compiledMaterialCount,1);
 material.onBeforeCompile(sourceShader());assert.equal(plan.runtime.compiledMaterialCount,1);
 assert.ok(material.customProgramCacheKey().includes('REGISTERED_FRONT_SOURCE_PROJECTION'));
});


import {auditOriginalPhotoTexelRegistration} from '../research/mission2-source-length/source-texel-audit.mjs';
test('P2-C30 original source photo texel coverage counts real skinned source vertices and decoded RGB safely',()=>{
 const {root,shirt}=fixture();
 root.updateMatrixWorld(true);
 const attrs=shirt.meshes.map(mesh=>{
  const p=mesh.geometry.getAttribute('position'),coords=new Float32Array(p.array.length),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray(coords,i*3);
  }
  return {mesh,coords};
 });
 const bytes=new Uint8Array(8*8*4);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const i=(y*8+x)*4;
  bytes[i]=x*30;bytes[i+1]=y*29;bytes[i+2]=(x+y)*13;
  bytes[i+3]=255;
 }
 const originalBytes=bytes.slice();
 const sourcePhoto=new THREE.DataTexture(bytes,8,8);
 const first=auditOriginalPhotoTexelRegistration(attrs,[0,.98,.95,.7],[sourcePhoto]);
 assert.equal(first.original163BoneSourceMeshes,3);
 assert.ok(first.registeredVertices>100);
 assert.ok(first.eligibleSourceSamples>0);
 assert.equal(first.nonFiniteProjectionVertices,0);
 assert.equal(first.uvDomainOutsideVertices,0);
 assert.equal(first.sourceShaderTexturesBound,1);
 assert.equal(first.sourceTextureImagesDecodable,1);
 assert.equal(first.sourceTextureImagesUnavailable,0);
 assert.ok(first.eligibleTexelSamples>0);
 assert.equal(first.nonTransparentTexelSamples,first.eligibleTexelSamples);
 assert.ok(first.differentRGBQuantizedBuckets>1);
 assert.equal(first.normalizedFrontProjectionOnly,true);
 assert.equal(first.sourceRGBValuesNeverReported,true);
 assert.equal(first.allOriginalSourcePixelsStayPrivate,true);
 assert.equal(first.colorAccuracyNotVerified,true);
 assert.equal(first.photorealismNotVerified,true);
 assert.equal(first.humanVisualAcceptanceNotVerified,true);
 assert.equal(first.releaseAuthorized,false);
 assert.deepEqual(bytes,originalBytes);
 const originalPositions=shirt.meshes.map(mesh=>
  mesh.geometry.getAttribute('position').array.slice());
 const out=attrs.map(({mesh,coords})=>({mesh,coords:coords.slice()}));
 for(const entry of out)for(let i=0;i<entry.coords.length;i+=3)entry.coords[i]+=3;
 const invalid=auditOriginalPhotoTexelRegistration(out,[0,.98,.95,.7],[sourcePhoto]);
 assert.ok(invalid.uvDomainOutsideVertices>0);
 assert.equal(invalid.eligibleTexelSamples,0);
 assert.equal(invalid.nonTransparentTexelSamples,0);
 assert.equal(invalid.releaseAuthorized,false);
 const unready=new THREE.Texture();
 const unknown=auditOriginalPhotoTexelRegistration(attrs,[0,.98,.95,.7],[unready]);
 assert.equal(unknown.sourceTextureImagesDecodable,0);
 assert.equal(unknown.sourceTextureImagesUnavailable,1);
 assert.equal(unknown.missingTextureDecodeIsNotPhotoValidation,true);
 assert.equal(unknown.releaseAuthorized,false);
 const invalidSource=attrs.map(entry=>({...entry,coords:entry.coords.slice()}));
 invalidSource[0].coords[0]=NaN;
 assert.throws(()=>auditOriginalPhotoTexelRegistration(invalidSource,
  [0,.98,.95,.7],[sourcePhoto]),
  /complete finite original 163-bone source coordinate mapping/);
 assert.throws(()=>auditOriginalPhotoTexelRegistration(attrs,
  [0,-.1,.95,.7],[sourcePhoto]),
  /complete bounded source shader photo and source registration/);
 assert.throws(()=>auditOriginalPhotoTexelRegistration(attrs,
  [0,.98,.95,.7],[{}]),
  /complete bounded source shader photo and source registration/);
 shirt.meshes.forEach((mesh,i)=>assert.deepEqual(
  mesh.geometry.getAttribute('position').array,originalPositions[i]));
 assert.deepEqual(bytes,originalBytes);
 const exported=JSON.stringify(first);
 for(const secret of ['"ownerId"','"sourceSHA256"','"sourceUV"',
  '"sourceFace"','"sourceImage"','"texelRGB"','"localXYZ"'])
  assert.equal(exported.includes(secret),false);
});


import {auditOriginalPhotoProjectedTriangles} from '../research/mission2-source-length/source-texel-audit.mjs';
test('P2-C31 original shader projected fabric triangle area finds collapsed and off-photo faces even when vertices are individually finite',()=>{
 const {root,shirt}=fixture();
 root.updateMatrixWorld(true);
 const original=shirt.meshes.map(mesh=>mesh.geometry.getAttribute('position').array.slice());
 const attributes=shirt.meshes.map(mesh=>{
  const p=mesh.geometry.getAttribute('position'),coords=new Float32Array(p.count*3),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++)
   v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray(coords,i*3);
  return {mesh,coords};
 });
 const projection=[0,.98,.95,.7];
 const report=auditOriginalPhotoProjectedTriangles(attributes,projection);
 assert.ok(report.sourceTriangles>100);
 assert.equal(report.sourceTriangles,
  shirt.meshes.reduce((n,m)=>n+(m.geometry.index?
   m.geometry.index.count/3:m.geometry.getAttribute('position').count/3),0));
 assert.ok(report.sourceTrianglesWithMappedPhotoCentroid>0);
 assert.equal(report.sourcePhotoGridCellsTotal,256);
 assert.ok(report.sourcePhotoGridCellsWithMappedFaceCentroids>=1);
 assert.ok(report.sourcePhotoGridCellsWithMappedFaceCentroids<=256);
 assert.ok(report.projectedDegenerateTriangles>=0);
 assert.ok(report.projectionPartiallyOutsideTriangles>=0);
 assert.ok(report.projectionFullyOutsideTriangles>=0);
 assert.equal(report.actualSourceShaderProjectionUsed,true);
 assert.equal(report.original163BoneGeometryTrianglesObserved,true);
 assert.equal(report.planarSideFacesMayBeIntentionallyDegenerate,true);
 assert.equal(report.sourcePhotoColorMatchNotMeasured,true);
 assert.equal(report.fabricDrapeNotCertified,true);
 assert.equal(report.humanPhotorealismNotCertified,true);
 assert.equal(report.physicalPhoneNotTested,true);
 assert.equal(report.releaseAuthorized,false);
 // Every source vertex can be finite and within photo bounds, while all
 // triangles lose projected area after a bad planar mapping: vertex
 // validation alone cannot detect this failure.
 const flattened=attributes.map(({mesh,coords})=>({mesh,coords:coords.slice()}));
 for(const item of flattened)for(let i=0;i<item.coords.length;i+=3)
  item.coords[i]=0;
 const degenerate=auditOriginalPhotoProjectedTriangles(flattened,projection);
 assert.equal(degenerate.sourceTriangles,report.sourceTriangles);
 assert.equal(degenerate.projectedDegenerateTriangles,report.sourceTriangles);
 assert.equal(degenerate.sourceTrianglesWithMappedPhotoCentroid,0);
 const outside=attributes.map(({mesh,coords})=>({mesh,coords:coords.slice()}));
 for(const item of outside)for(let i=0;i<item.coords.length;i+=3)
  item.coords[i]+=3;
 const far=auditOriginalPhotoProjectedTriangles(outside,projection);
 assert.equal(far.projectionFullyOutsideTriangles,far.sourceTriangles);
 assert.equal(far.sourceTrianglesWithMappedPhotoCentroid,0);
 const invalid=attributes.map(({mesh,coords})=>({mesh,coords:coords.slice()}));
 invalid[0].coords[0]=NaN;
 assert.throws(()=>auditOriginalPhotoProjectedTriangles(invalid,projection),
  /full finite original 163-bone indexed source triangles required/);
 assert.throws(()=>auditOriginalPhotoProjectedTriangles(attributes,
  [0,-1,.95,.7]),/complete bounded original source triangle surface evidence/);
 assert.throws(()=>auditOriginalPhotoProjectedTriangles(attributes,projection,
  {maxTriangles:1}),/complete bounded original photographic source triangle count required/);
 for(let i=0;i<shirt.meshes.length;i++)
  assert.deepEqual(shirt.meshes[i].geometry.getAttribute('position').array,original[i]);
 const publicReport=JSON.stringify(report);
 for(const secret of ['"ownerId"','"sourceSHA256"','"sourceFace"','"sourceUV"',
  '"localXYZ"','"photoRGBA"','"texelRGB"','"triangleIndices"'])
  assert.equal(publicReport.includes(secret),false);
});


test('P2-C31 projection entirely outside actual original photograph fails closed BEFORE donor mesh mutation',()=>{
 const {shirt}=fixture();
 const originals=shirt.meshes.map(m=>m.geometry.getAttribute('position').array.slice());
 const material=shirt.meshes[0].material;
 material.onBeforeCompile=function(shader){
  shader.fragmentShader=sourceShader().fragmentShader;
  shader.uniforms.uPhoto={value:new THREE.Texture()};
 };
 const priorCompile=material.onBeforeCompile;
 const staged=shirt.meshes.map(mesh=>{
  const next=mesh.geometry.getAttribute('position').array.slice();
  for(let i=0;i<next.length;i+=3)next[i]+=4;
  return {mesh,next};
 });
 assert.throws(()=>prepareSourceProjection(shirt,staged,[0,.98,.95,.7]),
  /no usable original photo triangles: preserve original photo and 2D fallback/);
 shirt.meshes.forEach((mesh,i)=>{
  assert.deepEqual(mesh.geometry.getAttribute('position').array,originals[i]);
  assert.equal(mesh.geometry.hasAttribute('sourceProjectionPosition'),false);
 });
 assert.equal(material.onBeforeCompile,priorCompile);
});


import {originalPhotoDomainEdgeWeight} from '../research/mission2-source-length/source-projection.mjs';
test('P2-C32 preserve original photo RGB only inside registered front UV and fade off-photo edge bleed',()=>{
 const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,
  'Expected '+a+' to equal '+b+' within '+tol);
 const weight=originalPhotoDomainEdgeWeight;
 near(weight(.5,.5),1);
 near(weight(.1,.9),1);
 near(weight(.012,.012),1);
 near(weight(.99,.5),.9259259259259259,1e-7);
 near(weight(0,.5),0);
 near(weight(1,.5),0);
 near(weight(-.01,.5),0);
 near(weight(1.01,.5),0);
 near(weight(.5,-.25),0);
 near(weight(.5,1.2),0);
 assert.ok(weight(.006,.5)>.49&&weight(.006,.5)<.51);
 assert.ok(weight(.5,.994)>.49&&weight(.5,.994)<.51);
 assert.throws(()=>weight(NaN,.5),/source photo edge finite UV/);
 assert.throws(()=>weight(.5,Infinity),/source photo edge finite UV/);
 const shader=sourceShader();
 patchSourceProjectionShader(shader,[0,.98,.95,.7]);
 const glsl=shader.fragmentShader;
 assert.match(glsl,/m2SourcePhotoEdgeWeight/);
 assert.match(glsl,/front\*chest\*m2SourcePhotoEdgeWeight\*necklineInterior/);
 assert.match(glsl,/photo\.a\*smoothstep\(\.95,\.975,interiorAlpha\)/);
 assert.match(glsl,/vec3 rear=uFabric/);
 assert.ok(glsl.includes('vec2 panel=vec2(.5+'));
 assert.ok(!glsl.includes('front*chest*necklineInterior'));
 const {shirt}=fixture();
 const original=shirt.meshes.map(m=>m.geometry.getAttribute('position').array.slice());
 assert.ok(shader.uniforms.uM2SourceProjection.value.isVector4);
 shirt.meshes.forEach((mesh,i)=>assert.deepEqual(
  mesh.geometry.getAttribute('position').array,original[i]));
});


test('P2-C34 genuine 163-bone source fabric normals weld only skinned coincident soft folds, preserving source photo geometry',()=>{
 const root=new THREE.Group(),bones=Array.from({length:163},()=>new THREE.Bone());
 root.add(...bones);const skeleton=new THREE.Skeleton(bones);
 const values=new Float32Array([
  0,0,0, 1,0,0, 0,1,0,
  1,0,0, 1,1,.2, 0,1,0
 ]);
 const make=()=>{const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(values.slice(),3));
  g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(values.length),3));
  const skin=new Uint16Array(24),weight=new Float32Array(24);
  for(let i=0;i<6;i++)weight[4*i]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(skin,4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(weight,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());m.bind(skeleton);
  return m;
 };
 const m=make(),g=m.geometry;
 const originalPosition=g.getAttribute('position').array.slice(),
  originalWeights=g.getAttribute('skinWeight').array.slice(),
  originalSkin=g.getAttribute('skinIndex').array.slice(),
  originalNormal=g.getAttribute('normal').array.slice();
 const smooth=stageSourceFabricSeamNormals(m,originalPosition.slice());
 assert.equal(smooth.evidence.sourceVertices,6);
 assert.equal(smooth.evidence.coincidentSeamVertices,4);
 assert.ok(smooth.evidence.smoothedVertices>=2);
 assert.ok(smooth.evidence.compatibleSeamClusters>=1);
 assert.ok(smooth.evidence.maxNormalDeltaDegrees>0);
 assert.equal(smooth.evidence.originalSourcePositionsPhotoUVAndSkinUntouched,true);
 assert.equal(smooth.evidence.alignedSkinningInfluencesOnly,true);
 assert.equal(smooth.evidence.hardOrOpposingNormalsNotMerged,true);
 assert.equal(smooth.evidence.releaseAuthorized,false);
 const n1=new THREE.Vector3().fromArray(smooth.normals,3),
  n3=new THREE.Vector3().fromArray(smooth.normals,9);
 assert.ok(n1.distanceTo(n3)<1e-6,'same physical joined source must have same lighting normal');
 assert.deepEqual(g.getAttribute('position').array,originalPosition);
 assert.deepEqual(g.getAttribute('skinWeight').array,originalWeights);
 assert.deepEqual(g.getAttribute('skinIndex').array,originalSkin);
 assert.deepEqual(g.getAttribute('normal').array,originalNormal);
 // A truly folded right-angle seam is deliberately NOT welded together:
 // its normals have incompatible directions at the exact same position.
 const hard=new Float32Array([
  0,0,0, 0,1,0, 1,0,0,
  0,0,0, 0,1,0, 0,0,1
 ]);
 const sharp=stageSourceFabricSeamNormals(make(),hard);
 assert.equal(sharp.evidence.smoothedVertices,0);
 assert.equal(sharp.evidence.compatibleSeamClusters,0);
 // Unrelated original bone weights never get smoothed across a spatial join.
 const other=make();other.geometry.getAttribute('skinIndex').setX(3,2);
 const isolated=stageSourceFabricSeamNormals(other,originalPosition.slice());
 const nAfterA=new THREE.Vector3().fromArray(isolated.normals,3),
  nAfterB=new THREE.Vector3().fromArray(isolated.normals,9);
 assert.ok(nAfterA.distanceTo(nAfterB)>1e-3);
 assert.throws(()=>stageSourceFabricSeamNormals(m,new Float32Array([1,2,3])),
  /M2 C34 exact source rig/);
 const nonfinite=originalPosition.slice();nonfinite[0]=NaN;
 assert.throws(()=>stageSourceFabricSeamNormals(m,nonfinite),
  /M2 C34 exact source rig/);
 const serialized=JSON.stringify(smooth.evidence);
 for(const privateName of ['ownerId','sourceSHA256','pixelRGB','photoJPEG','sourceUV'])
  assert.equal(serialized.includes(privateName),false);
});
