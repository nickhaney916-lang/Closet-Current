import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('outfit captures preserve original full-resolution crop pixels for visible clothing and recognition',()=>{
 const worker=readFileSync('public/outfit-worker.mjs','utf8');
 assert.match(worker,/const raw=cropClothingPhotoPixels\(image,map,group\)/);
 assert.match(worker,/image:await jpegData\(new RawImage\(raw\.data,raw\.width,raw\.height,3\)\)/);
 assert.doesNotMatch(worker,/image:await jpegData\(new RawImage\(isolated\.data/);
 assert.match(worker,/clothingColorSample\(image,map,group\)/);
 assert.match(worker,/recognitionPhoto:null/);
});
