/**
 * MAIN1054 M38 — owner-private source-safe M37 handoff to actual P90
 * native viewer selection. Read-only, never a consumer 3D grant.
 *
 * The P90 viewer exists on the combined isolated research branch; its
 * original 163-bone controls remain usable under the separate P90 research
 * mode. An explicit main38=research mode must refuse unreviewed 3D,
 * including a successful private owner-photo original-2D preflight.
 */
import {auditReadOnlyHandoff37} from '../main1054-handoff37/safe-readonly-handoff.mjs';
import {
 validateNative3D05Selection,requireCurrentNative3D05Selection88,
 captureNative3D05Sources91,requireNative3D05WardrobeRevision93,
 requireNative3D05Visible102
} from '../native-3d-05/native-preview-bridge.mjs';

const schema='MAIN1054_M38_pinned-P90-owner-source-research-gate-v1';
const keys=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const noGrant=(kind)=>Object.freeze({schema,status:kind,
  originalPhoto2DFallbackRetained:true,consumer3D:false,
  ownerPhotoRenderAuthorized:false,real3DQualityApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  requiresNewDisplayTimeProof:true});
const equalSlots=(a,b)=>{
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||
    Array.isArray(a)||Array.isArray(b))return false;
 const x=Object.entries(a),y=Object.entries(b);
 return x.length===y.length&&x.length>0&&
  x.every(([k,v])=>keys.has(k)&&typeof v==='string'&&
   v.length>0&&b[k]===v);
};
/**
 * ownerScope is a TRUSTED native caller's M34 original-owner/private DB
 * provider set, not any user-editable window object or public 3D receipt.
 * Every result is deliberately incapable of granting 3D even if forged.
 * Returns no JPEG bytes, owner tokens, account IDs, outfit IDs or hashes.
 */
export async function auditNativeOwnerViewer38({
 ownerScope,consumer,originalNativeAuth,win,doc,
 recognitionResearch=null,garmentResearch=null
}={}){
 try{
  if(!ownerScope||
     ['getSession','getRevision','readOwnerItems','getBoard'].some(
      k=>typeof ownerScope[k]!=='function'))
   throw Error('provider-missing');
  requireNative3D05Visible102({doc});
  const session=ownerScope.getSession();
  if(!session||session.authenticated!==true||
     session.authRef!==originalNativeAuth||
     session.ownerId!==originalNativeAuth?.user?.id)
   throw Error('private-auth-object-not-shared');
  const selectedIndex=consumer?.selected;
  const selected=validateNative3D05Selection({
   consumer,originalNativeAuth,win,doc
  });
  if(!equalSlots(ownerScope.getBoard()?.slots,selected.slots))
   throw Error('active-board-not-saved-viewer-slots');
  const sources=captureNative3D05Sources91({consumer,admitted:selected});
  // P90/NATIVE92 must independently re-hash actual original JPEG bytes.
  // Merely matching the display metadata is not source custody.
  if(typeof consumer?.attestOriginalPhotoBytes92!=='function')
   throw Error('missing-native-original-byte-attestation');
  const attested=await consumer.attestOriginalPhotoBytes92(
   Object.values(selected.slots));
  requireCurrentNative3D05Selection88({
   consumer,originalNativeAuth,win,doc,admitted:selected,selectedIndex
  });
  if(JSON.stringify(attested)!==JSON.stringify(sources))
   throw Error('photo-bytes-do-not-match-p90-source');
  const revision=requireNative3D05WardrobeRevision93({
   consumer,ownerId:selected.ownerId
  });
  const verified=await auditReadOnlyHandoff37({
   ...ownerScope,recognitionResearch,garmentResearch,
   viewerResearch:{requestedMode:'3d',context:'parallel90-strict-handoff'}
  });
  if(verified.status!=='OWNER_ORIGINAL_2D_PREFLIGHT_ONLY'||
     verified.consumer3D!==false||verified.displayApproved!==false||
     verified.slotCount!==Object.keys(selected.slots).length)
   throw Error('owner-original-source-missing');
  // The P90 owner/view state, photographic source fingerprint, and wardrobe
  // revision must still be identical after M37's multiple async DB reads.
  requireNative3D05Visible102({doc});
  requireCurrentNative3D05Selection88({
   consumer,originalNativeAuth,win,doc,admitted:selected,selectedIndex
  });
  captureNative3D05Sources91({consumer,admitted:selected,expected:sources});
  requireNative3D05WardrobeRevision93({
   consumer,ownerId:selected.ownerId,expected:revision
  });
  if(!equalSlots(ownerScope.getBoard()?.slots,selected.slots)||
     ownerScope.getSession()?.authRef!==originalNativeAuth)
   throw Error('owner-board-replaced');
  // This is a preflight observation, NOT a live display grant. The actual
  // existing original-photo 2D board remains the only allowed view.
  return noGrant('OWNER_ORIGINAL_2D_VIEWER_FALLBACK_ONLY');
 }catch{
  return noGrant('BLOCKED_OWNER_OR_SOURCE_RECHECK');
 }
}
