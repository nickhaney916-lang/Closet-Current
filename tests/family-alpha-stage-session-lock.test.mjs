/**
 * Regression acceptance (not the passing OPEN-defect characterization from #294).
 * VM executes the actual staging-transformed production auth source.
 * Synthetic HTTP and fake accounts only. No real Supabase/Cloudflare/email.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {hardenStagingAuthSession} from '../scripts/family-alpha-stage-session-hardening.mjs';
import {stageAuthSource,STAGE_BASE,PROD_BASE} from '../scripts/build-family-alpha-staging-auth-hold.mjs';
const original=await readFile('public/auth.js','utf8');
const source=stageAuthSource(original);
const STORE='closet-alpha-staging-auth-v1';
const user=id=>({id,email:'synthetic@example.invalid',user_metadata:{username:'Synthetic'}});
const success=(id='synthetic-owner')=>({
 access_token:'SYNTHETIC_ACCESS_'+id,
 refresh_token:'SYNTHETIC_REFRESH_'+id,
 user:user(id),expires_in:3600
});
function fixture(responses=[]){
 const elements=new Map(),saved=new Map(),events=new Map(),requests=[],dispatched=[];
 const ids=['authStatus','authForm','authSubmit','authMode','authReset',
  'authResend','authEmail','authPassword','authPasswordToggle',
  'authUsername','usernameWrap','authGate','appShell','accountLabel','logout'];
 for(const id of ids)elements.set(id,{
  value:'synthetic',hidden:false,type:id==='authPassword'?'password':'text',
  setAttribute(){},addEventListener(){},checkValidity(){return true;}
 });
 elements.get('appShell').hidden=true;
 elements.get('authEmail').value='synthetic@example.invalid';
 elements.get('authPassword').value='fake-password';
 let cloudClears=0,reloads=0;
 const window={
  __CLOSET_ALPHA_STAGE_AUTH__:{
   ready:true,base:STAGE_BASE,key:'sb_publishable_SYNTHETIC_ONLY',
   redirect:'https://mock-staging.example.invalid/',releaseGate:'HOLD'
  },
  Event:function Event(type){this.type=type;},
  dispatchEvent:event=>{dispatched.push(event.type);},
  addEventListener:(event,fn)=>events.set(event,fn),
  closetCloud:{invalidateSession(){cloudClears++;}}
 };
 const location={
  origin:'https://mock-staging.example.invalid',protocol:'https:',
  pathname:'/',hash:'',search:'',reload(){reloads++;}
 };
 const fetch=async (url,options)=>{
  requests.push({url,method:options?.method});
  const next=responses.shift();
  if(!next)throw new TypeError('Mock network unavailable');
  if(typeof next==='function')return next(url,options);
  if(next instanceof Error)throw next;
  return {ok:next.ok!==false,status:next.status||200,json:async()=>next.data||success()};
 };
 vm.runInNewContext(source,{
  window,document:{getElementById:id=>elements.get(id)},location,
  history:{replaceState(){}},localStorage:{
   getItem:k=>saved.get(k)||null,
   setItem:(k,v)=>saved.set(k,v),
   removeItem:k=>saved.delete(k)
  },
  URLSearchParams,AbortController,TypeError,setTimeout,clearTimeout,fetch
 });
 return {
  window,elements,saved,events,requests,dispatched,
  get cloudClears(){return cloudClears;},
  get reloads(){return reloads;},
  async login(){await elements.get('authForm').onsubmit({preventDefault(){}});}
 };
}
test('hardening only transforms isolated stage Auth, never production source or provider endpoints',()=>{
 assert.match(source,/stageTerminalRefreshError/);
 assert.match(source,/addEventListener\?\.\('storage'/);
 assert.match(source,/closet-alpha-staging-auth-v1/);
 assert.doesNotMatch(source,/https:\/\/hlkgymugtfbirlpunsra\.supabase\.co/);
 assert.equal(original.includes('stageTerminalRefreshError'),false);
 assert.throws(()=>hardenStagingAuthSession(original));
 assert.throws(()=>hardenStagingAuthSession(source));
});
test('terminal refresh_token_not_found locks shell, clears memory/storage and fences images',async()=>{
 const f=fixture([
  {data:success()},
  {ok:false,status:400,data:{msg:'Refresh token revoked',error_code:'refresh_token_not_found'}}
 ]);
 await f.login();
 const generation=f.window.closetAuth.getSessionGeneration();
 assert.equal(f.elements.get('appShell').hidden,false);
 await assert.rejects(f.window.closetAuth.getAccessToken({force:true}),/Refresh token revoked/);
 assert.equal(f.window.closetAuth.user,null);
 assert.equal(f.window.closetAuth.getSessionGeneration(),generation+1);
 assert.equal(f.elements.get('appShell').hidden,true);
 assert.equal(f.elements.get('authGate').hidden,false);
 assert.equal(f.saved.has(STORE),false);
 assert.equal(f.cloudClears,1);
 assert.equal(f.reloads,1);
 assert.ok(f.dispatched.includes('closet:alpha-session-changed'));
 await assert.rejects(f.window.closetAuth.getAccessToken(),/Sign in required/);
 assert.ok(f.requests.every(x=>x.url.startsWith(STAGE_BASE+'/auth/v1/')));
});
test('401 and owner mismatch lock; network, timeout, 429 and 503 preserve current local session',async()=>{
 for(const [name,rejection,shouldLock] of [
  ['401',{ok:false,status:401,data:{msg:'Revoked',error_code:'unknown'}},true],
  ['owner-mismatch',{data:success('different-owner')},true],
  ['offline',new TypeError('Network unavailable'),false],
  ['timeout',Object.assign(new Error('Timeout'),{name:'AbortError'}),false],
  ['rate-limit',{ok:false,status:429,data:{msg:'Slow down',error_code:'over_request_rate_limit'}},false],
  ['server',{ok:false,status:503,data:{msg:'Backend unavailable'}},false]
 ]){
  const f=fixture([{data:success()},rejection]);
  await f.login();
  await assert.rejects(f.window.closetAuth.getAccessToken({force:true}),undefined,name);
  assert.equal(f.elements.get('appShell').hidden,shouldLock,name);
  assert.equal(Boolean(f.window.closetAuth.user),!shouldLock,name);
  assert.equal(f.cloudClears,shouldLock?1:0,name);
  assert.equal(f.saved.has(STORE),!shouldLock,name);
 }
});
test('cross-tab signout or replacement locks the private closet; unrelated storage keys do not',async()=>{
 for(const newValue of [null,'{"other":"owner"}']){
  const f=fixture([{data:success()}]);
  await f.login();
  const generation=f.window.closetAuth.getSessionGeneration();
  assert.equal(typeof f.events.get('storage'),'function');
  f.events.get('storage')({key:'an-unrelated-key',newValue:null,oldValue:'yes'});
  assert.equal(f.window.closetAuth.user?.id,'synthetic-owner');
  f.events.get('storage')({
   key:STORE,oldValue:f.saved.get(STORE),newValue
  });
  assert.equal(f.window.closetAuth.user,null);
  assert.equal(f.window.closetAuth.getSessionGeneration(),generation+1);
  assert.equal(f.elements.get('appShell').hidden,true);
  assert.equal(f.saved.has(STORE),false);
  assert.equal(f.reloads,1);
  assert.equal(f.cloudClears,1);
 }
});
test('out-of-order old login response cannot reopen private shell after cross-tab invalidation',async()=>{
 let unblock;
 const late=new Promise(resolve=>{unblock=resolve;});
 const f=fixture([()=>late]);
 const pending=f.login();
 await Promise.resolve();
 f.events.get('storage')({key:STORE,oldValue:'old-value',newValue:null});
 unblock({ok:true,status:200,json:async()=>success('late-user')});
 await pending;
 assert.equal(f.window.closetAuth.user,null);
 assert.equal(f.elements.get('appShell').hidden,true);
 assert.equal(f.saved.has(STORE),false);
 assert.equal(f.window.closetAuth.getSessionGeneration(),1);
});
test('scope stays staged after recovery; no client can fall back to production',async()=>{
 const f=fixture([{data:success()},{
  ok:false,status:403,data:{msg:'Session expired',error_code:'session_expired'}
 }]);
 await f.login();
 await assert.rejects(f.window.closetAuth.getAccessToken({force:true}));
 assert.ok(f.requests.every(r=>r.url.startsWith(STAGE_BASE+'/auth/v1/')));
 assert.equal(f.requests.some(r=>r.url.startsWith(PROD_BASE)),false);
});
