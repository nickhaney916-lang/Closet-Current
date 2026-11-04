/**
 * AUTO-SEGMENTATION-ACCURACY-33 — isolated original-pixel contrast rescue.
 *
 * This is NOT an improved semantic SegFormer classification or a separated
 * garment instance. A contrast rectangle is ONLY an unclassified, unsaved
 * suggestion for manual review. Never infer clothing, type, color, 3D fit.
 */
import {flatlayContrastBoxes29} from '../multi-garment-capture-01/flatlay-contrast-29.mjs';

function validBox(b) {
 return b && [b.x,b.y,b.width,b.height].every(Number.isFinite) &&
  b.x>=0&&b.y>=0&&b.width>0&&b.height>0 &&
  b.x+b.width<=1.00000001&&b.y+b.height<=1.00000001;
}
export function boxIoU33(a,b) {
 if(!validBox(a)||!validBox(b))throw Error('Invalid original-normalized box');
 const w=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
 const h=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const intersection=w*h;
 return intersection/(a.width*a.height+b.width*b.height-intersection);
}
export function proposeUnclassifiedContrast33({photo,existing=[],sourceProof,limit=12}={}) {
 const proof=sourceProof||{};
 if(proof.sourceHashVerified!==true||
  !/^[0-9a-f]{64}$/.test(proof.sourceSHA256||'')||
  proof.originalPhoto?.sha256!==proof.sourceSHA256)
  throw Error('Original source proof required before analysis');
 if(!Array.isArray(existing)||!existing.every(x=>validBox(x.crop||x.box)))
  throw Error('Existing source-mapped boxes required');
 const detected=flatlayContrastBoxes29(photo,{limit});
 if(!detected.eligible)return {eligible:false,reason:detected.reason,proposals:[],
  sourceSHA256:proof.sourceSHA256,semanticLabelsPredicted:0};
 const proposals=detected.boxes.filter(box=>
  !existing.some(e=>boxIoU33(box,e.crop||e.box)>.85))
  .map((box,i)=>({
    proposalId:'contrast-33-'+i,box,
    sourceSHA256:proof.sourceSHA256,
    label:'Unclassified review region',category:'Uncategorized',
    color:'',itemType:'Unknown',needsReview:true,
    cropReviewed:false,confirmed:false,automaticSaveAllowed:false,
    semanticClass:null,instanceSeparationClaimed:false
  }));
 return {eligible:true,reason:detected.reason,proposals,
  sourceSHA256:proof.sourceSHA256,semanticLabelsPredicted:0};
}
/** Class-agnostic localization only; NEVER a clothing classification score. */
export function scoreReviewLocalization33(expected,proposals,threshold=.5) {
 if(!Array.isArray(expected)||!Array.isArray(proposals)||
  !Number.isFinite(threshold)||threshold<=0||threshold>1)
  throw Error('Invalid localization evidence');
 const candidates=expected.map(e=>proposals
  .map((p,i)=>({i,iou:boxIoU33(e.box,p.box||p.crop)}))
  .filter(x=>x.iou>=threshold).sort((a,b)=>b.iou-a.iou||a.i-b.i));
 const owners=new Map();
 const assign=(at,seen)=>{
  for(const c of candidates[at]){
   if(seen.has(c.i))continue;
   seen.add(c.i);
   if(!owners.has(c.i)||assign(owners.get(c.i),seen)){owners.set(c.i,at);return true;}
  }
  return false;
 };
 expected.forEach((_,i)=>assign(i,new Set()));
 return {correctlyLocalized:owners.size,expectedCount:expected.length,
  proposalCount:proposals.length,falseProposals:proposals.length-owners.size,
  missed:expected.length-owners.size,semanticCategoryAccuracy:null,
  independentlyVerifiedPixelIoU:null};
}
