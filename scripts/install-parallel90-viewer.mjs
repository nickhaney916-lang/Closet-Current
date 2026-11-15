/** Apply only to a disposable, immutable PR541 donor. No garment/rig edits. */
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const startupVariant90=process.env.P90_PROFILE_VARIANT||'candidate';
assert.ok(['baseline','candidate','restored'].includes(startupVariant90));
const emptyStartup90=startupVariant90==='candidate';
const bodyOriginalControl90=process.env.P90_BODY_BVH_CONTROL==='1';
assert.ok(!bodyOriginalControl90||startupVariant90==='candidate','BVH control requires same optimized viewer and source loader');
const donor=resolve(process.argv[2]||'.native05-donor-541');
assert.notEqual(donor,resolve('.'));
assert.equal(execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),'df6885d6011cb33fb22dceb81a08f35a0ac4dd61');
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'Pinned source anchor changed: '+a.slice(0,90));return s.replace(a,b);};
const panel=donor+'/research/outfit-3d-01/research-panel.mjs';
let s=await readFile(panel,'utf8');
s=replace(s,'createSourceTrueOutfit3D01Viewer} from', 'createSourceTrueOutfit3D01Viewer,OUTFIT3D_PINNED_SOURCE_SHA} from');
s=replace(s,'mountOutfit3D01Research({doc=document,auth=window.closetAuth}={})',
 'mountOutfit3D01Research({doc=document,auth=window.closetAuth,nativeTopSource90=null,nativeBottomEmpty90=false}={})');

s=replace(s,"[['Front','Front'],['Side','Side'],['Back','Back'],['Rotate','Rotate']]","[['Front','Front'],['Side','Side'],['Back','Back'],['Rotate','Auto rotate'],['Stop90','Pause rotation'],['Left90','Rotate left'],['Right90','Rotate right'],['ZoomIn90','Zoom in'],['ZoomOut90','Zoom out'],['Reset90','Reset view']]");
s=replace(s," left.append(views);body.append(left);",` left.append(views);
 const sourceNotice90=el('p','outfit3D01SourceNotice90');
 sourceNotice90.className='cc3d-note';
 sourceNotice90.setAttribute('aria-label','3D original photograph limitations');
 sourceNotice90.textContent='Original front photographs are authoritative. Side and rear garment details are not photograph-verified. Unsupported outfit pieces remain original-photo-only.';
 left.append(sourceNotice90);body.append(left);
 const originalPhotos90=el('button','outfit3D01Originals90','View original photos');
 originalPhotos90.type='button';
 originalPhotos90.setAttribute('aria-label','View original saved clothing photographs and photo-only fallback');
 views.append(originalPhotos90);
 originalPhotos90.onclick=()=>{
  try{
   current();
   if(!shown||!dialog.open)return;
   // Focus only the EXISTING owner-private photo gallery: no copy,
   // no new image URL, no 3D eligibility elevation or save operation.
   cards.tabIndex=-1;
   cards.setAttribute('role','region');
   cards.setAttribute('aria-label','Original saved clothing photographs');
   cards.focus({preventScroll:true});
   cards.scrollIntoView({block:'start',behavior:'auto'});
  }catch{clearPrivate();}
 };
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
 const pause90=views.querySelector('#outfit3D01Stop90');
 pause90.type='button';
 pause90.setAttribute('aria-label','Pause automatic avatar rotation without changing clothing');
 pause90.onclick=()=>{
  try{current();if(ready&&scene)scene.setSpin(false);}
  catch{clearPrivate();}
 };
 dialog.addEventListener('keydown',e=>{
  if(e.target!==canvas)return;
  const key={ArrowLeft:'Left90',ArrowRight:'Right90','+':'ZoomIn90','=':'ZoomIn90','-':'ZoomOut90',Home:'Reset90'}[e.key];
  if(key){e.preventDefault();command90(key);}
 });`);
// M20: source-pinned viewer only. Respect owner operating-system reduced
// motion without weakening any manual orbit/source-photo controls.
s=replace(s,` doc.getElementById('outfit3D01Rotate').onclick=()=>{
  try{current();if(ready)scene.setSpin(true);}catch{clearPrivate();}
 };`,` const reducedMotion90=doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')||null;
 const onReducedMotion90=()=>{
  if(!reducedMotion90?.matches||!ready||!scene)return;
  try{
   current();
   scene.setSpin(false);
   putStatus('Reduced motion preference: automatic rotation paused. Manual 3D rotation is available.');
  }catch{clearPrivate();}
 };
 reducedMotion90?.addEventListener?.('change',onReducedMotion90);
 doc.getElementById('outfit3D01Rotate').onclick=()=>{
  try{
   current();
   if(!ready||!scene)return;
   if(reducedMotion90?.matches){
    scene.setSpin(false);
    putStatus('Reduced motion preference: automatic rotation paused. Manual 3D rotation is available.');
   }else scene.setSpin(true);
  }catch{clearPrivate();}
 };`);
s=replace(s,"  window.removeEventListener('pagehide',change);",
 `  window.removeEventListener('pagehide',change);
  reducedMotion90?.removeEventListener?.('change',onReducedMotion90);`);
s=replace(s,"    geometries:view.geometries||0,textures:view.textures||0,frames:view.frames||0,",`    startup90:{...startupTimings90,...view.startup90},
    renderStages90:rendered?.renderStages90||null,
    sceneApplyStages90:view.applyStages90||null,
    sceneShirtStages90:view.outfit?.shirtBuildStages90||null,
    contactEvidence90:view.outfit?.shirt?.poseTriangleContact?{
     beforeCount:view.outfit.shirt.poseTriangleContact.before?.count??null,
     afterCount:view.outfit.shirt.poseTriangleContact.after?.count??null,
     steps:view.outfit.shirt.poseTriangleContact.steps,
     correctedVertices:view.outfit.shirt.poseTriangleContact.correctedVertices,
     maximumWorldCorrection:view.outfit.shirt.poseTriangleContact.maximumWorldCorrection
    }:null,
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
// M22: a missing WebGL2 device is not "still verifying" after the source
// donor correctly falls back to original photographs. Subsequent native
// saved-outfit UI updates must preserve the specific NO-GPU fallback reason;
// a new owner load or privacy cleanup must reset the failure state.
s=replace(s,' function update(){',
 ' let lastGraphicsFailure90=null;\\n function update(){'.replaceAll('\\n','\n'));
s=replace(s,"  if(!ready||!presenter){putStatus('Private wardrobe ready; verifying 3D. Original photographs remain available.');return;}",
 "  if(!ready||!presenter){putStatus(lastGraphicsFailure90?'Original-photo/2D fallback: '+lastGraphicsFailure90:'Private wardrobe ready; verifying 3D. Original photographs remain available.');return;}");
s=replace(s,"  putStatus('Loading actual photographed source candidates and anatomical rig…');",
 "  lastGraphicsFailure90=null;putStatus('Loading actual photographed source candidates and anatomical rig…');");
s=replace(s,"   putStatus('Original-photo/2D fallback: '+String(e.message||e));",
 "   lastGraphicsFailure90=String(e.message||e);putStatus('Original-photo/2D fallback: '+lastGraphicsFailure90);");
s=replace(s,' function clearPrivate(){',
 ' function clearPrivate(){\\n  lastGraphicsFailure90=null;'.replaceAll('\\n','\n'));
await writeFile(panel,s);
const showroom=donor+'/research/dress-mobile-01/dress-mobile-showroom.mjs';
s=await readFile(showroom,'utf8');
// Only the native research panel opts out of throwaway neutral pants.
// Legacy showroom callers retain their original default.
s=replace(s,'premiumTurntable67=false}={}){','premiumTurntable67=false,emptyStartup90=false}={}){');
s=replace(s,' const load=async kind=>{',' let startup90=null;\n const load=async kind=>{');
s=replace(s,"  installOpeningSkinAttribute(selected);outfit.setOutfit('pants');syncOutfit();reapDetachedGarmentGeometries();shade(lastColor);front();",
 "  installOpeningSkinAttribute(selected);const bootStart90=performance.now();\n  const initialMode90=emptyStartup90===true?'none':'pants';outfit.setOutfit(initialMode90);\n  const initialGarmentMs=performance.now()-bootStart90,initialGarmentMeshes=outfit.getState().garmentMeshes;\n  syncOutfit();reapDetachedGarmentGeometries();shade(lastColor);front();\n  startup90={initialMode:initialMode90,initialGarmentMs,initialGarmentMeshes,totalLoadMs:performance.now()-began};");
s=replace(s,'getState:()=>({kind:current,','getState:()=>({startup90,applyStages90,kind:current,');
// P90 M8 diagnostic only: split the existing photographed-garment
// applyOutfit() call into exactly its original ordered phases, without
// simplifying/skipping CPU skinning, textures, resource reclamation or draw.
s=replace(s," const applyOutfit=(mode,candidate,options={})=>{if(!selected||finish)throw Error('Loaded figure required');spin=false;group.rotation.y=0;const s=outfit.setOutfit(mode,candidate,options);sourcePhotoSampling=mode.includes('shirt')&&crispSourcePhotoClarity?configureOriginalPhotoSampling(selected,renderer,{enabled:true}):null;syncOutfit();reapDetachedGarmentGeometries();draw();return s;};",
 ` let applyStages90=null;
 const applyOutfit=(mode,candidate,options={})=>{
  if(!selected||finish)throw Error('Loaded figure required');
  const began90=performance.now();
  spin=false;group.rotation.y=0;
  const s=outfit.setOutfit(mode,candidate,options);
  const fitted90=performance.now();
  sourcePhotoSampling=mode.includes('shirt')&&crispSourcePhotoClarity?configureOriginalPhotoSampling(selected,renderer,{enabled:true}):null;
  const sampling90=performance.now();
  syncOutfit();reapDetachedGarmentGeometries();
  const reclaimed90=performance.now();
  draw();
  const finished90=performance.now();
  applyStages90=Object.freeze({mode,setOutfitMs:fitted90-began90,
   samplingMs:sampling90-fitted90,cleanupMs:reclaimed90-sampling90,
   drawMs:finished90-reclaimed90,totalMs:finished90-began90});
  return s;
 };`);
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
// Flush residual OrbitControls damping before an explicit camera command.
// Otherwise a former touch/pointer inertia can move the real camera after a
// reset or when an owner navigates to the original-photo gallery.
s=replace(s,' const front=()=>{group.rotation.y=0;',` const clearCameraInertia90=()=>{
  if(!premiumTurntable67)return;
  const savedDamping=controls.enableDamping;
  controls.enableDamping=false;
  controls.update();
  controls.enableDamping=savedDamping;
 };
 const front=()=>{clearCameraInertia90();spin=false;group.rotation.y=0;`);
s=replace(s,'const side=()=>{group.rotation.y=0;','const side=()=>{clearCameraInertia90();group.rotation.y=0;');
s=replace(s,'const back=()=>{group.rotation.y=0;','const back=()=>{clearCameraInertia90();group.rotation.y=0;');
s=replace(s,' const rotate=degrees=>{',' const rotate=degrees=>{\\n  clearCameraInertia90();'.replaceAll('\\n','\n'));
s=replace(s,'{radius:4.25,elevation:0});else{camera.position.set(0,1.04,4.25);',"{radius:Math.max(4.25,1.25/(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect))),elevation:0});else{camera.position.set(0,1.04,4.25);");
s=replace(s,'const side=()=>{clearCameraInertia90();group.rotation.y=0;','const side=()=>{clearCameraInertia90();spin=false;group.rotation.y=0;');
s=replace(s,'const back=()=>{clearCameraInertia90();group.rotation.y=0;','const back=()=>{clearCameraInertia90();spin=false;group.rotation.y=0;');
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
// Instrument real photo-derived presentation without changing geometry,
// UVs, skinned weights, source capabilities or owner/session admission.
s=replace(s,"   viewer.applyOutfit('dress',sources.dress,{reviewed:true});",
 "   const applyStart90=performance.now();viewer.applyOutfit('dress',sources.dress,{reviewed:true});\n   const applyMs90=performance.now()-applyStart90;");
s=replace(s,"return Object.freeze({...decision,actualMode:'dress',meshCount:actual.garmentMeshes,reusedRenderer:false});",
 "return Object.freeze({...decision,actualMode:'dress',meshCount:actual.garmentMeshes,reusedRenderer:false,\n    renderStages90:Object.freeze({kind:'dress',prepareMs:0,applyMs:applyMs90})});");
s=replace(s,"  const prepared=prepareIndexedGarmentsFor3D(indexedPlan,{",
 "  const prepareStart90=performance.now();\n  const prepared=prepareIndexedGarmentsFor3D(indexedPlan,{");
s=replace(s,"  if(prepared.status!=='source-bound-3d-ready-for-provisional-preview')",
 "  const prepareMs90=performance.now()-prepareStart90;\n  if(prepared.status!=='source-bound-3d-ready-for-provisional-preview')");
s=replace(s,"  const receipt=applyIndexed3DSelection(viewer,prepared,{checkCurrentSession:now});",
 "  const applyStart90=performance.now();\n  const receipt=applyIndexed3DSelection(viewer,prepared,{checkCurrentSession:now});\n  const applyMs90=performance.now()-applyStart90;");
s=replace(s,"   genuinePhotoSHA256s:receipt.originalPhotoSHA256s,reusedRenderer:false});",
 "   genuinePhotoSHA256s:receipt.originalPhotoSHA256s,reusedRenderer:false,\n   renderStages90:Object.freeze({kind:decision.mode,prepareMs:prepareMs90,applyMs:applyMs90})});");
await writeFile(sourceViewer,s);
// M9 source-preserving shirt-stage timings apply ONLY inside the pinned
// disposable original PR541 research controller. The exact original
// garment method calls/order, error behavior, source integrity and
// geometric output remain unchanged. No production code is patched.
const sourceOutfitController=donor+'/research/dress-mobile-01/dress-outfit-controller.mjs';
s=await readFile(sourceOutfitController,'utf8');
s=replace(s," let contact=null;"," let shirtBuildStages90=null;\n let contact=null;");
s=replace(s,"const summarize=()=>({mode,pose,changes,slots:Object.keys(parts),garmentMeshes","const summarize=()=>({mode,pose,changes,shirtBuildStages90,slots:Object.keys(parts),garmentMeshes");
s=replace(s,"  let builtContact=null;const held=all(parts).map","  let builtContact=null;const shirtClock90=Object.create(null);\n  const timeShirt90=(stage,run)=>{const t=performance.now();try{return run();}finally{shirtClock90[stage]=(shirtClock90[stage]||0)+(performance.now()-t);}};\n  const held=all(parts).map");
s=replace(s,"  contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts=built;mode=next;contact=builtContact;changes++;return summarize();","  contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts=built;mode=next;contact=builtContact;changes++;shirtBuildStages90=Object.freeze({...shirtClock90});return summarize();");
s=replace(s," function dispose(){if(closed)return;contact?.dispose();"," function dispose(){if(closed)return;shirtBuildStages90=null;contact?.dispose();");
s=replace(s,"built.shirt=attachReviewedShirt(root,candidate,{acknowledged:reviewed,pose:'source',improved:true})","built.shirt=timeShirt90(\"attach\",()=>attachReviewedShirt(root,candidate,{acknowledged:reviewed,pose:'source',improved:true}))");
s=replace(s,"built.shirt=protectShirtShoulders(built.shirt,shoulders)","built.shirt=timeShirt90(\"shoulders\",()=>protectShirtShoulders(built.shirt,shoulders))");
s=replace(s,"built.shirt=protectShirtCuffClearance(built.shirt,root)","built.shirt=timeShirt90(\"cuffClearance\",()=>protectShirtCuffClearance(built.shirt,root))");
s=replace(s,"built.shirt=finishInnerCuffs(built.shirt,root)","built.shirt=timeShirt90(\"innerCuffs\",()=>finishInnerCuffs(built.shirt,root))");
s=replace(s,"built.shirt=bridgeSourceCuffHem(built.shirt,root)","built.shirt=timeShirt90(\"cuffBridge\",()=>bridgeSourceCuffHem(built.shirt,root))");
s=replace(s,"built.shirt=fitContinuousShirt(built.shirt,root)","built.shirt=timeShirt90(\"continuousFit\",()=>fitContinuousShirt(built.shirt,root))");
s=replace(s,"built.shirt=finishNecklineAndSeams(built.shirt,root)","built.shirt=timeShirt90(\"neckSeams\",()=>finishNecklineAndSeams(built.shirt,root))");
s=replace(s,"built.shirt=drapeOriginalPhotographedShirtTorso(built.shirt)","built.shirt=timeShirt90(\"torsoDrape\",()=>drapeOriginalPhotographedShirtTorso(built.shirt))");
s=replace(s,"built.shirt=constructShirtPanels(hangSleevePanels(relaxShirtSidePanels(built.shirt),root))","built.shirt=timeShirt90(\"panelsAndSleeves\",()=>constructShirtPanels(hangSleevePanels(relaxShirtSidePanels(built.shirt),root)))");
s=replace(s,"built.shirt=tailorOriginalShirtShoulderSleeves(built.shirt,root)","built.shirt=timeShirt90(\"shoulderTailor\",()=>tailorOriginalShirtShoulderSleeves(built.shirt,root))");
s=replace(s,"built.shirt=constructIndependentShoulderCaps(built.shirt,root)","built.shirt=timeShirt90(\"shoulderCaps\",()=>constructIndependentShoulderCaps(built.shirt,root))");
s=replace(s,"built.shirt=reprofileIndependentShoulderSilhouette(built.shirt,root)","built.shirt=timeShirt90(\"shoulderContour\",()=>reprofileIndependentShoulderSilhouette(built.shirt,root))");
s=replace(s,"built.shirt=tailorIndependentUpperArmVolume(built.shirt,root)","built.shirt=timeShirt90(\"upperArm\",()=>tailorIndependentUpperArmVolume(built.shirt,root))");
s=replace(s,"built.shirt=shapeSourceNeutralCollarRoll(built.shirt,root)","built.shirt=timeShirt90(\"collarRoll\",()=>shapeSourceNeutralCollarRoll(built.shirt,root))");
s=replace(s,"built.shirt=easeSourceNeutralRearFabric(built.shirt,root)","built.shirt=timeShirt90(\"rearRelief\",()=>easeSourceNeutralRearFabric(built.shirt,root))");
s=replace(s,"built.shirt=roundRealShoulderSleeveCrest(built.shirt,root)","built.shirt=timeShirt90(\"crest\",()=>roundRealShoulderSleeveCrest(built.shirt,root))");
s=replace(s,"built.shirt=hangPhotographedSleeveCloth(built.shirt,root)","built.shirt=timeShirt90(\"sleeveHang\",()=>hangPhotographedSleeveCloth(built.shirt,root))");
s=replace(s,"built.shirt=fitPhotographedShirtSideFlow(built.shirt,root)","built.shirt=timeShirt90(\"sideFlow\",()=>fitPhotographedShirtSideFlow(built.shirt,root))");
s=replace(s,"built.shirt=easePhotographedShoulderFall(built.shirt,root)","built.shirt=timeShirt90(\"shoulderFall\",()=>easePhotographedShoulderFall(built.shirt,root))");
s=replace(s,"built.shirt=slopeTruePhotographedShoulderTop(built.shirt,root)","built.shirt=timeShirt90(\"shoulderTop\",()=>slopeTruePhotographedShoulderTop(built.shirt,root))");
// M10 no-functional-change timing of previously unaccounted original pose,
// contact, skeleton validation and transactional release. All original
// functions still execute in exactly the original order and source scope.
s=replace(s,"const timeShirt90=(stage,run)=>{const t=performance.now();try{return run();}finally{shirtClock90[stage]=(shirtClock90[stage]||0)+(performance.now()-t);}};","const timeShirt90=(stage,run)=>{if(!next.includes('shirt'))return run();const t=performance.now();try{return run();}finally{shirtClock90[stage]=(shirtClock90[stage]||0)+(performance.now()-t);}};");
s=replace(s,"held.forEach(({mesh})=>mesh.removeFromParent());setFashionPose(root,'source');","timeShirt90('detachPrevious',()=>held.forEach(({mesh})=>mesh.removeFromParent()));timeShirt90('poseSource',()=>setFashionPose(root,'source'));");
s=replace(s,"const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)skeletons.add(o.skeleton);});\n   if(!all(built).every(m=>skeletons.has(m.skeleton)))throw Error('Garment skeleton mismatch');","timeShirt90('skeletonValidate',()=>{const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)skeletons.add(o.skeleton);});\n   if(!all(built).every(m=>skeletons.has(m.skeleton)))throw Error('Garment skeleton mismatch');});");
s=replace(s,"if(independentGarments&&built.shirt){builtContact=poseConditionedSleeveDrape?createPoseConditionedSleeveContact(root,built.shirt,built.pants,poseContactFactory):poseContactFactory(root,built.shirt,built.pants);setFashionPose(root,pose);builtContact.fit(pose);}","if(independentGarments&&built.shirt){builtContact=timeShirt90('contactCreate',()=>poseConditionedSleeveDrape?createPoseConditionedSleeveContact(root,built.shirt,built.pants,poseContactFactory):poseContactFactory(root,built.shirt,built.pants));timeShirt90('contactPose',()=>setFashionPose(root,pose));timeShirt90('contactFit',()=>builtContact.fit(pose));}");
s=replace(s,"finally{setResearchPose(root,pose);}","finally{timeShirt90('poseRestore',()=>setResearchPose(root,pose));}");
s=replace(s,"contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts=built;mode=next;contact=builtContact;changes++;shirtBuildStages90=Object.freeze({...shirtClock90});return summarize();","timeShirt90('previousRelease',()=>{contact?.dispose();Object.values(parts).forEach(g=>g.dispose());});parts=built;mode=next;contact=builtContact;changes++;shirtBuildStages90=Object.freeze({...shirtClock90});return summarize();");
await writeFile(sourceOutfitController,s);
// M11 candidate-only BVH reuse on the exact pinned original posed cloth
// solver. The BODY is immutable within one pose-contact fit: its BVH is
// constructed once per fit rather than for each of the existing 12+final
// actual triangle crossing checks. Garment BVH and every collision test,
// original pose, outward correction, rollback and reported contacts remain.
const posedContact90=donor+'/research/three-d-42/posed-contact.mjs';
s=await readFile(posedContact90,'utf8');
// Fail closed if the immutable donor removed the actual iterative collision solver.
assert.ok(s.includes('for(let pass=0;pass<12;pass++)'));
assert.ok(s.includes('if(!c.count)'));
if(startupVariant90==='candidate'&&!bodyOriginalControl90){
 s=replace(s,"export function triangleContacts(a,b,{collect=false}={}){","export function triangleContacts(a,b,{collect=false,bodyTree90=null}={}){");
 s=replace(s,"const ba=new MeshBVH(a),bb=new MeshBVH(b),line=","const ba=new MeshBVH(a),bb=bodyTree90||new MeshBVH(b),line=");
 s=replace(s,"const began=performance.now();restore(base);const body=posedGeometry(bodies),groups=new Map(),membership=new Map();","const began=performance.now();restore(base);const body=posedGeometry(bodies),bodyTree90=new MeshBVH(body.g),groups=new Map(),membership=new Map();");
 s=replace(s,"const current=posedGeometry(meshes),c=triangleContacts(current.g,body.g,{collect:true});","const current=posedGeometry(meshes),c=triangleContacts(current.g,body.g,{collect:true,bodyTree90});");
 s=replace(s,"const current=posedGeometry(meshes);after=triangleContacts(current.g,body.g,{collect:true});","const current=posedGeometry(meshes);after=triangleContacts(current.g,body.g,{collect:true,bodyTree90});");
}
await writeFile(posedContact90,s);
// Check independent actual triangle intersections against the single-body-BVH candidate.
if(startupVariant90==='candidate'&&!bodyOriginalControl90)execFileSync(process.execPath,['scripts/check-parallel90-contact-bvh.mjs',donor],{stdio:'inherit'});
console.log('P90 disposable PR541 viewer controls installed; source garments and rigs unchanged');
