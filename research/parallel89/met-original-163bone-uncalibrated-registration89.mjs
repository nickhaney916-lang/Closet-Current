/**
 * P89 authentic museum photo-shell vs REAL licensed 163-bone male/female
 * anatomy: original-source 3D SPACE registration experiment, not garment fit.
 *
 * SOURCE PHOTO is visually placed in FRONT OF (not sewn onto) each real rig.
 * Three deliberately different rig-relative scales demonstrate the missing
 * calibrated source-camera/physical garment dimensions. All candidates are
 * REJECTED for consumer wearability, regardless of appearance or coverage.
 * Immutable source RGB/UV/geometry and actual CC0 rig bones remain untouched.
 *
 * Research localhost only; no private family source or consumer code.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {evaluateFullIndexedContact,controlledFullContactFixtures}
 from './full-indexed-contact-calibration89.mjs';

if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname))
 throw Error('source-anatomy-research-loopback-required');
const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',x)),
 n=>n.toString(16).padStart(2,'0')).join('');
const required=Object.freeze({
 sourceJPEG:new Set([
  '780b082ff1408bc838d525364d95f455139e4c3c817fc39fe5dc1b756caca5c6',
  '528f5105194df3c92dcc3e4c415f7d357069c7ca0a28bbec29ba4a5ec1741ee5'
 ]),
 sourceRGB:'e0b7738db57ac4b7c27d4f03f724442f53c8e85f09f7a139839dfaa04c86cbec',
 conservativeMaskPNG:'34a93a1a8a2ea58f92a560703936a83b390e92a50d7103ff7ff1586ffe0841aa',
 sourceTextureRGBA:'b8adb2fbd644203341051d6475788c69c1954868e5c2e8942f2fed0a3d8f116d',
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const invariant=(ok,why)=>{if(!ok)throw Error(why)};
const status=document.getElementById('status');
const canvas=document.getElementById('scene');
const bodyModelName=document.getElementById('rig');
const trialLabel=document.getElementById('trial');
const poseLabel=document.getElementById('angle');
const renderer=new THREE.WebGLRenderer({canvas,preserveDrawingBuffer:true,
 antialias:false,alpha:false,powerPreference:'low-power'});
renderer.setPixelRatio(1);renderer.setSize(390,690,false);
renderer.setClearColor(0xf5f4f2);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,390/690,.03,30);
const light=new THREE.HemisphereLight(0xffffff,0xbac5d5,2);
scene.add(light);const sun=new THREE.DirectionalLight(0xffffff,2.3);
sun.position.set(-3,5,6);scene.add(sun);
const textureSource=await fetch('/research-source/shell.json',{cache:'no-store'});
invariant(textureSource.ok,'no-museum-original-source-shell');
const payload=await textureSource.json();
invariant(payload.schema==='M2-P89-authentic-real-anatomy-original-Met-source-shell/RESEARCH/v1'&&
 payload.imageId===2551406&&payload.museumCaption==='a) front'&&
 required.sourceJPEG.has(payload.originalJPEGByteSHA256)&&
 payload.decodedOriginalRGBSHA256===required.sourceRGB&&
 payload.conservativeOriginalMaskPNG_SHA256===required.conservativeMaskPNG&&
 payload.sourceTextureRGBA_SHA256===required.sourceTextureRGBA&&
 payload.materialRoles?.[0]==='ORIGINAL_PHOTOGRAPH_FRONT'&&
 payload.materialRoles?.[1]==='UNOBSERVED_NEUTRAL_REAR'&&
 payload.materialRoles?.[2]==='INFERRED_NEUTRAL_EDGE'&&
 payload.originalPhoto2DFallbackRequired===true&&
 payload.consumer3DAdmitted===false&&payload.releaseAuthorized===false&&
 payload.familyAlpha==='HOLD','true-public-original-photo-source-not-accepted');
const texBytes=new Uint8Array(payload.originalRGBAFront);
invariant(await sha(texBytes)===required.sourceTextureRGBA,
 'original-museum-source-rgb-provenance-drift');
const positions=new Float32Array(payload.positions),
 uvs=new Float32Array(payload.uv),
 faces=new Uint32Array(payload.indices),
 textureDims=payload.photoDimensions;
invariant(positions.length>20000&&positions.length<300000&&positions.length%3===0&&
 uvs.length===positions.length/3*2&&faces.length<300000&&
 faces.length%3===0&&Array.isArray(textureDims)&&textureDims.length===2&&
 textureDims[0]===192&&textureDims[1]===149&&
 texBytes.length===192*149*4,'unverified-original-source-geometry-shape');
for(const v of positions)invariant(Number.isFinite(v),'nonfinite-original-source-positions');
for(const n of faces)invariant(n<positions.length/3,'original-source-face-invalid');
const range=payload.drawRanges;
invariant(range?.sourcePhotoFront?.start===0&&
 range?.unobservedNeutralBack?.start===range.sourcePhotoFront.count&&
 range?.inferredNeutralSideWalls?.start===
  range.unobservedNeutralBack.start+range.unobservedNeutralBack.count&&
 range.inferredNeutralSideWalls.start+range.inferredNeutralSideWalls.count===faces.length,
 'original-source-material-role-shift');
const geometry=new THREE.BufferGeometry();
geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
geometry.setIndex(new THREE.BufferAttribute(faces,1));
geometry.clearGroups();
for(const [index,name] of ['sourcePhotoFront','unobservedNeutralBack','inferredNeutralSideWalls'].entries()){
 geometry.addGroup(range[name].start,range[name].count,index);
}
geometry.computeBoundingBox();geometry.computeVertexNormals();
const photoBBox=geometry.boundingBox.clone(),
 photoWidth=photoBBox.max.x-photoBBox.min.x;
invariant(photoWidth>.20&&photoWidth<2,'original-image-space-source-bounds-wrong');
const tex=new THREE.DataTexture(texBytes,192,149,THREE.RGBAFormat,
 THREE.UnsignedByteType);
tex.flipY=false;tex.colorSpace=THREE.SRGBColorSpace;
tex.minFilter=THREE.NearestFilter;tex.magFilter=THREE.NearestFilter;
tex.needsUpdate=true;
const photoMaterial=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,
 alphaTest:.25,transparent:true,depthWrite:true});
const backMaterial=new THREE.MeshBasicMaterial({color:0x18bedc,side:THREE.DoubleSide});
const sideMaterial=new THREE.MeshBasicMaterial({color:0xe5a04a,side:THREE.DoubleSide});
const imageMesh=new THREE.Mesh(geometry,[photoMaterial,backMaterial,sideMaterial]);
imageMesh.renderOrder=2;scene.add(imageMesh);

const models={};let activeModel=null,frame=0,angle=0,scaleIndex=1;
let proof=null;
const scales=Object.freeze([.8,1,1.2]);
const shaModel={female:required.female,male:required.male};
function render(){
 const rad=angle*Math.PI/180;
 const targetY=1.06;camera.position.set(Math.sin(rad)*3.7,targetY+.22,
  Math.cos(rad)*3.7);camera.lookAt(0,targetY,0);
 renderer.render(scene,camera);frame++;
 if(renderer.getContext().getError()!==0)throw Error('genuine-GPU-error');
 canvas.dataset.frames=String(frame);
}
async function loadRealModel(kind){
 invariant(['female','male'].includes(kind),'not-original-licensed-rig-kind');
 if(models[kind])return models[kind];
 const response=await fetch('/immutable-rig/'+kind+'-cc0-rigged.glb',{cache:'no-store'});
 invariant(response.ok,'licensed-donor-original-GLB-missing');
 const original=new Uint8Array(await response.arrayBuffer());
 invariant(original.length>150000,'actual-licensed-original-body-file-too-small');
 const rigSHA=await sha(original);
 invariant(rigSHA===shaModel[kind],'actual-CC0-model-SHA-not-attested');
 const parsed=await new GLTFLoader().parseAsync(
  original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength),
  '/immutable-rig/'
 );
 const root=parsed.scene,originalBox=new THREE.Box3().setFromObject(root),
  size=originalBox.getSize(new THREE.Vector3());
 invariant(Number.isFinite(size.y)&&size.y>.6&&size.y<3.5,
  'true-anatomical-male-female-source-height-unverifiable');
 // Identical research normalization convention to native P89; not a
 // real owner body-height measurement or anthropometric mapping.
 const normal=2/size.y;
 root.scale.multiplyScalar(normal);
 root.position.set(-originalBox.getCenter(new THREE.Vector3()).x*normal,
  -originalBox.min.y*normal,-originalBox.getCenter(new THREE.Vector3()).z*normal);
 root.updateMatrixWorld(true);
 let count=0,boneCount=0,totalOriginalTriangles=0;
 const snapshots=[];
 root.traverse(obj=>{
  if(!obj.isSkinnedMesh)return;
  invariant(obj.skeleton?.bones?.length===163,
   'original-licensed-body-not-exact-163-bone-rig');
  count++;boneCount=obj.skeleton.bones.length;
  const arr=obj.geometry.attributes.position?.array;
  invariant(arr?.length>=9&&arr.length%3===0,
   'original-163bone-skinned-part-vertices-missing');
  snapshots.push({mesh:obj,positions:Array.from(arr),
   weights:Array.from(obj.geometry.attributes.skinWeight.array),
   indices:Array.from(obj.geometry.attributes.skinIndex.array)});
  totalOriginalTriangles+=obj.geometry.index?obj.geometry.index.count/3:
   arr.length/9;
 });
 invariant(count>0&&totalOriginalTriangles>5000,'true-original-body-triangles-missing');
 const record={root,kind,sha256:rigSHA,bodyMeshCount:count,bones:boneCount,
  sourceOriginalTriangleCount:totalOriginalTriangles,snapshots};
 models[kind]=record;return record;
}
function assertModelUnchanged(model){
 for(const x of model.snapshots){
  invariant(x.mesh.geometry.attributes.position.array.every((v,i)=>v===x.positions[i]),
   'anatomical-source-positions-mutated');
  invariant(x.mesh.geometry.attributes.skinWeight.array.every((v,i)=>v===x.weights[i]),
   'original-163bone-weights-mutated');
  invariant(x.mesh.geometry.attributes.skinIndex.array.every((v,i)=>v===x.indices[i]),
   'original-source-bone-indices-mutated');
 }
 return true;
}
async function select(kind,index=1,rotation=0){
 // A trial skeleton must not outlive its exact original CC0 avatar, body
 // pose or source admission. Never leave borrowed skeleton materials behind.
 clearSourceSkinResearchTrial();
 invariant(['female','male'].includes(kind),'unsupported-avatar');
 invariant(Number.isSafeInteger(index)&&index>=0&&index<scales.length,
  'unlicensed-original-photo-to-body-registration-scale');
 invariant([0,65,180].includes(rotation),'unverified-original-provisional-camera-sample');
 const model=await loadRealModel(kind);
 if(activeModel)scene.remove(activeModel.root);
 activeModel=model;scene.add(model.root);
 // Normalize both real rig and original-source image-space independently.
 // The target width is arbitrary relative to the actual licensed source
 // anatomy. THREE visibly renders this provisional floating front plane;
 // the mapped actual clothes width and physical camera are UNOBSERVED.
 const box=new THREE.Box3().setFromObject(model.root),
  rigSize=box.getSize(new THREE.Vector3());
 const trialScale=(rigSize.x*.64/photoWidth)*scales[index];
 invariant(trialScale>.1&&trialScale<3,'impossible-source-image-registration');
 imageMesh.scale.setScalar(trialScale);
 imageMesh.position.set(0,box.min.y+rigSize.y*.54,box.max.z+.035);
 // This is intentionally FRONT-SPACED from anatomy, not placed on skin.
 // Its float-front location cannot count as body contact or fit evidence.
 imageMesh.updateMatrixWorld(true);
 angle=rotation;scaleIndex=index;
 bodyModelName.textContent=kind;
 trialLabel.textContent=String(scales[index]);
 poseLabel.textContent=String(angle);
 render();
 assertModelUnchanged(model);
 const garmentBox=new THREE.Box3().setFromObject(imageMesh),
  bodyBBox=new THREE.Box3().setFromObject(model.root);
 const witness={
  schema:'M2-P89-real-original-163bone-photo-to-anatomy-placement-trial/v1',
  originalMuseumImageId:2551406,verifiedFrontCaption:'a) front',
  imageSHA256:payload.originalJPEGByteSHA256,
  independentlyVerifiedFullDecodedRGBSHA256:required.sourceRGB,
  sourceOriginalMaskPNG_SHA256:required.conservativeMaskPNG,
  sourceOriginalRGBTextureSHA256:required.sourceTextureRGBA,
  actualLicensedRig:kind,actualOriginalGLBSHA256:model.sha256,
  trueOriginalAnatomicalBoneCount:model.bones,
  trueOriginalAnatomicalBodySkinnedMeshes:model.bodyMeshCount,
  actualOriginalBodyTriangles:model.sourceOriginalTriangleCount,
  originalGeometrySourceUnmodified:true,
  sourcePhotoOriginalRGBAndUVUnmodified:true,
  avatarWidthFromOriginalRigNormalized:rigSize.x,
  originalSourceMaskWidthImageSpace:photoWidth,
  trialScaleFactor:scales[index],trialIndependentUncalibratedScale:trialScale,
  apparentRigAABBCenter:[...bodyBBox.getCenter(new THREE.Vector3())],
  apparentSourceAABBCenter:[...garmentBox.getCenter(new THREE.Vector3())],
  eyeAngleDegrees:angle,renderFrames:frame,
  originalPublicPhotoAndRealBodyActuallyRendered:true,
  actualRigPhotoGarmentBinding:false,
  mannequinSkeletonGeometryUnchanged:true,
  staticUnskinnedPhotoShell:true,
  noCameraMetricCalibration:true,noGarmentPhysicalSizeKnown:true,
  noSourceMatchedWearer:true,noSourceBackPhotograph:true,
  noOriginalExpertMaskApproval:true,
  noBodyClothBVHIntersectionsProved:true,
  noSweptContactOrDrapeProved:true,
  originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 proof=witness;
 status.textContent=kind+' authentic CC0 163-bone anatomy + genuine museum photograph shell; '+
   'scale '+scales[index]+' ONLY as UNCALIBRATED research display; NOT FITTED.';
 return witness;
}
/*
 * M2 true-original photo FRONT → genuine 163-bone skeleton motion study.
 *
 * The source mesh is constructed as an ACTUAL THREE.SkinnedMesh bound to
 * the SHA-attested original body's skeleton; two REAL documented MakeHuman
 * spine bones (spine03/spine04) receive explicitly PROVISIONAL
 * bone-segment-projected smooth weights tied to the real rest-pose joints.
 * These are NOT source-observed physical weights or measured cloth contact,
 * garment body dimensions, rear drape, owner approval or consumer clothing.
 *
 * Original photograph RGBA / UV / mask / raw source POSITION buffers remain
 * unchanged. Only an independent research geometry COPY is mapped into the
 * original body's native bone space. Real original GLB bone poses are
 * reversibly applied; screenshots prove genuine bone-linked deformation.
 */
let sourceSkinResearch=null;
const round6=n=>Math.round(n*1000000)/1000000;
function clearSourceSkinResearchTrial(){
 const x=sourceSkinResearch;
 if(!x)return;
 x.posedBone.quaternion.copy(x.originalPose);
 x.model.root.updateMatrixWorld(true);
 x.body.skeleton.update();
 x.mesh.removeFromParent();
 x.mesh.geometry.dispose();
 sourceSkinResearch=null;
 if(!imageMesh.parent)scene.add(imageMesh);
}
const actualSkinnedPhotoPoint=(x,index)=>{
 x.model.root.updateMatrixWorld(true);
 x.body.skeleton.update();
 x.mesh.updateWorldMatrix(true,false);
 const p=x.mesh.applyBoneTransform(index,new THREE.Vector3());
 return p.applyMatrix4(x.mesh.matrixWorld);
};
// Rebuild a bounded sample of actual original *skinned body triangles* in each
// genuine pose. Closest-point distances are UNSIGNED and sampled, not proof
// of no penetration, physical clearance, continuous collision, or cloth fit.
function sampleOriginalBodyTriangleSurfaceGap(x){
 x.model.root.updateMatrixWorld(true);
 x.body.skeleton.update();
 x.body.updateWorldMatrix(true,false);
 const bodyGeo=x.body.geometry,bodyIndices=bodyGeo.getIndex(),
  nTriangles=Math.floor((bodyIndices?bodyIndices.count:
   bodyGeo.getAttribute('position').count)/3);
 invariant(nTriangles>=128,'original-body-surface-triangles-unavailable');
 const nBody=Math.min(1536,nTriangles),nPhoto=Math.min(24,x.sourceFrontN);
 invariant(nPhoto>=3,'original-source-front-vertices-unavailable');
 const triangles=[];
 for(let j=0;j<nBody;j++){
  const face=Math.floor((j+.5)*nTriangles/nBody),offset=face*3;
  const vi=k=>bodyIndices?bodyIndices.getX(offset+k):offset+k;
  const p=k=>x.body.applyBoneTransform(vi(k),new THREE.Vector3())
   .applyMatrix4(x.body.matrixWorld);
  triangles.push(new THREE.Triangle(p(0),p(1),p(2)));
 }
 const target=new THREE.Vector3(),gaps=[];
 for(let i=0;i<nPhoto;i++){
  const index=Math.floor((i+.5)*x.sourceFrontN/nPhoto);
  const sourcePoint=actualSkinnedPhotoPoint(x,index);
  let min2=Infinity;
  for(const triangle of triangles){
   const closest=triangle.closestPointToPoint(sourcePoint,target);
   const distance2=sourcePoint.distanceToSquared(closest);
   if(distance2<min2)min2=distance2;
  }
  invariant(Number.isFinite(min2)&&min2>=0,
   'actual-source-to-original-triangle-sample-invalid');
  gaps.push(Math.sqrt(min2));
 }
 gaps.sort((a,b)=>a-b);
 return {
  actualPoseDeformedBodySurfaceTrianglesSampled:nBody,
  actualPoseDeformedSourceFrontVerticesSampled:nPhoto,
  minimumUnsignedSampledBodyClothGapRigUnits:round6(gaps[0]),
  medianUnsignedSampledBodyClothGapRigUnits:
   round6((gaps[Math.floor((gaps.length-1)/2)]+
    gaps[Math.floor(gaps.length/2)])/2),
  nearSurfaceSampleCountAt005RigUnits:
   gaps.filter(distance=>distance<=.05).length,
  measuredUnsignedSampledTriangleSurfaceProximity:true,
  fullIndexedTriangleCoverage:false,
  signedInteriorOrTriangleIntersectionEstablished:false,
  physicalCollisionOrSweptClearanceEstablished:false
 };
}

/*
 * Strict, conservative edge-through-triangle detector: SIX finite directed
 * edges, both directions. A positive means sampled ORIGINAL FRONT triangle
 * and genuine posed BODY triangle intersect non-coplanarly. No positive does
 * NOT mean collision-free: coplanar overlap, touching, enclosed surfaces,
 * unsampled faces and between-pose trajectories remain UNKNOWN.
 *
 * In particular this is not a garment/body certified BVH collision solver.
 */
const crossingEPS=1e-8;
function strictSegmentIntoTriangle(a,b,p,q,r){
 const direction=b.clone().sub(a),edge1=q.clone().sub(p),
  edge2=r.clone().sub(p),cross=direction.clone().cross(edge2);
 const det=edge1.dot(cross);
 if(!Number.isFinite(det)||Math.abs(det)<crossingEPS)return false;
 const inv=1/det,s=a.clone().sub(p),u=s.dot(cross)*inv;
 if(!(u>crossingEPS&&u<1-crossingEPS))return false;
 const edgeNormal=s.clone().cross(edge1);
 const v=direction.dot(edgeNormal)*inv;
 if(!(v>crossingEPS&&u+v<1-crossingEPS))return false;
 const t=edge2.dot(edgeNormal)*inv;
 return Number.isFinite(t)&&t>crossingEPS&&t<1-crossingEPS;
}
function strictTwoTriangleCrossing(a,b){
 const edges=[[0,1],[1,2],[2,0]];
 return edges.some(([i,j])=>strictSegmentIntoTriangle(
   a[i],a[j],b[0],b[1],b[2]))||
  edges.some(([i,j])=>strictSegmentIntoTriangle(
   b[i],b[j],a[0],a[1],a[2]));
}
function controlledCrossingKernelProbe(){
 const v=(x,y,z)=>new THREE.Vector3(x,y,z);
 const a=[v(-1,-1,0),v(1,-1,0),v(0,1,0)];
 const crossing=[v(0,-.3,-1),v(0,.3,1),v(0,.3,-1)];
 const separated=crossing.map(p=>p.clone().add(v(4,0,0)));
 const coplanar=[v(-.5,-.5,0),v(.5,-.5,0),v(0,.5,0)];
 return {
  actualStrictCrossingDetected:strictTwoTriangleCrossing(a,crossing),
  separatedTriangleRejected:!strictTwoTriangleCrossing(a,separated),
  coplanarClaimExplicitlyUnresolved:!strictTwoTriangleCrossing(a,coplanar),
  syntheticControlOnlyNotGenuineBodyCollisionEvidence:true
 };
}
function sampledOriginalFrontBodyFaceCrossings(x){
 x.model.root.updateMatrixWorld(true);x.body.skeleton.update();
 x.body.updateWorldMatrix(true,false);x.mesh.updateWorldMatrix(true,false);
 const controls=controlledCrossingKernelProbe();
 invariant(controls.actualStrictCrossingDetected&&
  controls.separatedTriangleRejected&&
  controls.coplanarClaimExplicitlyUnresolved,
  'sampled-original-body-face-crossing-kernel-contradicted-by-controls');
 const originalBody=x.body.geometry,bodyIndex=originalBody.getIndex(),
  originalBodyFaceCount=Math.floor((bodyIndex?bodyIndex.count:
   originalBody.getAttribute('position').count)/3);
 const frontStart=range.sourcePhotoFront.start,
  frontCount=range.sourcePhotoFront.count,
  photoFrontFaceCount=frontCount/3;
 invariant(Number.isSafeInteger(photoFrontFaceCount)&&photoFrontFaceCount>=32&&
  frontStart===0&&frontCount<=faces.length,
  'authentic-original-photo-front-index-range-invalid');
 invariant(originalBodyFaceCount>=128,'original-body-face-index-range-invalid');
 const nBody=Math.min(2048,originalBodyFaceCount),
  nFront=Math.min(192,photoFrontFaceCount);
 const bodyFaces=[];
 for(let j=0;j<nBody;j++){
  const index=Math.floor((j+.5)*originalBodyFaceCount/nBody),offset=3*index;
  const vi=k=>bodyIndex?bodyIndex.getX(offset+k):offset+k;
  const triangle=[0,1,2].map(k=>x.body.applyBoneTransform(
   vi(k),new THREE.Vector3()).applyMatrix4(x.body.matrixWorld));
  invariant(triangle.every(p=>p.toArray().every(Number.isFinite)),
   'actual-posed-body-triangle-nonfinite');
  bodyFaces.push({triangle,box:new THREE.Box3().setFromPoints(triangle)});
 }
 let bboxCandidates=0,strictCrossings=0;
 for(let j=0;j<nFront;j++){
  const index=Math.floor((j+.5)*photoFrontFaceCount/nFront),
   offset=frontStart+3*index;
  const triangle=[0,1,2].map(k=>{
   const originalVertex=faces[offset+k];
   invariant(originalVertex<x.sourceFrontN,
    'unverified-original-photo-front-vertex-index');
   return actualSkinnedPhotoPoint(x,originalVertex);
  });
  invariant(triangle.every(p=>p.toArray().every(Number.isFinite)),
   'actual-original-front-posed-triangle-nonfinite');
  const box=new THREE.Box3().setFromPoints(triangle);
  for(const b of bodyFaces){
   if(!box.intersectsBox(b.box))continue;
   bboxCandidates++;
   if(strictTwoTriangleCrossing(triangle,b.triangle))strictCrossings++;
  }
 }
 return {
  trueLicensedBodyRig:x.kind,
  originalPublicPhotoFrontOnly:true,
  actualOriginalBodyFacesSampled:nBody,
  actualOriginalFrontFacesSampled:nFront,
  overlappingFaceAxisAlignedBoundsPairs:bboxCandidates,
  strictPositiveNonCoplanarFaceCrossingPairs:strictCrossings,
  controlledCrossingKernelPositiveAndNegativePassed:true,
  countOnlyDiscreteSampledFaces:true,
  coplanarTouchingEnclosedAndUnsampledUnknown:true,
  physicallyCalibratedBodyGarmentSize:false,
  fullBodyClothIntersectionCoverage:false,
  continuousSweptClothContactEstablished:false,
  collisionFreeFitProved:false,
  consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,
  familyAlpha:'HOLD'
 };
}
function sampleFiveAuthenticSpinePoseCrossings(){
 const x=sourceSkinResearch;
 invariant(x?.mesh?.isSkinnedMesh&&x.mesh.skeleton===x.body.skeleton,
  'no-source-bound-real-body-discrete-pose-trial');
 const originalCurrent=x.posedBone.quaternion.clone();
 const degrees=[-12,-6,0,6,12];
 try{
  const samples=degrees.map(degrees=>{
   x.posedBone.quaternion.copy(x.originalPose);
   x.posedBone.rotateZ(degrees*Math.PI/180);
   return {degrees,actualPosePhotoFrontBodyCrossings:
    sampledOriginalFrontBodyFaceCrossings(x),
    everyIndexedBodyComponentAndSourceFrontContact:
    fullActualSkinnedIndexedSourceContact(x)};
  });
  return {samples,actualOriginalLicensed163BoneRig:x.kind,
   physicalCalibrationEvidence:actualPhysicalCalibrationLedger(x),
   fullOriginalBodyAndPhotoFrontFacesIndexedForFailClosedContactGate:true,
   noCollisionClaimWithoutCompleteFacePairAudit:true,
   discretePosesOnly:true,continuousCollisionSafetyUnproved:true,
   arbitraryImageToAnatomyRegistration:true,consumer3DAdmitted:false,
   familyAlpha:'HOLD'};
 }finally{
  x.posedBone.quaternion.copy(originalCurrent);
  x.model.root.updateMatrixWorld(true);x.body.skeleton.update();
 }
}


/*
 * This exact image has NO physical ruler, camera intrinsic/extrinsic measurements,
 * observed reverse, wearer-matched body or human-approved cloth boundary.
 * Normalized original licensed rig dimensions are *not* centimeters.
 * Do not infer a one-photo reconstruction scale from a guessed body height.
 */
function actualPhysicalCalibrationLedger(x){
 const rig=new THREE.Box3().setFromObject(x.model.root);
 const rigWidth=rig.getSize(new THREE.Vector3()).x;
 const normalizedPhotoFrontWidth=photoWidth;
 return {
  verifiedMuseumPhotoImageId:2551406,
  originalImageSizePixels:[192,149],
  sourceOriginalRGBSHA256:required.sourceRGB,
  sourceOriginalMaskSHA256:required.conservativeMaskPNG,
  trueLicensedRig:x.kind,originalLicensedRigSHA256:x.model.sha256,
  normalizedOriginalRigWidthUnits:round6(rigWidth),
  originalImageSilhouetteWidthUncalibratedUnits:round6(normalizedPhotoFrontWidth),
  threeArbitraryDisplayWidthRatios:[.8,1,1.2].map(s=>
   round6(.64*s)),
  originalCameraFocalLengthPixels:null,originalCameraDistanceCM:null,
  independentlyMeasuredGarmentWidthCM:null,independentlyMeasuredGarmentHeightCM:null,
  independentlyMeasuredWearerChestCM:null,independentlyMeasuredWearerHeightCM:null,
  approvedExactFrontSilhouetteMask:false,
  authenticatedCalibrationEvidenceAvailable:false,
  observedOriginalReversePhotograph:false,
  validPhysicalGarmentCalibration:false,
  physicalScaleUnits:'UNKNOWN',
  requiresIndependentPhysicalMeasurementAndCameraEvidence:true,
  requiresHumanMaskApproval:true,
  consumer3DAdmitted:false,sourceOriginalPhoto2DFallbackRequired:true,
  familyAlpha:'HOLD'
 };
}
function fullActualSkinnedIndexedSourceContact(x){
 x.model.root.updateMatrixWorld(true);
 x.mesh.skeleton.update();
 x.mesh.updateWorldMatrix(true,false);
 const posedTriangleArray=(m,indices,start,count)=>{
  m.updateWorldMatrix(true,false);m.skeleton.update();
  const original=m.geometry.getAttribute('position'),
   idx=indices||m.geometry.getIndex(),
   max=idx?idx.count:original.count;
  invariant(Number.isSafeInteger(start)&&Number.isSafeInteger(count)&&
   start>=0&&count>=3&&count%3===0&&start+count<=max,
   'complete-original-indexed-scope-invalid');
  const cache=new Array(original.count),pick=i=>{
   invariant(Number.isSafeInteger(i)&&i>=0&&i<original.count,
    'original-indexed-face-vertex-out-of-bounds');
   if(!cache[i]){
    const p=m.applyBoneTransform(i,new THREE.Vector3())
     .applyMatrix4(m.matrixWorld);
    invariant(p.toArray().every(Number.isFinite),
     'original-skinned-full-surface-has-nonfinite-vertex');
    cache[i]=p.toArray();
   }
   return cache[i];
  };
  const out=[];
  for(let i=start;i<start+count;i+=3){
   const pos=k=>idx?idx.getX(i+k):i+k;
   out.push([pick(pos(0)),pick(pos(1)),pick(pos(2))]);
  }
  return out;
 };
 const bodyFaces=[],bodyMeshCoverage=[];
 for(const record of x.model.snapshots){
  const mesh=record.mesh;
  invariant(mesh.isSkinnedMesh&&mesh.skeleton.bones.length===163,
   'original-real-anatomy-submesh-authentic-skin-required');
  const indices=mesh.geometry.getIndex(),
   count=indices?indices.count:mesh.geometry.getAttribute('position').count;
  const tris=posedTriangleArray(mesh,indices,0,count);
  bodyFaces.push(...tris);
  bodyMeshCoverage.push({originalMeshName:mesh.name||null,
   actualIndexedTrianglesAudited:tris.length});
 }
 const indexed=new THREE.BufferAttribute(faces,1);
 const allPhotoFront=posedTriangleArray(x.mesh,indexed,
  range.sourcePhotoFront.start,range.sourcePhotoFront.count);
 const result=evaluateFullIndexedContact(bodyFaces,allPhotoFront,{
  stopAtFirstVerifiedContact:true,reportResourceBlockerInsteadOfThrow:true});
 invariant(result.originalBodyIndexedFacesAudited===
  bodyMeshCoverage.reduce((sum,x)=>sum+x.actualIndexedTrianglesAudited,0)&&
  result.originalPhotoFrontIndexedFacesAudited===range.sourcePhotoFront.count/3&&
  result.allOriginalBodyIndexedFacesPresentInBVH===true&&
  (result.fullOriginalIndexedScopeEvaluated===true||
   (result.definitiveCollisionRejection===true&&
    result.pairEnumerationStoppedAfterRealContact===true)||
   (result.resourceBoundReached===true&&
    result.contactDecision==='BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_AUDIT'&&
    result.consumer3DAdmitted===false)),
  'full-original-indexed-collision-gate-has-neither-complete-negative-audit-nor-positive-rejection');
 return {
  ...result,originalBodySkinnedMeshComponentsAudited:bodyMeshCoverage.length,
  originalBodyComponentTriangleCounts:bodyMeshCoverage.map(x=>x.actualIndexedTrianglesAudited),
  originalPhotoSourceJPEGByteSHA256:payload.originalJPEGByteSHA256,
  sourceOriginalRGBSHA256:required.sourceRGB,
  actualRigOriginalGLBSHA256:x.model.sha256,
  photoFrontOnly:true,neutralUnobservedRearNotCertifiable:true,
  actualPhysicallyCalibratedFit:false,
  humanApprovedMask:false,
  consumer3DAdmitted:false,sourceOriginalPhoto2DFallbackRequired:true,
  familyAlpha:'HOLD'
 };
}

function sourceSkinProvenanceUnchanged(){
 const a=geometry.getAttribute('position').array,
  u=geometry.getAttribute('uv').array;
 invariant(a.length===positions.length&&u.length===uvs.length,
  'actual original source photo vertex arrays changed size');
 for(let i=0;i<a.length;i++)if(a[i]!==positions[i])
  throw Error('original source photograph positions mutated');
 for(let i=0;i<u.length;i++)if(u[i]!==uvs[i])
  throw Error('original source photograph UV mutated');
 return true;
}
async function startSourceSkinnedMotionTrial(kind){
 await select(kind,1,0);
 const model=activeModel;
 const body=model.snapshots.map(x=>x.mesh).sort((a,b)=>
  b.geometry.getAttribute('position').count-a.geometry.getAttribute('position').count)[0];
 invariant(body?.isSkinnedMesh&&body.skeleton.bones.length===163,
  'actual licensed original 163bone skinned body required');
 const names=body.skeleton.bones.map(x=>x.name.replaceAll('.',''));
 const lower=names.indexOf('spine03'),upper=names.indexOf('spine04');
 invariant(lower>=0&&upper>=0&&upper!==lower,
  'original licensed 163bone spine03 and spine04 both required');
 const lowerBone=body.skeleton.bones[lower],
  upperBone=body.skeleton.bones[upper];
 invariant(lowerBone.isBone&&upperBone.isBone,
  'actual skeletal named anatomical bones required');
 const originalPose=upperBone.quaternion.clone();
 imageMesh.updateWorldMatrix(true,false);
 body.updateWorldMatrix(true,false);
 const fromWorldToBody=body.matrixWorld.clone().invert();
 // Use independently real original spine joints rather than fabricated
 // image-space Y endpoints. These are still heuristic registration weights.
 const lowerJoint=lowerBone.getWorldPosition(new THREE.Vector3())
  .applyMatrix4(fromWorldToBody);
 const upperJoint=upperBone.getWorldPosition(new THREE.Vector3())
  .applyMatrix4(fromWorldToBody);
 const boneAxis=upperJoint.clone().sub(lowerJoint),boneSpan2=boneAxis.lengthSq();
 invariant(Number.isFinite(boneSpan2)&&boneSpan2>.000001,
  'actual-licensed-spine-bone-anchor-separation-unverifiable');
 const derived=geometry.clone();
 const attrs=derived.getAttribute('position');
 const pBody=new Float32Array(attrs.array.length),
  boneIndex=new Uint16Array(attrs.count*4),
  boneWeight=new Float32Array(attrs.count*4);
 invariant(photoBBox.max.y-photoBBox.min.y>.2,
  'true original source photo silhouette not observed');
 for(let i=0;i<attrs.count;i++){
  const original=new THREE.Vector3(
   positions[3*i],positions[3*i+1],positions[3*i+2]);
  const inBody=original.clone().applyMatrix4(imageMesh.matrixWorld)
   .applyMatrix4(fromWorldToBody);
  pBody.set(inBody.toArray(),3*i);
  // Provisional projection on the ACTUAL anatomical spine joint segment;
  // no inferred image-row joint locations or physically accepted skinning.
  const projection=inBody.clone().sub(lowerJoint).dot(boneAxis)/boneSpan2;
  invariant(Number.isFinite(projection),'unverifiable-source-bone-projection');
  const t=Math.max(0,Math.min(1,projection));
  const w=t*t*(3-2*t);
  boneIndex.set([upper,lower,0,0],i*4);
  boneWeight.set([w,1-w,0,0],i*4);
 }
 derived.setAttribute('position',new THREE.BufferAttribute(pBody,3));
 derived.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(boneIndex,4));
 derived.setAttribute('skinWeight',new THREE.Float32BufferAttribute(boneWeight,4));
 derived.computeBoundingBox();
 const mesh=new THREE.SkinnedMesh(derived,[photoMaterial,backMaterial,sideMaterial]);
 mesh.name='P89-ACTUAL-MET-ORIGINAL-163BONE-SKINNED-UNAPPROVED';
 mesh.renderOrder=2;mesh.frustumCulled=false;
 mesh.position.copy(body.position);mesh.quaternion.copy(body.quaternion);
 mesh.scale.copy(body.scale);
 body.parent.add(mesh);mesh.bind(body.skeleton,body.bindMatrix);
 invariant(mesh.skeleton===body.skeleton&&mesh.skeleton.bones.length===163,
  'true original dual 163bone skeleton binding not proven');
 scene.remove(imageMesh);
 const photoFrontN=positions.length/6;
 let first=0,last=0;
 for(let i=1;i<photoFrontN;i++){
  if(positions[i*3+1]<positions[first*3+1])first=i;
  if(positions[i*3+1]>positions[last*3+1])last=i;
 }
 const middle=Math.floor(photoFrontN/2);
 const x={model,body,mesh,lowerBone,posedBone:upperBone,
  lowerName:names[lower],upperName:names[upper],lowerIndex:lower,
  upperIndex:upper,originalPose,kind,sourceFrontN:photoFrontN,
  originalSpineSegmentLengthRigUnits:round6(Math.sqrt(boneSpan2)),
  provisionalWeightMethod:'actual-rest-spine03-spine04-segment-smooth-projection',
  samples:[first,middle,last],rest:[],lastPose:'rest'};
 sourceSkinResearch=x;
 try{
  model.root.updateMatrixWorld(true);body.skeleton.update();
  x.rest=x.samples.map(i=>actualSkinnedPhotoPoint(x,i));
  invariant(x.rest.every(p=>p.toArray().every(Number.isFinite)),
   'real-source-skinned-mesh-rest-witness-not-finite');
  sourceSkinProvenanceUnchanged();
  assertModelUnchanged(model);
  render();
  const witness={
   status:'REAL_163BONE_ORIGINAL_PHOTO_SOURCE_SKIN_DEFORMATION_RESEARCH_ONLY',
   avatar:kind,exactOriginalPublicGLBSHA256:model.sha256,
   actualOriginalBoneCount:body.skeleton.bones.length,
   realOriginalSkinReuse:mesh.skeleton===body.skeleton,
   actualTwoNamedSourceBones:[names[lower],names[upper]],
   sourceOriginalFullDecodedRGBSHA256:required.sourceRGB,
   sourceOriginalJPEGByteSHA256:payload.originalJPEGByteSHA256,
   sourceOriginalMaskPNG_SHA256:required.conservativeMaskPNG,
   sourceFrontRGBTextureSHA256:required.sourceTextureRGBA,
   originalPhotoVerticesUnmodified:true,originalPhotoUVUnmodified:true,
   originalBodySkinIndicesAndWeightsUnmodified:true,
   trueSourceFrontAndNeutralReverseMaterialGroups:3,
   actualTHREESkinnedMesh:true,provisionalBindWeights:true,
   provisionalActualBodyBoneAnchorWeights:true,
   genuineSpineSegmentLengthRigUnits:x.originalSpineSegmentLengthRigUnits,
   weightRule:x.provisionalWeightMethod,
   physicalSourceGarmentSizeUnmeasured:true,realCameraCalibrationMissing:true,
   noGenuineReversePhoto:true,noHumanApprovedMask:true,
   noClothDrapeOrContactSafetyClaim:true,
   ownerGarment3DNotAdmitted:true,consumer3DAdmitted:false,
   sourceOriginalPhoto2DFallbackRequired:true,releaseAuthorized:false,
   familyAlpha:'HOLD'
  };
  return witness;
 }catch(e){clearSourceSkinResearchTrial();throw e;}
}
function setSourceSkinnedMotionTrialPose(stage){
 invariant(['rest','bend'].includes(stage),'research-pose-unverified');
 const x=sourceSkinResearch;
 invariant(x?.mesh?.isSkinnedMesh&&x.body.skeleton===x.mesh.skeleton,
  'no-original-163bone-source-skinned-mesh');
 // Real named spine04 joint is intentionally used to exhibit deformation
 // with authored 12-degree research pose; neither physically calibrated
 // nor accepted as a normal animation/garment clearance test.
 x.posedBone.quaternion.copy(x.originalPose);
 if(stage==='bend')x.posedBone.rotateZ(12*Math.PI/180);
 x.model.root.updateMatrixWorld(true);
 x.body.skeleton.update();
 const now=x.samples.map(i=>actualSkinnedPhotoPoint(x,i));
 const deltas=now.map((p,i)=>p.distanceTo(x.rest[i]));
 const actualBodySurfaceGap=sampleOriginalBodyTriangleSurfaceGap(x);
 const actualFaceCrossings=sampledOriginalFrontBodyFaceCrossings(x);
 sourceSkinProvenanceUnchanged();assertModelUnchanged(x.model);
 angle=0;render();x.lastPose=stage;
 return {
  stage,actualNamedOriginalJoint:x.upperName,
  trueSkeletonBoneCount:x.mesh.skeleton.bones.length,
  actualOriginalJointPoseChanged:stage==='bend',
  actualSourceSkinnedPhotoMesh:true,
  originalSourcePositionAndUVStillImmutable:true,
  threeOriginalPhotoVertexDisplacements:deltas.map(round6),
  maximumMeasuredOriginalPhotoSourceVertexDisplacement:round6(Math.max(...deltas)),
  originalRigBodySurfaceGapResearchOnly:actualBodySurfaceGap,
  originalRigPhotoFrontBodyFaceCrossingResearchOnly:actualFaceCrossings,
  actualMeasuredBodyClothIntersection:false,
  physicalContactOrDrapeCleared:false,
  owner3DApproved:false,consumer3DAdmitted:false,
  sourceOriginalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
 };
}
window.__M2RealRigPhotoTrial={
 select,startSourceSkinnedMotionTrial,setSourceSkinnedMotionTrialPose,
 getControlledTriangleCrossingKernelProof:controlledCrossingKernelProbe,
 getFullContactControlProof:controlledFullContactFixtures,
 sampleFiveAuthenticSpinePoseCrossings,
 getProof:()=>proof,
 getFlags:()=>({
  ready:!!proof,rig:proof?.actualLicensedRig||null,
  consumer3DAdmitted:false,releaseAuthorized:false,
  originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
 })
};
await select('female',1,0);
