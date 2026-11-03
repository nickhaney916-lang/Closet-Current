import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AUTH_EPOCH_01,createNativeAuthEpoch01} from '../research/auth-epoch-01/native-session-epoch.mjs';
class Events {
 constructor(){this.listeners=new Map();}
 addEventListener(type,fn){const a=this.listeners.get(type)||[];a.push(fn);this.listeners.set(type,a);}
 removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(f=>f!==fn));}
 dispatchEvent(event){for(const fn of this.listeners.get(event.type)||[])fn(event);}
 count(type){return (this.listeners.get(type)||[]).length;}
}
function fixture(){
 const logout=new Events(),authGate={hidden:true},appShell={hidden:false};
 const store=new Map();
 const win=new Events();
 win.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
 win.localStorage={getItem:key=>store.get(key)??null,setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)};
 const doc={getElementById:id=>({logout,authGate,appShell}[id]??null)};
 const userA={id:'fixture-a'},userB={id:'fixture-b'};
 const nativeAuth={ready:Promise.resolve(userA),user:userA,
  async getAccessToken(){return JSON.parse(store.get('closet-current-auth-v1')).access_token;}};
 function session(access='auth-token-A',refresh='refresh-A',offset=3600){
  return {access_token:access,refresh_token:refresh,
   expires_at:Math.floor(Date.now()/1000)+offset};
 }
 const write=x=>win.localStorage.setItem('closet-current-auth-v1',JSON.stringify(x));
 write(session());
 return {win,doc,logout,nativeAuth,userA,userB,authGate,appShell,
  session,write,store};
}
test('auth01 native existing Closet Current login satisfies donor contract after token verification only',async()=>{
 const f=fixture();
 const b=createNativeAuthEpoch01({nativeAuth:f.nativeAuth,win:f.win,doc:f.doc});
 assert.throws(()=>b.auth.getSessionGeneration(),/revoked/);
 assert.equal(b.auth.user,null);
 const proof=await b.attest();
 assert.equal(proof.ownerId,'fixture-a');assert.equal(proof.authenticated,true);
 assert.equal(b.auth.user,f.userA);
 assert.equal(b.auth.getSessionGeneration(),proof.generation);
 assert.equal(await b.auth.getAccessToken(),'auth-token-A');
 assert.equal(b.status().active,true);
 assert.equal(b.status().tokenNeverExposed,true);
 assert.equal(JSON.stringify(b.status()).includes('auth-token-A'),false);
 assert.equal(Object.hasOwn(f.nativeAuth,'getSessionGeneration'),false);
 assert.equal(AUTH_EPOCH_01.realSupabaseRLSVerified,false);
 b.dispose();
 assert.throws(()=>b.auth.getSessionGeneration(),/revoked|disposed/);
 assert.equal(f.logout.count('click'),0);
 assert.equal(f.win.count('pagehide'),0);
});
test('auth01 owner change or same owner refresh invalidates previous async private IDB lease',async()=>{
 for(const change of ['owner','access','refresh','expiry','store','gate']){
  const f=fixture(),b=createNativeAuthEpoch01({nativeAuth:f.nativeAuth,win:f.win,doc:f.doc});
  await b.attest();
  const old=b.auth.getSessionGeneration();
  if(change==='owner')f.nativeAuth.user=f.userB;
  if(change==='access')f.write(f.session('auth-token-rotated','refresh-A'));
  if(change==='refresh')f.write(f.session('auth-token-A','refresh-rotated'));
  if(change==='expiry')f.write(f.session('auth-token-A','refresh-A',3610));
  if(change==='store')f.win.localStorage.removeItem('closet-current-auth-v1');
  if(change==='gate')f.authGate.hidden=false;
  assert.throws(()=>b.auth.getSessionGeneration(),/AUTH01/,change);
  assert.equal(b.auth.user,null);
  assert.equal(b.status().active,false);
  assert.ok(b.status().generation>old);
  b.dispose();
 }
});
test('auth01 immediate real native logout click blocks private results BEFORE asynchronous logout network',async()=>{
 const f=fixture(),b=createNativeAuthEpoch01({nativeAuth:f.nativeAuth,win:f.win,doc:f.doc});
 await b.attest();const old=b.auth.getSessionGeneration();
 let invalidationCount=0;
 f.win.addEventListener('closet:alpha-session-changed',()=>invalidationCount++);
 f.logout.dispatchEvent({type:'click',isTrusted:true});
 assert.throws(()=>b.auth.getSessionGeneration(),/revoked/);
 assert.equal(b.auth.user,null);
 assert.equal(b.status().generation,old+1);
 assert.ok(invalidationCount>=1);
 await b.attest();
 assert.ok(b.auth.getSessionGeneration()>old);
 b.dispose();
});
test('auth01 pagehide and browser storage revocations prevent cross-tab stale private state',async()=>{
 for(const which of ['pagehide','storage']){
  const f=fixture(),b=createNativeAuthEpoch01({nativeAuth:f.nativeAuth,win:f.win,doc:f.doc});
  await b.attest();
  f.win.dispatchEvent(which==='pagehide'?{type:'pagehide'}:
   {type:'storage',key:'closet-current-auth-v1'});
  assert.throws(()=>b.auth.getSessionGeneration(),/revoked/);
  assert.equal(b.status().active,false);
  b.dispose();
 }
});
test('auth01 refuses a native async user switch or a token that does not equal the persisted browser session',async()=>{
 const f=fixture(),pending=[];
 f.nativeAuth.getAccessToken=()=>new Promise(resolve=>pending.push(resolve));
 const b=createNativeAuthEpoch01({nativeAuth:f.nativeAuth,win:f.win,doc:f.doc});
 const result=b.attest();
 while(!pending.length)await new Promise(r=>setImmediate(r));
 f.nativeAuth.user=f.userB;
 pending.shift()('auth-token-A');
 await assert.rejects(result,/AUTH01/);
 assert.equal(b.status().active,false);
 b.dispose();
 const g=fixture(),c=createNativeAuthEpoch01({nativeAuth:g.nativeAuth,win:g.win,doc:g.doc});
 g.nativeAuth.getAccessToken=async()=> 'different-token';
 await assert.rejects(c.attest(),/AUTH01/);
 assert.equal(c.auth.user,null);c.dispose();
});
test('auth01 a late real native auth reply cannot RESURRECT a logout or tab-revoked lease',async()=>{
 for(const source of ['logout','storage','pagehide']){
  const f=fixture(),waiting=[];
  f.nativeAuth.getAccessToken=()=>new Promise(resolve=>waiting.push(resolve));
  const b=createNativeAuthEpoch01({nativeAuth:f.nativeAuth,win:f.win,doc:f.doc});
  const admission=b.attest();
  while(!waiting.length)await new Promise(r=>setImmediate(r));
  if(source==='logout')f.logout.dispatchEvent({type:'click',isTrusted:true});
  if(source==='storage')f.win.dispatchEvent({type:'storage',key:'closet-current-auth-v1'});
  if(source==='pagehide')f.win.dispatchEvent({type:'pagehide'});
  waiting.shift()('auth-token-A');
  await assert.rejects(admission,/AUTH01/);
  assert.equal(b.status().active,false);
  assert.equal(b.auth.user,null);
  assert.throws(()=>b.auth.getSessionGeneration(),/revoked/);
  b.dispose();
 }
});
test('auth01 fail closed across async token refresh; same user cannot retain old lease',async()=>{
 const f=fixture(),b=createNativeAuthEpoch01({nativeAuth:f.nativeAuth,win:f.win,doc:f.doc});
 await b.attest();
 f.nativeAuth.getAccessToken=async()=>{
  f.write(f.session('rotated-access','rotated-refresh'));
  return 'rotated-access';
 };
 await assert.rejects(b.auth.getAccessToken(),/AUTH01/);
 assert.throws(()=>b.auth.getSessionGeneration(),/revoked/);
 assert.equal(b.status().active,false);
 const n=await b.attest();
 assert.equal(n.ownerId,'fixture-a');
 assert.equal(b.auth.getSessionGeneration(),n.generation);
 b.dispose();
});
test('auth01 source bridge never writes native auth/app, session token logs or user/private DB',()=>{
 const s=readFileSync('research/auth-epoch-01/native-session-epoch.mjs','utf8');
 const mount=readFileSync('research/auth-epoch-01/mount-real-native-e2e.mjs','utf8');
 assert.ok(s.includes('nativeAuth.getAccessToken()'));
 assert.ok(s.includes("addEventListener('click',logout,true)"));
 assert.ok(s.includes("addEventListener('storage',storage)"));
 assert.ok(mount.includes('mountE2EIntegration01({doc,auth:bridge.auth})'));
 assert.ok(mount.includes("get('authEpoch01')!=='after'"));
 for(const bad of ["fetch(", "indexedDB.open", "XMLHttpRequest", "console.log", "window.closetAuth=", "localStorage.setItem"])
  assert.ok(!s.includes(bad),'No authentication override, network upload or storage write allowed: '+bad);
 for(const bad of ["new Image(", "sourceNeutralSideSeamFlow28(", "createElement('canvas')"])
  assert.ok(!mount.includes(bad));
});
