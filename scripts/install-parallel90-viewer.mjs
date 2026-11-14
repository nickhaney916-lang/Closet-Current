/** Apply only to a disposable, immutable PR541 donor. No garment/rig edits. */
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const startupVariant90=process.env.P90_PROFILE_VARIANT||'candidate';
assert.ok(['baseline','candidate','restored'].includes(startupVariant90));
const emptyStartup90=startupVariant90==='candidate';
const donor=resolve(process.argv[2]||'.native05-donor-541');
assert.notEqual(donor,resolve('.'));
assert.equal(execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),'df6885d6011cb33fb22dceb81a08f35a0ac4dd61');
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'Pinned source anchor changed: '+a.slice(0,90));return s.replace(a,b);};
const panel=donor+'/research/outfit-3d-01/research-panel.mjs';
let s=await readFile(panel,'utf8');
s=replace(s,'createSourceTrueOutfit3D01Viewer} from', 'createSourceTrueOutfit3D01Viewer,OUTFIT3D_PINNED_SOURCE_SHA} from');
s=replace(s,'mountOutfit3D01Research({doc=document,auth=window.closetAuth}={})',
 'mountOutfit3D01Research({doc=document,auth=window.closetAuth,nativeTopSource90=null,nativeBottomEmpty90=false}={})');

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
  views.querySelector('#outfit3D01'+action).onclick=()=>command90(action);
 dialog.addEventListener('keydown',e=>{
  if(e.target!==canvas)return;
  const key={ArrowLeft:'Left90',ArrowRight:'Right90','+':'ZoomIn90','=':'ZoomIn90','-':'ZoomOut90',Home:'Reset90'}[e.key];
  if(key){e.preventDefault();command90(key);}
 });`);
s=replace(s,"    geometries:view.geometries||0,textures:view.textures||0,frames:view.frames||0,",`    startup90:{...startupTimings90,...view.startup90},
    garmentSources90:{dress:view.outfit?.dress?.sourceSHA256||null,shirt:view.outfit?.shirt?.sourceSHA256||null,pants:view.outfit?.pants?.sourceSHA256||null},
    camera90:{angle:view.viewAngle,distance:view.cameraDistance,position:view.cameraPosition,target:view.cameraTarget,loadMs:view.loadMs,lastRenderMs:view.lastRenderMs,pixelRatio:view.pixelRatio,drawPixels:view.drawPixels},
    geometries:view.geometries||0,textures:view.textures||0,frames:view.frames||0,`);
// Instrument actual source loading / scene setup without photo bytes.
s=replace(s,' let scene=null,sources=null,presenter=null,ready=false,shown=false,dead=false,lock=Promise.resolve(),loadSerial=0,rendered=null,modelLoads=0;',
 ' const startupTimings90={sourceLoadMs:0,sceneSetupMs:0,presentMs:0};\n let scene=null,sources=null,presenter=null,ready=false,shown=false,dead=false,lock=Promise.resolve(),loadSerial=0,rendered=null,modelLoads=0;');
s=replace(s,'sources=await loadVettedOutfit3D01Sources();still();',
 'const sourceStart90=performance.now();sources=await loadVettedOutfit3D01Sources({dressOnly90:'+emptyStartup90+'&&nativeTopSource90===OUTFIT3D_PINNED_SOURCE_SHA.dress,shirtOnly90:'+emptyStartup90+'&&nativeTopSource90===OUTFIT3D_PINNED_SOURCE_SHA.shirt,singleShirtBundle90:'+emptyStartup90+'&&nativeTopSource90===OUTFIT3D_PINNED_SOURCE_SHA.shirt&&nativeBottomEmpty90===true});still();startupTimings90.sourceLoadMs=performance.now()-sourceStart90;startupTimings90.loadedDenimBundles=sources.bundles.length;');
s=replace(s,'   scene=mountAnatomicalShowroom(canvas,{',
 '   const sceneStart90=performance.now();\n   scene=mountAnatomicalShowroom(canvas,{emptyStartup90:'+emptyStartup90+',');
s=replace(s,"   scene.applyOutfit('none');modelLoads++;",
 "   scene.applyOutfit('none');modelLoads++;startupTimings90.sceneSetupMs=performance.now()-sceneStart90;");
s=replace(s,'   const actual=presenter.present(plan);rendered=actual;',
 '   const presentStart90=performance.now();const actual=presenter.present(plan);startupTimings90.presentMs+=performance.now()-presentStart90;rendered=actual;');
// Reopened canvases must retain keyboard support too.
s=replace(s,"  canvas.replaceWith(fresh);canvas=fresh;","  fresh.tabIndex=0;fresh.setAttribute('aria-label',canvas.getAttribute('aria-label')||'3D anatomical outfit');canvas.replaceWith(fresh);canvas=fresh;");
await writeFile(panel,s);
const showroom=donor+'/research/dress-mobile-01/dress-mobile-showroom.mjs';
s=await readFile(showroom,'utf8');
// Only the native research panel opts out of throwaway neutral pants.
// Legacy showroom callers retain their original default.
s=replace(s,'premiumTurntable67=false}={}){','premiumTurntable67=false,emptyStartup90=false}={}){');
s=replace(s,' const load=async kind=>{',' let startup90=null;\n const load=async kind=>{');
s=replace(s,"  installOpeningSkinAttribute(selected);outfit.setOutfit('pants');syncOutfit();reapDetachedGarmentGeometries();shade(lastColor);front();",
 "  installOpeningSkinAttribute(selected);const bootStart90=performance.now();\n  const initialMode90=emptyStartup90===true?'none':'pants';outfit.setOutfit(initialMode90);\n  const initialGarmentMs=performance.now()-bootStart90,initialGarmentMeshes=outfit.getState().garmentMeshes;\n  syncOutfit();reapDetachedGarmentGeometries();shade(lastColor);front();\n  startup90={initialMode:initialMode90,initialGarmentMs,initialGarmentMeshes,totalLoadMs:performance.now()-began};");
s=replace(s,'getState:()=>({kind:current,','getState:()=>({startup90,kind:current,');
// Bound horizontal orbit; keep existing authentic geometry/materials/UVs.
// OrbitControls defaults to touch-action:none, trapping vertical page swipes
// over the avatar. Preserve horizontal drag rotation and native pan-y scrolling.
s=replace(s,' const controls=new OrbitControls(camera,canvas);',
 " const controls=new OrbitControls(camera,canvas);\n controls.domElement.style.touchAction='pan-y';");
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
const sourceViewer=donor+'/research/outfit-3d-01/source-true-viewer.mjs';
s=await readFile(sourceViewer,'utf8');
s=replace(s,'loadVettedOutfit3D01Sources(){','loadVettedOutfit3D01Sources({dressOnly90=false,shirtOnly90=false,singleShirtBundle90=false}={}){');
// Symmetric demand-loading: when the native verified top SHA is the pinned
// shirt, skip only unused public dress manifest/cutout preparation. No fake
// source-capability placeholder, no private asset caching, no new admission.
s=replace(s," const manifestResponse=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'});",
` if(dressOnly90&&shirtOnly90)throw Error('Mutually exclusive P90 source loading hints');
 if(singleShirtBundle90&&!shirtOnly90)throw Error('Unverified single-shirt source hint');
 let dress=null;
 if(!shirtOnly90){
 const manifestResponse=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'});`);
s=replace(s," const dress=await loadLicensedCutout('commons-0053',{manifest,reviewConfirmed:true});",
 " dress=await loadLicensedCutout('commons-0053',{manifest,reviewConfirmed:true});");
s=replace(s," if(dress.sourceSHA256!==DRESS_SHA||!dress.realFabricTexture)throw Error('Pinned original dress source invalid');",
 " if(dress.sourceSHA256!==DRESS_SHA||!dress.realFabricTexture)throw Error('Pinned original dress source invalid');\n }");
s=replace(s,'!sources?.dress||!Array.isArray(sources?.bundles)',
 '(sources?.dress==null&&sources?.bundles?.length===0)||!Array.isArray(sources?.bundles)');
s=replace(s,'if(!dressPiece||dressPiece.originalSHA256!==sources.dress.sourceSHA256)',
 'if(!sources.dress||!dressPiece||dressPiece.originalSHA256!==sources.dress.sourceSHA256)');
// Only if the already admitted saved outfit truly contains NO bottom slot,
// the native research shirt uses the FIRST independently validated denim
// bundle to supply its original pinned shirt capability. Any selected bottom,
// legacy donor or unverified top retains the full two-bundle source path.
s=replace(s,"  for(const denim of ['public','second']){",
 "  for(const denim of singleShirtBundle90?['public']:['public','second']){");
s=replace(s,' const bundles=[];',` // A loading hint can only reduce available canonical public sources.
 // It never bypasses actual selected-source/owner admission in present().
 if(dressOnly90===true)return Object.freeze({dress,bundles:Object.freeze([]),
  dispose(){},releaseAuthorized:false,source:'locked-licensed-original-photographs'});
 const bundles=[];`);
await writeFile(sourceViewer,s);
console.log('P90 disposable PR541 viewer controls installed; source garments and rigs unchanged');
