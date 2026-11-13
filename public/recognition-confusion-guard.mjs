/**
 * Closet Current MISSION 1 — prevent unsupported high-confidence subtype
 * AUTO-indexing in confusion classes demonstrated on real source photos.
 *
 * Same-weight original-photo model framings FAILED in the A/B trial: they
 * blocked one correctly classified boot and zero incorrect autosaves.
 * Therefore same-model voting is NOT accepted as independent evidence.
 *
 * Research-only, fail-closed owner subtype review, no photo-id exceptions.
 * Further automatic behavior must wait for new, unseen, independently
 * human-adjudicated photo acceptance—not tuning against exposed holdouts.
 */

// These four source-independent predicted subtypes were observed to cause
// confirmed errors on the earlier, NOW EXPOSED 59-public-photo research set.
// The correct broad category is preserved. Category/garment type uncertainty
// is made explicit to the owner and no provisional auto-save is permitted.
const manualSubtypeReview=Object.freeze(new Set([
 'Tops:Sweatshirt',
 'Tops:Tunic',
 'Outerwear:Blazer',
 'Shoes:Ankle boots'
]));

function requireOwnerSubtypeReview(result){
 const first=result.choices?.[0],category=first.category;
 return {
  strong:false,categoryConfirmed:true,categoryOnly:true,
  choices:[{
   label:category,category,itemType:'Unknown',score:first.score,
   sleeveLength:['Bottoms','Shoes','Accessories'].includes(category)?
    'Not applicable':'Unknown'
  }],
  details:{},reason:'type_uncertain',
  diagnostics:{
   ...result.diagnostics,
   mission1SubtypeSafety:{
    required:true,automaticallyCertified:false,
    reason:'high_confidence_subtype_confusion_requires_owner',
    sourceFramesCompared:0,
    independentHumanReviewCompleted:false,
    ownerSubtypeReviewRequired:true,
    categoryPreserved:true
   }
  }
 };
}

export async function corroborateAmbiguousType(result){
 if(!result?.strong||!Array.isArray(result.choices)||!result.choices.length)return result;
 const first=result.choices[0];
 if(!manualSubtypeReview.has(first.category+':'+first.itemType))return result;
 return requireOwnerSubtypeReview(result);
}
