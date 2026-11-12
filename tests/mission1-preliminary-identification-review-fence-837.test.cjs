'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const src=fs.readFileSync('public/app.js','utf8');
const start=src.indexOf('function stopRecognitionWorker('),end=src.indexOf('async function enableLocal(');
assert(start>=0&&end>start,'read actual app worker-event handler');

function setup({reviewFirst836=true}={}){
 const item={id:'garment-1',category:'Uncategorized',itemType:'Unknown',userAdjusted:false};
 const calls={applied:0,renders:0,workers:[]};
 class FakeWorker{
  constructor(){calls.workers.push(this);}
  postMessage(message){this.latestMessage=message;}
  terminate(){}
 }
 const context={
  reviewFirst836,recognitionAssetVersion:'p837',Worker:FakeWorker,
  localWorker:null,localReady:true,recognitionUnavailable:false,
  recognitionState:{phase:'ready',percent:null},localJobs:new Map(),
  batch:[item],render(){calls.renders++},renderRecognitionNotice(){},
  segmentationAllows:()=>true,
  applyLocalChoice(target,choice){calls.applied++;target.category=choice.category;target.itemType=choice.itemType;},
  crypto:{randomUUID:()=> 'message-1'},
  setTimeout,clearTimeout,Date,recordDeviceEvent(){}
 };
 vm.createContext(context);vm.runInContext(src.slice(start,end),context);
 const choice={category:'Tops',itemType:'Sweatshirt',label:'a sweatshirt'};
 return {context,calls,item,choice,emit(data){
  const worker=calls.workers[0];
  assert(worker&&worker.latestMessage,'worker request was dispatched');
  worker.onmessage({data:{id:worker.latestMessage.id,...data}});
 }};
}
test('P837 opt-in review trial buffers pre-final confident wrong subtype event',async()=>{
 const x=setup({reviewFirst836:true});
 const result=x.context.localRequest('classify','source-jpeg','garment-1');
 x.emit({type:'identified',choice:x.choice});
 assert.equal(x.calls.applied,0);
 assert.equal(x.calls.renders,0);
 assert.equal(x.item.category,'Uncategorized');
 assert.equal(x.item.itemType,'Unknown');
 x.emit({type:'result',strong:true,choices:[x.choice],details:{}});
 const final=await result;
 assert.equal(final.strong,true);
 assert.equal(final.choices[0].itemType,'Sweatshirt');
 assert.equal(x.item.category,'Uncategorized');
 assert.equal(x.calls.applied,0);
});
test('P837 failed final recognition does not leave preliminary phantom clothing label',async()=>{
 const x=setup({reviewFirst836:true});
 const result=x.context.localRequest('classify','source-jpeg','garment-1');
 x.emit({type:'identified',choice:x.choice});
 x.emit({type:'result',strong:false,choices:[],reason:'category_uncertain',details:{}});
 const final=await result;
 assert.equal(final.strong,false);
 assert.equal(x.item.category,'Uncategorized');
 assert.equal(x.item.itemType,'Unknown');
 assert.equal(x.calls.applied,0);
});
test('P837 provisional identification in legacy control remains opt-in unchanged',async()=>{
 const x=setup({reviewFirst836:false});
 const result=x.context.localRequest('classify','source-jpeg','garment-1');
 x.emit({type:'identified',choice:x.choice});
 assert.equal(x.calls.applied,1);
 assert.equal(x.item.itemType,'Sweatshirt');
 x.emit({type:'result',strong:false,choices:[],reason:'category_uncertain'});
 await result;
});
test('P837 clipped item in review-first trial cannot get optimistic label',async()=>{
 const x=setup({reviewFirst836:true});
 x.item.segmentHint={clipped:true,categories:['Tops'],types:['Sweatshirt']};
 const result=x.context.localRequest('classify','source-jpeg','garment-1');
 x.emit({type:'identified',choice:x.choice});
 x.emit({type:'error',text:'Could not finish',stage:'identify',code:'device'});
 await assert.rejects(result,/Could not finish/);
 assert.equal(x.calls.applied,0);
 assert.equal(x.item.category,'Uncategorized');
});
