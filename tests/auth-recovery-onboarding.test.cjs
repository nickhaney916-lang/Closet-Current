'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(process.env.AUTH_SOURCE||path.join(__dirname,'../public/auth.js'),'utf8');
function app(fetchImpl=async()=>{throw new TypeError('network unavailable');},callback={},initialSession=null,storageBlocked=false){
 const elements=new Map(),listeners={},timers=new Map(),requests=[];
 for(const id of ['authHelp','authStatus','authForm','authSubmit','authMode','authReset','authResend','authRetry','authEmail','authPassword','authPasswordToggle','authUsername','usernameWrap','pilotNoticeWrap','pilotNoticeAck','authGate','appShell','accountLabel','logout']){
  elements.set(id,{id,value:'',hidden:false,disabled:false,required:false,textContent:'',setAttribute(){},addEventListener(name,fn){listeners[name]=fn;},checkValidity(){return true;}});
 }
 elements.get('authRetry').hidden=true;
 elements.get('appShell').hidden=true;
 elements.get('authEmail').value='test@example.invalid';
 elements.get('authPassword').value='test-password-only';
 elements.get('authUsername').value='test_user';
 const saved=new Map(),window={ClosetPilotNotice:require('../public/pilot-notice.js')};if(initialSession)saved.set('closet-current-auth-v1',JSON.stringify(initialSession));let timerId=0,reloaded=false,sanitized=null;
 vm.runInNewContext(source,{window,document:{getElementById:id=>elements.get(id)},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>{if(storageBlocked)throw Error('Blocked storage');saved.set(key,value);},removeItem:key=>saved.delete(key)},location:{reload(){reloaded=true;},pathname:'/Closet-Current/',...callback},history:{replaceState(...args){sanitized=args;}},URLSearchParams,AbortController,TypeError,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),fetch:async(...args)=>{requests.push(args);return fetchImpl(...args);}});
 return {get:id=>elements.get(id),listeners,timers,requests,window,saved,reloaded:()=>reloaded,sanitized:()=>sanitized,submit:()=>elements.get('authForm').onsubmit({preventDefault(){}})};
}
const response=(data,ok=true)=>({ok,json:async()=>data});

const settle=()=>new Promise(setImmediate);
const recovered={access_token:'reset-access',refresh_token:'reset-refresh',expires_in:3600,user:{id:'reset-owner',email:'reset@example.invalid'}};
const callback={hash:'#access_token=reset-access&refresh_token=reset-refresh&type=recovery'};
test('verified recovery persists an owner-bound pending marker without retaining callback credentials',async()=>{
 const a=app(async()=>response(recovered.user),callback);await settle();
 const pending=JSON.parse(a.saved.get('closet-current-auth-v1'));
 assert.equal(pending.recovery,true);assert.equal(pending.recovery_user_id,'reset-owner');
 assert.equal(pending.owner_id,'reset-owner');assert.equal(a.window.closetAuth.user,null);
 assert.equal(a.get('appShell').hidden,true);assert.equal(a.sanitized()[2],'/Closet-Current/');
});
test('reload resumes password change without opening wardrobe or restoring an older account',async()=>{
 const old={access_token:'old-A',refresh_token:'old-refresh-A',owner_id:'old-owner'};
 const initial=app(async()=>response(recovered.user),callback,old);await settle();
 const pending=JSON.parse(initial.saved.get('closet-current-auth-v1'));
 const a=app(async(url,opts)=>response(opts.method==='PUT'?recovered.user:recovered),{},pending);await settle();
 assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('appShell').hidden,true);
 assert.equal(a.get('authSubmit').textContent,'Save new password');assert.equal(a.get('authEmail').value,'reset@example.invalid');
 a.get('authPassword').value='new-long-password';await a.submit();
 assert.equal(a.window.closetAuth.user.id,'reset-owner');
 const saved=JSON.parse(a.saved.get('closet-current-auth-v1'));assert.equal(saved.recovery,undefined);assert.equal(saved.owner_id,'reset-owner');
});
test('recovery offers a local Back to log in path without server-wide signout or repeated email sends',async()=>{
 const a=app(async()=>response(recovered.user),callback);await settle();
 assert.equal(a.get('authMode').hidden,false);assert.equal(a.get('authMode').textContent,'Back to log in');
 a.get('authMode').onclick();
 assert.equal(a.get('authEmail').disabled,false);assert.equal(a.get('authReset').hidden,false);assert.equal(a.get('authResend').hidden,false);
 assert.equal(a.saved.has('closet-current-auth-v1'),false);assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('authHelp').open,true);
 assert.equal(a.requests.length,1);assert.equal(a.get('authPassword').value,'');
});
test('expired recovery update unlocks email/reset controls and gives the correct new-link instructions',async()=>{
 const a=app(async(_,opts)=>opts.method==='PUT'?{...response({error_code:'session_not_found'},false),status:401}:response(recovered.user),callback);
 await settle();a.get('authPassword').value='new-long-password';await a.submit();
 assert.equal(a.window.closetAuth.user,null);assert.equal(a.saved.has('closet-current-auth-v1'),false);
 assert.equal(a.get('authEmail').disabled,false);assert.equal(a.get('authReset').hidden,false);assert.equal(a.get('authMode').hidden,false);
 assert.match(a.get('authStatus').textContent,/session expired.*Reset password/);assert.equal(a.get('authHelp').open,true);
});
test('temporary recovery interruption preserves pending owner and requires explicit retry',async()=>{
 const pending={...recovered,owner_id:'reset-owner',recovery:true,recovery_user_id:'reset-owner'};
 const a=app(async()=>{throw new TypeError('offline');},{},pending);await settle();
 assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('authRetry').hidden,false);
 assert.equal(JSON.parse(a.saved.get('closet-current-auth-v1')).recovery,true);
});
test('pending recovery and ordinary saved sessions reject a different returned owner',async()=>{
 for(const pending of [
  {refresh_token:'bound',owner_id:'reset-owner'},
  {refresh_token:'bound',owner_id:'reset-owner',recovery:true,recovery_user_id:'reset-owner'},
  {refresh_token:'bound',recovery:true}
 ]){
  const a=app(async()=>response({...recovered,user:{id:'different-owner'}}),{},pending);await settle();
  assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('appShell').hidden,true);assert.equal(a.saved.has('closet-current-auth-v1'),false);
 }
});
test('storage failure never publishes a partial signed-in identity or exposes token API',async()=>{
 const a=app(async()=>response(recovered),{},null,true);await a.submit();
 assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('appShell').hidden,true);
 assert.match(a.get('authStatus').textContent,/Allow site storage/);
 await assert.rejects(a.window.closetAuth.getAccessToken(),/Sign in required/);
 const restored=app(async()=>response(recovered),{},{refresh_token:'existing',owner_id:'reset-owner'},true);await settle();
 assert.equal(restored.window.closetAuth.user,null);assert.equal(restored.get('authRetry').hidden,false);
 assert.match(restored.get('authStatus').textContent,/Allow site storage/);
});
test('expired link exposes both clearly distinguished email recovery choices without auto requests',async()=>{
 const a=app(undefined,{hash:'#error_code=otp_expired&type=recovery'});
 assert.equal(a.get('authHelp').open,true);assert.match(a.get('authStatus').textContent,/Resend confirmation email.*Reset password/);
 assert.equal(a.requests.length,0);assert.equal(a.window.closetAuth.user,null);
});
test('malformed transient refresh reply preserves original token for a serialized retry',async()=>{
 for(const payload of [null,{user:{id:'reset-owner'}}]){
 const a=app(async()=>({ok:true,json:async()=>payload}),{},{refresh_token:'existing',owner_id:'reset-owner'});await settle();
 assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('authRetry').hidden,false);
 assert.equal(JSON.parse(a.saved.get('closet-current-auth-v1')).refresh_token,'existing');
 }
});
test('unconfirmed email opens help and explains which email to request',async()=>{
 const a=app(async()=>response({error_code:'email_not_confirmed'},false));await a.submit();
 assert.equal(a.get('authHelp').open,true);assert.match(a.get('authStatus').textContent,/Resend confirmation email/);
 assert.equal(a.window.closetAuth.user,null);
});
