// Offline, strictly aggregate diagnostics over the existing original-first worksheet.
// Never a physical-device, independent-labeling, hosted-staging or release certification.
import {validateTrial,platforms,scenes,slots} from './linked-phone-garment-evidence.mjs';
const families=Object.freeze(['shoes','dresses','shorts-vs-skirts','jackets-and-layers','whole-outfit']);
const familyOf=scene=>scene==='whole-outfit'?'whole-outfit':/^(sneakers|boots|sandals)$/.test(scene)?'shoes':scene.startsWith('dress-')?'dresses':/^(shorts-|skirt-)/.test(scene)?'shorts-vs-skirts':'jackets-and-layers';
const issueKeys=Object.freeze(['not-recorded','not-saved','missing-photo','pixelated-photo','wrong-initial-category','wrong-initial-color','wrong-saved-category','wrong-saved-color']);
const title={shoes:'Shoes',dresses:'Dresses','shorts-vs-skirts':'Shorts vs skirts','jackets-and-layers':'Jackets and layers','whole-outfit':'Whole outfits'};
const issueTitle={
 'not-recorded':'Missing observations',
 'not-saved':'Item not saved',
 'missing-photo':'Missing saved image',
 'pixelated-photo':'Pixelated saved image',
 'wrong-initial-category':'Incorrect initial garment category',
 'wrong-initial-color':'Incorrect initial garment color',
 'wrong-saved-category':'Incorrect saved garment category',
 'wrong-saved-color':'Incorrect saved garment color'
};
const priority={'not-recorded':8,'not-saved':7,'missing-photo':6,'wrong-initial-category':5,'wrong-saved-category':4,'pixelated-photo':3,'wrong-initial-color':2,'wrong-saved-color':1};
function countRows(rows){
 const measured=rows.filter(r=>r.phase==='recorded');
 const count=key=>measured.filter(r=>key==='not-saved'?r.savedCategory==='not_saved':
  key==='missing-photo'?r.savedPhoto==='missing':
  key==='pixelated-photo'?r.savedPhoto==='pixelated':
  key==='wrong-initial-category'?r.modelCategory!==r.truthCategory:
  key==='wrong-initial-color'?r.modelColor!==r.truthColor:
  key==='wrong-saved-category'?r.savedCategory!=='not_saved'&&r.savedCategory!==r.truthCategory:
  key==='wrong-saved-color'?r.savedColor!=='not_saved'&&r.savedColor!==r.truthColor:false).length;
 const issues=Object.fromEntries(issueKeys.map(key=>[key,key==='not-recorded'?rows.length-measured.length:count(key)]));
 const usableCorrect=measured.filter(r=>r.savedCategory===r.truthCategory&&r.savedColor===r.truthColor&&r.savedPhoto==='clear').length;
 const firstCorrect=measured.filter(r=>r.modelCategory===r.truthCategory&&r.modelColor===r.truthColor).length;
 return {required:rows.length,recorded:measured.length,unrecorded:rows.length-measured.length,
  initialCategoryAndColorCorrect:firstCorrect,usableCorrectlySaved:usableCorrect,
  initialExactPercentOfRecorded:measured.length?Math.round(10000*firstCorrect/measured.length)/100:null,
  usableSavedPercentOfRecorded:measured.length?Math.round(10000*usableCorrect/measured.length)/100:null,
  issues};
}
export function summarizePhoneTriage(value){
 const record=validateTrial(value);
 const byPlatform=platforms.map(platform=>{
  const rows=record.rows.filter(r=>r.id.startsWith(platform+'/'));
  const originalScenesRecorded=scenes.filter(scene=>scene.garments.every((_,i)=>
   record.rows.some(r=>r.id===platform+'/'+scene.id+'/'+(i+1)&&r.phase==='recorded'))).length;
  return {platform,originalScenesRecorded,requiredOriginalScenes:scenes.length,...countRows(rows)};
 });
 const byFamily=families.map(family=>{
  const ids=new Set(slots.filter(s=>familyOf(s.scene)===family).map(s=>s.id));
  return {family,label:title[family],...countRows(record.rows.filter(r=>ids.has(r.id)))};
 });
 const all=countRows(record.rows);
 const observedIssues=byFamily.flatMap(group=>issueKeys.filter(key=>group.issues[key]>0).map(key=>({
  family:group.family,label:group.label,kind:key,issue:issueTitle[key],
  count:group.issues[key],outOfRequired:group.required,
  outOfRecorded:key==='not-recorded'?null:group.recorded,
  score:priority[key]*group.issues[key]
 }))).sort((a,b)=>b.score-a.score||priority[b.kind]-priority[a.kind]||
  families.indexOf(a.family)-families.indexOf(b.family));
 return {
  format:'closet-current-phone-triage-aggregate',
  version:1,appRelease:record.appRelease,
  source:'unverified-operator-entered-fixed-choice-worksheet',
  totalOriginalScenes:scenes.length*platforms.length,
  completedOriginalScenes:byPlatform.reduce((n,p)=>n+p.originalScenesRecorded,0),
  totals:all,byPlatform,byFamily,
  prioritizedIssues:observedIssues,
  verification:{physicalAndroidVerified:false,physicalIPhoneVerified:false,
   independentlyReviewedOriginalsVerified:0,verifiedRecognitionAccuracy:null,
   cryptographicallyLinkedOriginals:false,hostedStagingVerified:false,
   productionPromotion:'BLOCKED'}
 };
}
export function parsePhoneTriageSource(text){
 if(typeof text!=='string'||text.length>131072)throw Error('Invalid fixed-choice offline worksheet');
 let v;
 try{v=JSON.parse(text);}catch{throw Error('Invalid fixed-choice offline worksheet');}
 return summarizePhoneTriage(v);
}
