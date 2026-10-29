/**
 * Native Three.js + locally served GLTFLoader; no CDN, paid AI or user accounts.
 * Load genuinely anatomical, CC0 163-joint human A-pose GLBs.
 * NO garment rig transfer or true clothing fit is claimed here.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {requireAnatomicalShirtPreview} from '../three-d-07/rig-shirt-transfer.mjs';
import {buildAnatomicalGarmentShell} from '../three-d-08/rigged-shirt-shell.mjs';
const ALLOWED=Object.freeze({
 male:{file:'male-cc0-rigged.glb',title:'Anatomical mannequin A'},
 female:{file:'female-cc0-rigged.glb',title:'Anatomical mannequin B'}
});
const COLORS=Object.freeze({porcelain:0xc3bdb5,slate:0x777f84});
export function mountAnatomicalShowroom(canvas,{onChange=()=>{}}={}){
 if(!canvas||typeof canvas.getContext!=='function')throw Error('Canvas required');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,
  powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 renderer.setClearColor(0xf4f3ef);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.13;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xf4f3ef);
 const camera=new THREE.PerspectiveCamera(34,1,.03,100);
 camera.position.set(0,1.11,4.65);
 const controls=new OrbitControls(camera,canvas);
 controls.enableDamping=true;controls.dampingFactor=.09;
 controls.enablePan=false;controls.minDistance=2.2;controls.maxDistance=7.5;
 controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI-.35;
 controls.target.set(0,1.04,0);
 controls.enableZoom=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0xa7b8bb,2.6));
 const key=new THREE.DirectionalLight(0xfff3e5,3.8);
 key.position.set(-2.4,5.2,4);scene.add(key);
 const rim=new THREE.DirectionalLight(0xd8e7ff,2.5);
 rim.position.set(3,2.6,-3);scene.add(rim);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(1.25,64),
  new THREE.MeshBasicMaterial({color:0xd5d9d5}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.012;scene.add(floor);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.62,64),
  new THREE.MeshBasicMaterial({color:0x777e7d,transparent:true,opacity:.11,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=-.010;shadow.scale.set(1.35,.55,1);
 scene.add(shadow);
 const group=new THREE.Group();scene.add(group);
 let selected=null,current='female',finish=false,loading=0,
  lastColor='porcelain',lastStats=null,spin=false,frame=0;
 const loader=new GLTFLoader();
 let clothTexture=null,clothSource=null,actualShirtShell=null;
 const clothUniforms={
  uVerifiedShirt:{value:0},uVerifiedTexture:{value:null},
  uVerifiedCrop:{value:new THREE.Vector4(0,0,1,1)},
  uVerifiedColor:{value:new THREE.Color(0x1e1e1e)}
 };
 const clearShirt=()=>{
  if(actualShirtShell){actualShirtShell.dispose();actualShirtShell=null;}
  clothSource=null;clothUniforms.uVerifiedShirt.value=0;
  clothUniforms.uVerifiedTexture.value=null;
  if(clothTexture)clothTexture.dispose();clothTexture=null;
  canvas.dataset.shirt='none';canvas.dataset.photoSource='';canvas.dataset.shellMeshes='0';
  canvas.dataset.silhouette='none';
  draw();
 };
 const resize=()=>{
  const b=canvas.getBoundingClientRect();
  const width=Math.max(240,Math.floor(b.width||500)),height=Math.max(320,Math.floor(b.height||670));
  renderer.setSize(width,height,false);
  camera.aspect=width/height;camera.updateProjectionMatrix();
 };
 const shade=skin=>{
  if(!Object.hasOwn(COLORS,skin))throw Error('Unknown matte mannequin finish');
  lastColor=skin;
  if(selected)selected.traverse(obj=>{
   if(obj.isMesh){
    if(obj.userData.garmentShell)return;
    // A uniform opaque clay material avoids emitting personal likeness or
    // inadvertently loading a source-specific photograph into an avatar.
    if(obj.userData.ownedMaterial)obj.material.dispose();
    const material=new THREE.MeshStandardMaterial({color:COLORS[skin],
     metalness:0,roughness:.77,side:THREE.DoubleSide});
    // Source body meshes are unclothed anatomical references. In this
    // family-facing fashion research preview, apply a simple neutral matte
    // athletic base layer directly in the shader, following the REAL
    // anatomical mesh surface without extra cylindrical garment geometry.
    // This is only a mannequin privacy/modesty layer, NOT clothing fitting.
    material.onBeforeCompile=shader=>{
     shader.vertexShader=shader.vertexShader.replace('void main() {',
      'varying vec3 vStudioBody;\nvarying float vStudioFacing;\nvoid main() {');
     shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvStudioBody=(modelMatrix*vec4(transformed,1.0)).xyz;\nvStudioFacing=dot(normalize(mat3(modelMatrix)*transformedNormal),vec3(0.,0.,1.));');
     shader.uniforms.uVerifiedShirt=clothUniforms.uVerifiedShirt;
     shader.uniforms.uVerifiedTexture=clothUniforms.uVerifiedTexture;
     shader.uniforms.uVerifiedCrop=clothUniforms.uVerifiedCrop;
     shader.uniforms.uVerifiedColor=clothUniforms.uVerifiedColor;
     shader.fragmentShader=shader.fragmentShader.replace('void main() {',
      'varying vec3 vStudioBody;\nvarying float vStudioFacing;\nuniform float uVerifiedShirt;\nuniform sampler2D uVerifiedTexture;\nuniform vec4 uVerifiedCrop;\nuniform vec3 uVerifiedColor;\nvoid main() {');
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
       float torso= smoothstep(1.10,1.14,vStudioBody.y)*
        (1.0-smoothstep(1.52,1.57,vStudioBody.y))*
        (1.0-smoothstep(.28,.37,abs(vStudioBody.x)));
       float shorts= smoothstep(.74,.78,vStudioBody.y)*
        (1.0-smoothstep(1.10,1.14,vStudioBody.y))*
        (1.0-smoothstep(.29,.38,abs(vStudioBody.x)));
       float baseCoverage=clamp(torso+shorts,0.0,1.0);
       vec3 neutralCloth=vec3(.19,.26,.24);
       diffuseColor.rgb=mix(diffuseColor.rgb,neutralCloth,baseCoverage);
       if(uVerifiedShirt>0.5) {
        // This is a body-surface preview, NOT tailored or simulated clothing.
        // Keep the unverified back/outer sleeves source-median black. Only the
        // front torso may display Work47 original-RGB transparent pixels.
        float halfWidth=abs(vStudioBody.x);
        float sleeveShirt=smoothstep(1.11,1.17,vStudioBody.y)*
         (1.0-smoothstep(1.52,1.62,vStudioBody.y))*
         (1.0-smoothstep(.61,.72,halfWidth));
        diffuseColor.rgb=mix(diffuseColor.rgb,uVerifiedColor,sleeveShirt);
        vec2 p=vec2(.5+vStudioBody.x/.73,
          (vStudioBody.y-1.12)/.49);
        vec2 uv=vec2(uVerifiedCrop.x+p.x*uVerifiedCrop.z,
           1.0-uVerifiedCrop.y-uVerifiedCrop.w+p.y*uVerifiedCrop.w);
        if(p.x>=0.0&&p.x<=1.0&&p.y>=0.0&&p.y<=1.0) {
         vec4 sourcePixel=texture2D(uVerifiedTexture,uv);
         float frontOnly=max(smoothstep(.015,.09,vStudioBody.z),smoothstep(.17,.61,vStudioFacing));
         float chestOnly=(1.0-smoothstep(.28,.365,halfWidth))*
          smoothstep(1.12,1.18,vStudioBody.y)*
          (1.0-smoothstep(1.51,1.58,vStudioBody.y));
         float alpha=sourcePixel.a*frontOnly*chestOnly;
         diffuseColor.rgb=mix(diffuseColor.rgb,sourcePixel.rgb,alpha);
        }
       }
      `);
    };
    obj.material=material;
    obj.userData.ownedMaterial=true;
   }
  });
  draw();return lastColor;
 };
 function draw(){
  if(finish)return;
  resize();
  controls.update();
  renderer.render(scene,camera);frame++;
  canvas.dataset.frames=String(frame);
  canvas.dataset.rotation=String(camera.position.x.toFixed(3));
 }
 const inspect=root=>{
  let meshCount=0,skinned=0,bones=0,triangles=0;
  root.traverse(o=>{
   if(o.isSkinnedMesh){skinned++;bones=Math.max(bones,o.skeleton?.bones?.length||0);}
   if(o.isMesh){
    meshCount++;
    const g=o.geometry;
    triangles+=g.index?Math.floor(g.index.count/3):Math.floor(g.attributes.position.count/3);
   }
  });
  if(skinned<1||bones<25||triangles<10000)
   throw Error('Downloaded GLB has no usable anatomical skinned human');
  return {meshCount,skinned,bones,triangles};
 };
 const applyShirt=(candidate,{acknowledged=false}={})=>{
  if(!selected||finish)throw Error('A verified rigged humanoid must load first');
  const source=requireAnatomicalShirtPreview(candidate,{acknowledged});
  const tex=new THREE.Texture(source.textureImage);
  tex.colorSpace=THREE.SRGBColorSpace;tex.flipY=true;
  tex.wrapS=THREE.ClampToEdgeWrapping;tex.wrapT=THREE.ClampToEdgeWrapping;
  tex.needsUpdate=true;
  clearShirt();
  clothTexture=tex;clothSource=source;
  clothUniforms.uVerifiedShirt.value=1;
  clothUniforms.uVerifiedTexture.value=clothTexture;
  const [l,t,w,h]=source.cropRect;
  clothUniforms.uVerifiedCrop.value.set(l,t,w,h);
  clothUniforms.uVerifiedColor.value.setRGB(...source.baseColor,THREE.SRGBColorSpace);
  canvas.dataset.shirt='source-reviewed';
  canvas.dataset.photoSource=source.id;
  draw();
  return {status:'research-preview',id:source.id,sourceSHA256:source.sourceSHA256,
   anatomicalSurface:true,realGarmentGeometry:false,
   humanVisualApproval:false,releaseAuthorized:false};
 };
 const applyShirtShell=(candidate,{acknowledged=false}={})=>{
  if(!selected||finish)throw Error('Verified anatomical CC0 rig must load before adding photographed shell');
  const source=requireAnatomicalShirtPreview(candidate,{acknowledged});
  clearShirt();
  actualShirtShell=buildAnatomicalGarmentShell(selected,source);
  clothSource=source;
  canvas.dataset.shirt='separate-rigged-shell';
  canvas.dataset.photoSource=source.id;
  canvas.dataset.shellMeshes=String(actualShirtShell.meshes.length);
  canvas.dataset.silhouette='relaxed';
  draw();
  return Object.freeze({status:'research-preview',id:source.id,
   sourceSHA256:source.sourceSHA256,realGarmentGeometry:true,
   separateSkinnedShell:true,actualTailoredFit:false,
   inferredRear:true,humanVisualApproval:false,releaseAuthorized:false});
 };
 const setShirtSilhouette=relaxed=>{
  if(!actualShirtShell)throw Error('Source-reviewed garment shell required');
  if(typeof relaxed!=='boolean')throw Error('Silhouette mode must be boolean');
  actualShirtShell.setRelaxed(relaxed);
  canvas.dataset.silhouette=relaxed?'relaxed':'close-fit';
  draw();
  return {mode:canvas.dataset.silhouette,sourceStillVerified:!!clothSource,
   claimOfFabricSimulation:false};
 };
 const load=async kind=>{
  if(finish||!Object.hasOwn(ALLOWED,kind))throw Error('Unknown mannequin source');
  const token=++loading;
  // Resolve bundled CC0 assets relative to this module, not to the hosting
  // research page (the 3D-07 photographed garment page lives elsewhere).
  const url=new URL('./models/'+ALLOWED[kind].file,import.meta.url).href;
  let gltf;
  try{gltf=await loader.loadAsync(url);}catch(e){throw Error('Local CC0 body unavailable: '+String(e.message||e));}
  if(finish||token!==loading)return false;
  const obj=gltf.scene,stats=inspect(obj);
  // Normalize known original A-poses to a common world-space 2m stature;
  // this is a display scale, not a user's measurements.
  obj.updateMatrixWorld(true);
  const bbox=new THREE.Box3().setFromObject(obj);
  const size=bbox.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<.5||size.y>3.5)throw Error('Unsafe body scale');
  const center=bbox.getCenter(new THREE.Vector3());
  const scale=2.0/size.y;obj.scale.multiplyScalar(scale);
  obj.position.set(-center.x*scale,-bbox.min.y*scale,-center.z*scale);
  if(selected){group.remove(selected);selected.traverse(o=>{
   if(o.isMesh&&o.userData.ownedMaterial)o.material.dispose();
  });}
  clearShirt();
  selected=obj;group.add(selected);current=kind;lastStats=stats;
  shade(lastColor);front();
  canvas.dataset.model=kind;
  canvas.dataset.bones=String(stats.bones);
  canvas.dataset.skinnedMeshes=String(stats.skinned);
  canvas.dataset.triangles=String(stats.triangles);
  canvas.dataset.license='CC0-1.0';
  onChange({kind,stats,localModel:true,releaseAuthorized:false});
  return true;
 };
 const front=()=>{camera.position.set(0,1.1,4.65);controls.target.set(0,1.04,0);controls.update();draw();};
 const side=()=>{camera.position.set(4.65,1.1,0);controls.target.set(0,1.04,0);controls.update();draw();};
 const back=()=>{camera.position.set(0,1.1,-4.65);controls.target.set(0,1.04,0);controls.update();draw();};
 const rotate=degrees=>{
  if(!Number.isFinite(degrees))throw Error('Invalid camera angle');
  const a=degrees*Math.PI/180,r=Math.hypot(camera.position.x,camera.position.z);
  camera.position.set(Math.sin(a)*r,1.1,Math.cos(a)*r);controls.update();draw();
 };
 const frameLoop=()=>{
  if(finish)return;
  if(spin)group.rotation.y+=.005;
  controls.update();renderer.render(scene,camera);
  frame++;canvas.dataset.frames=String(frame);
  window.requestAnimationFrame(frameLoop);
 };
 const start=()=>{resize();window.requestAnimationFrame(frameLoop);};
 const stop=()=>{clearShirt();finish=true;loading++;controls.dispose();
  if(selected)selected.traverse(o=>{if(o.isMesh&&o.userData.ownedMaterial)o.material.dispose();});
  floor.geometry.dispose();floor.material.dispose();
  shadow.geometry.dispose();shadow.material.dispose();renderer.dispose();};
 return {load,shade,front,side,back,rotate,start,stop,applyShirt,applyShirtShell,clearShirt,setShirtSilhouette,
  setSpin:v=>{spin=!!v;},
  getState:()=>({kind:current,loaded:!!selected,finish,stats:lastStats,frames:frame,finishMaterial:lastColor,photoSource:clothSource?.id||null,shellMeshes:actualShirtShell?.meshes.length||0,silhouette:actualShirtShell?.relaxed?'relaxed':actualShirtShell?'close-fit':'none'})
 };
}
