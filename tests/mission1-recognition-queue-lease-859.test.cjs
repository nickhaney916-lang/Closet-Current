'use strict';
// P859 runs the actual latest app queue and scanner source. Every JPEG,
// account, worker result and IndexedDB handle here is SYNTHETIC. No deployment.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const take=(start,end)=>{
 const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'source boundary not found: '+start);
 return app.slice(a,b);
};
const queue=take('function queueAutomatic(item){','function stopCamera(){');
const scanner=take('async function recognizeItem(item){','async function recognizeBatch(){');
function deferred(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};}
function item(image,id='same-draft-859'){return {id,image,category:'Uncategorized',itemType:'Unknown',color:'Unknown',name:'',userAdjusted:false,localAnalyzed:false,segmentHint:null};}
const photos={a:'data:image/jpeg;base64,AAE=',b:'data:image/jpeg;base64,AAI=',c:'data:image/jpeg;base64,AAM='};
async function until(check,reason){
 for(let n=0;n<180;n++){
  if(check())return;
  await new Promise(r=>setTimeout(r,2));
 }
 assert.fail('timed out waiting for '+reason);
}
function fixture(){
 const owner={id:'SYNTHETIC-A'},db={name:'closet-current-user-SYNTHETIC-A'};
 const old=item(photos.a);
 const modelJobs=new Map(),log={photos:[],workers:[],persists:0,render:0,drains:0,saves:0,events:[],errors:[]};
 const scope={
  window:{document:{},closetAuth:{user:owner}},db,batch:[old],items:[],recognitionState:{phase:'idle',activeId:null},
  automaticQueue:[],automaticRunning:false,localPending:new Set(),localReady:true,recognitionUnavailable:false,
  photoQualityHints73:new Map(),reviewFirst836:true,
  render(){log.render++;},persistDraft(){log.persists++;},scheduleMemoryReview(){log.drains++;},
  message(v){log.events.push(v);},$(){return {textContent:''}},
  checkPhoto(src){log.photos.push(src);return Promise.resolve({blank:false,captureGuidance:null,colorEstimate:{primary:'Blue'},signature:Array(768).fill(44),aspect:.6});},
  localRequest(type,src,id){assert.equal(type,'classify');log.workers.push(src);
   const d=deferred();modelJobs.set(src,d);return d.promise;},
  ClothingDetails:{fillColor(){return {color:'Blue'};},fill(){return {};}},
  similarPhotos(){return false;},segmentationAllows(){return true;},
  applyLocalChoice(v,choice){v.category=choice.category;v.itemType=choice.itemType;},
  recordDeviceEvent(){},enableLocal(){return Promise.resolve();},
  saveIndexed(){log.saves++;return Promise.resolve(false);},
  automaticAdmissionCore842(){return false;},
  Map,Set,Symbol,Date,Promise,JSON,Array
 };
 const api=vm.runInNewContext('const pendingScanLease859=new Map();\n'+queue+'\n'+scanner+'\n({queueAutomatic,drainAutomatic,recognizeItem,pendingScanLease859})',scope);
 const answer=()=>({strong:false,categoryConfirmed:false,choices:[],reason:'synthetic uncertain'});
 return {old,scope,api,log,modelJobs,answer,owner};
}
test('P859 same owner, same ID replacement queued while old model awaits retains new pending/active/owner state',async()=>{
 const f=fixture();f.api.queueAutomatic(f.old);
 await until(()=>f.modelJobs.has(photos.a),'first actual scanner model request');
 const updated=item(photos.b);f.scope.batch=[updated];f.api.queueAutomatic(updated);
 assert.equal(f.scope.localPending.has(updated.id),true);
 f.modelJobs.get(photos.a).resolve(f.answer());
 await until(()=>f.modelJobs.has(photos.b),'fresh replacement classifier request');
 assert.equal(f.scope.localPending.has(updated.id),true,'old finally cannot clear successor pending');
 assert.equal(f.scope.recognitionState.activeId,updated.id,'old finally cannot clear successor active ID');
 assert.equal(f.log.persists,0,'old discarded result cannot persist while new scan is running');
 f.modelJobs.get(photos.b).resolve(f.answer());
 await until(()=>!f.scope.automaticRunning,'new scan finish');
 assert.equal(updated.localAnalyzed,true);
 assert.equal(f.old.localAnalyzed,false);
 assert.equal(f.scope.localPending.size,0);
 assert.equal(f.api.pendingScanLease859.size,0);
 assert.equal(f.log.persists,1);
 assert.equal(f.log.saves,0);
});
test('P859 replaced same-ID draft automatically requeues after old worker aborts without user action',async()=>{
 const f=fixture();f.api.queueAutomatic(f.old);
 await until(()=>f.modelJobs.has(photos.a),'first model');
 const newItem=item(photos.b);f.scope.batch=[newItem]; // no explicit queue
 f.modelJobs.get(photos.a).resolve(f.answer());
 await until(()=>f.modelJobs.has(photos.b),'automatically requeued second source');
 assert.equal(f.scope.localPending.has(newItem.id),true);
 f.modelJobs.get(photos.b).resolve(f.answer());
 await until(()=>!f.scope.automaticRunning,'new scan finish');
 assert.equal(newItem.localAnalyzed,true);
 assert.deepEqual(f.log.workers,[photos.a,photos.b]);
 assert.equal(f.api.pendingScanLease859.size,0);
 assert.equal(f.log.saves,0);
});
test('P859 old item removed while still in FIFO queue never scans replacement under old source identity',async()=>{
 const f=fixture();
 f.scope.automaticRunning=true; // temporarily keep FIFO scheduled, simulate delayed drain
 f.api.queueAutomatic(f.old);
 const newItem=item(photos.c);f.scope.batch=[newItem];
 f.scope.automaticRunning=false;
 const drain=f.api.drainAutomatic();
 await until(()=>f.modelJobs.has(photos.c),'replacement model');
 assert.deepEqual(f.log.photos,[photos.c]);
 assert.equal(f.scope.localPending.has(newItem.id),true);
 f.modelJobs.get(photos.c).resolve(f.answer());await drain;
 assert.equal(f.scope.localPending.size,0);
 assert.equal(f.api.pendingScanLease859.size,0);
 assert.equal(newItem.localAnalyzed,true);
});
test('P859 old owner worker finish cannot clear same-ID NEW signed owner queued pending or persist old data',async()=>{
 const f=fixture();f.api.queueAutomatic(f.old);
 await until(()=>f.modelJobs.has(photos.a),'old owner worker');
 f.scope.window.closetAuth.user={id:'SYNTHETIC-B'};
 f.scope.db={name:'closet-current-user-SYNTHETIC-B'};
 const second=item(photos.b);f.scope.batch=[second];
 f.api.queueAutomatic(second);
 f.modelJobs.get(photos.a).resolve(f.answer());
 await until(()=>f.modelJobs.has(photos.b),'new owner worker');
 assert.equal(f.log.persists,0);
 assert.equal(f.scope.localPending.has(second.id),true);
 f.modelJobs.get(photos.b).resolve(f.answer());
 await until(()=>!f.scope.automaticRunning,'new owner scan finish');
 assert.equal(f.log.persists,1,'only current signed owner may persist');
 assert.equal(f.scope.localPending.size,0);
 assert.equal(f.log.saves,0);
});
test('P859 original item recropped in place while model is pending receives fresh source scan, not prior model result',async()=>{
 const f=fixture();f.api.queueAutomatic(f.old);
 await until(()=>f.modelJobs.has(photos.a),'old crop worker');
 f.old.image=photos.b;
 f.modelJobs.get(photos.a).resolve(f.answer());
 await until(()=>f.modelJobs.has(photos.b),'new crop worker');
 assert.equal(f.old.localAnalyzed,false);
 assert.equal(f.scope.localPending.has(f.old.id),true);
 f.modelJobs.get(photos.b).resolve(f.answer());
 await until(()=>!f.scope.automaticRunning,'revised crop scan finish');
 assert.equal(f.old.localAnalyzed,true);
 assert.equal(f.log.saves,0);
 assert.equal(f.api.pendingScanLease859.size,0);
});
test('P859 exact application still requires owner review, signed source lease and strict subtype/photo/label custody',()=>{
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/const live854=\(\)=>sameOwner854\(\)/);
 assert.match(app,/const pendingScanLease859=new Map\(\)/);
 assert.match(app,/if\(!lease\|\|lease\.item!==item\)continue/);
 assert.match(scanner,/pendingScanLease859\.get\(item\.id\)===lease859/);
 assert.match(app,/P80_STALE_SAVE_SCOPE/);
 assert.match(app,/function unit70OwnerEvidenceValid\(/);
 assert.match(app,/const reviewed72=/);
});
