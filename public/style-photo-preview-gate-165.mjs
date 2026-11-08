/**
 * Closet Current MAIN P165 — signed owner-reviewed new garment 2D-original
 * photo preview for native "Style My New Clothes" cards. The existing 3D
 * research renderer cannot fit an arbitrary new photo and MUST NOT be shown
 * as though it is wearing that piece.
 *
 * P167 native integration: asynchronous real saved-IndexedDB reads supported,
 * owner epoch/session checked before and after both digest and private-read awaits.
 * P166 correction: SHA integrity alone is not human reviewed ownership;
 * require the current saved owner-reviewed flags before AND after async hash.
 * Strictly additive ESM integration interface. No owner data storage,
 * network, analytics, 3D mesh substitution, source photo mutation, unsafe
 * HTML interpolation or automatic publication. Family Alpha #255 HOLD.
 */
const HEX64=/^[a-f0-9]{64}$/;
const ALLOWED=/^data:image\/(?:jpeg|png);base64,([a-zA-Z0-9+/]+={0,2})$/;
const requireLive=(session)=>{
 const s=session?.();
 if(!s?.authenticated||typeof s.ownerId!=='string'||!s.ownerId||
   typeof s.epoch!=='string'||!s.epoch||
   s.privateDbName!=='closet-current-user-'+s.ownerId)
  throw Error('Sign in to your current private wardrobe to view saved clothing');
 return {ownerId:s.ownerId,epoch:s.epoch,privateDbName:s.privateDbName};
};
const same=(a,b)=>a.ownerId===b.ownerId&&a.epoch===b.epoch&&a.privateDbName===b.privateDbName;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const shaHex=async bytes=>{
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
export async function verifyOwnerSavedPhoto165({item,originalOwnerSession,getSession,readOwnerItems}={}){
 const previous=requireLive(getSession);
 if(!item||typeof item.id!=='string'||!item.id||
   item.ownerId!==previous.ownerId||!HEX64.test(item.sourceSHA256||'')||
   item.sourcePhotoOriginal!==true||item.sourceHashVerified!==true||
   item.userAdjusted!==true||item.ownerReviewed!==true||
   typeof (item.originalPhoto?.image||item.image)!=='string'||
   (item.originalPhoto?.image||item.image).length>18_000_000)
  throw Error('Saved original photograph needs owner review before preview');
 const original=item.originalPhoto?.image||item.image;
 if(item.originalPhoto&&item.originalPhoto.sha256!==item.sourceSHA256)
  throw Error('Original source identity metadata changed');
 const match=original.match(ALLOWED);
 if(!match)throw Error('Original saved photo unavailable as a verified local image');
 let bytes;
 try{const r=await fetch(original);bytes=new Uint8Array(await r.arrayBuffer());}
 catch{throw Error('Unable to verify saved original photograph');}
 if(bytes.length<80||bytes.length>8_000_000)
  throw Error('Original saved photograph size is unsafe');
 const actual=await shaHex(bytes);
 if(actual!==item.sourceSHA256)throw Error('Original saved photograph source changed; review required');
 const current=requireLive(getSession);
 if(!same(previous,current))throw Error('Account changed during original photograph validation');
 const latest=await readOwnerItems?.();
 if(!same(previous,requireLive(getSession)))throw Error('Account changed during private wardrobe read');
 if(!Array.isArray(latest))throw Error('Private closet no longer available');
 const saved=latest.find(x=>x?.id===item.id);
 if(!saved||saved.ownerId!==previous.ownerId||saved.sourceSHA256!==actual||
  (saved.originalPhoto?.image||saved.image)!==original||
  saved.sourcePhotoOriginal!==true||saved.sourceHashVerified!==true||
  saved.userAdjusted!==true||saved.ownerReviewed!==true)
  throw Error('Saved garment changed during original photograph validation');
 if(originalOwnerSession&&!same(previous,originalOwnerSession))
  throw Error('Original owner session changed');
 return Object.freeze({itemId:item.id,ownerId:previous.ownerId,epoch:previous.epoch,
  sourceSHA256:actual,photo:original,name:String(item.name||item.itemType||'Saved garment').slice(0,140),
  presentationMode:'verified-original-photo-2d',
  garmentActuallyFittedIn3D:false,
  originalPhotoStillPrivate:true,unseenBackPhotographed:false,
  familyAlpha:'HOLD',releaseAuthorized:false});
}
/**
 * Legacy standard-app user-reviewed records do not always have a canonical
 * original-source SHA. Their saved 2D photo can still be displayed from the
 * currently signed owner-scoped IndexedDB; NEVER label it independently
 * verified original JPEG, and NEVER use it to authorize a real 3D mesh.
 */
export async function verifyLegacySavedPhoto165({item,originalOwnerSession,getSession,readOwnerItems}={}){
 const before=requireLive(getSession);
 if(!item||typeof item.id!=='string'||!item.id||
    item.ownerId&&item.ownerId!==before.ownerId||
    item.sourceSHA256||item.sourceHashVerified===true||item.sourcePhotoOriginal===true||
    item.userAdjusted!==true||item.category==='Uncategorized'||
    typeof item.image!=='string'||item.image.length>18_000_000)
  throw Error('Saved photo requires review and current owner wardrobe');
 if(!ALLOWED.test(item.image))throw Error('Saved image must be a local JPEG or PNG');
 let bytes;
 try{bytes=new Uint8Array(await (await fetch(item.image)).arrayBuffer());}
 catch{throw Error('Saved photo could not be verified in this browser');}
 if(bytes.length<80||bytes.length>8_000_000)throw Error('Saved photo size is unsafe');
 const digest=await shaHex(bytes);
 const now=requireLive(getSession);
 if(!same(before,now))throw Error('Account changed during saved photo check');
 const wardrobe=await readOwnerItems?.();
 if(!same(before,requireLive(getSession)))throw Error('Account changed during private wardrobe read');
 if(!Array.isArray(wardrobe))throw Error('Private closet not available');
 const live=wardrobe.find(x=>x?.id===item.id);
 if(!live||live.image!==item.image||live.userAdjusted!==true||
   live.ownerId&&live.ownerId!==before.ownerId||live.sourceSHA256||
   live.category==='Uncategorized')
   throw Error('Saved photo or owner wardrobe changed while checking');
 if(originalOwnerSession&&!same(before,originalOwnerSession))
  throw Error('Private owner session changed');
 return Object.freeze({itemId:item.id,ownerId:before.ownerId,epoch:before.epoch,
  sourceSHA256:digest,photo:item.image,name:String(item.name||item.itemType||'Saved garment').slice(0,140),
  presentationMode:'saved-photo-unverified-original-2d',
  originalSourceIndependentlyVerified:false,garmentActuallyFittedIn3D:false,
  privateOwnerDatabaseVerified:true,unseenBackPhotographed:false,
  familyAlpha:'HOLD',releaseAuthorized:false});
}

export function createStyledOwnerPhotoPreview165({
 grid,readResults,readOwnerItems,getSession,events=window
}={}){
 if(!grid||typeof grid.querySelectorAll!=='function'||
  typeof readResults!=='function'||typeof readOwnerItems!=='function'||
  typeof getSession!=='function')throw Error('Verified signed-in native Style collection interface required');
 let closed=false,serial=0,anchor=null;
 const clear=()=>{serial++;anchor?.remove();anchor=null;
  for(const x of grid.querySelectorAll('button[data-style-photo-preview-165]'))x.remove();};
 const createAlert=(text,parent)=>{const p=el('p',text,'fine');p.setAttribute('role','status');p.setAttribute('aria-live','polite');parent.append(p);return p;};
 const render=async(index,clicked)=>{
  const op=++serial;
  anchor?.remove();anchor=null;
  let start;
  try{
   start=requireLive(getSession);
   const result=readResults()[index];
   if(!result?.board||!result.focusItemId)throw Error('Choose a reviewed item from your private closet');
   const card=clicked.closest('.styled-outfit');
   if(!card||!grid.contains(card))throw Error('Saved styled outfit card no longer current');
   const currentItems=await readOwnerItems();
   if(!same(start,requireLive(getSession))||!Array.isArray(currentItems))throw Error('Owner changed during saved wardrobe read');
   const focus=currentItems.find(x=>x?.id===result.focusItemId);
   if(!focus||(focus.ownerId&&focus.ownerId!==start.ownerId)||!Object.values(result.board.slots||{}).includes(focus.id))
    throw Error('The selected garment is not in your current owned outfit');
   // Verify SHA256 of actual saved full-original JPEG/PNG before ever displaying it.
   const canonical=typeof focus.sourceSHA256==='string'&&focus.sourceSHA256.length>0;
   const preview=await (canonical?verifyOwnerSavedPhoto165:verifyLegacySavedPhoto165)({
     item:focus,getSession,readOwnerItems,originalOwnerSession:start});
   if(closed||serial!==op||!same(start,requireLive(getSession))||
      !grid.contains(card)||readResults()[index]!==result)throw Error('Style results or signed-in account changed');
   const container=el('section',null,'style-original-photo-preview-165');
   container.dataset.garmentPreviewMode=preview.presentationMode;
   container.setAttribute('aria-label',canonical?'Your SHA-verified original saved clothing photo — 2D':'Your saved clothing photo, original source unverified — 2D');
   container.style.cssText='border:1px solid #c2c8c0;border-radius:12px;padding:12px;margin-top:12px;max-width:100%;box-sizing:border-box;overflow:hidden';
   const heading=el('strong',canonical?'SHA-verified original clothing photo · 2D':'Saved clothing photo · 2D (original source unverified)');
   const img=el('img');img.src=preview.photo;img.alt=preview.name+' — your saved clothing photo';
   img.style.cssText='display:block;width:min(100%,250px);height:auto;max-height:240px;object-fit:contain;margin:8px auto';
   const explanation=el('p',canonical?
    '3D fitting is not yet verified for this garment. No generic garment has been substituted.':
    'Saved photo only: original-camera image provenance is not independently verified. 3D fitting is not yet verified. No generic garment has been substituted.','fine');
   explanation.dataset.threeDFitted='false';
   container.append(heading,img,explanation);
   card.append(container);anchor=container;
   return preview;
  }catch(error){
   if(!closed&&serial===op&&clicked.isConnected){
    const card=clicked.closest('.styled-outfit');
    if(card&&grid.contains(card)){
     const p=createAlert(String(error?.message||'Original photo unavailable'),card);
     anchor=p;
    }
   }
   throw error;
  }
 };
 const mount=()=>{
  if(closed)throw Error('Styled preview controller disposed');
  clear();
  const all=readResults(),cards=[...grid.querySelectorAll('.styled-outfit')];
  if(!Array.isArray(all))throw Error('Private styled outfit list not ready');
  for(const [i,card]of cards.entries()){
   const result=all[i];
   if(!result?.focusItemId||!result.board)continue;
   const btn=el('button','See saved photo (2D)','secondary');
   btn.type='button';btn.setAttribute('data-style-photo-preview-165','true');
   btn.setAttribute('aria-label','See your saved clothing photo in 2D; 3D fitting not verified');
   btn.onclick=async()=>{btn.disabled=true;try{await render(i,btn);}catch{ /* Safe visible warning already shown. */ }finally{btn.disabled=false;}};
   card.append(btn);
  }
  return cards.length;
 };
 const onLock=()=>clear();
 const onInventory=()=>clear();
 events?.addEventListener?.('closet:session-locked',onLock);
 events?.addEventListener?.('closet:style-owned-inventory-committed',onInventory);
 const dispose=()=>{if(closed)return;clear();closed=true;
   events?.removeEventListener?.('closet:session-locked',onLock);
   events?.removeEventListener?.('closet:style-owned-inventory-committed',onInventory);
 };
 return Object.freeze({mount,clear,dispose,
  getState:()=>Object.freeze({disposed:closed,visibleOriginalPhoto:!!anchor?.querySelector?.('img'),
   releaseAuthorized:false,familyAlpha:'HOLD',auto3DFitAvailable:false})});
}
