import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('outfit imports and segmentation worker agree on 4096px source-image limit',()=>{
 const capture=readFileSync('public/outfit-capture.js','utf8');
 const worker=readFileSync('public/outfit-worker.mjs','utf8');
 const crop=readFileSync('public/photo-crop-engine.js','utf8');
 assert.match(capture,/photoToJPEG\(file,\{maxDimension:4096,quality:\.94\}\)/);
 assert.match(worker,/Math\.max\(image\.width,image\.height\)>4096/);
 assert.match(crop,/4096\/Math\.max\(w,h\)/);
 assert.match(worker,/cropClothingPhotoPixels\(image,map,group\)/);
});
