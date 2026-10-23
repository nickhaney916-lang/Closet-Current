import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeOutfitPreview} from '../../research/avatar/outfit-preview-compositor.mjs';
const pose={leftShoulder:{x:10,y:5},rightShoulder:{x:30,y:5},leftHip:{x:13,y:25},rightHip:{x:27,y:25},leftAnkle:{x:14,y:55},rightAnkle:{x:26,y:55}};
const garment=(color,sha)=>({accountId:'a',originalSha256:sha.repeat(64),width:1,height:1,pixels:new Uint8ClampedArray([...color,255])});
const item=(slot,color,sha)=>({slot,garment:garment(color,sha),mask:new Uint8Array([255]),sourceBox:{x:0,y:0,width:1,height:1}});
const base={accountId:'a',pose,canvasWidth:40,canvasHeight:60};
test('top and jacket retain distinct source provenance and order',()=>{
 const result=composeOutfitPreview({...base,items:[item('jacket',[0,0,255],'b'),item('top',[255,0,0],'a')]});
 assert.deepEqual(result.sources.map(x=>x.slot),['top','jacket']);
 assert.equal(result.fitSimulation,false);
 assert.ok(result.pixels.some(x=>x>0));
});
test('dress and separates cannot coexist',()=>{
 assert.throws(()=>composeOutfitPreview({...base,items:[item('dress',[1,2,3],'a'),item('bottom',[4,5,6],'b')]}));
});
test('duplicate and unknown slots rejected',()=>{
 assert.throws(()=>composeOutfitPreview({...base,items:[item('top',[1,2,3],'a'),item('top',[4,5,6],'b')]}));
 assert.throws(()=>composeOutfitPreview({...base,items:[item('hat',[1,2,3],'a')]}));
});
test('cross-account source cannot be composed',()=>{
 assert.throws(()=>composeOutfitPreview({...base,accountId:'other',items:[item('top',[1,2,3],'a')]}));
});
test('empty outfit creates transparent frame with valid pose',()=>{
 const result=composeOutfitPreview({...base,items:[]});
 assert.equal(result.pixels.length,40*60*4);
 assert.equal(result.pixels.every(x=>x===0),true);
});
