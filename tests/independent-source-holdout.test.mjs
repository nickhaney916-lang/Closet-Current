import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateRows,evaluate,blindManifest,digest,compareAgreement} from '../scripts/independent-source-holdout.mjs';
const rows=()=>JSON.parse(fs.readFileSync('benchmark/independent-source-holdout/candidates.json')).photos.map((r,i)=>({...r,verified:true,sha256:digest(String(i)),visualReview:{reviewer:'assistant',beforeInference:true,note:'Synthetic test evidence, not a real photo approval'}}));
const results=rows=>rows.map(r=>({id:r.id,prediction:{category:r.expectedCategory,type:r.acceptedTypes[0]||'Unknown'},strong:r.family!=='negative',categoryConfirmed:false}));
test('actual measurement remains bound to pre-inference labels and every original source hash',()=>{
 const dir='benchmark/independent-source-holdout/';
 const measurement=JSON.parse(fs.readFileSync(dir+'measurement-39538590277.json'));
 const original=fs.readFileSync(dir+'locked.json');
 assert.equal(digest(original),measurement.lockedManifestSha256,'Labels changed after inference');
 assert.equal(digest(JSON.stringify(measurement.report,null,2)+'\n'),measurement.rawReportSha256,'Stored report differs from original measured output');
 const locked=JSON.parse(original),source=new Map(locked.photos.map(r=>[r.id,r.sha256]));
 assert.equal(measurement.report.perPhoto.length,source.size);
 assert.equal(new Set(measurement.report.perPhoto.map(r=>r.id)).size,source.size);
 for(const r of measurement.report.perPhoto)assert.equal(r.sourceSha256,source.get(r.id));
 assert.equal(measurement.report.independentHumanGoldLabels,false);
 assert.equal(measurement.report.productionPromotion,'BLOCKED');
});
test('neutral inference manifest contains no labels or source-title hints',()=>{
 const blind=blindManifest(rows());assert.deepEqual(Object.keys(blind[0]),['id','image','mode']);assert.ok(!JSON.stringify(blind).includes('expectedCategory'));
});
test('same source through another encoding or thumbnail path cannot enter as a new holdout',()=>{
 const a=rows();assert.throws(()=>validateRows(a,{locked:true,prior:[{downloadUrl:a[0].downloadUrl+'?old=1'}]}),/leakage/);
 a[0].downloadUrl=a[0].downloadUrl.replace('/commons/','/commons/thumb/');assert.throws(()=>validateRows(a),/Thumbnail/);
});
test('duplicate IDs and identical source bytes fail closed',()=>{
 const a=rows();a[1].id=a[0].id;a[1].image=a[0].image;assert.throws(()=>validateRows(a),/Duplicate/);
 const b=rows();b[1].sha256=b[0].sha256;assert.throws(()=>validateRows(b,{locked:true}),/Duplicate image/);
});
test('missing visual evidence, hash and licensing cannot be marked verified',()=>{
 for(const mutate of [a=>a[0].visualReview=null,a=>a[0].sha256='bad',a=>a[0].attribution.author='']){
  const a=rows();mutate(a);assert.throws(()=>validateRows(a,{locked:true}));
 }
});
test('wrong strong shoe subtype and accepted clothing sculpture count as unsafe predictions',()=>{
 const a=rows(),r=results(a);r[0].prediction.type='Ankle boots';r.at(-1).prediction={category:'Dresses',type:'Formal dress'};r.at(-1).strong=true;
 const report=evaluate(a,r);assert.equal(report.unsafeAutos,2);assert.equal(report.negativeFalseAutos,1);assert.equal(report.productionPromotion,'BLOCKED');
});
test('abstention reduces full-set coverage instead of inflating precision',()=>{
 const a=rows(),r=results(a);r[0].prediction={category:null,type:null};r[0].strong=false;
 const report=evaluate(a,r);assert.equal(report.familyCorrect,11);assert.equal(report.positiveCount,12);assert.equal(report.strongAutos,11);
});
test('missing duplicate extra and runtime-failed predictions cannot yield a valid score',()=>{
 const a=rows();assert.throws(()=>evaluate(a,results(a).slice(1)),/Incomplete/);
 const r=results(a);r[1]=r[0];assert.throws(()=>evaluate(a,r),/Duplicate/);
 const e=results(a);e[0].error='timeout';assert.throws(()=>evaluate(a,e),/Inference error/);
});
test('coarse boot family does not silently approve fine subtype accuracy or model promotion',()=>{
 const a=rows(),report=evaluate(a,results(a));assert.equal(report.familyCorrect,12);
 assert.equal(report.independentHumanGoldLabels,false);assert.equal(report.productionPromotion,'BLOCKED');
});
test('invalid catalog mappings and malformed automatic flags fail closed',()=>{
 const a=rows();a[0].acceptedTypes=['Jumpsuit'];assert.throws(()=>validateRows(a),/Unscorable/);
 const b=rows(),r=results(b);r[0].categoryConfirmed=true;assert.throws(()=>evaluate(b,r),/Malformed strong/);
});
test('partial negative category suggestions are reported even without a strong automatic prediction',()=>{
 const a=rows(),r=results(a);r.at(-1).prediction={category:'Dresses',type:'Unknown'};r.at(-1).categoryConfirmed=true;
 const report=evaluate(a,r);assert.equal(report.negativeFalseAutos,0);assert.equal(report.negativeEmittedClothing,1);
});
test('agreement experiment counts lost correct predictions and unchanged wrong predictions separately',()=>{
 const a=rows(),r=results(a),second=results(a);r[0].prediction.type='Ankle boots';second[0].prediction.type='Ankle boots';
 second[1].prediction.type='Tall boots';const report=compareAgreement(a,r,second);
 assert.deepEqual(report.agreementExperiment,{blockedWrong:0,blockedCorrect:1,remainingWrong:1,decision:'NOT_PROMOTABLE',reason:'Discovery set only; no independent human gold or untouched confirmation set'});
});
