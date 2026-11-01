/** PARALLEL #8 — real licensed source, real anatomical WebGL, fail-closed mobile harness.
 * Completely separate from production/auth; does not fabricate wardrobe meshes.
 */
import {mountAnatomicalShowroom} from './mobile-showroom.mjs';
import {createPoseContact} from '../three-d-42/posed-contact.mjs';
import {planIndexedBoardToAnatomical3D} from '../three-d-68/saved-closet-3d-adapter.mjs';
import {loadSourceVetted3D69ResearchBundle} from '../three-d-69/sha-verified-original-garment-sources.mjs';
import {prepareIndexedGarmentsFor3D,applyIndexed3DSelection,VERIFIED_PUBLIC_SHIRT_SHA256} from '../three-d-69/index-to-real-garment-viewer.mjs';

if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
 throw Error('Research original-photograph 3D must remain localhost only');
const $=id=>document.getElementById(id);
const BUTTONS=['wear','swap','clear','front','side','back','turn','zin','zout'];
const SHAS=Object.freeze({public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'});
const session=Object.freeze({authenticated:true,ownerId:'non-user-licensed-mobile-3d-par08',generation:1});
const fixture=(id,category,itemType,color,sha)=>Object.freeze({id,ownerId:session.ownerId,
 sourceId:id,sourceSHA256:sha,category,itemType,color,originalOutfitGroup:id,
 sourceFrom:'locked-public-commons-research-fixture',garmentMeshVerified:true,
 sourcePhotoOriginal:true,ownerReviewed:true,photographic3DReconstructionApproved:false,releaseAuthorized:false});

let app=null,bundles=null,phase='loading',generation=0,changes=0,figureSwitches=0,
 swaps=0,restarts=0,selection='public',lastResult=null,disposed=false,contextHandler=null;
const memorySamples=[];
const status=(msg)=>{$('status').textContent=msg;$('status').dataset.phase=phase;};
const checked=()=>$('review').checked===true;
function controls(){
 const ready=phase==='ready';
 for(const id of BUTTONS)$(id).disabled=!ready;
 $('angle').disabled=!ready;
 $('wear').disabled=!ready||!checked();
 $('swap').disabled=!ready||!checked();
 $('retry').disabled=phase==='loading';
}
function fallback(show){
 $('fallback').dataset.visible=String(show);
 $('viewerHost').style.display=show?'none':'block';
}
function phaseSet(next,message){
 phase=next;status(message);controls();fallback(next==='error');
}
function sample(label){
 if(!app)return null;
 const state=app.getState();
 const result={label,phase,figure:state.kind,frames:state.frames,
  meshes:state.stats?.meshCount||0,bones:state.stats?.bones||0,
  geometries:state.geometries,textures:state.textures,
  pixelRatio:state.pixelRatio,drawPixels:state.drawPixels,
  renderMs:state.lastRenderMs,loadMs:state.loadMs,
  cameraDistance:state.cameraDistance,trackedGarmentGeometries:state.trackedGarmentGeometries,
  reclaimedGarmentGeometries:state.reclaimedGarmentGeometries,
  heapBytes:performance.memory?.usedJSHeapSize??null};
 memorySamples.push(result);
 if(memorySamples.length>150)memorySamples.shift();
 return result;
}
function stop(){
 generation++;
 if(contextHandler){
  $('avatar')?.removeEventListener('webglcontextlost',contextHandler);
  contextHandler=null;
 }
 if(app){
  try{app.stop();}catch(e){console.warn('Renderer dispose failure',e.message);}
  app=null;
 }
 if(bundles){
  for(const b of bundles)try{b?.dispose();}catch{}
  bundles=null;
 }
 lastResult=null;
}
function fail(err){
 const message=String(err?.message||err||'Unknown 3D error').slice(0,280);
 stop();
 phaseSet('error','3D unavailable: '+message+'. Original licensed photos / 2D reference remain accessible. Press Retry 3D.');
 $('evidence').textContent='No 3D claim; source identity must be reverified after retry. HOLD.';
}
function resetCanvas(){
 const old=$('avatar');
 const next=old.cloneNode(false);next.width=1;next.height=1;next.dataset.context='new';
 old.replaceWith(next);
}
function hasWebGL(){
 const probe=document.createElement('canvas');
 try{
  const gl=probe.getContext('webgl2',{failIfMajorPerformanceCaveat:false});
  if(!gl)return false;
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return true;
 }catch{return false;}
}
function outfitPlan(denim){
 if(!bundles||bundles.length!==2)throw Error('Both original-source denim licenses must be loaded');
 const [first,second]=bundles;
 const byId=new Map([
  ['licensed-shirt',fixture('licensed-shirt','Tops','T-shirt','Black',VERIFIED_PUBLIC_SHIRT_SHA256)],
  ['licensed-jeans-1',fixture('licensed-jeans-1','Bottoms','Jeans','Blue',first.pants.sourceSHA256)],
  ['licensed-jeans-2',fixture('licensed-jeans-2','Bottoms','Jeans','Blue',second.pants.sourceSHA256)]
 ]);
 return planIndexedBoardToAnatomical3D({slots:{top:'licensed-shirt',
  bottom:denim==='public'?'licensed-jeans-1':'licensed-jeans-2'}},
  Object.freeze({ownerId:session.ownerId,generation:session.generation,releaseAuthorized:false,byId}));
}
function applyDenim(denim){
 if(phase!=='ready'||!checked())throw Error('Source review and ready state required');
 const chosen=denim==='public'?bundles[0]:bundles[1];
 const prepared=prepareIndexedGarmentsFor3D(outfitPlan(denim),
  {shirtCandidate:chosen.shirt,pantsCandidate:chosen.pants});
 if(prepared.status!=='source-bound-3d-ready-for-provisional-preview')
  throw Error('Only verified original photo/skinned clothing may render');
 const applied=applyIndexed3DSelection(app,prepared,{checkCurrentSession:()=>session});
 if(applied.anatomicalSkeletonBones!==163||applied.real3DSkinnedGarmentMeshes<2||
    applied.originalPhotoSHA256s.bottom!==SHAS[denim]||
    applied.originalPhotoSHA256s.top!==VERIFIED_PUBLIC_SHIRT_SHA256||
    applied.releaseAuthorized!==false)throw Error('Source identity or skeleton verification failed');
 const previously=selection;selection=denim;lastResult=applied;
 $('denimOriginal').src=denim==='public'?'/benchmark/three-d-31/original-jeans.jpg':
  '/benchmark/three-d-37/original-denimjeans2.jpg';
 $('evidence').textContent='Original shirt SHA-256: '+VERIFIED_PUBLIC_SHIRT_SHA256+
  '\nOriginal denim SHA-256: '+SHAS[denim]+
  '\n163 anatomical bones, independent 3D shirt + jeans.\nFront photographed; rear is source-neutral (NOT photographed).'+
  '\nNo personal wardrobe, no auth, no production; human appearance REVIEW.';
 changes++;
 if(previously!==denim)swaps++;
 sample('wear-'+denim);
 status('Ready: real source-photographed shirt and '+(denim==='public'?'public-domain':'CC BY-SA')+
  ' jeans on '+app.getState().kind+' 163-bone body. Provisional research; HOLD.');
}
async function boot(){
 if(disposed)return;
 stop();const token=++generation;restarts++;
 phaseSet('loading','Loading and SHA-256 checking licensed original photos and anatomical WebGL…');
 $('review').checked=false;$('evidence').textContent='Checking original photo JPEG + cutouts; no fabricated meshes.';
 resetCanvas();fallback(false);
 try{
  if(!hasWebGL())throw Error('WebGL2 unavailable on this device');
  const canvas=$('avatar');
  contextHandler=e=>{
   e.preventDefault();
   if(token===generation&&phase!=='error'&&!disposed)fail(Error('WebGL context lost'));
  };
  canvas.addEventListener('webglcontextlost',contextHandler);
  app=mountAnatomicalShowroom(canvas,{
   premiumTurntable67:true,independentGarments:true,poseContactFactory:createPoseContact,
   crispSourcePhotoClarity:true,jeansPanelFall:true,tailoredShoulderSleeves:true,
   independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,
   sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,naturalShoulderSleeveTransition:true,
   sourceMeasuredSleeveHang:true,anatomicalShirtSideFlow:true,naturalShoulderFall61:true,
   trueShoulderTop64:true,poseConditionedSleeveDrape:true
   // Parallel denim contact/folds are intentionally untouched.
  });
  app.start();
  // Sequential bundle acquisition permits exact object-URL cleanup on partial failure.
  const first=await loadSourceVetted3D69ResearchBundle({denim:'public'});
  if(token!==generation){first.dispose();return;}
  bundles=[first];
  const second=await loadSourceVetted3D69ResearchBundle({denim:'second'});
  if(token!==generation){second.dispose();return;}
  bundles.push(second);
  if(first.pants.sourceSHA256!==SHAS.public||second.pants.sourceSHA256!==SHAS.second||
     first.shirt.sourceSHA256!==VERIFIED_PUBLIC_SHIRT_SHA256)
   throw Error('Original licensed garment source SHA-256 mismatch');
  const loaded=await app.load($('model').value);
  if(token!==generation)return;
  if(loaded!==true||app.getState().stats?.bones!==163)
   throw Error('Expected 163-bone skinned original anatomical model');
  selection='public';lastResult=null;
  phaseSet('ready','Ready: two independently SHA-verified original denims, original shirt and 163-bone anatomical '+
   $('model').value+' figure. Review licensed sources, then Wear clothes.');
  $('evidence').textContent='Original shirt SHA-256: '+VERIFIED_PUBLIC_SHIRT_SHA256+
    '\nDenim #1: '+SHAS.public+'\nDenim #2: '+SHAS.second+
    '\nBoth sources source-verified. No 3D outfit until approved research review.';
  sample('ready');
 }catch(e){if(token===generation)fail(e);}
}
function interact(fn){
 if(phase!=='ready'||!app)return;
 try{fn();sample('interaction');}catch(e){fail(e);}
}
$('retry').addEventListener('click',()=>boot());
$('review').addEventListener('change',controls);
$('wear').addEventListener('click',()=>interact(()=>applyDenim('public')));
$('swap').addEventListener('click',()=>interact(()=>applyDenim(selection==='public'?'second':'public')));
$('clear').addEventListener('click',()=>interact(()=>{app.applyOutfit('none');lastResult=null;
 status('3D garment cleared; original licensed 2D photographs remain accessible.');}));
for(const id of ['front','side','back'])$(id).addEventListener('click',()=>interact(()=>{
 app[id]();$('angle').value=id==='front'?0:id==='side'?90:180;
 $('degree').textContent=$('angle').value+'°';
}));
$('angle').addEventListener('input',()=>interact(()=>{
 const angle=Number($('angle').value);app.viewAt(angle);$('degree').textContent=angle+'°';
}));
$('turn').addEventListener('click',()=>interact(()=>app.setSpin(!app.getState().spinEnabled)));
$('zin').addEventListener('click',()=>interact(()=>app.zoom(.84)));
$('zout').addEventListener('click',()=>interact(()=>app.zoom(1.18)));
$('model').addEventListener('change',async()=>{
 if(phase!=='ready'||!app)return;
 const token=generation,kind=$('model').value;
 phaseSet('loading','Loading original 163-bone '+kind+' anatomical figure…');
 $('review').checked=false;
 try{
  const result=await app.load(kind);
  if(token!==generation)return;
  if(result!==true||app.getState().stats?.bones!==163)throw Error('Figure switch failed');
  figureSwitches++;lastResult=null;sample('switch-'+kind);
  phaseSet('ready','Ready: original anatomical '+kind+' figure. Review licensed shirt + jeans and Wear clothes.');
 }catch(e){if(token===generation)fail(e);}
});
window.ccMobileDiagnostics=()=>{
 const current=app?.getState();
 return {phase,ready:phase==='ready',figure:current?.kind||null,
  rig:current?.stats||null,viewAngle:current?.viewAngle??null,
  memory:current?{geometries:current.geometries,textures:current.textures,drawPixels:current.drawPixels,
   pixelRatio:current.pixelRatio,renderMs:current.lastRenderMs,heapBytes:performance.memory?.usedJSHeapSize??null,
   cameraDistance:current.cameraDistance,trackedGarmentGeometries:current.trackedGarmentGeometries,
   reclaimedGarmentGeometries:current.reclaimedGarmentGeometries}:null,
  memorySamples:memorySamples.slice(-24),swaps,figureSwitches,restarts,
  selection,actual3DGarment:lastResult,originalShirtSHA256:VERIFIED_PUBLIC_SHIRT_SHA256,
  originalDenimSHA256:lastResult?.originalPhotoSHA256s?.bottom||null,
  sourceOriginalVerified:!!bundles&&bundles.length===2,
  originalFallbackVisible:$('fallback').dataset.visible==='true',
  humanPhotorealismApproved:false,physicalAndroidTested:false,physicalIphoneTested:false,
  familyAlpha:'HOLD',releaseAuthorized:false};
};
window.ccMobileSetView=degrees=>{
 if(phase!=='ready')throw Error('3D viewer not ready');
 app.viewAt(degrees);$('angle').value=String(degrees);$('degree').textContent=degrees+'°';
 return window.ccMobileDiagnostics();
};
window.ccMobileRestart=()=>boot();
window.addEventListener('pagehide',()=>{disposed=true;stop();});
boot();