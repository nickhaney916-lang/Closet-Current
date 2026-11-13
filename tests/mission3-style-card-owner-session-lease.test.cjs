'use strict';
// Execute the ACTUAL saved-style UI lease and async finalizer from public/app.js.
// All signed accounts, wardrobe records and private photo URLs are synthetic.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
const start=app.indexOf('function ownerStyleCardActionLease(item){');
const end=app.indexOf('function ownerWardrobeMutationLease(){',start);
assert.ok(start>=0&&end>start,'Production owner-style action fence required');
const live=app.slice(start,end);
function pending(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});
 return {promise,resolve,reject};
}
function fixture(){
 const events=[],item={id:'same-id',ownerId:'owner-a',sourceSHA256:'a'.repeat(64),originalPhoto:{image:'synthetic-private-JPEG'}};
 let revoked=false;
 const authA={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('session revoked');}};
 const ctx={
  window:{closetAuth:authA},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:100,items:[item],
  nodes:{authGate:{hidden:true},appShell:{hidden:false}},
  $(id){return ctx.nodes[id];},
  message(value){events.push(value);}
 };
 vm.createContext(ctx);vm.runInContext(live,ctx);
 const button={disabled:false,isConnected:true};
 return {
  ctx,item,button,events,
  switchAccount(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.items=[{...item,ownerId:'owner-b',originalPhoto:{image:'other-owner-JPEG'}}];
  },
  relogin(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};
   ctx.items=[{...item,name:'fresh saved photo'}];
  },
  revoke(){revoked=true;},
  rehydrate(){ctx.items=[{...item,name:'same ID newer snapshot'}];}
 };
}
test('current signed owner can complete styling and button is restored',async()=>{
 const f=fixture(),p=pending(),actions=[];
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,async check=>{
  check();actions.push('start');await p.promise;check();actions.push('finish');
 });
 assert.equal(f.button.disabled,true);p.resolve();await running;
 assert.deepEqual(actions,['start','finish']);
 assert.equal(f.button.disabled,false);
 assert.deepEqual(f.events,[]);
});
test('current signed owner failure is useful but never renders a private error',async()=>{
 const f=fixture();
 await f.ctx.withOwnerStyleCardAction(f.item,f.button,async()=>{
  throw Error('owner-a private JPEG original filename leaked');
 });
 assert.equal(f.button.disabled,false);
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/Reopen My Closet/);
 assert.doesNotMatch(f.events[0],/JPEG|filename|owner-a|leaked/);
});
test('different owner cannot inherit a delayed styling rejection or button re-enable',async()=>{
 const f=fixture(),p=pending();
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>p.promise);
 f.switchAccount();p.reject(Error('old owner private URL'));
 await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
 assert.equal(f.ctx.items[0].ownerId,'owner-b');
});
test('a completed old-owner style request cannot report success in new account',async()=>{
 const f=fixture(),p=pending();
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,async check=>{await p.promise;check();});
 f.switchAccount();p.resolve();await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('same owner ID re-login is a different session and suppresses an old failure',async()=>{
 const f=fixture(),p=pending();
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>p.promise);
 f.relogin();p.reject(Error('same-ID old session photo metadata'));await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('same owner ID re-login revokes a delayed success',async()=>{
 const f=fixture(),p=pending();
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>p.promise);
 f.relogin();p.resolve();await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('revoked auth object fails even if owner ID and DB still look current',async()=>{
 const f=fixture(),p=pending();
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>p.promise);
 f.revoke();p.reject(Error('secret image details'));await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('replaced same-ID owner item refuses an old card action',async()=>{
 const f=fixture();
 f.rehydrate();
 let called=0;
 await f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>{called++;});
 assert.equal(called,0);
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,false);
});
test('same-owner replacement while running refuses late UI updates',async()=>{
 const f=fixture(),p=pending();
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>p.promise);
 f.rehydrate();p.reject(Error('old garment original'));await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('wrong private DB and signed-out owner both refuse styling',async()=>{
 const f=fixture(),calls=[];
 f.ctx.db={name:'closet-current-user-owner-x'};
 await f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>calls.push(1));
 f.ctx.db={name:'closet-current-user-owner-a'};
 f.ctx.window.closetAuth.user=null;
 await f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>calls.push(2));
 assert.deepEqual(calls,[]);
 assert.deepEqual(f.events,[]);
});
test('detached prior style button is not used',async()=>{
 const f=fixture();f.button.isConnected=false;
 let calls=0;
 await f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>calls++);
 assert.equal(calls,0);assert.equal(f.button.disabled,false);
});
test('detached button during pending error shows no stale error',async()=>{
 const f=fixture(),p=pending();
 const running=f.ctx.withOwnerStyleCardAction(f.item,f.button,()=>p.promise);
 f.button.isConnected=false;
 p.reject(Error('old DOM original photo'));await running;
 assert.deepEqual(f.events,[]);
});
test('actual UI wires both saved-photo Style shortcuts to one owner lease',()=>{
 assert.match(app,/style\.onclick=\(\)=>withOwnerStyleCardAction\(item,style,async assertOwner=>/);
 assert.match(app,/styleNew\.onclick=\(\)=>withOwnerStyleCardAction\(item,styleNew,async assertOwner=>/);
 assert.match(app,/await styleJustReviewedPhoto122\(item\.id,item\.sourceSHA256/);
 assert.match(app,/await stylePanel\.selectGarment\(item\.id\);\s*}\s*assertOwner\(\);/);
 assert.doesNotMatch(app,/Could not reopen saved clothing for private styling\. '\+/);
 assert.doesNotMatch(app,/Could not style that saved photo safely\. '\+/);
 assert.match(live,/captureOperationEpoch!==epoch/);
 assert.match(live,/!items\.includes\(item\)/);
 assert.match(live,/auth\.assertCurrent\?\.\(\)/);
 assert.doesNotMatch(live,/error\.message/);
});
