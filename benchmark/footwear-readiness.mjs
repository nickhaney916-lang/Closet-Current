// Research-only footwear / hosiery model readiness audit.
// The DeepFashion2 13-class detector has no shoe/tights category. The pinned
// LIP 20-class model was separately inspected on two *different* licensed
// images; apparent shoe-class pixels were NOT independently verified fabric.
// Distinct suites cannot be compared as a head-to-head accuracy percentage.
const HASH=/^[0-9a-f]{64}$/;
const LIP_MODEL_SHA='871c9e209dc67d6be61c73dcc79cb49e638fcf5bbc35a19b4c7429eba0bfc046';
const FOOT_IDS=new Set(['commons-0079','validation-0019']);
const LIP_IDS=new Set(['validation-0030','validation-0031']);
export function assessFootwearModelReadiness(deepfashion,lip,suite){
 if(deepfashion?.status!=='complete'||deepfashion.modelHashVerified!==true||
  deepfashion.sourceHashesVerified!==true||
  deepfashion.originalPhotosPreserved!==true||
  deepfashion.customerModelChanged!==false||
  deepfashion.automaticItemsCreated!==0||
  !Array.isArray(deepfashion.cases)||deepfashion.cases.length!==10||
  suite?.realPhotoCount!==10||!Array.isArray(suite.cases)||suite.cases.length!==10||
  suite.sourceReferencesAreNotPixelMasks!==true||
  suite.expectedCategoryLabelsAreContextOnly!==true||
  suite.customerDeploymentAllowed!==false)
  throw Error('Untrusted experimental DeepFashion source and validation suite');
 const source=new Map();
 for(const c of suite.cases){
  if(typeof c?.id!=='string'||source.has(c.id))throw Error('Invalid suite identity');
  source.set(c.id,c);
 }
 const actual=new Map();
 for(const c of deepfashion.cases){
  if(typeof c?.id!=='string'||actual.has(c.id)||!source.has(c.id)||
   !HASH.test(c.sourceSha256)||c.originalPreserved!==true||
   c.automaticItemsSaved!==0||c.instanceMasksVerified!==0||
   !Number.isInteger(c.proposedMasks)||c.proposedMasks<0||
   !Array.isArray(c.proposals)||c.proposals.length!==c.proposedMasks||
   c.categoryCoverageReview?.contextCategoryIsNotGroundTruth!==true||
   c.categoryCoverageReview?.instancePrecisionRecallMeasured!==false)
   throw Error('Untrusted source or DeepFashion model proposal');
  actual.set(c.id,c);
 }
 if(actual.size!==10||source.size!==10||
  ![...FOOT_IDS].every(id=>source.get(id)?.expectedCategory==='Shoes'))
  throw Error('Incomplete pinned footwear negative controls');
 if(lip?.model!=='pirocheto/schp-lip-20'||lip.modelSha256!==LIP_MODEL_SHA||
  lip.modelLicense!=='MIT'||lip.groundTruthPixelMasksAvailable!==false||
  lip.automaticHosieryCatalogApproved!==false||
  lip.addedClosetEntries!==0||lip.accuracyPercentage!==null||
  !Array.isArray(lip.findings)||lip.findings.length!==2||
  lip.photosCount!==2)
  throw Error('Unsafe pinned prior human-parsing review evidence');
 const lipCases=new Map();
 for(const c of lip.findings){
  if(!LIP_IDS.has(c?.id)||lipCases.has(c.id)||c.perPixelAccuracyMeasured!==false||
   c.clothingSeparatedCorrectly!==false||
   !Number.isInteger(c.shoeClassPixels)||c.shoeClassPixels<0||
   !Number.isInteger(c.sockClassPixels)||c.sockClassPixels<0)
   throw Error('Invalid historic real-image LIP findings');
  lipCases.set(c.id,c);
 }
 if(lipCases.size!==2||lipCases.get('validation-0031').sockClassPixels!==0||
  lipCases.get('validation-0030').sockAndShoeClassesPresent!==true)
  throw Error('Unverified historic hosiery/shoe review references');
 const footwear=[...FOOT_IDS].sort().map(id=>{
  const actualCase=actual.get(id),scenario=source.get(id);
  if(scenario.expectedTypeHint!=='shoes'||actualCase.proposedMasks!==0||
   actualCase.categoryCoverageReview.negativeFootwearControl!==true||
   actualCase.categoryCoverageReview.categorySupportedByThisModel!==false||
   !actualCase.manualReviewRisk?.manualReviewFlags?.includes('unsupported-footwear-taxonomy'))
   throw Error('DeepFashion shoe-negative control changed; review needed');
  return {sourceId:id,sourceSha256:actualCase.sourceSha256,
   actualDeepFashionProposals:actualCase.proposedMasks,
   sourceTypeContextOnly:scenario.expectedTypeHint,
   footwearClassSupportedByDeepFashion:false,
   physicalShoeQuantityVerified:false,shoePixelsVerified:false,
   shoeRecall:null,modelAccuracy:null};
 });
 return {
  status:'footwear-and-hosiery-promotion-blocked',
  experiment:'cross-study-taxonomy-and-reviewed-failure-audit',
  pinnedDeepFashionModel:deepfashion.model,
  pinnedLIPModel:lip.model,
  sourcePhotoCountDeepFashion:actual.size,
  negativeFootwearControls:footwear,
  lipHistoricImages:[...lipCases.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(x=>({
   sourceId:x.id,shoeClassPixels:x.shoeClassPixels,sockClassPixels:x.sockClassPixels,
   observedReview:x.visualReview,accurateClothingSeparated:false
  })),
  footwearTaxonomySupportedByDeepFashion:false,
  hosieryTaxonomySupportedByDeepFashion:false,
  lipBootShaftContaminationObserved:true,
  lipTightsMissObserved:true,
  samePhotoPairedPixelEvaluationAvailable:false,
  humanApprovedPixelOutlinesAvailable:false,
  measuredFootwearPrecision:null,
  measuredFootwearRecall:null,
  measuredHosieryAccuracy:null,
  comparableModelAccuracyImprovement:null,
  accuracyOrCategoryPercentageClaimAllowed:false,
  recommendation:'hold-current-customer-autosaving-for-unreliable-regions-and-request-independent-shoe-tights-outlines',
  missingEvaluationInputs:[
   'two-independent-human-original-photo-shoe-and-tights-instance-masks',
   'paired-predictions-on-the-same-held-out-source-images',
   'shoe-sole-heel-toe-shadow-and-strap-contamination-review',
   'mobile-footwear-performance-and-saved-photo-indexing-test'
  ],
  originalSourceRgbModified:false,
  paidInferenceUsed:false,
  customerModelChanged:false,
  autoSavedCustomerItems:0,
  canPromoteModel:false
 };
}
