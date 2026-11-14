/**
 * MAIN1054 M40 — source-specific P89 photograph-to-3D quality gap in the
 * actual M39 signed-owner 2D-only native viewer, research and read-only.
 *
 * Genuine P89 public JPEG research NEVER becomes permission to display a
 * private/owner garment on a 163-bone body. Every successful preflight is
 * deliberately a 2D-only quality BLOCKER, not a producer of 3D grants.
 *
 * The known digests are pinned from P89 original licensed public source
 * research, NOT copied donor geometry, human quality assessments or P89's
 * detached research branch. Read original source bytes with the existing
 * NATIVE92 WebCrypto guard; caller strings/booleans cannot grant readiness.
 */
import {auditNativeOwnerViewer38} from '../main1054-handoff38/strict-viewer-admission.mjs';
import {
 validateNative3D05Selection,requireCurrentNative3D05Selection88,
 captureNative3D05Sources91,requireNative3D05WardrobeRevision93,
 requireNative3D05Visible102
} from '../native-3d-05/native-preview-bridge.mjs';
const entries=[
 ['commons-0001','d20d66d4173f56c47e35540f081ecdfcee6e019df665ee245d967d126e117684','top','Tops','CC BY-SA 3.0'],
 ['commons-0003','cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64','top','Tops','CC BY-SA 3.0'],
 ['commons-0016','e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24','top','Tops','CC0'],
 ['commons-0023','5be4cb0d7017987d8625caf53ac979f0c78245617dc5828aec5f77ae8f4ea8ef','bottom','Bottoms','CC BY-SA 3.0'],
 ['commons-0041','0e4d278fe02d2e527a5b73a08407dda8a57e5597260dc08461bc83e720cf2278','bottom','Bottoms','CC BY 4.0'],
 ['commons-0043','c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344','bottom','Bottoms','CC0'],
 ['commons-0053','e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019','top','Dresses','CC BY 4.0']
];
const registry=new Map(entries.map(([sourceId,digest,slot,category,license])=>
 [digest,Object.freeze({sourceId,slot,category,license})]));
const problems=Object.freeze([
 'MASK_HUMAN_REVIEW_MISSING',
 'INDEPENDENT_PHOTO_FIDELITY_REVIEW_MISSING',
 'ACTUAL_PRIVATE_OWNER_MESH_ADMISSION_MISSING',
 'COMPLETE_BODY_AND_LAYER_CONTACT_UNPROVEN',
 'UNOBSERVED_REAR_AND_PHYSICAL_FABRIC_BEHAVIOR',
 'PHYSICAL_PHONE_AND_HOSTED_ACCOUNT_ACCEPTANCE_MISSING'
]);
const statusSchema='MAIN1054_M40_P89_public_photo_and_owner_source_quality_hold/v1';
function answer(status,matched=0,unmatched=0,detail=[],blockedAt='NONE'){
 return Object.freeze({
  schema:statusSchema,status,
  // Only a fixed, source-free lifecycle checkpoint. Never an exception,
  // owner ID, photo SHA, private category, slot or actual record content.
  blockedAt:status==='SIGNED_OWNER_OR_ORIGINAL_PHOTO_RECHECK_REQUIRED'?blockedAt:'NONE',
  originalPhoto2DRequired:true,originalPhoto2DFallbackRetained:true,
  consumer3DAdmitted:false,releaseAuthorized:false,
  privateOwnerPhotograph3DAuthorized:false,
  independentlyReviewed:false,actualPhotoRealismAccepted:false,
  physicalDeviceVerified:false,realHostedOwnerVerified:false,
  matchedPublicPhotoSources:matched,unmatchedPrivateSources:unmatched,
  // Only fixed public labels; never private item IDs, original photo bytes,
  // source digests, signed auth objects or source-specific private metadata.
  publicResearchLabels:Object.freeze(detail),
  missingQualityEvidence:status==='P89_PUBLIC_SOURCE_ALIGNED_BUT_3D_QUALITY_HOLD'?
   problems:Object.freeze([]),
  nextAction:'Keep the actual original-photo outfit visible; human and hardware quality gates are not signed.',
  familyAlpha:'HOLD'
 });
}
export async function assessNative3DQuality40({
 ownerScope,consumer,originalNativeAuth,win,doc
}={}){
 let stage='OWNER_PROVIDER_REQUIRED';
 try{
  if(!ownerScope||!consumer||typeof consumer.attestOriginalPhotoBytes92!=='function')
   throw Error('missing-trusted-private-source');
  stage='M38_PRIVATE_OWNER_PREFLIGHT';
  const owner=auditNativeOwnerViewer38({
   ownerScope,consumer,originalNativeAuth,win,doc
  });
  const receipt=await owner;
  if(receipt.status!=='OWNER_ORIGINAL_2D_VIEWER_FALLBACK_ONLY'||
     receipt.consumer3D!==false||
     receipt.ownerPhotoRenderAuthorized!==false||
     receipt.real3DQualityApproved!==false||
     receipt.releaseAuthorized!==false)
   throw Error('owner-private-original-photo-not-verified');
  stage='P90_CURRENT_SAVED_SELECTION';
  requireNative3D05Visible102({doc});
  const selectedIndex=consumer.selected;
  const admitted=validateNative3D05Selection({
   consumer,originalNativeAuth,win,doc
  });
  stage='P90_SOURCE_METADATA';
  const before=captureNative3D05Sources91({consumer,admitted});
  const revision=requireNative3D05WardrobeRevision93({
   consumer,ownerId:admitted.ownerId
  });
  stage='NATIVE92_ORIGINAL_JPEG_BYTES';
  const current=await consumer.attestOriginalPhotoBytes92(
   Object.values(admitted.slots));
  stage='P90_RECHECK_AFTER_ASYNC';
  requireCurrentNative3D05Selection88({
   consumer,originalNativeAuth,win,doc,admitted,selectedIndex
  });
  stage='SOURCE_RECEIPT_EQUALITY';
  if(JSON.stringify(current)!==JSON.stringify(before))
   throw Error('private-original-jpeg-changed');
  stage='P90_ROSTER_AND_VISIBILITY_RECHECK';
  captureNative3D05Sources91({consumer,admitted,expected:before});
  requireNative3D05WardrobeRevision93({
   consumer,ownerId:admitted.ownerId,expected:revision
  });
  requireNative3D05Visible102({doc});
  if(ownerScope.getSession()?.authRef!==originalNativeAuth)
   throw Error('signed-owner-changed');
  stage='P89_PUBLIC_SOURCE_CROSSWALK';
  const raw=current.sources;
  if(!Array.isArray(raw)||raw.length<1||raw.length>9)
   throw Error('no-saved-original-sources');
  let matched=0,unmatched=0;
  const labels=[];
  for(const item of raw){
   const source=registry.get(item.sha256);
   // Public original registry does not prove model-reconstructed geometry,
   // correspondence to an owner's scene or a human-accepted garment.
   const savedSlot=Object.entries(admitted.slots).find(([,id])=>id===item.id)?.[0];
   if(!source||!savedSlot||source.slot!==savedSlot||
      item.category!==source.category){
    unmatched++;continue;
   }
   matched++;labels.push(source.sourceId);
  }
  if(unmatched>0)
   return answer('UNREGISTERED_OR_CATEGORY_MISMATCHED_ORIGINAL_2D_ONLY',
    matched,unmatched,[...new Set(labels)].sort());
  return answer('P89_PUBLIC_SOURCE_ALIGNED_BUT_3D_QUALITY_HOLD',
   matched,0,[...new Set(labels)].sort());
 }catch{
  return answer('SIGNED_OWNER_OR_ORIGINAL_PHOTO_RECHECK_REQUIRED',0,0,[],stage);
 }
}
