'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');

const original=readFileSync('public/cloud-backup.js','utf8');
const OWNER='11111111-1111-4111-8111-111111111111';
function boot(search,hostname='localhost'){
 const handlers=new Map(),els=new Map();
 for(const id of ['cloudStatus','cloudBanner','syncCloset','resolveCloudConflict'])
  els.set(id,{hidden:id!=='cloudStatus',textContent:'',onclick(){throw Error('legacy click should be cleared');}});
 let net=0,tokens=0,transactions=0,persists=0;
 const window={ClosetBackupEngine:{},closetAuth:{user:{id:OWNER},
   getAccessToken:async()=>{tokens++;return 'synthetic-no-real-auth';}},
   addEventListener(name,fn){handlers.set(name,fn);}};
 const context={window,location:{hostname,search},document:{getElementById:id=>els.get(id)||null},
  navigator:{storage:{persist:async()=>{persists++;}}},
  fetch:async()=>{net++;throw Error('legacy network must not be reached');},
  setInterval(){},setTimeout(){return 99;},clearTimeout(){},
  URLSearchParams,AbortController,Uint8Array,Error,Promise,Map,Array,crypto:globalThis.crypto};
 vm.runInNewContext(original,context,{filename:'public/cloud-backup.js'});
 const db={transaction(){transactions++;throw Error('legacy database transaction must not run');}};
 return {window,handlers,els,db,counts:()=>({net,tokens,transactions,persists})};
}

test('P145 opt-in local research stops legacy start, controls, and cloud traffic',async()=>{
 for(const hostname of ['localhost','127.0.0.1','[::1]']){
  const o=boot('?ownerReview145=research',hostname);
  assert.equal(o.window.closetCloud.ownerReviewHold145(),true);
  const result=await o.window.closetCloud.start(o.db,{});
  assert.equal(result.paused,true);
  assert.equal(result.reason,'owner-review-required');
  assert.equal(o.els.get('syncCloset').hidden,true);
  assert.equal(o.els.get('resolveCloudConflict').hidden,true);
  assert.equal(o.els.get('syncCloset').onclick,null);
  assert.equal(o.els.get('resolveCloudConflict').onclick,null);
  assert.match(o.els.get('cloudStatus').textContent,/automatic cloud backup and restore are paused/i);
  assert.doesNotMatch(o.els.get('cloudStatus').textContent,/11111111|image\/jpeg|Bearer|closet-photo/);
  assert.deepEqual(o.counts(),{net:0,tokens:0,transactions:0,persists:0});
 }
});

test('P145 blocks manual sync, dirty-write hooks and automatic browser retry events',async()=>{
 const o=boot('?ownerReview145=research');
 await o.window.closetCloud.start(o.db,{});
 await o.window.closetCloud.beforeWrite(o.db);
 o.window.closetCloud.changed();
 await o.window.closetCloud.sync();
 await o.window.closetCloud.sync({keepBoth:true});
 o.handlers.get('focus')();
 o.handlers.get('online')();
 o.handlers.get('pageshow')({persisted:true});
 o.handlers.get('pagehide')();
 assert.deepEqual(o.counts(),{net:0,tokens:0,transactions:0,persists:0});
});

test('P145 is not accidentally active on non-research hosts or without precise flag',()=>{
 for(const [search,host] of [
  ['', 'localhost'],
  ['?ownerReview145=review', 'localhost'],
  ['?ownerReview145=research', 'closet-current.example'],
  ['?ownerReview145=research', 'closet-current-staging.example'],
  ['?ownerReview145=research', 'sub.localhost'],
  ['?ownerReview145=research', '127.0.0.2']
 ]){
  const o=boot(search,host);
  assert.equal(o.window.closetCloud.ownerReviewHold145(),false,host+search);
 }
});

test('P145 uses no new photo, storage, account, network or deployment source',()=>{
 assert.match(original,/ownerReview145/);
 assert.match(original,/stopForReview145\(\)\)return \{paused:true,reason:'owner-review-required'\}/);
 assert.match(original,/async function api\([\s\S]*?if\(stopForReview145\(\)\)throw/);
 assert.match(original,/async function sync\([\s\S]*?if\(stopForReview145\(\)\)return/);
 assert.match(original,/async beforeWrite\(database\)\{if\(stopForReview145\(\)\)return/);
});
