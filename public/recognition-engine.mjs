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
  !!full&&full.category===first.category&&full.itemType===first.itemType&&full.score>=.55&&full.score-(overall[1]?.score||0)>=.2;
}
export async function recognizeGarment(model,image,{onStage=()=>{},onIdentified=()=>{},confirmationModel=model}={}){
 onStage('identify');
 const category=categoryChoices(await model(image,categoryCandidates.map(x=>x.label),options));
 if(!confidentCategory(category))return {strong:false,choices:[],details:{},reason:'category_uncertain',diagnostics:{category:category.slice(0,3).map(x=>({category:x.category,score:x.score}))}};
 // Keep non-garment candidates in each branch: narrowing the vocabulary must
 // never force a room, pet, or pile of clothes to become a clothing type.
 const branchLabels=localCandidates.filter(x=>x.category===category[0].category||x.category==='Uncategorized');
 const branch=clothingChoices(await model(image,branchLabels.map(x=>x.label),options));
 if(!strongMatch(branch)||branch[0].category!==category[0].category)return {strong:false,choices:[],details:{},reason:'type_uncertain',diagnostics:{category:category.slice(0,2).map(x=>({category:x.category,score:x.score})),branch:branch.slice(0,3).map(x=>({category:x.category,type:x.itemType,score:x.score}))}};
 // Independent vocabulary comparison, using the same model. Scores are gates,
 // not calibrated probabilities. A disagreement always requires adjustment.
 const overall=clothingChoices(await model(image,localCandidates.map(x=>x.label),options));
 if(!agreementMatch(category,branch,overall))return {strong:false,choices:[],details:{},reason:'checks_disagree',diagnostics:{category:category.slice(0,2).map(x=>({category:x.category,score:x.score})),branch:branch.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),overall:overall.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score}))}};
 const confirmation=clothingChoices(await confirmationModel(image,localCandidates.map(x=>x.label),options));
 if(!confirmation[0]||confirmation[0].score<.35||confirmation[0].score-(confirmation[1]?.score||0)<.1||confirmation[0].category!==branch[0].category||confirmation[0].itemType!==branch[0].itemType)return {strong:false,choices:[],details:{},reason:'views_disagree',diagnostics:{branch:branch.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score})),confirmation:confirmation.slice(0,2).map(x=>({category:x.category,type:x.itemType,score:x.score}))}};
 const first={...branch[0]};onIdentified(first);let details={};
 if(detailPhotoUsable(image.width,image.height)){
  onStage('details');const groups=garmentDetailGroups(first),labels=Object.values(groups).flat().map(x=>x.label);
  const proposed=groupedGarmentDetails(await model(image,labels,options),groups),checks={};
  for(const key of Object.keys(proposed))checks[key]=await confirmationModel(image,groups[key].map(x=>x.label),options);
  details=verifiedGarmentDetails(proposed,checks,groups);
 }
 return {strong:true,choices:[{...first,sleeveLength:details.sleeveLength||first.sleeveLength},...branch.slice(1)],details};
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
 onIdentified(choice);let details={};
 if(sameType&&detailPhotoUsable(image.width,image.height)){
  onStage('details');const groups=garmentDetailGroups(choice),proposed=groupedGarmentDetails(await model(image,Object.values(groups).flat().map(x=>x.label),options),groups),checks={};
  for(const key of Object.keys(proposed))checks[key]=await confirmationModel(image,groups[key].map(x=>x.label),options);
  details=verifiedGarmentDetails(proposed,checks,groups);
 }
 return {strong:true,categoryOnly:!sameType,choices:[{...choice,sleeveLength:details.sleeveLength||choice.sleeveLength}],details};
}
