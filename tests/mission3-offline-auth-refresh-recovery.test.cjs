'use strict';
// Execute ACTUAL public/auth.js against synthetic browser objects. Never
// invoke or mock a production Supabase hostname over a network.
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm');
const auth=fs.readFileSync('public/auth.js','utf8');
const STORE='closet-current-auth-v1',owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ticks=async()=>{for(let i=0;i<70;i++)await Promise.resolve();};
const saved=JSON.stringify({epoch:'previous-session-epoch',
 access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:9999999999});
function fixture(kind='offline'){
 const events={},els=new Map(),values=new Map([[STORE,saved]]),requests=[];
 const $=id=>{
  if(!els.has(id))els.set(id,{
   hidden:false,disabled:false,value:'',textContent:'',type:id==='authPassword'?'password':'text',
   minLength:0,autocomplete:'',required:false,title:'',validity:{valid:true},
   setAttribute(){},getAttribute(){return null},addEventListener(){},checkValidity(){return true},
   classList:{add(){},remove(){}}
  });
  return els.get(id);
 };
 const location={hash:'',search:'',pathname:'/',reloadCount:0,reload(){this.reloadCount++;}};
 const state={kind};
 const fetch=async(path)=>{
  requests.push(path);
  if(state.kind==='offline')throw new TypeError('offline network failure');
  if(state.kind==='timeout'){const error=Error('timeout');error.name='AbortError';throw error;}
  if(state.kind==='badtoken')return {ok:false,status:401,
   json:async()=>({error_code:'invalid_grant',message:'Refresh token expired'})};
  if(state.kind==='servererror')return {ok:false,status:503,
   json:async()=>({error_code:'service_unavailable',message:'Backend temporarily unavailable'})};
  if(state.kind==='ratelimit')return {ok:false,status:429,
   json:async()=>({error_code:'over_request_rate_limit',message:'Try later'})};
  if(state.kind==='malformed')return {ok:true,status:200,json:async()=>null};
  return {ok:true,status:200,json:async()=>({
   user:{id:owner,email:'example@synthetic.invalid'},
   access_token:'verified-A',refresh_token:'rotated-A',expires_in:3600
  })};
 };
 const storage={getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value)),
  removeItem:key=>values.delete(key)};
 const window={addEventListener:(key,cb)=>{events[key]=cb;},
  dispatchEvent(){}};
 const ctx={window,document:{getElementById:$},localStorage:storage,location,
  history:{replaceState(){}},fetch,AbortController,setTimeout,clearTimeout,
  crypto:{randomUUID:()=> 'ephemeral-new-epoch'},Date,Promise,JSON,
  Error,TypeError,URLSearchParams,Event,console};
 vm.createContext(ctx);vm.runInContext(auth,ctx);
 return {ctx,events,els,location,storage,values,requests,state,getStatus:()=>$('authStatus').textContent};
}
for(const kind of ['offline','timeout','servererror','ratelimit','malformed']){
 test(kind+' refresh preserves stored signed-session candidate but never opens wardrobe',async()=>{
  const f=fixture(kind);await ticks();
  assert.equal(f.storage.getItem(STORE),saved);
  assert.equal(f.ctx.window.closetAuth.user,null);
  assert.equal(f.els.get('appShell').hidden,true,'private wardrobe must remain gated');
  assert.match(f.getStatus(),/cannot verify|connection is unavailable/i);
  assert.equal(f.requests.length,1);
  assert.equal(f.location.reloadCount,0);
  f.events.online();assert.equal(f.location.reloadCount,1,
   'a reconnect can retry only that unchanged saved credential');
 });
}
test('401 invalid refresh truly expires and deletes credential, never auto retries',async()=>{
 const f=fixture('badtoken');await ticks();
 assert.equal(f.storage.getItem(STORE),null);
 assert.equal(f.ctx.window.closetAuth.user,null);
 assert.match(f.getStatus(),/session has expired/i);
 f.events.online();assert.equal(f.location.reloadCount,0);
});
test('other-tab logout invalidates previously offline restore before automatic reconnect',async()=>{
 const f=fixture('offline');await ticks();
 f.storage.removeItem(STORE);f.events.online();
 assert.equal(f.location.reloadCount,0);
 assert.equal(f.ctx.window.closetAuth.user,null);
 assert.equal(f.els.get('appShell').hidden,true);
});
test('other-tab replacement session can never be overwritten by stale offline failure',async()=>{
 const f=fixture('offline');await ticks();
 const newSession=JSON.stringify({epoch:'signed-other-owner',refresh_token:'another'});
 f.storage.setItem(STORE,newSession);
 f.events.online();
 assert.equal(f.location.reloadCount,0);
 assert.equal(f.storage.getItem(STORE),newSession);
});
test('owner typing a new login is never interrupted by reconnect navigation',async()=>{
 const f=fixture('offline');await ticks();
 f.els.get('authEmail').value='typed@synthetic.invalid';
 f.events.online();assert.equal(f.location.reloadCount,0);
 assert.equal(f.storage.getItem(STORE),saved);
});
test('a recovered verified token unlocks only the verified user; cached credentials alone cannot',async()=>{
 const f=fixture('success');await ticks();
 assert.equal(f.ctx.window.closetAuth.user?.id,owner);
 assert.equal(f.els.get('authGate').hidden,true);
 assert.equal(f.els.get('appShell').hidden,false);
 assert.equal(JSON.parse(f.storage.getItem(STORE)).refresh_token,'rotated-A');
 assert.notEqual(f.storage.getItem(STORE),saved);
 f.events.online();assert.equal(f.location.reloadCount,0);
});
test('new owner credentials placed by another tab are not removed by late transient failure',async()=>{
 let release;
 const held=new Promise(resolve=>release=resolve);
 const f=fixture('success');
 // The real startup fetch was already scheduled; verify that when a new
 // session replaces the snapshot before its reply, it never overwrites.
 const newSession=JSON.stringify({epoch:'new-owner',refresh_token:'B'});
 f.storage.setItem(STORE,newSession);
 await ticks();
 assert.equal(f.storage.getItem(STORE),newSession);
 assert.equal(f.ctx.window.closetAuth.user,null);
});
