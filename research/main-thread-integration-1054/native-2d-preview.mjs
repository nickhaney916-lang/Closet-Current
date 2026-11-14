/**
 * Mission 4 MAIN1054: research-only signed-owner original-photo outfit preview.
 * Read-only, no remote upload, no app storage writes, no 3D reconstruction.
 * The real native board and private wardrobe are supplied by caller.
 */
import {preflightOwnedOutfit1054} from './source-to-outfit.mjs';
import {jpegBytes,digestBytes} from '../../public/native-canonical-photo-source-167.mjs';
import {assessPhoto3DResearchGate1054} from './photographed-3d-evidence-gate15.mjs';

const fail=reason=>{throw Error('MAIN1054_PREVIEW '+reason);};
const equalSession=(a,b)=>!!a&&!!b&&a.authenticated===true&&b.authenticated===true&&
 a.ownerId===b.ownerId&&a.epoch===b.epoch&&a.privateDbName===b.privateDbName&&
 b.privateDbName==='closet-current-user-'+b.ownerId;

export function mountOwnerOutfitPhotoPreview1054({
 target,getSession,readOwnerItems,getBoard,cleanBoard,events=globalThis.window,
 doc=globalThis.document
}={}){
 if(!target||typeof target.replaceChildren!=='function'||!doc?.createElement||
  typeof getSession!=='function'||typeof readOwnerItems!=='function'||
  typeof getBoard!=='function'||typeof cleanBoard!=='function'||
  !events?.addEventListener||!events?.removeEventListener)
  fail('signed-owner native interface required');
 let closed=false,revision=0,renderedSession=null,phase='idle';
 const clear=()=>{target.replaceChildren();renderedSession=null;};
 const revoke=()=>{revision++;clear();phase='revoked';};
 function assertActive(ticket,start){
  if(closed||ticket!==revision||!equalSession(start,getSession()))fail('signed owner or refresh changed');
 }
 function onVisibility(){
  // Never leave private imagery in the background when the browser hides.
  if(doc.hidden)revoke();else if(renderedSession&&!equalSession(renderedSession,getSession()))revoke();
 }
 function onFocus(){if(renderedSession&&!equalSession(renderedSession,getSession()))revoke();}
 events.addEventListener('closet:session-locked',revoke);
 events.addEventListener('pagehide',revoke);
 events.addEventListener('focus',onFocus);
 doc.addEventListener?.('visibilitychange',onVisibility);
 function rowSnapshot(row){
  return JSON.stringify([
   row?.id,row?.ownerId,row?.sourceSHA256,row?.originalPhoto?.sha256,
   row?.originalPhoto?.image,row?.ownerReviewed,row?.userAdjusted,
   row?.sourceHashVerified,row?.sourcePhotoOriginal,row?.category,
   row?.itemType,row?.color,row?.colorSource,row?.singleGarmentVerified,
   row?.segmentHint?.cutoutSHA256,row?.segmentHint?.ownerReviewedInstance,
   row?.segmentHint?.verified,row?.segmentHint?.clipped
  ]);
 }
 return Object.freeze({
  get status(){return Object.freeze({phase,active:!closed,hasOwnerPhotos:target.querySelectorAll?.('img').length>0,
   renderAuthorized3D:false,releaseAuthorized:false,familyAlpha:'HOLD'});},
  clear:revoke,
  async refresh(){
   const ticket=++revision;
   clear();phase='checking';
   const start=getSession();
   let verified=null;
   try{
    if(!start?.authenticated||typeof start.ownerId!=='string'||!start.ownerId||
       start.privateDbName!=='closet-current-user-'+start.ownerId)
     fail('native signed session unavailable');
    const board=await getBoard();
    assertActive(ticket,start);
    const boardIdentity=JSON.stringify(board);
    const plan=await preflightOwnedOutfit1054({
     getSession,readOwnerItems,cleanBoard,board
    });
    assertActive(ticket,start);
    if(!equalSession(start,getSession())||plan.ownerId!==start.ownerId||
       plan.sessionEpoch!==start.epoch||plan.renderAuthorized3D!==false)
     fail('source plan cannot authorize private image rendering');
    const rows=await readOwnerItems();
    assertActive(ticket,start);
    const confirmed=await preflightOwnedOutfit1054({
     getSession,readOwnerItems:async()=>rows,cleanBoard,board
    });
    assertActive(ticket,start);
    if(JSON.stringify(confirmed.slots)!==JSON.stringify(plan.slots))
     fail('private outfit changed during repeated verification');
    // The actual native original JPEG outfit remains a 2D-only verified
    // preview; Mission 2's disposable C60/C61 geometry cannot grant fitted 3D.
    const research3D=assessPhoto3DResearchGate1054({plan:confirmed});
    if(research3D.renderAuthorized3D!==false||research3D.releaseAuthorized!==false)
     fail('unsafe sampled 3D research cannot authorize owner garment');
    const byId=new Map(rows.map(r=>[r.id,r]));
    const pinned=[];
    for(const slot of confirmed.slots){
     const item=byId.get(slot.itemId);
     if(!item||item.ownerId!==start.ownerId||
        item.sourceSHA256!==slot.sourceSHA256)
      fail('foreign or stale source item');
     const image=item.originalPhoto?.image;
     if(typeof image!=='string'||!image.startsWith('data:image/jpeg;base64,'))
      fail('canonical saved JPEG unavailable');
     const actual=await digestBytes(jpegBytes(image));
     assertActive(ticket,start);
     if(actual!==slot.sourceSHA256)fail('original JPEG changed before preview');
     pinned.push({slot:slot.slot,id:slot.itemId,image,source:actual,
      fingerprint:rowSnapshot(item)});
    }
    const newest=await readOwnerItems();
    assertActive(ticket,start);
    const newestById=new Map(newest.map(r=>[r.id,r]));
    for(const item of pinned)if(rowSnapshot(newestById.get(item.id))!==item.fingerprint)
     fail('selected owner item changed before showing photos');
    if(JSON.stringify(await getBoard())!==boardIdentity)
     fail('outfit selection changed during preview');
    assertActive(ticket,start);
    const wrapper=doc.createElement('section');
    wrapper.dataset.mission4PhotoPreview='research';
    const label=doc.createElement('p');
    label.textContent='Research preview · your original clothing photographs (2D only, not fitted 3D)';
    wrapper.append(label);
    const grid=doc.createElement('div');
    grid.style.display='grid';
    grid.style.gridTemplateColumns='repeat(auto-fit,minmax(110px,1fr))';
    grid.style.gap='12px';
    for(const item of pinned){
     const figure=doc.createElement('figure');
     figure.style.margin='0';
     const img=doc.createElement('img');
     img.src=item.image;img.alt='Original saved clothing photograph: '+item.slot;
     img.style.width='100%';img.style.maxHeight='180px';img.style.objectFit='contain';
     const caption=doc.createElement('figcaption');
     caption.textContent=item.slot+' · original photo';
     figure.append(img,caption);grid.append(figure);
    }
    wrapper.append(grid);
    const foot=doc.createElement('p');
    foot.textContent='3D fit not verified or authorized. Measured Mission 2 test cloth is not an owner-photo reconstruction; original photo 2D remains available. No clothing photos or outfits were changed.';
    wrapper.append(foot);
    assertActive(ticket,start);
    target.replaceChildren(wrapper);
    renderedSession=start;phase='visible';
    verified=Object.freeze({slotCount:pinned.length,presentationMode:'verified-original-photo-2d',
     renderAuthorized3D:false,releaseAuthorized:false,familyAlpha:'HOLD',
     threeDResearchStatus:research3D.status});
   }catch(error){
    if(ticket===revision&&!closed){clear();phase='refused';}
    throw error;
   }
   return verified;
  },
  dispose(){
   if(closed)return;
   closed=true;revoke();
   events.removeEventListener('closet:session-locked',revoke);
   events.removeEventListener('pagehide',revoke);
   events.removeEventListener('focus',onFocus);
   doc.removeEventListener?.('visibilitychange',onVisibility);
   phase='closed';
  }
 });
}
