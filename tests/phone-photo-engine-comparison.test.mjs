import test from 'node:test';
import assert from 'node:assert/strict';
import {compareBrowserOriginalPhotos as compare} from '../benchmark/phone-photo-engine-comparison.mjs';
const make=(type,strong,categoryConfirmed=false)=>({
 format:'closet-current-phone-photo-check',version:1,
 release:'a'.repeat(12),recognitionIndex:'b'.repeat(64),
 summary:{photos:2,errors:0,categoryMatches:1,negativeRejected:1,
  incorrectAutomaticCategories:0,incorrectAutomaticTypes:0},
 photos:[{id:'photo-001',expectedCategory:'Tops',expectedType:'T-shirt',
  prediction:{category:'Tops',type},strong,categoryConfirmed},
  {id:'photo-002',expectedCategory:'Uncategorized',expectedType:null,
   prediction:{category:null,type:null},categoryMatch:true}]
});
test('different subtype decisions are transparent but no unsupported automatic shoe/shirt claim is fabricated',()=>{
 const c=make('T-shirt',true),w=make('Unknown',false,true);
 const result=compare(c,w);
 assert.equal(result.status,'two-browser-original-photo-safety-check-passed');
 assert.deepEqual(result.typeDisagreements,['photo-001']);
 assert.equal(result.photoRows[0].chromiumType,'T-shirt');
 assert.equal(result.photoRows[0].webkitType,'Unknown');
 assert.equal(result.actualPhysicalIPhoneTested,false);
 assert.equal(result.realWorldGarmentAccuracy,null);
 assert.equal(result.releaseApproved,false);
});
test('matched accepted type works without claiming real phone or general accuracy',()=>{
 const r=compare(make('T-shirt',true),make('T-shirt',true));
 assert.deepEqual(r.typeDisagreements,[]);
 assert.equal(r.paidProviderCalls,0);
});
test('wrong confident type, missing unsafe-review marker and mismatched build do not pass',()=>{
 const c=make('T-shirt',true),w=make('Unknown',false,true);
 for(const broken of [
  (()=>{let r=structuredClone(w);r.photos[0].prediction.type='Sweatshirt';r.photos[0].strong=true;return r;})(),
  (()=>{let r=structuredClone(w);r.photos[0].categoryConfirmed=false;return r;})(),
  (()=>{let r=structuredClone(w);r.release='c'.repeat(12);return r;})(),
  (()=>{let r=structuredClone(w);r.recognitionIndex='d'.repeat(64);return r;})(),
  (()=>{let r=structuredClone(w);r.summary.negativeRejected=0;return r;})(),
  (()=>{let r=structuredClone(w);r.summary.incorrectAutomaticTypes=1;return r;})(),
  (()=>{let r=structuredClone(w);r.photos[1].expectedCategory='Shoes';return r;})()
 ])assert.throws(()=>compare(c,broken));
});
test('redact private filenames, image pixels and bearer credentials from benchmark results',()=>{
 const c=make('T-shirt',true),w=make('Unknown',false,true);
 for(const payload of ['PRIVATE_PHONE_GARMENT.jpg','data:image/jpeg;base64,abcdef',
    'refresh_token=secret','bearer eyJhbGci']){
  assert.throws(()=>compare(c,w,{chromiumJSON:JSON.stringify(c)+payload}));
 }
});
