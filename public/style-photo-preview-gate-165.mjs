/**
 * Closet Current MAIN P165 — signed owner-reviewed new garment 2D-original
 * photo preview for native "Style My New Clothes" cards. The existing 3D
 * research renderer cannot fit an arbitrary new photo and MUST NOT be shown
 * as though it is wearing that piece.
 *
 * Strictly additive ESM integration interface. No owner data storage,
 * network, analytics, 3D mesh substitution, source photo mutation, unsafe
 * HTML interpolation or automatic publication. Family Alpha #255 HOLD.
 */
const HEX64=/^[a-f0-9]{64}$/;
const ALLOWED=/^data:image\/(?:jpeg|png);base64,([a-zA-Z0-9+/]+={0,2})$/;
const requireLive=(session)=>{
 const s=session?.();
 if(!s?.authenticated||typeof s.ownerId!=='string'||!s.ownerId||
   typeof s.epoch!=='string'||!s.epoch)throw Error('Sign in to view your saved clothing');
 return {ownerId:s.ownerId,epoch:s.epoch};
};
const same=(a,b)=>a.ownerId===b.ownerId&&a.epoch===b.epoch;
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
   typeof item.image!=='string'||item.image.length>18_000_000)
  throw Error('Saved original photograph needs owner review before preview');
 const match=item.image.match(ALLOWED);
 if(!match)throw Error('Original saved photo unavailable as a verified local image');
 let bytes;
 try{const r=await fetch(item.image);bytes=new Uint8Array(await r.arrayBuffer());}
 catch{throw Error('Unable to verify saved original photograph');}
 if(bytes.length<80||bytes.length>8_000_000)
  throw Error('Original saved photograph size is unsafe');
 const actual=await shaHex(bytes);
 if(actual!==item.sourceSHA256)throw Error('Original saved photograph source changed; review required');
 const current=requireLive(getSession);
 if(!same(previous,current))throw Error('Account changed during original photograph validation');
 const latest=readOwnerItems?.();
 if(!Array.isArray(latest))throw Error('Private closet no longer available');
 const saved=latest.find(x=>x?.id===item.id);
 if(!saved||saved.ownerId!==previous.ownerId||saved.sourceSHA256!==actual||
  saved.image!==item.image||saved.sourcePhotoOriginal!==true||saved.sourceHashVerified!==true)
  throw Error('Saved garment changed during original photograph validation');
 if(originalOwnerSession&&!same(previous,originalOwnerSession))
  throw Error('Original owner session changed');
 return Object.freeze({itemId:item.id,ownerId:previous.ownerId,epoch:previous.epoch,
  sourceSHA256:actual,photo:item.image,name:String(item.name||item.itemType||'Saved garment').slice(0,140),
  presentationMode:'verified-original-photo-2d',
  garmentActuallyFittedIn3D:false,
  originalPhotoStillPrivate:true,unseenBackPhotographed:false,
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
   const focus=readOwnerItems().find(x=>x?.id===result.focusItemId);
   if(!focus||focus.ownerId!==start.ownerId||!Object.values(result.board.slots||{}).includes(focus.id))
    throw Error('The selected garment is not in your current owned outfit');
   // Verify SHA256 of actual saved full-original JPEG/PNG before ever displaying it.
   const preview=await verifyOwnerSavedPhoto165({item:focus,getSession,readOwnerItems,originalOwnerSession:start});
   if(closed||serial!==op||!same(start,requireLive(getSession))||
      !grid.contains(card)||readResults()[index]!==result)throw Error('Style results or signed-in account changed');
   const container=el('section',null,'style-original-photo-preview-165');
   container.dataset.garmentPreviewMode='verified-original-photo-2d';
   container.setAttribute('aria-label','Your original saved clothing photo — 2D');
   container.style.cssText='border:1px solid #c2c8c0;border-radius:12px;padding:12px;margin-top:12px;max-width:100%;box-sizing:border-box;overflow:hidden';
   const heading=el('strong','Original saved clothing photo · 2D preview');
   const img=el('img');img.src=preview.photo;img.alt=preview.name+' — your original saved clothing photo';
   img.style.cssText='display:block;width:min(100%,250px);height:auto;max-height:240px;object-fit:contain;margin:8px auto';
   const explanation=el('p','3D fitting is not yet verified for this garment. No generic garment has been substituted.','fine');
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
   const btn=el('button','See original photo (2D)','secondary');
   btn.type='button';btn.dataset.stylePhotoPreview165='true';
   btn.setAttribute('aria-label','See your saved original clothing photo; 3D fitting not verified');
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
