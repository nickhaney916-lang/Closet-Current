import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {suggestThreeOwnedOutfits,applyOwnedCombination} from '../research/e2e-integration-01/three-owned-looks.mjs';
import {diagnoseLiveIntegration,DONOR_PR541_SHA,CAPTURE_PR545_SHA,DENIM_PR544_SHA}
 from '../research/e2e-integration-01/cross-branch-adapter.mjs';

function ownerFixture(owner='account-A'){
 const data=[
  ['top','new-shirt','Tops','T-shirt'],['top','blouse','Tops','Blouse'],
  ['top','dress','Dresses','Casual dress'],['bottom','jeans1','Bottoms','Jeans'],
  ['bottom','jeans2','Bottoms','Jeans'],['bottom','skirt','Bottoms','Skirt'],
  ['shoes','sneakers','Shoes','Sneakers'],['shoes','boots','Shoes','Ankle boots'],
  ['layer2','jacket','Outerwear','Jacket'],['layer3','coat','Outerwear','Coat'],
  ['bag','bag','Accessories','Bag'],['accessory','ring','Accessories','Jewelry']
 ].map(([slot,id,category,itemType])=>({slot,id:owner+'-'+id,category,itemType}));
 let generation=1,activeOwner=owner,plan={slots:{},ownerId:owner,generation:1},
  valid=new Set(data.map(x=>x.id)),saveCount=0;
 const ctl={
  checkCurrentSession(){return {authenticated:true,ownerId:activeOwner,generation};},
  plan(){return {...plan,saveReady:Object.keys(plan.slots).length>0};},
  available(slot){return data.filter(x=>x.slot===slot&&valid.has(x.id));},
  clearSelection(){plan={slots:{},ownerId:activeOwner,generation};},
  setSlot(slot,id){
   if(!ctl.available(slot).some(x=>x.id===id))throw Error('Missing or reclassified');
   plan={...plan,slots:{...plan.slots,[slot]:id}};
  },
  save(){saveCount++;}, get saveCount(){return saveCount;},
  reclassify(id){valid.delete(id);},
  switchOwner(next){activeOwner=next;generation++;plan={slots:{},ownerId:next,generation};},
  get data(){return data;}
 };
 return ctl;
}
test('three distinct genuine combinations pin the newly saved shirt',()=>{
 const c=ownerFixture(),id='account-A-new-shirt';
 const v=suggestThreeOwnedOutfits(c,{pinnedId:id});
 assert.equal(v.status,'three-owned-outfits');
 assert.equal(v.combinations.length,3);
 assert.equal(new Set(v.combinations.map(x=>JSON.stringify(x.slots))).size,3);
 for(const x of v.combinations){
  assert.equal(x.slots.top,id);
  assert.ok(x.slots.bottom.startsWith('account-A-'));
  assert.ok(x.slots.shoes.startsWith('account-A-'));
  assert.equal(x.accountOwner,'account-A');
  assert.equal(x.meshCertified,false);
  assert.equal(x.originalPhotoFallbackRequired,true);
 }
 assert.equal(c.saveCount,0,'generating must never automatically save');
});
test('owned dresses never invent pants underneath',()=>{
 const c=ownerFixture(),r=suggestThreeOwnedOutfits(c,{pinnedId:'account-A-dress'});
 assert.equal(r.status,'three-owned-outfits');
 assert.ok(r.combinations.every(x=>x.onePieceDress&&!x.slots.bottom));
});
test('owned shoes can be pinned while tops/bottoms vary',()=>{
 const c=ownerFixture(),r=suggestThreeOwnedOutfits(c,{pinnedId:'account-A-sneakers'});
 assert.equal(r.status,'three-owned-outfits');
 assert.ok(r.combinations.every(x=>x.slots.shoes==='account-A-sneakers'));
});
test('outer jacket stays a distinct owned wardrobe reference and not invented 3D',()=>{
 const c=ownerFixture(),r=suggestThreeOwnedOutfits(c,{pinnedId:'account-A-jacket'});
 assert.equal(r.status,'three-owned-outfits');
 assert.ok(r.combinations.every(x=>x.slots.layer2==='account-A-jacket'&&x.meshCertified===false));
});
test('optional accessories and coats remain pinned only when saved and eligible',()=>{
 const c=ownerFixture();
 for(const id of ['account-A-bag','account-A-coat']){
  const r=suggestThreeOwnedOutfits(c,{pinnedId:id});
  assert.equal(r.status,'three-owned-outfits');
  assert.ok(r.combinations.every(x=>Object.values(x.slots).includes(id)));
 }
});
test('never fabricates a third outfit when genuine owned source choices are insufficient',()=>{
 const c=ownerFixture();
 for(const id of ['account-A-jeans2','account-A-skirt','account-A-blouse','account-A-boots','account-A-jacket'])
  c.reclassify(id);
 const x=suggestThreeOwnedOutfits(c,{pinnedId:'account-A-new-shirt'});
 assert.equal(x.status,'insufficient-owned-combinations');
 assert.ok(x.combinations.length<3);
 assert.match(x.reason,/Fewer than three/);
});
test('review-only, deleted or cross-owner pinned IDs cannot generate',()=>{
 const c=ownerFixture();
 for(const id of ['account-B-new-shirt','unsaved-temp','account-A-missing']){
  const v=suggestThreeOwnedOutfits(c,{pinnedId:id});
  assert.equal(v.status,'review-or-missing');
  assert.equal(v.combinations.length,0);
 }
});
test('reclassified or deleted sources are refused before modifying selections',async()=>{
 const c=ownerFixture(),v=suggestThreeOwnedOutfits(c,{pinnedId:'account-A-new-shirt'});
 c.setSlot('top','account-A-blouse');
 const before=JSON.stringify(c.plan().slots);
 c.reclassify(v.combinations[0].slots.bottom);
 await assert.rejects(applyOwnedCombination(c,v.combinations[0]),/missing or reclassified/i);
 assert.equal(JSON.stringify(c.plan().slots),before);
});
test('cross-owner stale proposal rejected before writing any outfit',async()=>{
 const c=ownerFixture(),v=suggestThreeOwnedOutfits(c,{pinnedId:'account-A-new-shirt'});
 c.switchOwner('account-B');
 await assert.rejects(applyOwnedCombination(c,v.combinations[0]),/another account/i);
 assert.equal(c.saveCount,0);
});
test('valid suggestion applies real saved IDs but does not silently save',async()=>{
 const c=ownerFixture(),v=suggestThreeOwnedOutfits(c,{pinnedId:'account-A-new-shirt'});
 const p=await applyOwnedCombination(c,v.combinations[2]);
 assert.equal(p.slots.top,'account-A-new-shirt');
 assert.deepEqual(p.slots,v.combinations[2].slots);
 assert.equal(c.saveCount,0);
});
test('contract diagnoses missing real PR545 auth epoch rather than faking it',()=>{
 assert.match(diagnoseLiveIntegration({user:{id:'real-owner'}}).status,/HOLD.*generation/);
 assert.equal(diagnoseLiveIntegration({user:{id:'A'},getSessionGeneration:()=>2}).status,
  'research-adapter-compatible');
 assert.equal(diagnoseLiveIntegration({user:null,getSessionGeneration:()=>2}).status,'HOLD: sign in required');
 assert.equal(diagnoseLiveIntegration({user:{id:'A'}}).productionReady,false);
});
test('exact donor revisions and read-only privacy constraints are pinned',()=>{
 assert.equal(DONOR_PR541_SHA,'df6885d6011cb33fb22dceb81a08f35a0ac4dd61');
 assert.equal(CAPTURE_PR545_SHA,'dbc3a75e508d006d6d87ffce69832246c2087890');
 assert.equal(DENIM_PR544_SHA,'eaccc4d7f945e2ea5af746f9486c5cccf03047e0');
 const src=readFileSync('research/e2e-integration-01/cross-branch-adapter.mjs','utf8');
 assert.match(src,/donor\/research\/outfit-3d-01\/research-panel/);
 assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.download\s*=/);
});
