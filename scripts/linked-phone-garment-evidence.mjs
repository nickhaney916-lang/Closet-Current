// Local-only original-first garment evidence. It is never certified phone or reviewer proof.
export const categories=Object.freeze(['top','jacket','pants','shorts','skirt','dress','sneakers','boots','sandals','shoes','other']);
export const colors=Object.freeze(['black','white','gray','beige','brown','blue','green','red','pink','purple','yellow','orange','multicolor']);
export const scenes=Object.freeze([
 {id:'sneakers',label:'Sneakers — toes, sides and color',garments:['shoe']},
 {id:'boots',label:'Boots — height, sole and toe',garments:['shoe']},
 {id:'sandals',label:'Sandals — straps',garments:['shoe']},
 {id:'dress-casual',label:'Casual dress — one piece',garments:['dress']},
 {id:'dress-long',label:'Long dress — hem and sleeves',garments:['dress']},
 {id:'shorts-fitted',label:'Shorts — visible leg openings',garments:['bottom']},
 {id:'shorts-loose',label:'Loose shorts — avoid false skirt',garments:['bottom']},
 {id:'skirt-short',label:'Short skirt — avoid false shorts',garments:['bottom']},
 {id:'skirt-loose',label:'Loose skirt — avoid false shorts',garments:['bottom']},
 {id:'jacket-alone',label:'Jacket alone — complete sleeves',garments:['outerwear']},
 {id:'jacket-layered',label:'Jacket over top — separate layers',garments:['outerwear']},
 {id:'whole-outfit',label:'One untouched original with four visible garments',garments:['top','outerwear','bottom','shoes']}
]);
export const platforms=Object.freeze(['Android','iPhone']);
export const slots=Object.freeze(platforms.flatMap(platform=>scenes.flatMap(scene=>
 scene.garments.map((garment,i)=>Object.freeze({id:platform+'/'+scene.id+'/'+(i+1),platform,scene:scene.id,garment})))));
const claims=Object.freeze({physicalHardwareVerified:false,independentOriginalReviewVerified:false,
 recognitionAccuracyVerified:false,productionReleaseApproved:false});
const defaultRow=slot=>({id:slot.id,phase:'unlabeled',truthCategory:'unknown',truthColor:'unknown',
 modelCategory:'not_tested',modelColor:'not_tested',savedCategory:'not_tested',
 savedColor:'not_tested',savedPhoto:'not_tested'});
const keys=x=>Object.keys(x).sort().join('|');
const reject=()=>{throw Error('Invalid fixed-choice phone review. No personal or unsupported fields accepted.');};
export function blankTrial(){return {format:'closet-current-linked-phone-original-trials',version:1,
 appRelease:'unavailable',rows:slots.map(defaultRow),claims:{...claims}};}
export function validateTrial(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  keys(value)!=='appRelease|claims|format|rows|version'||
  value.format!=='closet-current-linked-phone-original-trials'||value.version!==1||
  !(value.appRelease==='unavailable'||/^[a-f0-9]{12}$/.test(value.appRelease))||
  !value.claims||keys(value.claims)!==keys(claims)||
  Object.keys(claims).some(k=>value.claims[k]!==false)||
  !Array.isArray(value.rows)||value.rows.length!==slots.length)reject();
 for(let i=0;i<slots.length;i++){
  const row=value.rows[i],blank=defaultRow(slots[i]);
  if(!row||typeof row!=='object'||Array.isArray(row)||keys(row)!==keys(blank)||
   row.id!==slots[i].id||!['unlabeled','locked','recorded'].includes(row.phase))reject();
  if(row.phase==='unlabeled'){
   if(Object.keys(blank).some(k=>row[k]!==blank[k]))reject();
   continue;
  }
  if(!categories.includes(row.truthCategory)||!colors.includes(row.truthColor))reject();
  if(row.phase==='locked'){
   if(['modelCategory','modelColor','savedCategory','savedColor','savedPhoto'].some(k=>row[k]!==blank[k]))reject();
   continue;
  }
  if(![...categories,'unrecognized'].includes(row.modelCategory)||
   ![...colors,'unrecognized'].includes(row.modelColor)||
   ![...categories,'not_saved'].includes(row.savedCategory)||
   ![...colors,'not_saved'].includes(row.savedColor)||
   !['clear','pixelated','missing','not_saved'].includes(row.savedPhoto))reject();
  if((row.savedCategory==='not_saved')!==(row.savedColor==='not_saved')||
   (row.savedCategory==='not_saved')!==(row.savedPhoto==='not_saved'))reject();
 }
 return JSON.parse(JSON.stringify(value));
}
export function parseTrial(text){
 if(typeof text!=='string'||text.length>131072)reject();
 let value;try{value=JSON.parse(text);}catch{reject();}
 return validateTrial(value);
}
export function summarizeTrial(value){
 const record=validateTrial(value);
 const reviewed=record.rows.filter(r=>r.phase==='recorded'),total=reviewed.length;
 const modelCategory=reviewed.filter(r=>r.modelCategory===r.truthCategory).length;
 const modelColor=reviewed.filter(r=>r.modelColor===r.truthColor).length;
 const modelExact=reviewed.filter(r=>r.modelCategory===r.truthCategory&&r.modelColor===r.truthColor).length;
 const savedExact=reviewed.filter(r=>r.savedCategory===r.truthCategory&&r.savedColor===r.truthColor).length;
 const sceneDone=(platform,scene)=>scene.garments.every((_,i)=>
  record.rows.some(r=>r.id===platform+'/'+scene.id+'/'+(i+1)&&r.phase==='recorded'));
 const finished=platforms.reduce((n,platform)=>n+scenes.filter(scene=>sceneDone(platform,scene)).length,0);
 const pct=(a,b)=>b===0?null:Math.round(a*10000/b)/100;
 return {reviewedGarmentEntries:total,requiredGarmentEntries:slots.length,
  reviewedOriginalScenes:finished,requiredOriginalScenes:scenes.length*platforms.length,
  modelCategoryCorrect:modelCategory,modelColorCorrect:modelColor,
  modelCategoryColorExact:modelExact,savedCategoryColorExact:savedExact,
  modelCategoryPercentOfReviewed:pct(modelCategory,total),
  modelColorPercentOfReviewed:pct(modelColor,total),
  modelExactPercentOfReviewed:pct(modelExact,total),
  savedExactPercentOfReviewed:pct(savedExact,total),
  savedPhotoIssues:reviewed.filter(r=>['pixelated','missing'].includes(r.savedPhoto)).length,
  originalFirstSelfReportedOnly:true,sourcePhotosCryptographicallyLinked:false,
  physicalAndroidVerified:false,physicalIPhoneVerified:false,
  authenticIndependentReviewerVerified:false,verifiedRecognitionAccuracy:null,
  independentlyVerifiedUniqueOriginalScenes:0,hostedStagingVerified:false,
  productionPromotion:'BLOCKED'};
}
