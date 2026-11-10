/**
 * Closet Current Mission 1 / P771: separately signed MULTI-garment ground truth.
 *
 * The old single-garment record had one photo-level category, type and color.
 * That cannot represent a real outfit containing (e.g.) a blue blouse AND
 * brown pants. Mixed photos must use per-instance source masks and labels.
 *
 * This module contains only scoring/consensus logic; trust of actual human
 * identity, signed receipt, model hash and original JPEG comes from P768/P770.
 * Synthetic CI fixtures are NEVER real independently human-labeled photos.
 */
import {supportedHumanGarment791} from '../mission1-human-truth-taxonomy-integrity-791/canonical-human-truth.mjs';
const GARMENT_CATEGORIES=new Set([
 'Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'
]);
const GARMENT_COLORS=new Set([
 'Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink',
 'Purple','Yellow','Orange','Multicolor'
]);
const error=why=>{throw Error('M1_MIXED_HUMAN_771: '+why)};
const validString=x=>typeof x==='string'&&x.trim().length>0;
const maxInstances=20;

export const MULTI_PHOTO_MARKER='Multiple';

function normalizeLabel(ins,decodeMask,pixelCount,allowUnknown=false){
 if(!ins||!validString(ins.instanceId)||!GARMENT_CATEGORIES.has(ins.category)||
    !supportedHumanGarment791(ins.category,ins.subtype)||
    !GARMENT_COLORS.has(ins.primaryColor))
  error('source-bound per-instance human category/subtype/color required');
 if(!Array.isArray(ins.rle)||typeof decodeMask!=='function')
  error('per-instance complete source-sized binary mask required');
 const mask=decodeMask(ins.rle,pixelCount);
 if(!(mask instanceof Uint8Array)||mask.length!==pixelCount||!mask.some(Boolean))
  error('source-size nonempty instance mask required');
 return {instanceId:ins.instanceId,category:ins.category,
  subtype:ins.subtype,primaryColor:ins.primaryColor,mask};
}
function overlap(a,b){
 if(a.length!==b.length)error('mask size mismatch');
 let intersection=0,union=0;
 for(let i=0;i<a.length;i++){
  if(a[i]&&b[i])intersection++;
  if(a[i]||b[i])union++;
 }
 return union?intersection/union:0;
}
function assignments(left,right,minimumIoU,compatible=()=>true){
 if(!Number.isFinite(minimumIoU)||minimumIoU<=0||minimumIoU>1||
    !Array.isArray(left)||!Array.isArray(right))
  error('invalid one-to-one overlap matching');
 const possible=left.map(a=>right.map((b,j)=>({
  j,score:compatible(a,b)?overlap(a.mask,b.mask):0
 })).filter(e=>e.score>=minimumIoU).sort((x,y)=>y.score-x.score||x.j-y.j));
 const owners=new Map();
 function augment(i,seen){
  for(const edge of possible[i]){
   if(seen.has(edge.j))continue;
   seen.add(edge.j);
   const previous=owners.get(edge.j);
   if(previous===undefined||augment(previous,seen)){
    owners.set(edge.j,i);return true;
   }
  }
  return false;
 }
 for(let i=0;i<left.length;i++)augment(i,new Set());
 return [...owners.entries()].map(([rightIndex,leftIndex])=>({
  leftIndex,rightIndex,overlap:overlap(left[leftIndex].mask,right[rightIndex].mask)
 })).sort((a,b)=>a.leftIndex-b.leftIndex);
}
export function normalizeMixedHumanLabel(label,decodeMask,pixelCount){
 if(!label||label.category!==MULTI_PHOTO_MARKER||
   label.subtype!==MULTI_PHOTO_MARKER||label.primaryColor!=='Multicolor'||
   !Number.isSafeInteger(pixelCount)||pixelCount<=0||
   !Array.isArray(label.instances)||
   label.instances.length<2||label.instances.length>maxInstances)
  error('mixed source requires 2–20 independently labeled garment instances and explicit aggregate marker');
 const rows=label.instances.map(x=>normalizeLabel(x,decodeMask,pixelCount));
 if(new Set(rows.map(x=>x.instanceId)).size!==rows.length)
  error('duplicate reviewer-local garment instance ID');
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  if(rows[i].category===rows[j].category&&overlap(rows[i].mask,rows[j].mask)>=.99)
   error('duplicate nearly identical same-category human masks');
 }
 return rows;
}
export function compareMixedHumanReviews(a,b,decodeMask,pixelCount,minimumIoU=.85){
 const left=normalizeMixedHumanLabel(a,decodeMask,pixelCount);
 const right=normalizeMixedHumanLabel(b,decodeMask,pixelCount);
 if(left.length!==right.length)return false;
 const matched=assignments(left,right,minimumIoU,(x,y)=>
  x.category===y.category&&x.subtype===y.subtype&&x.primaryColor===y.primaryColor);
 // Never require separately working blind reviewers to know each other's IDs
 // or to have registered their outfit pieces in the same order.
 return matched.length===left.length;
}
export function scoreMixedOutfitAgainstHuman(label,modelInstances,decodeMask,pixelCount){
 const truth=normalizeMixedHumanLabel(label,decodeMask,pixelCount);
 if(!Array.isArray(modelInstances)||modelInstances.length>maxInstances)
  error('model instance outputs must be a complete explicit array');
 const guessed=modelInstances.map((ins,index)=>{
  if(!ins||!GARMENT_CATEGORIES.has(ins.category)||
     !Array.isArray(ins.rle))
   error('model instance mask/category incomplete');
  const mask=decodeMask(ins.rle,pixelCount);
  if(!(mask instanceof Uint8Array)||mask.length!==pixelCount||!mask.some(Boolean))
   error('invalid real model source pixel instance mask');
  const subtype=ins.subtype??ins.type??null;
  if(subtype!==null&&!validString(subtype))
   error('model subtype malformed');
  const primaryColor=ins.primaryColor??null;
  if(primaryColor!==null&&!GARMENT_COLORS.has(primaryColor))
   error('model color malformed');
  if(ins.autoIndexed!=null&&typeof ins.autoIndexed!=='boolean')
   error('model per-instance auto-indexing malformed');
  return {index,category:ins.category,subtype,primaryColor,
   autoIndexed:ins.autoIndexed===true,mask};
 });
 // 1: Source geometry association counts all garment regions even if model
 // assigned the wrong category. Otherwise wrong category could quietly
 // disappear from the category classification denominator.
 const matches=assignments(truth,guessed,.5);
 let categoryCorrect=0,subtypeCorrect=0,colorCorrect=0,colorObserved=0,
  correctByCategoryIoU=0,autoIndexed=0,unsafeAutomatic=0;
 const matchedModel=new Set();
 for(const match of matches){
  const source=truth[match.leftIndex],p=guessed[match.rightIndex];
  matchedModel.add(match.rightIndex);
  const correctCategory=source.category===p.category;
  if(correctCategory){categoryCorrect++;correctByCategoryIoU++;}
  if(correctCategory&&source.subtype===p.subtype)subtypeCorrect++;
  if(p.primaryColor!==null){
   colorObserved++;
   if(correctCategory&&source.primaryColor===p.primaryColor)colorCorrect++;
  }
  if(p.autoIndexed){autoIndexed++;
   if(!(correctCategory&&source.subtype===p.subtype))unsafeAutomatic++;
  }
 }
 // Unmatched model outputs with auto-index flags are false automatic
 // garment admissions, even if they share a broad category.
 for(const [index,p] of guessed.entries())if(!matchedModel.has(index)&&p.autoIndexed){
  autoIndexed++;unsafeAutomatic++;
 }
 return {
  truthGarments:truth.length,proposedGarments:guessed.length,
  spatiallyMatched:matches.length,correctCategory:categoryCorrect,
  correctSubtype:subtypeCorrect,
  colorObserved,colorCorrect,
  completeModelColorCoverage:colorObserved===truth.length,
  sourceMaskTruePositives:correctByCategoryIoU,
  sourceMaskFalseNegatives:truth.length-correctByCategoryIoU,
  sourceMaskFalsePositives:guessed.length-correctByCategoryIoU,
  autoIndexed,unsafeAutomatic,
  // Raw image bytes, RLE arrays, person IDs and reviewer signing keys are
  // intentionally not included in this structured summary.
  requiresIndependentHumanIdentityAudit:true,
  independentModelTrainingOverlapExcluded:false,
  releaseAuthorized:false
 };
}
