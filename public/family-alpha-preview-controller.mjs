import {verifyAlphaAuthUser} from './family-alpha-2d-auth-preflight.mjs';
import {readAlphaSavedWardrobe,renderAlphaLiveSnapshot} from './family-alpha-2d-account-snapshot.mjs';
import {invalidateSavedBoard2D} from './family-alpha-2d-saved-board.mjs';
import {prepareReviewedPhotoPresentation} from '../research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs';
import {confirmReviewedPhotoInContainer} from '../research/family-alpha-reviewed-photo/preview-confirmation.mjs';

/**
 * LOCAL DEVELOPMENT PREVIEW ONLY — account-bound bridge into the EXISTING
 * Outfit Builder. NOT a staging/production feature or a Supabase policy check.
 * Current user, private IndexedDB handle and cloud owner are supplied by app
 * accessors (never inferred from a name, URL parameter or user-editable label).
 *
 * The existing board and closet remain untouched; all approved PNGs stay
 * ephemeral. New Auth/board activity invalidates pending async masks.
 */
const SLOTS=['top','bottom','shoes','layer','layer2','layer3'];
export const alphaLocalEnabled=({hostname,flag}={})=>
 (hostname==='localhost'||hostname==='127.0.0.1')&&flag===true;

export function mountAlphaBuilderPreview({
 panel,launch,review,avatar,status,
 auth,cloud,getDatabase,getLatestItem,fetchFn,publicKey,cryptoProvider,
 localApproved=false
}={}){
 if(!localApproved||!panel||!launch||!review||!avatar||!status||
  !auth||!cloud||typeof getDatabase!=='function'||
  typeof getLatestItem!=='function'||typeof fetchFn!=='function'||
  !publicKey)throw Error('Family Alpha localhost-only preview dependencies missing');
 let serial=0,abort=null,destroyed=false;
 const clear=()=>{
  serial++;
  abort?.abort();
  abort=null;
  review.replaceChildren();
  invalidateSavedBoard2D(avatar);
 };
 const notify=text=>{status.textContent=text;};
 const scope=(database)=>{
  const ownerId=auth.user?.id,epoch=auth.getSessionGeneration?.();
  if(!ownerId||!Number.isSafeInteger(epoch)||epoch<1||
    database?.name!=='closet-current-user-'+ownerId||
    cloud.getOwnerId(database)!==ownerId)
    throw Error('Family Alpha account unavailable');
  return Object.freeze({ownerId,epoch,database});
 };
 const current=(start,number)=>!destroyed&&serial===number&&
  auth.user?.id===start.ownerId&&auth.getSessionGeneration?.()===start.epoch&&
  getDatabase()===start.database&&cloud.getOwnerId(start.database)===start.ownerId;
 function invalidate(){
  if(destroyed)return;
  clear();
  notify('Outfit or account changed. Preview cleared; choose Preview again.');
 }
 async function start(){
  if(destroyed)return;
  clear();const number=serial,controller=new AbortController();abort=controller;
  launch.disabled=true;
  notify('Checking your account and saved outfit…');
  try{
   const database=getDatabase(),initial=scope(database);
   const fetchAuth={auth,database,fetchFn,publicKey,
    getCloudOwnerId:()=>cloud.getOwnerId(database),
    getSessionGeneration:()=>auth.getSessionGeneration()};
   const verified=await verifyAlphaAuthUser(fetchAuth);
   if(verified.ownerId!==initial.ownerId||!current(initial,number))
    throw Error('Account changed');
   const saved=await readAlphaSavedWardrobe({auth,cloud,database});
   if(!current(initial,number))throw Error('Account changed');
   const ids=SLOTS.map(slot=>saved.board.slots[slot]).filter(Boolean);
   if(!ids.length||ids.some(id=>typeof id!=='string')||
    new Set(ids).size!==ids.length)throw Error('Choose at least one valid saved garment');
   const wardrobe=new Map(saved.items.map(item=>[item.id,item]));
   const prepared=Object.create(null);
   for(const id of ids){
    if(!current(initial,number))throw Error('Account changed');
    const item=wardrobe.get(id);
    if(!item||!getLatestItem(id))throw Error('Selected garment unavailable');
    notify('Review the original clothing photo and transparent cutout. You may retake it.');
    const output=await prepareReviewedPhotoPresentation({
     item,ownerId:initial.ownerId,cryptoProvider,
     getScope:()=>({ownerId:auth.user?.id,epoch:auth.getSessionGeneration?.()}),
     getItem:()=>getLatestItem(id),
     isCurrent:()=>current(initial,number),
     reviewPreview:detail=>confirmReviewedPhotoInContainer(review,detail,{
      signal:controller.signal,isActive:()=>current(initial,number)
     })
    });
    if(!current(initial,number))throw Error('Account changed');
    if(output.status!=='approved-for-staging-preview'||!output.presentation?.humanPreviewConfirmed||
     !output.presentation.sourcePixelAuditPassed||
     !output.presentation.stagingPreviewOnly)
     throw Error('Photo needs review or retake before avatar preview');
    prepared[id]=output.presentation;
   }
   if(!current(initial,number))throw Error('Account changed');
   notify('Rechecking account, saved outfit and original photos…');
   const outcome=await renderAlphaLiveSnapshot(avatar,{
    auth,cloud,database,fetchFn,publicKey,cryptoProvider,
    preparePresentations:async({ownerId,board,items})=>{
     if(!current(initial,number)||ownerId!==initial.ownerId)
      throw Error('Account changed during final garment verification');
     const latest=SLOTS.map(slot=>board.slots[slot]).filter(Boolean);
     if(latest.length!==ids.length||latest.some((id,index)=>id!==ids[index])||
      latest.some(id=>!items.some(item=>item.id===id)))
      throw Error('Saved outfit changed; retake preview');
     return prepared;
    }
   });
   if(!current(initial,number))throw Error('Account changed');
   notify('Reviewed 2D photo preview. It does not show realistic fit.');
   return outcome;
  }catch{
   if(serial===number){
    review.replaceChildren();
    invalidateSavedBoard2D(avatar);
    notify('Preview unavailable. Check the saved outfit, photo cutouts and account, then try again.');
   }
   return null;
  }finally{
   if(serial===number){launch.disabled=false;abort=null;}
  }
 }
 launch.addEventListener('click',start);
 panel.hidden=false;launch.disabled=false;
 const pagehide=()=>invalidate();
 const boardChange=()=>invalidate();
 const sessionChange=()=>invalidate();
 const logout=()=>invalidate();
 window.addEventListener('pagehide',pagehide);
 window.addEventListener('closet:alpha-board-changed',boardChange);
 window.addEventListener('closet:alpha-session-changed',sessionChange);
 const logoutButton=document.getElementById('logout');
 logoutButton?.addEventListener('click',logout,{capture:true});
 const stop=()=>{
  if(destroyed)return;
  invalidate();destroyed=true;launch.removeEventListener('click',start);
  window.removeEventListener('pagehide',pagehide);
  window.removeEventListener('closet:alpha-board-changed',boardChange);
  window.removeEventListener('closet:alpha-session-changed',sessionChange);
  logoutButton?.removeEventListener('click',logout,{capture:true});
  panel.hidden=true;
 };
 notify('Local Family Alpha development preview: review each photographed garment before rendering.');
 return Object.freeze({start,invalidate,stop});
}
