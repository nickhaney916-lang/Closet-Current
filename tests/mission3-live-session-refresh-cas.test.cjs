'use strict';
// Run the actual public/auth.js with controlled async authentication responses
// and two synthetic same-origin accounts. Never contact hosted Supabase.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/auth.js','utf8');
const STORE='closet-current-auth-v1',A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ticks=async()=>{for(let i=0;i<70;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const ok=(user=A,token='verified')=>({ok:true,status:200,json:async()=>({
 user:{id:user,email:'a@synthetic.invalid'},access_token:'a-'+token,
 refresh_token:'r-'+token,expires_in:3600
})});
const denied=(status=401,code='invalid_grant')=>({ok:false,status,
 json:async()=>({error_code:code,message:'Synthetic token invalid'})});
function setup(){
 const els=new Map(),events={},calls=[],published=[],db=[];
 const elem=id=>{
  if(!els.has(id))els.set(id,{
   hidden:id==='appShell',value:'',textContent:'',disabled:false,
   type:id==='authPassword'?'password':'text',title:'',required:false,
   validity:{valid:true},classList:{add(){},remove(){}},
   setAttribute(){},checkValidity(){return true},addEventListener(){}
  });
  return els.get(id);
 };
 for(const id of ['appShell','authGate','authStatus','authEmail','authPassword'])elem(id);
 const original=JSON.stringify({epoch:'epoch-synthetic-A',
  access_token:'expired-access',refresh_token:'expired-refresh',expires_at:9999999999});
 const values=new Map([[STORE,original]]);
 const storage={getItem:key=>values.get(key)||null,
  setItem:(key,value)=>{values.set(key,String(value));published.push(String(value));},
  removeItem:key=>values.delete(key)};
 const plan={response:ok(A,'initial'),hold:null};
 const fetch=async(...args)=>{
  calls.push(args);
  if(plan.hold)return plan.hold.promise;
  return plan.response;
 };
 const location={hash:'',search:'',pathname:'/',reload(){}};
 const window={addEventListener:(name,handler)=>{events[name]=handler;},
  dispatchEvent:(evt)=>db.push(evt.type)};
 const globals={window,document:{getElementById:elem},localStorage:storage,
  fetch,location,history:{replaceState(){}},AbortController,setTimeout,clearTimeout,
  Date,Promise,JSON,Error,TypeError,URLSearchParams,Event,
  crypto:{randomUUID:()=>'new-synthetic-epoch'}};
 vm.createContext(globals);
 vm.runInContext(source,globals);
 return {globals,els,events,calls,published,dispatches:db,storage,values,
  plan,original,
  async ready(){await globals.window.closetAuth.ready;await ticks();
   assert.equal(globals.window.closetAuth.user?.id,A);
   assert.equal(elem('appShell').hidden,false);},
  hold(){plan.hold=deferred();return plan.hold;},
  request(){return globals.window.closetAuth.getAccessToken({force:true});},
  snapshot(){return storage.getItem(STORE);},
  owner(){return globals.window.closetAuth.user?.id||null;},
  isLocked(){return elem('appShell').hidden;},
  setExternal(value){storage.setItem(STORE,value);}
 };
}
test('verified live token rotation changes exact session once and remains owner-bound',async()=>{
 const f=setup();await f.ready();const start=f.snapshot();
 f.plan.response=ok(A,'new');
 const token=await f.request();
 assert.equal(token,'a-new');
 assert.notEqual(f.snapshot(),start);
 assert.equal(JSON.parse(f.snapshot()).refresh_token,'r-new');
 assert.equal(f.owner(),A);assert.equal(f.isLocked(),false);
});
test('simultaneous live token requests share a single refresh without double rotating',async()=>{
 const f=setup();await f.ready();const h=f.hold(),before=f.calls.length;
 const p=f.request(),q=f.request();await ticks();
 assert.equal(f.calls.length,before+1);
 h.resolve(ok(A,'rotated'));
 assert.deepEqual([await p,await q],['a-rotated','a-rotated']);
 assert.equal(f.snapshot(),f.published.at(-1));
 assert.equal(f.owner(),A);
});
test('same-epoch other-tab token rotation during pending old response is rejected without credential overwrite',async()=>{
 const f=setup();await f.ready();const h=f.hold(),pending=f.request();await ticks();
 const copy=JSON.parse(f.snapshot());
 copy.refresh_token='newer-tab-token';copy.access_token='newer-tab-access';
 const newer=JSON.stringify(copy);
 f.setExternal(newer);h.resolve(ok(A,'older'));
 await assert.rejects(pending,/Account session ended|Session replaced/);
 assert.equal(f.snapshot(),newer);
 assert.equal(f.owner(),null);assert.equal(f.isLocked(),true);
 assert.ok(f.dispatches.includes('closet:session-locked'));
});
test('same owner and same epoch storage event with different token immediately locks old tab',async()=>{
 const f=setup();await f.ready();
 const next=JSON.stringify({...JSON.parse(f.snapshot()),refresh_token:'other-rotated'});
 f.setExternal(next);f.events.storage({key:STORE});
 assert.equal(f.snapshot(),next);
 assert.equal(f.owner(),null);assert.equal(f.isLocked(),true);
});
test('401 revoked live refresh clears only current credential and locks private closet',async()=>{
 const f=setup();await f.ready();f.plan.response=denied(401);
 await assert.rejects(f.request(),/Synthetic token invalid/);
 assert.equal(f.snapshot(),null);
 assert.equal(f.owner(),null);assert.equal(f.isLocked(),true);
 assert.ok(f.dispatches.includes('closet:session-locked'));
});
test('400 invalid_grant on live refresh revokes local session and requires sign-in',async()=>{
 const f=setup();await f.ready();f.plan.response=denied(400,'invalid_grant');
 await assert.rejects(f.request(),/Synthetic token invalid/);
 assert.equal(f.snapshot(),null);assert.equal(f.owner(),null);
});
test('invalid old refresh response cannot delete same-epoch newer tab credential',async()=>{
 const f=setup();await f.ready();const h=f.hold(),pending=f.request();await ticks();
 const newer=JSON.stringify({...JSON.parse(f.snapshot()),refresh_token:'newer-tab-secret'});
 f.setExternal(newer);h.resolve(denied(401));
 await assert.rejects(pending,/Synthetic token invalid/);
 assert.equal(f.snapshot(),newer);
 assert.equal(f.owner(),null);
});
test('transient offline live refresh preserves current verified owner and original credential',async()=>{
 const f=setup();await f.ready();const snapshot=f.snapshot();
 f.plan.response=null;f.plan.hold=null;
 const originalLength=f.calls.length;
 f.plan.hold=deferred();
 const pending=f.request();await ticks();f.plan.hold.reject(new TypeError('temporary disconnection'));
 await assert.rejects(pending,/temporary disconnection/);
 assert.equal(f.calls.length,originalLength+1);
 assert.equal(f.snapshot(),snapshot);
 assert.equal(f.owner(),A);assert.equal(f.isLocked(),false);
});
test('wrong-owner verified live refresh cannot open next owner wardrobe',async()=>{
 const f=setup();await f.ready();f.plan.response=ok(B,'bad-owner');
 await assert.rejects(f.request(),/Session account changed or required refresh credentials missing/);
 assert.equal(f.owner(),null);assert.equal(f.isLocked(),true);
});
test('missing refresh token in verified live response fails closed without new account evidence',async()=>{
 const f=setup();await f.ready();const current=f.snapshot();
 f.plan.response={ok:true,status:200,json:async()=>({
  user:{id:A},access_token:'new-access',expires_in:3600
 })};
 await assert.rejects(f.request(),/Session account changed or required refresh credentials missing/);
 assert.equal(f.owner(),null);assert.equal(f.isLocked(),true);
 assert.equal(f.snapshot(),current,'unverified new data must not overwrite previous credential');
});
test('session replacement after a previous successful renewal invalidates prior snapshot',async()=>{
 const f=setup();await f.ready();f.plan.response=ok(A,'updated');
 await f.request();const old=f.snapshot();
 const replacement=JSON.stringify({...JSON.parse(old),epoch:'new-sign-in-epoch'});
 f.setExternal(replacement);
 await assert.rejects(f.request(),/Account session ended/);
 assert.equal(f.snapshot(),replacement);
 assert.equal(f.owner(),null);
});
