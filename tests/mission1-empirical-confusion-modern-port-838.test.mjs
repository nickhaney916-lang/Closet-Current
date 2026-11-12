import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {corroborateAmbiguousType} from '../public/recognition-confusion-guard.mjs';

const original=fs.readFileSync('public/local-worker.mjs','utf8');
function workerFor({category='Tops',itemType='Sweatshirt',hint=null,strong=true}={}){
 const sent=[],choice={label:'garment',category,itemType,score:.96,sleeveLength:'Long sleeve'};
 const originalResult={strong,choices:[choice],details:{color:'Red',fit:'Regular'},diagnostics:{existing:'allowed'}};
 const engine={
  recognizeWithRecovery:async (_model,_image,options)=>{
   options.onIdentified?.(choice);
   return structuredClone(originalResult);
  },
  classifyIsolatedGarment:async (_model,_image,options)=>{
   options.onIdentified?.(choice);
   return structuredClone(originalResult);
  }
 };
 const runtime={
  CLIPVisionModelWithProjection:{from_pretrained:async()=>async()=>({})},
  AutoProcessor:{from_pretrained:async()=>async()=>({})},
  env:{backends:{onnx:{wasm:{}}}},
  RawImage:{read:async()=>({width:480,height:520})}
 };
 const vectorsAPI={loadVectorAssets:async()=>({metadata:{model:'pinned',revision:'0'.repeat(40)},vectors:null}),makeVectorScorer:()=>async()=>[]};
 const photoAPI={prepareRecognitionPhoto:async x=>x,fitWholePhoto:async x=>x};
 const confusionGuard={corroborateAmbiguousType};
 const scannerErrorCode=()=> 'model';
 const context={engine,runtime,vectorsAPI,photoAPI,confusionGuard,scannerErrorCode,URL,self:{postMessage:x=>sent.push(x)}};
 vm.createContext(context);
 const code=original.replace("import {scannerErrorCode} from './scanner-errors.mjs';",'')
  .replace(/await import\('https:[^']+'\)/,'await Promise.resolve(runtime)')
  .replace("await import('./vector-scorer.mjs'+version)",'await Promise.resolve(vectorsAPI)')
  .replace("await import('./recognition-photo.mjs'+version)",'await Promise.resolve(photoAPI)')
  .replace("await import('./recognition-engine.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(engine)')
  .replace("await import('./recognition-confusion-guard.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(confusionGuard)')
  .replaceAll('new URL(import.meta.url).search',"''");
 vm.runInContext(code,context);
 return {sent,choice,async scan(){
  context.self.onmessage({data:{id:'photo',type:'classify',image:'data:image/jpeg;base64,AAAA',...(hint?{hint}:{})}});
  await vm.runInContext('chain',context);
  return sent.find(x=>x.type==='result');
 }};
}
test('P838 blocks provisional and final automatic subtype admissions for all four real-source risk classes',async()=>{
 for(const [category,itemType] of [
  ['Tops','Sweatshirt'],['Tops','Tunic'],['Outerwear','Blazer'],['Shoes','Ankle boots']
 ]){
  const h=workerFor({category,itemType}),r=await h.scan();
  assert.ok(r,category+':'+itemType);
  assert.equal(r.strong,false);
  assert.equal(r.categoryOnly,true);
  assert.equal(r.categoryConfirmed,true);
  assert.equal(r.choices[0].itemType,'Unknown');
  assert.equal(r.choices[0].category,category);
  assert.equal(r.reason,'type_uncertain');
  assert.equal(r.diagnostics.mission1SubtypeSafety.ownerSubtypeReviewRequired,true);
  assert.deepEqual({...r.details},{});
  assert.equal(h.sent.filter(x=>x.type==='identified').length,0,'no optimistic identified event may bypass the final guard');
 }
});
test('P838 non-risky complete true-positive results retain original class and only final-worker identified event',async()=>{
 for(const [category,itemType] of [['Tops','T-shirt'],['Bottoms','Skirt'],['Shoes','Sneakers'],['Dresses','Casual dress']]){
  const h=workerFor({category,itemType}),r=await h.scan();
  assert.equal(r.strong,true);
  assert.equal(r.choices[0].itemType,itemType);
  assert.equal(r.details.color,'Red');
  assert.equal(h.sent.filter(x=>x.type==='identified').length,1);
  assert.equal(h.sent.at(-1).type,'result');
 }
});
test('P838 non-strong or ambiguous original results cannot be made falsely strong',async()=>{
 const h=workerFor({category:'Tops',itemType:'Sweatshirt',strong:false});
 const r=await h.scan();assert.equal(r.strong,false);assert.equal(h.sent.some(x=>x.type==='identified'),false);
});
test('P838 leaves historically unvalidated outfit hints unchanged, avoids inventing a measurement',async()=>{
 const h=workerFor({category:'Shoes',itemType:'Ankle boots',hint:{categories:['Shoes'],types:[],clipped:false}});
 const r=await h.scan();assert.equal(r.strong,true);
 assert.equal(r.choices[0].itemType,'Ankle boots');
 assert.equal(h.sent.some(x=>x.type==='identified'),true);
});
test('P838 never copies owner source bytes when downgrading risk class',async()=>{
 const source={strong:true,choices:[{category:'Tops',itemType:'Tunic',score:.98}],details:{color:'Red'},image:'PRIVATE_OWNER_JPEG',owner:'PRIVATE_OWNER'};
 const downgraded=await corroborateAmbiguousType(source);
 assert.equal(downgraded.strong,false);assert.equal(downgraded.choices[0].itemType,'Unknown');
 assert.equal(JSON.stringify(downgraded).includes('PRIVATE_OWNER'),false);
 assert.equal(source.image,'PRIVATE_OWNER_JPEG');
});
