import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreGarmentMask,decodeReferenceMask} from '../benchmark/garment-mask-metrics.mjs';

test('a perfect annotated cutout achieves full recall, precision, and overlap',()=>{
 const reference=Uint8Array.from([0,1,1,0,0,1]);
 const score=scoreGarmentMask(reference,reference,3,2);
 assert.equal(score.garmentRecall,1);
 assert.equal(score.garmentPrecision,1);
 assert.equal(score.intersectionOverUnion,1);
 assert.equal(score.backgroundContaminationRate,0);
});
test('lost garment edges and included background are counted separately',()=>{
 const truth=Uint8Array.from([0,1,1,1,0,0,0,0]);
 const prediction=Uint8Array.from([1,0,1,1,0,0,0,0]);
 const score=scoreGarmentMask(truth,prediction,4,2);
 assert.equal(score.truePositive,2);
 assert.equal(score.falsePositive,1);
 assert.equal(score.falseNegative,1);
 assert.equal(score.garmentRecall,2/3);
 assert.equal(score.garmentPrecision,2/3);
 assert.equal(score.intersectionOverUnion,.5);
 assert.equal(score.backgroundContaminationRate,.2);
});
test('reference run encoding preserves exact human-annotated mask',()=>{
 assert.deepEqual([...decodeReferenceMask({width:4,height:2,runs:[1,3,4]})],[0,1,1,1,0,0,0,0]);
});
test('missing, partial, invalid and untrusted reference annotations fail closed',()=>{
 assert.throws(()=>decodeReferenceMask({width:2,height:2,runs:[1,2]}),/Incomplete/);
 assert.throws(()=>decodeReferenceMask({width:2,height:2,runs:[0,5]}),/Invalid annotation run/);
 assert.throws(()=>scoreGarmentMask([0,2],[0,1],2,1),/binary/);
 assert.throws(()=>scoreGarmentMask([1],[1],2,2),/Invalid segmentation/);
});
