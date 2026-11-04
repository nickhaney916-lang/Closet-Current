import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scoreCategory,scoreColor,auditDataset,wilson} from '../research/independent-recognition-40/score.mjs';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
test('historical classification remains explicitly historical and scientifically failing',async()=>{
 const m=await json('benchmark/manifest-holdout-16.json'),r=(await json('benchmark/regression-holdout-16.json')).results,s=await json('benchmark/locked-photo-sources.json');
 const result=scoreCategory(m,r,s,'recorded-historical');
 assert.equal(result.totals.garments,13);
 assert.equal(result.totals.correctCategory,7);
 assert.equal(result.totals.automatic,6);
 assert.equal(result.totals.autoCorrectSubtype,3);
 assert.equal(result.totals.wrongAutomaticSubtype,3);
 assert.equal(result.totals.negativeRejected,3);
 assert.equal(result.scientificPass,false);
 for(const id of ['commons-0003','commons-0014','commons-0078'])assert.ok(result.errors.some(e=>e.id===id&&e.problem==='unsafe-automatic-subtype'));
 assert.throws(()=>scoreCategory(m,[...r,r[0]],s,'recorded-historical'),/Duplicate/);
 assert.throws(()=>scoreCategory(m,r.slice(1),s,'recorded-historical'),/Expected values/);
});
test('model output cannot relabel colors or be double counted',async()=>{
 const src=await json('research/recognition-category-color-39/color-manifest.json');
 const raw=src.map(x=>({id:x.id,expected:x.color,split:x.split,baseline:x.color,baselineAuto:true,candidate:'Gray',candidateAuto:false}));
 const result=scoreColor(src,raw,'candidate');
 assert.equal(result.n,35);assert.equal(result.automaticAccepted,0);assert.equal(result.automaticPrecisionPercent,null);assert.equal(result.scientificPass,false);
 assert.throws(()=>scoreColor(src,raw.map((x,i)=>i?x:{...x,expected:'changed'}),'candidate'),/Retargeted/);
 assert.throws(()=>scoreColor(src,raw.map((x,i)=>i?x:{...x,candidateAuto:true}),'candidate'),/review only/);
 assert.throws(()=>scoreColor(src,[...raw,raw[0]],'candidate'),/Duplicate/);
});
test('44 unique source SHA fixture labels have ZERO independently adjudicated human labels',async()=>{
 const report=auditDataset(await json('research/independent-recognition-40/dataset-manifest.json'));
 assert.equal(report.uniquePhotographIDs,44);
 assert.equal(report.categoryLabels,16);
 assert.equal(report.colorLabels,35);
 assert.equal(report.independentlyAdjudicated,0);
 assert.equal(report.certification,false);
 assert.ok(report.licensingMetadataGaps.length>0);
});
test('uncertainty intervals never imply precision with zero accepted',()=>{assert.equal(wilson(0,0),null);const interval=wilson(7,13);assert.ok(interval[0]<55&&interval[1]>55);});
