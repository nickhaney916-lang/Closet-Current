/**
 * Family Alpha issue #255 — read-only, ARCHIVED-metadata review-burden audit.
 * Does not run the classifier, fetch photo pixels, use credentials or deploy.
 * Strong inference is NOT an actual automatic closet save (color, mask, owner,
 * dedupe and storage gates are not represented in this archived source).
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const BENCHMARK_PIN='d0ff131a4e5617e1a3f4fcfb40d00602fdce9833'; // #280
export const COHORTS=Object.freeze(['reviewed-32','holdout-16','fresh-11']);
const archivePath='benchmark/assignment233/baseline-226.json';
const manifestPath=k=>'benchmark/manifest-'+k+'.json';
const json=s=>JSON.parse(s);
function pinned(path){
 assert.match(path,/^benchmark\/[a-zA-Z0-9/.-]+\.json$/);
 return execFileSync('git',['show',BENCHMARK_PIN+':'+path],{
  encoding:'utf8',maxBuffer:5*1024*1024,stdio:['ignore','pipe','ignore']
 });
}
export function loadPinnedArchive({root='.'}={}){
 const source=json(pinned(archivePath));
 assert.equal(source.sourceCommit,'b06f606b0cbd4ecf9e10875a8b6188111a069011');
 assert.equal(source.workflowRun,39991911492);
 assert.equal(source.artifactSHA256,'c67d25bfdf2818332c959a4eb34cb054ffe6e3e02041bde8ea8b7fcc5cb31fd4');
 assert.deepEqual(Object.keys(source.cohorts).sort(),[...COHORTS].sort());
 const labels=[],predictions=[];
 for(const key of COHORTS){
  const path=manifestPath(key);
  const exact=pinned(path);
  const local=readFileSync(root+'/'+path,'utf8');
  assert.equal(local,exact,'Current category labels differ from pinned benchmark: '+path);
  const m=json(exact);
  assert.equal(m.length,Number(key.split('-')[1]));
  labels.push(...m);predictions.push(...source.cohorts[key]);
 }
 return {labels,predictions,provenance:{
  kind:'archived verified #226 model decisions, re-scored from #280 immutable metadata',
  benchmarkCommit:BENCHMARK_PIN,
  sourceCommit:source.sourceCommit,sourceWorkflowRun:source.workflowRun,
  artifactSHA256:source.artifactSHA256,
  unchangedOriginalPhotoHashesReported:59,
  inferenceExecutedNow:false,
  realPhotosAccessedNow:false,actualAutoSavesMeasured:false
 }};
}
const isHeldByStagingPolicy=r=>
 r.prediction.category==='Outerwear'||
 (r.prediction.category==='Tops'&&r.prediction.type==='Tunic');

export function scoreReviewBurden(labels,predictions){
 assert.ok(Array.isArray(labels)&&Array.isArray(predictions),'Two arrays required');
 const cohort=new Map();
 for(const m of labels){
  assert.equal(typeof m.id,'string');
  assert.ok(m.id.length>0&&!cohort.has(m.id),'Missing or duplicate labeled photo');
  assert.equal(m.mode,'single','Single-garment original-photo benchmark only');
  assert.equal(m.verified,true,'Human-confirmed labels required');
  assert.equal(typeof m.expectedCategory,'string');
  if(m.expectedCategory!=='Uncategorized')assert.equal(typeof m.expectedType,'string');
  cohort.set(m.id,m);
 }
 assert.equal(labels.length,predictions.length,'Incomplete benchmark outcomes');
 const ids=new Set(),rows=[];
 for(const r of predictions){
  assert.ok(r&&typeof r.id==='string'&&cohort.has(r.id)&&!ids.has(r.id),'Unknown/duplicate inference ID');
  ids.add(r.id);
  assert.equal(typeof r.strong,'boolean','Strong status is required');
  assert.equal(typeof r.categoryConfirmed,'boolean','Category-only status is required');
  const m=cohort.get(r.id),p=r.prediction||{};
  if(r.strong){
   assert.equal(typeof p.category,'string','Strong result missing category');
   assert.equal(typeof p.type,'string','Strong result missing type');
  }
  if(r.error&&r.strong)throw Error('Errored inference may not be strong');
  if(r.strong&&r.categoryConfirmed)throw Error('Strong and category-only are mutually exclusive');
  const isNegative=m.expectedCategory==='Uncategorized';
  const acceptedTypes=Array.isArray(m.acceptedTypes)&&m.acceptedTypes.length?m.acceptedTypes:[m.expectedType];
  const correctSubtype=!r.error&&p.category===m.expectedCategory&&acceptedTypes.includes(p.type);
  const correctCategory=!r.error&&p.category===m.expectedCategory;
  const candidate=!isNegative&&r.strong&&!r.error;
  const held=candidate&&isHeldByStagingPolicy(r);
  rows.push({id:r.id,group:m.expectedCategory,expectedType:m.expectedType,
   category:p.category??null,type:p.type??null,strong:candidate,
   categoryOnly:!isNegative&&r.categoryConfirmed&&!r.strong&&!r.error,
   correctCategory,correctSubtype,held,holdReason:held?
    p.category==='Outerwear'?'outerwear_original_review':'tunic_dress_original_review':null,
   negative:isNegative});
 }
 const positives=rows.filter(r=>!r.negative),strong=positives.filter(r=>r.strong),
  held=strong.filter(r=>r.held),remaining=strong.filter(r=>!r.held);
 const byType={};
 for(const x of held){
  const k=x.holdReason;const group=byType[k]||={count:0,correctSubtype:0,wrongSubtype:0,ids:[]};
  group.count++;group.correctSubtype+=Number(x.correctSubtype);
  group.wrongSubtype+=Number(!x.correctSubtype);group.ids.push(x.id);byType[k]=group;
 }
 const p2=n=>Number((100*n/positives.length).toFixed(2));
 return {
  sourceScope:'historical #226 strong *decisions* only, NOT actual wardrobe saves',
  positives:positives.length,negatives:rows.length-positives.length,
  correctCategory:positives.filter(r=>r.correctCategory).length,
  categoryAccuracyPercent:p2(positives.filter(r=>r.correctCategory).length),
  inferredStrongBefore:strong.length,
  inferredStrongAfter:remaining.length,
  strongSubtypeCorrectBefore:strong.filter(r=>r.correctSubtype).length,
  strongSubtypeWrongBefore:strong.filter(r=>!r.correctSubtype).length,
  strongSubtypeCorrectAfter:remaining.filter(r=>r.correctSubtype).length,
  strongSubtypeWrongAfter:remaining.filter(r=>!r.correctSubtype).length,
  hypotheticalAdditionalManualReviews:held.length,
  reviewedOrUnresolvedBefore:positives.length-strong.length,
  reviewedOrUnresolvedAfter:positives.length-remaining.length,
  heldByRule:byType,
  categoryOnly:positives.filter(r=>r.categoryOnly).length,
  unclassified:positives.filter(r=>!r.strong&&!r.categoryOnly).length,
  realPhotoColorAccuracy:null,
  currentModelAccuracy:null,
  actualSavedWardrobeItems:null,
  note:'One archived reused-photo cohort; color, original-region quality, account safety and real phone saves were NOT evaluated. This counterfactual applies only to historical strong decisions.'
 };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {labels,predictions,provenance}=loadPinnedArchive();
 const report={...scoreReviewBurden(labels,predictions),provenance,releaseGate:'HOLD',deploymentAllowed:false};
 assert.equal(report.positives,56);
 assert.equal(report.negatives,3);
 assert.equal(report.correctCategory,47);
 assert.equal(report.inferredStrongBefore,35);
 assert.equal(report.inferredStrongAfter,32);
 assert.equal(report.hypotheticalAdditionalManualReviews,3);
 assert.equal(report.strongSubtypeWrongBefore,0);
 assert.equal(report.strongSubtypeWrongAfter,0);
 console.log('FAMILY_ALPHA_ARCHIVED_REVIEW_BURDEN_HOLD '+JSON.stringify(report,null,2));
}
