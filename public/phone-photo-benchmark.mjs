import {localCandidates} from './local-catalog.mjs';

export const photoCategories=[...new Set(localCandidates.map(x=>x.category).filter(x=>x!=='Uncategorized'))];
export function photoTypes(category){return [...new Set(localCandidates.filter(x=>x.category===category).map(x=>x.itemType))];}
const errors=new Set(['image','network','memory','runtime','asset','unknown','timeout','cancelled','invalid_result']);
const reasons=new Set(['category_uncertain','type_uncertain','checks_disagree','views_disagree','dress_type_review']);
const categoryValid=category=>photoCategories.includes(category)||category==='Uncategorized';
const safeId=id=>/^photo-\d{3}$/.test(id);
export function lockPhotoLabels(annotations){
 if(!Array.isArray(annotations)||!annotations.length||annotations.length>20)throw Error('Choose between 1 and 20 photos.');
 return annotations.map((row,i)=>{
  if(!categoryValid(row.category))throw Error('Choose the category for photo '+(i+1)+'.');
  const type=row.type||null;
  if(type&&(row.category==='Uncategorized'||!photoTypes(row.category).includes(type)))throw Error('Choose a matching clothing type for photo '+(i+1)+'.');
  return {id:'photo-'+String(i+1).padStart(3,'0'),expectedCategory:row.category,expectedType:type};
 });
}
export function photoFailure(id,code){
 if(!safeId(id))throw Error('Invalid photo identifier.');
 return {id,error:errors.has(code)?code:'unknown'};
}
export function phonePhotoResult(id,result,elapsedMs){
 if(!safeId(id))throw Error('Invalid photo identifier.');
 const choice=result?.choices?.[0],category=choice?.category||null,type=choice?.itemType||null;
 if(typeof result?.strong!=='boolean'||category&&!categoryValid(category)||type&&type!=='Unknown'&&!photoTypes(category).includes(type)||
  (result.strong||result.categoryConfirmed)&&(!category||category==='Uncategorized'))return photoFailure(id,'invalid_result');
 const diagnostics={};
 for(const group of ['category','branch','overall','confirmation']){
  const entries=result.diagnostics?.[group];if(!Array.isArray(entries))continue;
  diagnostics[group]=entries.slice(0,3).filter(x=>categoryValid(x.category)&&Number.isFinite(x.score)&&x.score>=0&&x.score<=1).map(x=>({category:x.category,score:x.score,...(photoTypes(x.category).includes(x.type)?{type:x.type}:{})}));
 }
 return {id,prediction:{category,type},strong:result.strong,categoryConfirmed:result.categoryConfirmed===true,
  reason:reasons.has(result.reason)?result.reason:null,preprocessingRecovery:result.preprocessingRecovery===true,diagnostics,
  elapsedMs:Number.isFinite(elapsedMs)&&elapsedMs>=0?Math.round(elapsedMs):null};
}
export function scorePhonePhotos(labels,results,{release,indexHash}={}){
 // Rebuild the label snapshot so extra fields (filenames, notes, account data)
 // can never become part of a downloaded report.
 const expected=lockPhotoLabels(labels.map(x=>({category:x.expectedCategory,type:x.expectedType})));
 if(labels.some((x,i)=>x.id!==expected[i].id)||!Array.isArray(results)||results.length!==expected.length)throw Error('Incomplete photo test.');
 const byId=new Map();
 for(const r of results){if(!r||!safeId(r.id)||byId.has(r.id))throw Error('Duplicate or invalid photo result.');byId.set(r.id,r);}
 const summary={photos:expected.length,garments:0,categoryMatches:0,typesChecked:0,typeMatches:0,automatic:0,review:0,uncertain:0,errors:0,incorrectAutomaticCategories:0,incorrectAutomaticTypes:0,negativePhotos:0,negativeRejected:0};
 const photos=expected.map(item=>{
  const raw=byId.get(item.id);if(!raw)throw Error('Missing photo result.');
  const safe=raw.error?photoFailure(item.id,raw.error):phonePhotoResult(item.id,{strong:raw.strong,categoryConfirmed:raw.categoryConfirmed,reason:raw.reason,diagnostics:raw.diagnostics,preprocessingRecovery:raw.preprocessingRecovery,choices:raw.prediction?.category?[{category:raw.prediction.category,itemType:raw.prediction.type}]:[]},raw.elapsedMs);
  if(item.expectedCategory==='Uncategorized')summary.negativePhotos++;else{summary.garments++;if(item.expectedType)summary.typesChecked++;}
  if(safe.error){summary.errors++;return {...item,...safe};}
  const prediction=safe.prediction,identified=!!prediction.category&&prediction.category!=='Uncategorized';
  const categoryMatch=item.expectedCategory==='Uncategorized'?!identified&&!safe.strong&&!safe.categoryConfirmed:prediction.category===item.expectedCategory&&(safe.strong||safe.categoryConfirmed);
  const typeMatch=item.expectedType?categoryMatch&&prediction.type===item.expectedType:null;
  if(item.expectedCategory==='Uncategorized'){if(categoryMatch)summary.negativeRejected++;}
  else{if(categoryMatch)summary.categoryMatches++;if(typeMatch)summary.typeMatches++;}
  if(safe.strong){summary.automatic++;if(!categoryMatch)summary.incorrectAutomaticCategories++;if(item.expectedType&&!typeMatch)summary.incorrectAutomaticTypes++;}
  else if(safe.categoryConfirmed)summary.review++;else summary.uncertain++;
  return {...item,...safe,categoryMatch,typeMatch};
 });
 return {format:'closet-current-phone-photo-check',version:1,
  release:/^[a-f0-9]{12}$/.test(release||'')?release:null,
  recognitionIndex:/^[a-f0-9]{64}$/.test(indexHash||'')?indexHash:null,
  summary,photos};
}
