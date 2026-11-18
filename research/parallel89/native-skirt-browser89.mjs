/**
 * P89 localhost-only NATIVE WebGL original skirt + REAL public anatomical
 * male/female 163-bone CC0 GLBs. The Commons-0043 source JPEG and immutable
 * Work47 REVIEW cutout are byte-hashed IN THE BROWSER before any cloth mesh.
 * Genuine P84 read-only original triangle BVH strict crossing witness only:
 * no containment, swept cloth motion, fit, photo realism, or owner approval.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {setResearchPose} from '/donor/research/three-d-43/intermediate-pose.mjs';
import {SKIRT_SOURCE89,attestActualSkirt89,sourceSkirtOutline89,
 buildOriginalPhotoSkirtProposal89} from './skirt-source3d89.mjs';
import {posedSource84} from '/p84/research/parallel84-real-photo-layers/source-bone-yoke-trial84.mjs';
import {countStableOriginalBodyContacts89} from './skirt-stable-source-contacts89.mjs';
import {compareActualNeutralSkirtRear89} from './skirt-neutral-contact-trial89.mjs';
import {compareActualMeasuredSkirtFit89} from './skirt-body-measured-fit89.mjs';
import {compareActualOriginalPhotoSkirtRegistration89} from './skirt-rigid-registration89.mjs';
import {auditOriginalSkirtWaistBoneAttachment89} from './skirt-waist-bone-landmarks89.mjs';
import {auditSelectedOriginalSkirtRadialGap89} from './skirt-source-radial-gap89.mjs';
import {auditActualOriginalBodyClosure89} from './skirt-source-body-manifold89.mjs';
import {auditRealOriginalBodySeams89} from './skirt-source-indexed-seam89.mjs';
import {auditActualOriginalBodyBoundaryRegions89} from './skirt-original-source-boundary-regions89.mjs';
import {auditActualOriginalSkirtCoreSpan89} from './skirt-original-core-span89.mjs';
import {auditOriginalSkirtCoreRayUnknownCauses89} from './skirt-original-core-unknown-causes89.mjs';
import {auditOriginalSkirtCoreBoneNamesAndNoHits89} from './skirt-original-core-nohit-source-bones89.mjs';
import {auditOriginalCoreWeightSensitivity89} from './skirt-original-core-skin-weight-sensitivity89.mjs';
import {auditActualOriginalCoreNoHitGeometry89} from './skirt-original-core-nohit-geometry89.mjs';
import {auditActualOriginalContourConnectivity89} from './skirt-original-core-contour-connectivity89.mjs';
import {auditSourceContourEndpointProvenance89} from './skirt-original-contour-endpoint-provenance89.mjs';
import {auditOriginalSkirtPhysicalRegistration89} from './skirt-physical-registration89.mjs';
if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
 throw Error('Original skirt research is localhost-only');
const MODELS=Object.freeze({
 female:Object.freeze({sha:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
  file:'female-cc0-rigged.glb'}),
 male:Object.freeze({sha:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8',
  file:'male-cc0-rigged.glb'})
});
const canvas=document.getElementById('avatar'),status=document.getElementById('status');
const renderer=new THREE.WebGLRenderer({canvas,preserveDrawingBuffer:true,antialias:true,alpha:false,
 powerPreference:'low-power'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.setClearColor(0xf4f3ef);
renderer.setPixelRatio(1);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xf4f3ef);
const camera=new THREE.PerspectiveCamera(34,390/690,.03,50);
scene.add(new THREE.HemisphereLight(0xffffff,0xc0cad0,1.6));
const lamp=new THREE.DirectionalLight(0xfff3e8,2.8);lamp.position.set(-2,4,4);scene.add(lamp);
const rim=new THREE.DirectionalLight(0xd6e9ff,1.3);rim.position.set(3,2,-3);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CircleGeometry(1.2,48),
 new THREE.MeshBasicMaterial({color:0xe4e7e2,side:THREE.DoubleSide}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.018;scene.add(floor);
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
 n=>n.toString(16).padStart(2,'0')).join('');
let source=null,outline=null,image=null,root=null,candidate=null,current=null,bodies=[],
 sourceBodies=[],contacts=[],pose='source',angle=0,frames=0,errors=[],networkDenied=[],
 phase='loading',lastContact=null,shapeMeasured=null,lastRenderMs=0,rigid45Preview=null,
 selectedPreview=null,lastRegistration=null;
const check=(bool,why)=>{if(!bool)throw Error(why);};
const read=async url=>{
 const r=await fetch(url,{cache:'no-store'});
 if(!r.ok)throw Error('missing licensed source asset: '+url);
 return new Uint8Array(await r.arrayBuffer());
};
const rgb=async cutout=>{
 const bitmap=await createImageBitmap(new Blob([cutout],{type:'image/png'}),
  {premultiplyAlpha:'none',colorSpaceConversion:'none'});
 const w=bitmap.width,h=bitmap.height;
 check(w>=64&&h>=64&&w*h<=9_000_000,'skirt mask image dimensions invalid');
 const full=document.createElement('canvas');full.width=w;full.height=h;
 const ctx=full.getContext('2d',{willReadFrequently:true});
 check(!!ctx,'original RGBA canvas unavailable');ctx.clearRect(0,0,w,h);
 ctx.drawImage(bitmap,0,0);const data=ctx.getImageData(0,0,w,h);
 const factor=Math.min(240/w,240/h),sw=Math.max(12,Math.round(w*factor)),
  sh=Math.max(12,Math.round(h*factor));
 const sampled=document.createElement('canvas');sampled.width=sw;sampled.height=sh;
 const sampling=sampled.getContext('2d',{willReadFrequently:true});
 sampling.clearRect(0,0,sw,sh);sampling.drawImage(bitmap,0,0,sw,sh);
 const scaled=sampling.getImageData(0,0,sw,sh).data;
 const alpha=new Uint8Array(sw*sh);
 for(let i=0;i<alpha.length;i++)alpha[i]=scaled[i*4+3];
 bitmap.close();
 return {full:{data:new Uint8Array(data.data),width:w,height:h},
  sampled:{alpha,width:sw,height:sh}};
};
async function verifySource(){
 const [jpeg,cutout,locks,manifest]=await Promise.all([
  read('/benchmark/fixtures/commons-0043.jpg'),
  read('/donor/benchmark/work47/assets/commons-0043.png'),
  fetch('/benchmark/locked-photo-sources.json',{cache:'no-store'}).then(r=>{check(r.ok,'missing lock registry');return r.json()}),
  fetch('/donor/benchmark/work47/manifest.json',{cache:'no-store'}).then(r=>{check(r.ok,'missing source mask registry');return r.json()})
 ]);
 const work47=manifest.rows.find(r=>r.id==='commons-0043'),
  lock=locks.find(r=>r.id==='commons-0043');
 const receipt=await attestActualSkirt89({originalBytes:jpeg,cutoutBytes:cutout,lock,work47});
 check(receipt.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED',
  'genuine source skirt REVIEW cutout must be verified first: '+receipt.reason);
 check(await sha(jpeg)===SKIRT_SOURCE89.originalSHA256&&await sha(cutout)===work47.cutoutSHA256,
  'original licensed image digests failed');
 const decoded=await rgb(cutout);
 const rows=sourceSkirtOutline89(decoded.sampled);
 check(rows.sourceHemToWaistWidthRatio>1&&rows.sourceRowWidths.length===7,
  'original photographed silhouette source mask is missing');
 image=decoded.full;outline=rows;source=receipt;
 return {id:receipt.sourceId,originalSHA256:receipt.originalSHA256,cutoutSHA256:receipt.cutoutSHA256,
  cutoutHumanApproved:false,sourceMaskDecision:work47.decision,
  sourcePhotoNotDress:true,actualOriginalBytesVerified:true};
}
const originalBodyPositions=()=>{
 for(const [mesh,old] of sourceBodies){
  const a=mesh.geometry.attributes.position.array;
  if(a.length!==old.length||a.some((v,i)=>!Object.is(v,old[i])))
   throw Error('original anatomical position buffer changed');
 }
 return true;
};
function render(){
 const width=390,height=690;
 renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 const rad=angle*Math.PI/180;camera.position.set(Math.sin(rad)*3.7,1.13,Math.cos(rad)*3.7);
 camera.lookAt(0,1.04,0);
 const started=performance.now();renderer.render(scene,camera);
 lastRenderMs=performance.now()-started;frames++;
 canvas.dataset.frames=String(frames);
}
/**
 * The following preview is deliberately NON-CONSUMER and scoped to native
 * localhost research. It only moves the original PHOTO skirt in body-local Z
 * by +45mm to obtain genuine 2D pixel comparisons across camera angles.
 *
 * It is not a proposed fit: independent cloth back/drape, source dimensions,
 * waist attachment, containment, physical phones and human visual quality
 * are unverified. All original source garment positions, UV and skeletons
 * are restored when the trial ends or an avatar unloads.
 */
function showOnlySourceRigidRegistration45(active,{draw=true}={}){
 check(phase==='ready'&&candidate?.mesh?.isSkinnedMesh,
  'original authenticated source skirt required for research preview');
 if(active){
  check(!rigid45Preview&&!selectedPreview,'one unpublished research photo-skirt preview at a time');
  const original=candidate.mesh.geometry,
   positions=original?.getAttribute('position'),
   uv=original?.getAttribute('uv'),rest=original?.getAttribute('sourceSkirt89Rest');
  check(positions?.count===343&&uv?.count===343&&rest?.count===343&&
   original.index?.count===1728,'original source skirt topology wrong');
  const snapshot=positions.array.slice(),uvSnapshot=uv.array.slice(),
   originalRest=rest.array.slice(),sourceGeometry=original;
  let copy=null;
  try{
   copy=original.clone();const translated=copy.getAttribute('position');
   for(let i=0;i<translated.count;i++){
    translated.setXYZ(i,positions.getX(i),positions.getY(i),positions.getZ(i)+.045);
   }
   translated.needsUpdate=true;
   copy.computeVertexNormals();copy.computeBoundingSphere();copy.computeBoundingBox();
   check(copy.getAttribute('uv').array.every((v,i)=>Object.is(v,uvSnapshot[i]))&&
    copy.getAttribute('sourceSkirt89Rest').array.every((v,i)=>
     Object.is(v,originalRest[i])),'source photo UV/rest buffer preview mutation');
   candidate.mesh.geometry=copy;
   rigid45Preview={sourceGeometry,copy,snapshot,uvSnapshot,originalRest};
  }catch(e){
   candidate.mesh.geometry=sourceGeometry;
   copy?.dispose();throw e;
  }
 }else if(rigid45Preview){
  const previous=rigid45Preview;rigid45Preview=null;
  candidate.mesh.geometry=previous.sourceGeometry;
  previous.copy.dispose();
  check(previous.sourceGeometry.getAttribute('position').array.every((v,i)=>
   Object.is(v,previous.snapshot[i]))&&
   previous.sourceGeometry.getAttribute('uv').array.every((v,i)=>
    Object.is(v,previous.uvSnapshot[i]))&&
   previous.sourceGeometry.getAttribute('sourceSkirt89Rest').array.every((v,i)=>
    Object.is(v,previous.originalRest[i])),
   'original public photographed skirt source buffers not restored');
 }
 if(draw)render();
 return Object.freeze({
  status:active?'ORIGINAL_PHOTO_RIGID_45MM_STATIC_RESEARCH_PREVIEW_ONLY':
   'ORIGINAL_LICENSED_PHOTO_SKIRT_FULLY_RESTORED',
  researchOnlySourceSkirt45mmActive:!!rigid45Preview,
  sourceOriginalPhotoRGBAndAlphaUntouched:true,
  photoTextureUVAndOriginalRestGeometryUntouched:true,
  garmentFrontAndRearAppearanceNotHumanApproved:true,
  originalPhoto2DFallbackRequired:true,
  independentPhysicalFitApproved:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
async function load(avatar){
 if(selectedPreview)showOnlySelectedRegistration89(false,{draw:false});
 if(rigid45Preview)showOnlySourceRigidRegistration45(false,{draw:false});
 lastRegistration=null;
 check(!!source&&!!image&&!!outline,'original public skirt not verified');
 check(Object.hasOwn(MODELS,avatar),'unsupported anatomical model');
 candidate?.dispose();candidate=null;
 if(root){scene.remove(root);root.traverse(o=>{
  if(o.isMesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(x=>x.dispose());else o.material?.dispose();}
 });root=null;}
 bodies=[];sourceBodies=[];contacts=[];lastContact=null;coreBodySkinFaceMask89=null;phase='loading';
 const src=MODELS[avatar],path='/donor/research/three-d-06/models/'+src.file;
 const bytes=await read(path);
 check(await sha(bytes)===src.sha,'authentic original male/female CC0 rig SHA failed');
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(
  bytes.byteOffset,bytes.byteOffset+bytes.byteLength),
  '/donor/research/three-d-06/models/');
 root=gltf.scene;
 const bbox=new THREE.Box3().setFromObject(root),size=bbox.getSize(new THREE.Vector3()),
  center=bbox.getCenter(new THREE.Vector3());
 check(size.y>.6&&size.y<3.5,'real anatomical model dimensions unexpected');
 const scale=2/size.y;
 root.scale.multiplyScalar(scale);root.position.set(-center.x*scale,-bbox.min.y*scale,-center.z*scale);
 scene.add(root);root.updateMatrixWorld(true);
 setResearchPose(root,'source');
 root.traverse(m=>{
  if(m.isSkinnedMesh&&!m.userData.work56Garment){
   check(m.skeleton?.bones.length===163,'original 163-bone CC0 mesh invariant');
   bodies.push(m);sourceBodies.push([m,m.geometry.attributes.position.array.slice()]);
  }
 });
 check(bodies.length>0,'missing original male/female skinned anatomical body');
 candidate=buildOriginalPhotoSkirtProposal89({root,receipt:source,outline,cutoutImage:image});
 check(candidate?.receipt?.status==='ACTUAL_SOURCE_SKIRT_VISIBLE_FRONT_PROPOSAL_NOT_FITTED_OR_ACCEPTED',
  'independent source skirt unavailable on actual human rig '+candidate?.reason);
 check(candidate.receipt.sourcePhotoUVSeamNormalReport?.inspectedUVSeamVertexPairs===7&&
  candidate.receipt.sourcePhotoUVSeamNormalReport?.maximumPostSmoothingSeamNormalMismatch===0&&
  candidate.receipt.sourcePhotoUVSeamLightingContinuous===true&&
  candidate.receipt.sourcePhotoUVSeamNormalReport?.consumer3DAdmitted===false,
  'original licensed source skirt UV seam has unverified render normals');
 check(candidate.receipt.sourceRestWindingReport?.outwardRestTriangleCount===576&&
  candidate.receipt.sourceRestTriangleNormalsExteriorFacing===true&&
  candidate.receipt.sourceRestWindingReport?.consumer3DAdmitted===false,
  'original source photo-skirt has inward or unproven exterior normal winding');
 check(candidate.mesh.skeleton===bodies[0].skeleton&&
  candidate.mesh.skeleton.bones.length===163,
  'skirt not on true anatomical bones');
 // Independently decode the real pinned source bytes in verifySource() and
 // compare with the geometry builder's own SHA-attested PNG-only raster.
 // No caller-supplied RGBA is allowed to substitute a different fabric.
 const sourceTextureImage=candidate.mesh.material[0]?.map?.image;
 check(candidate.receipt.sourceRGBAWasDecodedFromExactAttestedCutoutPNG===true&&
  candidate.receipt.originalMaskShapeDerivedFromExactAttestedCutoutPNG===true&&
  candidate.receipt.callerSuppliedSilhouetteIsNotTrusted===true&&
  candidate.receipt.extractedSourceHemToWaistRatio===outline.sourceHemToWaistWidthRatio&&
  sourceTextureImage?.data instanceof Uint8Array&&
  sourceTextureImage.width===image.width&&sourceTextureImage.height===image.height&&
  await sha(sourceTextureImage.data)===await sha(image.data),
  'native 3D photographed material does not match attested original cutout raster');
 current=avatar;phase='ready';pose='source';angle=0;originalBodyPositions();
 const view=inspectPose('source');render();
 status.textContent='Source-hash original Commons-0043 on REAL '+avatar+
  ' 163-bone humanoid · source collision '+view.strictTransverseSourceBodyTriangleCrossings+
  ' strict crossings witnessed · UNKNOWN garment containment · 2D fallback · HOLD';
 return getState();
}
function inspectPose(mode){
 check(phase==='ready'&&candidate&&root,'source-authentic native scene unavailable');
 check(['source','blend-25','blend-50','blend-75','relaxed'].includes(mode),
  'unsupported real skeletal pose');
 setResearchPose(root,mode);pose=mode;
 root.updateMatrixWorld(true);
 originalBodyPositions();
 let sourceGeometry,bodyGeometry;
 try{
  sourceGeometry=posedSource84(candidate.meshes);
  bodyGeometry=posedSource84(bodies);
  const contact=countStableOriginalBodyContacts89(sourceGeometry.g,bodyGeometry.g);
  check(Number.isSafeInteger(contact.count)&&contact.count>=0&&
   Number.isFinite(contact.maxDepth),'real posed triangle BVH source/body contact invalid');
  const row=Object.freeze({avatar:current,pose:mode,
   sourceId:SKIRT_SOURCE89.id,realAnatomicalRigBones:163,
   sourceTrianglesAudited:candidate.receipt.triangleCount,
   trueOriginalPhotoSkirtFaceIDsStable:contact.trueOriginalSkirtTriangleIndexStable,
   trueOriginalAnatomicalFaceIDsStable:contact.trueOriginalBodyTriangleIndexStable,
   originalTriangleIDResolution:contact.originalFaceSourceResolution,
   strictTransverseSourceBodyTriangleCrossings:contact.count,
   maxOrientedPlaneDepthMeters:contact.maxDepth,
   status:contact.count>0?'ORIGINAL_SKIRT_BODY_CROSSING_WITNESSED_3D_REJECTED':
    'NO_STRICT_CROSSING_WITNESSED_NOT_CONTAINMENT_OR_CLEARANCE',
   fullContinuousClothOrContainmentSafety:false,
   sourcePhotoOriginalUnchanged:true,originalBodyGeometryUnchanged:true,
   sourceBackUnobserved:true,photoRealismNotHumanApproved:true,
   releaseAuthorized:false,familyAlpha:'HOLD'});
  lastContact=row;contacts.push(row);return row;
 }finally{sourceGeometry?.g.dispose();bodyGeometry?.g.dispose();}
}
/** Source front vertices remain byte-identical; all research geometry is
 * restored before exiting. Any original body crossing still BLOCKS 3D.
 */
function trialNeutralRear(){
 check(phase==='ready'&&candidate?.mesh?.isSkinnedMesh,'genuine source rig required');
 const report=compareActualNeutralSkirtRear89({
  root,mesh:candidate.mesh,avatar:current,
  applyPose:name=>setResearchPose(root,name),
  sampleContact:()=>{
   let skirt,body;
   try{
    skirt=posedSource84(candidate.meshes);body=posedSource84(bodies);
    return countStableOriginalBodyContacts89(skirt.g,body.g);
   }finally{skirt?.g.dispose();body?.g.dispose();}
  }
 });
 check(report?.releaseAuthorized===false&&report?.sourcePhoto2DFallbackRequired===true,
  'research-only neutral trial may never authorize a wearable skirt');
 check(report.status!=='REAR_RESEARCH_REFUSED_OR_UNCHANGED',
  'neutral trial evidence invalid: '+report.reason);
 pose='source';originalBodyPositions();render();
 return report;
}
/**
 * Classify every ORIGINAL skin-weighted CC0 body triangle by its anatomical
 * original rig bone labels. The photographic skirt's radial PATTERN must not
 * enlarge itself to enclose outstretched forearms, hands, fingers or head.
 * This mask affects ONLY the shape-hypothesis cross-section, NEVER the
 * full-original triangle BVH used to veto any body/skirt intersection.
 */
let coreBodySkinFaceMask89=null;
function originalTorsoLegSourceFaceMask89(){
 if(coreBodySkinFaceMask89)return coreBodySkinFaceMask89;
 const arm=/upperarm|lowerarm|forearm|shoulder|clavic|hand|finger|thumb|head|neck|eye|ear/i;
 const keep=[],parts=new Set();let eligible=0,excluded=0;
 for(const mesh of bodies){
  const g=mesh.geometry,idx=g.index,skin=g.getAttribute('skinIndex'),
   weights=g.getAttribute('skinWeight'),position=g.getAttribute('position');
  check(idx?.count>=150&&skin?.count===position?.count&&
   weights?.count===position?.count,'actual CC0 body skin weight provenance unavailable');
  const isCore=new Uint8Array(position.count);
  for(let i=0;i<position.count;i++){
   let maxArmWeight=0;
   for(let k=0;k<4;k++){
    const w=weights.getComponent(i,k);
    if(w<=1e-8)continue;
    const bone=mesh.skeleton.bones[skin.getComponent(i,k)];
    check(!!bone&&typeof bone.name==='string'&&bone.name.length>0,
     'original avatar source bone labels missing');
    if(arm.test(bone.name)){maxArmWeight+=w;parts.add(bone.name);}
   }
   isCore[i]=maxArmWeight<.5?1:0;
  }
  for(let k=0;k<idx.count;k+=3){
   const keepSource=!!(isCore[idx.getX(k)]&&isCore[idx.getX(k+1)]&&
    isCore[idx.getX(k+2)]);
   keep.push(keepSource?1:0);
   if(keepSource)eligible++;else excluded++;
  }
 }
 check(parts.size>=2&&excluded>=24&&eligible>=100,
  'original CC0 bone-part mask evidence insufficient: armBones='+parts.size+
   ',excludedFaces='+excluded+',coreFaces='+eligible+
   ',sourceFaces='+keep.length);
 coreBodySkinFaceMask89=new Uint8Array(keep);
 return coreBodySkinFaceMask89;
}
/** Genuine public-body cross-sectional source fit A/B. The original PHOTO
 * and all original GLB skinned geometry remain immutable. No fitted candidate
 * is exposed or saved; P89 returns only counts and derived band summaries.
 */
function trialMeasuredAnatomyFit(){
 check(phase==='ready'&&candidate?.mesh?.isSkinnedMesh&&root&&bodies.length>0,
  'verified source-skirt and actual CC0 anatomical avatar required');
 const report=compareActualMeasuredSkirtFit89({
  root,mesh:candidate.mesh,avatar:current,
  applyPose:name=>setResearchPose(root,name),
  sampleBodySkinnedWorld:()=>{
   let b;
   try{
    b=posedSource84(bodies);
    const coreFaceMask=originalTorsoLegSourceFaceMask89();
    check(coreFaceMask.length===b.g.index.count/3,
     'original CC0 skin part face indices do not match immutable BVH source');
    return {positions:b.g.getAttribute('position').array.slice(),
     indices:b.g.index.array.slice(),coreFaceMask};
   }finally{b?.g.dispose();}
  },
  sampleContact:()=>{
   let skirt,body;
   try{
    skirt=posedSource84(candidate.meshes);
    body=posedSource84(bodies);
    return countStableOriginalBodyContacts89(skirt.g,body.g);
   }finally{skirt?.g.dispose();body?.g.dispose();}
  }
 });
 check(report?.releaseAuthorized===false&&report?.source2DFallbackRequired===true,
  'no body-fitted source skirt may be authorized for the private closet');
 // A measured anatomical surface can still intersect and distort the original
 // two-dimensional photograph. This viewer deliberately NEVER swaps it in.
 pose='source';originalBodyPositions();render();return report;
}
/** Bounded source-photo original skirt placement A/B across real anatomical
 * male/female whole skinned body, THREE genuine bone poses. This tests a
 * plausible source front-to-waist registration failure without fabric
 * widening. ALL geometry candidates reverted; physical fit not approved.
 */
function trialRigidRegistration(){
 check(phase==='ready'&&candidate?.mesh?.isSkinnedMesh&&bodies.length>0,
  'actual original independent photographed skirt and 163-bone CC0 body required');
 const receipt=compareActualOriginalPhotoSkirtRegistration89({
  mesh:candidate.mesh,avatar:current,applyPose:name=>setResearchPose(root,name),
  originalBodyFaceMask:originalTorsoLegSourceFaceMask89(),
  sampleContact:()=>{
   let skirt,body;
   try{
    skirt=posedSource84(candidate.meshes);
    body=posedSource84(bodies);
    return countStableOriginalBodyContacts89(skirt.g,body.g);
   }finally{skirt?.g.dispose();body?.g.dispose();}
  }
 });
 check(receipt?.releaseAuthorized===false&&receipt?.originalPhoto2DFallbackRequired===true,
  'source-garment registration must never authorize consumer wearable 3D');
 check(receipt.status!=='REAL_PHOTOGRAPHED_SKIRT_REGISTRATION_NOT_VERIFIED',
  'genuine source-photo-to-original-rig registration A/B not verified: '+receipt.reason);
 pose='source';originalBodyPositions();render();
 lastRegistration=receipt;
 return receipt;
}
/** Genuine source CC0 skeleton waist joint heights near original
 * photographed mask rim. Read-only public original model provenance,
 * not measurement of the human garment or owner's private body.
 */
/**
 * P89 selected five-pose registration research preview. The offset MUST be
 * the selected result from this same avatar's authentic original source BVH
 * run, never a caller-provided guessed geometry or a wearable 3D approval.
 * Separate from the historic fixed 45mm comparative control.
 */
function showOnlySelectedRegistration89(active,{draw=true}={}){
 check(phase==='ready'&&candidate?.mesh?.isSkinnedMesh&&
  source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED',
  'original licensed photo and true rig required for selected preview');
 if(active){
  check(!selectedPreview&&!rigid45Preview,
   'overlapping original-photo research previews forbidden');
  const selection=lastRegistration?.bestResearchOnly;
  const allowed=Object.freeze({
   'front-15mm':.015,'front-30mm':.030,'front-35mm':.035,
   'front-40mm':.040,'front-45mm':.045,'front-50mm':.050,
   'front-55mm':.055,'front-60mm':.060
  });
  check(lastRegistration?.avatar===current&&
   lastRegistration?.status==='RESEARCH_REGISTRATION_REDUCED_STATIC_PAIRS_NOT_WEARABLE'&&
   lastRegistration?.releaseAuthorized===false&&
   lastRegistration?.consumer3DAdmitted===false&&
   selection?.researchOnlyNonworseningReduction===true&&
   selection?.releaseAuthorized===false&&
   selection?.consumer3DAdmitted===false&&
   selection?.introducedFivePoseSourceFacePairIDs===0&&
   selection?.maxPlaneDepthWorsened===false&&
   Object.hasOwn(allowed,selection?.name)&&
   selection?.localCameraFacingRegistrationMeters?.length===3&&
   Object.is(selection.localCameraFacingRegistrationMeters[0],0)&&
   Object.is(selection.localCameraFacingRegistrationMeters[1],0)&&
   Math.abs(selection.localCameraFacingRegistrationMeters[2]-allowed[selection.name])<1e-8,
   'five-pose-original-source-selected-registration-not-proven');
  const original=candidate.mesh.geometry;
  const position=original.getAttribute('position'), uv=original.getAttribute('uv'),
   rest=original.getAttribute('sourceSkirt89Rest');
  check(position?.count===343&&uv?.count===343&&rest?.count===343&&
   original.index?.count===1728,
   'only original photographed source skirt preview may be selected');
  const snapshots=Object.freeze([
   ['position',position.array.slice()],['uv',uv.array.slice()],
   ['sourceSkirt89Rest',rest.array.slice()],
   ['skinIndex',original.getAttribute('skinIndex').array.slice()],
   ['skinWeight',original.getAttribute('skinWeight').array.slice()],
   ['index',original.index.array.slice()]
  ]);
  let copy=null;
  try{
   copy=original.clone();
   const out=copy.getAttribute('position'),dz=allowed[selection.name];
   for(let i=0;i<out.count;i++)
    out.setXYZ(i,position.getX(i),position.getY(i),position.getZ(i)+dz);
   out.needsUpdate=true;
   copy.computeVertexNormals();copy.computeBoundingSphere();copy.computeBoundingBox();
   for(const [key,bytes] of snapshots){
    if(key==='position')continue;
    const actual=key==='index'?copy.index.array:copy.getAttribute(key).array;
    check(actual.length===bytes.length&&
     actual.every((n,i)=>Object.is(n,bytes[i])),
     'selected-preview-changed-source-mesh-UV-skin-or-rest');
   }
   candidate.mesh.geometry=copy;
   selectedPreview={original,copy,snapshots,name:selection.name,dz};
  }catch(e){
   candidate.mesh.geometry=original;copy?.dispose();throw e;
  }
 }else if(selectedPreview){
  const previous=selectedPreview;selectedPreview=null;
  candidate.mesh.geometry=previous.original;
  previous.copy.dispose();
  for(const [key,bytes] of previous.snapshots){
   const actual=key==='index'?previous.original.index.array:
    previous.original.getAttribute(key).array;
   check(actual.length===bytes.length&&
    actual.every((n,i)=>Object.is(n,bytes[i])),
    'original source face/UV/skin/geometry changed after selected preview');
  }
 }
 if(draw)render();
 return Object.freeze({
  status:active?'SELECTED_FIVE_POSE_ORIGINAL_PHOTO_REGISTRATION_RESEARCH_PREVIEW_ONLY':
   'ORIGINAL_LICENSED_PHOTO_SKIRT_FULLY_RESTORED',
  avatar:current,sourceId:'commons-0043',
  selectedResearchRegistrationName:selectedPreview?.name??null,
  selectedResearchRegistrationMeters:selectedPreview?.dz??null,
  selectedPreviewActive:!!selectedPreview,
  actualOriginalPhotoAnd163BoneSourceOnly:true,
  physicalSkirtScaleAndHumanPhotoFitUnverified:true,
  originalSourcePositionUVSkinAndRestPreserved:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}

/**
 * Genuine original licensed source: independently check selected-camera
 * registration against the original BODY triangle-plane radial boundary,
 * not merely zero transverse BVH crossings. The original-public model's
 * inferred scale and neutral/unphotographed back remain disqualifying for
 * real-garment fit approval, regardless of measured radial signs.
 */
function auditSelectedSourceRadialGap89(){
 check(phase==='ready'&&source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'genuine original-license selected static BVH reduction must precede radial anatomy audit');
 let skirt,body;
 try{
  skirt=posedSource84(candidate.meshes);
  body=posedSource84(bodies);
  const mask=originalTorsoLegSourceFaceMask89();
  check(mask.length===body.g.index.count/3,
   'original 163-bone body skin indices do not match source BVH');
  const report=auditSelectedOriginalSkirtRadialGap89({
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   bodyPositions:body.g.getAttribute('position').array,
   bodyIndices:body.g.index.array,
   coreBodyFaceMask:mask,
   avatar:current,pose,sourcePhotoSHA256:source.originalSHA256,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true
  });
  check(report?.releaseAuthorized===false&&
   report?.originalPhoto2DFallbackRequired===true,
   'source radial geometry evidence cannot authorize wardrobe 3D');
  return report;
 }finally{
  skirt?.g.dispose();body?.g.dispose();
  originalBodyPositions();
 }
}

/**
 * Audit actual fully indexed *whole* original CC0 163-bone anatomical
 * surface edge closure before a future signed inside/outside classification.
 * The documented torso/leg weighted source-face mask is provenance only:
 * never exclude unrelated actual anatomical body faces from closure.
 * Original JPEG, 2D fallback and selected photo mesh remain immutable.
 */
function auditSelectedOriginalSourceBodyClosure89(){
 check(phase==='ready'&&source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'actual licensed skirt and unchanged original rig selected source preview required');
 let skirt,body;
 try{
  skirt=posedSource84(candidate.meshes);
  body=posedSource84(bodies);
  const mask=originalTorsoLegSourceFaceMask89();
  check(mask.length===body.g.index.count/3,
   'immutable original source bone-indexed full-body face mask required');
  const r=auditActualOriginalBodyClosure89({
   bodyPositions:body.g.getAttribute('position').array,
   bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   coreBodyFaceMask:mask,avatar:current,pose,
   sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true
  });
  check(r?.releaseAuthorized===false&&
   r?.originalPhoto2DFallbackRequired===true,
   'original body topology evidence cannot authorize consumer 3D');
  return r;
 }finally{
  skirt?.g.dispose();body?.g.dispose();
  originalBodyPositions();
 }
}

/**
 * Read ORIGINAL anatomical GLB rest+skin source in exactly the same mesh and
 * vertex packing order used by the genuine P84 posedSource84 original-body
 * conversion. This metadata is used in-process, never exported or welded.
 */
function originalBodySourceSeamProvenance89(expectedVertices){
 const rest=[],index=[],weight=[],meshIDs=[];
 for(let meshId=0;meshId<bodies.length;meshId++){
  const mesh=bodies[meshId],g=mesh?.geometry,
   p=g?.getAttribute('position'),skin=g?.getAttribute('skinIndex'),
   w=g?.getAttribute('skinWeight');
  check(mesh?.isSkinnedMesh&&mesh.skeleton?.bones.length===163&&
   p?.count>0&&skin?.count===p.count&&w?.count===p.count,
   'genuine original 163-bone GLB exact skinned rest/weight provenance required');
  for(let i=0;i<p.count;i++){
   rest.push(p.getX(i),p.getY(i),p.getZ(i));
   meshIDs.push(meshId);
   for(let j=0;j<4;j++){
    const bone=skin.getComponent(i,j),val=w.getComponent(i,j);
    check(Number.isSafeInteger(bone)&&bone>=0&&bone<163&&
     Number.isFinite(val)&&val>=0&&val<=1,
     'original source skin bone or weight invalid');
    index.push(bone);weight.push(val);
   }
  }
 }
 check(rest.length===expectedVertices*3&&index.length===expectedVertices*4&&
  meshIDs.length===expectedVertices,
  'original source rest/skin order does not match authentic posed GLB face packing');
 return {restPositions:new Float32Array(rest),
  skinIndices:new Uint16Array(index),skinWeights:new Float32Array(weight),
  sourceMeshIds:new Uint16Array(meshIDs)};
}
/**
 * Independently validate genuine original indexed boundary "twins"
 * against both source world-position coincidence and exact original
 * rest/skin/mesh provenance. A positive virtual match DOES NOT
 * authorize a watertight body, signed garment fit or 3D consumer display.
 */
function auditSelectedOriginalBodySeams89(){
 check(phase==='ready'&&source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'authentic selected original photographed skirt and public body required');
 const prior=auditSelectedOriginalSourceBodyClosure89();
 check(prior.status==='ORIGINAL_BODY_OPEN_OR_NONMANIFOLD_CANNOT_PROVE_SIGNED_INSIDE_OUTSIDE'&&
  prior.anatomicalSourceTopology?.sourceOpenBoundaryEdgeCount>0,
  'original indexed body open boundary source witness missing');
 let body;
 try{
  body=posedSource84(bodies);
  const positions=body.g.getAttribute('position').array;
  const restSkin=originalBodySourceSeamProvenance89(positions.length/3);
  const report=auditRealOriginalBodySeams89({
   posedPositions:positions,indices:body.g.index.array,
   ...restSkin,avatar:current,pose,
   sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,
   originalBodyTopologyBoundaryEdges:
    prior.anatomicalSourceTopology.sourceOpenBoundaryEdgeCount
  });
  check(report?.releaseAuthorized===false&&
   report?.sourcePhoto2DFallbackRequired===true,
   'original body virtual skin/rest seam matches cannot authorize wearable');
  return report;
 }finally{
  body?.g.dispose();originalBodyPositions();
 }
}

/**
 * Map only the currently unresolved ORIGINAL P541 163bone source boundary
 * edge populations to public anatomical bone labels/source mesh indices.
 * Native original GLB pose, photo SHA, selected BVH receipt, source face
 * order, original rest/skin provenance must all be present. No coordinates
 * are serialized. Anatomical labels and normalized height bands are
 * aggregate research observations, not wearability or physical garment size.
 */
function auditSelectedOriginalBodyBoundaryRegions89(){
 check(phase==='ready'&&source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'verified real-photo skirt original 163bone source selected preview required');
 const seams=auditSelectedOriginalBodySeams89();
 check(seams?.status==='ORIGINAL_INDEXED_BODY_BOUNDARY_REMAINS_UNRESOLVED_FOR_SIGNED_FIT'&&
  seams?.virtualSeamEvidence?.unresolvedOriginalBoundaryEdges>0,
  'original anatomy has no authenticated remaining unresolved indexed boundaries');
 let body;
 try{
  body=posedSource84(bodies);
  const posedPositions=body.g.getAttribute('position').array,
   restSkin=originalBodySourceSeamProvenance89(posedPositions.length/3);
  const sourceLabel=x=>String(x||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96);
  const sourceMeshNames=bodies.map((m,i)=>
   sourceLabel(m.name)||'SOURCE_BODY_MESH_'+i);
  const sourceBoneNamesByMesh=bodies.map(mesh=>{
   check(mesh?.skeleton?.bones?.length===163,
    'original anatomical source skeleton missing');
   return mesh.skeleton.bones.map((bone,j)=>
    sourceLabel(bone.name)||'SOURCE_UNLABELLED_BONE_'+j);
  });
  const report=auditActualOriginalBodyBoundaryRegions89({
   posedPositions,indices:body.g.index.array,...restSkin,
   sourceMeshNames,sourceBoneNamesByMesh,
   independentSeamEvidence:seams.virtualSeamEvidence,
   avatar:current,pose,sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true
  });
  check(report?.releaseAuthorized===false&&
   report?.originalPhoto2DFallbackRequired===true,
   'original anatomical boundary localization cannot authorize garment 3D');
  return report;
 }finally{
  body?.g.dispose();originalBodyPositions();
 }
}

/**
 * True native original public CC0 163bone anatomy in the original actual
 * photographed skirt height interval. Distinguish artificial ROI crop
 * boundaries from original source indexed UV seams while measuring only
 * rays touching verified torso / hips / legs source faces.
 *
 * Read-only entire source original skeleton + indexed world-body triangles;
 * every original garment/photo/UV/rest source is unchanged. Do NOT claim
 * signed closed-body fit from an observed outward direction or zero BVH
 * strict transverse intersections.
 */
function auditSelectedOriginalSkirtCoreSpan89(){
 check(phase==='ready'&&source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'authentic original licensed PHOTO skirt on selected 163bone CC0 avatar required');
 const topology=auditSelectedOriginalSourceBodyClosure89();
 check(topology?.status==='ORIGINAL_BODY_OPEN_OR_NONMANIFOLD_CANNOT_PROVE_SIGNED_INSIDE_OUTSIDE'&&
  topology?.anatomicalSourceTopology?.originalIndexedTriangleCount>=100&&
  topology?.anatomicalSourceTopology?.sourceOpenBoundaryEdgeCount>=1,
  'independent source anatomical original indexed topology absent');
 let body,skirt;
 try{
  body=posedSource84(bodies);
  skirt=posedSource84(candidate.meshes);
  const positions=body.g.getAttribute('position').array,
   restSkin=originalBodySourceSeamProvenance89(positions.length/3),
   sourceMeshNames=bodies.map((mesh,i)=>
    String(mesh.name||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96)||
    'SOURCE_BODY_MESH_'+i),
   sourceBoneNamesByMesh=bodies.map(mesh=>{
    check(mesh?.skeleton?.bones?.length===163,
     'original CC0 163bone body skeleton source lost');
    return mesh.skeleton.bones.map((bone,j)=>
     String(bone.name||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96)||
     'SOURCE_BONE_'+j);
   });
  const sourceMask=originalTorsoLegSourceFaceMask89();
  check(sourceMask.length===body.g.index.count/3,
   'original source whole-index original face core skin-mask identity invalid');
  const report=auditActualOriginalSkirtCoreSpan89({
   bodyPositions:positions,bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   coreBodyFaceMask:sourceMask,
   skinIndices:restSkin.skinIndices,skinWeights:restSkin.skinWeights,
   sourceMeshIds:restSkin.sourceMeshIds,sourceMeshNames,sourceBoneNamesByMesh,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,avatar:current,pose,
   sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   independentlyVerifiedOriginalSeamBoundaryCount:
    topology.anatomicalSourceTopology.sourceOpenBoundaryEdgeCount,
   independentlyVerifiedOriginalBodyTriangleCount:
    topology.anatomicalSourceTopology.originalIndexedTriangleCount
  });
  check(report?.releaseAuthorized===false&&
   report?.originalPhoto2DFallbackRequired===true,
   'original source skirt core ROI cannot become approved human-wearable 3D');
  return report;
 }finally{
  skirt?.g.dispose();body?.g.dispose();originalBodyPositions();
 }
}

/**
 * Independent missing 191/195 actual original core ray directions proof.
 * Every 7 x 48 ring spoke is independently reproduced from exact original
 * source indexed anatomical triangles, original 163bone weights and true
 * source mesh face/mask ordering. Report only bounded aggregate counts.
 *
 * Excluded anatomical hits do NOT fill in skipped parts or certify exterior
 * placement. No model, original photo or owner closet writes.
 */
function auditSelectedOriginalSkirtCoreRayUnknownCauses89(){
 check(phase==='ready'&&
  source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'genuine selected public skirt and original 163bone body source required');
 const prev=auditSelectedOriginalSkirtCoreSpan89();
 check(prev?.originalSkirtCoreEvidence?.originalSourceSkirtCoreTrueRayTests===336&&
  prev?.releaseAuthorized===false&&prev.originalPhoto2DFallbackRequired===true,
  'genuine previous original 336-photo-spoke torso-core source receipt missing');
 let body,skirt;
 try{
  body=posedSource84(bodies);
  skirt=posedSource84(candidate.meshes);
  const positions=body.g.getAttribute('position').array,
   orig=originalBodySourceSeamProvenance89(positions.length/3),
   names=bodies.map((mesh,i)=>
    String(mesh.name||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96)||
    'SOURCE_BODY_MESH_'+i),
   boneNames=bodies.map(mesh=>{
    check(mesh?.skeleton?.bones?.length===163,
     'source frozen original 163bone anatomical skeleton required');
    return mesh.skeleton.bones.map((bone,i)=>
     String(bone.name||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96)||
     'SOURCE_BONE_'+i);
   });
  const mask=originalTorsoLegSourceFaceMask89();
  check(mask.length===body.g.index.count/3,
   'original full-anatomy source-indexed face/skin-mask identity changed');
  const report=auditOriginalSkirtCoreRayUnknownCauses89({
   bodyPositions:positions,bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   coreBodyFaceMask:mask,
   skinIndices:orig.skinIndices,skinWeights:orig.skinWeights,
   sourceMeshIds:orig.sourceMeshIds,sourceMeshNames:names,
   sourceBoneNamesByMesh:boneNames,
   independentlyVerifiedCoreSpanReport:prev.originalSkirtCoreEvidence,
   sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,avatar:current,pose
  });
  check(report?.releaseAuthorized===false&&
   report?.originalPhoto2DFallbackRequired===true,
   'original source core unknown cause proof cannot admit garment 3D');
  return report;
 }finally{
  skirt?.g.dispose();body?.g.dispose();originalBodyPositions();
 }
}

/**
 * Real selected Commons-0043 original photographed-skirt source geometry
 * *actual* P541 male/female 163bone bone names / original source mesh IDs,
 * vs original directions without ANY observed anatomy plane-ray hit.
 * Recomputed independently and cross-checked against verified last
 * P89 original-core ray-causes receipt; never reclassify unknown source
 * bones into allowed body parts or manufacture missing original contours.
 */
function auditSelectedOriginalSkirtSourceBoneNamesNoHits89(){
 check(phase==='ready'&&
  source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'actual photographed original research-only garment and source P541 163bone required');
 const cause=auditSelectedOriginalSkirtCoreRayUnknownCauses89();
 check(cause?.originalSkirtCoreUnknownCauseEvidence?.trueOriginalSourceRingRayCount===336&&
  cause?.releaseAuthorized===false&&cause.originalPhoto2DFallbackRequired===true,
  'actual source-independent original core ray cause receipt absent');
 let body,skirt;
 try{
  body=posedSource84(bodies);
  skirt=posedSource84(candidate.meshes);
  const positions=body.g.getAttribute('position').array,
   restSkin=originalBodySourceSeamProvenance89(positions.length/3),
   safe=x=>String(x||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96);
  const names=bodies.map((mesh,i)=>safe(mesh.name)||'SOURCE_BODY_MESH_'+i);
  const skeletons=bodies.map(mesh=>{
   check(mesh?.skeleton?.bones?.length===163,'real source 163bone source-model anatomy missing');
   return mesh.skeleton.bones.map((bone,i)=>
    safe(bone.name)||'SOURCE_BONE_'+i);
  });
  const faceMask=originalTorsoLegSourceFaceMask89();
  check(faceMask.length===body.g.index.count/3,
   'original body source faces no longer match immutable original core skin mask');
  const result=auditOriginalSkirtCoreBoneNamesAndNoHits89({
   bodyPositions:positions,bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   coreBodyFaceMask:faceMask,
   skinIndices:restSkin.skinIndices,skinWeights:restSkin.skinWeights,
   sourceMeshIds:restSkin.sourceMeshIds,
   sourceMeshNames:names,sourceBoneNamesByMesh:skeletons,
   independentlyVerifiedMissingCoreCauseReport:
    cause.originalSkirtCoreUnknownCauseEvidence,
   sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,avatar:current,pose
  });
  check(result?.releaseAuthorized===false&&
   result?.originalPhoto2DFallbackRequired===true,
   'source original public bone names cannot authorize original garment 3D');
  return result;
 }finally{
  skirt?.g.dispose();body?.g.dispose();originalBodyPositions();
 }
}

/**
 * RESEARCH-ONLY ORIGINAL source core 95/80% named-bone-weight sensitivity.
 * Source models/weights/triangles and existing strict 50%-dominant
 * original torso/hip/leg core mask stay read-only and authoritative.
 * Additional named-bone-composition faces are purely hypothetical.
 * Even fully observed radial rays can NEVER authorize signed body volume.
 */
function auditSelectedOriginalSkirtCoreWeightSensitivity89(){
 check(phase==='ready'&&
  source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'real original photographed source skirt, selected registration and original CC0 163bone required');
 const previous=auditSelectedOriginalSkirtCoreRayUnknownCauses89();
 check(previous?.originalSkirtCoreUnknownCauseEvidence?.trueOriginalSourceRingRayCount===336&&
  previous?.releaseAuthorized===false&&
  previous?.originalPhoto2DFallbackRequired===true,
  'independently verified original strict core 336 source ray receipt required');
 let body,skirt;
 try{
  body=posedSource84(bodies);
  skirt=posedSource84(candidate.meshes);
  const positions=body.g.getAttribute('position').array,
   original=originalBodySourceSeamProvenance89(positions.length/3),
   safe=x=>String(x||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96),
   sourceMeshNames=bodies.map((mesh,i)=>safe(mesh.name)||'SOURCE_BODY_MESH_'+i),
   sourceBoneNamesByMesh=bodies.map(mesh=>{
    check(mesh?.skeleton?.bones?.length===163,
     'original immutable 163bone source identity absent');
    return mesh.skeleton.bones.map((bone,i)=>
     safe(bone.name)||'SOURCE_BONE_'+i);
   });
  const mask=originalTorsoLegSourceFaceMask89();
  check(mask.length===body.g.index.count/3,
   'original source core mask face count mismatched original indexed GLB');
  const audit=auditOriginalCoreWeightSensitivity89({
   bodyPositions:positions,bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   coreBodyFaceMask:mask,
   skinIndices:original.skinIndices,skinWeights:original.skinWeights,
   sourceMeshIds:original.sourceMeshIds,sourceMeshNames,sourceBoneNamesByMesh,
   avatar:current,pose,sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,
   previousIndependentOriginalCoreCauseReport:
    previous.originalSkirtCoreUnknownCauseEvidence
  });
  check(audit?.releaseAuthorized===false&&
   audit?.originalPhoto2DFallbackRequired===true,
   'research skin-weight original source never authorizes 3D wearing');
  return audit;
 }finally{
  skirt?.g.dispose();body?.g.dispose();originalBodyPositions();
 }
}

/**
 * Read-only P89 source 95%-named core STILL-UNKNOWN 122/120 sampled
 * directions: audit original forward-body face coverage, backward body
 * plane source segments, 3-unit original research ray limits and 2D
 * projected original anatomical slice convex hull of source ring center.
 *
 * Authenticated by independently passing original 163bone source
 * skin-weight scenario first. Hull is NOT a closed/solid body proof.
 */
function auditSelectedOriginalSkirtCoreNoHitGeometry89(){
 check(phase==='ready'&&source?.status===
  'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'genuine original source photo and selected 163bone figure required');
 const prior=auditSelectedOriginalSkirtCoreWeightSensitivity89();
 check(prior?.evidence?.originalPhotoSkirtSourceRays===336&&
  prior?.releaseAuthorized===false&&
  prior?.originalPhoto2DFallbackRequired===true,
  'original source independently verified 95pct core scenario required');
 let body,skirt;
 try{
  body=posedSource84(bodies);
  skirt=posedSource84(candidate.meshes);
  const positions=body.g.getAttribute('position').array,
   original=originalBodySourceSeamProvenance89(positions.length/3),
   safe=x=>String(x||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96),
   sourceMeshNames=bodies.map((mesh,i)=>
    safe(mesh.name)||'SOURCE_BODY_MESH_'+i),
   sourceBoneNamesByMesh=bodies.map(mesh=>{
    check(mesh?.skeleton?.bones?.length===163,
     'true original public source anatomical skeleton required');
    return mesh.skeleton.bones.map((bone,i)=>
     safe(bone.name)||'SOURCE_BONE_'+i);
   });
  const mask=originalTorsoLegSourceFaceMask89();
  check(mask.length===body.g.index.count/3,
   'original body face core mask does not match indexed original');
  const report=auditActualOriginalCoreNoHitGeometry89({
   bodyPositions:positions,bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   coreBodyFaceMask:mask,
   skinIndices:original.skinIndices,skinWeights:original.skinWeights,
   sourceMeshIds:original.sourceMeshIds,
   sourceMeshNames,sourceBoneNamesByMesh,
   avatar:current,pose,
   sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,
   selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,
   independentOriginalSkinWeightSensitivityReceipt:prior.evidence
  });
  check(report?.releaseAuthorized===false&&
   report?.originalPhoto2DFallbackRequired===true,
   'source 2D convex-envelope nohit cannot approve original 3D');
  return report;
 }finally{
  skirt?.g.dispose();body?.g.dispose();originalBodyPositions();
 }
}

/**
 * True original 163bone CC0 GLB source indexed per-skirt-height contour
 * connectivity. Same original source faces & 95% research-only skin
 * hypothesis as independent previous 336 ray source geometry report.
 * No welding of original split GLB UV indices or disjoint body meshes.
 */
function auditSelectedOriginalSkirtSourceContourConnectivity89(){
 check(phase==='ready'&&source?.status===
  'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'genuine selected original photo and 163bone original CC0 model required');
 const prior=auditSelectedOriginalSkirtCoreNoHitGeometry89();
 check(prior?.originalSourceRayEvidence?.originalSkirtSampledRays===336&&
  prior?.releaseAuthorized===false&&
  prior?.originalPhoto2DFallbackRequired===true,
  'true original source photo indexed no-hit contour receipt required');
 let body,skirt;
 try{
  body=posedSource84(bodies);
  skirt=posedSource84(candidate.meshes);
  const positions=body.g.getAttribute('position').array,
   original=originalBodySourceSeamProvenance89(positions.length/3),
   safe=x=>String(x||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96),
   sourceMeshNames=bodies.map((mesh,i)=>
    safe(mesh.name)||'SOURCE_BODY_MESH_'+i),
   sourceBoneNamesByMesh=bodies.map(mesh=>{
    check(mesh?.skeleton?.bones?.length===163,
     'true public donor GLB original indexed skeleton absent');
    return mesh.skeleton.bones.map((bone,i)=>
     safe(bone.name)||'SOURCE_BONE_'+i);
   });
  const mask=originalTorsoLegSourceFaceMask89();
  check(mask.length===body.g.index.count/3,
   'original-source 163bone face mask mismatch');
  const audit=auditActualOriginalContourConnectivity89({
   bodyPositions:positions,bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   coreBodyFaceMask:mask,skinIndices:original.skinIndices,
   skinWeights:original.skinWeights,
   sourceMeshIds:original.sourceMeshIds,sourceMeshNames,sourceBoneNamesByMesh,
   avatar:current,pose,
   sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,
   independentlyVerifiedOriginal95NoHitGeometry:prior.originalSourceRayEvidence
  });
  check(audit?.releaseAuthorized===false&&
   audit?.originalPhoto2DFallbackRequired===true,
   'original source contour graph is not real 3D garment fit');
  return audit;
 }finally{
  skirt?.g.dispose();body?.g.dispose();originalBodyPositions();
 }
}

/**
 * Independently match authentic source indexed open plane-cut endpoints
 * to original full-source excluded faces or *virtual* index-split twins.
 * Potential rest+skin-compatible source UV seam NEVER means a physically
 * sewn original body. The source 163bone GLB/photograph are read-only.
 */
function auditSelectedOriginalSkirtEndpointSourceProvenance89(){
 check(phase==='ready'&&source?.status===
  'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  selectedPreview&&root&&candidate?.mesh?.skeleton?.bones?.length===163&&
  lastRegistration?.avatar===current&&
  selectedPreview.name===lastRegistration?.bestResearchOnly?.name&&
  lastRegistration?.bestResearchOnly?.researchOnlyNonworseningReduction===true,
  'original selected photographed skirt and source model must be real');
 const prev=auditSelectedOriginalSkirtSourceContourConnectivity89();
 check(prev?.sourceOriginalBodyContourGraph?.originalSourceSkirtSpokeRayCount===336&&
  prev?.releaseAuthorized===false&&
  prev?.originalPhoto2DFallbackRequired===true,
  'verified independent original indexed contour source receipt missing');
 let body,skirt;
 try{
  body=posedSource84(bodies);
  skirt=posedSource84(candidate.meshes);
  const positions=body.g.getAttribute('position').array,
   original=originalBodySourceSeamProvenance89(positions.length/3),
   safe=x=>String(x||'').replace(/[^\x20-\x7e]/g,'_').slice(0,96),
   names=bodies.map((mesh,i)=>safe(mesh.name)||'SOURCE_BODY_MESH_'+i),
   bones=bodies.map(mesh=>{
    check(mesh?.skeleton?.bones?.length===163,
     'original licensed 163bone source GLB needed');
    return mesh.skeleton.bones.map((bone,i)=>safe(bone.name)||'SOURCE_BONE_'+i);
   }),
   mask=originalTorsoLegSourceFaceMask89();
  check(mask.length===body.g.index.count/3,
   'source original face mask does not match real indexed body');
  const q=auditSourceContourEndpointProvenance89({
   bodyPositions:positions,bodyIndices:body.g.index.array,
   skirtPositions:skirt.g.getAttribute('position').array,
   skirtIndices:skirt.g.index.array,
   ...original,coreBodyFaceMask:mask,
   sourceMeshNames:names,sourceBoneNamesByMesh:bones,
   avatar:current,pose,sourcePhotoSHA256:source.originalSHA256,
   sourceAnatomyGLBSHA256:MODELS[current].sha,
   originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
   selectedActualWebGLPreview:true,
   priorOriginalIndexedContourGraph:prev.sourceOriginalBodyContourGraph
  });
  check(q?.releaseAuthorized===false&&q?.originalPhoto2DFallbackRequired===true,
   'source split index matching does not make garment wearable');
  return q;
 }finally{
  skirt?.g.dispose();body?.g.dispose();originalBodyPositions();
 }
}

function auditWaistBoneAnchors(){
 check(phase==='ready'&&root&&candidate?.mesh?.isSkinnedMesh,
  'original license/source avatar and skirt rig must be verified');
 setResearchPose(root,'source');
 const row=auditOriginalSkirtWaistBoneAttachment89({
  root,skirt:candidate.mesh,avatar:current
 });
 check(row?.status==='ORIGINAL_SOURCE_RIG_WAIST_ANCHOR_VERTICAL_LANDMARKS_MEASURED_NOT_FIT'&&
  row?.originalPhoto2DFallbackRequired===true&&row?.releaseAuthorized===false,
  'source waist anchor cannot qualify for a consumer app');
 originalBodyPositions();return row;
}
/**
 * True on-screen VISIBILITY of the UNPHOTOGRAPHED provisional neutral rear.
 * This is a read-only original-source attribution pass, NOT material creation
 * or a claim that the original photograph had a real backside. In a single
 * genuine native WebGL frame we temporarily mark only material-index 1
 * (the 288 strictly unobserved original skirt triangles) flat neon green.
 * We read aggregate tagged native framebuffer pixels against the matching
 * original scene, restore the EXACT original material and render again.
 *
 * The RGBA frame, anatomical source pixels and owner images are NEVER
 * persisted/exported. It only reports counts, never validates a 3D fit.
 */
function auditOnlyUnobservedRearRenderedPixels(){
 check(phase==='ready'&&candidate?.mesh?.isSkinnedMesh&&
  !!source&&source.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'&&
  candidate.mesh.skeleton?.bones.length===163&&[0,90,180].includes(angle),
  'real-original-source-native-genuine-skirt-audit-required');
 const mesh=candidate.mesh,original=mesh.material,geometry=mesh.geometry;
 check(Array.isArray(original)&&original.length===2&&
  original[0]?.map?.isDataTexture===true&&
  original[1]?.isMeshStandardMaterial===true&&
  geometry.index?.count===1728&&geometry.groups?.length===288,
  'source-UV-original-photo-front-and-neutral-back-groups-required');
 const front=geometry.groups.filter(g=>g.materialIndex===0),
  back=geometry.groups.filter(g=>g.materialIndex===1);
 check(front.length===144&&back.length===144&&
  [...front,...back].every(g=>g.count===6),
  'exact-source-front-versus-unphotographed-rear-triangle-topology-required');
 const green=new THREE.MeshBasicMaterial({
  color:0x00ff00,toneMapped:false,side:THREE.DoubleSide,
  depthTest:true,depthWrite:true
 });
 const size=390*690*4,raw=new Uint8Array(size),
  baseline=new Uint8Array(size),projectedFrame=new Uint8Array(size),
  gl=renderer.getContext();
 let tagged=0,projected=0,restored=false;
 const read=out=>{
  render();
  gl.readPixels(0,0,390,690,gl.RGBA,gl.UNSIGNED_BYTE,out);
  check(gl.getError()===gl.NO_ERROR,
   'native-readonly-source-attribution-framebuffer-not-readable');
 };
 try{
  read(baseline);
  mesh.material=[original[0],green];
  read(raw);
  for(let i=0;i<size;i+=4){
   if(raw[i]<45&&raw[i+1]>220&&raw[i+2]<45&&
    Math.abs(raw[i]-baseline[i])+
    Math.abs(raw[i+1]-baseline[i+1])+
    Math.abs(raw[i+2]-baseline[i+2])>150)tagged++;
  }
  // Conservative projected-source-mesh denominator: mark both front and
  // inferred rear solid. The real photo front contains source transparency;
  // making that opaque can ONLY enlarge this coverage denominator, not
  // prove which original photo pixels are observed or what fabric looks
  // like. This is an explicitly LOWER BOUND on unphotographed material
  // share against the entire opaque projected mesh silhouette.
  mesh.material=[green,green];
  read(projectedFrame);
  for(let i=0;i<size;i+=4){
   if(projectedFrame[i]<45&&projectedFrame[i+1]>220&&
    projectedFrame[i+2]<45)projected++;
  }
 }finally{
  mesh.material=original;green.dispose();render();restored=true;
 }
 check(projected>0&&projected>=tagged,
  'solid original-mesh ID marker did not bound actual visible inferred rear');

 check(mesh.material===original&&
   mesh.material[0].map?.isDataTexture===true&&
   mesh.material[1].isMeshStandardMaterial===true,
  'exact-original-skirt-photographic-and-neutral-material-not-restored');
 const copied=Object.freeze({
  schema:'P89-actual-original-licensed-photo-visible-provisional-neutral-rear/v1',
  status:'ORIGINAL_PUBLIC_SKIRT_UNPHOTOGRAPHED_REAR_RENDERED_NOT_REAL_PHOTO',
  avatar:current,pose,viewAngle:angle,
  sourcePhotoId:'commons-0043',
  actual163BoneSourceRig:true,
  sourceFrontPhotographedSurfaceTriangleCount:288,
  sourceUnphotographedRearTriangleCount:288,
  unphotographedRearMarkerPixels:tagged,
  unphotographedRearFractionOfFullWebGLViewport:
   Math.round(tagged/(390*690)*1e5)/1e5,
  opaqueSourceMeshProjectedMarkerPixels:projected,
  inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt:
   Math.round(tagged/projected*1e5)/1e5,
  opaqueFrontMarkerOverestimatesPhotographicAlphaCoverage:true,
  projectedSourceDenominatorNotTruePhotographedVisiblePixels:true,
  originalPhotoFrontUVAndRGBUnchanged:true,
  originalSkirtSourcePhotoAndAnatomicalGeometryUnchanged:true,
  temporaryAttributionMaterialDisposedAndRestored:restored,
  originalRearPhotoObserved:false,
  inferredBackDoesNotBecomePhotographed:true,
  originalMaskOwnerApproved:false,
  dynamicClothAndCollisionCertified:false,
  sourcePhoto2DFallbackRequired:true,
  humanAppearanceAccepted:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
 return copied;
}
function setPose(mode){const out=inspectPose(mode);render();return out;}
function setView(deg){check([0,90,180].includes(deg),'only research original photo views');angle=deg;render();return getState();}
function toggleSkirt(show){check(phase==='ready','actual photographed skirt not loaded');
 candidate.mesh.visible=!!show;render();return getState();}
function auditOriginalSkirtMeasurementCalibration89(physicalTape=null){
 check(phase==='ready'&&candidate?.mesh?.isSkinnedMesh,
  'actual original 163bone source skirt required');
 const rest=candidate.mesh.geometry?.getAttribute('sourceSkirt89Rest');
 return auditOriginalSkirtPhysicalRegistration89({
  sourceId:SKIRT_SOURCE89.id,sourceSHA256:source?.originalSHA256,
  originalSourceAttested:source?.status==='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED',
  avatar:current,pose,rigBoneCount:candidate.mesh.skeleton?.bones.length,
  originalSkirtRestPositions:rest?.array,physicalTape
 });
}
function getState(){return Object.freeze({
 phase,avatar:current,sourceId:SKIRT_SOURCE89.id,originalSourceSHA256:source?.originalSHA256??null,
 originalCutoutSHA256:source?.cutoutSHA256??null,originalSkirtUnapproved:true,
 meshSourceFrontTextureVerified:!!candidate?.mesh?.material?.[0]?.map?.isDataTexture,
 skirtTriangleCount:candidate?.receipt?.triangleCount??0,
 skirtOriginalRestOutwardNormalFaces:candidate?.receipt?.sourceRestWindingReport?.outwardRestTriangleCount??0,
 skirtOriginalRestSourceWindingVerified:candidate?.receipt?.sourceRestTriangleNormalsExteriorFacing===true,
 originalPhotoSkirtUVSeamNormalPairs:candidate?.receipt?.sourcePhotoUVSeamNormalReport?.inspectedUVSeamVertexPairs??0,
 originalPhotoSkirtUVSeamMaxPreCorrectionDifference:candidate?.receipt?.sourcePhotoUVSeamNormalReport?.maximumOriginalSeamNormalMismatch??null,
 originalPhotoSkirtUVSeamLightingContinuous:candidate?.receipt?.sourcePhotoUVSeamLightingContinuous===true,
 originalAnatomicalRigReal:true,bones:candidate?.mesh?.skeleton?.bones?.length??0,
 attachedSkinnedMesh:!!candidate?.mesh?.isSkinnedMesh,
 sourcePhotoInferredBack:true,realWorldScaleMeasured:false,pose,angle,frames,
 researchOnlySourceRigid45PreviewActive:!!rigid45Preview,
 researchOnlySourceSelectedPreviewActive:!!selectedPreview,
 researchOnlySourceRigid45NotAnApprovedGarment:true,
 contact:lastContact,contactSamples:contacts.length,
 nativeWebGL2:!!renderer.getContext()&&renderer.capabilities.isWebGL2,
 lastRenderMs,sourcePhoto2DFallbackRequired:true,
 ownerApproved:false,independentHumanPhotorealismApproved:false,
 continuousClothPhysicsCertified:false,physicalPhoneTested:false,
 consumer3DAdmission:false,releaseAuthorized:false,familyAlpha:'HOLD',
 errors:errors.length
});}
function close(){if(selectedPreview)showOnlySelectedRegistration89(false,{draw:false});
 if(rigid45Preview)showOnlySourceRigidRegistration45(false,{draw:false});
 lastRegistration=null;candidate?.dispose();candidate=null;scene.remove(root);root=null;
 renderer.dispose();renderer.forceContextLoss();phase='disposed';return true;}
window.nativeP89Skirt=Object.freeze({getState,load,setPose,setView,toggleSkirt,trialNeutralRear,trialMeasuredAnatomyFit,trialRigidRegistration,auditWaistBoneAnchors,showOnlySourceRigidRegistration45,showOnlySelectedRegistration89,auditSelectedSourceRadialGap89,auditSelectedOriginalSourceBodyClosure89,auditSelectedOriginalBodySeams89,auditSelectedOriginalBodyBoundaryRegions89,auditSelectedOriginalSkirtCoreSpan89,auditSelectedOriginalSkirtCoreRayUnknownCauses89,auditSelectedOriginalSkirtSourceBoneNamesNoHits89,auditSelectedOriginalSkirtCoreWeightSensitivity89,auditSelectedOriginalSkirtCoreNoHitGeometry89,auditSelectedOriginalSkirtSourceContourConnectivity89,auditSelectedOriginalSkirtEndpointSourceProvenance89,auditOriginalSkirtMeasurementCalibration89,auditOnlyUnobservedRearRenderedPixels,close});
try{await verifySource();await load('female');}catch(e){
 phase='error';const msg=String(e?.message||e).slice(0,250);
 errors.push(msg);status.textContent='Original-photo 2D fallback: '+msg+' · HOLD';
 window.nativeP89SkirtError=msg;
}
