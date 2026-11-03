import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {
 auditNativeBoardPreservation01 as audit,
 createBoardPreserveReview01,
 BOARD_PRESERVE_01
} from '../research/board-preserve-01/native-outfit-loss-audit.mjs';

// THIS IS THE GENUINE, UNCHANGED EXISTING NATIVE BOARD NORMALIZER, not a
// shortened test double or reimplementation. It runs read-only in a VM.
const native=readFileSync('public/outfit-board-engine.js','utf8');
const ctx=vm.createContext({});
vm.runInContext(native+'\nthis.cleanNative=cleanOutfitBoard;',ctx,{
 filename:'public/outfit-board-engine.js',timeout:1500});
const normalize=(board,closet)=>ctx.cleanNative(board,closet);
const owner='fixture-A',lease={authenticated:true,ownerId:owner,generation:4};
let current={...lease};
const live=()=>({...current});
const item=(id,category,itemType)=>({
 id,ownerId:owner,category,itemType,color:'Blue',name:id
});
const closet=[
 item('dress','Dresses','Casual dress'),item('jacket','Outerwear','Jacket'),
 item('coat','Outerwear','Coat'),item('top','Tops','T-shirt'),
 item('pants','Bottoms','Jeans'),item('shoes','Shoes','Sneakers'),
 item('skirt','Bottoms','Skirt')
];
const base={name:'My outfit',slots:{top:'top',bottom:'pants',shoes:'shoes'},
 occasion:'Casual',season:'Fall',audience:'Women'};
const state=(currentBoard=base,saved=[])=>({id:'outfit-board',current:currentBoard,saved});
const inspect=(s=state(),c=closet)=>audit({state:s,closet:c,normalize,
 lease,current:undefined,live});
test('BOARD01 captures actual silent native erasure of original dress jacket, outer coat and durable outfit ID',()=>{
 const dress={name:'Dress and coat',outfit3dId:'outfit3d-real-A',
  slots:{top:'dress',layer2:'jacket',layer3:'coat',shoes:'shoes'},
  occasion:'Dinner',season:'Fall',audience:'Women',layerCount:3};
 const input=state(dress,[{...dress,name:'Saved dress'}]);
 const immutable=structuredClone(input),r=inspect(input);
 assert.equal(r.verdict,'REVIEW_DO_NOT_OVERWRITE');
 assert.equal(r.safeForNativeWrite,false);
 assert.equal(r.erasedDressLayers,4);
 assert.equal(r.erased3DIDs,2);
 assert.equal(r.boardCount,2);
 assert.equal(r.boards[0].originalRefCount,4);
 assert.equal(r.boards[0].retainedRefCount,2);
 assert.equal(r.boards[0].dress,true);
 assert.deepEqual(input,immutable,'P29/PR541 original authenticated board untouched');
 assert.equal(BOARD_PRESERVE_01.sourceStateNeverMutated,true);
});
test('BOARD01 preserves missing and recategorized references for explicit owner review',()=>{
 const input=state({...base,slots:{top:'top',bottom:'deleted-pants',shoes:'shoes'}},
 [{...base,name:'Legacy outfit',slots:{top:'top',bottom:'skirt',shoes:'shoes'}}]);
 const corrected=closet.map(x=>x.id==='skirt'?{...x,category:'Tops'}:x);
 const r=inspect(input,corrected);
 assert.equal(r.missingReferences,1);
 assert.ok(r.issues.some(x=>x.itemId==='deleted-pants'&&
  x.reason==='deleted-or-missing-saved-piece'));
 assert.ok(r.issues.some(x=>x.itemId==='skirt'&&
  x.reason==='native-category-or-layer-normalizer-removed-piece'));
 assert.equal(input.current.slots.bottom,'deleted-pants');
});
test('BOARD01 safe native comparison preserves ordinary owned shirt, jeans and sneakers',()=>{
 const r=inspect();
 assert.equal(r.safeForNativeWrite,true);
 assert.equal(r.missingReferences,0);
 assert.equal(r.erasedDressLayers,0);
 assert.equal(r.erased3DIDs,0);
 assert.equal(r.boardCount,1);
 assert.equal(r.boards[0].retainedRefCount,3);
});
test('BOARD01 refuses cross-account wardrobe source and invalid duplicate item IDs',()=>{
 const foreign=closet.map(x=>x.id==='pants'?{...x,ownerId:'other-account'}:x);
 assert.throws(()=>inspect(state(),foreign),/cross-account/);
 assert.throws(()=>inspect(state(),[...closet,closet[0]]),/duplicate/);
 assert.throws(()=>inspect(state({slots:{notASlot:'evil'}})),/malformed saved slot/);
});
test('BOARD01 refuses stale session generation, owner switch or user-gate revocation',()=>{
 current={...lease,generation:5};
 assert.throws(()=>inspect(),/session changed/);
 current={...lease,ownerId:'fixture-B'};
 assert.throws(()=>inspect(),/session changed/);
 current={...lease,authenticated:false};
 assert.throws(()=>inspect(),/session changed/);
 current={...lease};
});
test('BOARD01 async owner-bound research reader preserves original and NEVER offers write authorization',async()=>{
 let generation=8,who=owner,readCount=0;
 const auth={ready:Promise.resolve(),get user(){return {id:who};},
 getSessionGeneration(){return generation;}};
 const raw=state({...base,slots:{top:'dress',layer2:'jacket'}});
 const bridge=createBoardPreserveReview01({auth,
  readState:async lease=>{readCount++;assert.equal(lease.ownerId,owner);return structuredClone(raw);},
  readItems:async()=>structuredClone(closet),
  nativeNormalize:normalize});
 const r=await bridge.refresh();
 assert.equal(r.safeForNativeWrite,false);
 assert.throws(()=>bridge.assertSafeToConvert(),/refuses destructive/);
 const original=bridge.originalReadOnly();
 original.current.slots.layer2='evil';
 assert.equal(bridge.originalReadOnly().current.slots.layer2,'jacket');
 generation++;
 assert.throws(()=>bridge.current(),/session changed/);
 assert.throws(()=>bridge.originalReadOnly(),/session changed/);
 bridge.invalidate();
 assert.throws(()=>bridge.current(),/load current/);
 assert.equal(readCount,1);
});
test('BOARD01 rejects an authenticated owner switch halfway through async DB read',async()=>{
 let who=owner,epoch=2,release;
 const auth={ready:Promise.resolve(),get user(){return {id:who};},
 getSessionGeneration(){return epoch;}};
 const bridge=createBoardPreserveReview01({auth,
  readState:async()=>await new Promise(resolve=>{release=resolve;}),
  readItems:async()=>closet,nativeNormalize:normalize});
 const pending=bridge.refresh();
 while(!release)await new Promise(done=>setImmediate(done));
 who='fixture-B';epoch=3;release(state());
 await assert.rejects(pending,/session changed/);
 assert.throws(()=>bridge.current(),/load current/);
});
test('BOARD01 safe comparison receipt is NEVER an authorization to mutate native database',async()=>{
 const auth={ready:Promise.resolve(),user:{id:owner},getSessionGeneration:()=>3};
 const bridge=createBoardPreserveReview01({auth,
  readState:async()=>state(),readItems:async()=>closet,nativeNormalize:normalize});
 await bridge.refresh();
 const receipt=bridge.assertSafeToConvert();
 assert.equal(receipt.comparisonSafe,true);
 assert.equal(receipt.writeAuthorized,false);
 assert.equal(bridge.releaseAuthorized,false);
 assert.equal(BOARD_PRESERVE_01.releaseAuthorized,false);
});
