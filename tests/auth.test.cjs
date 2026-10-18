'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/auth.js'),'utf8');
function app(fetchImpl=async()=>{throw new TypeError('network unavailable');},callback={},initialSession=null){
 const elements=new Map(),listeners={},timers=new Map(),requests=[];
 for(const id of ['authStatus','authForm','authSubmit','authMode','authReset','authResend','authRetry','authEmail','authPassword','authPasswordToggle','authUsername','usernameWrap','authGate','appShell','accountLabel','logout']){
  elements.set(id,{id,value:'',hidden:false,disabled:false,required:false,textContent:'',setAttribute(){},addEventListener(name,fn){listeners[name]=fn;},checkValidity(){return true;}});
 }
 elements.get('authRetry').hidden=true;
 elements.get('appShell').hidden=true;
 elements.get('authEmail').value='test@example.invalid';
 elements.get('authPassword').value='test-password-only';
 elements.get('authUsername').value='test_user';
 const saved=new Map(),window={};if(initialSession)saved.set('closet-current-auth-v1',JSON.stringify(initialSession));let timerId=0,reloaded=false;
 vm.runInNewContext(source,{window,document:{getElementById:id=>elements.get(id)},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)},location:{reload(){reloaded=true;},pathname:'/Closet-Current/',...callback},history:{replaceState(){}},URLSearchParams,AbortController,TypeError,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),fetch:async(...args)=>{requests.push(args);return fetchImpl(...args);}});
 return {get:id=>elements.get(id),listeners,timers,requests,window,saved,reloaded:()=>reloaded,submit:()=>elements.get('authForm').onsubmit({preventDefault(){}})};
}
const response=(data,ok=true)=>({ok,json:async()=>data});
test('new visitors get signup guidance and hidden username cannot block login',()=>{
 const a=app();
 assert.match(a.get('authStatus').textContent,/Create an account first/);
 assert.equal(a.get('authUsername').disabled,true);
 a.get('authMode').onclick();
 assert.equal(a.get('authUsername').disabled,false);
 assert.equal(a.get('authUsername').required,true);
 assert.equal(a.get('authPassword').minLength,8);
 assert.equal(a.get('authPassword').autocomplete,'new-password');
 a.get('authMode').onclick();
 assert.equal(a.get('authUsername').disabled,true);
 assert.equal(a.get('authPassword').minLength,1);
});
test('native validation reports missing fields visibly without contacting auth',()=>{
 const a=app();
 a.listeners.invalid({target:{id:'authEmail',validity:{valueMissing:true}}});
 assert.match(a.get('authStatus').textContent,/Enter your email/);
 assert.equal(a.requests.length,0);
});
test('unregistered or incorrect credentials explain signup and keep closet locked',async()=>{
 const a=app(async()=>response({error_code:'invalid_credentials',msg:'Invalid login credentials'},false));
 await a.submit();
 assert.match(a.get('authStatus').textContent,/Email or password is incorrect/);
 assert.match(a.get('authStatus').textContent,/Create an account first/);
 assert.equal(a.window.closetAuth.user,null);
 assert.equal(a.get('authSubmit').disabled,false);
});
test('network failure shows a retry message and restores controls',async()=>{
 const a=app();await a.submit();
 assert.match(a.get('authStatus').textContent,/Could not connect/);
 assert.equal(a.get('authSubmit').disabled,false);
 assert.equal(a.timers.size,0);
});
test('pending login blocks duplicates and a timeout restores controls',async()=>{
 const a=app((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{const e=new Error('aborted');e.name='AbortError';reject(e);})));
 const pending=a.submit();
 assert.equal(a.get('authMode').disabled,true);
 await a.submit();
 assert.equal(a.requests.length,1);
 [...a.timers.values()][0]();
 await pending;
 assert.match(a.get('authStatus').textContent,/timed out/);
 assert.equal(a.get('authMode').disabled,false);
});
test('signup requiring confirmation does not grant access prematurely',async()=>{
 const a=app(async()=>response({user:{id:'pending-user'}}));
 a.get('authMode').onclick();await a.submit();
 assert.match(a.requests[0][0],/signup\?redirect_to=/);
 assert.match(a.get('authStatus').textContent,/Check your email/);
 assert.equal(a.window.closetAuth.user,null);
});
test('valid login opens the closet after a verified session response',async()=>{
 const a=app(async()=>response({access_token:'test-access',refresh_token:'test-refresh',user:{id:'test-user'},expires_in:3600}));
 await a.submit();
 assert.equal(a.window.closetAuth.user.id,'test-user');
 assert.equal(a.get('authGate').hidden,true);
 assert.equal(a.get('appShell').hidden,false);
});

test('confirmation and reset emails explicitly target the live app',async()=>{
 const a=app(async()=>response({user:{id:'pending'}}));a.get('authMode').onclick();await a.submit();
 assert.equal(new URL(a.requests[0][0]).searchParams.get('redirect_to'),'https://nickhaney916-lang.github.io/Closet-Current/');
 await a.get('authReset').onclick();assert.equal(new URL(a.requests[1][0]).searchParams.get('redirect_to'),'https://nickhaney916-lang.github.io/Closet-Current/');
});
test('expired email callback offers login without unlocking a wardrobe',()=>{
 const a=app(undefined,{hash:'#error=access_denied&error_code=otp_expired'});
 assert.match(a.get('authStatus').textContent,/expired or was already used/);assert.equal(a.window.closetAuth.user,null);
});
test('email callback verifies its token before opening the app',async()=>{
 const a=app(async()=>response({id:'confirmed-user',email:'test@example.invalid'}),{hash:'#access_token=fake-test-token&refresh_token=fake-test-refresh&type=signup'});
 await new Promise(setImmediate);assert.equal(a.requests[0][1].method,'GET');assert.match(a.requests[0][0],/auth\/v1\/user$/);assert.equal(a.window.closetAuth.user.id,'confirmed-user');
});
test('invalid callback token never opens the wardrobe',async()=>{
 const a=app(async()=>response({msg:'Invalid token'},false),{hash:'#access_token=invalid&type=signup'});
 await new Promise(setImmediate);assert.equal(a.window.closetAuth.user,null);assert.match(a.get('authStatus').textContent,/could not be verified/);
});
test('password recovery callback requires a new password before granting app access',async()=>{
 const a=app(async(url,options)=>response(options.method==='PUT'?{id:'reset-user',email:'test@example.invalid'}:{id:'reset-user',email:'test@example.invalid'}),{hash:'#access_token=fake&refresh_token=fake-refresh&type=recovery'});
 await new Promise(setImmediate);assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('authSubmit').textContent,'Save new password');
 a.get('authPassword').value='new-test-password';await a.submit();assert.equal(a.requests[1][1].method,'PUT');assert.equal(a.window.closetAuth.user.id,'reset-user');
});

test('resend confirmation uses the same production destination and signup verification type',async()=>{
 const a=app(async()=>response({}));await a.get('authResend').onclick();const [url,options]=a.requests[0];assert.match(url,/resend\?redirect_to=/);assert.equal(new URL(url).searchParams.get('redirect_to'),'https://nickhaney916-lang.github.io/Closet-Current/');assert.equal(JSON.parse(options.body).type,'signup');assert.match(a.get('authStatus').textContent,/newest email/);
});
test('callback verification blocks duplicate sign-in until it finishes',async()=>{
 let finish;const a=app(()=>new Promise(resolve=>finish=resolve),{hash:'#access_token=fake-test-token&type=signup'});assert.equal(a.get('authSubmit').disabled,true);await a.submit();assert.equal(a.requests.length,1);finish(response({id:'test-user'}));await new Promise(setImmediate);assert.equal(a.get('authSubmit').disabled,false);assert.equal(a.window.closetAuth.user.id,'test-user');
});
test('returning session refreshes with the correct endpoint and rotated refresh token',async()=>{
 const a=app(async()=>response({access_token:'new-access',refresh_token:'new-refresh',user:{id:'same-test-user'}}),{},{refresh_token:'old-test-refresh'});assert.equal(a.get('authSubmit').disabled,true);await new Promise(setImmediate);assert.match(a.requests[0][0],/token\?grant_type=refresh_token$/);assert.equal(JSON.parse(a.requests[0][1].body).refresh_token,'old-test-refresh');assert.equal(a.window.closetAuth.user.id,'same-test-user');assert.equal(JSON.parse(a.saved.get('closet-current-auth-v1')).refresh_token,'new-refresh');
});
test('expired returning session shows a login message rather than an email-link error',async()=>{
 const a=app(async()=>response({msg:'Invalid refresh token'},false),{},{refresh_token:'expired'});await new Promise(setImmediate);assert.match(a.get('authStatus').textContent,/login session has expired/);assert.equal(a.window.closetAuth.user,null);assert.equal(a.saved.has('closet-current-auth-v1'),false);assert.equal(a.get('authSubmit').disabled,false);
});
test('logout clears the local session even if its service request fails',async()=>{
 let calls=0;const a=app(async()=>++calls===1?response({access_token:'test-access',refresh_token:'test-refresh',user:{id:'test-user'}}):response({msg:'network error'},false));await a.submit();await a.get('logout').onclick();assert.match(a.requests[1][0],/auth\/v1\/logout$/);assert.equal(a.requests[1][1].headers.Authorization,'Bearer test-access');assert.equal(a.saved.has('closet-current-auth-v1'),false);assert.equal(a.reloaded(),true);
});

test('multiple empty login fields report the first invalid field rather than the last event',()=>{
 const a=app();a.get('authEmail').validity={valid:false,valueMissing:true};a.get('authPassword').validity={valid:false,valueMissing:true};
 a.listeners.invalid({target:a.get('authPassword')});assert.match(a.get('authStatus').textContent,/Enter your email/);assert.equal(a.requests.length,0);
});


test('blocked email delivery stays locked, restores controls and hides provider details',async()=>{
 for(const action of ['signup','reset','resend']){
  const a=app(async()=>response({error_code:'email_address_not_authorized',msg:'Private recipient and SMTP configuration details'},false));
  if(action==='signup'){a.get('authMode').onclick();await a.submit();}else await a.get(action==='reset'?'authReset':'authResend').onclick();
  assert.match(a.get('authStatus').textContent,/Email delivery is not ready/);
  assert.doesNotMatch(a.get('authStatus').textContent,/Private recipient|SMTP|Check your email|requested/);
  assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('authSubmit').disabled,false);assert.equal(a.get('authResend').disabled,false);assert.equal(a.timers.size,0);
 }
});
test('email and request throttling give wait guidance without retrying automatically',async()=>{
 for(const [code,status,expected] of [['over_email_send_rate_limit',429,/Too many emails/],['over_request_rate_limit',429,/Too many requests/],[undefined,429,/Too many requests/]]){
  const a=app(async()=>({...response({error_code:code,msg:'Internal limiter details'},false),status}));await a.get('authResend').onclick();
  assert.match(a.get('authStatus').textContent,expected);assert.doesNotMatch(a.get('authStatus').textContent,/Internal limiter/);assert.equal(a.requests.length,1);assert.equal(a.get('authResend').disabled,false);
 }
});
test('malformed successful email responses cannot report delivery success',async()=>{
 for(const data of [null,[], 'not an object','invalid-json']){
  for(const action of ['reset','resend']){
   const a=app(async()=>data==='invalid-json'?{ok:true,json:async()=>{throw new SyntaxError('not JSON');}}:response(data));
   await a.get(action==='reset'?'authReset':'authResend').onclick();assert.match(a.get('authStatus').textContent,/unreadable response/);
   assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('authReset').disabled,false);assert.equal(a.timers.size,0);
  }
 }
});
test('disabled email provider and unsupported email address give actionable messages',async()=>{
 for(const [code,expected] of [['email_provider_disabled',/signup is temporarily unavailable/],['email_address_invalid',/valid email address that can receive/]]){
  const a=app(async()=>response({code,msg:'Internal provider details'},false));a.get('authMode').onclick();await a.submit();
  assert.match(a.get('authStatus').textContent,expected);assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('authSubmit').disabled,false);
 }
});

test('cloud requests reuse a valid session without sending another login',async()=>{
 const a=app(async()=>response({access_token:'test-access',refresh_token:'test-refresh',user:{id:'test-user'},expires_in:3600}));await a.submit();
 assert.equal(await a.window.closetAuth.getAccessToken(),'test-access');assert.equal(a.requests.length,1);
});
test('simultaneous cloud refreshes rotate the token only once and retain the account',async()=>{
 let finish,calls=0;const a=app(async()=>++calls===1?response({access_token:'old-access',refresh_token:'old-refresh',user:{id:'test-user'}}):new Promise(r=>finish=r));await a.submit();
 const one=a.window.closetAuth.getAccessToken({force:true}),two=a.window.closetAuth.getAccessToken({force:true});assert.equal(a.requests.length,2);
 finish(response({access_token:'fresh-access',refresh_token:'fresh-refresh',user:{id:'test-user'}}));assert.deepEqual(await Promise.all([one,two]),['fresh-access','fresh-access']);
});
test('cloud token refresh cannot switch to a different account',async()=>{
 let calls=0;const a=app(async()=>++calls===1?response({access_token:'old-access',refresh_token:'old-refresh',user:{id:'first-user'}}):response({access_token:'other-access',user:{id:'other-user'}}));await a.submit();
 await assert.rejects(a.window.closetAuth.getAccessToken({force:true}),/account changed/);assert.equal(a.window.closetAuth.user.id,'first-user');
});


test('temporarily offline stored login stays locked and refresh token survives for explicit retry',async()=>{
 let available=false;
 const a=app(async()=>available?
  response({access_token:'recovered-access',refresh_token:'rotated-refresh',
    user:{id:'same-account',email:'test@example.invalid'},expires_in:3600}):
  Promise.reject(new TypeError('network unavailable')),{},{refresh_token:'original-refresh'});
 await new Promise(setImmediate);
 assert.equal(a.window.closetAuth.user,null);
 assert.equal(a.get('appShell').hidden,true); // private closet stays locked
 assert.equal(a.saved.has('closet-current-auth-v1'),true);
 assert.equal(JSON.parse(a.saved.get('closet-current-auth-v1')).refresh_token,'original-refresh');
 assert.equal(a.get('authRetry').hidden,false);
 assert.match(a.get('authStatus').textContent,/Your session is still saved/);
 assert.equal(a.get('authSubmit').disabled,false);
 available=true;
 await a.get('authRetry').onclick();
 assert.equal(a.window.closetAuth.user.id,'same-account');
 assert.equal(a.get('authRetry').hidden,true);
 assert.equal(a.get('authGate').hidden,true);
 assert.equal(JSON.parse(a.saved.get('closet-current-auth-v1')).refresh_token,'rotated-refresh');
 assert.equal(a.requests.length,2);
});
test('HTTP 5xx and timeout preserve stored refresh token; service denial revokes it',async()=>{
 for(const [kind,fetcher] of [
  ['503',async()=>({...response({error_code:'temporarily_unavailable'},false),status:503})],
  ['timeout',async(_url,{signal})=>new Promise((_ok,reject)=>signal.addEventListener('abort',()=>{
   const err=new Error('aborted');err.name='AbortError';reject(err);
  }))]
 ]){
  const a=app(fetcher,{},{refresh_token:'still-saved'});
  if(kind==='timeout'){
   // restoration starts synchronously and is in-flight; trigger the bounded timeout.
   assert.equal(a.timers.size,1);
   [...a.timers.values()][0]();
  }
  await new Promise(setImmediate);
  assert.equal(a.window.closetAuth.user,null);
  assert.equal(a.saved.has('closet-current-auth-v1'),true);
  assert.equal(a.get('authRetry').hidden,false);
 }
 const denied=app(async()=>({...response({error_code:'invalid_grant',msg:'Refresh token not found'},false),status:401}),
  {},{refresh_token:'revoked'});
 await new Promise(setImmediate);
 assert.equal(denied.get('authRetry').hidden,true);
 assert.equal(denied.saved.has('closet-current-auth-v1'),false);
 assert.match(denied.get('authStatus').textContent,/expired/);
});
test('200 OK without access token never opens closet, including recovery or login',async()=>{
 for(const payload of [
  {user:{id:'claimed-user'}},{access_token:'',user:{id:'claimed-user'}},
  {access_token:'test',user:{}}
 ]){
  const a=app(async()=>response(payload));
  await a.submit();
  assert.equal(a.window.closetAuth.user,null);
  assert.equal(a.get('authGate').hidden,false);
  assert.equal(a.get('appShell').hidden,true);
  assert.equal(a.saved.has('closet-current-auth-v1'),false);
 }
});
test('password reset cannot authenticate a different user on same callback token',async()=>{
 let calls=0;
 const a=app(async()=>response(++calls===1?
  {id:'recovery-owner',email:'test@example.invalid'}:
  {id:'other-user',email:'test@example.invalid'}),
  {hash:'#access_token=recovery-token&refresh_token=recovery-refresh&type=recovery'});
 await new Promise(setImmediate);
 assert.equal(a.window.closetAuth.user,null);
 a.get('authPassword').value='new-password-long';
 await a.submit();
 assert.equal(a.window.closetAuth.user,null);
 assert.equal(a.get('authGate').hidden,false);
 assert.match(a.get('authStatus').textContent,/Session account changed/);
});
test('saved-session retries are serialized so double tapping does not send duplicate requests',async()=>{
 let finish;
 const a=app(()=>new Promise(resolve=>finish=resolve),{},{refresh_token:'retry-token'});
 await new Promise(setImmediate);
 assert.equal(a.requests.length,1);
 assert.equal(a.get('authSubmit').disabled,true);
 await a.get('authRetry').onclick();
 assert.equal(a.requests.length,1);
 finish(response({access_token:'success',refresh_token:'new',user:{id:'test-account'}}));
 await new Promise(setImmediate);
 assert.equal(a.window.closetAuth.user.id,'test-account');
});
