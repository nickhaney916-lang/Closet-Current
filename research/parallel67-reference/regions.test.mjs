import test from 'node:test';
import assert from 'node:assert/strict';
import {describeRegion67,mergeReferenceRegions67,boxIoU67} from './regions.mjs';
test('reference descriptions preserve uncertain subtype rather than inventing automatic labels',()=>{
 assert.equal(describeRegion67('a long sleeve shirt').itemType,'Unknown');
 assert.equal(describeRegion67('a fancy dress').category,'Dresses');
 assert.equal(describeRegion67('two sneakers').itemType,'Sneakers');
 assert.equal(describeRegion67('boots').itemType,'Unknown');
 assert.equal(describeRegion67('a woman wearing a dress').category,null);
 assert.equal(describeRegion67('shirt and trousers').category,null);
 assert.equal(describeRegion67('a chair').category,null);
 for(const label of ['a fancy dress','a blouse','sneakers'])assert.equal(describeRegion67(label).requiresReview,true);
});
test('same garment box duplicate is consolidated but separate shoes stay separate',()=>{
 const result=mergeReferenceRegions67([
  {stage:'OD',labels:['sneakers','sneakers'],bboxes:[[1,1,30,90],[60,1,90,90]]},
  {stage:'grounding',labels:['brown shoe'],bboxes:[[2,1,30,90]]}
 ],100,100);
 assert.equal(result.regions.length,2);assert.equal(result.regions[0].evidence.length,2);
 assert.equal(result.regions[1].evidence.length,1);assert.equal(result.regions[0].strong,false);
});
test('contradictory category regions remain visible and malformed model coordinates are rejected',()=>{
 const result=mergeReferenceRegions67([{stage:'OD',labels:['dress','shirt'],bboxes:[[1,1,99,99],[1,1,99,99]]}],100,100);
 assert.equal(result.regions.length,2);
 for(const boxes of [[[0,0,101,99]],[[2,2,1,1]],[[0,0,NaN,5]]])assert.throws(()=>mergeReferenceRegions67([{stage:'OD',labels:['dress'],bboxes:boxes}],100,100));
 assert.throws(()=>mergeReferenceRegions67([{stage:'OD',labels:[],bboxes:[[0,0,1,1]]}],100,100));
 assert.equal(boxIoU67([0,0,10,10],[0,0,10,10]),1);
 assert.equal(boxIoU67([0,0,1,1],[2,2,3,3]),0);
});
