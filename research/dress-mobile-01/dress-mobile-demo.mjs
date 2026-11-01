/** PAR12: original photographed Commons 0053 dress × genuine 163-bone
 * anatomical mobile viewer. Exact SHA-gated research, not production.
 * Independent source-neutral lower-skirt shaping from verified PR487.
 */
import {mountAnatomicalShowroom} from './dress-mobile-showroom.mjs';
import {createPoseContact} from '../three-d-42/posed-contact.mjs';
import {loadLicensedCutout} from '../three-d-02/reviewed-texture.mjs';
import {loadSourceVetted3D69ResearchBundle} from '../three-d-69/sha-verified-original-garment-sources.mjs';
import {prepareIndexedGarmentsFor3D,applyIndexed3DSelection} from '../three-d-69/index-to-real-garment-viewer.mjs';
import {planIndexedBoardToAnatomical3D} from '../three-d-68/saved-closet-3d-adapter.mjs';
const $=id=>document.getElementById(id);
if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
 throw Error('Licensed original dress integration is localhost-only');
const SHA=Object.freeze({dress:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'});
const session=Object.freeze({authenticated:true,ownerId:'non-user-licensed-par12-mobile-dress',generation:1});
const f=(id,category,itemType,color,sourceSHA256)=>Object.freeze({
 id,ownerId:session.ownerId,sourceId:id,sourceSHA256,category,itemType,color,
 sourcePhotoOriginal:true,ownerReviewed:true,releaseAuthorized:false});
let app=null,dress=null,bundles=[],phase='loading',selection='none',denim='public',
 errors=[],changes=0,swaps=0,models=0,retries=0,rev=0,visualFallback=false,contextFn=null;
let last=null,allVerified=false,disposed=false;
const mem=[],flags={noWebGL:false,missingDress:false,missingRig:false,corruptDress:false,
 missingDenim:false,badCutout:false,interrupted:false,rendererFailure:false};
const status=(txt)=>{$('status').textContent=txt;$('status').dataset.phase=phase;};
const enable=()=>{
 const ok=phase==='ready';
 for(const id of ['dress','two','swap','clear','front','side','back','turn','zin','zout','angle'])
  $(id).disabled=!ok||(id==='dress'||id==='two'||id==='swap')&&!$('review').checked;
 $('retry').disabled=phase==='loading';
};
function fallback(reason,show=true){
 visualFallback=show;$('fallback').dataset.visible=String(show);
 $('viewerHost').style.display=show?'none':'block';
 $('reason').textContent=reason;
}
const state=()=>app?.getState();
const sample=(tag)=>{const x=state();if(!x)return;
 mem.push({tag,geometries:x.geometries,textures:x.textures,
  tracked:x.trackedGarmentGeometries,reclaimed:x.reclaimedGarmentGeometries,
  bones:x.stats?.bones,drawPixels:x.drawPixels,renderMs:x.lastRenderMs});
 if(mem.length>140)mem.shift();};
function close(){
 rev++;
 const el=$('avatar');if(contextFn&&el){el.removeEventListener('webglcontextlost',contextFn);contextFn=null;}
 if(app){try{app.stop();}catch(e){errors.push('dispose: '+e.message);}app=null;}
 for(const b of bundles)try{b.dispose();}catch{}
 bundles=[];dress=null;last=null;allVerified=false;
}
function fail(err){
 const why=String(err?.message||err||'Unknown error').slice(0,260);
 errors.push(why);close();phase='error';status('Original photographed dress 3D unavailable: '+why+'. Original photo reference retained; Retry 3D.');
 fallback('3D unavailable: '+why+' (original reference JPEG, not simulated cloth).');
 $('evidence').textContent='Source verification blocked. No unverified 3D. Family Alpha HOLD.';
 enable();
}
function tryWebGL(){
 if(flags.noWebGL)return false;
 try{const c=document.createElement('canvas'),g=c.getContext('webgl2');if(!g)return false;
 g.getExtension('WEBGL_lose_context')?.loseContext();return true;}catch{return false;}
}
const outfitPlan=(source)=>{
 const [first,second]=bundles;
 const byId=new Map([
  ['licensed-shirt',f('licensed-shirt','Tops','T-shirt','Black',SHA.shirt)],
  ['licensed-jeans-1',f('licensed-jeans-1','Bottoms','Jeans','Blue',first.pants.sourceSHA256)],
  ['licensed-jeans-2',f('licensed-jeans-2','Bottoms','Jeans','Blue',second.pants.sourceSHA256)]
 ]);
 return planIndexedBoardToAnatomical3D({slots:{top:'licensed-shirt',bottom:source==='public'?'licensed-jeans-1':'licensed-jeans-2'}},
  {ownerId:session.ownerId,generation:session.generation,byId,releaseAuthorized:false});
};
function evidence(){
 const g=state()?.outfit;
 $('evidence').textContent=JSON.stringify({dressOriginalSHA256:SHA.dress,
  licensedOriginalDressId:dress?.id||null,dressOriginalCutoutVerified:!!dress?.realFabricTexture,
  dressOriginalPhotoUnmodified:true,sourceNeutralReverse:true,
  twoPieceDenimOriginalSHA256:SHA[denim],shirtOriginalSHA256:SHA.shirt,
  activeOutfit:selection,activeMeshSlots:g?.slots||[],actualDress:g?.dress?.sourceId||null,
  dressSourceNeutralTailoring:g?.dress?.dress74ProvisionalDrape||false,
  dressOriginalUVSkinProtected:g?.dress?.dress74OriginalPhotoCoordinatesPreserved||false,
  familyAlpha:'HOLD',releaseAuthorized:false},null,2);
}
function assertOutfit(){
 const g=state()?.outfit;
 if(g?.mode!==selection)throw Error('Actual anatomical outfit failed to switch');
 if(selection==='dress'){
  if(g.pants||g.shirt||g.slots.length!==1||g.slots[0]!=='dress')
   throw Error('Dress cannot coexist with hidden jeans or shirt');
  const d=g.dress;
  if(!d||d.sourceId!=='commons-0053'||d.sourceSHA256!==SHA.dress||
    d.dress74ProvisionalDrape!==true||d.dress74OriginalPhotoCoordinatesPreserved!==true||
    d.dress74OriginalSkinWeightsPreserved!==true||d.dress74SourcePhotographUnchanged!==true||
    d.releaseAuthorized!==false)
   throw Error('PR487 authentic dress source/skin geometry verification failed');
 }else if(selection==='shirt-pants'){
  if(!g.shirt||!g.pants||g.dress||
    g.shirt.sourceSHA256!==SHA.shirt||g.pants.sourceSHA256!==SHA[denim]||
    g.pants.photoApplied!==true||g.slots.includes('dress'))
   throw Error('Original independently skinned shirt/denim source identity failed');
 }else if(selection==='none'&&g.slots.length)throw Error('Clear must detach every original garment');
}
function wearDress(){
 if(!dress||!allVerified||!$('review').checked)throw Error('Genuine licensed original dress and review required');
 if(flags.rendererFailure)throw Error('Real renderer failure research injection');
 app.applyOutfit('dress',dress,{reviewed:true});
 selection='dress';changes++;swaps++;assertOutfit();sample('dress');
 fallback('Original dress retained in 2D reference.',false);
 status('Source-verified original photographed dress on '+state().kind+' 163-bone humanoid. PR487 lower-skirt tailoring provisional · HOLD.');
 evidence();
}
function wearTwo(){
 if(bundles.length!==2||!$('review').checked||!allVerified)
  throw Error('Original photographed shirt and two denims not SHA verified');
 if(flags.rendererFailure)throw Error('Real renderer failure research injection');
 const bundle=denim==='public'?bundles[0]:bundles[1];
 const prepared=prepareIndexedGarmentsFor3D(outfitPlan(denim),
  {shirtCandidate:bundle.shirt,pantsCandidate:bundle.pants});
 if(prepared.status!=='source-bound-3d-ready-for-provisional-preview')
  throw Error('Unverified original shirt or jeans are not a 3D mesh');
 const applied=applyIndexed3DSelection(app,prepared,{checkCurrentSession:()=>session});
 if(!applied.realPhotoApplied||applied.anatomicalSkeletonBones!==163)
  throw Error('Genuine source-photographed two-piece rendering failed');
 selection='shirt-pants';changes++;swaps++;assertOutfit();sample('shirt+jeans');
 $('denimOriginal').src=denim==='public'?'/benchmark/three-d-31/original-jeans.jpg':
  '/benchmark/three-d-37/original-denimjeans2.jpg';
 fallback('Original shirt and denim remain available in 2D.',false);
 status('Verified separate original shirt and '+denim+' denim on '+state().kind+' anatomical 3D · HOLD.');
 evidence();
}
function clear(){
 if(!app)throw Error('Renderer unavailable');
 app.applyOutfit('none');selection='none';last=null;changes++;assertOutfit();sample('clear');
 fallback('No 3D garments selected. Original dress and two-piece photos remain accessible.');
 evidence();status('All garments cleared; original licensed 2D reference available.');
}
async function boot(){
 if(disposed)return;
 close();const token=++rev;retries++;phase='loading';status('SHA-256 checking original dress JPEG, cutout, shirt, two denim photos and rig…');
 $('review').checked=false;enable();
 const old=$('avatar'),canvas=old.cloneNode(false);canvas.width=1;canvas.height=1;old.replaceWith(canvas);
 fallback('Verifying original licensed garment photographs.',true);
 try{
  if(!tryWebGL())throw Error('WebGL2 unavailable');
  if(flags.missingDress)throw Error('Licensed dress original JPEG missing');
  const manifest=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'});
  if(!manifest.ok)throw Error('Original license manifest unavailable');
  const rows=await manifest.json();
  if(flags.corruptDress)throw Error('Original dress SHA256 mismatch');
  if(flags.badCutout)throw Error('Original dress cutout SHA mismatch');
  dress=await loadLicensedCutout('commons-0053',{manifest:rows,reviewConfirmed:true});
  if(dress.id!=='commons-0053'||dress.sourceSHA256!==SHA.dress||
    !dress.realFabricTexture)throw Error('Verified original dress JPEG/alpha mismatch');
  if(token!==rev)return;
  if(flags.missingDenim)throw Error('Original licensed jeans unavailable');
  const first=await loadSourceVetted3D69ResearchBundle({denim:'public'});
  if(token!==rev){first.dispose();return;}bundles.push(first);
  const second=await loadSourceVetted3D69ResearchBundle({denim:'second'});
  if(token!==rev){second.dispose();return;}bundles.push(second);
  if(first.shirt.sourceSHA256!==SHA.shirt||first.pants.sourceSHA256!==SHA.public||
    second.pants.sourceSHA256!==SHA.second)
   throw Error('Original photographed two-piece SHA mismatch');
  if(flags.interrupted)throw Error('Original source loading interrupted');
  if(flags.missingRig)throw Error('163-bone anatomical model unavailable');
  contextFn=e=>{e.preventDefault();if(token===rev&&phase!=='error')fail(Error('Real WebGL context lost'));};
  canvas.addEventListener('webglcontextlost',contextFn);
  app=mountAnatomicalShowroom(canvas,{
   premiumTurntable67:true,independentGarments:true,poseContactFactory:createPoseContact,
   crispSourcePhotoClarity:true,jeansPanelFall:true,
   tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,
   upperArmFabricVolume:true,sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,
   naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true,anatomicalShirtSideFlow:true,
   naturalShoulderFall61:true,trueShoulderTop64:true,poseConditionedSleeveDrape:true,
   photoDenimRearDrape73:true,photoDenimCalfHang74:true,photoDenimFolds75:true,
   photoDenimContinuity76:true,photoDenimContactAudit77:true,photoDenimKneePose78:true,
   photoDenimFlex79:new URLSearchParams(location.search).get('flex79')==='after',
   dressMobile74:true
  });
  app.start();
  const loaded=await app.load($('model').value);
  if(token!==rev)return;
  if(loaded!==true||state()?.stats?.bones!==163)throw Error('True CC0 163-bone skinned anatomical figure missing');
  phase='ready';selection='none';denim='public';allVerified=true;
  enable();status('Original Commons dress, shirt, both jeans and female/male 163-bone assets verified. Review, then select outfit.');
  sample('loaded');evidence();
 }catch(e){if(token===rev)fail(e);}
}
function act(fn){if(phase!=='ready'||!app)return;
 try{fn();}catch(e){fail(e);}}
$('review').addEventListener('change',enable);
$('dress').addEventListener('click',()=>act(wearDress));
$('two').addEventListener('click',()=>act(wearTwo));
$('swap').addEventListener('click',()=>act(()=>{
 denim=denim==='public'?'second':'public';
 if(selection==='shirt-pants')wearTwo();else{changes++;evidence();status('Denim selection switched; put on shirt + jeans to preview.');}
}));
$('clear').addEventListener('click',()=>act(clear));
$('retry').addEventListener('click',boot);
$('fallbackToggle').addEventListener('click',()=>fallback('Original licensed photos and 2D reference. No fabricated rear photograph.',true));
for(const angle of ['front','side','back'])$(angle).addEventListener('click',()=>act(()=>{
 app[angle]();$('angle').value=String(angle==='front'?0:angle==='side'?90:180);
 $('degree').textContent=$('angle').value+'°';sample('camera-'+angle);
}));
$('angle').addEventListener('input',()=>act(()=>{app.viewAt(Number($('angle').value));$('degree').textContent=$('angle').value+'°';}));
$('turn').addEventListener('click',()=>act(()=>app.setSpin(!state().spinEnabled)));
$('zin').addEventListener('click',()=>act(()=>{app.zoom(.84);sample('zoom-in');}));
$('zout').addEventListener('click',()=>act(()=>{app.zoom(1.18);sample('zoom-out');}));
$('model').addEventListener('change',async()=>{
 if(phase!=='ready'||!app)return;
 const token=rev,kind=$('model').value;phase='loading';status('Switching actual anatomical '+kind+' 163-bone rig…');enable();
 try{const loaded=await app.load(kind);if(token!==rev)return;
  if(!loaded||state()?.stats?.bones!==163)throw Error('Original 163-bone figure switch failed');
  models++;selection='none';phase='ready';$('review').checked=false;enable();
  fallback('Model changed; review original photographs before selecting.');
  status('Original '+kind+' anatomical figure ready. Review source photographs, then select.');
  sample('model-'+kind);evidence();
 }catch(e){if(token===rev)fail(e);}
});
window.ccDress12Diagnostics=()=>{
 const q=state(),o=q?.outfit;
 return {phase,ready:phase==='ready',figure:q?.kind||null,bones:q?.stats?.bones||0,
  outfitMode:o?.mode||'none',outfitSlots:o?.slots||[],
  dress:o?.dress||null,shirt:o?.shirt||null,pants:o?.pants||null,
  verifiedDressSHA:allVerified?dress?.sourceSHA256:null,
  sourceHashes:allVerified?SHA:null,denim,changes,swaps,models,retries,
  visibleFallback:$('fallback').dataset.visible==='true',
  memory:q?{geometries:q.geometries,textures:q.textures,tracked:q.trackedGarmentGeometries,
   reclaimed:q.reclaimedGarmentGeometries,frames:q.frames,drawPixels:q.drawPixels,
   cameraDistance:q.cameraDistance}:null,memorySamples:mem.slice(-35),errors:errors.slice(-12),
  realLicensedPhotosOnly:true,noOriginalPhotoModified:true,noFakeReverse:true,
  realAndroidTested:false,realIphoneTested:false,humanVisualApproved:false,
  familyAlpha:'HOLD',releaseAuthorized:false};
};
window.ccDress12SetView=degrees=>{
 if(phase!=='ready')throw Error('Verified 3D viewer unavailable');
 app.viewAt(degrees);$('angle').value=String(degrees);$('degree').textContent=degrees+'°';
 return window.ccDress12Diagnostics();
};
window.ccDress12Test=Object.freeze({
 inject(flag){if(!Object.hasOwn(flags,flag))throw Error('Unknown fail-closed condition');
  flags[flag]=true;if(flag==='rendererFailure')return act(()=>wearDress());return boot();},
 reset(){for(const f of Object.keys(flags))flags[f]=false;return boot();},
 contextLoss(){const g=$('avatar').getContext('webgl2');const ext=g?.getExtension('WEBGL_lose_context');
  if(!ext)throw Error('Cannot verify genuine WebGL context loss');ext.loseContext();},
 unsupportedDress(candidate){try{app.applyOutfit('dress',candidate,{reviewed:true});return false;}catch{return true;}},
 current:()=>window.ccDress12Diagnostics(),
});
window.addEventListener('pagehide',()=>{disposed=true;close();});
boot();
