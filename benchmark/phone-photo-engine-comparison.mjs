// Compare actual results from the TWO browser-local FashionCLIP runs on the
// same immutable original licensed JPEGs. No model output can be ground truth
// for other garments, and a review-only subtype is not a false automatic label.
const HASH=/^[a-f0-9]{64}$/;
const BUILD=/^[a-f0-9]{12}$/;
const KEY=/^photo-00[12]$/;
function valid(r){
 if(r?.format!=='closet-current-phone-photo-check'||r.version!==1||
    !BUILD.test(r.release||'')||!HASH.test(r.recognitionIndex||'')||
    r.summary?.photos!==2||r.summary.errors!==0||
    r.summary.categoryMatches!==1||r.summary.negativeRejected!==1||
    r.summary.incorrectAutomaticCategories!==0||
    r.summary.incorrectAutomaticTypes!==0||
    !Array.isArray(r.photos)||r.photos.length!==2||
    !r.photos.every(p=>KEY.test(p.id)))
  throw Error('Incomplete, incorrect or untrusted licensed photo-check report');
 if(r.photos[0].id!=='photo-001'||r.photos[1].id!=='photo-002'||
    r.photos[0].expectedCategory!=='Tops'||
    r.photos[0].expectedType!=='T-shirt'||
    r.photos[1].expectedCategory!=='Uncategorized'||
    r.photos[0].prediction?.category!=='Tops'||
    r.photos[1].categoryMatch!==true)
  throw Error('Photo label/order is not the fixed original licensed cohort');
 const first=r.photos[0];
 if(first.prediction.type!=='T-shirt'&&
    !(first.prediction.type==='Unknown'&&first.strong===false&&first.categoryConfirmed===true))
  throw Error('Unknown type must remain conservative review, never wrong automatic label');
}
function privacy(raw){
 if(typeof raw!=='string'||/(PRIVATE_PHONE|data:image|data:application\/octet|access_token|refresh_token|bearer\s)/i.test(raw))
  throw Error('Private image, filename or credential leaked into test JSON');
}
export function compareBrowserOriginalPhotos(chromium,webkit,{chromiumJSON,webkitJSON}={}){
 valid(chromium);valid(webkit);
 if(chromiumJSON)privacy(chromiumJSON);
 if(webkitJSON)privacy(webkitJSON);
 if(chromium.release!==webkit.release||
    chromium.recognitionIndex!==webkit.recognitionIndex)
  throw Error('Engine results are from different builds or recognition weights');
 const rows=chromium.photos.map((photo,i)=>{
  const other=webkit.photos[i];
  if(other.id!==photo.id||other.expectedCategory!==photo.expectedCategory||
     other.expectedType!==photo.expectedType)
   throw Error('Engines did not classify the same locked fixture order');
  return {id:photo.id,referenceCategory:photo.expectedCategory,
   chromiumCategory:photo.prediction?.category||null,
   webkitCategory:other.prediction?.category||null,
   chromiumType:photo.prediction?.type||null,
   webkitType:other.prediction?.type||null,
   chromiumAcceptedType:photo.strong===true,
   webkitAcceptedType:other.strong===true,
   typeDifferenceNeedsRealPhoneReview:photo.prediction?.type!==other.prediction?.type,
   negativeControlAcceptedByEither:false};
 });
 return {schemaVersion:1,status:'two-browser-original-photo-safety-check-passed',
  appRelease:chromium.release,recognitionIndex:chromium.recognitionIndex,
  licensedShaLockedOriginals:2,modelRuns:2,
  broadCategoryCorrectInBoth:true,negativeRejectedInBoth:true,
  wrongAutomaticGarmentForms:0,
  photoRows:rows,typeDisagreements:rows.filter(x=>x.typeDifferenceNeedsRealPhoneReview).map(x=>x.id),
  implementation:'different browser engines, same original photo bytes; original RGB may decode/reencode differently',
  actualPhysicalAndroidTested:false,actualPhysicalIPhoneTested:false,
  actualCameraCaptureTested:false,realWorldGarmentAccuracy:null,
  independentHumanFormGroundTruth:null,paidProviderCalls:0,
  productionRecognitionModified:false,releaseApproved:false};
}
