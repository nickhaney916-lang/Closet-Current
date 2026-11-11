import {localCandidates} from './local-catalog.mjs';

export const photoCategories=[...new Set(localCandidates.map(x=>x.category).filter(x=>x!=='Uncategorized'))];
export function photoTypes(category){return [...new Set(localCandidates.filter(x=>x.category===category).map(x=>x.itemType))];}
// Mirror the verified garment-detail scorer's fixed palette, not arbitrary model strings.
export const photoColors=Object.freeze(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor']);
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
  const color=row.color||null;
  if(color&&(row.category==='Uncategorized'||!photoColors.includes(color)))throw Error('Choose a matching primary color for photo '+(i+1)+'.');
  return {id:'photo-'+String(i+1).padStart(3,'0'),expectedCategory:row.category,expectedType:type,expectedColor:color};
 });
}
export function photoFailure(id,code){
 if(!safeId(id))throw Error('Invalid photo identifier.');
 return {id,error:errors.has(code)?code:'unknown'};
}
export function phonePhotoResult(id,result,elapsedMs){
 if(!safeId(id))throw Error('Invalid photo identifier.');
 const choice=result?.choices?.[0],category=choice?.category||null,type=choice?.itemType||null;
 // A recognized color is ONLY the original worker's two-pass verified detail,
 // and only when it confidently accepts the garment. No weak colour guessing.
 const color=result?.strong===true&&photoColors.includes(result?.details?.color)?result.details.color:null;
 if(typeof result?.strong!=='boolean'||category&&!categoryValid(category)||type&&type!=='Unknown'&&!photoTypes(category).includes(type)||
  (result.strong||result.categoryConfirmed)&&(!category||category==='Uncategorized'))return photoFailure(id,'invalid_result');
 const diagnostics={};
 for(const group of ['category','branch','overall','confirmation']){
  const entries=result.diagnostics?.[group];if(!Array.isArray(entries))continue;
  diagnostics[group]=entries.slice(0,3).filter(x=>categoryValid(x.category)&&Number.isFinite(x.score)&&x.score>=0&&x.score<=1).map(x=>({category:x.category,score:x.score,...(photoTypes(x.category).includes(x.type)?{type:x.type}:{})}));
 }
 return {id,prediction:{category,type,color},strong:result.strong,categoryConfirmed:result.categoryConfirmed===true,
  reason:reasons.has(result.reason)?result.reason:null,preprocessingRecovery:result.preprocessingRecovery===true,diagnostics,
  elapsedMs:Number.isFinite(elapsedMs)&&elapsedMs>=0?Math.round(elapsedMs):null};
}
export function scorePhonePhotos(labels,results,{release,indexHash}={}){
 // Rebuild the label snapshot so extra fields (filenames, notes, account data)
 // can never become part of a downloaded report.
 const expected=lockPhotoLabels(labels.map(x=>({category:x.expectedCategory,type:x.expectedType,color:x.expectedColor})));
 if(labels.some((x,i)=>x.id!==expected[i].id)||!Array.isArray(results)||results.length!==expected.length)throw Error('Incomplete photo test.');
 const byId=new Map();
 for(const r of results){if(!r||!safeId(r.id)||byId.has(r.id))throw Error('Duplicate or invalid photo result.');byId.set(r.id,r);}
 const summary={photos:expected.length,garments:0,categoryMatches:0,typesChecked:0,typeMatches:0,colorsChecked:0,colorMatches:0,colorPredicted:0,colorUnreported:0,incorrectAutomaticColors:0,automatic:0,review:0,uncertain:0,errors:0,incorrectAutomaticCategories:0,incorrectAutomaticTypes:0,negativePhotos:0,negativeRejected:0};
 const photos=expected.map(item=>{
  const raw=byId.get(item.id);if(!raw)throw Error('Missing photo result.');
  const safe=raw.error?photoFailure(item.id,raw.error):phonePhotoResult(item.id,{strong:raw.strong,categoryConfirmed:raw.categoryConfirmed,reason:raw.reason,diagnostics:raw.diagnostics,preprocessingRecovery:raw.preprocessingRecovery,details:{color:raw.prediction?.color},choices:raw.prediction?.category?[{category:raw.prediction.category,itemType:raw.prediction.type}]:[]},raw.elapsedMs);
  if(item.expectedCategory==='Uncategorized')summary.negativePhotos++;else{summary.garments++;if(item.expectedType)summary.typesChecked++;if(item.expectedColor)summary.colorsChecked++;}
  if(safe.error){summary.errors++;if(item.expectedColor)summary.colorUnreported++;return {...item,...safe,colorMatch:item.expectedColor?false:null};}
  const prediction=safe.prediction,identified=!!prediction.category&&prediction.category!=='Uncategorized';
  const categoryMatch=item.expectedCategory==='Uncategorized'?!identified&&!safe.strong&&!safe.categoryConfirmed:prediction.category===item.expectedCategory&&(safe.strong||safe.categoryConfirmed);
  const typeMatch=item.expectedType?categoryMatch&&prediction.type===item.expectedType:null;
  // Color is a separate optional field score; a missing verified detail is
  // abstention, not an incorrect confident color. Runtime errors stay counted.
  const colorMatch=item.expectedColor?safe.strong&&prediction.color===item.expectedColor:null;
  if(item.expectedColor){
   if(safe.strong&&prediction.color){summary.colorPredicted++;if(colorMatch)summary.colorMatches++;else summary.incorrectAutomaticColors++;}
   else summary.colorUnreported++;
  }
  if(item.expectedCategory==='Uncategorized'){if(categoryMatch)summary.negativeRejected++;}
  else{if(categoryMatch)summary.categoryMatches++;if(typeMatch)summary.typeMatches++;}
  if(safe.strong){summary.automatic++;if(!categoryMatch)summary.incorrectAutomaticCategories++;if(item.expectedType&&!typeMatch)summary.incorrectAutomaticTypes++;}
  else if(safe.categoryConfirmed)summary.review++;else summary.uncertain++;
  return {...item,...safe,categoryMatch,typeMatch,colorMatch};
 });
 return {format:'closet-current-phone-photo-check',version:1,
  release:/^[a-f0-9]{12}$/.test(release||'')?release:null,
  recognitionIndex:/^[a-f0-9]{64}$/.test(indexHash||'')?indexHash:null,
  summary,photos};
}


/**
 * P829 — accessible per-photo pilot feedback from the already privacy-sanitized
 * and independently labeled score receipt. Never use the raw uploaded file,
 * private filename or worker diagnostics to build a display string.
 *
 * A conservative abstention is not a wrong automatic category; a matching
 * broad category does not imply its subtype was recognized.
 */
export function phonePhotoTrialReadout(scored){
 if(!scored||!safeId(scored.id)||!categoryValid(scored.expectedCategory)||
    (scored.expectedType&&!photoTypes(scored.expectedCategory).includes(scored.expectedType)))
  throw Error('Invalid private-trial scored photo row.');
 if(scored.error)return {
  state:'error',title:'Could not check this photo',
  detail:'No clothing was saved. Start over to try again.'};
 const category=scored.prediction?.category;
 if(category&&!categoryValid(category))throw Error('Invalid private-trial prediction.');
 if(scored.expectedCategory==='Uncategorized'){
  if(scored.categoryMatch===true)return {
   state:'pass',title:'Non-clothing correctly rejected',
   detail:'No clothing category was accepted.'};
  if(scored.strong||scored.categoryConfirmed)return {
   state:'fail',title:'Incorrect clothing detection',
   detail:'The model accepted '+(category||'an unknown clothing category')+' for a non-clothing photo.'};
  return {state:'review',title:'Non-clothing needs review',
   detail:'The model did not confidently accept or reject this item.'};
 }
 if(!scored.strong&&!scored.categoryConfirmed)return {
  state:'review',title:'Needs manual review',
  detail:'No clothing category was confidently accepted. This is not an automatic match.'};
 if(scored.categoryMatch!==true)return {
  state:scored.strong?'fail':'review',
  title:scored.strong?'Wrong automatic category':'Category needs correction',
  detail:'Expected '+scored.expectedCategory+'; model proposed '+(category||'Unknown')+'.'};
 if(scored.expectedType&&scored.typeMatch!==true)return {
  state:scored.strong?'fail':'review',
  title:'Category matched; clothing type did not',
  detail:'Expected '+scored.expectedType+'; model proposed '+(scored.prediction?.type||'Unknown')+'.'};
 if(scored.expectedType&&scored.typeMatch===true)return {
  state:scored.strong?'pass':'review',
  title:scored.strong?'Category and type matched':'Category and type matched with review',
  detail:'Recognized '+category+' / '+scored.prediction?.type+'.'};
 return {
  state:scored.strong?'pass':'review',
  title:scored.strong?'Category matched':'Category matched with review',
  detail:'Recognized '+category+'. Clothing type was not checked.'};
}


/** P830: Compose an honest verified-color receipt on top of P829's category/type
 * verdict. Unknown/withheld color is never counted as a correct identification.
 * All displayed user input comes from the frozen 13-color enum.
 */
export function phonePhotoColorTrialReadout(scored){
 const base=phonePhotoTrialReadout(scored);
 if(scored?.expectedColor==null)return base;
 if(!photoColors.includes(scored.expectedColor)||scored.expectedCategory==='Uncategorized')
  throw Error('Invalid private-trial primary color.');
 const predicted=scored.prediction?.color;
 if(predicted!=null&&!photoColors.includes(predicted))
  throw Error('Invalid private-trial verified color.');
 if(scored.error)return base;
 if(!scored.strong||!predicted)return {
  ...base,state:base.state==='fail'?'fail':'review',
  detail:base.detail+' Primary color not verified (expected '+scored.expectedColor+').'};
 if(predicted!==scored.expectedColor)return {
  ...base,state:'fail',title:base.state==='pass'?'Incorrect automatic primary color':base.title,
  detail:base.detail+' Incorrect verified color: expected '+scored.expectedColor+', model reported '+predicted+'.'};
 return {...base,detail:base.detail+' Verified primary color '+predicted+' matched the label.'};
}
