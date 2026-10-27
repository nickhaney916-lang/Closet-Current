import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adjustReviewedGarmentGeometry as adjust} from '../../research/work46-avatar/manual-fit.mjs';
test('adjustments preserve proportions and reject clipping or excessive movement',()=>{const base={x:.5,y:.4,width:.5,height:.4};const next=adjust(base,{dx:.01,dy:-.015,scale:.96});assert.equal(next.width/next.height,base.width/base.height);assert.equal(next.sourcePixelsResampled,false);assert.deepEqual(base,{x:.5,y:.4,width:.5,height:.4});for(const bad of [{dx:.1},{dy:.2},{scale:1.3}])assert.throws(()=>adjust(base,bad));assert.throws(()=>adjust({x:.1,y:.4,width:.4,height:.4},{}));});
