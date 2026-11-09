/**
 * P188: real owner-private JPEG texels on an actual source-fitted 163-bone shirt.
 * The pinned licensed PNG supplies *alpha and geometry only*. The saved
 * P119 owner-reviewed JPEG supplies the front fabric pixels. These are
 * intentionally DIFFERENT SHA identities; no claim that the public mask is
 * the owner's segmentation or a photograph of the inferred rear.
 *
 * The asset is supplied only through an explicitly owner-bound, research
 * in-memory handoff after a double WebCrypto SHA/owner-session lease; neither
 * the asset nor canvas is returned in native public state.
 */
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const SHA=/^[a-f0-9]{64}$/;
const fail=msg=>{throw Error('P188 '+msg);};
export function inspectPrivateCutoutTextureInputs188({blouse,asset}={}){
 if(blouse?.id!=='commons-0016'||blouse?.sourceSHA256!==SOURCE||
  blouse?.originalVerified!==true||blouse?.cutoutVerified!==true||
  blouse?.sourceAssetsVerified!==true||blouse?.silhouette62?.accepted!==true||
  !SHA.test(blouse?.cutoutSHA256||'')||
  !asset||asset.sourceId!=='commons-0016'||
  asset.originalSourceSHA256!==SOURCE||
  !SHA.test(asset.privateCutoutJPEGBytesSHA256||'')||
  asset.privateCutoutJPEGBytesSHA256===SOURCE||
  asset.privateCutoutJPEGBytesSHA256===blouse.cutoutSHA256||
  typeof asset.cutoutImage!=='string'||
  !asset.cutoutImage.startsWith('data:image/jpeg;base64,')||
  asset.cutoutImage.length<250||asset.cutoutImage.length>14000000||
  asset.ownerReviewed!==true||asset.originalJPEGVerified!==true||
  asset.cutoutJPEGVerified!==true||asset.familyAlpha!=='HOLD'||
  asset.releaseAuthorized!==false)
  fail('verified owner-reviewed separate JPEG and pinned original/source-mask required');
 return Object.freeze({sourceMaskSHA256:blouse.cutoutSHA256,
  ownerPrivateCutoutJPEG_SHA256:asset.privateCutoutJPEGBytesSHA256,
  maskIsOwnerGenerated:false,ownerReviewAssertedNotIndependentlyWitnessed:true,
  backViewOriginalPhotoVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
const decode=async src=>{
 const img=new Image();img.decoding='async';img.src=src;
 try{await img.decode();}catch{fail('owner JPEG cannot decode safely');}
 const w=img.naturalWidth,h=img.naturalHeight;
 if(w<32||h<32||w*h>8000000)fail('owner JPEG dimensions out of allowed range');
 return img;
};
export async function compositeOwnerReviewedCutout188({blouse,asset}={}){
 const identity=inspectPrivateCutoutTextureInputs188({blouse,asset});
 const originalMask=blouse.cutout;
 const mw=originalMask?.naturalWidth||originalMask?.width||0;
 const mh=originalMask?.naturalHeight||originalMask?.height||0;
 if(!mw||!mh||mw*mh>8000000)fail('actual source alpha mask unavailable');
 const reviewed=await decode(asset.cutoutImage);
 // The private JPEG must already be registered to this source's existing
 // exact mask coordinates. Arbitrary differing aspect ratios are NOT
 // warped or silently claimed fitted.
 if(Math.abs(reviewed.naturalWidth/mw-1)>.01||
    Math.abs(reviewed.naturalHeight/mh-1)>.01)
  fail('reviewed JPEG is not registered to pinned alpha silhouette');
 const canvas=document.createElement('canvas');canvas.width=mw;canvas.height=mh;
 const ctx=canvas.getContext('2d',{willReadFrequently:false});
 if(!ctx)fail('private texture compositing unavailable');
 ctx.clearRect(0,0,mw,mh);
 ctx.drawImage(reviewed,0,0,mw,mh);
 ctx.globalCompositeOperation='destination-in';
 ctx.drawImage(originalMask,0,0,mw,mh);
 ctx.globalCompositeOperation='source-over';
 // Canvas is a real HTMLImageSource consumed by the genuine THREE texture
 // and garment UV path. It remains in the disposable 3D donor only.
 return Object.freeze({...blouse,cutout:canvas,
  privateCutoutTexelsComposited188:true,
  cutoutSourceMaskSHA256188:identity.sourceMaskSHA256,
  privateCutoutJPEG_SHA256188:identity.ownerPrivateCutoutJPEG_SHA256,
  privateCutoutRegisteredToPinnedMask188:true,
  privateCutoutHumanApprovalIndependentlyVerified188:false,
  cutoutMaskFromOwnerPhoto188:false,
  releasedToProduction:false,releaseAuthorized:false});
}
