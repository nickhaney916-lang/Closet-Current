// Research-only full-photo inventory evaluation. Model proposals are NEVER ground truth.
// Only separately, independently identified and two-reviewer approved physical
// garment masks can establish a false negative (including a garment the model missed).
import {approvedReferenceMask,scoreApprovedPredictionAtReferenceResolution} from './garment-mask-metrics.mjs';

const SHA=/^[0-9a-f]{64}$/;
const PHOTO=/^(?:commons|validation)-[0-9]{4}$/;
const CATEGORIES=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
const MODEL_CATEGORY={
 short_sleeve_top:'Tops',long_sleeve_top:'Tops',sling:'Tops',vest:'Tops',
 short_sleeve_outwear:'Outerwear',long_sleeve_outwear:'Outerwear',
 shorts:'Bottoms',trousers:'Bottoms',skirt:'Bottoms',
 short_sleeve_dress:'Dresses',long_sleeve_dress:'Dresses',
 vest_dress:'Dresses',sling_dress:'Dresses'
};
const name=x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<=100;
const distinct=(a,b)=>name(a)&&name(b)&&a.trim().toLocaleLowerCase('en-US')!==b.trim().toLocaleLowerCase('en-US');
const validStamp=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(x)&&Number.isFinite(Date.parse(x));
const targetId=(id,scene)=>id===scene+'-item-'+(typeof id==='string'?id.slice(-2):'')&&
 /^[0-9]{2}$/.test(id.slice(-2));
const proposalId=(id,scene)=>id===scene+'-candidate-'+(typeof id==='string'?id.slice(-2):'')&&
 /^[0-9]{2}$/.test(id.slice(-2));

// Return a pending report when NO independent inventory was supplied.
// Mere source labels or model proposals never establish inventory completeness.
export function evaluateCompletePhysicalInventory(scene,inventory,annotations,seeds,{minimumIoU=.5}={}){
 if(!PHOTO.test(scene?.id)||scene.image!==scene.id+'.jpg'||!SHA.test(scene.sourceSha256)||
   !(annotations instanceof Map)||!(seeds instanceof Map)||
   !Number.isFinite(minimumIoU)||minimumIoU<.25||minimumIoU>.9)
  throw Error('Invalid source identity, review inputs or matching gate');
 const proposals=[...seeds].sort((a,b)=>a[0].localeCompare(b[0]));
 if(proposals.length>16)throw Error('Too many model proposals to evaluate safely');
 for(const [id,seed] of proposals){
  if(!proposalId(id,scene.id)||seed?.modelProposalId!==id||
   seed.image!==scene.image||seed.sourceSha256!==scene.sourceSha256||
   seed.reviewStatus!=='prediction-unreviewed'||seed.independentReference!==false||
   seed.canSaveToCustomerCloset!==false||seed.schemaVersion!==1||
   !Object.hasOwn(MODEL_CATEGORY,seed.modelGarmentLabel))
   throw Error('Unsafe prediction or source mismatch');
 }
 if(!inventory){
  if(annotations.size)throw Error('Unattested garment references cannot be scored');
  return {sourceId:scene.id,status:'awaiting-complete-independent-inventory',
   modelProposals:proposals.length,approvedPhysicalGarments:0,
   detectionRecall:null,proposalPrecision:null,meanMatchedIoU:null,
   missingGarments:null,falseExtraProposals:null,canPromoteModel:false};
 }
 if(inventory.schemaVersion!==1||inventory.status!=='human-inventory-complete'||
   inventory.image!==scene.image||inventory.sourceSha256!==scene.sourceSha256||
   inventory.originalPhotoVerified!==true||inventory.allVisibleGarmentsAccountedFor!==true||
   !distinct(inventory.reviewedBy,inventory.approvedBy)||!validStamp(inventory.reviewedAt)||
   !Array.isArray(inventory.targets)||inventory.targets.length<1||inventory.targets.length>12)
  throw Error('Full-photo garment inventory is not independently attested');
 if(annotations.size!==inventory.targets.length)throw Error('Missing or extra approved physical garment outlines');
 const refs=[],ids=new Set();
 for(const target of inventory.targets){
  const id=target?.id;
  if(!targetId(id,scene.id)||ids.has(id)||!CATEGORIES.has(target.category)||!name(target.label))
   throw Error('Invalid or duplicated human-identified garment');
  ids.add(id);
  const annotation=annotations.get(id);
  if(!annotation||annotation.physicalTargetId!==id||
    annotation.modelProposalId!=null||annotation.seedModel!=null||
    annotation.humanCategory!==target.category||annotation.humanTargetLabel!==target.label||
    annotation.targetIndependentlyIdentifiedBy!==annotation.reviewer||
    annotation.reviewer!==inventory.reviewedBy||
    annotation.approvedBy!==inventory.approvedBy)
   throw Error('Independent target identity, role or human provenance mismatch');
  // The existing standard validator also requires two different reviewers,
  // binary pixel data, source identity and nontrivial garment/background.
  approvedReferenceMask(annotation,scene);
  refs.push({id,category:target.category,label:target.label,annotation});
 }
 const scores=proposals.map(([,seed])=>refs.map(r=>
  scoreApprovedPredictionAtReferenceResolution(r.annotation,scene,seed)));
 // Exact maximum-cardinality, maximum-IoU matching. Each AI prediction may
 // match at most ONE actual garment; duplicates never improve recall.
 const memo=new Map();
 function optimize(i,used){
  if(i===proposals.length)return {matches:0,sum:0,pairs:[]};
  const key=i+':'+used;if(memo.has(key))return memo.get(key);
  let best=optimize(i+1,used);
  for(let j=0;j<refs.length;j++){
   const overlap=scores[i][j].intersectionOverUnion;
   if((used&(1<<j))||overlap===null||overlap<minimumIoU)continue;
   const remaining=optimize(i+1,used|(1<<j));
   const candidate={matches:remaining.matches+1,sum:remaining.sum+overlap,
    pairs:[[i,j],...remaining.pairs]};
   if(candidate.matches>best.matches||
      (candidate.matches===best.matches&&candidate.sum>best.sum+1e-12))
    best=candidate;
  }
  memo.set(key,best);return best;
 }
 const matched=optimize(0,0);
 const usedRefs=new Set(matched.pairs.map(pair=>pair[1]));
 const usedProposals=new Set(matched.pairs.map(pair=>pair[0]));
 const matches=matched.pairs.map(([i,j])=>({
  physicalTargetId:refs[j].id,modelProposalId:proposals[i][0],
  reviewedCategory:refs[j].category,predictedCategory:MODEL_CATEGORY[proposals[i][1].modelGarmentLabel],
  predictedClass:proposals[i][1].modelGarmentLabel,
  categoryCorrect:refs[j].category===MODEL_CATEGORY[proposals[i][1].modelGarmentLabel],
  intersectionOverUnion:scores[i][j].intersectionOverUnion,
  garmentRecallAtReferenceResolution:scores[i][j].garmentRecall,
  foregroundPrecisionAtReferenceResolution:scores[i][j].garmentPrecision
 }));
 const missing=refs.filter((_,j)=>!usedRefs.has(j)).map(r=>({
  physicalTargetId:r.id,category:r.category,label:r.label,
  unsupportedByThisModel:r.category==='Shoes'
 }));
 const extra=proposals.filter((_,i)=>!usedProposals.has(i)).map(([id,seed])=>({
  modelProposalId:id,predictedClass:seed.modelGarmentLabel,
  issue:'unmatched-or-duplicate-model-mask',
  knownBackgroundFalsePositive:false // Needs independent semantic review.
 }));
 const supported=refs.filter(r=>r.category!=='Shoes');
 const matchedSupported=matches.filter(x=>x.reviewedCategory!=='Shoes').length;
 const categoryCorrect=matches.filter(x=>x.categoryCorrect).length;
 return {sourceId:scene.id,status:'conditionally-scored-complete-human-inventory',
  sourceSha256:scene.sourceSha256,modelProposals:proposals.length,
  approvedPhysicalGarments:refs.length,matchedGarments:matches.length,
  missedPhysicalGarments:missing.length,unmatchedModelProposals:extra.length,
  categoryCorrectMatches:categoryCorrect,
  detectionRecall:matches.length/refs.length,
  supportedCategoryDetectionRecall:supported.length?matchedSupported/supported.length:null,
  proposalPrecision:proposals.length?matches.length/proposals.length:null,
  correctCategoryRecall:categoryCorrect/refs.length,
  meanMatchedIoU:matches.length?matched.sum/matches.length:null,
  minimumIoU,matched:matches,missingGarments:missing,
  extraOrDuplicateProposals:extra,
  referenceMasksIndependentlyApproved:true,
  completenessAttestationIsHumanProvided:true,
  measuredOnlyIfRealHumanReviewsWereGenuine:true,
  noAutomaticModelPromotion:true,canPromoteModel:false,
  sourceRgbChanged:false,automaticItemsSaved:0};
}
