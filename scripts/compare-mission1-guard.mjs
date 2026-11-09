#!/usr/bin/env node
/**
 * Mission1 — compare ACTUAL before/after FashionCLIP local worker predictions,
 * on identical SHA-locked public JPEGs. This is an exposed diagnostic set,
 * NEVER an unseen independent-human accuracy claim or release approval.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const groups=['curated','holdout','fresh'];
const fail=why=>{throw Error('MISSION1_CONFUSION_COMPARISON: '+why);};
const list=x=>Array.isArray(x)?x:x?.results;
const positive=x=>x.expectedCategory!=='Uncategorized';
const accepted=(m,r)=>!!r.strong&&r.prediction?.category===m.expectedCategory&&
 (m.acceptedTypes||[m.expectedType]).includes(r.prediction?.type);
export function compareMission1Guard(manifests,baseline,candidate){
 if(!manifests||!baseline||!candidate)fail('three matched manifest and inference sets required');
 const summary={totalPhotos:0,garmentPhotos:0,sourceSets:3,
  before:{automatic:0,acceptedAutomatic:0,unsafeAutomatic:0},
  after:{automatic:0,acceptedAutomatic:0,unsafeAutomatic:0},
  blockedCorrectAutomatic:0,blockedUnsafeAutomatic:0,
  unexpectedChangedNonriskOutcomes:0,negativesRejected:0,errors:0};
 const cases=[],breakdown={};
 for(const group of groups){
  const manifest=manifests[group],before=list(baseline[group]),after=list(candidate[group]);
  if(!Array.isArray(manifest)||!Array.isArray(before)||!Array.isArray(after)||
     manifest.length!==({curated:32,holdout:16,fresh:11}[group])||
     manifest.length!==before.length||before.length!==after.length)
   fail('incomplete real photo inference '+group);
  const index=arr=>{
   const map=new Map();
   for(const r of arr){
    if(!r||typeof r.id!=='string'||!r.id||map.has(r.id))fail('wrong/duplicate output');
    map.set(r.id,r);
   }
   return map;
  };
  const b=index(before),a=index(after);
  const scores={photos:0,garments:0,beforeUnsafe:0,afterUnsafe:0,
   correctAutoHeld:0,correctAutoBlocked:0,unsafeAutoBlocked:0};
  for(const m of manifest){
   const p=b.get(m.id),n=a.get(m.id);
   if(!p||!n||m.mode!=='single')fail('missing real result '+m?.id);
   if(p.error||n.error)fail('model runtime or image error '+m.id);
   if(!['boolean'].includes(typeof p.strong)||typeof n.strong!=='boolean')
    fail('missing automatic-index status');
   if(!p.prediction||!n.prediction)fail('missing classifier prediction');
   if(!positive(m)){
    if(p.strong||n.strong||p.categoryConfirmed||n.categoryConfirmed||
       p.prediction.category||n.prediction.category)
     fail('nonclothing wrongly indexed as garments '+m.id);
    summary.negativesRejected++;continue;
   }
   scores.photos++;scores.garments++;summary.garmentPhotos++;
   const oldRight=accepted(m,p),newRight=accepted(m,n);
   const oldWrong=p.strong&&!oldRight, newWrong=n.strong&&!newRight;
   if(p.strong){summary.before.automatic++;if(oldRight)summary.before.acceptedAutomatic++;
    if(oldWrong){summary.before.unsafeAutomatic++;scores.beforeUnsafe++;}}
   if(n.strong){summary.after.automatic++;if(newRight)summary.after.acceptedAutomatic++;
    if(newWrong){summary.after.unsafeAutomatic++;scores.afterUnsafe++;}}
   const guarded=!!n.diagnostics?.mission1CrossFrame?.required;
   if(n.strong&&!p.strong)fail('guard must never invent automatic recognition '+m.id);
   if(n.strong&&(n.prediction.category!==p.prediction.category||
     n.prediction.type!==p.prediction.type))
    fail('guard must never silently mutate an automatic subtype '+m.id);
   if(!p.strong){
    if(p.prediction.category!==n.prediction.category||
       p.prediction.type!==n.prediction.type||
       p.categoryConfirmed!==n.categoryConfirmed)
     fail('guard unexpectedly changed an originally unrecognized photo '+m.id);
   }
   if(p.strong&&!n.strong){
    if(!guarded||n.categoryConfirmed!==true||n.prediction.type!=='Unknown'||
       n.prediction.category!==p.prediction.category)
     fail('guard did not safely preserve broad category-only review '+m.id);
    if(oldWrong){summary.blockedUnsafeAutomatic++;scores.unsafeAutoBlocked++;}
    else{summary.blockedCorrectAutomatic++;scores.correctAutoBlocked++;}
   }
   if(p.strong&&!guarded&&p.prediction.type!==n.prediction.type)
    fail('non-risk auto classification unexpectedly changed '+m.id);
   if(oldRight&&newRight)scores.correctAutoHeld++;
   cases.push({id:m.id,set:group,expected:m.expectedCategory+' / '+m.expectedType,
    initialAutoType:p.strong?p.prediction.type:null,
    finalAutoType:n.strong?n.prediction.type:null,
    reviewed:n.categoryConfirmed===true,
    initiallyCorrectAutomatic:oldRight,
    ultimatelyCorrectAutomatic:newRight,
    initialWrongAutomatic:oldWrong,
    finalWrongAutomatic:newWrong,
    extraSourceViews:n.diagnostics?.mission1CrossFrame?.sourceFramesCompared??0,
    gated:guarded,
    verifiedSourceFraming:n.diagnostics?.mission1CrossFrame?.verified===true});
  }
  summary.totalPhotos+=manifest.length;
  breakdown[group]=scores;
 }
 if(summary.totalPhotos!==59||summary.garmentPhotos!==56||summary.negativesRejected!==3)
  fail('source accounting mismatch');
 if(summary.after.unsafeAutomatic>summary.before.unsafeAutomatic)
  fail('automatically indexed wrong subtypes increased');
 return {summary,breakdown,cases,
  same59ExposedPublicPhotos:true,independentlyUnseenHoldout:false,
  firstModelAndExtraFramingsShareWeights:true,
  humanGroundTruthIndependentlyAdjudicated:false,
  researchOnly:true,familyAlpha:'HOLD'};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const [,,a,b,c,d,e,f,g,h,i]=process.argv;
 if(!i){console.error('Usage: node scripts/compare-mission1-guard.mjs CURATED_MANIFEST HOLDOUT_MANIFEST FRESH_MANIFEST BASE_CURATED BASE_HOLDOUT BASE_FRESH NEW_CURATED NEW_HOLDOUT NEW_FRESH');process.exit(2);}
 const read=p=>JSON.parse(readFileSync(p,'utf8'));
 const report=compareMission1Guard(
  {curated:read(a),holdout:read(b),fresh:read(c)},
  {curated:read(d),holdout:read(e),fresh:read(f)},
  {curated:read(g),holdout:read(h),fresh:read(i)}
 );
 console.log(JSON.stringify(report,null,2));
 if(report.summary.after.unsafeAutomatic>=report.summary.before.unsafeAutomatic)
  process.exitCode=1;
}
