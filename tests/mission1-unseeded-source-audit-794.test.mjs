import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreInstances} from '../research/mission1-external-human-evidence/instance-metrics.mjs';
function mask(points){const out=Array(16).fill(0);for(const k of points)out[k]=1;return out;}
const truth=[
 {id:'published-top',region:4,mask:mask([0,1,4,5])},
 {id:'published-lower',region:6,mask:mask([10,11,14,15])}
];
const primary=[{id:'existing-top',region:4,mask:mask([0,1,4,5])}];
const newSource=[{id:'unseeded-lower',region:6,mask:mask([10,11,14,15])}];
test('P794 new original-logit missed-garment proposal can improve source IoU only by matching a separate actual mask',()=>{
 const original=scoreInstances({truth,predictions:primary,width:4,height:4});
 const reviewed=scoreInstances({truth,predictions:[...primary,...newSource],width:4,height:4});
 assert.deepEqual([original.truePositives,original.falsePositives,original.falseNegatives],[1,0,1]);
 assert.deepEqual([reviewed.truePositives,reviewed.falsePositives,reviewed.falseNegatives],[2,0,0]);
 assert.equal(reviewed.matches.some(m=>m.predictionId==='unseeded-lower'),true);
});
test('P794 fabricated or nonoverlapping new proposal must still count as a false detection',()=>{
 const spurious={id:'unseeded-hallucination',region:7,mask:mask([6,7])};
 const result=scoreInstances({truth,predictions:[...primary,...newSource,spurious],width:4,height:4});
 assert.equal(result.truePositives,2);
 assert.equal(result.falsePositives,1);
 assert.equal(result.falseNegatives,0);
 assert.equal(result.unmatchedPredictionIds.includes(spurious.id),true);
});
test('P794 same-family overlap cannot count multiple proposals as two true garments',()=>{
 const duplicate={id:'duplicated-upper-region',region:4,mask:mask([0,1,4,5])};
 const result=scoreInstances({truth,predictions:[...primary,duplicate],width:4,height:4});
 assert.deepEqual([result.truePositives,result.falsePositives,result.falseNegatives],[1,1,1]);
});
test('P794 different category mask is a wrong detection even when original pixels match',()=>{
 const wrong={id:'unseeded-wrong-semantic-category',region:7,mask:mask([10,11,14,15])};
 const result=scoreInstances({truth,predictions:[...primary,wrong],width:4,height:4});
 assert.deepEqual([result.truePositives,result.falsePositives,result.falseNegatives],[1,1,1]);
});
