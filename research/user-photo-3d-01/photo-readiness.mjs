/**
 * USER-PHOTO-3D-01 — safe, read-only admission of owner wardrobe originals.
 * Source photography is NEVER rewritten; no unphotographed surface is inferred.
 * Readiness is not a claim of human-approved fitting or arbitrary-photo 3D.
 */
export const PHOTO3D01=Object.freeze({
 version:1,feature:'research-only',anatomicalBones:163,
 productionAuthorized:false,familyAlpha:'HOLD',realSignedAccountsVerified:false
});
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DRESS='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const DENIM=Object.freeze(['b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c','aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a']);
export const existingVettedSourceSHAs=Object.freeze({shirt:SHIRT,dress:DRESS,denim:DENIM});
const sha=/^[a-f0-9]{64}$/,id=x=>typeof x==='string'&&x.length>0&&x.length<180&&!/[\u0000-\u001f]/.test(x);
const o=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const hex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
export function strictJPEGBytes01(image){
 if(typeof image!=='string'||!/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(image))
  throw Error('Full original JPEG unavailable; show photo-only');
 const raw=atob(image.slice('data:image/jpeg;base64,'.length));
 if(raw.length<1000||raw.length>10_000_000)throw Error('Original JPEG outside supported size');
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 if(bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  throw Error('Invalid original JPEG markers');
 return bytes;
}
export async function verifyOriginalPhoto01(item,{ownerId,subtle=globalThis.crypto?.subtle}={}){
 if(!id(ownerId)||!o(item)||!id(item.id)||item.ownerId!==ownerId)
  throw Error('Foreign or missing owner/item identity');
 if(!subtle?.digest)throw Error('SHA-256 unavailable; fail closed');
 const photo=item.originalPhoto?.image;
 if(typeof photo!=='string')throw Error('Unmodified full original source absent');
 const bytes=strictJPEGBytes01(photo);
 const computed=hex(new Uint8Array(await subtle.digest('SHA-256',bytes)));
 const hashes=[item.sourceSHA256,item.originalPhoto?.sha256,item.sourceHash].filter(x=>x!=null);
 if(!hashes.length||hashes.some(x=>!sha.test(x)||x!==computed))
  throw Error('Original JPEG SHA-256 identity mismatch');
 return Object.freeze({itemId:item.id,ownerId,sha256:computed,byteLength:bytes.length,
   originalFullJPEGVerified:true,originalBytesRewritten:false});
}
export function garmentKind01(item){
 const category=String(item?.category||'').toLowerCase();
 const type=String(item?.itemType||item?.subtype||'').toLowerCase();
 if(category==='dresses' || category==='dress')return 'dress';
 if(category==='tops'||category==='shirts'||category==='shirt'){
  return /blouse/.test(type)?'blouse':/shirt|tee|t-shirt/.test(type)?'shirt':'unsupported';
 }
 if(category==='bottoms'||category==='pants'){
  return /jeans|denim/.test(type)?'jeans':/pants|trouser/.test(type)?'pants':/short/.test(type)?'shorts':/skirt/.test(type)?'skirt':'unsupported';
 }
 if(/outerwear|shoe|accessor|jacket|coat/.test(category))return 'unsupported';
 return 'unsupported';
}
export async function assessWardrobePhoto01(item,{ownerId,subtle,renderReceipt=null}={}){
 if(!id(ownerId)||!o(item)||!id(item.id)||item.ownerId!==ownerId)
  throw Error('Owner-private wardrobe required; refuse foreign source');
 const kind=garmentKind01(item),result={ownerId,itemId:item.id,category:item.category||'',
  itemType:item.itemType||item.subtype||'',kind,readiness:'Photo-Only',
  reason:'No trustworthy garment geometry available',originalPhotoVerified:false,
  sourceSHA256:null,rendered3D:false,unseenRear:'neutral/source-unverified',productionAuthorized:false};
 let source;
 try{source=await verifyOriginalPhoto01(item,{ownerId,subtle});}
 catch(e){return Object.freeze({...result,reason:'Original source verification failed: '+e.message});}
 result.originalPhotoVerified=true;result.sourceSHA256=source.sha256;
 const candidate=kind==='shirt'&&source.sha256===SHIRT||
  kind==='dress'&&source.sha256===DRESS||
  kind==='jeans'&&DENIM.includes(source.sha256);
 if(kind==='unsupported'||kind==='shorts'||kind==='skirt'||item.multipleGarments===true||
   item.singleGarmentVerified===false){
  result.reason='Unsupported or multiple-piece silhouette; retain original photograph';
  return Object.freeze(result);
 }
 result.readiness='Needs Review';
 result.reason=candidate?
  'Pinned original source exists; independently inspect true mesh fit, front/side/rear and human acceptance':
  'No independently verified cutout, shoulder/waist/hem geometry or source UV for this photograph';
 if(renderReceipt!==null){
  if(!isAcceptedReceipt01(renderReceipt,item,source.sha256,kind))
   throw Error('Untrusted 3D render acceptance; cannot mark as ready');
  result.readiness='3D Ready';result.rendered3D=true;
  result.reason='Original source and 163-bone renderer verified with accepted fitting review; rear remains neutral';
 }
 return Object.freeze(result);
}
const minted=new WeakSet();
function isAcceptedReceipt01(receipt,item,sha256,kind){
 return o(receipt)&&minted.has(receipt)&&receipt.ownerId===item.ownerId&&
  receipt.itemId===item.id&&receipt.sha256===sha256&&receipt.kind===kind;
}
/**
 * This proof can be minted ONLY by the controller after actual WebGL screenshots,
 * front/side/rear inspection and independent human approval. A string, generic
 * mesh, photo hash, or test flag alone is not sufficient.
 */
export function attestFittedRender01({item,source,rig,views,humanReviewAccepted=false}={}){
 if(!humanReviewAccepted)throw Error('Human visual acceptance is required');
 if(!o(item)||!id(item.id)||!o(source)||source.ownerId!==item.ownerId||
    source.itemId!==item.id||!sha.test(source.sha256)||!Array.isArray(views)||
    !['front','side','rear'].every(v=>views.includes(v)))
  throw Error('Original owner/source and all angles required');
 const kind=garmentKind01(item);
 if(!((kind==='shirt'&&source.sha256===SHIRT)||
      (kind==='dress'&&source.sha256===DRESS)||
      (kind==='jeans'&&DENIM.includes(source.sha256))))
  throw Error('Unknown photographic geometry cannot be accepted');
 const state=rig?.getState?.();
 const canvas=rig?.canvas,gl=canvas?.getContext?.('webgl2');
 // An arbitrary JavaScript object with a garmentMeshes counter is NOT
 // independent proof of a source-photo-fitted anatomical render.
 if(!state?.loaded||state.stats?.bones!==163||state.releaseAuthorized!==false||
    !state.outfit||state.outfit.garmentMeshes<1||!canvas?.isConnected||
    !gl||!String(gl.getParameter(gl.VERSION)).includes('WebGL'))
  throw Error('Actual live WebGL2 163-bone mesh and canvas required');
 const piece=kind==='dress'?state.outfit.dress:kind==='shirt'?state.outfit.shirt:state.outfit.pants;
 if(piece?.sourceSHA256!==source.sha256)
  throw Error('Displayed garment must be the exact independently source-bound photograph');
 const receipt=Object.freeze({ownerId:item.ownerId,itemId:item.id,sha256:source.sha256,kind,
   views:Object.freeze([...views]),researchOnly:true});
 minted.add(receipt);return receipt;
}
export function planSavedOutfit01(saved,items,{ownerId}={}){
 if(!id(ownerId)||!o(saved)||!id(saved.id)||!o(saved.slots)||!Array.isArray(items)||
   saved.ownerId!==undefined&&saved.ownerId!==ownerId)
  throw Error('Invalid owner saved outfit');
 const byId=new Map();
 for(const row of items){if(row.ownerId!==ownerId)throw Error('Foreign wardrobe row');
  if(byId.has(row.id))throw Error('Duplicate garment identity');byId.set(row.id,row);}
 const selected=[],missing=[];
 for(const [slot,garmentId] of Object.entries(saved.slots)){
  if(!id(garmentId))throw Error('Invalid saved outfit garment reference');
  if(byId.has(garmentId))selected.push(Object.freeze({slot,garmentId}));
  else missing.push(Object.freeze({slot,garmentId,reason:'Original ID retained; clothing currently missing'}));
 }
 return Object.freeze({savedId:saved.id,outfit3dId:saved.outfit3dId||null,ownerId,
   selected:Object.freeze(selected),missing:Object.freeze(missing),
   persisted:false,sourcePhotosMutated:false,releaseAuthorized:false});
}
/**
 * Advisory only: produces normalized candidate geometry measurements from
 * an already derived thumbnail ImageData. Does NOT produce a "reviewed" mask,
 * modify JPEG, or imply a verified garment back, seam or body fit.
 */
export function proposeSilhouette01(imageData,{threshold=45}={}){
 const {width:w,height:h,data}=imageData||{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<32||h<32||w*h>1500000||
    !data||data.length!==w*h*4)throw Error('Bounded RGBA review thumbnail required');
 const at=(x,y,k)=>data[(y*w+x)*4+k];
 const corners=[[1,1],[w-2,1],[1,h-2],[w-2,h-2]];
 const bg=[0,1,2].map(k=>Math.round(corners.reduce((a,[x,y])=>a+at(x,y,k),0)/4));
 let minX=w,minY=h,maxX=-1,maxY=-1,foreground=0,edge=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const px=(y*w+x)*4,dist=Math.hypot(data[px]-bg[0],data[px+1]-bg[1],data[px+2]-bg[2]);
  if(data[px+3]<200||dist<threshold)continue;
  foreground++;minX=Math.min(minX,x);minY=Math.min(minY,y);
  maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  if(x===0||y===0||x===w-1||y===h-1)edge++;
 }
 const cover=foreground/(w*h),touch=edge>0;
 const bbox=maxX<0?null:[minX,minY,maxX,maxY];
 return Object.freeze({bbox,coverage:cover,touchesImageEdge:touch,
   boundaryQuality:bbox&&cover>.04&&cover<.86&&!touch?'candidate-unreviewed':'needs-human-review',
   approvedCutout:false,realFittedGeometry:false,
   neutralRearOnly:true,originalBytesModified:false});
}
