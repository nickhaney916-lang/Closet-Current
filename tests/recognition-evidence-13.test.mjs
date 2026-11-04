import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreRecognitionEvidence13 as score} from '../scripts/audit-recognition-evidence-13.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read('benchmark/manifest-holdout-16.json');
const source=read('benchmark/locked-photo-sources.json');
const historical=read('benchmark/regression-holdout-16.json').results;
const evalRows=(rows=historical,mode='historical-baseline')=>
 score(manifest,rows,source,{sourceMode:mode});

test('historical 16 real originals are reported accurately, never renamed a fresh run',()=>{
 const r=evalRows();
 assert.equal(r.fixtureCount,16);
 assert.equal(r.totals.garments,13);
 assert.equal(r.totals.negatives,3);
 assert.equal(r.totals.correctCategories,7);
 assert.equal(r.totals.autoAccepted,6);
 assert.equal(r.totals.autoCorrectType,3);
 assert.equal(r.totals.autoWrongType,3);
 assert.equal(r.totals.correctNegativeRejections,3);
 assert.equal(r.totals.categoryReview,1);
 assert.equal(r.totals.abstained,6);
 assert.equal(r.automaticSubtypePrecisionPercent,50);
 assert.deepEqual(r.perImage.filter(x=>x.outcome==='unsafe-automatic').map(x=>x.id),
  ['commons-0003','commons-0014','commons-0078']);
 assert.equal(r.qualityGatePassed,false);
 assert.equal(r.sourceMode,'historical-baseline');
 assert.match(r.workerMode,/historical/);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.color.accuracyPercent,null);
 assert.equal(r.multiGarment.automaticSegmentationAccuracyPercent,null);
 assert.match(r.original15PhotoIsolationQA.status,/different benchmark/);
});

test('new run must be distinct and complete; a category-only review never counts as auto type',()=>{
 const r=evalRows(historical,'actual-browser-inference');
 assert.equal(r.automaticSubtypeCorrectCoveragePercent,+(300/13).toFixed(2));
 assert.equal(r.categories.Dresses.review,1);
 assert.equal(r.totals.autoAccepted,6);
 assert.match(r.workerMode,/unmocked/);
});

test('unknown extra, duplicate or missing result IDs are rejected before scores',()=>{
 assert.throws(()=>evalRows(historical.slice(1)),/missing, extra/);
 assert.throws(()=>evalRows([...historical,historical[0]]),/duplicate/);
 assert.throws(()=>evalRows([...historical.slice(0,-1),{...historical.at(-1),id:'commons-9999'}]),/extra worker/);
});

test('invalid, swapped, or unreviewed original photo provenance fails closed',()=>{
 const invalid=structuredClone(source);
 invalid.find(x=>x.id===manifest[0].id).sha256='0'.repeat(60);
 assert.throws(()=>score(manifest,historical,invalid),/missing immutable licensed/);
 const changed=structuredClone(manifest);changed[0].image='not-the-licensed-photo.jpg';
 assert.throws(()=>score(changed,historical,source),/unreviewed or inconsistent/);
 const unverified=structuredClone(manifest);unverified[0].verified=false;
 assert.throws(()=>score(unverified,historical,source),/unreviewed or inconsistent/);
});

test('model errors and contradictory flags cannot disappear from denominators',()=>{
 const withError=structuredClone(historical);
 withError[0]={...withError[0],strong:false,error:'timeout',prediction:{category:null,type:null}};
 const report=evalRows(withError);
 assert.equal(report.totals.garments,13);
 assert.equal(report.totals.modelErrors,1);
 assert.equal(report.qualityGatePassed,false);
 assert.equal(report.perImage.find(x=>x.id===withError[0].id).outcome,'model-error');
 assert.equal(JSON.stringify(report).includes('timeout'),false,'raw model error not emitted');
 const invalid=structuredClone(historical);invalid[0].strong=true;invalid[0].categoryConfirmed=true;
 assert.throws(()=>evalRows(invalid),/invalid acceptance flags/);
});

test('new incorrectly accepted non-clothing is caught; untrusted guesses never auto-pass',()=>{
 const f=structuredClone(historical);
 const bad=f.find(x=>x.id==='commons-0046');
 bad.strong=true;bad.prediction={category:'Tops',type:'T-shirt'};
 const r=evalRows(f);assert.equal(r.totals.falsePositiveNegatives,1);
 assert.equal(r.totals.correctNegativeRejections,2);
 assert.equal(r.qualityGatePassed,false);
 const g=structuredClone(historical);
 const top=g.find(x=>x.id==='commons-0016');
 top.strong=false;top.categoryConfirmed=false;top.prediction={category:'Tops',type:'Blouse'};
 const r2=evalRows(g);
 assert.equal(r2.totals.autoCorrectType,3);
 assert.equal(r2.totals.untrustedPredictions,1);
});

test('report contains no source URL, JPEG or private name while retaining SHA references',()=>{
 const report=evalRows();
 const json=JSON.stringify(report);
 assert.ok(report.perImage.every(x=>/^[a-f0-9]{64}$/.test(x.sourceSha256)));
 assert.equal(json.includes('downloadUrl'),false);
 assert.equal(json.includes('data:image'),false);
 assert.equal(json.includes('.jpg'),false);
 assert.equal(json.includes('image:'),false);
});