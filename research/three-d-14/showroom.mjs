/** Experimental male/female CC0 skinned anatomy with separately skinned real dress. */
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {buildSourceDress} from './dress-shell.mjs';
const MODELS={female:'female-cc0-rigged.glb',male:'male-cc0-rigged.glb'};
export function mountDressStudio(canvas,{onChange=()=>{}}={}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.setClearColor(0xf4f3ef);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new T.Scene();scene.background=new T.Color(0xf4f3ef);
 scene.add(new T.HemisphereLight(0xffffff,0x839e9c,2));
 const key=new T.DirectionalLight(0xfff4dd,3);key.position.set(-3,5,4);scene.add(key);
 const fill=new T.DirectionalLight(0xd9e5ff,2);fill.position.set(3,3,-3);scene.add(fill);
 const camera=new T.PerspectiveCamera(33,1,.03,100);
 camera.position.set(0,1.07,4.1);
 const orbit=new OrbitControls(camera,canvas);orbit.enablePan=false;orbit.enableDamping=true;
 orbit.minDistance=2.5;orbit.maxDistance=6;orbit.target.set(0,1.05,0);
 const display=new T.Group();scene.add(display),loader=new GLTFLoader();
 let body=null,garment=null,token=0,stopped=false,mode='female',pose='relaxed',frames=0,active=false;
 const resize=()=>{const r=canvas.getBoundingClientRect(),w=Math.max(260,Math.floor(r.width)),h=Math.max(320,Math.floor(r.height));
  if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();};
 const render=()=>{if(stopped)return;resize();orbit.update();renderer.render(scene,camera);frames++;canvas.dataset.frames=String(frames);};
 const tick=()=>{if(stopped)return;const moved=orbit.update();if(moved||active)render();requestAnimationFrame(tick);};
 const clearDress=()=>{if(garment){garment.dispose();garment=null;}canvas.dataset.dress='none';render();};
 const load=async kind=>{
  if(!Object.hasOwn(MODELS,kind)||stopped)throw Error('Unknown anatomical model');
  const t=++token;clearDress();canvas.dataset.ready='false';
  const url=new URL('../three-d-06/models/'+MODELS[kind],import.meta.url).href;
  const gltf=await loader.loadAsync(url);
  if(stopped||t!==token)return false;
  const obj=gltf.scene;
  obj.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(obj),size=bounds.getSize(new T.Vector3());
  if(!Number.isFinite(size.y)||size.y<.5||size.y>3.5)throw Error('Unsafe CC0 rig dimensions');
  const center=bounds.getCenter(new T.Vector3()),factor=2/size.y;
  obj.scale.multiplyScalar(factor);obj.position.set(-center.x*factor,-bounds.min.y*factor,-center.z*factor);
  obj.updateMatrixWorld(true);
  let skinned=0,bones=0;
  obj.traverse(o=>{if(o.isSkinnedMesh){skinned++;bones=Math.max(bones,o.skeleton.bones.length);
   o.material=new T.MeshStandardMaterial({color:0x8a9699,roughness:.85,side:T.DoubleSide});
   o.userData.dressStudioMat=true;}});
  if(skinned<1||bones<100)throw Error('Only verified original rigged humans');
  if(body){display.remove(body);body.traverse(o=>{if(o.userData.dressStudioMat)o.material.dispose();});}
  body=obj;display.add(body);mode=kind;setFashionPose(body,pose);
  canvas.dataset.model=kind;canvas.dataset.bones=String(bones);
  canvas.dataset.ready='true';canvas.dataset.dress='none';render();
  onChange({mode:kind,bones,sourceLocked:true,releaseAuthorized:false});return true;
 };
 const apply=(source,{reviewed=false}={})=>{
  if(!body||stopped)throw Error('Verified anatomical CC0 body not loaded');
  clearDress();setFashionPose(body,'source');
  try{garment=buildSourceDress(body,source,{reviewed});}
  finally{setFashionPose(body,pose);}
  canvas.dataset.dress=garment.stats.sourceId;
  canvas.dataset.dressTriangles=String(garment.stats.triangles);
  canvas.dataset.sharedSkeleton=String(garment.stats.sharedSkeleton);
  render();return garment.stats;
 };
 const setPose=p=>{if(!['source','relaxed'].includes(p))throw Error('Unknown pose');
  pose=p;if(body)setFashionPose(body,pose);canvas.dataset.pose=pose;render();};
 const view=angle=>{const a=angle*Math.PI/180;camera.position.set(4.15*Math.sin(a),1.07,4.15*Math.cos(a));
  orbit.target.set(0,1.05,0);orbit.update();render();};
 const start=()=>{if(active)return;active=true;tick();};
 const stop=()=>{stopped=true;active=false;token++;clearDress();orbit.dispose();
  if(body)body.traverse(o=>{if(o.userData.dressStudioMat)o.material.dispose();});
  renderer.dispose();};
 return {load,apply,clearDress,setPose,view,start,stop,render,
  getState:()=>({mode,pose,frames,dress:garment?.stats||null,ready:!!body})};
}
