/** PHOTO-FIT-3D-02: real new source JPEG + genuine skinned 163-bone figures.
 * Browser-driven isolated research viewer, not a production/owner write path.
 */
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RED_SHIRT,verifyRedSourceBytes,deriveRedShirtCutout} from './source-shirt.mjs';
import {buildSourceSpecificRedShirt22} from './source-fit.mjs';

const canvas=document.getElementById('stage'),status=document.getElementById('status');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,
  powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
const scene=new T.Scene();scene.background=new T.Color(0xf5f5f2);
const camera=new T.PerspectiveCamera(34,1,.03,100);
const orbit=new OrbitControls(camera,canvas);
orbit.enableDamping=false;orbit.enablePan=false;
orbit.minDistance=2.7;orbit.maxDistance=6;
orbit.target.set(0,1.05,0);
scene.add(new T.HemisphereLight(0xffffff,0xb0c6bf,2.1));
const sunlight=new T.DirectionalLight(0xffffff,2.9);sunlight.position.set(-2,5,4);scene.add(sunlight);
const rim=new T.DirectionalLight(0xe4eaf5,1.8);rim.position.set(2.5,2.7,-3);scene.add(rim);
const pedestal=new T.Mesh(new T.CircleGeometry(1,64),
 new T.MeshStandardMaterial({color:0xdce2df,roughness:1}));
pedestal.rotation.x=-Math.PI/2;pedestal.position.y=-.015;scene.add(pedestal);
const container=new T.Group();scene.add(container);
const loader=new GLTFLoader();
let original=null,source=null,root=null,shirt=null,kind=null,angle=0,frame=0;
const diagnostic={errors:[],releaseAuthorized:false,physicalPhonesVerified:false,
  humanVisualApproval:false,originalJPEGMustRemainUnchanged:true};
const maxPixels=2600000;
function repaint(){
 const bounds=canvas.getBoundingClientRect();
 const w=Math.max(240,Math.round(bounds.width||320)),h=Math.max(300,Math.round(bounds.height||430));
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 orbit.update();renderer.render(scene,camera);canvas.dataset.frames=String(++frame);
}
function view(degrees){
 if(![0,90,180,270].includes(degrees))throw Error('PHOTO22 only reviewed principal views allowed');
 angle=degrees;
 const rad=degrees*Math.PI/180;
 camera.position.set(Math.sin(rad)*4.15,1.13,Math.cos(rad)*4.15);
 orbit.target.set(0,1.06,0);camera.lookAt(orbit.target);
 for(const b of document.querySelectorAll('button[data-angle]')){
  b.setAttribute('aria-pressed',String(Number(b.dataset.angle)===degrees));
 }
 repaint();
}
const countRig=r=>{
 let bones=0,skinMeshes=0,bodyTriangles=0;
 r.traverse(n=>{if(n.isSkinnedMesh){skinMeshes++;bones=Math.max(bones,n.skeleton?.bones?.length||0);
 const g=n.geometry;bodyTriangles+=(g.index?.count||g.attributes.position?.count||0)/3;}});
 return {bones,skinMeshes,bodyTriangles};
};
async function verifyOneOriginal(){
 if(source)return source;
 const res=await fetch('/benchmark/fixtures/commons-0002.jpg',{cache:'no-store'});
 if(!res.ok)throw Error('PHOTO22 original JPEG unavailable');
 const bytes=new Uint8Array(await res.arrayBuffer());
 original=await verifyRedSourceBytes(bytes);
 const blob=new Blob([bytes],{type:'image/jpeg'}),url=URL.createObjectURL(blob);
 try{
  const image=new Image();image.src=url;await image.decode();
  if(image.naturalWidth*image.naturalHeight>maxPixels*7)
   throw Error('PHOTO22 excessive source pixel count');
  source=deriveRedShirtCutout(image);
  if(source.sourceSHA256!==original.sha256||
     source.contour.noRearPixels!==true||
     source.sourcePixelsCopiedWithoutRecolor!==true)
   throw Error('PHOTO22 attempted unverifiable new garment');
  canvas.dataset.photoSource=source.id;
  canvas.dataset.sha256=source.sourceSHA256;
  return source;
 }finally{URL.revokeObjectURL(url);}
}
async function load(model='female'){
 if(model!=='female'&&model!=='male')throw Error('PHOTO22 unapproved figure');
 await verifyOneOriginal();
 const modelPath='/donor/research/three-d-06/models/'+model+'-cc0-rigged.glb';
 const gltf=await loader.loadAsync(modelPath);
 const incoming=gltf.scene;const rig=countRig(incoming);
 if(rig.bones!==163||rig.skinMeshes<1||rig.bodyTriangles<10000)
  throw Error('PHOTO22 exact authenticated donor anatomical 163-bone skeleton unavailable');
 // Normalize the verified body exactly as the donor showroom does.
 incoming.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(incoming),size=bounds.getSize(new T.Vector3());
 const center=bounds.getCenter(new T.Vector3());
 if(size.y<.5||size.y>3.5)throw Error('PHOTO22 abnormal donor dimensions');
 const scale=2/size.y;incoming.scale.multiplyScalar(scale);
 incoming.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 incoming.updateMatrixWorld(true);
 incoming.traverse(n=>{if(n.isMesh){
  n.material=new T.MeshStandardMaterial({color:0xb4b7b1,roughness:.85,
   side:T.DoubleSide});n.userData.photo22Body=true;
 }});
 let tailored;
 try{tailored=buildSourceSpecificRedShirt22(incoming,source);}
 catch(e){incoming.traverse(n=>{if(n.isMesh&&n.userData.photo22Body)n.material.dispose();});throw e;}
 if(tailored.stats.skinBones!==163||tailored.stats.triangles<1000||
    tailored.stats.sourceSHA256!==RED_SHIRT.sha256||
    tailored.stats.sourceSpecificGeometry!==true)
  throw Error('PHOTO22 new real skinned source-specific material/geometry absent');
 if(shirt)shirt.dispose();
 if(root){root.traverse(n=>{if(n.userData.photo22Body)n.material.dispose();});container.remove(root);}
 root=incoming;shirt=tailored;kind=model;container.add(root);
 canvas.dataset.model=model;canvas.dataset.bones=String(rig.bones);
 canvas.dataset.independentMeshes=String(shirt.meshes.length);
 canvas.dataset.triangles=String(shirt.stats.triangles);
 canvas.dataset.neutralRear='true';
 document.getElementById('figure').value=model;
 view(angle);
 status.textContent=model+' real 163-bone figure · new '+RED_SHIRT.id+' photo-bound skinned shirt · RESEARCH HOLD';
 return getState();
}
function getState(){
 const gl=canvas.getContext('webgl2');
 return {loaded:!!root,kind,sourceId:RED_SHIRT.id,
   sourceSHA256:original?.sha256||null,sourceBytes:original?.byteLength||0,
   frontTextureFromActualJPEG:!!shirt?.stats.originalPhotoPreserved,
   originalUnchanged:original?.originalUnmodified===true,
   bones:root?countRig(root).bones:0,
   skinnedGarmentMeshes:shirt?.meshes.length||0,triangles:shirt?.stats.triangles||0,
   sourceSpecificGeometry:shirt?.stats.sourceSpecificGeometry===true,
   silhouette:source?.contour||null,neutralRear:shirt?.stats.neutralRear===true,
   angle,frames:frame,webgl2:!!gl&&String(gl.getParameter(gl.VERSION)).includes('WebGL'),
   noProductionMutation:true,noCloudMutation:true,noPhotoRewrite:true,
   humanVisualApproval:false,releaseAuthorized:false,physicalPhoneVerified:false};
}
for(const b of document.querySelectorAll('button[data-angle]'))
 b.addEventListener('click',()=>view(Number(b.dataset.angle)));
document.getElementById('figure').addEventListener('change',e=>
 load(e.target.value).catch(error=>{
  diagnostic.errors.push(error.message);status.textContent=error.message;
 }));
window.__photoFit22=Object.freeze({load,view,getState,diagnostic});
try{await load('female');window.__photoFit22Ready=true;}
catch(e){diagnostic.errors.push(String(e));status.textContent=String(e);window.__photoFit22Ready=false;}
