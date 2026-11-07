import test from 'node:test';
import assert from 'node:assert/strict';
import {PHOTO151,captureReadinessLease151,assertReadinessLease151}
 from '../research/native-photo-readiness-revocation-151/photo-readiness-lease.mjs';

const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
function fixture(){
 const auth={user:{id:A},assertCurrent(){if(this.locked)throw Error('locked');},locked:false};
 const doc={hidden:false,visibilityState:'visible',getElementById(id){
  return id==='authGate'?{hidden:true}:id==='appShell'?{hidden:false}:null;
 }};
 const win={closetAuth:auth};
 const db={name:'closet-current-user-'+A};
 const row={id:'saved-a',ownerId:A,
  slots:{top:'shirt-1',bottom:'denim-1'},slotSources:{
   top:{sha256:'a'.repeat(64),ownerId:A},
   bottom:{sha256:'b'.repeat(64),ownerId:A}
  },name:'Original outfit',layerCount:0};
 const state={active:true,dirty:false,selected:0};
 const epoch={ownerId:A,generation:1,revision:7};
 const board={status:()=>state,readOnlySnapshot:()=>({saved:[row]}),
  readOnlyWardrobeRevision93:()=>({...epoch})};
 return {auth,doc,win,db,row,state,epoch,board,
  context:{ownerId:A,win,doc,board,db,auth}};
}
test('P151 captures exact original owner, selected outfit metadata and native photo revision with no original JPEG bytes',()=>{
 const f=fixture(),receipt=captureReadinessLease151(f.context);
 assert.equal(receipt.ownerId,A);
 assert.equal(receipt.revision,7);
 assert.equal(receipt.selectedIndex,0);
 assert.equal(receipt.savedId,'saved-a');
 assert.equal(assertReadinessLease151(receipt,f.context),true);
 assert.equal('photo' in receipt,false);
 assert.equal('access_token' in receipt,false);
 assert.equal(JSON.stringify(receipt).includes('data:image/'),false);
 assert.equal(PHOTO151.familyAlpha,'HOLD');
});
test('P151 rejects a new private wardrobe revision even when all original metadata and garment IDs are unchanged',()=>{
 const f=fixture(),receipt=captureReadinessLease151(f.context);
 f.epoch.revision++;
 assert.throws(()=>assertReadinessLease151(receipt,f.context),/PHOTO151/);
});
test('P151 rejects saved outfit reclassification, SHA correction, slot replacement and changed display name under the same selected index',()=>{
 for(const mutate of [
  x=>x.row.slots.top='new-shirt',
  x=>x.row.slotSources.top.sha256='c'.repeat(64),
  x=>x.row.name='Retitled while photo decoded',
  x=>x.row.layerCount=2,
  x=>x.row.ownerId=B,
  x=>x.state.selected=1,
  x=>x.state.dirty=true,
  x=>x.state.active=false
 ]){
  const f=fixture(),receipt=captureReadinessLease151(f.context);
  mutate(f);
  assert.throws(()=>assertReadinessLease151(receipt,f.context),/PHOTO151/);
 }
});
test('P151 rejects owner session lock, rotation, owner IDB isolation and hidden phone tab',()=>{
 for(const mutate of [
  x=>x.auth.locked=true,
  x=>x.auth.user.id=B,
  x=>x.win.closetAuth={...x.auth},
  x=>x.db.name='closet-current-user-'+B,
  x=>x.doc.hidden=true,
  x=>x.doc.visibilityState='hidden',
  x=>x.doc.visibilityState='prerender'
 ]){
  const f=fixture(),receipt=captureReadinessLease151(f.context);
  mutate(f);
  assert.throws(()=>assertReadinessLease151(receipt,f.context),/PHOTO151/);
 }
});
test('P151 rejects stale index, invalid revocation metadata, missing source epoch and oversized unsaved look',()=>{
 for(const mutate of [
  x=>x.state.selected=null,
  x=>x.state.selected=-1,
  x=>x.board.readOnlyWardrobeRevision93=()=>{throw Error('revoked');},
  x=>x.epoch.revision=-1,
  x=>x.epoch.ownerId=B,
  x=>x.epoch.generation=NaN,
  x=>x.row.name='a'.repeat(100100)
 ]){
  const f=fixture();mutate(f);
  assert.throws(()=>captureReadinessLease151(f.context),/PHOTO151/);
 }
});
test('P151 an old receipt remains revoked after a fresh independent owner-visible check',()=>{
 const f=fixture(),old=captureReadinessLease151(f.context);
 f.epoch.revision++;
 const newer=captureReadinessLease151(f.context);
 assert.throws(()=>assertReadinessLease151(old,f.context),/PHOTO151/);
 assert.equal(assertReadinessLease151(newer,f.context),true);
});
