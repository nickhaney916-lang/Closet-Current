// Independently score downloaded public CI JSON, never photos or inference calls.
import fs from 'node:fs';
import {join} from 'node:path';
import {auditRecognitionAdmission,REQUIRED_SETS} from './audit-recognition-admission.mjs';
const root=process.argv[2];if(!root)throw Error('Provide extracted public inference artifact directory');
const sources=new Map(JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json')).map(r=>[r.id,r]));
const sets={},rows=[];
for(const [i,set]of REQUIRED_SETS.entries()){
 const manifest=JSON.parse(fs.readFileSync(`benchmark/manifest-${set}.json`));
 const raw=JSON.parse(fs.readFileSync(join(root,['','holdout','fresh'][i],'results.json')));
 const old=JSON.parse(fs.readFileSync(`benchmark/regression-${set}.json`));
 const historical=new Map((Array.isArray(old)?old:old.results).map(r=>[r.id,r]));
 // Only identity/admission facts, no features, images or user fields.
 const results=raw.map(r=>({id:r.id,prediction:r.prediction,strong:r.strong,categoryConfirmed:r.categoryConfirmed,error:r.error,reason:r.reason}));
 sets[set]={manifest,results};
 for(const m of manifest){
  const r=results.find(r=>r.id===m.id);if(!r)throw Error('Missing '+m.id);
  const accepted=m.acceptedTypes||[m.expectedType],positive=m.expectedCategory!=='Uncategorized';
  rows.push({id:m.id,cohort:set,originalSHA256:sources.get(m.id).sha256,expectedCategory:m.expectedCategory,acceptedTypes:accepted,
   current:r,historical:historical.get(m.id),
   broadCategoryCorrect:positive?r.prediction.category===m.expectedCategory:null,
   categoryAbstained:positive&&!r.strong&&!r.categoryConfirmed,
   unsafeAutomaticSubtype:positive&&r.strong&&!accepted.includes(r.prediction.type),
   independentPhysicalTruth:false});
 }
}
const admission=auditRecognitionAdmission(sets,{historical:false});
const report={applicationSHA:'b824e2ef9d70b006e27c12063847e72f97463299',
 workflowRun:39904215239,artifactId:12480171310,
 evidence:'NEW_CI_INFERENCE_AGAINST_EXISTING_MANIFEST_LABELS_NOT_NEW_HUMAN_TRUTH',
 inferenceNetworkIsolation:'Model/runtime downloaded by existing workflow; not a network-denied offline inference claim',
 attribution:'Historical differences are not caused by odd-size fix: production 336/320 inputs proven pixel-identical to PR209 on all 59 sources in both browser engines',
 admission,rows};
const path=process.argv[3]||'/tmp/issue211-current-comparison.json';fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(admission));
