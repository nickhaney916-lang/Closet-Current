/**
 * 3D-12 graceful photo-only fallback integrated with Work59 drape for the *verified* Work47 original.
 * This fallback is not 2D mannequin development; it prevents blank screen
 * or nude body if WebGL/rig download fails on an actual family phone.
 * It never changes source photo, approves clothing, or calls external sites.
 */
export const LICENSED_FALLBACK=Object.freeze({
 id:'commons-0003',
 url:'../../benchmark/work47/assets/commons-0003.jpg',
 release:'HOLD',
 mode:'original-photo-only'
});
const hex=/^[0-9a-f]{64}$/;
export function createVerifiedPhotoFallback(doc,{onDeactivate=()=>{}}={}){
 if(!doc?.getElementById||typeof onDeactivate!=='function')throw Error('Photo fallback requires a document');
 const $=id=>doc.getElementById(id);
 const panel=$('photoFallback'),image=$('fallbackOriginal'),canvas=$('avatar');
 if(!panel||!image||!canvas)throw Error('Photo fallback elements missing');
 let original=null,shown=false;
 const authorize=({id,sourceSHA256,url,verifiedPreviewURL}={})=>{
  if(shown||original)throw Error('Photo identity already finalized');
  if(id!==LICENSED_FALLBACK.id||!hex.test(sourceSHA256||'')||
   url!==LICENSED_FALLBACK.url||typeof verifiedPreviewURL!=='string'||
   !doc.location?.origin||!verifiedPreviewURL.startsWith('blob:'+doc.location.origin+'/')||
   verifiedPreviewURL.length>400)throw Error('Unverified licensed photo identity');
  original=Object.freeze({id,sourceSHA256,url,displayURL:verifiedPreviewURL});
  return true;
 };
 const show=(reason='The 3D viewer is unavailable.')=>{
  if(shown)return {photoOnly:true,originalVerified:!!original};
  shown=true;
  try{onDeactivate();}catch{}
  const dialog=$('reviewDialog');if(dialog?.open)dialog.close();
  canvas.hidden=true;canvas.dataset.photoOnly='true';
  canvas.dataset.shirt='none';canvas.dataset.photoSource='';canvas.dataset.ready='false';
  canvas.dataset.photoApproved='false';canvas.dataset.releaseAuthorized='false';
  panel.hidden=false;
  image.hidden=!original;
  if(original){
   // Reuse exact SHA-verified in-memory original JPEG bytes, not a second
   // network request that could change after the source hash check.
   image.src=original.displayURL;
   image.alt='Original licensed black printed shirt photo — 3D viewer unavailable';
  }else{
   image.removeAttribute('src');
   image.alt='Original photo not independently verified';
  }
  const action=$('fallbackReason');
  if(action)action.textContent=(original?
   '3D viewing is unavailable. Showing only the verified original clothing photograph.':
   '3D viewing is unavailable and the clothing photograph could not be verified.')+
   ' No outfit was fitted, applied, saved, or approved. Family Alpha HOLD.';
  for(const id of ['front','side','back','turn','reset','spin','model','finish',
   'mode','pose','review','dress','clear','garment','threequarter',
   'zoomIn','zoomOut','closeReview']){
   const control=$(id);if(control)control.disabled=true;
  }
  const status=$('status');
  if(status)status.textContent='3D unavailable · original photo fallback only · Family Alpha HOLD.';
  const photoStatus=$('photoStatus');
  if(photoStatus)photoStatus.textContent='Photo only. No 3D shirt, fit, saved outfit or approval.';
  return Object.freeze({photoOnly:true,originalVerified:!!original,
   sourceSHA256:original?.sourceSHA256||null,releaseAuthorized:false,
   mode:LICENSED_FALLBACK.mode,reason:String(reason).slice(0,100)});
 };
 return Object.freeze({authorize,show,getState:()=>Object.freeze({
  photoOnly:shown,originalVerified:!!original,
  id:original?.id||null,releaseAuthorized:false
 })});
}
