import {localCandidates,clothingChoices,strongMatch,garmentDetailGroups,groupedGarmentDetails,verifiedGarmentDetails,detailPhotoUsable} from './local-catalog.mjs';

export const categoryCandidates=[
 {label:'a shirt, blouse, sweater, or other top',category:'Tops'},
 {label:'pants, shorts, or a skirt',category:'Bottoms'},
 {label:'a dress, jumpsuit, or romper',category:'Dresses'},
 {label:'a jacket, coat, or other outerwear',category:'Outerwear'},
 {label:'shoes, boots, or sandals',category:'Shoes'},
 {label:'a hat, bag, belt, scarf, jewelry, or sunglasses',category:'Accessories'},
 ...localCandidates.filter(x=>x.category==='Uncategorized').map(x=>({label:x.label,category:x.category}))
];
const options={hypothesis_template:'A photo of {}.'};
export function categoryChoices(results){
 return results.filter(x=>Number.isFinite(x.score)&&x.score>=0&&x.score<=1).map(x=>{
  const candidate=categoryCandidates.find(c=>c.label===x.label);return candidate?{...candidate,score:x.score}:null;
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
}
export function confidentCategory(choices){
 return !!choices[0]&&choices[0].category!=='Uncategorized'&&choices[0].score>=.45&&choices[0].score-(choices[1]?.score||0)>=.15;
}
export function agreementMatch(category,branch,overall){
 const first=branch[0],full=overall[0];
 return confidentCategory(category)&&strongMatch(branch)&&first.category===category[0].category&&
  !!full&&full.category===first.category&&full.itemType===first.itemType&&full.score>=.6&&full.score-(overall[1]?.score||0)>=.2;
}
// A broad dress category can be useful even when its subtype is uncertain.
// This result always stays in review and never supplies guessed attributes.
async function reviewGarmentCategory(model,confirmationModel,image,category,overall,evidence){
 const categoryName=category[0]?.category;
 if(!categoryName||categoryName==='Uncategorized'||category[0].score<.84||category[0].score-(category[1]?.score||0)<.35)return null;
 const labels=localCandidates.map(x=>x.label),whole=overall||await model(image,labels,options);
 const supported=results=>{
  const totals=garmentCategoryTotals(results),first=clothingChoices(results)[0];
  const negative=results.reduce((sum,x)=>sum+(localCandidates.some(c=>c.label===x.label&&c.category==='Uncategorized')?x.score:0),0);
  return first?.category===categoryName&&totals[0]?.category===categoryName&&totals[0].score>=.75&&totals[0].score-(totals[1]?.score||0)>=.5&&negative<=.1;
 };
 if(evidence)evidence.primary={totals:garmentCategoryTotals(whole).slice(0,3),top:clothingChoices(whole).slice(0,3)};
 if(!supported(whole))return null;
 const closeCategory=categoryChoices(await confirmationModel(image,categoryCandidates.map(x=>x.label),options));
 if(evidence)evidence.confirmationCategory=closeCategory.slice(0,3);
 if(closeCategory[0]?.category!==categoryName||closeCategory[0].score<.85||closeCategory[0].score-(closeCategory[1]?.score||0)<.35)return null;
 const close=await confirmationModel(image,labels,options);if(evidence)evidence.confirmation={totals:garmentCategoryTotals(close).slice(0,3),top:clothingChoices(close).slice(0,3)};if(!supported(close))return null;
 return {strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{label:categoryName,category:categoryName,itemType:'Unknown',sleeveLength:['Bottoms','Shoes','Accessories'].includes(categoryName)?'Not applicable':'Unknown',score:Math.min(category[0].score,closeCategory[0].score)}],details:{},reason:categoryName==='Dresses'?'dress_type_review':'category_type_review'};
}
async function reviewDressCategory(...args){return args[3][0]?.category==='Dresses'?reviewGarmentCategory(...args):null;}
async function readVerifiedDetails(model,confirmationModel,image,choice,onStage){
 if(!detailPhotoUsable(image.width,image.height)||choice.itemType==='Unknown')return {};
 onStage('details');const groups=garmentDetailGroups(choice),checks={};let proposed;
 try{proposed=groupedGarmentDetails(await model(image,Object.values(groups).flat().map(x=>x.label),options),groups);}catch{return {};}
 for(const key of Object.keys(proposed)){try{checks[key]=await confirmationModel(image,groups[key].map(x=>x.label),options);}catch{/* Optional field failure cannot discard garment identity. */}}
 return verifiedGarmentDetails(proposed,checks,groups);
}
export async function recognizeGarment(model,image,{onStage=()=>{},onIdentified=()=>{},confirmationModel=model}={}){
 onStage('identify');
 const category=categoryChoices(await model(image,categoryCandidates.map(x=>x.label),options));
 if(!confidentCategory(category))return {strong:false,choices:[],details:{},reason:'category_uncertain',diagnostics:{category:category.slice(0,3).map(x=>({category:x.category,score:x.score}))}};
 // Keep non-garment candidates in each branch: narrowing the vocabulary must
 // never force a room, pet, or pile of clothes to become a clothing type.
 const branchLabels=localCandidates.filter(x=>x.category===category[0].category||x.category==='Uncategorized');
 const branch=clothingChoices(await model(image,branchLabels.map(x=>x.label),options)),dressEvidence={};
 if(!strongMatch(branch)||branch[0].category!==category[0].category)return await reviewDressCategory(model,confirmationModel,image,category,undefined,dressEvidence)||{strong:false,choices:[],details:{},reason:'type_uncertain',diagnostics:{dressEvidence,category:category.slice(0,2).map(x=>({category:x.category,score:x.score})),branch:branch.slice(0,3).map(x=>({category:x.category,type:x.itemType,score:x.score}))}};
 // Independent vocabulary comparison, using the same model. Scores are gates,
 // not calibrated probabilities. A disagreement always requires adjustment.
 const overallResults=await model(image,localCandidates.map(x=>x.label),options),overall=clothingChoices(overallResults);
 if(!agreementMatch(category,branch,overall))return await reviewDressCategory(model,confirmationModel,image,category,overallResults,dressEvidence)||{strong:false,choices:[],details:{},reason:'checks_disagree',diagnostics:{dressEvidence,category:category.slice(0,2).map(x=>({category:x.category,score:x.score})),branch:branch.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),overall:overall.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score}))}};
 const confirmation=clothingChoices(await confirmationModel(image,localCandidates.map(x=>x.label),options));
 const shoeCorroborated=branch[0]?.category==='Shoes'&&branch[0].score>=.8&&branch[0].score-(branch[1]?.score||0)>=.5&&confirmation[0]?.category==='Shoes'&&confirmation[0].itemType===branch[0].itemType&&confirmation[0].score>=.3&&confirmation[0].score-(confirmation[1]?.score||0)>=.15;
 if(!shoeCorroborated&&(!confirmation[0]||confirmation[0].score<.35||confirmation[0].score-(confirmation[1]?.score||0)<.1||confirmation[0].category!==branch[0].category||confirmation[0].itemType!==branch[0].itemType))return await reviewDressCategory(model,confirmationModel,image,category,overallResults,dressEvidence)||{strong:false,choices:[],details:{},reason:'views_disagree',diagnostics:{dressEvidence,branch:branch.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),confirmation:confirmation.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score}))}};
 const first={...branch[0]};onIdentified(first);const details=await readVerifiedDetails(model,confirmationModel,image,first,onStage);
 return {strong:true,choices:[{...first,sleeveLength:details.sleeveLength||first.sleeveLength},...branch.slice(1)],details};
}

// Retry only an uncertain top type. Category, type, complete-vocabulary and
// independent-view gates must all pass again; contradictions are not retried.
export async function recognizeWithRecovery(model,image,settings={}){
 const result=await recognizeGarment(model,image,settings),category=result.diagnostics?.category;
 const eligible=result.reason==='type_uncertain'&&category?.[0]?.category==='Tops'&&category[0].score>=.85&&category[0].score-(category[1]?.score||0)>=.35;
 if(eligible&&settings.recoveryModel&&settings.recoveryConfirmationModel){
  const recovered=await recognizeGarment(settings.recoveryModel,image,{...settings,confirmationModel:settings.recoveryConfirmationModel,onIdentified:()=>{}});
  if(recovered.strong&&recovered.choices[0]?.category==='Tops'){settings.onIdentified?.(recovered.choices[0]);return {...recovered,preprocessingRecovery:true};}
 }
 // Recheck ambiguous Bottoms subtypes against the existing catalog on two
 // independent photo views. No new prompts/assets or user interaction needed.
 // Only accept a subtype when both views agree on it and reject background.
 if(!result.strong&&category?.[0]?.category==='Bottoms'&&
    ['type_uncertain','checks_disagree','views_disagree'].includes(result.reason)&&
    settings.recoveryModel&&settings.recoveryConfirmationModel){
  try{
   const labels=localCandidates.filter(x=>x.category==='Bottoms'||x.category==='Uncategorized').map(x=>x.label);
   const [first,second]=await Promise.all([
    settings.recoveryModel(image,labels,options),
    settings.recoveryConfirmationModel(image,labels,options)
   ]);
   const a=clothingChoices(first),b=clothingChoices(second);
   const safe=v=>v[0]?.category==='Bottoms'&&v[0].score>=.7&&
    v[0].score-(v[1]?.score||0)>=.25;
   if(a[0]?.category==='Bottoms'&&b[0]?.category==='Bottoms'&&a[0].itemType===b[0].itemType&&safe(b)&&a[0].score>=.45&&a[0].score-(a[1]?.score||0)>=.07){
    settings.onIdentified?.(a[0]);
    return {strong:true,choices:[a[0]],details:{},reason:'bottoms_independent_agreement',preprocessingRecovery:true};
   }
   result.diagnostics={...result.diagnostics,bottomsRecovery:{
    first:a.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),
    confirmation:b.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score}))
   }};
  }catch{/* A failed optional recheck never overrides the original result. */}
 }
 // Skirt/dress conflicts need a balanced comparison, not a Bottoms-only
 // vocabulary that would force every dress into a skirt. Keep uncertain
 // results unchanged unless both independent views select the same garment.
 if(!result.strong&&['checks_disagree','views_disagree'].includes(result.reason)&&
    settings.recoveryModel&&settings.recoveryConfirmationModel&&
    (category?.[0]?.category==='Dresses'||category?.[0]?.category==='Bottoms'||
     (result.diagnostics?.dressEvidence?.primary?.totals?.[0]?.category==='Dresses'&&
      result.diagnostics?.dressEvidence?.confirmationCategory?.[0]?.category==='Bottoms'))){
  try{
   const labels=localCandidates.filter(x=>['Bottoms','Dresses','Uncategorized'].includes(x.category)).map(x=>x.label);
   const [first,second]=await Promise.all([
    settings.recoveryModel(image,labels,options),
    settings.recoveryConfirmationModel(image,labels,options)
   ]);
   const a=clothingChoices(first),b=clothingChoices(second);
   const same=a[0]?.category===b[0]?.category&&a[0]?.itemType===b[0]?.itemType;
   const strong=v=>v[0]?.category!=='Uncategorized'&&v[0]?.score>=.55&&
    v[0].score-(v[1]?.score||0)>=.2;
   if(same&&strong(a)&&strong(b)){
    settings.onIdentified?.(a[0]);
    return {strong:true,choices:[a[0]],details:{},reason:'skirt_dress_independent_agreement',preprocessingRecovery:true};
   }
   // Record the two-category conflict explicitly for future photo-quality
   // benchmarking; never auto-save when the independent views disagree.
   const conflict=a[0]?.category!==b[0]?.category;
   result.diagnostics={...result.diagnostics,skirtDressConflict:conflict?{
    firstCategory:a[0]?.category||null,confirmationCategory:b[0]?.category||null,
    requiresManualReview:true
   }:null,skirtDressRecovery:{
    first:a.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),
    confirmation:b.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score}))
   }};
  }catch{/* Preserve the original uncertain result. */}
 }
 // A coat with a strong category-specific vote but a conflicting whole-
 // catalog confirmation gets two independent full-catalog rechecks. Do not
 // weaken the general confirmation threshold for unrelated garment types.
 if(!result.strong&&result.reason==='views_disagree'&&
    result.diagnostics?.branch?.[0]?.category==='Outerwear'&&
    result.diagnostics?.branch?.[0]?.type==='Coat'&&
    result.diagnostics.branch[0].score>=.9&&
    settings.recoveryModel&&settings.recoveryConfirmationModel){
  try{
   const labels=localCandidates.map(x=>x.label);
   const [first,second]=await Promise.all([
    settings.recoveryModel(image,labels,options),
    settings.recoveryConfirmationModel(image,labels,options)
   ]);
   const a=clothingChoices(first),b=clothingChoices(second);
   const ca=garmentCategoryTotals(first),cb=garmentCategoryTotals(second);
   const supports=(choices,cats)=>choices[0]?.category==='Outerwear'&&
    choices[0]?.itemType==='Coat'&&choices[0].score>=.3&&
    choices[0].score-(choices[1]?.score||0)>=.1&&
    cats[0]?.category==='Outerwear'&&cats[0].score>=.65&&
    cats[0].score-(cats[1]?.score||0)>=.3;
   if(supports(a,ca)&&supports(b,cb)){
    settings.onIdentified?.(a[0]);
    return {strong:true,choices:[a[0]],details:{},reason:'coat_independent_agreement',preprocessingRecovery:true};
   }
   result.diagnostics={...result.diagnostics,coatRecovery:{
    first:a.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),
    confirmation:b.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),
    firstCategories:ca.slice(0,2),confirmationCategories:cb.slice(0,2)
   }};
  }catch{/* Preserve the original uncertain result. */}
 }
 // A near-tied Jacket runner-up is worth independent checking even when
 // Blouse narrowly leads the initial full catalog. Never promote the runner-
 // up without two strongly agreeing complete-catalog views.
 if(!result.strong&&result.reason==='checks_disagree'&&
    result.diagnostics?.category?.[0]?.category==='Tops'&&
    result.diagnostics?.overall?.[0]?.category==='Tops'&&
    result.diagnostics?.overall?.[1]?.category==='Outerwear'&&
    result.diagnostics?.overall?.[1]?.type==='Jacket'&&
    result.diagnostics.overall[0].score-result.diagnostics.overall[1].score<=.08&&
    settings.recoveryModel&&settings.recoveryConfirmationModel){
  try{
   const labels=localCandidates.map(x=>x.label);
   const [first,second]=await Promise.all([
    settings.recoveryModel(image,labels,options),
    settings.recoveryConfirmationModel(image,labels,options)
   ]);
   const a=clothingChoices(first),b=clothingChoices(second);
   const ca=garmentCategoryTotals(first),cb=garmentCategoryTotals(second);
   const supports=(choices,cats)=>choices[0]?.category==='Outerwear'&&
    choices[0]?.itemType==='Jacket'&&cats[0]?.category==='Outerwear'&&
    cats[0].score>=.62&&cats[0].score-(cats[1]?.score||0)>=.28;
   if(supports(a,ca)&&supports(b,cb)){
    settings.onIdentified?.(a[0]);
    return {strong:true,choices:[a[0]],details:{},reason:'jacket_runner_up_independent_agreement',preprocessingRecovery:true};
   }
   result.diagnostics={...result.diagnostics,jacketRunnerUpRecovery:{
    first:a.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),
    confirmation:b.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),
    firstCategories:ca.slice(0,2),confirmationCategories:cb.slice(0,2)
   }};
  }catch{/* Keep the original uncertain result when verification fails. */}
 }
 // Independently verify an Outerwear jacket when a Tops broad prompt
 // conflicts with the full catalog. Two recovery views must both favor
 // Outerwear strongly and agree on Jacket; never trust a single branch vote.
 if(!result.strong&&result.reason==='checks_disagree'&&
    result.diagnostics?.category?.[0]?.category==='Tops'&&
    result.diagnostics?.overall?.[0]?.category==='Outerwear'&&
    result.diagnostics?.overall?.[0]?.type==='Jacket'&&
    settings.recoveryModel&&settings.recoveryConfirmationModel){
  try{
   const labels=localCandidates.map(x=>x.label);
   const [first,second]=await Promise.all([
    settings.recoveryModel(image,labels,options),
    settings.recoveryConfirmationModel(image,labels,options)
   ]);
   const a=clothingChoices(first),b=clothingChoices(second);
   const ca=garmentCategoryTotals(first),cb=garmentCategoryTotals(second);
   const supports=(choices,cats)=>choices[0]?.category==='Outerwear'&&
    choices[0]?.itemType==='Jacket'&&cats[0]?.category==='Outerwear'&&
    cats[0].score>=.75&&cats[0].score-(cats[1]?.score||0)>=.5;
   if(supports(a,ca)&&supports(b,cb)){
    settings.onIdentified?.(a[0]);
    return {strong:true,choices:[a[0]],details:{},reason:'outerwear_independent_agreement',preprocessingRecovery:true};
   }
  }catch{/* Keep the original uncertain result if a view fails. */}
 }
 // When the broad prompt mistakes a jacket for a blouse, independently retry
 // the original full photograph. Never promote a conflicting guess: all normal
 // category, type, full-vocabulary and second-view gates must pass on retry.
 const outerwearConflict=result.reason==='checks_disagree'&&
  result.diagnostics?.overall?.[0]?.category==='Outerwear'&&
  result.diagnostics?.overall?.[0]?.type==='Jacket'&&
  result.diagnostics?.category?.[0]?.category==='Tops';
 if(outerwearConflict&&settings.recoveryModel&&settings.recoveryConfirmationModel){
  const recovered=await recognizeGarment(settings.recoveryModel,image,{
   ...settings,confirmationModel:settings.recoveryConfirmationModel,onIdentified:()=>{}
  });
  if(recovered.strong&&recovered.choices[0]?.category==='Outerwear'){
   settings.onIdentified?.(recovered.choices[0]);
   return {...recovered,preprocessingRecovery:true};
  }
  // When the retry narrowly favors Outerwear, inspect both complete-catalog
  // views independently. This is diagnostic only: a weak category vote must
  // not become an automatic jacket classification.
  let fullCatalogEvidence=null;
  if(recovered.reason==='category_uncertain'&&recovered.diagnostics?.category?.[0]?.category==='Outerwear'){
   const labels=localCandidates.map(x=>x.label);
   try{
    const [whole,close]=await Promise.all([
     settings.recoveryModel(image,labels,options),
     settings.recoveryConfirmationModel(image,labels,options)
    ]);
    const summarize=ranked=>({
     top:clothingChoices(ranked).slice(0,3).map(x=>({category:x.category,type:x.itemType,score:x.score})),
     categories:garmentCategoryTotals(ranked).slice(0,3)
    });
    fullCatalogEvidence={whole:summarize(whole),confirmation:summarize(close)};
   }catch{fullCatalogEvidence={error:'confirmation_unavailable'};}
  }
  // Independent full-catalog views may justify a category-only suggestion,
  // but a conflicting broad prompt still forbids automatic saving.
  const whole=fullCatalogEvidence?.whole,close=fullCatalogEvidence?.confirmation;
  const supportsOuterwear=view=>view?.categories?.[0]?.category==='Outerwear'&&
   view.categories[0].score>=.75&&
   view.categories[0].score-(view.categories[1]?.score||0)>=.5&&
   view.top?.[0]?.category==='Outerwear';
  // Category-only evidence requires independent agreement on the leading
  // garment type as well as the category. Keep a contradictory broad-category
  // prompt in review; never silently promote this evidence to an auto-save.
  const sameType=whole?.top?.[0]?.type&&whole.top[0].type===close?.top?.[0]?.type;
  const outerwearReviewSuggested=!!sameType&&supportsOuterwear(whole)&&supportsOuterwear(close);
  // Record why the independent retry failed so real-photo tests can distinguish
  // category prompt bias from type or view disagreement. Do not override gates.
  result.diagnostics={...result.diagnostics,outerwearRecovery:{outerwearReviewSuggested,fullCatalogEvidence,
   reason:recovered.reason||'unconfirmed',
   category:recovered.diagnostics?.category||null,
   branch:recovered.diagnostics?.branch||null,
   overall:recovered.diagnostics?.overall||null,
   confirmation:recovered.diagnostics?.confirmation||null
  }};
 }
 if(result.strong||result.categoryConfirmed||!['type_uncertain','checks_disagree','views_disagree'].includes(result.reason))return result;
 // Keep a verified broad category when subtype votes disagree. It remains in
 // review; negative prompts and both image views must still support clothing.
 try{const ranked=categoryChoices(await model(image,categoryCandidates.map(x=>x.label),options));return await reviewGarmentCategory(model,settings.confirmationModel||model,image,ranked)||result;}catch{return result;}
}

function garmentCategoryTotals(results){
 const totals=new Map();
 // Sum only clothing classes: background/negative prompts must never win a
 // clothing category vote simply because they appear in the candidate list.
 for(const result of results){const candidate=localCandidates.find(x=>x.label===result.label);if(candidate&&candidate.category!=='Uncategorized'&&Number.isFinite(result.score)&&result.score>=0&&result.score<=1)totals.set(candidate.category,(totals.get(candidate.category)||0)+result.score);}
 return [...totals].map(([category,score])=>({category,score})).sort((a,b)=>b.score-a.score);
}
// A clothing mask supplies independent category evidence. Validate its category
// against both image views, then refine the type only when the views support it.
export async function classifyIsolatedGarment(model,image,{hint,confirmationModel=model,onStage=()=>{},onIdentified=()=>{}}={}){
 const valid=['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
 if(!hint||!Array.isArray(hint.categories)||!hint.categories.length||hint.categories.some(x=>!valid.includes(x))||!Array.isArray(hint.types))throw Error('Invalid clothing mask context.');
 if(hint.clipped)return {strong:false,choices:[],details:{},reason:'clipped_garment'};
 onStage('identify');const labels=localCandidates.map(x=>x.label),whole=await model(image,labels,options),close=await confirmationModel(image,labels,options),a=garmentCategoryTotals(whole),b=garmentCategoryTotals(close);
 const supported=ranked=>ranked[0]&&ranked[0].score>=.55&&ranked[0].score-(ranked[1]?.score||0)>=.15;
 const agreed=supported(a)&&supported(b)&&a[0].category===b[0].category&&hint.categories.includes(a[0].category);
 // A strong, complete mask can retain a single broad category when the
 // classifier is uncertain. Confident contradictions still require Adjust.
 const maskOnly=hint.categories.length===1&&Number.isFinite(hint.confidence)&&hint.confidence>=.9&&hint.confidence<=1&&[a,b].every(r=>!supported(r)||r[0].category===hint.categories[0]);
 if(!agreed&&!maskOnly)return {strong:false,choices:[],details:{},reason:'mask_category_disagrees'};
 const category=agreed?a[0].category:hint.categories[0];
 const first=clothingChoices(whole)[0],confirmation=clothingChoices(close),sameType=agreed&&strongMatch(clothingChoices(whole))&&confirmation[0]?.category===first.category&&confirmation[0]?.itemType===first.itemType&&confirmation[0].score>=.35&&confirmation[0].score-(confirmation[1]?.score||0)>=.1&&(!hint.types.length||hint.types.includes(first.itemType));
 const choice=sameType?{...first}:{label:category,category,itemType:'Unknown',sleeveLength:['Bottoms','Shoes','Accessories'].includes(category)?'Not applicable':'Unknown',score:Math.min(a[0]?.score??0,b[0]?.score??0)};
 onIdentified(choice);const details=sameType?await readVerifiedDetails(model,confirmationModel,image,choice,onStage):{};
 return {strong:true,categoryOnly:!sameType,choices:[{...choice,sleeveLength:details.sleeveLength||choice.sleeveLength}],details};
}
