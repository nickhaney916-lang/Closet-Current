'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const {IDBFactory} = require('fake-indexeddb');
const wearSource = readFileSync('public/outfit-wear-history.js','utf8');
const engineSource = readFileSync('public/outfit-board-engine.js','utf8');
const appSource = readFileSync('public/app.js','utf8');
const wear = vm.createContext({Object,JSON,Array,Map,Set,Intl,Date,Promise});
vm.runInContext(engineSource.slice(0,engineSource.indexOf('function boardGaps')) +
 wearSource.slice(0,wearSource.indexOf('function displayWearDay')) +
 appSource.slice(appSource.indexOf('function partitionStartupWardrobe'),appSource.indexOf('function assertCompleteWardrobe')) +
 '\nfunction normalizeClothing(row){return row;}\n' +
 'Object.assign(globalThis,{readOutfitWearEvents,wearCombination,wearEligibleBoard,wearRediscover,transactOutfitWear})',wear);

const top={id:'top',ownerId:'A',name:'Top',category:'Tops',image:'synthetic'};
const bottom={id:'jeans',ownerId:'A',name:'Jeans',category:'Bottoms',image:'synthetic'};
const jacket={id:'jacket',ownerId:'A',name:'Jacket',category:'Outerwear',image:'synthetic'};
const board={name:'Everyday',slots:{top:'top',bottom:'jeans'}};
const entry={...board,id:'first',at:Date.parse('2026-11-24T10:00:00Z'),day:'2026-11-24'};
const inspect=value=>JSON.parse(JSON.stringify(value));

test('only structurally valid, same-owner records count toward deterministic rediscovery',()=>{
 const old={...entry,id:'old',at:Date.parse('2026-09-01'),day:'2026-09-01',slots:{layer:'jacket'}};
 const bad={...entry,id:'invalid',day:'2026-02-30'};
 const events=wear.readOutfitWearEvents({owner:'A',events:[bad,old,entry,{...entry,id:'retry'}]},'A');
 assert.deepEqual(inspect(events).map(row=>row.id),['first','old']);
 assert.deepEqual(inspect(wear.readOutfitWearEvents({owner:'B',events:[entry]},'A')),[]);
 const today=new Date(2026,10,24,12);
 const result=wear.wearRediscover([top,bottom,jacket,{...top,id:'new'}],events,today);
 assert.deepEqual(inspect(result).map(row=>[row.item.id,row.day]),[['new',undefined],['jacket','2026-09-01']]);
});

test('complete saved combinations require compatible owned pieces',()=>{
 assert.equal(wear.wearEligibleBoard(board,[top,bottom],'A'),true);
 assert.equal(wear.wearEligibleBoard(board,[top,{...bottom,ownerId:'B'}],'A'),false);
 assert.equal(wear.wearEligibleBoard(board,[top],'A'),false);
 assert.equal(wear.wearEligibleBoard({...board,slots:{top:'top'}},[top],'A'),false);
 assert.equal(wear.wearEligibleBoard({...board,slots:{top:'top'}},[{...top,category:'Dresses'}],'A'),true);
 assert.equal(wear.wearCombination({top:'top',layer:'top'}),null);
});

async function privateDB(){
 const factory=new IDBFactory();
 const db=await new Promise((resolve,reject)=>{
  const request=factory.open('closet-current-user-A',1);
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('state',{keyPath:'id'});
   request.result.createObjectStore('items',{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['state','items'],'readwrite');
  tx.objectStore('items').put(top);
  tx.objectStore('items').put(bottom);
  tx.objectStore('state').put({id:'outfit-board',saved:[board]});
  tx.oncomplete=resolve;
  tx.onabort=()=>reject(tx.error);
 });
 return db;
}

test('transaction serializes duplicate taps, validates saved board and revokes a queued session',async()=>{
 const ownerDB=await privateDB();
 let current=true;
 const session={owner:'A',ownerDB,current:()=>current};
 const access=(action,value)=>wear.transactOutfitWear(session,action,value);
 try{
  const results=await Promise.all([access('record',entry),access('record',{...entry,id:'retry'})]);
  assert.equal(results.filter(result=>result.duplicate).length,1);
  assert.deepEqual(inspect(await access('read')),{events:[entry]});
  await assert.rejects(access('record',{...entry,id:'stale',name:'Unsaved board'}),/Outfit changed/);
  await assert.rejects(access('record',{...entry,slots:{top:'top',bottom:'missing'}}),/Outfit changed/);
  await access('undo','first');
  assert.deepEqual(inspect(await access('read')),{events:[]});
  const late=access('record',entry);
  current=false;
  await assert.rejects(late,/Account changed/);
  current=true;
  assert.deepEqual(inspect(await access('read')),{events:[]});
  await access('record',entry);
  await access('reset');
  assert.deepEqual(inspect(await access('read')),{events:[]});
 }finally{ownerDB.close();}
});
