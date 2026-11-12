import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as catalog from '../public/local-catalog.mjs';
import * as engine from '../public/recognition-engine.mjs';
import {scannerErrorCode} from '../public/scanner-errors.mjs';
const source=fs.readFileSync('public/local-worker.mjs','utf8');
function setup({width=500,decodeError=false,detailError=false}={}){
 const sent=[],calls=[],loads=[],choice=catalog.localCandidates[0],groups=catalog.garmentDetailGroups(choice);
 const scores=options=>options.map((label,i)=>({label,score:i===0?.95:.001}));
 const model=async(image,labels)=>{
  calls.push({image,labels});
  if(labels.includes(engine.categoryCandidates[0].label))return [{label:engine.categoryCandidates[0].label,score:.9},{label:engine.categoryCandidates[1].label,score:.05}];
  if(labels.includes(choice.label))return [{label:choice.label,score:.9},{label:catalog.localCandidates[1].label,score:.05}];
  if(detailError)throw Error('private error text');
  if(labels.length>20)return Object.values(groups).flatMap(options=>scores(options.map(x=>x.label)));
  if(labels.includes(groups.color[0].label))return scores([groups.color[1].label,...labels.filter(x=>x!==groups.color[1].label)]);
  if(labels.includes(groups.fit[0].label))return labels.map(label=>({label,score:.2}));
  return scores(labels);
 };
 const runtime={CLIPVisionModelWithProjection:{from_pretrained:async()=>{loads.push('vision');return async()=>({});}},AutoProcessor:{from_pretrained:async()=>{loads.push('processor');return async()=>({});}},env:{backends:{onnx:{wasm:{}}}},RawImage:{read:async()=>{if(decodeError)throw Error('Image decode failed, private path');return {width,height:500};}}};
 const vectorsAPI={loadVectorAssets:async()=>({metadata:{model:'ff13/fashion-clip',revision:'0'.repeat(40)},vectors:null}),makeVectorScorer:()=>model},photoAPI={prepareRecognitionPhoto:async image=>image};
 const c={vectorsAPI,photoAPI,engine,self:{postMessage:x=>sent.push(x)},catalog,runtime,scannerErrorCode,URL};vm.createContext(c);
 const transformed=source.replace("import {scannerErrorCode} from './scanner-errors.mjs';",'').replace(/await import\('https:[^']+'\)/,'await Promise.resolve(runtime)').replace("await import('./vector-scorer.mjs'+version)",'await Promise.resolve(vectorsAPI)').replace("await import('./recognition-photo.mjs'+version)",'await Promise.resolve(photoAPI)').replace("await import('./recognition-engine.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(engine)').replaceAll('new URL(import.meta.url).search',"''");
 vm.runInContext(transformed,c);
 return {sent,calls,loads,async scan(){c.self.onmessage({data:{id:'test',type:'classify',image:'data:image/jpeg;base64,AAAA'}});await vm.runInContext('chain',c);return sent.find(x=>x.type==='result');}};
}
test('worker keeps classification but drops disagreeing and uncertain details',async()=>{
 const h=setup(),result=await h.scan();assert.equal(result.strong,true);assert.equal(result.choices[0].itemType,'T-shirt');assert.deepEqual({...result.details},{pattern:'Solid',sleeveLength:'Sleeveless'});
 assert.equal(h.calls.length,9);assert.ok(h.calls.every(x=>x.image===h.calls[0].image));assert.ok(h.sent.some(x=>x.type==='identified'));
});
test('small photos still classify but cannot autosupply detailed attributes',async()=>{
 const h=setup({width:112}),result=await h.scan();assert.equal(result.strong,true);assert.deepEqual({...result.details},{});assert.equal(h.calls.length,4);
});
test('unreadable image returns a safe image error instead of categories',async()=>{
 const h=setup({decodeError:true});assert.equal(await h.scan(),undefined);assert.equal(h.calls.length,0);const error=h.sent.find(x=>x.type==='error');assert.equal(error.code,'image');assert.ok(!JSON.stringify(error).includes('private path'));
});
test('optional detail failure preserves confirmed garment identity without inventing attributes',async()=>{
 const h=setup({detailError:true}),result=await h.scan();assert.equal(result.strong,true);assert.equal(result.choices[0].itemType,'T-shirt');assert.deepEqual({...result.details},{});assert.equal(h.sent.some(x=>x.type==='error'),false);assert.ok(!JSON.stringify(h.sent).includes('private error text'));
});

test('invalid and oversized recognition payloads fail before model initialization',async()=>{
 const h=setup();
 for(const request of [
  {id:'bad-type',type:'unexpected',image:'data:image/jpeg;base64,AAAA'},
  {id:'bad-payload',type:'classify',image:'data:image/png;base64,AAAA'},
  {id:'too-large',type:'classify',image:'data:image/jpeg;base64,'+'A'.repeat(12000000)}
 ]){
  h.sent.length=0;h.c.self.onmessage({data:request});await vm.runInContext('chain',h.c);
  assert.equal(h.sent.filter(x=>x.type==='error').length,1);
 }
 assert.equal(h.loads.length,0,'no heavyweight models downloaded for rejected inputs');
});
test('worker includes numeric request-scoped timing without changing recognition result',async()=>{
 const h=setup();const result=await h.scan();
 assert.equal(result.strong,true);
 assert.ok(h.sent.some(x=>x.type==='progress'&&x.id==='test'));
 assert.ok(['loadMs','decodeMs','inferenceMs','totalMs'].every(key=>Number.isFinite(result.runtimeMetrics[key])&&result.runtimeMetrics[key]>=0));
 assert.equal(h.loads.length,2,'one vision model and one processor loaded');
});
