'use strict';
(function(root){
 // Human comparative review gate. These checks CANNOT establish identity by
 // themselves: the original and the generated image must be compared.
 // No automatic AI result may claim review status or self-approve.
 const ASPECTS=Object.freeze([
   'garmentCategory','dominantColor','patternGraphics',
   'visibleConstruction','fabricAppearance','visibleSilhouette','itemCount'
 ]);
 function evaluate(review){
  const fallback={decision:'needs-review',approved:false,
    reason:'independent-source-visual-review-required',
    automaticApprovalAllowed:false,sourcePhotoImmutable:true,
    newUserTabsRequired:false};
  if(!review||typeof review!=='object'||review.mode!=='owner-compared-original'||
   review.comparedOriginal!==true||review.sourceConditionedGeneration!==true)
    return fallback;
  if(!review.checks||typeof review.checks!=='object')return fallback;
  const unknown=[],fail=[];
  for(const key of ASPECTS){
   const decision=review.checks[key];
   if(decision==='different')fail.push(key);
   else if(decision!=='same')unknown.push(key);
  }
  // A single verified incorrect logo, seam, fabric, silhouette or color blocks
  // the generated image, even if the overall preview looks aesthetically nice.
  if(fail.length)return {...fallback,decision:'reject',
   reason:'garment-identity-changed',fail,unknown};
  if(unknown.length)return {...fallback,reason:'unverified-garment-details',unknown};
  if(review.inventedDetails===true||review.unseenBrandingIntroduced===true)
   return {...fallback,decision:'reject',reason:'fabricated-or-unseen-garment-details'};
  if(review.inventedDetails!==false||review.unseenBrandingIntroduced!==false)
   return {...fallback,reason:'invention-risk-not-resolved'};
  return {decision:'eligible-for-reviewed-display',approved:true,
   reason:'owner-confirmed-all-visible-details',
   automaticApprovalAllowed:false,sourcePhotoImmutable:true,
   newUserTabsRequired:false};
 }
 root.GarmentFidelityReview={ASPECTS,evaluate};
 if(typeof module!=='undefined')module.exports=root.GarmentFidelityReview;
})(typeof window!=='undefined'?window:globalThis);
