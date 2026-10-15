#!/usr/bin/env node
// Guard genuinely new validation data against every image used in rule selection.
import {readFileSync,writeFileSync} from 'node:fs';
const [trainingManifest,validationManifest,outputFile]=process.argv.slice(2);
if(!trainingManifest||!validationManifest)throw Error('Usage: node scripts/check-independent-validation.mjs BASELINE_MANIFEST VALIDATION_MANIFEST [REPORT]');
const load=p=>{const rows=JSON.parse(readFileSync(p,'utf8'));if(!Array.isArray(rows))throw Error('Manifest must be an array.');return rows;};
const baseline=load(trainingManifest),validation=load(validationManifest);
const norm=x=>typeof x==='string'?x.trim().toLowerCase():'';
const keys=item=>[['id',item.id],['image',item.image],['sha256',item.sha256],['source',item.source],['sourceImage',item.sourceImage],['sourceObjectId',item.sourceObjectId]]
 .filter(([,v])=>norm(v)).map(([key,value])=>key+':'+norm(value));
const existing=new Set(baseline.flatMap(keys));const seen=new Set(),issues=[];
for(const item of validation){
 if(item.verified!==true||item.reviewStatus==='excluded-same-garment'||!item.expectedCategory||!item.expectedType)issues.push({id:item.id||null,issue:'unreviewed_or_unlabeled'});
 for(const key of keys(item)){
  if(existing.has(key))issues.push({id:item.id||null,issue:'baseline_overlap',key:key.split(':')[0]});
  if(seen.has(key))issues.push({id:item.id||null,issue:'duplicate_validation_image',key:key.split(':')[0]});
  seen.add(key);
 }
}
if(!validation.length)issues.push({issue:'empty_validation_set'});
const output={baselineCount:baseline.length,validationCount:validation.length,independent:issues.length===0,issues};
if(outputFile)writeFileSync(outputFile,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output));
if(issues.length)process.exitCode=1;
