/**
 * M1 P798 — source-bound, transient ORIGINAL JPEG tap for native Adjust.
 *
 * Research-only human-interface input, NOT a SAM/SAM2 mask, confirmed human
 * annotation, AI classification, saved owner's garment or independent proof.
 * No network requests. This module does not touch IndexedDB or model workers.
 * A caller must validate owner/session/dialog on every call and after digest.
 */
const sha=/^[a-f0-9]{64}$/;
const fail=why=>{throw Error('M1_OWNER_SOURCE_POINT_798 '+why);};
const limit=10*1024*1024;
function isPositiveInteger(v){return Number.isInteger(v)&&v>0&&v<=8192;}
export function sourceTapCoordinates798({rect,clientX,clientY,width,height}={}){
 if(!rect||!Number.isFinite(rect.left)||!Number.isFinite(rect.top)||
    !Number.isFinite(rect.width)||!Number.isFinite(rect.height)||
    !(rect.width>0&&rect.height>0)||!Number.isFinite(clientX)||
    !Number.isFinite(clientY)||!isPositiveInteger(width)||!isPositiveInteger(height))
   fail('a displayed source rectangle and natural photo dimensions are required');
 const fx=(clientX-rect.left)/rect.width,fy=(clientY-rect.top)/rect.height;
 if(fx<0||fx>1||fy<0||fy>1)
  fail('tap fell outside the original photograph');
 const x=Math.min(width-1,Math.floor(fx*width));
 const y=Math.min(height-1,Math.floor(fy*height));
 return Object.freeze({x,y,normalizedX:(x+.5)/width,normalizedY:(y+.5)/height});
}
export async function verifyOriginalTap798({
 originalPhoto,sourceSHA256,sourceHashVerified,ownerId,sourceId,
 currentOwner,sourceStillCurrent,rect,clientX,clientY,
 imageNaturalWidth,imageNaturalHeight,cryptoProvider=globalThis.crypto
}={}){
 if(!sha.test(sourceSHA256||'')||sourceHashVerified!==true||
    !originalPhoto||originalPhoto.sha256!==sourceSHA256||
    !isPositiveInteger(originalPhoto.width)||!isPositiveInteger(originalPhoto.height)||
    imageNaturalWidth!==originalPhoto.width||imageNaturalHeight!==originalPhoto.height||
    typeof ownerId!=='string'||!ownerId||typeof sourceId!=='string'||!sourceId||
    typeof currentOwner!=='function'||typeof sourceStillCurrent!=='function'||
    typeof cryptoProvider?.subtle?.digest!=='function')
  fail('authenticated canonical JPEG source identity or dimensions missing');
 const leased=()=>currentOwner()===ownerId&&sourceStillCurrent()===true;
 if(!leased())fail('owner session or original draft changed before tap');
 const at=sourceTapCoordinates798({
  rect,clientX,clientY,width:imageNaturalWidth,height:imageNaturalHeight
 });
 const data=originalPhoto.image;
 if(typeof data!=='string'||!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(data)||
    data.length>Math.ceil(limit*4/3)+64)
  fail('original must be a size-bounded canonical JPEG data URL, never a remote URL');
 const encoded=data.slice('data:image/jpeg;base64,'.length);
 let str;
 try{str=atob(encoded);}catch{fail('canonical JPEG encoding invalid');}
 if(str.length<32||str.length>limit)fail('JPEG byte count outside privacy/memory limits');
 const bytes=new Uint8Array(str.length);
 for(let i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i);
 if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)
  fail('original does not contain a complete JPEG file');
 const proof=await cryptoProvider.subtle.digest('SHA-256',bytes);
 const actual=Array.from(new Uint8Array(proof),x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==sourceSHA256)fail('original JPEG bytes no longer match immutable SHA-256');
 if(!leased())fail('owner session or original draft changed during photo verification');
 return Object.freeze({
  schema:'closet-current-m1-owner-original-point-798/review-only/v1',
  sourceSHA256,sourceId,ownerId,
  sourceWidth:imageNaturalWidth,sourceHeight:imageNaturalHeight,
  pointX:at.x,pointY:at.y,normalizedX:at.normalizedX,normalizedY:at.normalizedY,
  capturedFromOriginalJPEG:true,sourceBytesSHA256Verified:true,
  userInterfaceTapObserved:true,independentRealHumanIdentityVerified:false,
  maskGenerated:false,maskVerified:false,
  modelRun:false,subtypeConfirmed:false,colorConfirmed:false,
  autoSaveAllowed:false,ownerApprovedGarment:false,privatePersisted:false
 });
}

/**
 * Actual opt-in native Adjust control: display the immutable ORIGINAL JPEG
 * (not a crop or synthetic source), and capture a reversible tap. It does
 * not expose model endpoints, copy JPEG to a service, change form inputs,
 * persist a receipt or auto-confirm a saved clothing item.
 */
export function mountOriginalTapReview798({
 host,item,ownerId,currentOwner,isActive
}={}){
 if(!host||typeof host.prepend!=='function'||!item||
    typeof currentOwner!=='function'||typeof isActive!=='function'||
    !ownerId||currentOwner()!==ownerId||!isActive()||
    item.ownerId!==ownerId||item.sourceHashVerified!==true||
    item.originalPhoto?.sha256!==item.sourceSHA256||
    !/^data:image\/jpeg;base64,/.test(item.originalPhoto?.image||''))
  fail('native owner Adjust may not open an unverified original source');
 const source=item.originalPhoto;
 const root=document.createElement('section');
 root.dataset.mission1OwnerPoint798='review-only';
 root.dataset.maskGenerated='false';root.dataset.automaticSave='false';
 root.style.cssText='border:1px solid #a7b5ce;border-radius:10px;padding:12px;margin:12px 0;min-width:0';
 const heading=document.createElement('p');
 heading.textContent='Select a garment point on the ORIGINAL photograph (research preview only). This does not separate clothing or confirm its identity.';
 heading.className='fine';root.append(heading);
 const interactive=document.createElement('button');
 interactive.type='button';interactive.setAttribute('aria-label','Tap original photograph to select garment point');
 interactive.style.cssText='display:inline-block;max-width:100%;padding:0;border:1px solid #6f819e;border-radius:6px;position:relative;overflow:hidden;background:transparent;cursor:crosshair;touch-action:manipulation';
 const photo=document.createElement('img');
 photo.src=source.image;photo.alt='Uncropped original JPEG. Tap the garment you want to review.';
 photo.style.cssText='display:block;max-width:100%;max-height:300px;width:auto;height:auto;object-fit:contain';
 const marker=document.createElement('span');
 marker.dataset.mission1OwnerPointMarker798='none';
 marker.style.cssText='display:none;position:absolute;width:16px;height:16px;border-radius:50%;border:3px solid #fff;background:#1c60ca;box-shadow:0 0 0 1px #122d5d;transform:translate(-50%,-50%);pointer-events:none';
 interactive.append(photo,marker);root.append(interactive);
 const status=document.createElement('p');status.className='fine';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 status.textContent='No point selected. Tap a visible garment or use Enter to select the center of the photo.';
 root.append(status);
 const clear=document.createElement('button');clear.type='button';
 clear.textContent='Clear garment point';clear.className='secondary';clear.disabled=true;
 root.append(clear);
 let selected=null,busy=false;
 const live=()=>root.isConnected&&isActive()&&currentOwner()===ownerId&&
  item.sourceSHA256===source.sha256&&item.originalPhoto?.image===source.image;
 const reset=()=>{
  selected=null;marker.style.display='none';marker.dataset.mission1OwnerPointMarker798='none';
  status.textContent='No point selected. Your original photograph is unchanged.';
  clear.disabled=true;
 };
 clear.addEventListener('click',reset);
 interactive.addEventListener('click',async event=>{
  if(busy)return;
  busy=true;
  try{
   if(!live())throw Error('The signed-in owner or draft changed');
   if(!photo.complete||!photo.naturalWidth||!photo.naturalHeight)
    throw Error('Original photograph has not finished loading');
   const box=photo.getBoundingClientRect();
   // Keyboard activation (Enter/Space) chooses the center, not (0,0).
   const keyboard=event.detail===0;
   const x=keyboard?box.left+box.width/2:event.clientX;
   const y=keyboard?box.top+box.height/2:event.clientY;
   const point=await verifyOriginalTap798({
    originalPhoto:source,sourceSHA256:item.sourceSHA256,
    sourceHashVerified:item.sourceHashVerified,sourceId:item.id,
    ownerId,currentOwner,sourceStillCurrent:live,
    rect:box,clientX:x,clientY:y,
    imageNaturalWidth:photo.naturalWidth,imageNaturalHeight:photo.naturalHeight
   });
   if(!live())return;
   selected=point;
   marker.style.display='block';
   marker.style.left=(point.normalizedX*100)+'%';
   marker.style.top=(point.normalizedY*100)+'%';
   marker.dataset.mission1OwnerPointMarker798='selected';
   status.textContent='Review point at original pixel '+point.pointX+', '+point.pointY+
    '. No AI mask was generated; clothing category, type and color remain unconfirmed.';
   clear.disabled=false;
  }catch{
   if(live()){
    reset();status.textContent='Point not accepted. Check the original photo and signed-in account, then try again.';
   }
  }finally{busy=false;}
 });
 host.prepend(root);
 return Object.freeze({
  root,
  getPoint:()=>live()?selected:null,
  clear:reset,
  dispose:()=>{reset();root.remove();}
 });
}
