// Research only: propose review-vs-autosave choices from ORIGINAL photo
// views already emitted by the unchanged benchmark local worker.
// This never mutates the customer recognizer, wardrobe, labels or masks.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {localCandidates} from '../public/local-catalog.mjs';

const catalog=new Map(localCandidates.map(x=>[x.label,x]));
export const policies=Object.freeze({
 conservative:Object.freeze({name:'conservative',minimumMatchingViews:3,minimumScore:.55,minimumMargin:.2}),
 balanced:Object.freeze({name:'balanced',minimumMatchingViews:2,minimumScore:.45,minimumMargin:.15})
});
const sensitiveCategories=new Set(['Shoes','Tops','Bottoms','Dresses','Outerwear']);
const copy=record=>JSON.parse(JSON.stringify(record));

export function proposeSubtypeReview(record,policy=policies.conservative){
 if(!record||!record.prediction||!record.strong||!sensitiveCategories.has(record.prediction.category))
  return {prediction:copy(record),changed:false,reason:'unchanged'};
 const frames=record.framingComparison;
 // A missing view is not independent corroboration. We never pretend it is.
 if(!Array.isArray(frames)||frames.length!==3||
    new Set(frames.map(x=>x.contentSize)).size!==3 ||
    frames.some(x=>![288,320,336].includes(x.contentSize)))
  return {prediction:reviewOnly(record,false),changed:true,reason:'incomplete_views'};
 const votes=frames.map(frame=>{
  const first=frame.top?.[0],second=frame.top?.[1],
   candidate=catalog.get(first?.label);
  return {category:candidate?.category||null,type:candidate?.itemType||null,
   score:first?.score||0,margin:(first?.score||0)-(second?.score||0)};
 });
 const matching=votes.filter(x=>
  x.category===record.prediction.category &&
  x.type===record.prediction.type &&
  x.score>=policy.minimumScore &&
  x.margin>=policy.minimumMargin).length;
 if(matching>=policy.minimumMatchingViews)
  return {prediction:copy(record),changed:false,reason:'independent_view_agreement',matching};
 // Review-only category is allowed only when all original-image views say
 // the same broad garment family. Never silently invent a subtype.
 const allCategory=votes.every(v=>v.category===record.prediction.category);
 return {prediction:reviewOnly(record,allCategory),changed:true,
  reason:allCategory?'type_review':'category_review',matching};
}
function reviewOnly(item,categoryConfirmed){
 const next=copy(item);
 next.strong=false;next.categoryConfirmed=categoryConfirmed;
 next.prediction=categoryConfirmed?
  {category:item.prediction.category,type:'Unknown'}:{category:null,type:null};
 next.preprocessingRecovery=false;
 next.reason=categoryConfirmed?'research_subtype_review':'research_category_review';
 return next;
}
function isSafeType(item,truth){
 const allowed=truth.acceptedTypes||[truth.expectedType];
 return item.prediction?.category===truth.expectedCategory &&
  allowed.includes(item.prediction?.type);
}
export function comparePolicy(label,manifest,results,policy){
 if(!Array.isArray(manifest)||!Array.isArray(results)||manifest.length!==results.length)
  throw Error('The policy trial requires a complete source-locked photo set');
 const gt=new Map(),res=new Map();
 for(const row of manifest){
  if(!row?.verified||!row.conditions?.includes('visual-review')||!row.id||gt.has(row.id))
   throw Error('Unverified or duplicate source label');
  gt.set(row.id,row);
 }
 for(const row of results){
  if(!row?.id||res.has(row.id)||row.error||typeof row.strong!=='boolean')
   throw Error('Missing, duplicate or failed model observation');
  res.set(row.id,row);
 }
 if([...gt.keys()].some(id=>!res.has(id))||res.size!==gt.size)
  throw Error('Model result IDs do not match locked originals');
 let previousSafe=0,previousWrong=0,nextSafe=0,nextWrong=0,
  correctSentForReview=0,incorrectSentForReview=0,changed=0;
 const decisions=[],proposals=[];
 for(const [id,truth] of gt){
  const before=res.get(id),trial=proposeSubtypeReview(before,policy),after=trial.prediction;
  if(trial.changed)changed++;
  // The same original-image policy applies to all items, including controls.
  const beforeSafe=before.strong&&isSafeType(before,truth);
  const afterSafe=after.strong&&isSafeType(after,truth);
  if(before.strong){if(beforeSafe)previousSafe++;else previousWrong++;}
  if(after.strong){if(afterSafe)nextSafe++;else nextWrong++;}
  if(before.strong&&!after.strong){
   if(beforeSafe)correctSentForReview++;else incorrectSentForReview++;
  }
  if(after.strong&&!before.strong)throw Error('Review policy cannot create automatic saves');
  proposals.push(after);
  decisions.push({id,expectedCategory:truth.expectedCategory,
   originalStrong:before.strong,proposedStrong:after.strong,
   proposedCategory:after.prediction.category,
   proposedType:after.prediction.type,
   changeReason:trial.reason,
   originalWasCorrect:before.strong?beforeSafe:null});
 }
 return {set:label,policy:policy.name,photos:gt.size,
  originalSafeAuto:previousSafe,originalIncorrectAuto:previousWrong,
  candidateSafeAuto:nextSafe,candidateIncorrectAuto:nextWrong,
  correctAutosSentToReview:correctSentForReview,
  incorrectAutosSentToReview:incorrectSentForReview,
  totalChangedToReview:changed,
  netWrongAutosPrevented:previousWrong-nextWrong,
  decisions,proposedResults:proposals,
  launchOrClassifierPromotionAuthorized:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2);
 if(args.length!==6)throw Error('Usage: reviewed-manifest reviewed-results holdout-manifest holdout-results fresh-manifest fresh-results');
 const sets=['reviewed-32','holdout-16','fresh-11'];
 const reports={};
 for(const [name,p] of Object.entries(policies)){
  reports[name]=sets.map((set,i)=>{
   const manifest=JSON.parse(fs.readFileSync(args[i*2],'utf8'));
   const results=JSON.parse(fs.readFileSync(args[i*2+1],'utf8'));
   return comparePolicy(set,manifest,results,p);
  });
 }
 const compact=Object.fromEntries(Object.entries(reports).map(([policy,rows])=>[
  policy,rows.map(({decisions,proposedResults,...info})=>info)
 ]));
 console.log('SUBTYPE_CONSENSUS_REAL_PHOTO_TRIAL '+JSON.stringify({
  evidence:'original-photo multi-frame real pinned model inference only',
  policies:compact,baselineModified:false,customerRecognizerModified:false,
  independentNewHoldoutValidated:false,pilotReleaseApproved:false
 }));
}
