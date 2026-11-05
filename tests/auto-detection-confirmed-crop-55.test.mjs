import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneReviewDefaults32,canConfirmScene32} from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';
const schema={types:{Tops:['T-shirt'],Bottoms:['Jeans'],Dresses:['Dress'],Outerwear:['Jacket'],Shoes:['Sneakers']}};
const verified={category:'Tops',itemType:'T-shirt',color:'Blue',manual:false,cropReviewed:false};
test('SAFETY55 real unreviewed automatic segmentation cannot become a confirmed garment even if taxonomy/color is plausible',()=>{
 assert.equal(canConfirmScene32(verified,schema),false);
 assert.equal(canConfirmScene32({...verified,cropReviewed:true},schema),true);
});
test('SAFETY55 unreviewed automatic model score 1, person evidence and valid category still cannot authorize save',()=>{
 const auto=sceneReviewDefaults32({personDetected:true,hint:{categories:['Tops'],clipped:false,confidence:1},colorEstimate:{color:'Blue'}});
 assert.equal(auto.category,'Uncategorized','LABEL59 removes automatically prefilled categories');
 assert.equal(auto.color,'','LABEL59 removes automatically prefilled color');
 assert.equal(canConfirmScene32({...auto,itemType:'T-shirt',cropReviewed:false},schema),false);
 assert.equal(canConfirmScene32({...auto,itemType:'T-shirt',cropReviewed:true},schema),false);
 assert.equal(canConfirmScene32({...auto,category:'Tops',color:'Blue',itemType:'T-shirt',cropReviewed:true},schema),true);
});
test('SAFETY55 unknown subtype, blank color, stale or missing crop review always reject',()=>{
 for(const cropReviewed of [undefined,null,false,0,'true']){
  assert.equal(canConfirmScene32({...verified,cropReviewed},schema),false);
 }
 for(const invalid of [{itemType:'Unknown'},{color:''},{category:'Uncategorized'},{itemType:'Jeans'}]){
  assert.equal(canConfirmScene32({...verified,...invalid,cropReviewed:true},schema),false);
 }
});
test('SAFETY55 app auto-detection always starts unreviewed; review UI and final commit enforce the gate',()=>{
 const src=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(src,/image:jpegCrop\(sourceImage,box\),manual:false,cropReviewed:false/);
 assert.match(src,/card\.dataset\.cropReviewed55=p\.cropReviewed===true\?'confirmed':'unreviewed'/);
 assert.match(src,/Unverified detection: inspect the original/);
 assert.match(src,/if\(snapshots\.some\(x=>!canConfirmScene32\(x,schema\)\|\|x\.cropReviewed!==true\|\|/);
 assert.match(src,/cropReviewed=true/);
 assert.match(src,/atomicSaveGarments24/);
});
