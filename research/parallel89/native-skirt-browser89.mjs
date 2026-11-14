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
import {posedSource84,countSourceContacts84}
 from '/p84/research/parallel84-real-photo-layers/source-bone-yoke-trial84.mjs';
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
 phase='loading',lastContact=null,shapeMeasured=null,lastRenderMs=0;
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
async function load(avatar){
 check(!!source&&!!image&&!!outline,'original public skirt not verified');
 check(Object.hasOwn(MODELS,avatar),'unsupported anatomical model');
 candidate?.dispose();candidate=null;
 if(root){scene.remove(root);root.traverse(o=>{
  if(o.isMesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(x=>x.dispose());else o.material?.dispose();}
 });root=null;}
 bodies=[];sourceBodies=[];contacts=[];lastContact=null;phase='loading';
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
 check(['source','blend-50','relaxed'].includes(mode),'unsupported real skeletal pose');
 setResearchPose(root,mode);pose=mode;
 root.updateMatrixWorld(true);
 originalBodyPositions();
 let sourceGeometry,bodyGeometry;
 try{
  sourceGeometry=posedSource84(candidate.meshes);
  bodyGeometry=posedSource84(bodies);
  const contact=countSourceContacts84(sourceGeometry.g,bodyGeometry.g);
  check(Number.isSafeInteger(contact.count)&&contact.count>=0&&
   Number.isFinite(contact.maxDepth),'real posed triangle BVH source/body contact invalid');
  const row=Object.freeze({avatar:current,pose:mode,
   sourceId:SKIRT_SOURCE89.id,realAnatomicalRigBones:163,
   sourceTrianglesAudited:candidate.receipt.triangleCount,
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
 contact:lastContact,contactSamples:contacts.length,
 nativeWebGL2:!!renderer.getContext()&&renderer.capabilities.isWebGL2,
 lastRenderMs,sourcePhoto2DFallbackRequired:true,
 ownerApproved:false,independentHumanPhotorealismApproved:false,
 continuousClothPhysicsCertified:false,physicalPhoneTested:false,
 consumer3DAdmission:false,releaseAuthorized:false,familyAlpha:'HOLD',
 errors:errors.length
});}
function close(){candidate?.dispose();candidate=null;scene.remove(root);root=null;
 renderer.dispose();renderer.forceContextLoss();phase='disposed';return true;}
window.nativeP89Skirt=Object.freeze({getState,load,setPose,setView,toggleSkirt,close});
try{await verifySource();await load('female');}catch(e){
 phase='error';const msg=String(e?.message||e).slice(0,250);
 errors.push(msg);status.textContent='Original-photo 2D fallback: '+msg+' · HOLD';
 window.nativeP89SkirtError=msg;
}
