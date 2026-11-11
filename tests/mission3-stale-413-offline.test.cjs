'use strict';
// Network-independent verification: exercise the ORIGINAL production
// writeCapacityPause function inside a locked-down vm, with a deterministic
// mock IndexedDB readwrite transaction. Never connects to owner services.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const root=process.env.CLOUD_SOURCE_ROOT||'.';
const old=process.env.EXPECT_BASELINE==='1';
const source=readFileSync(root+'/public/cloud-backup.js','utf8');
const begin=source.indexOf('async function writeCapacityPause(');
const end=source.indexOf('\n // Reject a stale in-flight cloud integrity fault',begin);
assert.ok(begin>=0&&end>begin,'must execute the actual owner-private capacity pause function');
const functionText=source.slice(begin,end);
async function evaluate({code,localRevision=2,expectedRevision=1,existingPause=null}){
 const marker={id:'cloud-sync',baseVersion:0,dirty:true,localRevision,
  capacityPause:existingPause,privateUnrelatedMarker:'keep'};
 let writes=0;
 async function transact(stores,mode,callback){
  assert.deepEqual(Array.from(stores),['state']);
  assert.equal(mode,'readwrite');
  const tx={
   abort(){throw Error('Unexpected IndexedDB abort');},
   objectStore(name){
    assert.equal(name,'state');
    return {
     get(id){
      assert.equal(id,'cloud-sync');
      const q={result:{...marker}};
      queueMicrotask(()=>q.onsuccess?.());
      return q;
     },
     put(value){Object.assign(marker,value);writes++;}
    };
   }
  };
  callback(tx);
  await new Promise(resolve=>setImmediate(resolve));
 }
 const f=vm.runInNewContext(functionText+'\nwriteCapacityPause',{
  transact,markerDefault:()=>({id:'cloud-sync',localRevision:0,dirty:false}),
  isCapacityError:value=>value===413||value===507
 });
 const outcome=await f(code,()=>{},expectedRevision);
 return {marker,writes,outcome};
}
test('source and exact parent contract correspond to intended branch',()=>{
 if(old){
  assert.match(source,/async function writeCapacityPause\(code,assertActive\)/);
  assert.doesNotMatch(functionText,/prior\.localRevision!==expectedRevision/);
 }else{
  assert.match(source,/async function writeCapacityPause\(code,assertActive,expectedRevision=null\)/);
  assert.match(functionText,/if\(code===413&&expectedRevision!==null&&/);
  assert.match(functionText,/prior\.localRevision!==expectedRevision/);
 }
});
test('old 413 from deleted photo must not pause newer owner revision',async()=>{
 const x=await evaluate({code:413,localRevision:2,expectedRevision:1});
 if(old){
  assert.equal(x.marker.capacityPause,413);
  assert.equal(x.writes,1);
 }else{
  assert.equal(x.marker.capacityPause,null);
  assert.equal(x.writes,0);
  assert.equal(x.outcome,'stale');
 }
 assert.equal(x.marker.localRevision,2);
 assert.equal(x.marker.privateUnrelatedMarker,'keep');
});
test('current-revision owner 413 remains safely paused until deliberate retry',async()=>{
 const x=await evaluate({code:413,localRevision:2,expectedRevision:2});
 assert.equal(x.marker.capacityPause,413);
 assert.equal(x.writes,1);
 if(!old)assert.equal(x.outcome,'saved');
});
test('HTTP 507 global cloud-full remains paused even across garment edits',async()=>{
 const x=await evaluate({code:507,localRevision:2,expectedRevision:1});
 assert.equal(x.marker.capacityPause,507);
 assert.equal(x.writes,1);
 if(!old)assert.equal(x.outcome,'saved');
});
test('manual owner recovery clears capacity pause without changing other state',async()=>{
 const x=await evaluate({code:null,localRevision:2,
  expectedRevision:null,existingPause:413});
 assert.equal(x.marker.capacityPause,null);
 assert.equal(x.marker.localRevision,2);
 assert.equal(x.marker.privateUnrelatedMarker,'keep');
 assert.equal(x.writes,1);
 if(!old)assert.equal(x.outcome,'saved');
});
