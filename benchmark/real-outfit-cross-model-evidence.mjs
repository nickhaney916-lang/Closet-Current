// Two real-model outputs over one SHA-verified source. Suggestions here are
// research REVIEW PRIORITIES, never clothing instances or accuracy measures.
// SegFormer semantic regions and DeepFashion2 instance classes differ; no
// overlap/true garment IoU can be calculated from these reports alone.
const SHA=/^[0-9a-f]{64}$/;
const TYPE={
 short_sleeve_top:[4,'Tops'],long_sleeve_top:[4,'Tops'],vest:[4,'Tops'],sling:[4,'Tops'],
 short_sleeve_outwear:[4,'Outerwear'],long_sleeve_outwear:[4,'Outerwear'],
 shorts:[6,'Bottoms'],trousers:[6,'Bottoms'],skirt:[5,'Bottoms'],
 short_sleeve_dress:[7,'Dresses'],long_sleeve_dress:[7,'Dresses'],
 vest_dress:[7,'Dresses'],sling_dress:[7,'Dresses']
};
const REGION=new Map([[4,'Upper garment'],[5,'Skirt'],[6,'Bottoms'],[7,'Dress'],[9,'Shoes']]);
export function compareRealOutfitModelEvidence(deep,flow){
 if(deep?.status!=='complete'||deep.modelHashVerified!==true||
    deep.sourceHashesVerified!==true||deep.independentReferencesAvailable!==false||
    deep.automaticItemsCreated!==0||deep.customerModelChanged!==false||
    !Array.isArray(deep.cases)||!deep.cases.length||
    flow?.status!=='complete'||!flow.actualSegmentationWorker||!flow.actualRecognitionWorker||
    !SHA.test(flow.sourceSha256||'')||!flow.sourceId||
    flow.modelRegionDiagnostics?.version!==1||
    flow.modelRegionDiagnostics.sourcePixelsUnchanged!==true||
    flow.modelRegionDiagnostics.realPhotoAccuracy!==null||
    !Array.isArray(flow.modelRegionDiagnostics.regions))
    throw Error('Untrusted or incomplete same-source model evidence');
 const matches=deep.cases.filter(c=>c.id===flow.sourceId);
 if(matches.length!==1||matches[0].sourceSha256!==flow.sourceSha256)
    throw Error('DeepFashion and semantic outputs are not from the same verified original');
 const scene=matches[0],regions=new Map();
 for(const r of flow.modelRegionDiagnostics.regions){
  if(!Number.isInteger(r.id)||regions.has(r.id)||
     !Number.isInteger(r.winningModelPixels)||r.winningModelPixels<0||
     !Number.isInteger(r.trustedMaskPixels)||r.trustedMaskPixels<0||
     r.trustedMaskPixels>r.winningModelPixels||typeof r.emitted!=='boolean')
   throw Error('Malformed semantic model diagnostics');
  regions.set(r.id,r);
 }
 if([...REGION.keys()].some(id=>!regions.has(id))||
    !Array.isArray(scene.proposals)||scene.proposals.length>20)
   throw Error('Missing real-model classes or proposals');
 const proposals=scene.proposals.map((p,i)=>{
  if(!Object.hasOwn(TYPE,p?.itemType)||!Number.isFinite(p.confidence)||
     p.confidence<0||p.confidence>1||!Number.isInteger(p.pixelArea)||
     p.pixelArea<=0)throw Error('Invalid unapproved instance model proposal');
  const [semanticId,category]=TYPE[p.itemType],other=regions.get(semanticId);
  // A broad upper-garment segmentation label cannot distinguish blazer from
  // shirt; emitted:true does not mean the exact subtype was recognized.
  const modelMissing=other.winningModelPixels===0;
  const untrusted=other.trustedMaskPixels===0;
  return {proposalOrdinal:i+1,proposedType:p.itemType,proposedCategory:category,
    instanceModelConfidence:p.confidence,instanceModelPixelArea:p.pixelArea,
    semanticRegion:REGION.get(semanticId),semanticClassId:semanticId,
    semanticWinningPixels:other.winningModelPixels,
    semanticTrustedPixels:other.trustedMaskPixels,
    semanticRegionEmitted:other.emitted,
    evidenceRelation:modelMissing?'semantic-class-not-predicted':
      untrusted?'semantic-class-no-trusted-pixels':
      other.emitted?'broad-semantic-region-emitted-not-instance-verified':
      'semantic-region-suppressed',
    priority:modelMissing?'inspect-source-for-model-disagreement':
      !other.emitted?'inspect-uncertain-or-suppressed-region':
      'inspect-model-instance-identity',
    reliableInstanceConfidenceEstablished:false,
    canAutoSave:false,needsIndependentFullSceneReview:true};
 });
 const semanticOnly=[...REGION].filter(([id])=>regions.get(id).emitted&&
    !proposals.some(p=>p.semanticClassId===id)).map(([id,label])=>({
    semanticClassId:id,semanticRegion:label,
    instanceModelHasClass:id!==9,
    modelAbsenceProvesGarmentAbsent:false,
    semanticGroupDoesNotProveOnePhysicalItem:true,
    note:id===9?'DeepFashion model cannot detect shoes':'Different model taxonomy or threshold; inspect original'
 }));
 return {
  schemaVersion:1,sourceId:flow.sourceId,sourceSha256:flow.sourceSha256,
  evidenceType:'cross-model-original-source-diagnostic-not-ground-truth',
  semanticModel:'Xenova/segformer_b0_clothes',
  instanceModel:deep.model||'pinned-deepfashion-instance',
  deepFashionProposals:proposals,
  semanticOnlyGroups:semanticOnly,
  sourcePhotosMatch:true,modelWeightsHashVerified:true,
  semanticPixelAccuracy:null,instancePixelAccuracy:null,
  actualPhysicalGarmentCount:null,categoryCorrectRecall:null,
  independentlyReviewedSourceMasks:0,
  wardrobeItemsAutoSavedByAudit:0,
  authorizedForCustomerAutoIndex:false,productionReady:false,
  warning:'Different model predictions can disagree or share errors. This report never verifies one proposal equals one clothing item; human-reviewed outlines and source comparisons are still required.'
 };
}
