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
