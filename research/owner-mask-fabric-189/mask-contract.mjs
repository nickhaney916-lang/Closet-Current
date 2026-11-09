/**
 * MAIN P189 — independent owner-private PNG alpha bytes for actual reviewed
 * source-blouse fabric masking. Original, reviewed JPEG, PNG alpha, and
 * licensed geometry each retain DIFFERENT identities. No private pixels
 * appear in public bridge status, console logs, or review receipts.
 *
 * This verifies an owner-ASSERTED alpha mask. It is NOT independent proof
 * that a human segmented the uploaded original photo, not general 3D
 * reconstruction, and not authority to replace the P62 fitted geometry.
 * A missing or changing mask leaves the safe original-photo 2D fallback.
 */
const SHA=/^[a-f0-9]{64}$/;
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const PREFIX='data:image/png;base64,';
const PNG=[137,80,78,71,13,10,26,10];
const fail=reason=>{throw Error('P189 '+reason);};
const readU32=(bytes,at)=>(bytes[at]*16777216+bytes[at+1]*65536+bytes[at+2]*256+bytes[at+3])>>>0;
export function inspectOwnerMaskRecord189({row,ownerId,review}={}){
 const hint=row?.segmentHint;
 if(typeof ownerId!=='string'||!ownerId||row?.ownerId!==ownerId||
    review?.ownerId!==ownerId||review?.garmentId!==row.id||
    review?.originalSourceSHA256!==SOURCE||review?.cutoutSHA256!==row.cutoutSHA256||
    review?.originalJPEGBytesSHA256Verified!==true||
    review?.cutoutJPEGBytesSHA256Verified!==true||
    row?.sourceSHA256!==SOURCE||row?.sourceId!=='commons-0016'||
    row?.category!=='Tops'||row?.itemType!=='Blouse'||
    row?.ownerReviewed!==true||row?.humanReviewedSource!==true||
    row?.reviewProvenance!=='explicit-owner-claim-not-independent-review-evidence'||
    hint?.verified!==true||hint?.ownerReviewedInstance!==true||
    hint?.originalSHA256!==SOURCE||hint?.cutoutSHA256!==row.cutoutSHA256||
    hint?.ownerAlphaReviewState189!=='owner-asserted-reviewed-not-independently-witnessed'||
    hint?.ownerAlphaSourceId189!=='commons-0016'||
    hint?.ownerAlphaOwnerId189!==ownerId||
    !SHA.test(hint?.ownerAlphaSHA256189||'')||
    hint.ownerAlphaSHA256189===SOURCE||
    hint.ownerAlphaSHA256189===row.cutoutSHA256||
    typeof hint?.ownerAlphaPNG189!=='string'||
    !hint.ownerAlphaPNG189.startsWith(PREFIX)||
    hint.ownerAlphaPNG189.length<250||
    hint.ownerAlphaPNG189.length>12000000)
  fail('current owner, reviewed DOUBLE JPEG, and separate claimed PNG alpha required');
 return Object.freeze({ownerId,garmentId:row.id,sourceId:'commons-0016',
  sourceJPEG_SHA256:SOURCE,cutoutJPEG_SHA256:row.cutoutSHA256,
  privatePNG_SHA256:hint.ownerAlphaSHA256189,verifiedReviewIsOwnerAssertionOnly:true,
  independentlyHumanReviewed:false,segmentationAccuracyCertified:false,
  anatomy3DGeneralized:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
export async function attestOwnerMaskPNGBytes189({
 row,ownerId,review,cryptoImpl,decodeBase64
}={}){
 const before=inspectOwnerMaskRecord189({row,ownerId,review});
 const png= row.segmentHint.ownerAlphaPNG189;
 if(typeof decodeBase64!=='function'||!cryptoImpl?.subtle?.digest)
  fail('native WebCrypto and base64 decoding required');
 const encoded=png.slice(PREFIX.length);
 let bytes;
 try{const decoded=decodeBase64(encoded);bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0));}
 catch{fail('invalid private PNG base64');}
 if(bytes.length<200||bytes.length>8000000||
  PNG.some((n,i)=>bytes[i]!==n)||
  String.fromCharCode(...bytes.slice(12,16))!=='IHDR')
  fail('valid actual PNG file signature and IHDR required');
 const width=readU32(bytes,16),height=readU32(bytes,20);
 if(width<32||height<32||width*height>8000000||
    bytes[25]!==6) // PNG color type 6 = real RGBA/alpha, not a flat RGB proxy.
  fail('bounded true-RGBA owner mask PNG required');
 const hex=Array.from(new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',bytes)),
  c=>c.toString(16).padStart(2,'0')).join('');
 if(hex!==before.privatePNG_SHA256)
  fail('private PNG bytes do not match current owner mask SHA');
 const after=inspectOwnerMaskRecord189({row,ownerId,review});
 if(JSON.stringify(after)!==JSON.stringify(before)||
    row.segmentHint.ownerAlphaPNG189!==png)
  fail('owner mask or review changed during asynchronous WebCrypto');
 return Object.freeze({...before,width,height,actualPNGBytesWebCryptoVerified:true});
}
export async function decodeReviewedOwnerMask189({asset,blouse}={}){
 if(asset?.ownerAlphaProof189?.actualPNGBytesWebCryptoVerified!==true||
    asset.ownerAlphaProof189.privatePNG_SHA256!==asset.ownerAlphaSHA256189||
    typeof asset.ownerAlphaPNG189!=='string'||
    !asset.ownerAlphaPNG189.startsWith(PREFIX)||
    !SHA.test(asset.ownerAlphaSHA256189||'')||
    asset.ownerAlphaSHA256189===blouse?.silhouette62?.cutoutSHA256||
    asset.ownerAlphaProof189.releaseAuthorized!==false)
  fail('separate private alpha PNG and byte-bound review proof required');
 // Verify AGAIN at the in-memory geometry handoff, independently of BOARD04.
 const raw=Uint8Array.from(atob(asset.ownerAlphaPNG189.slice(PREFIX.length)),
  c=>c.charCodeAt(0));
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),
  b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==asset.ownerAlphaSHA256189)
  fail('private alpha bytes changed between native owner and 3D renderer');
 const img=new Image();img.decoding='async';img.src=asset.ownerAlphaPNG189;
 try{await img.decode();}catch{fail('actual private alpha PNG cannot decode');}
 const mw=blouse?.cutout?.naturalWidth||blouse?.cutout?.width||0;
 const mh=blouse?.cutout?.naturalHeight||blouse?.cutout?.height||0;
 if(!mw||!mh||Math.abs(img.naturalWidth/mw-1)>.01||
    Math.abs(img.naturalHeight/mh-1)>.01||
    img.naturalWidth*img.naturalHeight>8000000)
  fail('owner mask registration differs from pinned licensed source coordinates');
 const canvas=document.createElement('canvas');
 canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)fail('private alpha pixel inspection unavailable');
 ctx.drawImage(img,0,0);
 const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);
 let active=0,left=0,right=0,border=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const a=data[(y*canvas.width+x)*4+3];
  if(a<128)continue;
  active++;
  if(x<canvas.width/2)left++;else right++;
  if(x===0||y===0||x===canvas.width-1||y===canvas.height-1)border++;
 }
 const coverage=active/(canvas.width*canvas.height);
 if(coverage<.05||coverage>.88||left<active*.12||right<active*.12||
    border>Math.max(4,active*.025))
  fail('blank, clipped, unbalanced or implausible owner alpha silhouette');
 return Object.freeze({mask:img,privateMaskSHA256:asset.ownerAlphaSHA256189,
  actualOwnerMaskPNGWebCryptoAndPixelValidated:true,
  ownerAssertedNotIndependentlyHumanReviewed:true,
  sourceSpecificAlignmentOnly:true,geometryStillPinnedLicensedSilhouette:true,
  releaseAuthorized:false,familyAlpha:'HOLD'});
}
