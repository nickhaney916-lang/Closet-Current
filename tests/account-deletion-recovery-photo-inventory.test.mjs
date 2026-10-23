// Entirely synthetic read-only server-side recovery inventory acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeletionReviewPhotoInventory} from '../supabase/functions/account-delete/recovery-photo-inventory.mjs';
import {createDeletionRecoveryHandoff} from '../supabase/functions/account-delete/recovery-handoff.mjs';
import {readFileSync} from 'node:fs';

const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const name=i=>i.toString(16).padStart(64,'0')+'.jpg';
function fixture(count=237,{injection=null}={}){
 const records=Array.from({length:count},(_,i)=>name(i+1));
 let changed=false,reads=0;
 const pages=[];
 const scanner=createDeletionReviewPhotoInventory({enabled:true,async listPage({uid,limit,offset}){
  reads++;assert.equal(uid,A);assert.equal(limit,100);assert.equal(offset%100,0);
  if(injection==='new-photo'&&reads===5&&!changed){records.push(name(1000));changed=true;}
  const ret=records.slice(offset,offset+limit);pages.push({offset,size:ret.length});
  return ret;
 }});
 return {scanner,records,pages,reads:()=>reads};
}
test('237 exact owner-scoped names are paged, bounded and never exposed',async()=>{
 const h=fixture(),result=await h.scanner.inspect({uid:A});
 assert.equal(result.count,237);assert.equal(result.pages,3);
 assert.deepEqual(h.pages.map(x=>x.offset),[0,100,200]);
 assert.match(result.digest,/^[a-f0-9]{64}$/);
 assert.equal(result.ownerScoped,true);assert.equal(result.filenamesEnumerated,true);
 assert.equal(result.photoBytesVerified,false);
 const serialized=JSON.stringify(result);
 for(const secret of [A,B,name(1),name(237),'photo-1.jpg'])assert.ok(!serialized.includes(secret));
 assert.equal(Object.isFrozen(result),true);
});
test('same scoped filenames produce identical SHA across independent scans',async()=>{
 const h=fixture();
 const first=await h.scanner.inspect({uid:A}),second=await h.scanner.inspect({uid:A});
 assert.deepEqual(first,second);
});
test('single added photo changes digest even when hasPrivatePhotos remains true',async()=>{
 const h=fixture(237);
 const before=await h.scanner.inspect({uid:A});
 h.records.push(name(500));
 const after=await h.scanner.inspect({uid:A});
 assert.notEqual(before.digest,after.digest);
 assert.equal(before.count+1,after.count);
});
test('same-count swap is still detected, unlike presence/count-only review',async()=>{
 const h=fixture(237);
 const before=await h.scanner.inspect({uid:A});
 h.records[7]=name(8)+'broken';
 await assert.rejects(h.scanner.inspect({uid:A}),/malformed/);
 h.records[7]=name(500);h.records.sort();
 const after=await h.scanner.inspect({uid:A});
 assert.equal(before.count,after.count);
 assert.notEqual(before.digest,after.digest);
});
test('invalid identity, disabled scanner and absent privileged dependencies reject reads',async()=>{
 const h=fixture();
 await assert.rejects(h.scanner.inspect({uid:B}),/Expected values/);
 await assert.rejects(h.scanner.inspect({uid:'../'+A}),/Invalid scoped owner/);
 let reads=0;
 const disabled=createDeletionReviewPhotoInventory({listPage:()=>{reads++;return [];}});
 await assert.rejects(disabled.inspect({uid:A}),/disabled/);
 assert.equal(reads,0);
 assert.throws(()=>createDeletionReviewPhotoInventory({enabled:true}),/Missing privileged/);
});
test('non-array, too large, nested, unsorted and duplicated pages stop the review',async()=>{
 for(const returned of [null,{},Array(101).fill(name(2)),['nested/'+name(1)],
  [name(2),name(1)],[name(1),name(1)],['other.txt'],[null]]){
  const inspector=createDeletionReviewPhotoInventory({enabled:true,listPage:async()=>returned});
  await assert.rejects(inspector.inspect({uid:A}));
 }
});
test('uncertain pagination, changed pages, or greater than 10k photos fail closed',async()=>{
 let counter=0;
 const duplicate=createDeletionReviewPhotoInventory({enabled:true,listPage:async({offset})=>{
  counter++;return offset===0?Array.from({length:100},(_,i)=>name(i+1)):
   [name(99),name(100)];
 }});
 await assert.rejects(duplicate.inspect({uid:A}),/duplicated/);
 assert.equal(counter,2);
 const over=createDeletionReviewPhotoInventory({enabled:true,listPage:async({offset,limit})=>
  Array.from({length:limit},(_,i)=>name(offset+i+1))});
 await assert.rejects(over.inspect({uid:A}),/bounded|not exhaustively/);
});
test('independent recovery review requires privileged inventoried names; endpoint is still 503',()=>{
 const source=readFileSync('supabase/functions/account-delete/recovery-handoff.mjs','utf8');
 assert.match(source,/readPhotoInventory/);assert.match(source,/inventory changed during review/);
 const endpoint=readFileSync('supabase/functions/account-delete/index.ts','utf8');
 assert.match(endpoint,/status:503/);
 assert.match(endpoint,/deletionCompleted:false/);
 assert.doesNotMatch(endpoint,/recovery-photo-inventory|recovery-handoff/);
 assert.doesNotMatch(source,/deleteUser\(|removePhotos\(|unlockAccount\(|storage\.remove/);
});
