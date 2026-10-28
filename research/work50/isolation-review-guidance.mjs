/**
 * Source-bounded review guidance for local Work50 segmentation.
 * No measurements, labels, user input, paths, source IDs, photos or tokens
 * enter the advice result. This is NOT a confidence score or approval.
 */
const TIPS=Object.freeze({
 'all-edges':'Compare the whole cutout with the original; check for missing fabric.',
 'mannequin':'Look closely for mannequin parts, hangers and unwanted background.',
 'lighting':'Retake against an even, contrasting background if the cutout is unclear.',
 'pale':'Inspect light garments, white cuffs and background-colored fabric.',
 'straps':'Inspect thin straps, sleeve openings, cuffs and other narrow details.',
 'shoes':'Check whether the original truly shows two distinct shoes.',
 'boundary':'Check necklines, hems, sleeves and any unfinished edge.',
 'separation':'Look for extra disconnected pieces or missing garment pieces.',
 'crop':'A clipped or crowded photo may need to be retaken.',
 'other':'This isolation is unverified. Review the original and each garment edge.'
});
const REASONS=Object.freeze({
 'semantic-mannequin-hanger-and-fabric-review-required':'mannequin',
 'complex-or-clipped-background':'lighting',
 'pale-fabric-or-background-ambiguity':'pale',
 'pale-regions-preserved-for-review':'pale',
 'possible-separation-or-narrow-detail-loss':'straps',
 'unstable-low-contrast-boundary':'boundary',
 'source-clipped-or-border-contamination':'crop',
 'multiple-pieces-need-review':'separation',
 'excessive-removal-risk':'straps',
 'empty-or-background-dominant':'lighting',
 'shoe-pair-requires-explicit-confirmation':'shoes'
});
export const ISOLATION_TIP_TEXT=TIPS;
export function summarizeIsolationReview(raw){
 const confidence=raw?.confidence;
 const reasons=Array.isArray(confidence?.reasons)?confidence.reasons:[];
 const codes=['all-edges'];
 for(const reason of reasons){
  // Never copy strings from segmentation or user data into rendered advice.
  const code=Object.hasOwn(REASONS,reason)?REASONS[reason]:'other';
  if(!codes.includes(code)&&codes.length<4)codes.push(code);
 }
 if(!codes.includes('mannequin')&&codes.length<4)codes.push('mannequin');
 const info=Object.freeze({
  schema:'closet-alpha-64-isolation-review-v1',
  quality:'REVIEW',automaticApproval:false,requiresHumanReview:true,
  source:'heuristic-only',codes:Object.freeze(codes)
 });
 return info;
}
export function safeIsolationTips(advice){
 if(advice?.schema!=='closet-alpha-64-isolation-review-v1'||
    advice?.quality!=='REVIEW'||advice?.automaticApproval!==false||
    advice?.requiresHumanReview!==true||
    !Array.isArray(advice.codes)||advice.codes.length<1||advice.codes.length>4)
  return [TIPS.other];
 const out=[];
 for(const code of advice.codes){
  if(typeof code!=='string'||!Object.hasOwn(TIPS,code))return [TIPS.other];
  const tip=TIPS[code];if(!out.includes(tip))out.push(tip);
 }
 return out;
}
