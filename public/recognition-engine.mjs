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
export async function recognizeGarment(model,image,{onStage=()=>{},onIdentified=()=>{},confirmationModel=model}={}){
 onStage('identify');
 const category=categoryChoices(await model(image,categoryCandidates.map(x=>x.label),options));
 if(!confidentCategory(category))return {strong:false,choices:[],details:{},reason:'category_uncertain'};
 // Keep non-garment candidates in each branch: narrowing the vocabulary must
 // never force a room, pet, or pile of clothes to become a clothing type.
 const branchLabels=localCandidates.filter(x=>x.category===category[0].category||x.category==='Uncategorized');
 const branch=clothingChoices(await model(image,branchLabels.map(x=>x.label),options));
 if(!strongMatch(branch)||branch[0].category!==category[0].category)return {strong:false,choices:[],details:{},reason:'type_uncertain'};
 // Independent vocabulary comparison, using the same model. Scores are gates,
 // not calibrated probabilities. A disagreement always requires adjustment.
 const overall=clothingChoices(await model(image,localCandidates.map(x=>x.label),options));
 if(!agreementMatch(category,branch,overall))return {strong:false,choices:[],details:{},reason:'checks_disagree'};
 const confirmation=clothingChoices(await confirmationModel(image,localCandidates.map(x=>x.label),options));
 if(!confirmation[0]||confirmation[0].score<.35||confirmation[0].score-(confirmation[1]?.score||0)<.1||confirmation[0].category!==branch[0].category||confirmation[0].itemType!==branch[0].itemType)return {strong:false,choices:[],details:{},reason:'views_disagree'};
 const first={...branch[0]};onIdentified(first);let details={};
 if(detailPhotoUsable(image.width,image.height)){
  onStage('details');const groups=garmentDetailGroups(first),labels=Object.values(groups).flat().map(x=>x.label);
  const proposed=groupedGarmentDetails(await model(image,labels,options),groups),checks={};
  for(const key of Object.keys(proposed))checks[key]=await confirmationModel(image,groups[key].map(x=>x.label),options);
  details=verifiedGarmentDetails(proposed,checks,groups);
 }
 return {strong:true,choices:[{...first,sleeveLength:details.sleeveLength||first.sleeveLength},...branch.slice(1)],details};
}
