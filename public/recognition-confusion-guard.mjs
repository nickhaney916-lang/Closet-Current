/**
 * Closet Current MISSION 1 — conservative, source-framing-specific subtype
 * corroboration for inherently confusable clothing vocabulary.
 *
 * Adds independent *image framings* of the ORIGINAL PHOTO (same model/index).
 * It cannot independently prove the truth of a label or calibrate CLIP scores.
 * Research-only until new unseen human-annotated acceptance.
 */
import {localCandidates,clothingChoices} from './local-catalog.mjs';

const confusions=Object.freeze([
 Object.freeze({category:'Tops',types:Object.freeze(['T-shirt','Sweatshirt'])}),
 Object.freeze({category:'Tops',types:Object.freeze(['Blouse','Tunic'])}),
 Object.freeze({category:'Outerwear',types:Object.freeze(['Jacket','Blazer'])}),
 Object.freeze({category:'Shoes',types:Object.freeze(['Sneakers','Ankle boots'])})
]);
const familyFor=choice=>confusions.find(group=>
 group.category===choice?.category&&group.types.includes(choice.itemType));
const negativeLabels=localCandidates.filter(x=>x.category==='Uncategorized')
 .map(x=>x.label);
function sourceViewSupports(raw,choice){
 if(!Array.isArray(raw)||!raw.length)return false;
 const ranked=clothingChoices(raw);
 const first=ranked[0],second=ranked[1];
 // Same type agreement on original-photo framing; results originate from
 // actual model label scores. Never call this an independently learned model.
 return first?.category===choice.category&&first?.itemType===choice.itemType&&
  Number.isFinite(first.score)&&first.score>=.55&&
  first.score-(second?.score||0)>=.18;
}
function requireReview(result,why,sourceEvidence){
 const first=result.choices?.[0],category=first?.category;
 if(!category)return {strong:false,choices:[],details:{},reason:'type_uncertain'};
 const choice={category,itemType:'Unknown',label:category,score:first.score,
  sleeveLength:['Bottoms','Shoes','Accessories'].includes(category)?
    'Not applicable':'Unknown'};
 return {strong:false,categoryConfirmed:true,categoryOnly:true,
  choices:[choice],details:{},reason:'type_uncertain',
  diagnostics:{...result.diagnostics,mission1CrossFrame:{
   required:true,verified:false,reason:why,
   sourceFramesCompared:sourceEvidence||0,
   humanReviewRequired:true
  }}};
}
export async function corroborateAmbiguousType(result,image,{sourceWhole,sourceCenter}={}){
 if(!result?.strong||!result.choices?.length)return result;
 const first=result.choices[0],family=familyFor(first);
 if(!family)return result;
 if(typeof sourceWhole!=='function'||typeof sourceCenter!=='function')
  return requireReview(result,'verification_unavailable',0);
 const labels=localCandidates.filter(x=>
  (x.category===family.category&&family.types.includes(x.itemType))||
  x.category==='Uncategorized').map(x=>x.label);
 // Both views operate on full SOURCE pixels. Never substitute thumbnail,
 // label-only metadata, or a cached classification from a different photo.
 if(labels.length<2||labels.length>10||!labels.some(x=>negativeLabels.includes(x)))
  return requireReview(result,'invalid_vocabulary',0);
 try{
  const whole=await sourceWhole(image,labels,{hypothesis_template:'A photo of {}.'});
  if(!sourceViewSupports(whole,first))
   return requireReview(result,'original_source_disagreement',1);
  const center=await sourceCenter(image,labels,{hypothesis_template:'A photo of {}.'});
  if(!sourceViewSupports(center,first))
   return requireReview(result,'independent_source_framing_disagreement',2);
  return {...result,diagnostics:{...result.diagnostics,mission1CrossFrame:{
   required:true,verified:true,sourceFramesCompared:2,
   sameModelDifferentSourceFramings:true,
   independentHumanEvidence:false
  }}};
 }catch{
  return requireReview(result,'verification_unavailable',0);
 }
}
