'use strict';
// Mission 3: run the EXACT saved-closet card deletion callback and the
// unchanged live ownerWardrobeMutationLease against synthetic signed sessions.
// No customer photos, hosted Auth or deployments are accessed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
function segment(a,b,after=0){
 const i=app.indexOf(a,after),j=app.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Live app source missing '+a);
 return app.slice(i,j);
}
const liveLease=segment('function ownerWardrobeMutationLease(){','function writeAll(values){');
const deletionStart=app.indexOf('del.onclick=async()=>{',app.indexOf('const cg='));
const deletionEnd=app.indexOf(';if(typeof closetWearButton',deletionStart);
assert.ok(deletionStart>=0&&deletionEnd>deletionStart,'Exact saved-card Delete handler required');
const liveDelete=app.slice(deletionStart,deletionEnd+1);
assert.ok(liveDelete.includes('await removeItem(item.id,expected)'),'Test must execute the live native deletion callback');
function deferred(){
 let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});return {promise,resolve,reject};
}
function row(owner,extra={}){
 return {id:'wardrobe-1',ownerId:owner,
  image:'data:image/jpeg;base64,/9j/TEST'+owner,sourceSHA256:owner.repeat(64),
  originalPhoto:{image:'data:image/jpeg;base64,/9j/TEST'+owner,sha256:owner.repeat(64)},
  name:'Saved jacket',notes:'original owner notes',...extra};
}
function fixture({owner='A',confirmDelete=true,present=true}={}){
 const a=row(owner),b=row('B',{id:'new-owner-wardrobe'}),dbA={name:'closet-current-user-'+owner},
  dbB={name:'closet-current-user-B'},authA={user:{id:owner},assertCurrent(){}},
  authB={user:{id:'B'},assertCurrent(){}},wait=deferred(),events=[],calls=[];
 const ctx={
  item:a,items:present?[a]:[],db:dbA,
  window:{closetAuth:authA},captureOperationEpoch:0,
  confirm(){calls.push('confirm');return confirmDelete;},
  removeItem:async(id,expected)=>{
   calls.push({id,expected:structuredClone(expected),db:ctx.db});
   return wait.promise;
  },
  render(){events.push('render:'+ctx.window.closetAuth?.user?.id);},
  message(value){events.push('message:'+ctx.window.closetAuth?.user?.id+':'+value);},
  del:{},structuredClone
 };
 vm.createContext(ctx);vm.runInContext(liveLease+'\n'+liveDelete,ctx);
 assert.equal(typeof ctx.del.onclick,'function');
 return {ctx,a,b,dbA,dbB,authA,authB,wait,events,calls,
  switchToB(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth=authB;ctx.db=dbB;ctx.items=[b];
  },
  sameOwnerRelogin(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:owner},assertCurrent(){}};
   ctx.db={name:'closet-current-user-'+owner};ctx.items=[row(owner,{id:'new-session-item'})];
  }
 };
}
test('same-owner deletion acknowledges only the reviewed source row and updates UI once',async()=>{
 const f=fixture(),pending=f.ctx.del.onclick();
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[1].id,f.a.id);
 assert.equal(f.calls[1].expected.originalPhoto.image,f.a.originalPhoto.image);
 assert.equal(f.calls[1].db,f.dbA);
 f.wait.resolve();
 await pending;
 assert.deepEqual(f.ctx.items,[]);
 assert.deepEqual(f.events,['render:A']);
});
test('current-owner delete reconciles all same-ID visible copies without touching a different garment',async()=>{
 const f=fixture();
 const extra={...f.a,name:'Stale same-ID duplicate'};
 const unrelated=row('A',{id:'different-saved-piece'});
 f.ctx.items.push(extra,unrelated);
 const pending=f.ctx.del.onclick();
 f.wait.resolve();
 await pending;
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.ctx.items[0].id,'different-saved-piece');
 assert.deepEqual(f.events,['render:A']);
});
test('old owner delete resolving after switch cannot clear or redraw new owner wardrobe',async()=>{
 const f=fixture(),pending=f.ctx.del.onclick();
 f.switchToB();f.wait.resolve();
 await pending;
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.ctx.items[0].ownerId,'B');
 assert.deepEqual(f.events,[]);
});
test('same-owner-ID re-login revokes delayed old-card delete finalizer',async()=>{
 const f=fixture(),pending=f.ctx.del.onclick();
 f.sameOwnerRelogin();f.wait.resolve();
 await pending;
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.ctx.items[0].id,'new-session-item');
 assert.deepEqual(f.events,[]);
});
test('a stale delete rejection after account switch cannot tell next owner old error',async()=>{
 const f=fixture(),pending=f.ctx.del.onclick();
 f.switchToB();
 f.wait.reject(Error('previous owner private original JPEG details'));
 await pending;
 assert.deepEqual(f.events,[]);
});
test('same-owner re-login suppresses prior signed-session delete error',async()=>{
 const f=fixture(),pending=f.ctx.del.onclick();
 f.sameOwnerRelogin();f.wait.reject(Error('previous login failed delete'));
 await pending;
 assert.deepEqual(f.events,[]);
});
test('current-owner stale CAS rejection preserves visible card and gives actionable reload',async()=>{
 const f=fixture(),pending=f.ctx.del.onclick();
 const stale=Error('CLOSET_STALE_DELETE_REOPEN_EDITOR');
 f.wait.reject(stale);await pending;
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/Another tab changed this clothing piece|This clothing piece changed in another tab/);
});
test('current-owner quota failure cannot falsely remove card or claim success',async()=>{
 const f=fixture(),pending=f.ctx.del.onclick();
 f.wait.reject(Error('QuotaExceededError'));await pending;
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/Could not delete the piece/);
});
test('cancelled confirmation never invokes the durable native deletion',async()=>{
 const f=fixture({confirmDelete:false});
 await f.ctx.del.onclick();
 assert.deepEqual(f.calls,['confirm']);
 assert.equal(f.ctx.items.length,1);
 assert.deepEqual(f.events,[]);
});
test('orphaned card not in signed owner roster cannot delete durable source',async()=>{
 const f=fixture({present:false});
 await f.ctx.del.onclick();
 assert.deepEqual(f.calls,[]);
 assert.equal(f.ctx.items.length,0);
 assert.match(f.events[0],/changed in another tab/);
});
test('signed-out page cannot delete a former owner garment',async()=>{
 const f=fixture();
 f.ctx.window.closetAuth.user=null;
 await f.ctx.del.onclick();
 assert.deepEqual(f.calls,[]);
 assert.deepEqual(f.events,[]);
});
test('source uses exact captured owner lease, expected immutable row and fenced postcommit UI',()=>{
 assert.match(liveDelete,/lease=ownerWardrobeMutationLease\(\)/);
 assert.match(liveDelete,/const expected=structuredClone\(item\)/);
 assert.match(liveDelete,/assertCard\(\);\s*await removeItem\(item\.id,expected\);\s*assertCard\(\);/);
 assert.match(liveDelete,/try\{lease\?\.assertLease\(\);\}catch\{return;\}/);
 assert.doesNotMatch(liveDelete,/removeItem\(item\.id,item\)/);
 assert.match(liveLease,/epoch!==captureOperationEpoch/);
});
