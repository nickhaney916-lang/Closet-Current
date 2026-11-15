/**
 * MAIN1054 M55 — exact P88 research worker → private MULTI24 review adapter.
 *
 * This is ONLY a source/lease-bound proposal adapter. The worker's mask digest
 * is a worker CLAIM, not an independently rehashed mask or garment proof.
 * No default worker is replaced, and no proposal is owner-approved or saved.
 */
import {verifyStoredCanonical} from '../capture-proof-01/source-proof.mjs';
import {intakeProposal58,MAX_WORKER_PROPOSALS58} from '../multi-garment-capture-01/detection-intake-58.mjs';

const SHA55=/^[0-9a-f]{64}$/;
const REQUEST55=/^[0-9a-f-]{8,80}$/i;
const fail=reason=>{throw Error('MAIN55 '+reason);};

/**
 * proof is the immutable canonical ORIGINAL JPEG, never a downsampled
 * analysis image. All live callbacks are mandatory and are rechecked on
 * EVERY event, not only when this adapter is created.
 */
export async function openP88SourceIntake55({
 proof,ownerId,requestId,reviewEpoch,
 getOwner,getSourceSHA256,getReviewEpoch,getActiveRequestId,getDbName
}={}){
 if(typeof ownerId!=='string'||!ownerId||typeof requestId!=='string'||
    !REQUEST55.test(requestId)||!Number.isSafeInteger(reviewEpoch)||
    [getOwner,getSourceSHA256,getReviewEpoch,getActiveRequestId,getDbName]
     .some(fn=>typeof fn!=='function'))fail('invalid owner or session lease');
 if(!SHA55.test(proof?.sourceSHA256||'')||
    !await verifyStoredCanonical(proof))fail('unverified original JPEG');
 // P88's research worker rejects image strings over 12M characters and
 // 3072px originals. Refuse instead of silently changing original bytes.
 if(proof.image.length>12_000_000||
    (Number.isFinite(proof.originalPhoto?.width)&&proof.originalPhoto.width>3072)||
    (Number.isFinite(proof.originalPhoto?.height)&&proof.originalPhoto.height>3072))
  fail('P88 original exceeds its native worker budget');
 const sourceSHA256=proof.sourceSHA256;
 let closed=false,received=0;
 const usedMasks=new Set();
 const live=()=>!closed&&getOwner()===ownerId&&
   getSourceSHA256()===sourceSHA256&&getReviewEpoch()===reviewEpoch&&
   getActiveRequestId()===requestId&&
   getDbName()==='closet-current-user-'+ownerId;
 if(!live())fail('stale source or owner lease');
 function close(){closed=true;usedMasks.clear();}
 function workerRequest(){
  if(!live())fail('stale source or owner lease');
  // Only the original JPEG is used by the P88 worker. No owner ID, cloud
  // access, external URL, photos in a debug receipt, or inferred authority.
  return {id:requestId,image:proof.image,instanceReview70:true,
   instanceReview840:true};
 }
 function intake(message,pieces=[]){
  if(!live()){close();return {accepted:false,reason:'stale-source-or-owner-lease'};}
  if(message?.type!=='piece'||message.id!==requestId)
   return {accepted:false,reason:'wrong-worker-session'};
  received++;
  if(received>MAX_WORKER_PROPOSALS58)
   return {accepted:false,reason:'worker-message-budget'};
  const raw=message.piece,receipt=raw?.reconciliation70;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
     !receipt||typeof receipt!=='object'||Array.isArray(receipt)||
     receipt.sourceSha256!==sourceSHA256||
     !SHA55.test(receipt.maskSha256||'')||
     receipt.instanceOrdinal!==received-1||
     typeof raw.instanceMethod!=='string'||
     receipt.method!==raw.instanceMethod||
     typeof raw.hint!=='object'||raw.hint===null||Array.isArray(raw.hint))
   return {accepted:false,reason:'invalid-P88-source-mask-receipt'};
  // Full mask SHA, not truncated and not an owner-controlled box/label.
  // Same mask with a forged second ordinal cannot become another garment.
  const instanceKey='seg-'+receipt.maskSha256;
  if(usedMasks.has(receipt.maskSha256))
   return {accepted:false,reason:'duplicate-source-mask'};
  const candidate={
   instanceKey,cropBounds:raw.cropBounds,hint:raw.hint,
   instanceMethod:raw.instanceMethod,
   // P88 does not send a verified personDetected bit. Do not invent one.
   personDetected:false,colorEstimate:raw.colorEstimate
  };
  const result=intakeProposal58(candidate,pieces,received);
  if(result.accepted)usedMasks.add(receipt.maskSha256);
  return result;
 }
 return Object.freeze({workerRequest,intake,close});
}
