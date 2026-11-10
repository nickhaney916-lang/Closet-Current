/**
 * Mission 1 P785: review-only reconciliation of the genuine, unchanged B0
 * semantic garment regions. A model's largest visible semantic REGION is not
 * an identified garment. Especially region 4 means Tops OR Outerwear.
 *
 * This is a source-only hint. It must never supply an accepted category,
 * subtype, color, human agreement, original-photo proof or saved item.
 */
const HEX=/^[0-9a-f]{64}$/;
const B0='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const REGION=new Map([
 [4,{label:'Upper garment (top or outerwear)',categories:['Tops','Outerwear']}],
 [5,{label:'Skirt',categories:['Bottoms']}],
 [6,{label:'Lower garment',categories:['Bottoms']}],
 [7,{label:'Dress',categories:['Dresses']}],
 [9,{label:'Footwear',categories:['Shoes']}]
]);
const fail=reason=>{throw Error('M1_SOURCE_REVIEW_785: '+reason)};
export function reconcileRealSourceRegions785({sourceSHA256,modelEvidence}={}){
 if(!HEX.test(sourceSHA256)||!modelEvidence||
    modelEvidence.sourceSHA256!==sourceSHA256||
    modelEvidence.model!=='Xenova/segformer_b0_clothes'||
    modelEvidence.modelRevision!==B0||
    !HEX.test(modelEvidence.labelMapSHA256)||
    !Array.isArray(modelEvidence.modelMask)||
    modelEvidence.modelMask.length!==2)
  fail('source JPEG or frozen actual SegFormer/model-map receipt mismatch');
 const [width,height]=modelEvidence.modelMask,area=width*height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||
    height<1||width>512||height>512||
    !Array.isArray(modelEvidence.detectedRegions)||
    modelEvidence.detectedRegions.length<1||
    modelEvidence.detectedRegions.length>24)
  fail('bounded original model mask or semantic regions required');
 const observed=[],uniqueHashes=new Set(),families=new Map();
 let totalPixels=0;
 for(const region of modelEvidence.detectedRegions){
  const def=REGION.get(region?.semanticRegionId);
  if(!def||!Number.isInteger(region.selectedCount)||
     region.selectedCount<1||region.selectedCount>area||
     !HEX.test(region.maskSHA256)||uniqueHashes.has(region.maskSHA256)||
     region.needsReview!==true)
   fail('invalid, duplicated or auto-accepted original region');
  uniqueHashes.add(region.maskSHA256);
  totalPixels+=region.selectedCount;
  if(totalPixels>area)fail('model garment region pixel count exceeds source raster');
  observed.push(Object.freeze({semanticRegionId:region.semanticRegionId,
   label:def.label,selectedPixelCount:region.selectedCount,
   sourceMaskSHA256:region.maskSHA256,categories:[...def.categories]}));
  families.set(region.semanticRegionId,(families.get(region.semanticRegionId)||0)+region.selectedCount);
 }
 const categories=[...new Set(observed.flatMap(x=>x.categories))];
 const semanticLabels=[...families.keys()].map(id=>REGION.get(id).label);
 // A model may label one dress as both upper-clothes and dress, so do not
 // convert either class's pixel count into a category probability or rank.
 return Object.freeze({
  schema:'mission1-p785-source-category-review/v1',
  sourceSHA256,modelRevision:B0,sourceLabelMapSHA256:modelEvidence.labelMapSHA256,
  raster:[width,height],observedRegions:observed,
  possibleCategories:categories,semanticLabels,
  mixedOrAmbiguous:families.size>1||families.has(4),
  totalSelectedModelPixels:totalPixels,
  automaticCategory:null,itemType:null,primaryColor:null,
  predictedGarmentInstancesVerified:false,ownerReviewed:false,
  verifiedIndependentHumanTruth:false,modelAccuracyImprovementProven:false,
  needsReview:true,autoSaveAllowed:false,photographed3DReady:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
