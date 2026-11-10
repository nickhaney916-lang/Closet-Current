/**
 * P789 source-verified model-pixel color review. Real SegFormer masks guide a
 * color SAMPLING REGION only. Pixels still come from the original photo.
 * No color, subtype, human or garment identity is independently confirmed.
 *
 * Important: semantic B0 upper class 4 could be TOPS or OUTERWEAR, and a
 * model can miss/merge garments. Never auto-save or classify from this result.
 */
const HEX=/^[0-9a-f]{64}$/;
const regions=Object.freeze({UpperGarment:[4],Bottoms:[5,6],Dresses:[7],Shoes:[9]});
const reject=x=>{throw Error('M1_MODEL_COLOR_789: '+x)};
const digest=async bytes=>{
 const raw=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(raw),v=>v.toString(16).padStart(2,'0')).join('');
};
export async function modelMaskedColorReview789({
 sourceSHA256,sourceLabelMapSHA256,rgba,labelMap,width,height,
 categoryFamily,maskedPalette
}={}){
 if(!HEX.test(sourceSHA256)||!HEX.test(sourceLabelMapSHA256)||
    !Number.isInteger(width)||!Number.isInteger(height)||
    width<8||height<8||width>512||height>512||
    !Object.hasOwn(regions,categoryFamily)||
    !(rgba instanceof Uint8ClampedArray)||rgba.length!==width*height*4||
    !(labelMap instanceof Uint8Array)||labelMap.length!==width*height||
    typeof maskedPalette!=='function')reject('source, mask, dimension, category or color estimator mismatch');
 const labelDigest=await digest(labelMap);
 if(labelDigest!==sourceLabelMapSHA256)reject('actual pinned semantic model label-map SHA mismatch');
 if(labelMap.some(v=>v>17))reject('18-class frozen B0 semantic mapping required');
 const allowed=regions[categoryFamily],masked=new Uint8ClampedArray(rgba.length);
 let selected=0;
 for(let i=0;i<labelMap.length;i++){
  if(!allowed.includes(labelMap[i])||rgba[i*4+3]<224)continue;
  masked.set(rgba.subarray(i*4,i*4+3),i*4);masked[i*4+3]=255;selected++;
 }
 const coverage=selected/(width*height);
 // A small or near-entire image region cannot distinguish a garment from
 // background and must NOT return a plausible but unsupported color.
 const usable=selected>=Math.max(64,Math.round(width*height*.005))&&coverage<=.85;
 const palette=usable?maskedPalette(masked,width,height):null;
 return Object.freeze({
  schema:'m1-p789-real-semantic-mask-color-review/v1',
  sourceSHA256,modelLabelMapSHA256:labelDigest,modelRevision:
   'a2489ea8e7ec1ee912190546bad31a4906ccca76',
  semanticFamily:categoryFamily,modelSemanticRegionIds:[...allowed],
  selectedSourcePixels:selected,selectedFraction:+coverage.toFixed(5),
  sampledFromActualSourceRGBA:true,maskMembershipVerifiedBySHA:true,
  possiblePrimaryColor:palette?.primary||null,
  possibleSecondaryColor:palette?.secondary||null,
  palette:palette?.colors||[],candidateNeedsConfirmation:true,
  modelGarmentIdentityVerified:false,modelGarmentMaskAccuracyVerified:false,
  independentHumanColorVerified:false,sourcePixelOriginalPreserved:true,
  autoSaveAllowed:false,modelPromotionAuthorized:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
