'use strict';
// Mission 3: the exact app.js crop callbacks and exact photo-crop-editor.js,
// never a rewritten implementation, executed against immutable parent + fix.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=process.env.CAMERA_SOURCE_ROOT||'.';
const baseline=process.env.EXPECT_BASELINE==='1';
const app=fs.readFileSync(root+'/public/app.js','utf8');
const editor=fs.readFileSync(root+'/public/photo-crop-editor.js','utf8');
function get(source,a,b){
 const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Exact runtime source missing: '+a);
 return source.slice(i,j);
}
const ownerLease=get(app,'function ownerWardrobeMutationLease(){','function writeAll(values){');
const cropCode=get(app,'function cropClothingPhoto(item){','function cropButton(item){');
const jpeg='data:image/jpeg;base64,/9j/';
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});promise.catch(()=>{});return {promise,resolve,reject};}
function dbFixture(owner,{holdCommit=false}={}){
 const txGate=deferred(),writes=[];
 let commits=0;
 const db={
  name:'closet-current-user-'+owner,
  transaction(store,mode){
   assert.equal(store,'state');assert.equal(mode,'readwrite');
   const tx={oncomplete:null,onerror:null,onabort:null,error:null,objectStore(name){
    assert.equal(name,'state');
    return {put(value){writes.push(structuredClone(value));}};
   }};
   queueMicrotask(async()=>{
    if(holdCommit)await txGate.promise;
    commits++;tx.oncomplete?.();
   });
   return tx;
  }
 };
 return {db,writes,releaseCommit:()=>txGate.resolve(),get commits(){return commits;}};
}
const row=(owner,extra={})=>({id:'same-id',ownerId:owner,category:'Tops',itemType:'T-shirt',
 color:owner==='A'?'Blue':'Red',colorSource:'user',image:jpeg,originalPhoto:{image:jpeg,sha256:'a'.repeat(64)},...extra});
function fixture({holdPhoto=false,holdQueue=false,holdCommit=false,holdLocal=false,saved=false}={}){
 const first=dbFixture('A',{holdCommit}),second=dbFixture('B'),photo=deferred(),queue=deferred(),local=deferred(),events=[];
 const old=row('A'),next=row('B'),auth={user:{id:'A'},assertCurrent(){}};
 let handler;
 const ctx={
  window:{closetAuth:auth},db:first.db,captureOperationEpoch:0,localPending:new Set(),busy:false,stream:null,cameraOpening:false,
  items:saved?[old]:[],batch:saved?[]:[old],structuredClone,
  openPhotoCrop:(_item,opts)=>{handler=opts;return Promise.resolve();},
  checkPhoto:()=>holdPhoto?photo.promise:Promise.resolve({colorEstimate:{color:'Blue'},signature:'sig-a',aspect:1}),
  queued:fn=>holdQueue?queue.promise.then(fn):fn(),
  ClothingDetails:{fillColor:()=>({}),recognizedFields:()=>({})},
  localReady:!holdLocal,enableLocal:()=>holdLocal?local.promise:Promise.resolve(),
  localRequest:async()=>({strong:true,categoryConfirmed:true,choices:[{category:'Tops',itemType:'T-shirt'}],details:{}}),
  segmentationAllows:()=>true,applyLocalChoice(){},stopCamera(){},
  render:()=>events.push('render:'+auth.user.id),message:v=>events.push('message:'+auth.user.id+':'+v)
 };
 vm.createContext(ctx);
 vm.runInContext(ownerLease+'\n'+cropCode,ctx);
 ctx.cropClothingPhoto(old);
 assert.ok(handler,'Actual app must call crop editor with callbacks');
 return {ctx,old,next,first,second,photo,queue,local,events,get handler(){return handler;},
  switchOwner({sameOwner=false}={}){
   ctx.captureOperationEpoch++;
   if(!sameOwner){auth.user.id='B';ctx.db=second.db;ctx.batch=[next];ctx.items=[];}
  }};
}
const photoPayload={image:jpeg,originalPhoto:{image:jpeg,sha256:'a'.repeat(64)},cropBounds:{x:.1,y:.1,width:.8,height:.8}};
const result=promise=>promise.then(()=> 'saved',()=> 'rejected');

test('old-owner color analysis settling after account switch never writes new owner draft',async()=>{
 const f=fixture({holdPhoto:true}),pending=result(f.handler.save(photoPayload,null));
 f.switchOwner();f.photo.resolve({colorEstimate:{color:'Green'},signature:'x',aspect:1});
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.second.writes.length,baseline?1:0);
 assert.equal(f.events.includes('render:B'),baseline);
 assert.equal(f.next.color,'Red');
});
test('same owner ID relogin revokes earlier unfinished crop while color checks are pending',async()=>{
 const f=fixture({holdPhoto:true}),pending=result(f.handler.save(photoPayload,null));
 f.switchOwner({sameOwner:true});f.photo.resolve({colorEstimate:null,signature:'x',aspect:1});
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.first.writes.length,baseline?1:0);
});
test('old owner queued crop draft may not overwrite different owner same-ID private draft',async()=>{
 const f=fixture({holdQueue:true}),pending=result(f.handler.save(photoPayload,null));
 for(let i=0;i<10;i++)await Promise.resolve();
 f.switchOwner();f.queue.resolve();
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.second.writes.length,baseline?1:0);
 assert.equal(f.next.ownerId,'B');
});
test('old owner queued draft transaction completion cannot publish a stale crop on new owner UI',async()=>{
 const f=fixture({holdCommit:true}),pending=result(f.handler.save(photoPayload,null));
 for(let i=0;i<12&&!f.first.writes.length;i++)await Promise.resolve();
 assert.equal(f.first.writes.length,1);
 f.switchOwner();f.first.releaseCommit();
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.events.includes('render:B'),baseline);
 assert.equal(f.second.writes.length,0);
});
test('photo recognition after account change cannot apply previous owner suggested details',async()=>{
 const f=fixture({holdLocal:true});
 const p=result(f.handler.analyze(jpeg));
 f.switchOwner();f.local.resolve();
 assert.equal(await p,baseline?'saved':'rejected');
});
test('revoked crop editor open failure cannot show warning on the next owner screen',async()=>{
 const f=fixture();
 // The exact app crop callback .catch is tested through a second extraction
 // using a rejected editor call after a switch.
 const src=cropCode;
 const failures=[];
 f.ctx.openPhotoCrop=()=>Promise.reject(Error('Old camera JPEG decode failed'));
 f.ctx.message=v=>failures.push(v);
 f.switchOwner(); // new account now active
 const old=f.old;
 // Force the original invocation's pending editor rejection under owner B
 // with a second VM fixture so rejection is deferred across a session switch.
 const g=fixture();const gate=deferred();
 g.ctx.openPhotoCrop=()=>gate.promise;
 g.ctx.cropClothingPhoto(g.old);
 g.switchOwner();gate.reject(Error('Old photo unavailable'));
 for(let i=0;i<10;i++)await Promise.resolve();
 assert.equal(g.events.some(x=>x.startsWith('message:B:')),baseline);
});
test('valid same-owner crop of unsaved review draft persists and renders while retaining original JPEG',async()=>{
 const f=fixture();
 assert.equal(await result(f.handler.save(photoPayload,null)),'saved');
 assert.equal(f.first.writes.length,1);
 assert.equal(f.first.writes[0].batch[0].originalPhoto.image,jpeg);
 assert.equal(f.first.writes[0].batch[0].cropBounds.width,.8);
 assert.equal(f.old.cropBounds.width,.8);
 assert.deepEqual(f.events,['render:A']);
});
test('valid same-owner saved garment crop uses exact opening-row CAS, not blind upsert',async()=>{
 const f=fixture({saved:true});let writes=0,protectedEdits=0;
 f.ctx.writeAll=async values=>{writes++;assert.equal(values.length,1);};
 f.ctx.saveEditedGarment=async(value,expected)=>{
  protectedEdits++;
  assert.equal(value.ownerId,'A');
  assert.equal(expected.id,f.old.id);
  assert.equal(expected.cropBounds,undefined,'Review snapshot predates new crop');
  assert.equal(expected.originalPhoto.image,jpeg,'Original snapshot is intact');
 };
 assert.equal(await result(f.handler.save(photoPayload,null)),'saved');
 assert.equal(writes,baseline?1:0,'Guarded crops must not use blind writeAll');
 assert.equal(protectedEdits,baseline?0:1,'Guarded crops must use row CAS');
 assert.equal(f.old.cropBounds.width,.8);
 assert.deepEqual(f.events,['render:A']);
});
test('active crop analysis returns suggested details without changing item or database',async()=>{
 const f=fixture();const result=await f.handler.analyze(jpeg);
 assert.equal(result.category,'Tops');
 assert.equal(result.itemType,'T-shirt');
 assert.equal(f.first.writes.length,0);
 assert.equal(f.old.localAnalyzed,undefined);
});
class FakeEl{
 constructor(tag){this.tag=tag;this.children=[];this.isConnected=false;this.open=false;
 this.style={};this.dataset={};this.classList={add(){},remove(){}};this.textContent='';this.hidden=false;}
 append(...children){for(const c of children){this.children.push(c);if(c&&typeof c==='object')c.isConnected=this.isConnected;}}
 setAttribute(){}
 querySelectorAll(){return [];}
 showModal(){this.open=true;this.isConnected=true;this.children.forEach(c=>{if(c&&typeof c==='object')c.isConnected=true;});}
 addEventListener(){}
 remove(){this.isConnected=false;this.open=false;}
 getContext(){return {drawImage(){},getImageData(){return {data:new Uint8ClampedArray(40000)};},clearRect(){},putImageData(){}};}
 getAttribute(){return null;}
}
function editorFixture(){
 const decode=deferred(),appended=[];
 const document={
  createElement:tag=>new FakeEl(tag),
  createTextNode:s=>({textContent:s}),
  body:{append(node){appended.push(node);node.isConnected=true;}}
 };
 class Image{constructor(){this.naturalWidth=100;this.naturalHeight=100;}decode(){return decode.promise;}}
 const ctx={window:{PhotoCropEngine:{
  bounds:v=>v||{x:0,y:0,width:1,height:1},
  pixels:()=>({x:0,y:0,width:100,height:100,outputWidth:100,outputHeight:100})
 }},document,Image,Uint8ClampedArray,Math,Number,Object};
 vm.createContext(ctx);vm.runInContext(editor,ctx);
 return {ctx,decode,appended};
}
test('old image.decode result cannot reopen a crop dialog after account revocation',async()=>{
 const f=editorFixture();let active=true;
 const p=f.ctx.window.openPhotoCrop({image:jpeg},{analyze:async()=>null,save:async()=>{},isCurrent:()=>active});
 active=false;f.decode.resolve();await p;
 assert.equal(f.appended.length,baseline?1:0);
});
test('current-owner successful image decode retains normal crop preview and Save dialog',async()=>{
 const f=editorFixture();
 const p=f.ctx.window.openPhotoCrop({image:jpeg},{analyze:async()=>null,save:async()=>{},isCurrent:()=>true});
 f.decode.resolve();await p;
 assert.equal(f.appended.length,1);
 assert.equal(f.appended[0].open,true);
});
