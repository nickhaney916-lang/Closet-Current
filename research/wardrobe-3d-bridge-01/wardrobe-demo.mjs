/**
 * PAR10 — synthetic-account research app. Existing Closet Current 3D68
 * saved schema + 3D69 exact licensed-source mesh gate, 3D78/PAR08 isolated
 * mobile viewer and original JPEG-only 2D fallback.
 * Never production auth, DB, storage, private pictures or CDN.
 */
import {mountAnatomicalShowroom} from '../integration-par08-three-d-78/mobile-showroom.mjs';
import {createPoseContact} from '../three-d-42/posed-contact.mjs';
import {loadSourceVetted3D69ResearchBundle} from '../three-d-69/sha-verified-original-garment-sources.mjs';
import {loadSyntheticLicensedClosets10,createSyntheticWardrobeSession10,
 planOwnerBoundSelection10,prepareSourceBoundOutfit10,displaySourceBoundOutfit10,
 SYNTHETIC_SOURCES10} from './account-source-bridge.mjs';

if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
 throw Error('Synthetic original-photo wardrobe bridge is localhost-only');
const $=id=>document.getElementById(id);
let session=null,bound=null,closets=null,app=null,bundles=null,bootToken=0;
let slots={},mode='loading',viewerReady=false,viewerFailure=null,loadedFigure=null;
let interactions=0,transitions=0,negativeCases=[],memorySamples=[],renderCount=0,
 last3D=null,swaps=0,retryCount=0,modelSwitches=0,sourceVerified=false;
const flags={noWebGL:false,missingRig:false,sourceLoadFailure:false,delayRead:false,staleApply:false};
const phase=(name,message)=>{mode=name;$('status').textContent=message;$('status').dataset.phase=name;};
const current=()=>session?.current()||{authenticated:false,ownerId:null,generation:0};
const isCurrent=s=>{const t=current();return !!s&&t.authenticated&&
 t.ownerId===s.ownerId&&t.generation===s.generation};
const authorized=()=>!!bound&&isCurrent(bound);
const readableItems=()=>authorized()?closets[current().ownerId]:[];
const recorded=(name)=>{const st=app?.getState();
 const q={name,geometries:st?.geometries??null,textures:st?.textures??null,
  tracked:st?.trackedGarmentGeometries??null,reclaimed:st?.reclaimedGarmentGeometries??null,
  frame:st?.frames??0};
 memorySamples.push(q);if(memorySamples.length>140)memorySamples.shift();
};
function clearRendered(){
 $('items').replaceChildren();$('originals').replaceChildren();
 $('fallbackPhotos').replaceChildren();$('evidence').textContent='No authenticated clothing exposed.';
 $('viewerHost').style.display='none';$('photoFallback').dataset.visible='true';
 $('fallbackReason').textContent='Sign in to view this account’s licensed synthetic original photos.';
 last3D=null;
 try{app?.applyOutfit('none');}catch{}
}
function stopViewer(){
 if(app){try{app.stop();}catch{}app=null;}
 if(bundles){for(const z of bundles)try{z?.dispose();}catch{}bundles=null;}
 viewerReady=false;loadedFigure=null;
}
function showFallback(reason){
 $('viewerHost').style.display='none';$('photoFallback').dataset.visible='true';
 $('fallbackReason').textContent=reason;
 const frame=$('fallbackPhotos');frame.replaceChildren();
 for(const slot of ['top','bottom']){
  const id=slots[slot],item=readableItems().find(v=>v.id===id);
  if(!item)continue;
  const fig=document.createElement('figure'),img=document.createElement('img');
  img.src=item.originalPhoto.image;img.alt=item.color+' '+item.itemType+' original saved JPEG';
  img.dataset.owner=current().ownerId;img.dataset.sha=item.expectedSHA256;
  const cap=document.createElement('figcaption');
  cap.textContent=item.category+' · '+item.color+' '+item.itemType+' · original photo';
  fig.append(img,cap);frame.append(fig);
 }
 if(!frame.children.length)$('fallbackReason').textContent=reason+' No items selected.';
 last3D=null;
}
function originals(){
 $('originals').replaceChildren();
 for(const slot of ['top','bottom']){
  const item=readableItems().find(v=>v.id===slots[slot]);
  if(!item)continue;
  const img=document.createElement('img');img.src=item.originalPhoto.image;
  img.alt=item.color+' '+item.itemType+' original photo';
  img.dataset.owner=current().ownerId;img.dataset.sha=item.expectedSHA256;
  $('originals').append(img);
 }
}
function safeControls(){
 const ok=authorized();
 for(const id of ['category','wear','clear','swap'])$(id).disabled=!ok;
 $('logout').disabled=!current().authenticated;
 $('signin').disabled=!!current().authenticated;
 const enabled=ok&&viewerReady;
 for(const id of ['front','side','back','zin','zout','turn','angle'])$(id).disabled=!enabled;
 $('model').disabled=!ok;
}
function updateCards(){
 const container=$('items');container.replaceChildren();
 if(!authorized()){safeControls();return;}
 const selected=$('category').value;
 for(const item of readableItems().filter(v=>v.category===selected)){
  const button=document.createElement('button');button.type='button';button.className='item';
  button.dataset.itemId=item.id;button.dataset.owner=item.ownerId;
  button.setAttribute('aria-pressed',String(slots.top===item.id||slots.bottom===item.id));
  const img=document.createElement('img');img.alt='Original '+item.itemType;
  img.src=item.originalPhoto.image;img.dataset.sha=item.expectedSHA256;
  const detail=document.createElement('span');
  detail.textContent=item.color+' '+item.itemType+(item.category==='Dresses'?' · photo/2D only':'');
  button.append(img,detail);
  button.addEventListener('click',()=>{if(!authorized())return;select(item.id);});
  container.append(button);
 }
 safeControls();
}
function assertNoOtherOwner(){
 const owner=current().ownerId;
 for(const image of document.querySelectorAll('img[data-owner]'))
  if(!owner||image.dataset.owner!==owner)throw Error('Cross-account photograph remained visible');
 for(const card of document.querySelectorAll('.item[data-owner]'))
  if(!owner||card.dataset.owner!==owner)throw Error('Cross-account garment remained selectable');
}
function refreshEvidence(prepared=null){
 if(!authorized())return;
 const ids=Object.values(slots).filter(Boolean);
 const entries=ids.map(id=>{
  const record=bound.indexed.byId.get(id);
  return {id:record?.id,category:record?.category,color:record?.color,
   type:record?.itemType,originalSHA256:record?.sourceSHA256,
   originalPhotoLocallyHashed:bound.indexed.originalPhotosHashedLocally};
 });
 $('evidence').textContent=JSON.stringify({account:current().ownerId,generation:current().generation,
  confirmedSavedItems:bound.indexed.validatedItems,selected:entries,
  display:prepared?.status||'original-photo-2d',
  threeDOnlyOnIndependentSourceAndSkinnedMesh:true,
  realFamilyWardrobeUsed:false,releaseAuthorized:false},null,2);
}
function present(){
 if(!authorized()){clearRendered();safeControls();return;}
 renderCount++;
 updateCards();originals();
 const ids=Object.values(slots).filter(Boolean);
 if(!ids.length){try{app?.applyOutfit('none');}catch{}
  showFallback('Select an owned garment to see its original source photograph.');
  phase('ready','No items selected. Choose a confirmed garment from your synthetic closet.');
  refreshEvidence();return;}
 let decision;
 try{
  decision=prepareSourceBoundOutfit10({bound,live:current,slots,bundles:viewerReady?bundles:null});
  if(decision.status!=='verified-3d'||!viewerReady||viewerFailure){
   try{app?.applyOutfit('none');}catch{}
   showFallback(viewerFailure||decision.prepared.reason||'No independently verified 3D garment mesh; original photo shown.');
   phase('ready','Original photograph / 2D fallback: '+(decision.prepared.reason||'3D not authorized.'));
  }else{
   if(flags.staleApply)throw Error('Synthetic session invalidated before 3D application');
   last3D=displaySourceBoundOutfit10({viewer:app,prepared:decision.prepared,live:current});
   if(last3D?.ownerId!==current().ownerId||
      last3D?.generation!==current().generation||
      last3D?.anatomicalSkeletonBones!==163||
      !last3D?.realPhotoApplied)
    throw Error('3D source identity / current account proof failed');
   $('photoFallback').dataset.visible='false';$('viewerHost').style.display='block';
   phase('ready','Verified original photographed garments on the real anatomical 3D figure.');
  }
 }catch(e){
  try{app?.applyOutfit('none');}catch{}
  showFallback('3D safely unavailable: '+String(e.message||e));
  phase('ready','Original-photo fallback retained; no unsupported 3D mesh shown.');
 }
 refreshEvidence(decision);
 recorded('present');
 assertNoOtherOwner();safeControls();
}
function select(id){
 if(!authorized())throw Error('No authenticated source-verified closet');
 const item=readableItems().find(v=>v.id===id);
 if(!item||item.ownerId!==current().ownerId)throw Error('Cross-account garment not authorized');
 if(item.category==='Tops'){slots.top=id;delete slots.dress;}
 else if(item.category==='Bottoms'){slots.bottom=id;delete slots.dress;}
 else if(item.category==='Dresses'){slots={top:id};}
 else throw Error('Unsupported saved garment category');
 planOwnerBoundSelection10(bound,current,slots);
 interactions++;present();
}
async function loadAccount(){
 const token=++bootToken,identity=current();
 clearRendered();bound=null;slots={};viewerFailure=null;
 phase('loading','Loading confirmed source-verified synthetic wardrobe…');safeControls();
 if(!identity.authenticated){phase('signed-out','Signed out. No saved photos are displayed.');return;}
 try{
  bound=await session.load();
  if(token!==bootToken||!isCurrent(identity))return;
  sourceVerified=true;
  // Real saved schema; choose known top and first bottom for source-verified 3D.
  const saved=readableItems();
  slots={top:saved.find(x=>x.category==='Tops').id,bottom:saved.find(x=>x.category==='Bottoms').id};
  $('category').value='Tops';present();
 }catch(e){
  if(token!==bootToken)return;
  bound=null;slots={};clearRendered();
  phase('error','Wardrobe blocked: '+String(e.message||e));
  safeControls();
 }
}
function getGL(){
 if(flags.noWebGL)return false;
 try{
  const c=document.createElement('canvas'),g=c.getContext('webgl2');
  if(!g)return false;g.getExtension('WEBGL_lose_context')?.loseContext();return true;
 }catch{return false;}
}
async function initViewer(){
 retryCount++;
 const token=++bootToken,identity=current();
 stopViewer();viewerFailure=null;
 if(!identity.authenticated){showFallback('Sign in to see original photos.');return;}
 try{
  if(!getGL())throw Error('WebGL2 unavailable');
  if(flags.sourceLoadFailure)throw Error('Original source asset failed to load');
  const one=await loadSourceVetted3D69ResearchBundle({denim:'public'});
  if(token!==bootToken||!isCurrent(identity)){one.dispose();return;}
  bundles=[one];
  const two=await loadSourceVetted3D69ResearchBundle({denim:'second'});
  if(token!==bootToken||!isCurrent(identity)){two.dispose();return;}
  bundles.push(two);
  if(flags.missingRig)throw Error('Original anatomical rig unavailable');
  const old=$('avatar'),canvas=old.cloneNode(false);
  canvas.width=1;canvas.height=1;old.replaceWith(canvas);
  app=mountAnatomicalShowroom(canvas,{
   premiumTurntable67:true,independentGarments:true,poseContactFactory:createPoseContact,
   crispSourcePhotoClarity:true,jeansPanelFall:true,tailoredShoulderSleeves:true,
   independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,
   sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,naturalShoulderSleeveTransition:true,
   sourceMeasuredSleeveHang:true,anatomicalShirtSideFlow:true,naturalShoulderFall61:true,
   trueShoulderTop64:true,poseConditionedSleeveDrape:true,
   photoDenimRearDrape73:true,photoDenimCalfHang74:true,
   photoDenimFolds75:true,photoDenimContinuity76:true,photoDenimContactAudit77:true,
   photoDenimKneePose78:true
  });
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();
   if(token!==bootToken)return;
   viewerReady=false;viewerFailure='WebGL context lost';
   stopViewer();present();
  },{once:true});
  app.start();
  const ok=await app.load($('model').value);
  if(token!==bootToken||!isCurrent(identity))return;
  if(!ok||app.getState().stats?.bones!==163)throw Error('Original verified 163-bone rig unavailable');
  viewerReady=true;loadedFigure=$('model').value;
  recorded('viewer-ready');present();
 }catch(e){
  if(token!==bootToken)return;
  viewerFailure=String(e.message||e);stopViewer();
  present();
 }
}
async function changeAccount(id){
 bootToken++;transitions++;clearRendered();bound=null;slots={};stopViewer();
 session.switchAccount(id);$('account').value=id;
 await loadAccount();await initViewer();
}
async function logout(){
 bootToken++;transitions++;clearRendered();bound=null;slots={};stopViewer();
 session.logout();phase('signed-out','Signed out; this account’s photos were removed.');
 safeControls();assertNoOtherOwner();
}
$('account').addEventListener('change',()=>changeAccount($('account').value));
$('signin').addEventListener('click',()=>changeAccount($('account').value));
$('logout').addEventListener('click',logout);
$('retry').addEventListener('click',()=>initViewer());
$('category').addEventListener('change',()=>{interactions++;updateCards();});
$('clear').addEventListener('click',()=>{if(!authorized())return;slots={};interactions++;present();});
$('wear').addEventListener('click',()=>{interactions++;present();});
$('swap').addEventListener('click',()=>{
 if(!authorized())return;
 const bottoms=readableItems().filter(v=>v.category==='Bottoms');
 const i=bottoms.findIndex(x=>x.id===slots.bottom);
 slots.bottom=bottoms[(i+1)%bottoms.length].id;interactions++;swaps++;present();
});
$('model').addEventListener('change',async()=>{
 if(!authorized())return;
 const kind=$('model').value;modelSwitches++;
 if(app&&viewerReady){
  viewerReady=false;
  try{
   if(flags.missingRig||await app.load(kind)!==true)throw Error('Actual 163-bone model switch unavailable');
   if(app.getState().stats?.bones!==163)throw Error('Switched model lacks 163 bones');
   viewerReady=true;loadedFigure=kind;present();
  }catch(e){viewerFailure=String(e.message||e);stopViewer();present();}
 }else await initViewer();
});
for(const [id,method] of [['front','front'],['side','side'],['back','back']]){
 $(id).addEventListener('click',()=>{if(!viewerReady)return;app[method]();
  const a=id==='front'?0:id==='side'?90:180;
  $('angle').value=String(a);$('degree').textContent=a+'°';interactions++;recorded('view-'+id);
 });
}
$('angle').addEventListener('input',()=>{if(!viewerReady)return;
 const a=Number($('angle').value);app.viewAt(a);$('degree').textContent=a+'°';interactions++;});
$('zin').addEventListener('click',()=>{if(viewerReady){app.zoom(.84);interactions++;}});
$('zout').addEventListener('click',()=>{if(viewerReady){app.zoom(1.18);interactions++;}});
$('turn').addEventListener('click',()=>{if(viewerReady){app.setSpin(!app.getState().spinEnabled);interactions++;}});
window.ccWardrobe10Diagnostics=()=>{
 const state=app?.getState();
 return {account:current().ownerId,generation:current().generation,
  authenticated:current().authenticated,indexReady:authorized(),phase:mode,
  selected:{...slots},selectionCount:Object.keys(slots).length,category:$('category').value,
  visibleAccountIds:[...document.querySelectorAll('img[data-owner]')].map(x=>x.dataset.owner),
  cards:[...document.querySelectorAll('.item')].map(x=>x.dataset.itemId),
  verifiedPhotoHashes:authorized()?[...bound.indexed.byId.values()].map(x=>x.sourceSHA256):[],
  sourceVerified,viewerReady,figure:state?.kind??null,bones:state?.stats?.bones??0,
  viewerMode:last3D?'verified-3d':'original-photo-2d',
  fallbackVisible:$('photoFallback').dataset.visible==='true',
  displayed3DSources:last3D?.originalPhotoSHA256s||null,
  memory:state?{geometries:state.geometries,textures:state.textures,
   tracked:state.trackedGarmentGeometries,reclaimed:state.reclaimedGarmentGeometries,
   frames:state.frames,cameraDistance:state.cameraDistance,drawPixels:state.drawPixels}:null,
  memorySamples:memorySamples.slice(-35),renderCount,interactions,transitions,swaps,
  retryCount,modelSwitches,
  noPrivateImagesUsed:true,produced3DFromArbitraryUserPhoto:false,
  familyAlpha:'HOLD',releaseAuthorized:false,physicalPhonesTested:false};
};
window.ccWardrobe10View=angle=>{
 if(!viewerReady||!last3D)throw Error('Verified source 3D not currently displayed');
 app.viewAt(angle);$('angle').value=String(angle);$('degree').textContent=angle+'°';
 return window.ccWardrobe10Diagnostics();
};
window.ccWardrobe10Test=Object.freeze({
 select,changeAccount,logout,
 initViewer,
 current:()=>current(),
 inject(which){
  if(!session)throw Error('Synthetic account not ready');
  if(which==='wrong-owner'||which==='duplicate'||which==='corrupt'||which==='unconfirmed'||
    which==='unsupported-category'){
   const list=readableItems().map(x=>({...x,confirmedDetails:{...x.confirmedDetails},
    originalPhoto:{...x.originalPhoto}}));
   if(which==='wrong-owner')list[0].ownerId='fixture-account-b';
   if(which==='duplicate')list[1].id=list[0].id;
   if(which==='unconfirmed'){list[0].userAdjusted=false;list[0].confirmedDetails=null;}
   if(which==='corrupt')list[0].originalPhoto.image='data:image/jpeg;base64,SU5WQUxJRA==';
   if(which==='unsupported-category'){list[0].category='Shoes';list[0].confirmedDetails.category='Shoes';}
   session.mutateForTest(list);return loadAccount();
  }
  if(['noWebGL','missingRig','sourceLoadFailure','staleApply'].includes(which)){
   flags[which]=true;return which==='staleApply'?present():initViewer();
  }
  throw Error('Unknown research-only failure injection');
 },
 reset(){for(const id of Object.keys(flags))flags[id]=false;
  session?.restore();return loadAccount().then(()=>initViewer());},
 delayedRead(){let release;const hold=new Promise(ok=>release=ok);
  session.delayForTest(()=>hold);
  const promise=loadAccount();
  return {promise,release};
 },
 currentPhotoOwns(){assertNoOtherOwner();return true;}
});
window.addEventListener('pagehide',()=>{bootToken++;clearRendered();stopViewer();});
async function start(){
 try{
  closets=await loadSyntheticLicensedClosets10();
  session=createSyntheticWardrobeSession10({closets});
  await loadAccount();await initViewer();safeControls();
 }catch(e){clearRendered();phase('error','Verified synthetic source fixture unavailable: '+e.message);}
}
start();
