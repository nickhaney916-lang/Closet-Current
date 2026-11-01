import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountBoundCloset3DBridge} from '../research/three-d-68/account-bound-closet-3d-bridge.mjs';
import {readFileSync} from 'node:fs';
const makeJPEG=()=>{
 const bytes=Buffer.alloc(92,77);bytes[0]=255;bytes[1]=216;bytes[90]=255;bytes[91]=217;
 return 'data:image/jpeg;base64,'+bytes.toString('base64');
};
const sample={id:'top-1',image:makeJPEG(),category:'Tops',itemType:'Blouse',color:'Blue',
 userAdjusted:true,colorSource:'user',savedAt:'2026-10-31',indexedAt:'2026-10-31'};
const auth=()=>{let generation=2,user={id:'owner-A'};return {
 ready:Promise.resolve(),get user(){return user;},getSessionGeneration:()=>generation,
 signOut(){user=null;generation++;},switchUser(id){user={id};generation++;},
 refreshTokenSameOwner(){/* healthy refresh leaves existing generation unchanged */},
 };};
test('real existing auth.user/refresh-gate API builds actual saved closet board plan without photo leak',async()=>{
 const session=auth(),readSavedItems=async()=>[{...sample}];
 const bridge=createAccountBoundCloset3DBridge({auth:session,readSavedItems});
 const result=await bridge.loadIndex();
 assert.equal(result.ownerId,'owner-A');
 assert.equal(result.indexed.validatedItems,1);
 assert.equal(result.indexed.originalPhotosHashedLocally,true);
 const plan=result.planExistingBoard({slots:{top:'top-1'}});
 assert.equal(plan.selected.top.category,'Tops');
 assert.equal(plan.selected.top.itemType,'Blouse');
 assert.equal(plan.selected.top.actual3DMeshReady,false);
 assert.equal(plan.releaseAuthorized,false);
 assert.equal(result.originalImageDataExposed,false);
 assert.ok(!JSON.stringify(plan).includes(sample.image));
 assert.equal(result.planThreeOwnedLooks([{slots:{top:'top-1'}},{slots:{top:'top-1'}},{slots:{top:'top-1'}}]).length,3);
 assert.equal(result.swapExistingPiece({slots:{top:'top-1'}},{slot:'top',itemId:'top-1'}).selected.top.itemId,'top-1');
 session.refreshTokenSameOwner();
 assert.equal(result.planExistingBoard({slots:{top:'top-1'}}).selectedCount,1);
});
test('account switch or logout immediately invalidates already built 3D plans and swaps',async()=>{
 const session=auth(),bridge=createAccountBoundCloset3DBridge({auth:session,readSavedItems:async()=>[{...sample}]});
 const indexed=await bridge.loadIndex();
 session.switchUser('owner-B');
 for(const call of [()=>indexed.planExistingBoard({slots:{top:'top-1'}}),
  ()=>indexed.planThreeOwnedLooks([{slots:{top:'top-1'}}]),
  ()=>indexed.swapExistingPiece({slots:{top:'top-1'}},{slot:'top',itemId:'top-1'})])
  assert.throws(call,/account switch|invalidated/);
 session.signOut();
 await assert.rejects(()=>bridge.loadIndex(),/Sign in/);
});
test('account change DURING IndexedDB read is blocked before JPEG data can leave source scope',async()=>{
 const session=auth();
 const bridge=createAccountBoundCloset3DBridge({auth:session,readSavedItems:async()=>{
  session.switchUser('owner-B');return [{...sample}];
 }});
 await assert.rejects(()=>bridge.loadIndex(),/account changed/);
});
test('incomplete authentication and no real saved records do not fake visual or AI approval',async()=>{
 assert.throws(()=>createAccountBoundCloset3DBridge({auth:{ready:Promise.resolve()},readSavedItems:async()=>[]}),/authenticated/);
 const session=auth();
 const bridge=createAccountBoundCloset3DBridge({auth:session,readSavedItems:async()=>[]});
 const result=await bridge.loadIndex();
 assert.equal(result.indexed.validatedItems,0);
 assert.throws(()=>result.planExistingBoard({slots:{top:'ghost'}}),/unauthorized/);
 assert.equal(bridge.productionConnected,false);
 const src=readFileSync(new URL('../research/three-d-68/account-bound-closet-3d-bridge.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/fetch\s*\(|localStorage|sessionStorage|indexedDB|supabase|innerHTML/);
});
