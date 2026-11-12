import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTrialPhotoJPEG832} from '../public/phone-photo-prep-832.mjs';

const jpeg='data:image/jpeg;base64,/9j/2Q==';
function fixture({deferred=false,width=4096,height=2048}={}){
 const state={made:0,decoded:0,drew:0,encoded:0,revoked:[],cleared:0,scheduled:new Map(),canceled:[],resolveDecode:null};
 class FakeImage{
  constructor(){state.made++;this.width=width;this.height=height;}
  set src(value){if(value==='')state.cleared++;this._src=value;}
  get src(){return this._src;}
  decode(){state.decoded++;return deferred?new Promise(resolve=>{state.resolveDecode=resolve;}):Promise.resolve();}
 }
 const context={fillRect:()=>{},drawImage:()=>{state.drew++;}};
 const canvasFactory=()=>({
  width:0,height:0,getContext:()=>context,
  toDataURL(type,quality){assert.equal(type,'image/jpeg');assert.equal(quality,.94);state.encoded++;return jpeg;}
 });
 let nextTimer=0;
 const deps={
  ImageClass:FakeImage,canvasFactory,
  createObjectURL:()=>{const name='blob:private-'+state.made;return name;},
  revokeObjectURL:url=>state.revoked.push(url),
  schedule:(run,ms)=>{const id=++nextTimer;state.scheduled.set(id,{run,ms});return id;},
  cancel:id=>{state.canceled.push(id);state.scheduled.delete(id);}
 };
 return {state,deps};
}
const file={size:1024,name:'PRIVATE_GARMENT_FILENAME.jpeg'};
test('P832 successful preparation exactly matches app JPEG limits, does not retain original source',async()=>{
 const {state,deps}=fixture();
 const result=await prepareTrialPhotoJPEG832(file,deps);
 assert.equal(result,jpeg);
 assert.equal(state.decoded,1);
 assert.equal(state.drew,1);
 assert.equal(state.encoded,1);
 assert.deepEqual(state.revoked,['blob:private-0']);
 assert.equal(state.cleared,1);
 assert.equal(state.scheduled.size,0);
 assert.equal(state.canceled.length,1);
 assert.ok(!result.includes('PRIVATE_'));
});
test('P832 abort during pending original photo decode prevents any late toDataURL or classification',async()=>{
 const {state,deps}=fixture({deferred:true});
 const ctrl=new AbortController();
 const pending=prepareTrialPhotoJPEG832(file,{...deps,signal:ctrl.signal});
 assert.equal(state.decoded,1);
 const expect=assert.rejects(pending,e=>e.code==='cancelled'&&!e.message.includes('PRIVATE_'));
 ctrl.abort();
 await expect;
 assert.equal(state.drew,0);
 assert.equal(state.encoded,0);
 assert.equal(state.cleared,1);
 assert.equal(state.revoked.length,1);
 assert.equal(state.scheduled.size,0);
 state.resolveDecode();
 await Promise.resolve();
 await Promise.resolve();
 assert.equal(state.encoded,0,'old original decode cannot encode after Start over');
});
test('P832 time-limited stalled decode truly releases source and cannot late encode',async()=>{
 const {state,deps}=fixture({deferred:true});
 const pending=prepareTrialPhotoJPEG832(file,{...deps,timeoutMs:15000});
 const expect=assert.rejects(pending,e=>e.code==='image'&&!e.message.includes('PRIVATE_'));
 assert.equal(state.scheduled.size,1);
 const pendingTimer=[...state.scheduled.values()][0];
 assert.equal(pendingTimer.ms,15000);
 pendingTimer.run();
 await expect;
 assert.equal(state.drew,0);
 assert.equal(state.encoded,0);
 assert.equal(state.cleared,1);
 assert.equal(state.revoked.length,1);
 state.resolveDecode();
 await Promise.resolve();
 assert.equal(state.encoded,0);
});
test('P832 prior cancellation and invalid file never decode, canvas-encode or create a blob URL',async()=>{
 const {state,deps}=fixture({deferred:true});
 const ctrl=new AbortController();ctrl.abort();
 await assert.rejects(prepareTrialPhotoJPEG832(file,{...deps,signal:ctrl.signal}),e=>e.code==='cancelled');
 for(const invalid of [null,{size:11*1024*1024},{size:-1},{size:NaN}]){
  await assert.rejects(prepareTrialPhotoJPEG832(invalid,deps),e=>e.code==='image');
 }
 for(const invalid of [0,-1,Infinity,15001]){
  await assert.rejects(prepareTrialPhotoJPEG832(file,{...deps,timeoutMs:invalid}),e=>e.code==='image');
 }
 assert.equal(state.made,0);
 assert.equal(state.encoded,0);
 assert.equal(state.revoked.length,0);
});
test('P832 accepts small/portrait photo and refuses non-JPEG accidental output',async()=>{
 const x=fixture({width:900,height:1600});
 assert.equal(await prepareTrialPhotoJPEG832(file,x.deps),jpeg);
 assert.equal(x.state.encoded,1);
 const y=fixture();
 y.deps.canvasFactory=()=>({getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=>('data:image/png;base64,PRIVATE_IMAGE')});
 await assert.rejects(prepareTrialPhotoJPEG832(file,y.deps),e=>e.code==='image');
 assert.equal(y.state.cleared,1);
 assert.equal(y.state.revoked.length,1);
});
