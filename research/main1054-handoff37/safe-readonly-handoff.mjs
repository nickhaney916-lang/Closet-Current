/**
 * MAIN1054 M37: read-only safety boundary for independently researched
 * recognition proposals, public garment source receipts and avatar viewer.
 *
 * Uses the real M34 private owner/PHOTO119 source + entire-roster admission.
 * Does not persist outfits, return photo bytes, grant 3D, or authenticate
 * public research fixtures as someone's private garment.
 * A successful result is only an ephemeral preflight: the displaying
 * application must recheck its own authoritative owner/source lease.
 */
import {createNativeOutfitPicker33} from '../main1054-picker33/native-picker-bridge.mjs';
const SLOTS=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const fail=reason=>{throw Error('MAIN1054_M37 '+reason);};
const safeField=x=>typeof x==='string'&&x.length>0&&x.length<=200&&x.trim()===x;
const denies3D=x=>x&&typeof x==='object'&&
  ['consumer3D','consumer3DAdmitted','research3DReady','safeToRenderPhotorealistic3D',
   'releaseAuthorized','autoSave','ownerApproved','independentlyReviewed']
   .some(k=>x[k]===true);
function blocked(){
 return Object.freeze({schema:'MAIN1054_M37_source-bound-research-handoff-v1',
  status:'BLOCKED_RECHECK_OWNER_OR_SOURCE',sourceVerifiedAtPreflight:false,
  originalPhoto2DPreflight:false,consumer3D:false,releaseAuthorized:false,
  displayApproved:false,mustRevalidateAtDisplay:true,familyAlpha:'HOLD'});
}
export async function auditReadOnlyHandoff37({
 getSession,getRevision,readOwnerItems,getBoard,cryptoProvider=globalThis.crypto,
 recognitionResearch=null,garmentResearch=null,viewerResearch=null
}={}){
 let picker,proof;
 try{
  if([getSession,getRevision,readOwnerItems,getBoard].some(f=>typeof f!=='function'))
   fail('trusted-provider-required');
  // A disconnected semantic component is a proposal, not an owner-approved
  // garment unit. A public source receipt is not an authenticated private
  // wardrobe receipt. Neither is permission for the camera/viewer to save
  // or display a mesh as a photographically reconstructed owner item.
  for(const candidate of [recognitionResearch,garmentResearch,viewerResearch]){
   if(candidate!==null&&(typeof candidate!=='object'||Array.isArray(candidate)))
    fail('research-shape-invalid');
   if(denies3D(candidate))fail('research-cannot-grant-3d-or-owner-approval');
  }
  if(recognitionResearch!==null&&recognitionResearch.requiresReview!==true)
   fail('recognition-proposal-must-remain-review-required');
  if(garmentResearch!==null&&garmentResearch.familyAlpha!=='HOLD')
   fail('public-research-must-remain-on-hold');

  const board=getBoard();
  const slots=board?.slots;
  if(!slots||typeof slots!=='object'||Array.isArray(slots))
   fail('actual-board-required');
  const selected=Object.entries(slots);
  if(selected.length===0||selected.length>SLOTS.size||
     selected.some(([slot,id])=>!SLOTS.has(slot)||!safeField(id))||
     new Set(selected.map(([,id])=>id)).size!==selected.length)
   fail('invalid-native-outfit-slots');

  picker=createNativeOutfitPicker33({
   getSession,getRevision,readOwnerItems,getBoard,cryptoProvider,durableRoster34:true
  });
  // Underlying M31/P87/M32/M33/M34 validates: actual signed owner/auth/IDB,
  // original JPEG bytes/digest, explicit owner confirmation, reviewed fields,
  // source/category/slot compatibility, entire private wardrobe contents.
  proof=await picker.prepareWrite(board);
  if(proof.consumer3D!==false||proof.releaseAuthorized!==false||
     proof.durableContentChecked!==true||
     !Array.isArray(proof.itemIds)||proof.itemIds.length!==selected.length)
   fail('incomplete-private-owner-preflight');
  proof.assertCurrent();
  const session=getSession();
  if(!session||session.authenticated!==true||
     session.authRef?.user?.id!==session.ownerId)fail('signed-owner-unavailable');
  const rows=await readOwnerItems(Object.freeze({...session,
   assertCurrent:()=>proof.assertCurrent()}));
  proof.assertCurrent();
  if(!Array.isArray(rows)||!proof.matchesRoster(rows))
   fail('private-roster-changed');
  for(const [,id] of selected){
   const matching=rows.filter(row=>row?.id===id);
   if(matching.length!==1||!proof.matches(id,matching[0]))
    fail('private-item-changed');
  }
  proof.consume();
  return Object.freeze({
   schema:'MAIN1054_M37_source-bound-research-handoff-v1',
   status:'OWNER_ORIGINAL_2D_PREFLIGHT_ONLY',
   slotCount:selected.length,
   sourceVerifiedAtPreflight:true,
   ownerConfirmedAtPreflight:true,
   privateRosterCASInspected:true,
   recognitionProposalGrantedSave:false,
   publicPhotoResearchGranted3D:false,
   viewer3DRequested:viewerResearch?.requestedMode==='3d',
   originalPhoto2DPreflight:true,
   consumer3D:false,
   releaseAuthorized:false,
   displayApproved:false,
   mustRevalidateAtDisplay:true,
   familyAlpha:'HOLD'
  });
 }catch{
  return blocked();
 }finally{
  // Do not retain signed session, private DB handles or original image rows
  // after the ephemeral proof. Never return a live renderer authorization.
  try{picker?.dispose();}catch{}
 }
}
