/**
 * Mission 1 P835, experimental no-account recognition-only subtype safety gate.
 * This does NOT alter the original model, its catalog, thresholds or weights.
 * It asks the SAME FashionCLIP model to agree on TWO additional source-image
 * framings before allowing an automatic item subtype to pass the pilot.
 *
 * Views of the same model are correlated, not independent human evidence.
 * This is not a validated increase in true subtype accuracy.
 */
import {localCandidates,clothingChoices} from './local-catalog.mjs';

const known=new Set(localCandidates.filter(x=>x.category!=='Uncategorized').map(x=>x.category+'|'+x.itemType));
const labels=Object.freeze(localCandidates.map(x=>x.label));
const errorReason='subtype_corroboration_unavailable';

export function guardedSubtypeVerdict835(result,firstRanked,secondRanked){
 if(!result?.strong)return result;
 const choice=result.choices?.[0];
 if(!choice||!known.has(choice.category+'|'+choice.itemType))
  return {strong:false,categoryConfirmed:false,choices:[],details:{},reason:errorReason};
 const compact=ranked=>{
  if(!Array.isArray(ranked)||ranked.some(x=>!x||typeof x.label!=='string'||!Number.isFinite(x.score)))
   return null;
  const sorted=clothingChoices(ranked);
  const winner=sorted[0];
  if(!winner||winner.category==='Uncategorized')return null;
  const margin=winner.score-(sorted[1]?.score??0);
  return {category:winner.category,type:winner.itemType,score:winner.score,margin};
 };
 const a=compact(firstRanked),b=compact(secondRanked);
 if(!a||!b)return {
  strong:false,categoryConfirmed:false,choices:[],details:{},
  reason:'subtype_cross_view_review',
  subtypeSafety835:{outcome:'review',categoryAgreed:false,subtypeAgreed:false}
 };
 const categoryAgreed=a.category===choice.category&&b.category===choice.category;
 const subtypeAgreed=categoryAgreed&&a.type===choice.itemType&&b.type===choice.itemType;
 const confident=v=>v.score>=.15&&v.margin>=.03;
 if(subtypeAgreed&&confident(a)&&confident(b))return {
  ...result,
  subtypeSafety835:{outcome:'retained',categoryAgreed:true,subtypeAgreed:true}
 };
 // A reliably recognized broad category is still useful, but an unverified
 // subtype must NEVER be auto-indexed (and its unverified color is discarded).
 if(categoryAgreed)return {
  strong:false,categoryConfirmed:true,categoryOnly:true,
  choices:[{category:choice.category,itemType:'Unknown',label:choice.category,
   sleeveLength:['Bottoms','Shoes','Accessories'].includes(choice.category)?'Not applicable':'Unknown',
   score:Math.min(a.score,b.score)}],
  details:{},reason:'subtype_cross_view_review',
  subtypeSafety835:{outcome:'review',categoryAgreed:true,subtypeAgreed:false}
 };
 return {
  strong:false,categoryConfirmed:false,choices:[],details:{},
  reason:'subtype_cross_view_review',
  subtypeSafety835:{outcome:'review',categoryAgreed:false,subtypeAgreed:false}
 };
}

/** Never accept a subtype automatically when either alternate model pass
 * fails or times out. The original result remains available ONLY in tests.
 */
export async function corroborateOriginalSubtype835(result,image,{
 wholeView,centerView
}={}){
 if(!result?.strong)return result;
 if(typeof wholeView!=='function'||typeof centerView!=='function')
  return {strong:false,categoryConfirmed:false,choices:[],details:{},reason:errorReason};
 try{
  const [first,second]=await Promise.all([
   wholeView(image,labels),centerView(image,labels)
  ]);
  return guardedSubtypeVerdict835(result,first,second);
 }catch{
  return {strong:false,categoryConfirmed:false,choices:[],details:{},reason:errorReason};
 }
}
