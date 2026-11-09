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
  !SHA.test(blouse?.silhouette62?.cutoutSHA256||'')||
  !asset||asset.sourceId!=='commons-0016'||
  asset.originalSourceSHA256!==SOURCE||
  !SHA.test(asset.privateCutoutJPEGBytesSHA256||'')||
  asset.privateCutoutJPEGBytesSHA256===SOURCE||
  asset.privateCutoutJPEGBytesSHA256===blouse.silhouette62.cutoutSHA256||
  typeof asset.cutoutImage!=='string'||
  !asset.cutoutImage.startsWith('data:image/jpeg;base64,')||
  asset.cutoutImage.length<250||asset.cutoutImage.length>14000000||
  asset.ownerReviewed!==true||asset.originalJPEGVerified!==true||
  asset.cutoutJPEGVerified!==true||asset.familyAlpha!=='HOLD'||
  asset.releaseAuthorized!==false)
  fail('verified owner-reviewed separate JPEG and pinned original/source-mask required');
 return Object.freeze({sourceMaskSHA256:blouse.silhouette62.cutoutSHA256,
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
 let originalMask=blouse.cutout,reviewedAlpha189=null;
 if(asset?.ownerAlphaPNG189||asset?.ownerAlphaProof189){
  const {decodeReviewedOwnerMask189}=await import('../owner-mask-fabric-189/mask-contract.mjs');
  reviewedAlpha189=await decodeReviewedOwnerMask189({asset,blouse});
  originalMask=reviewedAlpha189.mask;
 }
 let ownerGeometryProfile190=null,topologyProof191=null;
 if(asset?.ownerMaskTopologyRequested191===true&&asset?.ownerMaskGeometryRequested190!==true)
  fail('P191 requires verified P190 owner source-contour geometry admission');
 if(asset?.ownerMaskGeometryRequested190===true){
  if(reviewedAlpha189?.actualOwnerMaskPNGWebCryptoAndPixelValidated!==true)
   fail('P190 requires separately SHA-attested and pixel-validated reviewed owner alpha');
  if(asset.ownerMaskTopologyRequested191===true){
   const {verifyOwnerSourceTopology191}=await import('../owner-source-mask-topology-191/source-contour-integrity.mjs');
   topologyProof191=verifyOwnerSourceTopology191({
    source:blouse.cutout,owner:reviewedAlpha189.mask,
    sourceSHA256:blouse.sourceSHA256,
    ownerMaskSHA256:reviewedAlpha189.privateMaskSHA256
   });
  }
  const {profileOwnerAlphaGeometry190}=await import('../owner-mask-geometry-190/owner-alpha-contour.mjs');
  const bilateral195=new URLSearchParams(globalThis.location?.search||'')
   .get('photoOwnerBilateral195')==='research';
  // P195 requires the same real decoded SHA-verified P191-P194 owner
  // alpha as the physical garment; never accept private scalar metadata.
  if(bilateral195&&(asset.ownerMaskTopologyRequested191!==true||
    topologyProof191?.actualDecodedAlphaConnected191!==true||
    topologyProof191?.ownerSourceHairlineContinuous194!==true||
    topologyProof191?.ownerSourceInteriorContinuous192!==true))
   fail('P195 independent left/right contours require current decoded source topology');
  const baseProfile190=profileOwnerAlphaGeometry190({
   source:blouse.cutout,owner:reviewedAlpha189.mask,
   maskSHA:reviewedAlpha189.privateMaskSHA256,
   independentBilateral195:bilateral195
  });
  if(topologyProof191&&(topologyProof191.sourceSHA256!==baseProfile190.sourceSHA256||
    topologyProof191.ownerMaskSHA256!==baseProfile190.ownerMaskSHA256||
    topologyProof191.actualDecodedAlphaConnected191!==true||
    topologyProof191.independentHumanReviewVerified!==false))
   fail('P191 owner geometry topology proof not bound to the same exact current mask');
  ownerGeometryProfile190=Object.freeze({...baseProfile190,
   ownerMaskTopologyVerified191:topologyProof191!==null,
   ownerMaskTopologyIoU191:topologyProof191?.ownerSourceOverlapIoU191||0,
   ownerMaskTopologyConnected191:topologyProof191?.ownerLargestComponentRatio191||0,
   ownerMaskTopologyInsideSource191:topologyProof191?.ownerInsideSourceFraction191||0});
 }
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
 // The original 3D07 source-photo admission explicitly requires a decoded
 // HTMLImageElement (decode()), not a bare Canvas. Convert the private
 // canvas composite to a new in-memory PNG image before attaching it; the
 // private review source remains the separately SHA-verified JPEG.
 const compositedImage=await decode(canvas.toDataURL('image/png'));
 return Object.freeze({...blouse,cutout:compositedImage,
  privateCutoutTexelsComposited188:true,
  cutoutSourceMaskSHA256188:identity.sourceMaskSHA256,
  privateCutoutJPEG_SHA256188:identity.ownerPrivateCutoutJPEG_SHA256,
  privateCutoutRegisteredToPinnedMask188:reviewedAlpha189===null,
  privateOwnerAlphaPixelMask189:reviewedAlpha189!==null,
  ownerAlphaMaskSHA256_189:reviewedAlpha189?.privateMaskSHA256||null,
  ownerMaskWasSourceGeometry189:false,
  ownerMaskGeometryProfile190:ownerGeometryProfile190,
  // Independent P191 source-byte-backed topology proof, kept as scalars
  // within the owner-private donor. The separate P190 current mesh still
  // must prove 163 bones, same mask SHA and bilateral sewn shoulder caps.
  ownerSourceMaskTopologyValidated191:topologyProof191?.actualDecodedAlphaConnected191===true,
  ownerSourceMaskOverlapIoU191:topologyProof191?.ownerSourceOverlapIoU191||0,
  ownerSourceMaskLargestConnected191:topologyProof191?.ownerLargestComponentRatio191||0,
  ownerSourceMaskInsideSource191:topologyProof191?.ownerInsideSourceFraction191||0,
  ownerSourceMaskSHA191:topologyProof191?.ownerMaskSHA256||null,
  ownerSourceMaskReviewIndependentlyWitnessed191:false,
  ownerMaskHumanReviewedIndependently189:false,
  privateCutoutHumanApprovalIndependentlyVerified188:false,
  cutoutMaskFromOwnerPhoto188:false,
  releasedToProduction:false,releaseAuthorized:false});
}
