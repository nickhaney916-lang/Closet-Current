/**
 * PAR10 — synthetic-account research app. Existing Closet Current 3D68
 * saved schema + 3D69 exact licensed-source mesh gate, 3D78/PAR08 isolated
 * mobile viewer and original JPEG-only 2D fallback.
 * Never production auth, DB, storage, private pictures or CDN.
 */
import {mountAnatomicalShowroom} from './dress-mobile-showroom.mjs';
import {classifySourcePhotoView10} from '../denim-fit-06/source-photo-coverage-10.mjs';
import {loadLicensedCutout} from '../three-d-02/reviewed-texture.mjs';
import {planSavedSourceDress,applySavedSourceDress,DRESS_SHA} from '../integration-04-wardrobe-dress/owner-dress-guard.mjs';
import {createPoseContact} from '../three-d-42/posed-contact.mjs';
import {loadSourceVetted3D69ResearchBundle} from '../three-d-69/sha-verified-original-garment-sources.mjs';
import {loadSyntheticLicensedClosets10,createSyntheticWardrobeSession10,
 planOwnerBoundSelection10,prepareSourceBoundOutfit10,displaySourceBoundOutfit10,
 SYNTHETIC_SOURCES10} from '../integration-04-wardrobe-dress/account-source-bridge.mjs';

if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
 throw Error('Synthetic original-photo wardrobe bridge is localhost-only');
const $=id=>document.getElementById(id);
let session=null,bound=null,closets=null,app=null,bundles=null,dressCandidate=null,bootToken=0;
let slots={},mode='loading',viewerReady=false,viewerFailure=null,loadedFigure=null;
let interactions=0,transitions=0,negativeCases=[],memorySamples=[],renderCount=0,
 last3D=null,swaps=0,retryCount=0,modelSwitches=0,sourceVerified=false;
const flags={noWebGL:false,missingRig:false,sourceLoadFailure:false,delayRead:false,staleApply:false,noDressMesh:false};
const phase=(name,message)=>{mode=name;$('status').textContent=message;$('status').dataset.phase=name;};
const current=()=>session?.current()||{authenticated:false,ownerId:null,generation:0};
const isCurrent=s=>{const t=current();return !!s&&t.authenticated&&
 t.ownerId===s.ownerId&&t.generation===s.generation};
const authorized=()=>!!bound&&isCurrent(bound);
// This is always front-only source coverage. We never infer original photos
// of unseen sides/rear from 163-bone geometry or a flat fallback material.
function updatePhotoCoverage10(degrees=app?.getState()?.viewAngle??0){
 const label=$('photoCoverage');
 const selectedBottom=bound?.indexed?.byId?.get(slots.bottom);
 const selectedTop=bound?.indexed?.byId?.get(slots.top);
 const sha=last3D?.originalPhotoSHA256s;
 const denim=selectedBottom?.sourceSHA256===sha?.bottom&&
  [SYNTHETIC_SOURCES10.public.sha,SYNTHETIC_SOURCES10.second.sha].includes(sha?.bottom);
 const dress=selectedTop?.sourceSHA256===sha?.dress&&sha?.dress===DRESS_SHA;
 const valid=authorized()&&viewerReady&&sourceVerified&&!!last3D&&
  app?.getState()?.stats?.bones===163&&(denim||dress);
 if(!valid){
  label.textContent='';label.dataset.visible='false';label.dataset.viewClass='hidden';
  label.dataset.rearPhotoVerified='false';return null;
 }
 const proof=classifySourcePhotoView10(degrees);
 // Avoid repeated live-region announcements during drag/spin of one angle class.
 if(label.dataset.viewClass!==proof.viewClass||label.dataset.visible!=='true')
  label.textContent=proof.explanation;
 label.dataset.viewClass=proof.viewClass;
 label.dataset.visible='true';
 label.dataset.rearPhotoVerified='false';
 return proof;
}
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
 $('photoCoverage').textContent='';$('photoCoverage').dataset.visible='false';
 $('photoCoverage').dataset.viewClass='hidden';$('photoCoverage').dataset.rearPhotoVerified='false';
 last3D=null;
 try{app?.applyOutfit('none');}catch{}
}
function stopViewer(){
 if(app){try{app.stop();}catch{}app=null;}
 if(bundles){for(const z of bundles)try{z?.dispose();}catch{}bundles=null;}
 viewerReady=false;loadedFigure=null;dressCandidate=null;
}
function showFallback(reason){
 $('viewerHost').style.display='none';$('photoFallback').dataset.visible='true';
 $('fallbackReason').textContent=reason;
 $('photoCoverage').textContent='';$('photoCoverage').dataset.visible='false';
 $('photoCoverage').dataset.viewClass='hidden';$('photoCoverage').dataset.rearPhotoVerified='false';
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
 for(const id of ['front','side','back','zin','zout','reset-view','turn','angle'])$(id).disabled=!enabled;
 $('model').disabled=!ok;
 const verifiedDress=enabled&&!!last3D&&
  bound?.indexed?.byId?.get(slots.top)?.category==='Dresses'&&
  last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha&&
  new URLSearchParams(location.search).get('motion')==='after';
 for(const id of ['sway','sway-back','reset-sway'])$(id).disabled=!verifiedDress;
 const verifiedGait=enabled&&!!last3D&&
  bound?.indexed?.byId?.get(slots.top)?.category==='Dresses'&&
  last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha&&
  new URLSearchParams(location.search).get('walk')==='after';
 for(const id of ['walk-left','walk-right','walk-reset','walk-play','walk-stop','walk-audit'])$(id).disabled=!verifiedGait;
 updatePhotoCoverage10();
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
  detail.textContent=item.color+' '+item.itemType+(item.category==='Dresses'?' · licensed source 3D':'');
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
  if(bound.indexed.byId.get(slots.top)?.category==='Dresses'){
    if(!viewerReady||viewerFailure||!dressCandidate||flags.noDressMesh){
     try{app?.applyOutfit('none');}catch{}
     showFallback('Source-authentic 3D dress unavailable; verified original JPEG / 2D shown.');
     phase('ready','Dress original photograph fallback (no authorized 3D).');
     decision={status:'original-photo-2d'};
    }else{
     if(flags.staleApply)throw Error('Owner changed before dress 3D');
     const plan=planSavedSourceDress({bound,live:current,slots,dress:dressCandidate});
     last3D=applySavedSourceDress({viewer:app,plan,live:current});
     $('photoFallback').dataset.visible='false';$('viewerHost').style.display='block';
     decision={status:'verified-3d'};
     phase('ready','Verified original photographed dress on anatomical 163-bone 3D · REVIEW');
    }
    refreshEvidence(decision);recorded('dress-present');assertNoOtherOwner();safeControls();return;
   }
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
 else if(item.category==='Bottoms'){
  if(readableItems().find(v=>v.id===slots.top)?.category==='Dresses')slots={top:readableItems().find(v=>v.category==='Tops').id};
  slots.bottom=id;delete slots.dress;}
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
  // The research fixture's stored display metadata must match the exact
  // locally hashed and account-scoped canonical index. A reclassified source
  // must not remain visible with a stale "confirmed" category/color label.
  const pristine=closets[identity.ownerId];
  for(const item of pristine){
   const verified=bound.indexed.byId.get(item.id);
   if(!verified||verified.sourceSHA256!==item.expectedSHA256||
      verified.category!==item.category||verified.itemType!==item.itemType||
      verified.color!==item.color||verified.ownerId!==identity.ownerId)
    throw Error('Confirmed source photo/category/color or account changed since trusted original fixture');
  }
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
   const manifest=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'});
   if(!manifest.ok)throw Error('Original licensed dress manifest missing');
   dressCandidate=await loadLicensedCutout('commons-0053',{manifest:await manifest.json(),reviewConfirmed:true});
   if(dressCandidate?.id!=='commons-0053'||dressCandidate.sourceSHA256!==DRESS_SHA||!dressCandidate.realFabricTexture)
    throw Error('Original dress SHA or cutout invalid');
   if(token!==bootToken||!isCurrent(identity))return;
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
   onViewChange:angle=>updatePhotoCoverage10(angle),
   premiumTurntable67:true,independentGarments:true,poseContactFactory:createPoseContact,
   crispSourcePhotoClarity:true,jeansPanelFall:true,tailoredShoulderSleeves:true,
   independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,
   sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,naturalShoulderSleeveTransition:true,
   sourceMeasuredSleeveHang:true,anatomicalShirtSideFlow:true,naturalShoulderFall61:true,
   trueShoulderTop64:true,poseConditionedSleeveDrape:true,
   photoDenimRearDrape73:true,photoDenimCalfHang74:true,
   photoDenimFolds75:true,photoDenimContinuity76:true,photoDenimContactAudit77:true,
   photoDenimKneePose78:true,
    photoDenimFlex79:new URLSearchParams(location.search).get('flex79')==='after',dressMobile74:true,
    skirtSecondaryMotion01:['after'].includes(new URLSearchParams(location.search).get('motion'))||
     new URLSearchParams(location.search).get('walk')==='after',
    poseDrivenDressWalk02:new URLSearchParams(location.search).get('walk')==='after',
    poseConditionedPleats03:new URLSearchParams(location.search).get('walk')==='after'&&
      new URLSearchParams(location.search).get('folds')==='after',
    staticDressFit05:new URLSearchParams(location.search).get('dressFit')==='after',
    staticDenimFit06:new URLSearchParams(location.search).get('denimFit')==='after',
    sourceDenimSilhouette07:new URLSearchParams(location.search).get('denimFit')==='after'&&
      new URLSearchParams(location.search).get('denimSilhouette')==='after',
     sourceDenimCuffFairing08:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after',
     sourceDenimRearThigh14:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after',
     sourceDenimSideThigh15:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after',
     sourceDenimPosteriorContour16:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after'&&
       new URLSearchParams(location.search).get('denimPosterior16')==='after',
     sourceDenimPhotoWidth17:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after'&&
       new URLSearchParams(location.search).get('denimPosterior16')==='after'&&
       new URLSearchParams(location.search).get('denimPhotoWidth17')==='after',
     sourceDenimProfile18:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after'&&
       new URLSearchParams(location.search).get('denimPosterior16')==='after'&&
       new URLSearchParams(location.search).get('denimPhotoWidth17')==='after'&&
       new URLSearchParams(location.search).get('denimProfile18')==='after',
     sourceDenimSigned19:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after'&&
       new URLSearchParams(location.search).get('denimPosterior16')==='after'&&
       new URLSearchParams(location.search).get('denimPhotoWidth17')==='after'&&
       new URLSearchParams(location.search).get('denimProfile18')==='after'&&
       new URLSearchParams(location.search).get('denimSigned19')==='after',
     sourceDenimLine20:new URLSearchParams(location.search).get('denimFit')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after'&&
       new URLSearchParams(location.search).get('denimPosterior16')==='after'&&
       new URLSearchParams(location.search).get('denimPhotoWidth17')==='after'&&
       new URLSearchParams(location.search).get('denimProfile18')==='after'&&
       new URLSearchParams(location.search).get('denimSigned19')==='after'&&
       new URLSearchParams(location.search).get('denimLine20')==='after',
     sourceDenimFold21:new URLSearchParams(location.search).get('denimFold21')==='after'&&
       new URLSearchParams(location.search).get('denimLine20')==='after'&&
       new URLSearchParams(location.search).get('denimSigned19')==='after'&&
       new URLSearchParams(location.search).get('denimProfile18')==='after'&&
       new URLSearchParams(location.search).get('denimPhotoWidth17')==='after'&&
       new URLSearchParams(location.search).get('denimPosterior16')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFit')==='after',
     sourceDenimCuffStack22:new URLSearchParams(location.search).get('denimStack22')==='after'&&
       new URLSearchParams(location.search).get('denimFold21')==='after'&&
       new URLSearchParams(location.search).get('denimLine20')==='after'&&
       new URLSearchParams(location.search).get('denimSigned19')==='after'&&
       new URLSearchParams(location.search).get('denimProfile18')==='after'&&
       new URLSearchParams(location.search).get('denimPhotoWidth17')==='after'&&
       new URLSearchParams(location.search).get('denimPosterior16')==='after'&&
       new URLSearchParams(location.search).get('denimSide15')==='after'&&
       new URLSearchParams(location.search).get('denimRear14')==='after'&&
       new URLSearchParams(location.search).get('denimFairing')==='after'&&
       new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
       new URLSearchParams(location.search).get('denimFit')==='after'
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
   app.applyOutfit('none'); // Remove initial neutral pants before any dress.
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
 if(readableItems().find(v=>v.id===slots.top)?.category==='Dresses'){
  slots={top:readableItems().find(v=>v.category==='Tops').id,bottom:bottoms[0].id};
 }else{
  const i=bottoms.findIndex(x=>x.id===slots.bottom);
  slots.bottom=bottoms[(i+1)%bottoms.length].id;
 }
 interactions++;swaps++;present();
});
$('model').addEventListener('change',async()=>{
 if(!authorized())return;
 const kind=$('model').value;modelSwitches++;
 if(app&&viewerReady){
  viewerReady=false;
  try{
   if(flags.missingRig||await app.load(kind)!==true)throw Error('Actual 163-bone model switch unavailable');
   if(app.getState().stats?.bones!==163)throw Error('Switched model lacks 163 bones');
    app.applyOutfit('none');
   viewerReady=true;loadedFigure=kind;present();
  }catch(e){viewerFailure=String(e.message||e);stopViewer();present();}
 }else await initViewer();
});
for(const [id,method] of [['front','front'],['side','side'],['back','back']]){
 $(id).addEventListener('click',()=>{if(!viewerReady)return;app[method]();
  const a=id==='front'?0:id==='side'?90:180;
  $('angle').value=String(a);$('degree').textContent=a+'°';
  updatePhotoCoverage10(app.getState().viewAngle??a);
  interactions++;recorded('view-'+id);
 });
}
$('angle').addEventListener('input',()=>{if(!viewerReady)return;
 const a=Number($('angle').value);app.viewAt(a);$('degree').textContent=a+'°';
 updatePhotoCoverage10(app.getState().viewAngle??a);interactions++;});
$('zin').addEventListener('click',()=>{if(viewerReady){app.zoom(.84);interactions++;}});
$('zout').addEventListener('click',()=>{if(viewerReady){app.zoom(1.18);interactions++;}});
$('reset-view').addEventListener('click',()=>{
 if(!viewerReady||!authorized()||!last3D)return;
 const reset=app.resetView();
 $('angle').value='0';$('degree').textContent='0°';
 updatePhotoCoverage10(reset.viewAngle);
 interactions++;recorded('full-body-camera-reset-13');
});
$('turn').addEventListener('click',()=>{if(viewerReady){app.setSpin(!app.getState().spinEnabled);interactions++;}});
 for(const [id,action] of [['walk-left','left-step'],['walk-right','right-step'],['walk-reset','reset'],
   ['walk-play','play'],['walk-stop','stop'],['walk-audit','audit']]){
  $(id).addEventListener('click',()=>{window.ccWardrobeGait02(action);interactions++;});
 }
 for(const [id,action] of [['sway','left'],['sway-back','right'],['reset-sway','reset']]){
  $(id).addEventListener('click',()=>{window.ccWardrobeSkirtMotion01(action);interactions++;});
 }
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
   outfitMode:state?.outfit?.mode||'none',realDress:state?.outfit?.dress||null,
    skirtMotion:state?.outfit?.fabricMotion||null,skirtMotionActive:state?.skirtMotionActive||false,
    skirtMotionEnabled:state?.skirtMotionEnabled||false,
    gait02Enabled:state?.gait02Enabled||false,gait02Active:state?.gait02Active||false,
    gait02State:state?.gait02State||null,
     posePleats03Enabled:state?.posePleats03Enabled||false,
     posePleats03State:state?.posePleats03State||null,
      staticDressFit05Enabled:state?.staticDressFit05Enabled||false,
      staticDressFit05State:state?.staticDressFit05State||null,
      sourceDenimSilhouette07Enabled:state?.sourceDenimSilhouette07Enabled||false,
      sourceDenimCuffFairing08Enabled:state?.sourceDenimCuffFairing08Enabled||false,
      sourceDenimRearThigh14Enabled:state?.sourceDenimRearThigh14Enabled||false,
      sourceDenimSideThigh15Enabled:state?.sourceDenimSideThigh15Enabled||false,
      sourceDenimPosteriorContour16Enabled:state?.sourceDenimPosteriorContour16Enabled||false,
      sourceDenimPhotoWidth17Enabled:state?.sourceDenimPhotoWidth17Enabled||false,
      sourceDenimProfile18Enabled:state?.sourceDenimProfile18Enabled||false,
      sourceDenimSigned19Enabled:state?.sourceDenimSigned19Enabled||false,
      sourceDenimLine20Enabled:state?.sourceDenimLine20Enabled||false,
      sourceDenimFold21Enabled:state?.sourceDenimFold21Enabled||false,
      sourceDenimCuffStack22Enabled:state?.sourceDenimCuffStack22Enabled||false,
      staticDenimFit06Enabled:state?.staticDenimFit06Enabled||false,
      staticDenimFit06State:state?.staticDenimFit06State||null,
     swept04Clock:state?.continuousGait04||null,
     swept04Enabled:new URLSearchParams(location.search).get('sweep')==='after'&&
      new URLSearchParams(location.search).get('walk')==='after'&&
      new URLSearchParams(location.search).get('folds')==='after',
   dressOriginalSHA256:dressCandidate?.sourceSHA256||null,
  fallbackVisible:$('photoFallback').dataset.visible==='true',
  photoCoverageViewClass:authorized()&&viewerReady?$('photoCoverage').dataset.viewClass:'hidden',
  sourcePhotoCoverageVisible:authorized()&&viewerReady&&$('photoCoverage').dataset.visible==='true',
  verifiedOriginalRearPhotograph:false,
  displayed3DSources:last3D?.originalPhotoSHA256s||null,
  memory:state?{geometries:state.geometries,textures:state.textures,
   tracked:state.trackedGarmentGeometries,reclaimed:state.reclaimedGarmentGeometries,
   frames:state.frames,cameraDistance:state.cameraDistance,cameraPosition:state.cameraPosition,cameraTarget:state.cameraTarget,drawPixels:state.drawPixels}:null,
  memorySamples:memorySamples.slice(-35),renderCount,interactions,transitions,swaps,
  retryCount,modelSwitches,
  noPrivateImagesUsed:true,produced3DFromArbitraryUserPhoto:false,
  familyAlpha:'HOLD',releaseAuthorized:false,physicalPhonesTested:false};
};
window.ccWardrobe10View=angle=>{
 if(!viewerReady||!last3D)throw Error('Verified source 3D not currently displayed');
 app.viewAt(angle);$('angle').value=String(angle);$('degree').textContent=angle+'°';
 updatePhotoCoverage10(app.getState().viewAngle??angle);
 return window.ccWardrobe10Diagnostics();
};
// Locally restricted real 163-bone denim audit; never authorizes release.
window.ccWardrobeFlexPose=next=>{
 if(!authorized()||!viewerReady||!last3D||
    !['source','left-12','right-12','both-16'].includes(next))
  throw Error('Current synthetic account + verified source 3D required');
 const sha=last3D.originalPhotoSHA256s?.bottom;
 const result=app.auditKneePose78(next),p=result?.pants;
 if(![SYNTHETIC_SOURCES10.public.sha,SYNTHETIC_SOURCES10.second.sha].includes(sha)||
    !p?.realKneeArticulationAudited78||p.originalPhotoCoordinatesPreserved78!==true||
    p.realKneeSkinnedBodyToDenimCrossings78!==0)
  throw Error('Unverified original photograph or skinned contact');
 recorded('account-bound-flex-'+next);
 return {sourceSHA:sha,account:current().ownerId,generation:current().generation,
  degrees:p.originalRigKneePose78.kneeJointDegrees,
  actualKneeBones:p.originalRigKneePose78.actualKneeBones,
  contact:p.realKneeSkinnedBodyToDenimCrossings78,
  originalPhotoUnchanged:p.originalPhotoCoordinatesPreserved78,
  flexApplied:p.denimFlexApplied79===true,flexRestored:p.denimFlexRestored79===true,
  flexFrontPhotoUnchanged:p.denimFlexFrontSourceVerticesByteIdentical79===true,
  flexNoNewCrossings:p.denimFlexNoNewTriangleCrossings79===true,
  flexChangedVertices:p.denimFlexChangedVertices79||0,
  flexActualBoundedShift:p.denimFlexActualBoundedShift79||0,
  releaseAuthorized:false};
};
// This function intentionally provides NO access to arbitrary geometry or accounts.
window.ccWardrobeSkirtMotion01=action=>{
 const verified=authorized()&&viewerReady&&!!last3D&&
  bound.indexed.byId.get(slots.top)?.category==='Dresses'&&
  last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha&&
  app.getState().stats?.bones===163&&app.getState().outfit?.mode==='dress'&&
  new URLSearchParams(location.search).get('motion')==='after';
 if(!verified)throw Error('Current owner, exact source photographed dress, 163-bone rig and motion opt-in required');
 if(!['left','right','reset'].includes(action))throw Error('Only bounded dress movement or exact reset permitted');
 const result=action==='reset'?app.resetFabricMotion01():app.kickFabricMotion01(action==='left'?1:-1);
 return {account:current().ownerId,generation:current().generation,
  dressSHA:SYNTHETIC_SOURCES10.dress.sha,action,motion:result,
  genuine163BoneDress:true,releaseAuthorized:false,collisionCertified:false};
};
window.ccWardrobeDenimFreeze06=()=>{
  const owner=current();
  const prepared=last3D?.originalPhotoSHA256s?.bottom;
  const expected=bound?.indexed?.byId?.get(slots.bottom)?.sourceSHA256;
  if(!authorized()||!viewerReady||!last3D||!owner.authenticated||
    !['pants','shirt-pants'].includes(app?.getState()?.outfit?.mode)||
    !prepared||prepared!==expected||
    ![SYNTHETIC_SOURCES10.public.sha,SYNTHETIC_SOURCES10.second.sha].includes(prepared)||
    bound?.ownerId!==owner.ownerId||bound?.generation!==owner.generation||
    app.getState().stats?.bones!==163||
    app.getState().staticDenimFit06Enabled!==true||
    new URLSearchParams(location.search).get('denimFit')!=='after')
   throw Error('Current synthetic owner, saved original photographed jeans SHA and explicit 3D fitting required');
  const proof=app.freezeDenimFit06();
  if(new URLSearchParams(location.search).get('denimSilhouette')==='after'&&
     (!proof.sourceMeasuredAnatomicalSilhouette07||
      !proof.originalSkinnedKneeHemTaperImproved07||
      !proof.originalPhotoTextureRGBAndUVUnmodified07||
      proof.additionalKneeVsHemEaseMeters07<.008))
   throw Error('Genuine source photographed jeans silhouette did not pass anatomical taper audit');
  if(new URLSearchParams(location.search).get('denimFairing')==='after'&&
    (!proof.originalSourceNeutralCuffFairing08||
     !proof.originalPhotoTextureRGBAndUVUnmodified08||
     proof.cuffReleasedVertices08<8||proof.maxCuffReleaseMeters08<.008))
   throw Error('Actual licensed photographed cuff fairing proof missing');
  if(new URLSearchParams(location.search).get('denimRear14')==='after'&&
    (!proof.sourceMeasuredRearThighRelief14||
     !proof.originalPhotographedFrontProtected14||
     !proof.sourcePhotoRGBUVRestAndSkinUnchanged14||
     !proof.noInventedPhotographicRear14||
     proof.rearThighSourceNeutralVertices14<40||
     Math.min(...proof.rearThighPerLeg14)<15||
     proof.rearThighMaximumWorldMoveMeters14<.008))
   throw Error('Actual source-neutral measured rear thigh geometry failed, never fabricate photographic rear');
  if(new URLSearchParams(location.search).get('denimSide15')==='after'&&
    (!proof.sourceMeasuredSideThighRelief15||
     !proof.originalPhotographedFrontProtected15||
     !proof.sourcePhotoRGBUVRestAndSkinUnchanged15||
     !proof.noInventedPhotographicRear15||
     proof.sideThighSourceNeutralVertices15<40||
     Math.min(...proof.sideThighPerLeg15)<15||
     proof.sideThighMaximumWorldMoveMeters15<.006||
     proof.sideThighMaximumWorldMoveMeters15>.0065001))
   throw Error('True sewn source-neutral side thigh geometry failed; cannot invent rear fabric photo');
  if(new URLSearchParams(location.search).get('denimPosterior16')==='after'&&
    (!proof.sourceMeasuredPosteriorContour16||
     !proof.original163BoneHipKneeAnchor16||
     !proof.frontPhotographUVRestSkinProtected16||
     !proof.rearIsModeledNotPhotographed16||
     proof.posteriorSourceNeutralVertices16<40||
     Math.min(...proof.posteriorPerLeg16)<15||
     proof.posteriorMaximumWorldMoveMeters16<.0105||
     proof.posteriorMaximumWorldMoveMeters16>.0115001))
   throw Error('Original photographed jeans rear source-neutral contour invalid or missing');
  if(new URLSearchParams(location.search).get('denimPhotoWidth17')==='after'&&
    (!proof.originalPhotoCalibratedCalfWidth17||
     !proof.frontJPEGUVRestSkinUnchanged17||
     proof.unseenRearPhotoSynthesized17!==false||
     proof.sourceCalfWidthMovedVertices17<40||
     Math.min(...proof.sourceCalfWidthPerLeg17)<15||
     proof.sourceCalfWidthMaxShiftMeters17<.007||
     proof.sourceCalfWidthMaxShiftMeters17>.0180001||
     !Array.isArray(proof.sourceCutoutLegWidthRatios17)||
     proof.sourceCutoutLegWidthRatios17.length!==2))
    throw Error('W17 original garment photograph hem source-provenance or visual silhouette invalid');
  if(new URLSearchParams(location.search).get('denimProfile18')==='after'&&
    (!proof.sourceMeasuredOriginalCalfProfile18||
     !proof.originalFrontSHAUVRestAndSkinProtected18||
     !proof.noUnphotographedRearTexture18||
     !Array.isArray(proof.originalPhotoFiveLegStations18)||
     proof.originalPhotoFiveLegStations18.length!==2||
     proof.originalPhotoFiveLegStations18.some(x=>x.length!==5)||
     proof.photographedCalfProfileMovedVertices18<40||
     Math.min(...proof.photographedCalfProfilePerLeg18)<15||
     proof.photographedCalfProfileMaxShiftMeters18<.004||
     proof.photographedCalfProfileMaxShiftMeters18>.0180001))
   throw Error('P18 five source photo stations, original front or actual skinned drape invalid');
  if(new URLSearchParams(location.search).get('denimSigned19')==='after'&&
    (!proof.originalPhotoDirectionalCalf19||!proof.originalPhotoFrontUnchanged19||
     !proof.unphotographedRearUnchanged19||
     proof.signedSourceCalfMovedVertices19<25||
     Math.min(...proof.signedSourceCalfPerLeg19)<10||
     proof.sourcePhotoSignedShiftMaxMeters19<.001||
     proof.sourcePhotoSignedShiftMaxMeters19>.0115001))
   throw Error('P19 signed original photographed taper missing or untrusted');
  if(new URLSearchParams(location.search).get('denimLine20')==='after'&&
    (!proof.sourceNeutralAnatomicalLine20||
     !proof.originalJPEGUVRestSkinProtected20||
     !proof.noInventedPhotographicRear20||
     proof.photoAnatomicalThighMovedVertices20<30||
     Math.min(...proof.photoAnatomicalThighPerLeg20)<12||
     proof.photoAnatomicalCalfMovedVertices20<25||
     Math.min(...proof.photoAnatomicalCalfPerLeg20)<10||
     proof.photoAnatomicalThighMaxMeters20<.002||
     proof.photoAnatomicalThighMaxMeters20>.0048501||
     proof.photoAnatomicalCalfMaxMeters20<.0005||
     proof.photoAnatomicalCalfMaxMeters20>.0030001))
   throw Error('P20 original-photo protected bone-aligned model silhouette invalid');
  if(new URLSearchParams(location.search).get('denimFold21')==='after'&&
    (!proof.sourceNeutralKneeBreak21||!proof.originalJPEGUVRestSkinProtected21||
     !proof.rearFoldIsModeledNotPhotographed21||
     proof.sourceKneeBreakMovedVertices21<25||
     Math.min(...proof.sourceKneeBreakPerLeg21)<9||
     proof.sourceKneeBreakMaxMeters21<.001||
     proof.sourceKneeBreakMaxMeters21>.0054001))
   throw Error('P21 original-photo protected modeled bone knee break invalid');
  if(new URLSearchParams(location.search).get('denimStack22')==='after'&&
    (!proof.sourceNeutralCuffStack22||!proof.originalJPEGUVRestSkinProtected22||
     !proof.modeledCuffStackNotPhotographed22||
     proof.sourceCuffStackMovedVertices22<25||
     Math.min(...proof.sourceCuffStackPerLeg22)<9||
     proof.sourceCuffStackMaxMeters22<.001||
     proof.sourceCuffStackMaxMeters22>.009157))
   throw Error('P22 original photographed denim protected diagonal cuff fold invalid');


  const after=current();
  if(!after.authenticated||after.ownerId!==owner.ownerId||after.generation!==owner.generation||
    proof.originalPhotoSHA256!==expected||!proof.frontPhotographUnchanged||
    !proof.sourceUVRestAndSkinByteIdentical||!proof.trueBVHBodyContactNoNew)
   throw Error('Authenticated source denim owner and real body collision proof invalidated');
  recorded('original-source-denim-static-fit06');
  return {...proof,account:owner.ownerId,generation:owner.generation,
   sourceBoundToSavedWardrobe:true,familyAlpha:'HOLD',productionModified:false,releaseAuthorized:false};
 };
 $('denim-freeze')?.addEventListener('click',e=>{
  if(!e.isTrusted)return;
  try{window.ccWardrobeDenimFreeze06();interactions++;}
  catch(error){phase('ready','Original photographed jeans fitting blocked: '+String(error.message||error));}
 });
window.ccWardrobeDressFreeze05=()=>{
  const verified=authorized()&&viewerReady&&!!last3D&&
   bound.indexed.byId.get(slots.top)?.category==='Dresses'&&
   last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha&&
   app.getState().stats?.bones===163&&app.getState().outfit?.mode==='dress'&&
   app.getState().staticDressFit05Enabled===true&&
   new URLSearchParams(location.search).get('dressFit')==='after';
  if(!verified)throw Error('Current synthetic owner + original SHA-verified dress and static fit opt-in required');
  const pre={owner:current().ownerId,generation:current().generation};
  const result=app.freezeDressFit05();
  if(current().ownerId!==pre.owner||current().generation!==pre.generation)
   throw Error('Authenticated synthetic owner changed during photographed fit');
  if(!result.actualOriginalSourceDressStaticFit||
      !result.originalPhotoFrontUntouched||
      !result.sourceRestAndSkinPreserved||!result.zeroNewSkinnedBodyContacts)
   throw Error('Original licensed dress static fit did not pass identity and real BVH checks');
  recorded('original-photo-dress-static-fit05');
  return {...result,account:pre.owner,generation:pre.generation,
   familyAlpha:'HOLD',productionModified:false,releaseAuthorized:false};
 };
 $('dress-freeze')?.addEventListener('click',event=>{
  if(!event.isTrusted)return;
  try{window.ccWardrobeDressFreeze05();interactions++;}
  catch(e){phase('ready','Original photographed dress fitting blocked: '+String(e.message||e));}
 });
window.ccWardrobeGait02=action=>{
 const verified=authorized()&&viewerReady&&!!last3D&&
  bound.indexed.byId.get(slots.top)?.category==='Dresses'&&
  last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha&&
  app.getState().stats?.bones===163&&app.getState().outfit?.mode==='dress'&&
  new URLSearchParams(location.search).get('walk')==='after';
 if(!verified)throw Error('Only present genuine source dress and current synthetic owner can move 163-bone rig');
 const methods={'left-step':()=>app.setGaitPhase02(.25),
  'right-step':()=>app.setGaitPhase02(.75),
  'reset':()=>app.resetGait02(),
  'play':()=>app.startGait02(),
  'stop':()=>app.resetGait02(),
  'audit':()=>app.auditGaitDress02()};
 if(!Object.hasOwn(methods,action))throw Error('Only verified walking/pose/contact actions available');
 const result=methods[action]();recorded('actual-bone-gait-'+action);
 return {action,account:current().ownerId,generation:current().generation,
  dressSHA:SYNTHETIC_SOURCES10.dress.sha,result,
  sourceTrue163BoneResearch:true,fullClothPhysics:false,
  sweptCollisionCertified:false,releaseAuthorized:false};
};
// Limited, source/owner-gated discrete gait samples only. Never claim full
// swept surface collision certification from nine measured poses.
window.ccWardrobeSweep04=phase=>{
 const approved=authorized()&&viewerReady&&!!last3D&&
  bound.indexed.byId.get(slots.top)?.category==='Dresses'&&
  last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha&&
  app.getState().stats?.bones===163&&app.getState().outfit?.mode==='dress'&&
  app.getState().posePleats03Enabled===true&&
  new URLSearchParams(location.search).get('sweep')==='after'&&
  new URLSearchParams(location.search).get('folds')==='after'&&
  new URLSearchParams(location.search).get('walk')==='after';
 if(!approved)throw Error('Original SHA-verified 163-bone dress, current owner and explicit sweep research required');
 if(!Number.isFinite(phase)||phase<0||phase>1||
   Math.abs(phase*8-Math.round(phase*8))>1e-9)
  throw Error('Finite exact nine-point real anatomical gait phase required');
 const bodyAndDrape=app.sampleSweep04(phase);
 return {phase,account:current().ownerId,generation:current().generation,
  sourceSHA:SYNTHETIC_SOURCES10.dress.sha,bodyAndDrape,
  realSkinnedBones:true,unseenTextureNotInvented:true,
  mathematicallySweptCollisionCertified:false,releaseAuthorized:false};
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
   if(which==='wrong-owner')list[0].ownerId=current().ownerId==='fixture-account-a'?'fixture-account-b':'fixture-account-a';
   if(which==='duplicate')list[1].id=list[0].id;
   if(which==='unconfirmed'){list[0].userAdjusted=false;list[0].confirmedDetails=null;}
   if(which==='corrupt')list[0].originalPhoto.image='data:image/jpeg;base64,SU5WQUxJRA==';
   if(which==='unsupported-category'){list[0].category='Shoes';list[0].confirmedDetails.category='Shoes';}
   session.mutateForTest(list);return loadAccount();
  }
  if(['noWebGL','missingRig','sourceLoadFailure','staleApply','noDressMesh'].includes(which)){
   flags[which]=true;return (which==='staleApply'||which==='noDressMesh')?present():initViewer();
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
