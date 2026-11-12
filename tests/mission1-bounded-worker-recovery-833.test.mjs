import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrialRecoverySession833} from '../public/phone-photo-run-recovery-833.mjs';

const coded=(code,message='PRIVATE_ORIGINAL_FILE_NAME.jpeg')=>Object.assign(Error(message),{code});
function fakeWorkerPlan(events){
 let loaded=0,closed=0;const seen=[];
 return {
  seen, get loaded(){return loaded;},get closed(){return closed;},
  session:{
   async call(x){
    seen.push(x.type==='classify'?{type:'classify',picture:true}:{type:x.type});
    if(x.type==='load'){loaded++;const fault=events.load;if(fault)throw fault;return {type:'ready'};}
    const current=events.classify.shift();
    if(current instanceof Error)throw current;
    return current||{type:'result',strong:false,choices:[]};
   },
   close(){closed++;}
  }
 };
}
test('P833 successful real-workflow order does not create extra models or secretly re-run photos',async()=>{
 const worker=fakeWorkerPlan({classify:[{type:'result',choices:[{category:'Tops'}]}]});
 const x=createTrialRecoverySession833({makeSession:()=>worker.session});
 await x.load();
 const first=await x.classify('data:image/jpeg;base64,PRIVATE_A');
 assert.equal(first.choices[0].category,'Tops');
 assert.deepEqual(worker.seen,[{type:'load'},{type:'classify',picture:true}]);
 assert.equal(x.restartCount,0);
 x.close();x.close();
 assert.equal(worker.closed,1);
});
test('P833 original timeout stays a failed source; ONLY NEXT image gets one fresh worker and result',async()=>{
 const first=fakeWorkerPlan({classify:[coded('timeout')]});
 const second=fakeWorkerPlan({classify:[{type:'result',choices:[{category:'Shoes',itemType:'Sneakers'}]}]});
 const workers=[first,second],restarted=[];
 const x=createTrialRecoverySession833({makeSession:()=>workers.shift().session,onRestart:n=>restarted.push(n)});
 await x.load();
 await assert.rejects(x.classify('PRIVATE_SOURCE_JPEG_1'),e=>e.code==='timeout'&&!e.message.includes('PRIVATE_'));
 assert.equal(first.seen.filter(x=>x.type==='classify').length,1);
 assert.equal(second.seen.length,0,'do not silently retry the failed original');
 const next=await x.classify('PRIVATE_SOURCE_JPEG_2');
 assert.equal(next.choices[0].category,'Shoes');
 assert.deepEqual(restarted,[1]);
 assert.deepEqual(second.seen,[{type:'load'},{type:'classify',picture:true}]);
 assert.equal(x.restartCount,1);
 assert.equal(first.closed,1);
 x.close();
 assert.equal(second.closed,1);
});
test('P833 second worker crash after ONE recovery is terminal, all later photos fail fast',async()=>{
 const first=fakeWorkerPlan({classify:[coded('runtime')]});
 const second=fakeWorkerPlan({classify:[coded('timeout')]});
 let called=0;const x=createTrialRecoverySession833({makeSession:()=>{called++;return [first,second][called-1].session;}});
 await x.load();
 await assert.rejects(x.classify('PRIVATE_1'),e=>e.code==='runtime');
 await assert.rejects(x.classify('PRIVATE_2'),e=>e.code==='timeout');
 await assert.rejects(x.classify('PRIVATE_3'),e=>e.code==='runtime');
 assert.equal(called,2);
 assert.equal(first.closed,1);
 assert.equal(second.closed,1);
 assert.equal(x.restartCount,1);
});
test('P833 nonfatal per-photo error does not discard a working model',async()=>{
 const first=fakeWorkerPlan({classify:[coded('image'),{type:'result',strong:true}]});
 let n=0;const x=createTrialRecoverySession833({makeSession:()=>{n++;return first.session;}});
 await x.load();
 await assert.rejects(x.classify('PRIVATE_BAD_JPEG'),e=>e.code==='image');
 assert.equal((await x.classify('PRIVATE_VALID_JPEG')).strong,true);
 assert.equal(n,1);
 assert.equal(x.restartCount,0);
 x.close();
});
test('P833 load failure after a crash never loops through unbounded repeated model downloads',async()=>{
 const first=fakeWorkerPlan({classify:[coded('timeout')]});
 const second=fakeWorkerPlan({load:coded('network'),classify:[]});
 let n=0;const x=createTrialRecoverySession833({makeSession:()=>{n++;return [first,second][n-1].session;}});
 await x.load();
 await assert.rejects(x.classify('PHOTO_1'),e=>e.code==='timeout');
 await assert.rejects(x.classify('PHOTO_2'),e=>e.code==='runtime');
 await assert.rejects(x.classify('PHOTO_3'),e=>e.code==='runtime');
 assert.equal(n,2);
 assert.equal(second.closed,1);
});
test('P833 Start over during worker reload cannot publish a late result or restart once again',async()=>{
 const first=fakeWorkerPlan({classify:[coded('runtime')]});
 let release,close=0,calls=0,active=true;
 const second={call:({type})=>{
   calls++;
   if(type==='load')return new Promise(resolve=>{release=resolve;});
   return Promise.resolve({type:'result',strong:true});
  },close(){close++;}};
 const workers=[first.session,second];
 const x=createTrialRecoverySession833({makeSession:()=>workers.shift(),isActive:()=>active});
 await x.load();
 await assert.rejects(x.classify('PHOTO_1'),e=>e.code==='runtime');
 const late=x.classify('PHOTO_2');
 await Promise.resolve();
 active=false;x.close();release({type:'ready'});
 await assert.rejects(late,e=>e.code==='cancelled');
 assert.equal(calls,1,'must not submit original JPEG to a canceled worker');
 assert.equal(close,1);
 await assert.rejects(x.classify('PHOTO_3'),e=>e.code==='cancelled');
});
test('P833 invalid configuration refuses unlimited retries, callbacks and fabricated session',async()=>{
 for(const settings of [{makeSession:()=>{},maxRestarts:2},{makeSession:null},{makeSession:()=>{},isActive:null}]){
  assert.throws(()=>createTrialRecoverySession833(settings),/Invalid bounded/);
 }
 const x=createTrialRecoverySession833({makeSession:()=>({})});
 await assert.rejects(x.load(),e=>e.code==='runtime');
 await assert.rejects(x.load(),e=>e.code==='runtime');
});
