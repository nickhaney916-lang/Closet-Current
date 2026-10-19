// Experimental comparison of TWO independently executed models on locked,
// licensed source photos. No reviewed masks => no accuracy, no garment count.
// Semantic outputs are class components, not complete garment instances.
const SHA=/^[0-9a-f]{64}$/;
const SUPPORTED=new Set(['short_sleeve_top','long_sleeve_top','short_sleeve_outwear',
 'long_sleeve_outwear','vest','sling','shorts','trousers','skirt',
 'short_sleeve_dress','long_sleeve_dress','vest_dress','sling_dress']);
export function compareObservedOutfitSuite(deep,semantic){
 if(deep?.status!=='complete'||!deep.modelHashVerified||!deep.sourceHashesVerified||
    deep.automaticItemsCreated!==0||deep.independentReferencesAvailable!==false||
    semantic?.status!=='complete'||!semantic.originalSourcePreserved||
    semantic.independentInstanceMasksAvailable!==false||
    semantic.manualReferenceMasksAvailable!==false||
    semantic.physicalInstancesMeasured!==false||
    semantic.productionAuthorized!==false||
    !Array.isArray(deep.cases)||!Array.isArray(semantic.cases))
  throw Error('Untrusted research-only suite provenance');
 const seen=new Set();
 const sourceMap=new Map();
 for(const row of deep.cases){
  if(!row?.id||seen.has(row.id)||!SHA.test(row.sourceSha256||'')||
     !Array.isArray(row.proposals)||row.proposals.some(p=>
       !SUPPORTED.has(p?.itemType)||!Number.isFinite(p.confidence)||
       p.confidence<0||p.confidence>1))
    throw Error('Invalid DeepFashion source or prediction');
  seen.add(row.id);sourceMap.set(row.id,row);
 }
 const matches=[];
 for(const scene of semantic.cases){
  const other=sourceMap.get(scene?.id);
  if(!other)continue;
  if(other.sourceSha256!==scene.sourceSha256||!SHA.test(scene.sourceSha256||'')||
     !Array.isArray(scene.semanticComponents)||
     typeof scene.personDetected!=='boolean'||
     !scene.dressCompetition||
     scene.originalPreserved!==true||scene.autoCreatedItems!==0)
    throw Error('Sources differ or semantic case is incomplete');
  const classes=new Map();
  for(const c of scene.semanticComponents){
   if(![4,5,6,7,9].includes(c.classId)||classes.has(c.classId)||
      !Number.isInteger(c.regions)||c.regions<0)
     throw Error('Malformed semantic component counts');
   classes.set(c.classId,c.regions);
  }
  for(const cls of [4,5,6,7,9])if(!classes.has(cls))
   throw Error('Missing semantic class evidence');
  // Model-backed type names are signals to INVESTIGATE, not established
  // physical garments, and are not matched across separate mask taxonomies.
  const instanceTypes=[...new Set(other.proposals.map(p=>p.itemType))];
  const differentRegionHints=instanceTypes.filter(type=>{
   const id=type==='skirt'?5:type==='shorts'||type==='trousers'?6:
     type.includes('dress')?7:4;
   return classes.get(id)===0;
  });
  matches.push({
   id:scene.id,sourceSha256:scene.sourceSha256,
   sourceDescriptionNotGroundTruth:true,
   semanticPersonGatePassed:scene.personDetected,
   semanticDetectedClassComponents:Object.fromEntries(classes),
   instanceModelUnapprovedProposalTypes:instanceTypes,
   modelDisagreementTypes:differentRegionHints,
   semanticDressVsLayersAmbiguity:scene.dressCompetition.mixedClassReviewCandidate===true,
   flatLayOrNonPersonRoutingRisk:!scene.personDetected&&
       [...classes.values()].some(n=>n>0),
   physicalGarmentCount:null,matchedInstanceIoU:null,
   possibleMissedItemsNeedIndependentReview:true,
   customerClothingItemsCreated:0
  });
 }
 return {schemaVersion:1,status:'same-source-experimental-model-review-only',
  sharedSources:matches.length,sourceRows:matches,
  physicalGarmentRecall:null,categoryAccuracy:null,pixelIoU:null,
  independentHumanOutlinesComplete:false,canPromoteModel:false,
  autoSavedCustomerItems:0,originalPhotosModified:false,
  note:'Class components, model types and source descriptions cannot establish separate physical garments. Independent complete inventories and reviewed outlines are still required.'};
}
