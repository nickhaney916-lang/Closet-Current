import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const PhotoColor=require('../public/photo-color.js');
import * as segmentation from '../public/outfit-segmentation.mjs';

const capture=fs.readFileSync('public/outfit-capture.js','utf8');
const workerSource=fs.readFileSync('public/outfit-worker.mjs','utf8');
const start=capture.indexOf('async function boundedOutfitAnalysisJPEG27(');
const finish=capture.indexOf('function startOutfitSplit(',start);
assert.ok(start>0&&finish>start);
const helperCode=capture.slice(start,finish);
function createPreparationMock(width,height,{length=1200,badCanvas=false}={}){
 const original='data:image/jpeg;base64,'+'A'.repeat(length);
 const draws=[];
 const fakeImage=class {
  constructor(){this.src=null;this.naturalWidth=width;this.naturalHeight=height;}
  async decode(){}
 };
 const canvas=()=>({
  width:0,height:0,
  getContext(){return badCanvas?null:{drawImage(...args){draws.push(args.slice(1));}};},
  toDataURL(type,quality){return 'data:image/jpeg;base64,'+'B'.repeat(Math.round(quality*200));}
 });
 const context={Image:fakeImage,document:{createElement:tag=>{assert.equal(tag,'canvas');return canvas();}},
  Number,Math,Error};
 vm.createContext(context);
 vm.runInContext(helperCode,context);
 return {original,draws,helper:value=>vm.runInContext('boundedOutfitAnalysisJPEG27',context)(value)};
}
test('small JPEG is reused unchanged with no canvas or lossy derivative',async()=>{
 const m=createPreparationMock(1600,1200);
 const result=await m.helper(m.original);
 assert.equal(result,m.original);
 assert.equal(m.draws.length,0);
});
test('4000x3000 original produces model-only 3072x2304 JPEG, preserving source bytes',async()=>{
 const m=createPreparationMock(4000,3000);
 const originalBefore=m.original;
 const result=await m.helper(m.original);
 assert.notEqual(result,m.original);
 assert.equal(m.original,originalBefore);
 assert.match(result,/^data:image\/jpeg;base64,/);
 assert.deepEqual(JSON.parse(JSON.stringify(m.draws)),[[0,0,3072,2304]]);
});
test('a legitimate large original below 10 MiB can be encoded for the worker without a 3072px rejection',async()=>{
 const m=createPreparationMock(4032,3024,{length:13_200_000});
 const result=await m.helper(m.original);
 assert.notEqual(result,m.original);
 assert.equal(m.draws[0][2],3072);
 assert.equal(m.draws[0][3],2304);
 assert.equal(m.original.length,13_200_023);
});
test('original over 48 million pixels is rejected rather than allocating huge image memory',async()=>{
 const m=createPreparationMock(8192,8192);
 await assert.rejects(()=>m.helper(m.original),/safe in-memory analysis limits/);
 assert.equal(m.draws.length,0);
});
test('untrusted image type and canvas failure cannot silently produce a model input',async()=>{
 const m=createPreparationMock(4000,3000);
 await assert.rejects(()=>m.helper('data:image/png;base64,QUJD'),/Invalid original JPEG/);
 const bad=createPreparationMock(4000,3000,{badCanvas:true});
 await assert.rejects(()=>bad.helper(bad.original),/canvas unavailable/);
});
test('live full-photo source is posted unchanged alongside derived analysis, after an owner/session guard',()=>{
 assert.match(capture,/job\.worker\.postMessage\(\{id:job\.id,image,analysisImage\}\)/);
 assert.match(capture,/if\(job!==outfitSplitJob\|\|captureProofOwner\(\)!==job\.owner\)return/);
 assert.match(capture,/if\(!guarded\)job\.worker\.postMessage\(\{id:job\.id,image\}\)/);
 assert.match(capture,/originalPhoto:\{image\}/);
 assert.match(capture,/sourceSHA256|sourceHashVerified/);
 assert.doesNotMatch(helperCode,/fetch\(|localStorage|indexedDB|sessionStorage|gallery/i);
});
function fakeWorker({original={width:4000,height:3000},derived={width:2048,height:1536},
  noAnalysis=false,invalidAnalysis=false,tooLarge=false}={}){
 const events=[],reads=[],processed=[];
 const input=tooLarge?{width:8500,height:8500}:original;
 class Img{
  constructor(data,width,height,channels=3){Object.assign(this,{data,width,height,channels});}
  static async read(dataUrl){
   reads.push(dataUrl);
   const dimensions=dataUrl.endsWith('QUJD')?input:derived;
   return new Img(new Uint8ClampedArray(dimensions.width*dimensions.height*3),
    dimensions.width,dimensions.height,3);
  }
  async toBlob(){return {arrayBuffer:async()=>Uint8Array.from([255,216,255,217]).buffer};}
 }
 const area=20*20;
 const logits=new Float32Array(area*18).fill(-10);
 for(let i=0;i<area;i++)logits[i]=10;
 const runtime={
  AutoModelForSemanticSegmentation:{from_pretrained:async()=>async value=>{
   processed.push({width:value.width,height:value.height});
   return {logits:{data:logits,dims:[1,18,20,20]}};
  }},
  AutoProcessor:{from_pretrained:async()=>async value=>value},
  RawImage:Img,
  env:{backends:{onnx:{wasm:{}}}}
 };
 const mapSelected=new Uint8Array(area);
 for(let y=6;y<9;y++)for(let x=6;x<10;x++)mapSelected[y*20+x]=1;
 const props={selected:mapSelected,id:4,label:'Upper garment',
  categories:['Tops','Outerwear'],types:[],clipped:false,
  confidence:.99,bounds:{left:6,top:6,right:10,bottom:9}};
 const regionModel={...segmentation,
  clothingLabelMap:()=>({labels:new Uint8Array(area),confidence:new Float32Array(area),
   width:20,height:20,personDetected:true}),
  clothingMaskGroups:()=>[props]
 };
 const c={runtime,segmentation:regionModel,PhotoColor,
  self:{postMessage:event=>events.push(event)},Uint8Array,Uint8ClampedArray,
  btoa:text=>Buffer.from(text,'binary').toString('base64')};
 vm.createContext(c);
 const code=workerSource.replace(/await import\('https:[^']+'\)/,"await Promise.resolve(runtime)")
  .replace("await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search)","await Promise.resolve(segmentation)")
  .replace("await import('./photo-color.js'+new URL(import.meta.url).search)","await Promise.resolve()");
 vm.runInContext(code,c);
 return {reads,processed,events,async run(){
  c.self.onmessage({data:{id:'source27',image:'data:image/jpeg;base64,QUJD',
   ...(!noAnalysis?{analysisImage:invalidAnalysis?'data:image/png;base64,REVG':'data:image/jpeg;base64,REVG'}:{})}});
  await vm.runInContext('chain',c);
  return events;
 }};
}
test('worker runs SegFormer only on derived image and crops/color samples from full original resolution',async()=>{
 const w=fakeWorker(),events=await w.run();
 assert.deepEqual(w.processed,[{width:2048,height:1536}]);
 assert.deepEqual(w.reads,['data:image/jpeg;base64,QUJD','data:image/jpeg;base64,REVG']);
 const piece=events.find(x=>x.type==='piece')?.piece;
 assert.ok(piece,'expected original-resolution crop');
 assert.equal(piece.label,'Upper garment');
 assert.ok(piece.cropBounds.width>.19&&piece.cropBounds.width<.23,
  'mask box was scaled from model output back to original');
 assert.ok(events.some(x=>x.type==='done'&&x.count===1));
 assert.ok(!events.some(x=>x.type==='error'));
});
test('oversized original without a derived model input still fails closed, never fabricates pieces',async()=>{
 const w=fakeWorker({noAnalysis:true});
 const events=await w.run();
 assert.equal(w.processed.length,0);
 assert.ok(events.some(x=>x.type==='error'));
 assert.equal(events.filter(x=>x.type==='piece').length,0);
});
test('malformed analysis JPEG refuses processing before source decode',async()=>{
 const w=fakeWorker({invalidAnalysis:true});
 const events=await w.run();
 assert.equal(w.reads.length,0);
 assert.ok(events.some(x=>x.type==='error'));
});
test('oversized 8500px original rejects before allocate second model image',async()=>{
 const w=fakeWorker({tooLarge:true});
 const events=await w.run();
 assert.equal(w.reads.length,1);
 assert.equal(w.processed.length,0);
 assert.ok(events.some(x=>x.type==='error'));
});
