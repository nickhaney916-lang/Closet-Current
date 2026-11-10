import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import '../public/photo-color.js';
import {modelMaskedColorReview789 as score} from '../research/mission1-original-mask-color-789/source-color-evidence.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const SOURCE='2'.repeat(64);
function fixture(family='UpperGarment',selected=4){
 const width=64,height=64,rgba=new Uint8ClampedArray(width*height*4);
 const map=new Uint8Array(width*height);
 for(let i=0;i<width*height;i++){
  const at=i*4;rgba[at]=8;rgba[at+1]=8;rgba[at+2]=8;rgba[at+3]=255;
 }
 for(let y=5;y<26;y++)for(let x=5;x<26;x++){
  const i=y*width+x;map[i]=selected;
  rgba[4*i]=238;rgba[4*i+1]=42;rgba[4*i+2]=23;
 }
 return {sourceSHA256:SOURCE,sourceLabelMapSHA256:sha(map),
  rgba,labelMap:map,width,height,categoryFamily:family,
  maskedPalette:globalThis.PhotoColor.maskedPalette};
}
test('genuine model-mask sampling isolates red while full-image background contaminates center-only color',async()=>{
 const src=fixture();
 const reference=globalThis.PhotoColor.estimate(src.rgba,src.width,src.height);
 assert.notEqual(reference?.color,'Red');
 const original=src.rgba.slice();
 const result=await score(src);
 assert.equal(result.possiblePrimaryColor,'Red');
 assert.equal(result.modelGarmentIdentityVerified,false);
 assert.equal(result.independentHumanColorVerified,false);
 assert.equal(result.autoSaveAllowed,false);
 assert.equal(result.candidateNeedsConfirmation,true);
 assert.equal(result.selectedSourcePixels,441);
 assert.deepEqual(src.rgba,original,'original photo pixels must be untouched');
});
test('cross-photo semantic-mask SHA transplant fails before sampling',async()=>{
 const src=fixture();await assert.rejects(score({...src,sourceLabelMapSHA256:'f'.repeat(64)}),/SHA mismatch/);
});
test('wrong semantic family does not hallucinate a color from a verified real mask',async()=>{
 const src=fixture('Dresses');const result=await score(src);
 assert.equal(result.possiblePrimaryColor,null);
 assert.equal(result.selectedSourcePixels,0);
 assert.equal(result.autoSaveAllowed,false);
});
test('dress source mask can produce color suggestion but cannot automatically approve garment',async()=>{
 const src=fixture('Dresses',7);const result=await score(src);
 assert.equal(result.possiblePrimaryColor,'Red');
 assert.equal(result.semanticFamily,'Dresses');
 assert.equal(result.independentHumanColorVerified,false);
 assert.equal(result.modelPromotionAuthorized,false);
});
test('tampered or out-of-ontology model labels fail closed',async()=>{
 const src=fixture();src.labelMap[0]=255;src.sourceLabelMapSHA256=sha(src.labelMap);
 await assert.rejects(score(src),/18-class/);
});
test('short labels and source color pixels fail closed',async()=>{
 const src=fixture();
 await assert.rejects(score({...src,labelMap:new Uint8Array(30)}),/mismatch/);
 await assert.rejects(score({...src,rgba:new Uint8ClampedArray(12)}),/mismatch/);
 await assert.rejects(score({...src,sourceSHA256:'bad'}),/mismatch/);
});
test('near-whole-frame source class is not mistaken for a garment palette',async()=>{
 const src=fixture();src.labelMap.fill(4);src.sourceLabelMapSHA256=sha(src.labelMap);
 const result=await score(src);
 assert.equal(result.possiblePrimaryColor,null);
 assert.equal(result.selectedSourcePixels,4096);
});
