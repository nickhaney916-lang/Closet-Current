/**
 * 3D-07: source-bound photographic shirt preview on the actual CC0 anatomical rig.
 * NO physical garment mesh / fit claim. Work47/3D02 are the original authorities.
 * The source photograph, alpha, and source identity remain untouched.
 */
export const LICENSED_SHIRT='commons-0003';
export const BODY_PREVIEW=Object.freeze({
 shoulderTop:1.61, torsoBottom:1.12, halfChest:.365,
 frontStart:.005, frontFull:.085, sleeveHalfReach:.65,
 mode:'anatomical-surface-projection',
 back:'source-median-neutral-no-invented-back',
 visualApproval:false,releaseAuthorized:false
});
const hex=/^[0-9a-f]{64}$/;
export function requireAnatomicalShirtPreview(item,{acknowledged=false}={}){
 if(acknowledged!==true||!item||item.id!==LICENSED_SHIRT||
  item.type!=='shirt'||!hex.test(item.sourceSHA256||'')||
  item.ownerApproved!==false||item.releaseAuthorized!==false||
  item.realFabricTexture!==true||item.humanVisualApproval!==false||
  !item.cutout||typeof item.cutout.decode!=='function'||
  !Array.isArray(item.cropRect)||item.cropRect.length!==4||
  item.cropRect.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)||
  item.cropRect[0]+item.cropRect[2]>1.000001||
  item.cropRect[1]+item.cropRect[3]>1.000001||
  item.cropRect[2]<.1||item.cropRect[3]<.1||
  !Array.isArray(item.baseColor)||item.baseColor.length!==3||
  item.baseColor.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>1))
  throw Error('A reviewed, source-hash-verified shirt cutout is required');
 return Object.freeze({id:item.id,type:'shirt',sourceSHA256:item.sourceSHA256,
  cropRect:[...item.cropRect],baseColor:[...item.baseColor],
  textureImage:item.cutout,verified:true,humanVisualApproval:false,
  ownerApproved:false,releaseAuthorized:false});
}
export function buildSourceUV(x,y,profile=BODY_PREVIEW){
 if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid anatomical position');
 return [(x/profile.halfChest+1)/2,(y-profile.torsoBottom)/
  (profile.shoulderTop-profile.torsoBottom)];
}
export function imageUVFromBoundingCrop(x,y,crop,profile=BODY_PREVIEW){
 if(!Array.isArray(crop)||crop.length!==4||crop.some(n=>!Number.isFinite(n)))
  throw Error('Invalid source alpha bounds');
 const [u,v]=buildSourceUV(x,y,profile);
 return [crop[0]+u*crop[2],1-crop[1]-crop[3]+v*crop[3]];
}
