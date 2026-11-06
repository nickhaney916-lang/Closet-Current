import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateLockedSnapshot} from '../research/capture-acceptance-115/evaluate.mjs';

const source=readFileSync(new URL('../research/capture-acceptance-115/evidence.json',import.meta.url),'utf8');
const snapshot=JSON.parse(source);

test('audits every real locked FashionCLIP output against provisional labels without scientific claims',()=>{
 const r=evaluateLockedSnapshot(snapshot);
 assert.equal(r.evaluatedLockedPhotos,16);
 assert.equal(r.provisionalGarmentPhotos,13);
 assert.equal(r.provisionalNegativeControls,3);
 assert.equal(r.abstentions,5);
 assert.deepEqual(r.provisionalAgreement.category,{numerator:8,denominator:13,percent:61.54});
 assert.deepEqual(r.provisionalAgreement.subtype,{numerator:4,denominator:13,percent:30.77});
 assert.deepEqual(r.provisionalAgreement.negativeControlsRejected,{numerator:3,denominator:3,percent:100});
 assert.equal(r.confusion.Shoes['ABSTAIN'],1);
 assert.equal(r.confusion.Shoes.Shoes,2);
 assert.equal(r.primaryColorAccuracy,null);
 assert.equal(r.secondaryColorAccuracy,null);
 assert.equal(r.instanceMaskIoU,null);
 assert.match(r.independentScientificAccuracy,/UNVERIFIED/);
});

test('rejects duplicate, mismatched, or relabeled source evidence',()=>{
 const duplicate=structuredClone(snapshot);duplicate.samples[1].sourceSHA256=duplicate.samples[0].sourceSHA256;
 assert.throws(()=>evaluateLockedSnapshot(duplicate),/duplicate original-photo SHA/);
 const changed=structuredClone(snapshot);changed.artifactSHA256='0'.repeat(64);
 assert.throws(()=>evaluateLockedSnapshot(changed),/unrecognized inference provenance/);
 const mislabeled=structuredClone(snapshot);mislabeled.samples[0].abstained=false;
 assert.throws(()=>evaluateLockedSnapshot(mislabeled),/abstention disagrees/);
});
