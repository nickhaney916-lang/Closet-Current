'use strict';
// Execute the ACTUAL saved-card Delete handler from the app source.
// Every owner, original photograph and database here is disposable/synthetic.
// Family Alpha HOLD #255: no hosted writes, merges or deployments.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
const start=app.indexOf('async function deleteSavedClosetCardOwnerSafe(item){');
const end=app.indexOf('// Mutate only owner-reviewed pending photo rows',start);
assert.ok(start>0&&end>start,'actual saved-card handler is present');
const actual=app.slice(start,end);
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});
 return {promise,resolve,reject};
}
function fixture(){
 const events=[],item={id:'shared-id',ownerId:'owner-a',name:'synthetic blouse',originalPhoto:{image:'synthetic-original-jpeg'}};
 const ctx={
  owner:'owner-a',session:'original',epoch:0,db:{name:'closet-current-user-owner-a'},
  items:[item], confirmResult:true,confirmCount:0,
  confirm(){ctx.confirmCount++;return ctx.confirmResult;},
  removeItem(id,expected){events.push('delete:'+id);assert.equal(expected,item);return Promise.resolve();},
  render(){events.push('render');},
  message(value){events.push('message:'+value);},
  ownerWardrobeMutationLease(){
   const owner=ctx.owner,session=ctx.session,epoch=ctx.epoch,ownerDB=ctx.db;
   return {assertLease(){
    if(ctx.owner!==owner||ctx.session!==session||ctx.epoch!==epoch||ctx.db!==ownerDB||
      ctx.db?.name!=='closet-current-user-'+owner)
     throw Error('signed owner/session changed');
   }};
  }
 };
 vm.createContext(ctx);vm.runInContext(actual,ctx);
 return {ctx,events,item,
  ownerSwap(){
   ctx.owner='owner-b';ctx.session='new-b';ctx.epoch++;
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.items=[{id:'shared-id',ownerId:'owner-b',name:'private other-owner item'}];
  },
  sameIdRelogin(){ctx.session='fresh-auth';ctx.epoch++;},
  differentHydration(){
   ctx.items=[{...item,name:'same id, newer same-owner snapshot'}];
  }
 };
}
test('current owner can confirm and delete exactly the displayed saved card',async()=>{
 const f=fixture();
 await f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 assert.deepEqual(f.events,['delete:shared-id','render']);
 assert.equal(f.ctx.items.length,0);
 assert.equal(f.ctx.confirmCount,1);
});
test('cancelling confirmation never enters a private transaction',async()=>{
 const f=fixture();f.ctx.confirmResult=false;
 await f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 assert.deepEqual(f.events,[]);
 assert.equal(f.ctx.items[0],f.item);
});
test('detached old card with the same ID as a new row is never offered for deletion',async()=>{
 const f=fixture();f.differentHydration();
 await f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 assert.equal(f.ctx.confirmCount,0);
 assert.deepEqual(f.events,[]);
 assert.equal(f.ctx.items[0].name,'same id, newer same-owner snapshot');
});
test('a sign out before confirmation completes refuses deletion',async()=>{
 const f=fixture();
 f.ctx.confirm=function(){f.ownerSwap();return true;};
 await f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 assert.deepEqual(f.events,[]);
 assert.equal(f.ctx.items[0].ownerId,'owner-b');
});
test('old committed delete completion cannot filter or render new owner wardrobe',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.removeItem=()=>{f.events.push('old-delete-start');return pending.promise;};
 const running=f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 assert.deepEqual(f.events,['old-delete-start']);
 f.ownerSwap();pending.resolve();
 await running;
 assert.deepEqual(f.events,['old-delete-start']);
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.ctx.items[0].ownerId,'owner-b');
});
test('old rejected delete cannot place a previous owner error into the new UI',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.removeItem=()=>pending.promise;
 const running=f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 f.ownerSwap();pending.reject(Error('owner-a-private-original-image-has-leaked'));
 await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.ctx.items[0].ownerId,'owner-b');
});
test('same owner ID re-login revokes old deletion callback',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.removeItem=()=>pending.promise;
 const running=f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 f.sameIdRelogin();pending.resolve();
 await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.ctx.items[0],f.item);
});
test('same-ID relogin suppresses an old failure even when the owner ID is unchanged',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.removeItem=()=>pending.promise;
 const running=f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 f.sameIdRelogin();pending.reject(Error('old session JPEG metadata'));
 await running;
 assert.deepEqual(f.events,[]);
});
test('same-owner fresh hydration preserves its replacement even after old delete resolves',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.removeItem=()=>pending.promise;
 const running=f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 f.differentHydration();pending.resolve();
 await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.ctx.items[0].name,'same id, newer same-owner snapshot');
});
test('current owner stale-row CAS failure receives safe reopen guidance',async()=>{
 const f=fixture();
 f.ctx.removeItem=()=>Promise.reject(Error('CLOSET_STALE_DELETE_REOPEN_EDITOR'));
 await f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 assert.equal(f.ctx.items[0],f.item);
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/changed in another tab.*Reload My Closet/);
});
test('current owner arbitrary failed delete does not display private error details',async()=>{
 const f=fixture();
 f.ctx.removeItem=()=>Promise.reject(Error('synthetic-original-jpeg exposed'));
 await f.ctx.deleteSavedClosetCardOwnerSafe(f.item);
 assert.deepEqual(f.events,['message:Could not delete the piece.']);
});
test('saved-card wiring uses the exact leased helper, never the stale inline callback',()=>{
 assert.match(app,/del\.onclick=\(\)=>deleteSavedClosetCardOwnerSafe\(item\)/);
 assert.doesNotMatch(app,/del\.onclick=async\(\)=>\{if\(!confirm\('Delete this closet piece\?'\)\)/);
 assert.match(actual,/await removeItem\(item\.id,item\);\s*lease\.assertLease\(\);/);
 assert.match(actual,/items\.filter\(row=>row!==item\)/);
 assert.doesNotMatch(actual,/items\.filter\(x=>x\.id!==item\.id\)/);
});
