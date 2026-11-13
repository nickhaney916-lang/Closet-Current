'use strict';
// Source-execute the unchanged production nativeIndex07Refresh implementation.
// All signed owners, stores, widgets and errors here are synthetic. NO DEPLOY.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
const begin=app.indexOf('async function nativeIndex07Refresh(){');
const end=app.indexOf('function ownerWardrobeMutationLease(){',begin);
assert.ok(begin>=0&&end>begin,'Live native refresh function required');
const actual=app.slice(begin,end);
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function fixture({style=true,enabled=true,owner='owner-a'}={}){
 const events=[],status={textContent:'new session unchanged'},originalDB={name:'closet-current-user-'+owner};
 const firstAuth={user:{id:owner},assertCurrent(){}};
 const ctx={
  captureOperationEpoch:0,db:originalDB,
  location:{search:enabled?(style?'?nativeIndex07=research&styleOwned03=research':'?nativeIndex07=research'):''},
  URLSearchParams,Event:class{constructor(name){this.type=name;}},
  window:{
   closetAuth:firstAuth,
   nativeLossless04Bridge:{async refreshWardrobe(){events.push('bridge:a');}},
   styleOwnedLive03Bridge:{async refresh(){events.push('style:a');}},
   dispatchEvent(event){events.push('event:'+event.type);}
  },
  $:()=>status
 };
 vm.createContext(ctx);vm.runInContext(actual,ctx);
 return {ctx,events,status,firstAuth,originalDB,
  replaceOwner(next='owner-b'){
   ctx.captureOperationEpoch++;
   ctx.db={name:'closet-current-user-'+next};
   ctx.window.closetAuth={user:{id:next},assertCurrent(){}};
   ctx.window.nativeLossless04Bridge={async refreshWardrobe(){events.push('bridge:new-owner');}};
   ctx.window.styleOwnedLive03Bridge={async refresh(){events.push('style:new-owner');}};
  },
  relogin(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:owner},assertCurrent(){}};
  }
 };
}
test('current signed owner refreshes wardrobe and owned style once',async()=>{
 const f=fixture();
 await f.ctx.nativeIndex07Refresh();
 assert.deepEqual(f.events,['bridge:a','style:a']);
 assert.equal(f.status.textContent,'new session unchanged');
});
test('old owner index completion cannot enter the next owner style panel',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.window.nativeLossless04Bridge.refreshWardrobe=()=>{f.events.push('bridge:old-start');return pending.promise;};
 const running=f.ctx.nativeIndex07Refresh();
 f.replaceOwner();
 pending.resolve();
 await running;
 assert.deepEqual(f.events,['bridge:old-start']);
 assert.equal(f.status.textContent,'new session unchanged');
});
test('rejected previous-owner index cannot print error or original-JPEG details in next owner UI',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.window.nativeLossless04Bridge.refreshWardrobe=()=>pending.promise;
 const running=f.ctx.nativeIndex07Refresh();
 f.replaceOwner();
 pending.reject(Error('owner-a private JPEG photo DATA must not be shown'));
 await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.status.textContent,'new session unchanged');
});
test('same owner ID re-login revokes old wardrobe-index refresh and hides old error',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.window.nativeLossless04Bridge.refreshWardrobe=()=>pending.promise;
 const running=f.ctx.nativeIndex07Refresh();
 f.relogin();
 pending.reject(Error('old account session image detail'));
 await running;
 assert.equal(f.status.textContent,'new session unchanged');
});
test('normal same-owner failure gives actionable generic message without raw exception data',async()=>{
 const f=fixture();
 f.ctx.window.nativeLossless04Bridge.refreshWardrobe=async()=>{throw Error('private original JPEG opaque leaked in error');};
 await f.ctx.nativeIndex07Refresh();
 assert.equal(f.status.textContent,'New clothing saved; outfit builder needs a safe reload.');
 assert.doesNotMatch(f.status.textContent,/JPEG|opaque|leaked/);
});
test('session revoked during owned-style refresh cannot run any subsequent new owner work',async()=>{
 const f=fixture(),pending=deferred();
 f.ctx.window.styleOwnedLive03Bridge.refresh=()=>{f.events.push('style:old-start');return pending.promise;};
 const running=f.ctx.nativeIndex07Refresh();
 await Promise.resolve();
 f.replaceOwner();
 pending.resolve();
 await running;
 assert.deepEqual(f.events,['bridge:a','style:old-start']);
 assert.equal(f.status.textContent,'new session unchanged');
});
test('missing signed owner or mismatched private DB refuses to start any bridge work',async()=>{
 const f=fixture();
 f.ctx.window.closetAuth.user=null;
 await f.ctx.nativeIndex07Refresh();
 f.ctx.window.closetAuth.user={id:'wrong-owner'};
 await f.ctx.nativeIndex07Refresh();
 assert.deepEqual(f.events,[]);
});
test('owner-current index without optional style bridge dispatches one source commit event',async()=>{
 const f=fixture();
 delete f.ctx.window.styleOwnedLive03Bridge;
 await f.ctx.nativeIndex07Refresh();
 assert.deepEqual(f.events,['bridge:a','event:closet:style-owned-inventory-committed']);
});
test('inactive research flag cannot invoke any private index bridge',async()=>{
 const f=fixture({enabled:false});
 await f.ctx.nativeIndex07Refresh();
 assert.deepEqual(f.events,[]);
});
test('actual native source includes exact epoch/DB/auth fence and generic failure notice',()=>{
 assert.match(actual,/epoch===captureOperationEpoch/);
 assert.match(actual,/window\.closetAuth===auth/);
 assert.match(actual,/db===ownerDB/);
 assert.match(actual,/await bridge\.refreshWardrobe\(\);\s*if\(!current\(\)\)return;/);
 assert.match(actual,/await stylePanel\.refresh\(\{quiet:true\}\);\s*if\(!current\(\)\)return;/);
 assert.doesNotMatch(actual,/String\(error\.message\|\|error\)/);
});
