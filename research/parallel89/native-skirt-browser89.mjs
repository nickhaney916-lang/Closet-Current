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
 phase='loading',lastContact=null,shapeMeasured=null,lastRenderMs=0,rigid45Preview=null;
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
  check(!rigid45Preview,'one unpublished research photo-skirt preview at a time');
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
 if(rigid45Preview)showOnlySourceRigidRegistration45(false,{draw:false});
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
 check(candidate.mesh.skeleton===bodies[0].skeleton&&
  candidate.mesh.skeleton.bones.length===163,
  'skirt not on true anatomical bones');
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
 return receipt;
}
/** Genuine source CC0 skeleton waist joint heights near original
 * photographed mask rim. Read-only public original model provenance,
 * not measurement of the human garment or owner's private body.
 */
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
function setPose(mode){const out=inspectPose(mode);render();return out;}
function setView(deg){check([0,90,180].includes(deg),'only research original photo views');angle=deg;render();return getState();}
function toggleSkirt(show){check(phase==='ready','actual photographed skirt not loaded');
 candidate.mesh.visible=!!show;render();return getState();}
function getState(){return Object.freeze({
 phase,avatar:current,sourceId:SKIRT_SOURCE89.id,originalSourceSHA256:source?.originalSHA256??null,
 originalCutoutSHA256:source?.cutoutSHA256??null,originalSkirtUnapproved:true,
 meshSourceFrontTextureVerified:!!candidate?.mesh?.material?.[0]?.map?.isDataTexture,
 skirtTriangleCount:candidate?.receipt?.triangleCount??0,
 originalAnatomicalRigReal:true,bones:candidate?.mesh?.skeleton?.bones?.length??0,
 attachedSkinnedMesh:!!candidate?.mesh?.isSkinnedMesh,
 sourcePhotoInferredBack:true,realWorldScaleMeasured:false,pose,angle,frames,
 researchOnlySourceRigid45PreviewActive:!!rigid45Preview,
 researchOnlySourceRigid45NotAnApprovedGarment:true,
 contact:lastContact,contactSamples:contacts.length,
 nativeWebGL2:!!renderer.getContext()&&renderer.capabilities.isWebGL2,
 lastRenderMs,sourcePhoto2DFallbackRequired:true,
 ownerApproved:false,independentHumanPhotorealismApproved:false,
 continuousClothPhysicsCertified:false,physicalPhoneTested:false,
 consumer3DAdmission:false,releaseAuthorized:false,familyAlpha:'HOLD',
 errors:errors.length
});}
function close(){if(rigid45Preview)showOnlySourceRigidRegistration45(false,{draw:false});candidate?.dispose();candidate=null;scene.remove(root);root=null;
 renderer.dispose();renderer.forceContextLoss();phase='disposed';return true;}
window.nativeP89Skirt=Object.freeze({getState,load,setPose,setView,toggleSkirt,trialNeutralRear,trialMeasuredAnatomyFit,trialRigidRegistration,auditWaistBoneAnchors,showOnlySourceRigidRegistration45,close});
try{await verifySource();await load('female');}catch(e){
 phase='error';const msg=String(e?.message||e).slice(0,250);
 errors.push(msg);status.textContent='Original-photo 2D fallback: '+msg+' · HOLD';
 window.nativeP89SkirtError=msg;
}
