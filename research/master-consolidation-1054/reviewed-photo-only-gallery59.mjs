/**
 * MAIN1054 M59 — research-only actual native-app original-photo GALLERY
 * for owner-reviewed, physically unverified MULTI24 source regions.
 * It is deliberately NOT a fitted outfit figure or 3D reconstruction.
 * No consumer/public/ wiring, auth or private database writes, hosted calls.
 */
import {preflightReviewedPhotoOnly59} from './reviewed-photo-only-handoff59.mjs';
import {jpegBytes,digestBytes} from '../../public/native-canonical-photo-source-167.mjs';

const fail=reason=>{throw Error('MAIN59_GALLERY '+reason);};
function sameLease(a,b){
 try{
  if(!a||!b||a.authenticated!==true||b.authenticated!==true||
    a.ownerId!==b.ownerId||!a.ownerId||a.epoch!==b.epoch||
    a.operationEpoch!==b.operationEpoch||
    a.authRef!==b.authRef||a.privateDbRef!==b.privateDbRef||
    a.privateDbName!==b.privateDbName||
    b.privateDbName!=='closet-current-user-'+b.ownerId||
    b.authRef.user?.id!==b.ownerId||
    b.privateDbRef.name!==b.privateDbName||
    typeof b.authRef.assertCurrent!=='function')return false;
  b.authRef.assertCurrent();
  return true;
 }catch{return false;}
}
const stamp=board=>{
 try{
  if(!board||typeof board!=='object'||Array.isArray(board)||!board.slots||
    typeof board.slots!=='object'||Array.isArray(board.slots))return null;
  const json=JSON.stringify(board);
  return json&&json.length<=16384?json:null;
 }catch{return null;}
};
/** Auth-bound only; caller uses actual native currentBoard and private IDB. */
export function mountReviewedPhotoOnlyGallery59({
 target,getSession,readOwnerItems,getBoard,cleanBoard,
 events=globalThis.window,doc=globalThis.document
}={}){
 if(!target?.replaceChildren||!doc?.createElement||
   typeof getSession!=='function'||typeof getBoard!=='function'||
   typeof readOwnerItems!=='function'||typeof cleanBoard!=='function'||
   !events?.addEventListener||!events?.removeEventListener)
  fail('native signed owner and real board interface required');
 let closed=false,revision=0,shownLease=null,shownBoard=null,phase='idle';
 const currentSession=()=>{try{return getSession();}catch{return null;}};
 const currentStamp=()=>{
  try{
   const board=getBoard();
   return board?.then?null:stamp(board);
  }catch{return null;}
 };
 const clear=()=>{target.replaceChildren();shownLease=null;shownBoard=null;};
 const revoke=()=>{revision++;clear();phase='revoked';};
 const displayedCurrent=()=>shownLease&&shownBoard!==null&&
  sameLease(shownLease,currentSession())&&shownBoard===currentStamp();
 const assertLive=(ticket,start)=>{
  if(closed||ticket!==revision||!sameLease(start,currentSession()))
   fail('owner session changed or gallery revoked');
 };
 const onFocus=()=>{if(shownLease&&!displayedCurrent())revoke();};
 const onVisibility=()=>{
  if(doc.hidden||shownLease&&!displayedCurrent())revoke();
 };
 events.addEventListener('closet:session-locked',revoke);
 events.addEventListener('closet:style-owned-inventory-committed',revoke);
 events.addEventListener('pagehide',revoke);
 events.addEventListener('focus',onFocus);
 doc.addEventListener?.('visibilitychange',onVisibility);
 return Object.freeze({
  get status(){
   if(shownLease&&!displayedCurrent())revoke();
   return Object.freeze({phase,active:!closed,
    originalPhotoCount:target.querySelectorAll?.('img').length||0,
    physicalGarmentUnitsVerified:false,fittedOutfitAuthorized:false,
    renderAuthorized3D:false,releaseAuthorized:false,familyAlpha:'HOLD'});
  },
  clear:revoke,
  async refresh(){
   const ticket=++revision;
   clear();phase='checking';
   const start=currentSession();
   try{
    if(!sameLease(start,currentSession()))fail('authenticated owner required');
    const board=await getBoard();
    assertLive(ticket,start);
    const boardIdentity=stamp(board);
    if(!boardIdentity)fail('current native outfit unavailable');
    const first=await preflightReviewedPhotoOnly59({
     getSession,readOwnerItems,cleanBoard,board
    });
    assertLive(ticket,start);
    if(first.renderAuthorized3D!==false||
      first.fittedOutfitAuthorized!==false||
      first.unitIdentityVerified!==false)
     fail('source admission attempted unauthorized garment fit');
    const rows=await readOwnerItems();
    assertLive(ticket,start);
    const second=await preflightReviewedPhotoOnly59({
     getSession,readOwnerItems:async()=>rows,cleanBoard,board
    });
    assertLive(ticket,start);
    if(JSON.stringify(first.slots)!==JSON.stringify(second.slots))
     fail('selected private source changed between admission passes');
    const byId=new Map(rows.map(r=>[r.id,r])),pinned=[];
    for(const slot of second.slots){
     const row=byId.get(slot.itemId);
     if(!row||row.ownerId!==start.ownerId||
       row.sourceSHA256!==slot.sourceSHA256)
      fail('source or owner changed');
     const original=row.originalPhoto?.image;
     const digest=await digestBytes(jpegBytes(original));
     assertLive(ticket,start);
     if(digest!==slot.sourceSHA256)fail('private original changed');
     pinned.push({slot:slot.slot,itemId:slot.itemId,source:digest,
      image:original,fingerprint:JSON.stringify(row)});
    }
    const newest=await readOwnerItems();
    assertLive(ticket,start);
    const latest=new Map(newest.map(r=>[r.id,r]));
    for(const item of pinned)if(JSON.stringify(latest.get(item.itemId))!==item.fingerprint)
     fail('saved source changed during display');
    const current=await getBoard();
    assertLive(ticket,start);
    if(stamp(current)!==boardIdentity||currentStamp()!==boardIdentity)
     fail('native board revision changed');
    const wrapper=doc.createElement('section');
    wrapper.dataset.main59OriginalPhotoOnly='research';
    const header=doc.createElement('p');
    header.textContent='Research: selected original photographs, not a fitted outfit';
    wrapper.append(header);
    const warning=doc.createElement('p');
    warning.setAttribute('role','status');
    warning.dataset.physicalGarmentUnit='unverified';
    warning.textContent=second.warning;
    wrapper.append(warning);
    const grid=doc.createElement('div');
    grid.style.display='grid';
    grid.style.gridTemplateColumns='repeat(auto-fit,minmax(min(100%,140px),1fr))';
    grid.style.gap='12px';
    for(const p of pinned){
     const figure=doc.createElement('figure');
     figure.style.margin='0';
     const img=doc.createElement('img');
     img.src=p.image;img.alt='Owner original photograph for '+p.slot+'; physical garment boundaries unverified';
     img.style.width='100%';img.style.maxHeight='220px';img.style.objectFit='contain';
     const caption=doc.createElement('figcaption');
     caption.textContent=p.slot+' · original JPEG only · garment unit unverified';
     figure.append(img,caption);grid.append(figure);
    }
    wrapper.append(grid);
    assertLive(ticket,start);
    if(currentStamp()!==boardIdentity)fail('native outfit changed at presentation');
    target.replaceChildren(wrapper);
    shownLease=start;shownBoard=boardIdentity;phase='visible';
    if(!displayedCurrent()){
     revoke();fail('session or board revoked at presentation');
    }
    return Object.freeze({
     status:'reviewed-original-gallery-only-physical-unit-unverified',
     photoCount:pinned.length,renderAuthorized3D:false,
     fittedOutfitAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'
    });
   }catch(error){
    if(ticket===revision&&!closed){clear();phase='refused';}
    throw error;
   }
  },
  dispose(){
   if(closed)return;
   closed=true;revoke();
   events.removeEventListener('closet:session-locked',revoke);
   events.removeEventListener('closet:style-owned-inventory-committed',revoke);
   events.removeEventListener('pagehide',revoke);
   events.removeEventListener('focus',onFocus);
   doc.removeEventListener?.('visibilitychange',onVisibility);
   phase='closed';
  }
 });
}
