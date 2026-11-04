/**
 * MULTI-REVIEW-TRIAGE-28 — rank unverified local SegFormer crops for review.
 * The frozen prior research #575 recorded 10 correct boxes / 61 proposals.
 * This ranking is retrospective EXPLORATORY; NOT calibrated probability,
 * validated new-photo precision, garment recognition, 3D readiness, or
 * permission to auto-save. No proposal is removed or silently confirmed.
 */
export const TRIAGE28_MIN_CONFIDENCE=0.925;
export const TRIAGE28_MIN_RELATIVE_BOX_AREA=0.08;

const validBox=box=>{
 if(!box||!['x','y','width','height'].every(k=>Number.isFinite(box[k])))return false;
 const {x,y,width,height}=box;
 return x>=0&&y>=0&&width>0&&height>0&&
  x+width<=1.00000001&&y+height<=1.00000001;
};
export function reviewTier28(piece){
 if(piece?.manual===true)return 'manual';
 if(!piece||!validBox(piece.cropBounds))return 'additional';
 const confidence=piece.hint?.confidence;
 if(typeof confidence!=='number'||!Number.isFinite(confidence)||
    confidence<TRIAGE28_MIN_CONFIDENCE||confidence>1||
    piece.cropBounds.width*piece.cropBounds.height<TRIAGE28_MIN_RELATIVE_BOX_AREA)
  return 'additional';
 return 'priority';
}
/** Stable ordering, no mutation or removal of user-reviewed edits/crops. */
export function organizeReview28(pieces){
 if(!Array.isArray(pieces))throw Error('MULTI-REVIEW-28 requires review proposals array');
 const tiers={priority:[],manual:[],additional:[]};
 for(const piece of pieces)tiers[reviewTier28(piece)].push(piece);
 return {...tiers,ordered:[...tiers.priority,...tiers.manual,...tiers.additional],
  total:pieces.length};
}
/** For frozen SegFormer score manifests: do not mistake a model score for accuracy. */
export function rankFrozenProposal28(proposal){
 return reviewTier28({cropBounds:proposal?.box,hint:{confidence:proposal?.confidence}});
}
