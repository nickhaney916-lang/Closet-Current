/**
 * P790 read-only bridging of genuine public-source semantic mask color research
 * to native owner Adjust. A source/model receipt is not independently verified
 * human color truth and never authorizes a color selection or private save.
 */
const HEX=/^[a-f0-9]{64}$/;
const allowedColors=new Set(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor']);
const regions={UpperGarment:[4],Bottoms:[5,6],Dresses:[7],Shoes:[9]};
const fail=x=>{throw Error('P790_OWNER_COLOR_REVIEW: '+x)};
export function admitSourceColorHint790({originalSHA256,sourceCategoryReview,colorReceipt}={}){
 const e=colorReceipt,c=sourceCategoryReview;
 if(!HEX.test(originalSHA256)||!c||!e||c.sourceSHA256!==originalSHA256||
    e.sourceSHA256!==originalSHA256||
    c.modelRevision!=='a2489ea8e7ec1ee912190546bad31a4906ccca76'||
    e.modelRevision!==c.modelRevision||
    e.schema!=='m1-p789-real-semantic-mask-color-review/v1'||
    !HEX.test(c.sourceLabelMapSHA256)||
    e.modelLabelMapSHA256!==c.sourceLabelMapSHA256||
    !Array.isArray(c.raster)||c.raster.length!==2||
    !Array.isArray(c.observedRegions)||
    !Array.isArray(e.modelSemanticRegionIds)||
    !Array.isArray(regions[e.semanticFamily])||
    !Array.isArray(e.palette)||
    !Number.isInteger(e.selectedSourcePixels)||e.selectedSourcePixels<0||
    !Number.isFinite(e.selectedFraction)||
    e.selectedFraction<0||e.selectedFraction>1||
    e.maskMembershipVerifiedBySHA!==true||
    e.sampledFromActualSourceRGBA!==true||
    e.sourcePixelOriginalPreserved!==true||
    e.candidateNeedsConfirmation!==true||
    e.independentHumanColorVerified!==false||
    e.modelGarmentIdentityVerified!==false||
    e.modelGarmentMaskAccuracyVerified!==false||
    e.autoSaveAllowed!==false||e.releaseAuthorized!==false||
    e.modelPromotionAuthorized!==false||e.familyAlpha!=='HOLD'||
    c.autoSaveAllowed!==false||c.ownerReviewed!==false||
    c.verifiedIndependentHumanTruth!==false||c.needsReview!==true||
    !Array.isArray(c.possibleCategories)||c.possibleCategories.length<1)
  fail('original source or fail-closed unapproved model receipt');
 const [width,height]=c.raster;
 if(!Number.isInteger(width)||!Number.isInteger(height)||
    width<8||height<8||width>512||height>512||
    e.selectedSourcePixels>width*height||
    Math.abs(e.selectedFraction-e.selectedSourcePixels/(width*height))>.00002||
    e.modelSemanticRegionIds.length!==regions[e.semanticFamily].length||
    e.modelSemanticRegionIds.some((v,i)=>v!==regions[e.semanticFamily][i])||
    !e.modelSemanticRegionIds.some(id=>c.observedRegions.some(o=>o.semanticRegionId===id))||
    e.palette.length>13||
    e.palette.some(p=>!allowedColors.has(p?.color)||typeof p.share!=='number'||p.share<0||p.share>1)||
    (e.possiblePrimaryColor!==null&&!allowedColors.has(e.possiblePrimaryColor))||
    (e.possibleSecondaryColor!==null&&!allowedColors.has(e.possibleSecondaryColor)))
  fail('wrong source model raster, category, semantic region or color');
 const color=e.possiblePrimaryColor;
 // Critically: no color input update, no owner flag, no training label, no
 // saved confirmed detail is permitted from this untrusted research candidate.
 return Object.freeze({
  schema:'m1-p790-owner-visible-color-candidate/v1',
  sourceSHA256:originalSHA256,modelLabelMapSHA256:e.modelLabelMapSHA256,
  semanticFamily:e.semanticFamily,possiblePrimaryColor:color,
  selectedSourcePixels:e.selectedSourcePixels,
  displayHint:color?'Model-mask color possibility: '+color+'. Check the ORIGINAL photograph and manually enter the color; the model has NOT verified this garment or its color.':'Model-mask color unclear. Check the original photograph and manually enter the color.',
  independentHumanColorVerified:false,ownerColorConfirmed:false,
  ownerReviewRequired:true,autoPopulateColor:false,autoSaveAllowed:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
