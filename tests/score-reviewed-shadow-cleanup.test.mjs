import test from 'node:test';import assert from 'node:assert/strict';
import {scoreReviewedShadowCleanup} from '../benchmark/score-reviewed-shadow-cleanup.mjs';
test('tracks shadow removed without real garment loss',()=>{
 const result=scoreReviewedShadowCleanup({baseline:[1,1,1,0],candidate:[1,1,0,0],garment:[1,1,0,0],shadow:[0,0,1,0]});
 assert.equal(result.improvedWithoutGarmentLoss,true);assert.equal(result.shadowPixelsRemovedComparedToBaseline,1);assert.equal(result.garmentPixelsLostComparedToBaseline,0);
});
test('fails improvement when clothing is trimmed',()=>{
 const result=scoreReviewedShadowCleanup({baseline:[1,1,1,0],candidate:[1,0,0,0],garment:[1,1,0,0],shadow:[0,0,1,0]});
 assert.equal(result.improvedWithoutGarmentLoss,false);
});
test('rejects overlapping or incomplete annotation masks',()=>{
 assert.throws(()=>scoreReviewedShadowCleanup({baseline:[1],candidate:[0],garment:[1],shadow:[1]}));
 assert.throws(()=>scoreReviewedShadowCleanup({baseline:[1,1],candidate:[0,0],garment:[1,0],shadow:[0,0]}));
});

test('does not call incomplete garment retention an improvement even if the baseline was already damaged',()=>{
 const result=scoreReviewedShadowCleanup({baseline:[1,0,1,0],candidate:[1,0,0,0],garment:[1,1,0,0],shadow:[0,0,1,0]});
 assert.equal(result.shadowPixelsRemovedComparedToBaseline,1);
 assert.equal(result.garmentFullyPreserved,false);
 assert.equal(result.improvedWithoutGarmentLoss,false);
});
test('reports actual shadow removal proportion on validated reference masks',()=>{
 const result=scoreReviewedShadowCleanup({baseline:[1,1,1,1,0],candidate:[1,1,0,1,0],garment:[1,1,0,0,0],shadow:[0,0,1,1,0]});
 assert.equal(result.shadowRemovalRate,0.5);
 assert.equal(result.garmentFullyPreserved,true);
 assert.equal(result.improvedWithoutGarmentLoss,true);
});
