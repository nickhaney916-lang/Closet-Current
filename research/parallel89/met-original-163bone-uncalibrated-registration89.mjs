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
  invariant(arr?.length>3000,'original-163bone-body-vertices-missing');
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
window.__M2RealRigPhotoTrial={
 select,getProof:()=>proof,
 getFlags:()=>({
  ready:!!proof,rig:proof?.actualLicensedRig||null,
  consumer3DAdmitted:false,releaseAuthorized:false,
  originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
 })
};
await select('female',1,0);
