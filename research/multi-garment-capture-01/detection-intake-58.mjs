/**
 * BOUNDED-DETECTION-REVIEW-58
 * Resource budget and data minimization for untrusted automatic worker proposals.
 * Does NOT infer an instance, improve segmentation, or authorize a saved item.
 */
import {validCrop24,sanitizeSegmentHint50} from './atomic-group.mjs';
export const MAX_AUTO_REGIONS58=12;
export const MAX_TOTAL_REGIONS58=24;
export const MAX_WORKER_PROPOSALS58=128;
const SEGMENT_KEY58=/^seg-[0-9-]{1,136}$/;
const colorValues58=new Set(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor']);

export function intakeProposal58(raw,pieces,received){
 if(!Array.isArray(pieces)||!Number.isSafeInteger(received)||received<1||received>MAX_WORKER_PROPOSALS58)
  return {accepted:false,reason:'worker-message-budget'};
 if(pieces.length>=MAX_TOTAL_REGIONS58||
    pieces.filter(p=>p?.manual===false).length>=MAX_AUTO_REGIONS58)
  return {accepted:false,reason:'review-region-budget'};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    typeof raw.instanceKey!=='string'||raw.instanceKey.length>140||
    !SEGMENT_KEY58.test(raw.instanceKey)||!validCrop24(raw.cropBounds)||
    pieces.some(p=>p.instanceKey===raw.instanceKey))
  return {accepted:false,reason:'invalid-or-duplicate-proposal'};
 const hint=sanitizeSegmentHint50(raw.hint);
 if(!hint?.categories?.length)return {accepted:false,reason:'no-supported-category'};
 // Only bounded, understood fields cross the untrusted model → UI boundary.
 // No arbitrary worker data, nested metadata, original JPEG or owner IDs.
 const color=raw.colorEstimate?.color;
 const safe={
  instanceKey:raw.instanceKey,
  cropBounds:{
   x:raw.cropBounds.x,y:raw.cropBounds.y,
   width:raw.cropBounds.width,height:raw.cropBounds.height
  },
  hint,
  personDetected:raw.personDetected===true,
  colorEstimate:{
   color:typeof color==='string'&&colorValues58.has(color)?color:''
  }
 };
 return {accepted:true,piece:safe};
}
