import test from 'node:test';import assert from 'node:assert/strict';
import {scoreInstances} from '../research/mission1-external-human-evidence/instance-metrics.mjs';
const instance=(id,mask,region=4)=>({id,mask,region});
const score=(truth,predictions,extra={})=>scoreInstances({truth,predictions,width:4,height:1,...extra});
test('one merged same-class proposal cannot receive credit for two human instances',()=>{
 const r=score([instance('a',[1,1,0,0]),instance('b',[0,0,1,1])],[instance('merged',[1,1,1,1])]);
 assert.equal(r.truePositives,1);assert.equal(r.falseNegatives,1);assert.equal(r.recall,.5);
});
test('matching maximizes cardinality rather than greedily losing a feasible pair',()=>{
 const r=score([instance('a',[1,1,0,0]),instance('b',[1,1,1,1])],[instance('p',[1,1,0,0]),instance('q',[1,0,0,0])]);
 assert.equal(r.truePositives,2);assert.equal(r.falseNegatives,0);
});
test('wrong-class and absent-class predictions count as false positives',()=>{
 const r=score([instance('a',[1,1,0,0])],[instance('wrong',[1,1,0,0],6),instance('absent',[0,0,1,1],9)]);
 assert.equal(r.truePositives,0);assert.equal(r.falsePositives,2);assert.equal(r.falseNegatives,1);
});
test('empty inference preserves all missing truth and never invents precision',()=>{
 const r=score([instance('a',[1,0,0,0])],[]);assert.equal(r.falseNegatives,1);assert.equal(r.recall,0);assert.equal(r.precision,null);
 const negative=score([],[instance('fp',[1,0,0,0])]);assert.equal(negative.falsePositives,1);assert.equal(negative.recall,null);
});
test('duplicate IDs, empty or malformed masks and invalid matching thresholds fail closed',()=>{
 for(const rows of [[instance('a',[0,0,0,0])],[instance('a',[1,0,0])],[instance('a',[2,0,0,0])],[instance('a',[1,0,0,0]),instance('a',[0,1,0,0])]])assert.throws(()=>score(rows,[]));
 for(const iouThreshold of [0,-1,NaN,1.1])assert.throws(()=>score([],[],{iouThreshold}));
});

test('external cohort never duplicates the original frozen source bytes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const original=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const external=JSON.parse(await readFile('research/real-garment-acceptance-66/fashionpedia-sample.json','utf8'));
 assert.equal(new Set([...original.map(x=>x.sha256),...external.rows.map(x=>x.sha256)]).size,65);
});
