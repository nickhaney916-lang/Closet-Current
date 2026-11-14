/** Apply only to a disposable, immutable PR541 donor. No garment/rig edits. */
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const donor=resolve(process.argv[2]||'.native05-donor-541');
assert.notEqual(donor,resolve('.'));
assert.equal(execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),'df6885d6011cb33fb22dceb81a08f35a0ac4dd61');
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'Pinned source anchor changed: '+a.slice(0,90));return s.replace(a,b);};
const panel=donor+'/research/outfit-3d-01/research-panel.mjs';
let s=await readFile(panel,'utf8');
s=replace(s,"[['Front','Front'],['Side','Side'],['Back','Back'],['Rotate','Rotate']]","[['Front','Front'],['Side','Side'],['Back','Back'],['Rotate','Auto rotate'],['Left90','Rotate left'],['Right90','Rotate right'],['ZoomIn90','Zoom in'],['ZoomOut90','Zoom out'],['Reset90','Reset view']]");
s=replace(s," left.append(views);body.append(left);",` left.append(views);body.append(left);
 const style90=el('style');style90.textContent='.cc3d-controls{display:flex;flex-wrap:wrap;gap:4px}.cc3d-controls button{min-width:44px;min-height:44px;flex:1 1 25%;touch-action:manipulation}.cc3d-viewer canvas:focus-visible{outline:3px solid #155db4}';dialog.append(style90);
 canvas.tabIndex=0;
 canvas.setAttribute('aria-label','3D anatomical outfit. Drag to rotate. Arrow keys rotate, plus and minus zoom, Home resets. Rear photograph unverified.');
 const command90=action=>{
  try{current();if(!ready||!scene)return;
   scene.setSpin(false);
   if(action==='Reset90')scene.resetView();
   else if(action==='ZoomIn90')scene.zoom(.9);
   else if(action==='ZoomOut90')scene.zoom(1/.9);
   else scene.rotate(scene.getState().viewAngle+(action==='Left90'?-15:15));
  }catch{clearPrivate();}
 };
 for(const action of ['Left90','Right90','ZoomIn90','ZoomOut90','Reset90'])
  doc.getElementById('outfit3D01'+action).onclick=()=>command90(action);
 dialog.addEventListener('keydown',e=>{
  if(e.target!==canvas)return;
  const key={ArrowLeft:'Left90',ArrowRight:'Right90','+':'ZoomIn90','=':'ZoomIn90','-':'ZoomOut90',Home:'Reset90'}[e.key];
  if(key){e.preventDefault();command90(key);}
 });`);
s=replace(s,"    geometries:view.geometries||0,textures:view.textures||0,frames:view.frames||0,",`    camera90:{angle:view.viewAngle,distance:view.cameraDistance,position:view.cameraPosition,target:view.cameraTarget,loadMs:view.loadMs,lastRenderMs:view.lastRenderMs,pixelRatio:view.pixelRatio,drawPixels:view.drawPixels},
    geometries:view.geometries||0,textures:view.textures||0,frames:view.frames||0,`);
// Reopened canvases must retain keyboard support too.
s=replace(s,"  canvas.replaceWith(fresh);canvas=fresh;","  fresh.tabIndex=0;canvas.replaceWith(fresh);canvas=fresh;");
await writeFile(panel,s);
const showroom=donor+'/research/dress-mobile-01/dress-mobile-showroom.mjs';
s=await readFile(showroom,'utf8');
// Bound horizontal orbit; keep existing authentic geometry/materials/UVs.
s=replace(s,' controls.minPolarAngle=.8;controls.maxPolarAngle=1.65;',' controls.minPolarAngle=Math.PI/2;controls.maxPolarAngle=Math.PI/2;');
s=replace(s,' if(premiumTurntable67)controls.addEventListener(\'start\',()=>{spin=false;dirty=true;});'," controls.addEventListener('start',()=>{spin=false;dirty=true;});");
// At narrow aspect, fixed distance crops arms. Fit the full 2m figure with
// margin horizontally and vertically; zoom remains a deliberate close-up.
s=replace(s,'  camera.aspect=width/height;camera.updateProjectionMatrix();',`  const nextAspect=width/height;
  const aspectChanged=Math.abs(camera.aspect-nextAspect)>.001;
  camera.aspect=nextAspect;camera.updateProjectionMatrix();
  if(aspectChanged&&premiumTurntable67){
   const fit=Math.max(4.25,1.25/(Math.tan(camera.fov*Math.PI/360)*Math.min(1,nextAspect)));
   controls.maxDistance=Math.max(6,fit*1.4);
   const offset=camera.position.clone().sub(controls.target).setLength(fit);
   camera.position.copy(controls.target).add(offset);controls.update();dirty=true;
  }`);
s=replace(s,' const front=()=>{group.rotation.y=0;'," const front=()=>{spin=false;group.rotation.y=0;");
s=replace(s,'{radius:4.25,elevation:0});else{camera.position.set(0,1.04,4.25);',"{radius:Math.max(4.25,1.25/(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect))),elevation:0});else{camera.position.set(0,1.04,4.25);");
s=replace(s,'const side=()=>{group.rotation.y=0;','const side=()=>{spin=false;group.rotation.y=0;');
s=replace(s,'const back=()=>{group.rotation.y=0;','const back=()=>{spin=false;group.rotation.y=0;');
for(const angle of [90,180])s=replace(s,'setAnatomicalCameraView(camera,controls,'+angle+', {radius:4.25,elevation:0})'.replace(', {',',{'),
 'setAnatomicalCameraView(camera,controls,'+angle+',{radius:Math.max(4.25,1.25/(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect))),elevation:0})');
await writeFile(showroom,s);
console.log('P90 disposable PR541 viewer controls installed; source garments and rigs unchanged');
