#!/usr/bin/env node
/**
 * RECOG60 exact licensed-JPEG + frozen dataset + independent human color truth.
 * Generates blank A/B independent human review templates; DOES NOT invent labels.
 * Does not execute a model or claim new classification accuracy.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {auditRecognitionEvidence60,wilsonInterval60} from '../research/recognition-ground-truth-gate-60/ground-truth-gate.mjs';
const out='benchmark/recognition-ground-truth-gate-60';
const parse=async path=>JSON.parse(await readFile(path,'utf8'));
const sets={
 development:await parse('benchmark/manifest-reviewed-32.json'),
 validation:await parse('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':await parse('benchmark/manifest-holdout-16.json')
};
const sourceRows=await parse('benchmark/locked-photo-sources.json');
let checked=0,photoBytes=0,dimensions=[];
for(const split of Object.keys(sets))for(const row of sets[split]){
 const src=sourceRows.find(x=>x.id===row.id);
 if(!src||row.image!==src.image)throw Error('RECOG60 missing source photo '+row.id);
 const bytes=await readFile('benchmark/fixtures/'+row.image);
 const sha256=createHash('sha256').update(bytes).digest('hex');
 if(sha256!==src.sha256)throw Error('RECOG60 source JPEG SHA-256 mismatch '+row.id);
 const m=await sharp(bytes).metadata();
 if(m.format!=='jpeg'||!m.width||!m.height)throw Error('RECOG60 not genuine decodable JPEG '+row.id);
 if(!src.attribution?.source||!src.attribution?.license||!src.verified)throw Error('RECOG60 missing rights '+row.id);
 checked++;photoBytes+=bytes.byteLength;
 dimensions.push({id:row.id,split,sha256,width:m.width,height:m.height,license:src.attribution.license,
  source:src.attribution.source});
}
const args=process.argv.slice(2);
const flag=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const humanPath=flag('--human-annotations');
const predictionsPath=flag('--predictions');
if(args.length&&(!((!humanPath&&!predictionsPath)||args.every((x,i)=>i%2===0?
 ['--human-annotations','--predictions'].includes(x):typeof x==='string'&&x.length>0))))
 throw Error('RECOG60 unsupported arguments');
const human=humanPath?await parse(humanPath):{};
const predictions=predictionsPath?await parse(predictionsPath):null;
const result=auditRecognitionEvidence60({sets,sourceRows,adjudications:human,predictions});
if(result.counts.sourceRows!==checked||result.counts.uniqueSHA256!==checked)
 throw Error('RECOG60 source count mismatch');
const recordedPriorPilot={
 kind:'HISTORICAL_PROVISIONAL_EVIDENCE_NOT_REMEASURED',
 sourcePR:'https://github.com/nickhaney916-lang/Closet-Current/pull/607',
 sourceCommit:'fe2930f307551453d4f32424d6dc6a4999dc42d7',
 sourceRun:'https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41957999315',
 lockedGarments:13,lockedNegatives:3,
 baseline:{broadCategory:{correct:9,total:13},exactSubtype:{correct:4,total:13},
  nonGarmentRejection:{correct:2,total:3},primaryColor:null},
 proposedPromptEnsemble:{broadCategory:{correct:8,total:13},exactSubtype:{correct:3,total:13},
  nonGarmentRejection:{correct:2,total:3},primaryColor:null},
 warning:'Single-file visually reviewed labels; no independent two-person adjudication and no human primary-color ground truth. These are NOT current remeasured or independently certified model accuracies.'
};
for(const m of ['baseline','proposedPromptEnsemble'])for(const k of ['broadCategory','exactSubtype','nonGarmentRejection']){
 const a=recordedPriorPilot[m][k];
 a.wilson95Provisional=wilsonInterval60(a.correct,a.total);
}
const payload={...result,photoEvidence:{
 sha256Verified:checked,decodableJPEG:checked,photoBytes,rightsMapped:checked,
 noOriginalPhotosEmbedded:true,
 dimensions},
 recordedPriorPilot};
await mkdir(out,{recursive:true});
await writeFile(out+'/acceptance-report.json',JSON.stringify(payload,null,2)+'\n');
for(const letter of ['A','B']){
 const rows=dimensions.map(d=>({
  id:d.id,split:d.split,sourceSHA256:d.sha256,
  source:d.source,license:d.license,
  reviewerId:null,independent:false,method:null,reviewedAt:null,
  category:null,itemType:null,primaryColor:null,secondaryColor:null,
  note:'BLANK human annotation request. No answer or independent review has been supplied.'
 }));
 await writeFile(out+'/reviewer-'+letter+'-UNSIGNED-template.json',JSON.stringify(rows,null,2)+'\n');
}
console.log('RECOG60 EXACT-SOURCE/JPEG RIGHTS GATE: '+JSON.stringify({
 actualPhotoSHAVerified:checked,partitions:result.counts,
 historicalBaselineCategory:'9/13 provisional',historicalBaselineSubtype:'4/13 provisional',
 independentlyVerifiedPrimaryColors:0,scientificVerdict:result.scientificVerdict,
 reasons:result.failures,templates:'two blank independent reviewer JSON manifests'}));
if(result.scientificVerdict==='PASS')throw Error('RECOG60 source 59 under minimum sample cannot claim PASS');
