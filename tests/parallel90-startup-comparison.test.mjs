import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {compareSourceFrames90} from '../research/parallel90-viewer/startup-comparison.mjs';
const png=async pixels=>sharp(Buffer.from(pixels),{raw:{width:2,height:1,channels:3}}).png().toBuffer();
test('P90 source-frame comparator accepts genuine identical pixel buffers',async()=>{
 const a=await png([30,40,50,60,70,80]);
 const r=await compareSourceFrames90(a,a);
 assert.equal(r.changedExact,0);assert.equal(r.changedAbove8,0);
});
test('P90 source-frame comparator refuses a changed garment-colored pixel',async()=>{
 const a=await png([30,40,50,60,70,80]),b=await png([30,40,50,69,70,80]);
 await assert.rejects(compareSourceFrames90(a,b),/altered final source-frame/);
});
