/**
 * Native Three.js + locally served GLTFLoader; no CDN, paid AI or user accounts.
 * Load genuinely anatomical, CC0 163-joint human A-pose GLBs.
 * Work61: one atomic outfit controller for verified shirt, neutral pants and dress.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createOutfitController} from './outfit-controller.mjs';
import {installOpeningSkinAttribute} from '../three-d-26/contact-presentation.mjs';
import {configureOriginalPhotoSampling,originalSourceDisplayPixelRatio} from '../three-d-58/crisp-original-source-rendering.mjs';
const ALLOWED=Object.freeze({
 male:{file:'male-cc0-rigged.glb',title:'Anatomical mannequin A'},
 female:{file:'female-cc0-rigged.glb',title:'Anatomical mannequin B'}
});
const COLORS=Object.freeze({porcelain:0xc3bdb5,slate:0x777f84});
export function mountAnatomicalShowroom(canvas,{onChange=()=>{},refineFit=true,enableCuffFix=true,enableCuffFacing=true,enableCuffBridge=true,naturalFit=true,necklineSeams=true,dressNeckline=true,dressAnatomy=true,dressContact=true,skirtDrape=true,registeredNeckline=true,naturalPantsDrape=true,posteriorJeansFairing=true,structuralPantsEnvelope=true,independentJeansLoft=true,crotchSeatPanel=true,sourceShirtWaistFit=true,clothWaistContact=true,shirtHangingSilhouette=true,denimHangingSilhouette=true,jeansPanelFall=false,independentGarments=false,poseContactFactory=null,tailoredShoulderSleeves=false,independentShoulderCaps=false,realisticShoulderContour=false,upperArmFabricVolume=false,sourceNeutralCollarRoll=false,rearShirtFabricRelief=false,naturalShoulderSleeveTransition=false,sourceMeasuredSleeveHang=false,poseConditionedSleeveDrape=false,crispSourcePhotoClarity=false}={}){
 if(!canvas||typeof canvas.getContext!=='function')throw Error('Canvas required');
 // Baseline comparison imports the untouched verified renderer.
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,
  powerPreference:'low-power',preserveDrawingBuffer:true});
 renderer.setPixelRatio(originalSourceDisplayPixelRatio(window.devicePixelRatio||1,{enabled:crispSourcePhotoClarity}));
 renderer.setClearColor(0xf4f3ef);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.02;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xf4f3ef);
 const camera=new THREE.PerspectiveCamera(34,1,.03,100);
 camera.position.set(0,1.11,4.65);
 const controls=new OrbitControls(camera,canvas);
 controls.enableDamping=true;controls.dampingFactor=.09;
 controls.enablePan=false;controls.minDistance=2.5;controls.maxDistance=6;
 controls.minPolarAngle=.8;controls.maxPolarAngle=1.65;
 controls.target.set(0,1.04,0);
 controls.enableZoom=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0xa7b8bb,1.35));
 const key=new THREE.DirectionalLight(0xfff3e5,2.8);
 key.position.set(-2.4,5.2,4);scene.add(key);
 const rim=new THREE.DirectionalLight(0xd8e7ff,1.8);
 rim.position.set(3,2.6,-3);scene.add(rim);
 {const fill=new THREE.DirectionalLight(0xe8f1ec,1.0);fill.position.set(3,2,3);scene.add(fill);}
 const floor=new THREE.Mesh(new THREE.CircleGeometry(1.25,64),
  new THREE.MeshBasicMaterial({color:0xe7e8e1}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.012;scene.add(floor);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.62,64),
  new THREE.MeshBasicMaterial({color:0x777e7d,transparent:true,opacity:.11,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=-.010;shadow.scale.set(1.35,.55,1);
 scene.add(shadow);
 {const c=document.createElement("canvas");c.width=c.height=128;const ctx=c.getContext("2d"),g=ctx.createRadialGradient(64,64,3,64,64,64);g.addColorStop(0,"rgba(37,47,41,.4)");g.addColorStop(.45,"rgba(37,47,41,.13)");g.addColorStop(1,"rgba(37,47,41,0)");ctx.fillStyle=g;ctx.fillRect(0,0,128,128);shadow.material.map=new THREE.CanvasTexture(c);shadow.material.color.set(0xffffff);shadow.material.opacity=.8;shadow.material.needsUpdate=true;}
 const group=new THREE.Group();scene.add(group);
 let selected=null,current='female',finish=false,loading=0,
  lastColor='porcelain',lastStats=null,spin=false,frame=0,pose='relaxed',started=false,dirty=true,lastTime=0;
 const dressPresentation={value:0};
 const loadTimes=[];let lastRenderMs=0,outfit=null,poseChanges=0,sourcePhotoSampling=null;
 const loader=new GLTFLoader();
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.dataset.context='lost';});
 canvas.addEventListener('webglcontextrestored',()=>{canvas.dataset.context='ready';dirty=true;});
 const resize=()=>{
  const b=canvas.getBoundingClientRect();
  const width=Math.max(1,Math.floor(b.width||500)),height=Math.max(1,Math.floor(b.height||670));
  if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio())){renderer.setSize(width,height,false);dirty=true;}
  camera.aspect=width/height;camera.updateProjectionMatrix();
 };
 const shade=skin=>{
  if(!Object.hasOwn(COLORS,skin))throw Error('Unknown matte mannequin finish');
  lastColor=skin;
  if(selected)selected.traverse(obj=>{
   if(obj.isMesh&&!obj.userData.work56Garment){
    // A uniform opaque clay material avoids emitting personal likeness or
    // inadvertently loading a source-specific photograph into an avatar.
    if(obj.userData.ownedMaterial)obj.material.dispose();
    const material=new THREE.MeshStandardMaterial({color:COLORS[skin],
     metalness:0,roughness:.82,side:THREE.DoubleSide});
    // Source body meshes are unclothed anatomical references. In this
    // family-facing fashion research preview, apply a simple neutral matte
    // athletic base layer directly in the shader, following the REAL
    // anatomical mesh surface without extra cylindrical garment geometry.
    // This is only a mannequin privacy/modesty layer, NOT clothing fitting.
    material.onBeforeCompile=shader=>{
     shader.uniforms.uDressPresentation=dressPresentation;
     shader.vertexShader=shader.vertexShader.replace('void main() {',
      'attribute vec3 studioRestPosition;attribute float dressOpeningSkin;\n'+'varying vec3 vStudioBody;varying float vOpeningSkin;\nvoid main() {');
     shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvStudioBody=studioRestPosition;vOpeningSkin=dressOpeningSkin;');
     shader.fragmentShader=shader.fragmentShader.replace('void main() {',
      'varying vec3 vStudioBody;varying float vOpeningSkin;uniform float uDressPresentation;\nvoid main() {');
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
       float torso= smoothstep(1.10,1.14,vStudioBody.y)*
        (1.0-smoothstep(1.64,1.67,vStudioBody.y))*
        (1.0-smoothstep(.24,.29,abs(vStudioBody.x)));
       float shorts= smoothstep(.74,.78,vStudioBody.y)*
        (1.0-smoothstep(1.10,1.14,vStudioBody.y))*
        (1.0-smoothstep(.29,.38,abs(vStudioBody.x)));
       float baseCoverage=clamp(torso*(1.0-uDressPresentation*vOpeningSkin)+shorts,0.0,1.0);
       vec3 neutralCloth=vec3(.075,.115,.10);
       diffuseColor.rgb=mix(diffuseColor.rgb,neutralCloth,baseCoverage);
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
  const t=performance.now();renderer.render(scene,camera);lastRenderMs=performance.now()-t;frame++;dirty=false;
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
 const load=async kind=>{
  if(finish||!Object.hasOwn(ALLOWED,kind))throw Error('Unknown mannequin source');
  outfit?.setOutfit('none');dressPresentation.value=0;spin=false;group.rotation.y=0;
  const token=++loading;
  const began=performance.now();
  const url=new URL('../three-d-06/models/'+ALLOWED[kind].file,import.meta.url).href;
  let gltf;
  try{gltf=await loader.loadAsync(url);}catch(e){throw Error('Local CC0 body unavailable: '+String(e.message||e));}
  if(finish||token!==loading){gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(x=>x.dispose());}});return false;}
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
  if(selected){outfit?.dispose();const skeletons=new Set();selected.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});skeletons.forEach(s=>s.dispose());group.remove(selected);selected.traverse(o=>{
   if(o.isMesh){o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose();}
  });}
  selected=obj;group.add(selected);current=kind;lastStats=stats;sourcePhotoSampling=null;
  {
   selected.updateMatrixWorld(true);
   outfit=createOutfitController(selected,{refineFit,enableCuffFix,enableCuffFacing,enableCuffBridge,naturalFit,necklineSeams,dressNeckline,dressAnatomy,dressContact,skirtDrape,registeredNeckline,naturalPantsDrape,posteriorJeansFairing,structuralPantsEnvelope,independentJeansLoft,crotchSeatPanel,sourceShirtWaistFit,clothWaistContact,shirtHangingSilhouette,denimHangingSilhouette,jeansPanelFall,independentGarments,poseContactFactory,tailoredShoulderSleeves,independentShoulderCaps,realisticShoulderContour,upperArmFabricVolume,sourceNeutralCollarRoll,rearShirtFabricRelief,naturalShoulderSleeveTransition,sourceMeasuredSleeveHang,poseConditionedSleeveDrape});outfit.setPose(pose);
  }
  canvas.dataset.pose=pose;loadTimes.push(performance.now()-began);
  installOpeningSkinAttribute(selected);outfit.setOutfit('pants');syncOutfit();shade(lastColor);front();
  canvas.dataset.model=kind;
  canvas.dataset.bones=String(stats.bones);
  canvas.dataset.skinnedMeshes=String(stats.skinned);
  canvas.dataset.triangles=String(stats.triangles);
  canvas.dataset.license='CC0-1.0';
  onChange({kind,stats,localModel:true,releaseAuthorized:false});
  return true;
 };
 const front=()=>{group.rotation.y=0;camera.position.set(0,1.04,4.25);controls.target.set(0,1.04,0);controls.update();draw();};
 const side=()=>{group.rotation.y=0;camera.position.set(4.25,1.04,0);controls.target.set(0,1.04,0);controls.update();draw();};
 const back=()=>{group.rotation.y=0;camera.position.set(0,1.04,-4.25);controls.target.set(0,1.04,0);controls.update();draw();};
 const rotate=degrees=>{
  if(!Number.isFinite(degrees))throw Error('Invalid camera angle');
  group.rotation.y=0;
  const a=degrees*Math.PI/180,r=Math.hypot(camera.position.x,camera.position.z);
  camera.position.set(Math.sin(a)*r,1.1,Math.cos(a)*r);controls.update();draw();
 };
 const frameLoop=time=>{
  if(finish||!started)return;
  const changed=controls.update();
  // Cap auto-spin at 30fps; idle renders stop while controls stay responsive.
  if(spin&&time-lastTime>33){group.rotation.y+=.012;dirty=true;lastTime=time;}
  resize();if(changed||dirty)draw();
  window.requestAnimationFrame(frameLoop);
 };
 const start=()=>{if(started||finish)return;started=true;resize();draw();window.requestAnimationFrame(frameLoop);};
 controls.addEventListener('change',()=>{dirty=true;});
 const setPose=mode=>{if(!selected)return;spin=false;group.rotation.y=0;outfit.setPose(mode);pose=mode;canvas.dataset.pose=mode;poseChanges++;draw();};
 const zoom=direction=>{const offset=camera.position.clone().sub(controls.target);const length=THREE.MathUtils.clamp(offset.length()*direction,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(length));controls.update();draw();};
 document.addEventListener('visibilitychange',()=>{dirty=true;});
 const syncOutfit=()=>{const s=outfit?.getState();dressPresentation.value=dressContact&&s?.mode==='dress'?1:0;canvas.dataset.outfit=s?.mode||'none';canvas.dataset.shirt=s?.shirt?'source-reviewed':'none';canvas.dataset.pants=s?.pants?'neutral-research':'none';canvas.dataset.dress=s?.dress?'source-reviewed':'none';};
 const applyOutfit=(mode,candidate,options={})=>{if(!selected||finish)throw Error('Loaded figure required');spin=false;group.rotation.y=0;const s=outfit.setOutfit(mode,candidate,options);sourcePhotoSampling=mode.includes('shirt')&&crispSourcePhotoClarity?configureOriginalPhotoSampling(selected,renderer,{enabled:true}):null;syncOutfit();draw();return s;};
 const stop=()=>{outfit?.dispose();syncOutfit();finish=true;loading++;controls.dispose();
  if(selected){outfit?.dispose();const skeletons=new Set();selected.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);if(o.isMesh){o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose();}});skeletons.forEach(s=>s.dispose());}
  floor.geometry.dispose();floor.material.dispose();
  shadow.geometry.dispose();shadow.material.map?.dispose();shadow.material.dispose();renderer.dispose();};
 const inspectSleeves=(angle='front')=>{
  if(!['front','side','back','left-arm','right-arm'].includes(angle))throw Error('Unsupported fabric view');
  spin=false;group.rotation.y=0;
  if(angle.endsWith('-arm')){const x=angle==='left-arm'?.40:-.40;controls.minDistance=1.35;controls.target.set(x,1.23,0);camera.position.set(x,1.23,1.35);}
  else{controls.minDistance=1.9;controls.target.set(0,1.35,0);camera.position.set(angle==='side'?1.9:0,1.35,angle==='front'?1.9:angle==='back'?-1.9:0);}
  controls.update();draw();
 };
 return {load,shade,front,side,back,rotate,start,stop,setPose,zoom,applyOutfit,inspectSleeves,
  setSpin:v=>{spin=!!v;dirty=true;},
  getState:()=>({kind:current,loaded:!!selected,finish,stats:lastStats,frames:frame,finishMaterial:lastColor,pose:pose,loadMs:loadTimes.at(-1),lastRenderMs,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelRatio:renderer.getPixelRatio(),drawPixels:canvas.width*canvas.height,sourceDetailRendering:{enabled:crispSourcePhotoClarity,renderPixelRatio:renderer.getPixelRatio(),maxPixelRatio:2,materialCount:sourcePhotoSampling?.materialCount||0,configuredSamplers:sourcePhotoSampling?.configuredSamplers||0,sourceImages:sourcePhotoSampling?.images||[],originalPhotosAndColorsUnchanged:true,humanVisualApproved:false,releaseAuthorized:false},cameraDistance:camera.position.distanceTo(controls.target),outfit:outfit?.getState()||null,dressPresentation:dressPresentation.value,poseChanges,releaseAuthorized:false})
 };
}
