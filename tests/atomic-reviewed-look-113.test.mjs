import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 RESEARCH_OWNER_110, RESEARCH_SOURCE_110,
 planReviewedSourceLook110, requireUnchangedReviewedLook110
} from '../research/reviewed-closet-3d-handoff-110/owner-bound-look-policy.mjs';

/** Synthetic, source-hash-locked, licensed research ONLY; never private photos. */
const make=(owner=RESEARCH_OWNER_110,denim='public')=>{
 const session={authenticated:true,ownerId:owner,generation:1};
 const top={id:'licensed-shirt',sourceId:'licensed-shirt',ownerId:owner,
  category:'Tops',itemType:'T-shirt',color:'Black',
  sourceSHA256:RESEARCH_SOURCE_110.shirt,ownerReviewed:true,
  sourcePhotoOriginal:true,photographic3DReconstructionApproved:false,
  releaseAuthorized:false};
 const bottom={id:denim==='public'?'licensed-jeans-1':'licensed-jeans-2',
  sourceId:denim==='public'?'licensed-jeans-1':'licensed-jeans-2',ownerId:owner,
  category:'Bottoms',itemType:'Jeans',color:'Blue',
  sourceSHA256:RESEARCH_SOURCE_110[denim],ownerReviewed:true,
  sourcePhotoOriginal:true,photographic3DReconstructionApproved:false,
  releaseAuthorized:false};
 const indexed={ownerId:owner,generation:1,releaseAuthorized:false,
  byId:new Map([[top.id,top],[bottom.id,bottom]])};
 const board={slots:{top:top.id,bottom:bottom.id}};
 return {session,indexed,board,top,bottom};
};
const withSecondRead=(d,mutation)=>{
 let count=0;
 return {...d,readCurrentSession:()=>{
  if(++count===2)mutation(d);
  return {...d.session};
 }};
};

test('PHOTO113 positive: unchanged licensed source returns coherent frozen 3D, private-like original stays 2D',()=>{
 for(const denim of ['public','second']){
  const d=make(RESEARCH_OWNER_110,denim);
  const plan=planReviewedSourceLook110(withSecondRead(d,()=>{}));
  assert.equal(plan.status,'verified-public-research-3d');
  assert.equal(plan.sourceSHA256s.bottom,RESEARCH_SOURCE_110[denim]);
  assert.equal(plan.reviewedColors.bottom,'Blue');
  assert.equal(plan.sourceIds.bottom,d.bottom.sourceId);
  assert.equal(plan.familyAlpha,'HOLD');
  assert.equal(plan.releaseAuthorized,false);
  assert.equal(Object.isFrozen(plan.sourceSHA256s),true);
  assert.equal(Object.isFrozen(plan.reviewedColors),true);
 }
 const d=make('synthetic-anonymous-private-example');
 const plan=planReviewedSourceLook110(withSecondRead(d,()=>{}));
 assert.equal(plan.status,'original-photo-2d-fallback');
 assert.equal(plan.truePrivateWardrobe3DReady,false);
 assert.equal(plan.realSignedCloudRLSVerified,false);
});

test('PHOTO113 reject concurrent corrected color, replaced original SHA, sourceId, category, review flag and owner even when second session is unchanged',()=>{
 const mutations=[
  d=>{d.bottom.color='Navy';},
  d=>{d.top.color='White';},
  d=>{d.bottom.sourceSHA256='a'.repeat(64);},
  d=>{d.top.sourceSHA256='b'.repeat(64);},
  d=>{d.bottom.sourceId='reindexed-same-jpeg';},
  d=>{d.top.sourceId='reindexed-shirt-same-jpeg';},
  d=>{d.bottom.ownerReviewed=false;},
  d=>{d.top.sourcePhotoOriginal=false;},
  d=>{d.bottom.category='Shoes';},
  d=>{d.bottom.itemType='Shorts';},
  d=>{d.bottom.ownerId='other-owner';},
  d=>{d.top.id='recycled-shirt-id';},
  d=>{d.bottom.photographic3DReconstructionApproved=true;},
  d=>{d.bottom.releaseAuthorized=true;},
  d=>{d.bottom.garmentMeshVerified=false;},
  d=>{d.bottom.sourceFrom='replaced-origin';}
 ];
 for(const owner of [RESEARCH_OWNER_110,'synthetic-private-owner-113']){
  for(const mutate of mutations){
   const d=make(owner);
   assert.throws(()=>planReviewedSourceLook110(withSecondRead(d,mutate)),
    /PHOTO110.*changed during final source admission/,
    'admission must fail closed for '+owner+' / '+mutate.toString());
  }
 }
});

test('PHOTO113 reject in-call Map rebinding, same bytes reindexed, slot retarget, added slots, index and release gate mutation',()=>{
 const mutations=[
  d=>d.indexed.byId.set(d.bottom.id,{...d.bottom}),
  d=>d.indexed.byId.set(d.top.id,{...d.top}),
  d=>d.indexed.byId=new Map(d.indexed.byId),
  d=>d.board.slots.bottom=d.top.id,
  d=>d.board.slots={...d.board.slots},
  d=>d.board.slots.shoes='new-shoes',
  d=>d.indexed.ownerId='other-owner',
  d=>d.indexed.generation=2,
  d=>d.indexed.releaseAuthorized=true
 ];
 for(const mutate of mutations){
  const d=make();
  assert.throws(()=>planReviewedSourceLook110(withSecondRead(d,mutate)),
   /PHOTO110.*changed during final source admission/,
   'mutation during last session read: '+mutate.toString());
 }
});

test('PHOTO113 reject synthetic session and index owner/generation rotation between live checks even when they agree by final read',()=>{
 for(const mutation of [
  d=>{d.session.generation=2;d.indexed.generation=2;},
  d=>{d.session.ownerId='another-owner';d.indexed.ownerId='another-owner';d.top.ownerId='another-owner';d.bottom.ownerId='another-owner';},
  d=>{d.session.authenticated=false;}
 ]){
  const d=make();
  assert.throws(()=>planReviewedSourceLook110(withSecondRead(d,mutation)),/PHOTO110/);
 }
});

test('PHOTO113 requireUnchangedReviewedLook rejects last-moment changes to a previously saved token',()=>{
 for(const mutation of [
  d=>{d.bottom.color='Navy';},
  d=>{d.bottom.sourceId='replaced-record';},
  d=>{d.indexed.byId.set(d.bottom.id,{...d.bottom});},
  d=>{d.board.slots.bottom='different-pants';},
  d=>{d.session.generation=3;d.indexed.generation=3;}
 ]){
  const d=make();
  const saved=planReviewedSourceLook110({...d,readCurrentSession:()=>({...d.session})});
  assert.throws(()=>requireUnchangedReviewedLook110(saved,
   withSecondRead(d,mutation)),/PHOTO110/);
 }
});

test('PHOTO113 unrelated transient display metadata does not block reviewed photo restoration',()=>{
 const d=make();
 const p=planReviewedSourceLook110(withSecondRead(d,item=>{
  item.top.lastRenderedAt=123;
  item.bottom.lastRenderedAt=123;
 }));
 assert.equal(p.status,'verified-public-research-3d');
 assert.equal(p.sourceSHA256s.top,RESEARCH_SOURCE_110.shirt);
 assert.equal(p.sourceSHA256s.bottom,RESEARCH_SOURCE_110.public);
});

test('PHOTO113 source and workflow have explicit immutable primitive snapshot and no private image/network/storage/deploy',()=>{
 const policy=readFileSync('research/reviewed-closet-3d-handoff-110/owner-bound-look-policy.mjs','utf8');
 for(const key of [
  'REVIEWED_FIELDS_113','snapshotReviewed113(topRecord)',
  'snapshotReviewed113(bottomRecord)',
  'Object.is(item[key],snapshot[key])',
  'indexed.byId.get(initial.topSlot)!==topRecord',
  'indexed.byId.get(initial.bottomSlot)!==bottomRecord',
  'session.ownerId!==initial.ownerId',
  'sourceUnchanged113(topRecord,top)',
  'sourceUnchanged113(bottomRecord,bottom)'
 ])assert.ok(policy.includes(key),key);
 assert.doesNotMatch(policy,/fetch\(|localStorage|sessionStorage|indexedDB|XMLHttpRequest|getUserMedia|supabase/i);
});
