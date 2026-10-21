'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/auth.js'),'utf8');
function app(fetchImpl=async()=>{throw new TypeError('network unavailable');},callback={},initialSession=null){
 const elements=new Map(),listeners={},timers=new Map(),requests=[];
 for(const id of ['authStatus','authForm','authSubmit','authMode','authReset','authResend','authRetry','authEmail','authPassword','authPasswordToggle','authUsername','usernameWrap','pilotNoticeWrap','pilotNoticeAck','authGate','appShell','accountLabel','logout']){
  elements.set(id,{id,value:'',hidden:false,disabled:false,required:false,textContent:'',setAttribute(){},addEventListener(name,fn){listeners[name]=fn;},checkValidity(){return true;}});
 }
 elements.get('authRetry').hidden=true;
 elements.get('appShell').hidden=true;
 elements.get('authEmail').value='test@example.invalid';
 elements.get('authPassword').value='test-password-only';
 elements.get('authUsername').value='test_user';
 const saved=new Map(),window={ClosetPilotNotice:require('../public/pilot-notice.js')};if(initialSession)saved.set('closet-current-auth-v1',JSON.stringify(initialSession));let timerId=0,reloaded=false,sanitized=null;
 vm.runInNewContext(source,{window,document:{getElementById:id=>elements.get(id)},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)},location:{reload(){reloaded=true;},pathname:'/Closet-Current/',...callback},history:{replaceState(...args){sanitized=args;}},URLSearchParams,AbortController,TypeError,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),fetch:async(...args)=>{requests.push(args);return fetchImpl(...args);}});
 return {get:id=>elements.get(id),listeners,timers,requests,window,saved,reloaded:()=>reloaded,sanitized:()=>sanitized,submit:()=>elements.get('authForm').onsubmit({preventDefault(){}})};
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
 a.get('authMode').onclick();a.get('pilotNoticeAck').checked=true;await a.submit();
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
 const a=app(async()=>response({user:{id:'pending'}}));a.get('authMode').onclick();a.get('pilotNoticeAck').checked=true;await a.submit();
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
  if(action==='signup'){a.get('authMode').onclick();a.get('pilotNoticeAck').checked=true;await a.submit();}else await a.get(action==='reset'?'authReset':'authResend').onclick();
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
  const a=app(async()=>response({code,msg:'Internal provider details'},false));a.get('authMode').onclick();a.get('pilotNoticeAck').checked=true;await a.submit();
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


test('early-pilot data notice acknowledgement gates signup but not login or recovery',async()=>{
 const a=app(async()=>response({user:{id:'pending-signup'}}));
 assert.equal(a.get('pilotNoticeWrap').hidden,true);
 assert.equal(a.get('pilotNoticeAck').disabled,true);
 a.get('authMode').onclick();
 assert.equal(a.get('pilotNoticeWrap').hidden,false);
 assert.equal(a.get('pilotNoticeAck').required,true);
 assert.equal(a.get('pilotNoticeAck').disabled,false);
 await a.submit();
 assert.equal(a.requests.length,0,'never attempt signup without reviewed pilot data notice');
 assert.equal(a.window.closetAuth.user,null);
 assert.match(a.get('authStatus').textContent,/Review the pilot data notice/);
 a.get('pilotNoticeAck').checked=true;await a.submit();
 assert.equal(a.requests.length,1);
 const signup=JSON.parse(a.requests[0][1].body);
 assert.equal(signup.data.username,'test_user');
 assert.equal(signup.data.pilot_data_notice_version,'pilot-data-notice-2026-10-18');
 assert.match(signup.data.pilot_data_notice_acknowledged_at,/^20\d{2}-\d{2}-\d{2}T/);
 assert.equal(Object.hasOwn(signup.data,'marketing_consent'),false);
 assert.equal(a.window.closetAuth.user,null);
 a.get('authMode').onclick();
 assert.equal(a.get('pilotNoticeWrap').hidden,true);
 assert.equal(a.get('pilotNoticeAck').required,false);
 assert.equal(a.get('pilotNoticeAck').disabled,true);
 assert.equal(a.get('pilotNoticeAck').checked,false);
});
test('pilot notice metadata rejects false acknowledgement and invalid times',()=>{
 const notice=require('../public/pilot-notice.js');
 assert.equal(notice.isAcknowledged('true'),false);
 assert.throws(()=>notice.signupMetadata('test_user',false),/Review the pilot data notice/);
 assert.throws(()=>notice.signupMetadata('test_user',true,new Date(NaN)),/Invalid timestamp/);
 assert.equal(notice.signupMetadata('test_user',true,new Date('2026-10-18T00:00:00Z')).pilot_data_notice_acknowledged_at,
  '2026-10-18T00:00:00.000Z');
 const html=fs.readFileSync('public/pilot-data-notice.html','utf8');
 assert.match(html,/previously uploaded private photo objects are/);
 assert.match(html,/Self-service full-account deletion is not yet available/);
 assert.match(html,/not final Terms of Service/);
 assert.match(fs.readFileSync('public/index.html','utf8'),/href="pilot-data-notice.html"/);
});


test('pending refresh cannot resurrect wardrobe after logout begins',async()=>{
 let releaseRefresh,releaseLogout;
 const a=app(url=>{
  if(url.includes('grant_type=password'))
   return Promise.resolve(response({access_token:'old-access',refresh_token:'old-refresh',user:{id:'owner-A'}}));
  if(url.includes('grant_type=refresh_token'))
   return new Promise(resolve=>{releaseRefresh=resolve;});
  if(url.endsWith('/logout'))
   return new Promise(resolve=>{releaseLogout=resolve;});
  throw Error('Unexpected authentication request');
 });
 await a.submit();
 const refreshing=a.window.closetAuth.getAccessToken({force:true});
 const loggingOut=a.get('logout').onclick();
 assert.equal(a.window.closetAuth.user,null,'logout locks the old account synchronously');
 assert.equal(a.get('appShell').hidden,true);
 assert.equal(a.get('authGate').hidden,false);
 assert.equal(a.saved.has('closet-current-auth-v1'),false);
 assert.match(a.get('authStatus').textContent,/Signing out/);
 assert.equal(a.get('authSubmit').disabled,true,'cannot begin a new login during remote logout');
 releaseRefresh(response({access_token:'late-access',refresh_token:'late-refresh',user:{id:'owner-A'}}));
 await assert.rejects(refreshing,/Session account changed/);
 assert.equal(a.window.closetAuth.user,null);
 assert.equal(a.saved.has('closet-current-auth-v1'),false,'late refresh never stores old credentials');
 await assert.rejects(a.window.closetAuth.getAccessToken(),/Sign in required/);
 releaseLogout(response({}));
 await loggingOut;
 assert.equal(a.reloaded(),true);
 assert.equal(a.saved.has('closet-current-auth-v1'),false);
});
test('repeated signout does not send repeated server calls and locks on network error',async()=>{
 const a=app(async url=>{
  if(url.includes('grant_type=password'))
   return response({access_token:'old-access',refresh_token:'old-refresh',user:{id:'owner-A'}});
  if(url.endsWith('/logout'))throw new TypeError('offline');
  throw Error('Unexpected authentication request');
 });
 await a.submit();
 const first=a.get('logout').onclick(),second=a.get('logout').onclick();
 await Promise.all([first,second]);
 assert.equal(a.requests.filter(([url])=>url.endsWith('/logout')).length,1);
 assert.equal(a.window.closetAuth.user,null);
 assert.equal(a.saved.has('closet-current-auth-v1'),false);
 assert.equal(a.reloaded(),true);
});
test('normal refresh rotates credentials once and preserves original account',async()=>{
 let requests=0;
 const a=app(async url=>{
  if(url.includes('grant_type=password'))
   return response({access_token:'original',refresh_token:'original-refresh',user:{id:'owner-A'}});
  if(url.includes('grant_type=refresh_token')){
   requests++;
   return response({access_token:'rotated',refresh_token:'rotated-refresh',user:{id:'owner-A'}});
  }
  throw Error('Unexpected authentication request');
 });
 await a.submit();
 const tokens=await Promise.all([
  a.window.closetAuth.getAccessToken({force:true}),
  a.window.closetAuth.getAccessToken({force:true})
 ]);
 assert.equal(requests,1);
 assert.deepEqual(tokens,['rotated','rotated']);
 assert.equal(a.window.closetAuth.user.id,'owner-A');
 assert.equal(JSON.parse(a.saved.get('closet-current-auth-v1')).refresh_token,'rotated-refresh');
});


test('custom signup email token hash verifies through Supabase before unlocking wardrobe',async()=>{
 const a=app(async(url,options)=>{
  if(url.endsWith('/auth/v1/verify')){
   assert.equal(options.method,'POST');
   assert.deepEqual(JSON.parse(options.body),{token_hash:'abc12345deadbeef',type:'signup'});
   return response({access_token:'verified',refresh_token:'rotated',user:{id:'owner-otp'}});
  }
  if(url.endsWith('/auth/v1/user')){
   assert.equal(options.method,'GET');
   assert.equal(options.headers.Authorization,'Bearer verified');
   return response({id:'owner-otp',email:'owner@example.invalid'});
  }
  throw Error('Unexpected Auth endpoint');
 },{search:'?token_hash=abc12345deadbeef&type=signup'});
 await new Promise(setImmediate);
 assert.equal(a.requests.length,2);
 assert.equal(a.window.closetAuth.user?.id,'owner-otp');
 assert.equal(a.get('appShell').hidden,false);
 assert.equal(a.sanitized()?.[2],'/Closet-Current/','one-time hash removed from history before network access');
});
test('direct recovery token hash requires password change and same verified account',async()=>{
 const a=app(async(url,options)=>{
  if(url.endsWith('/verify'))return response({
   access_token:'valid-recovery',refresh_token:'valid-refresh',user:{id:'recovery-owner',email:'owner@example.invalid'}
  });
  if(url.endsWith('/user')&&options.method==='GET')return response({id:'recovery-owner',email:'owner@example.invalid'});
  if(url.endsWith('/user')&&options.method==='PUT'){
   assert.equal(JSON.parse(options.body).password,'new-secret-password');
   return response({id:'recovery-owner',email:'owner@example.invalid'});
  }
  throw Error('Unexpected Auth endpoint');
 },{search:'?type=recovery&token_hash=recoveryhash123'});
 await new Promise(setImmediate);
 assert.equal(a.window.closetAuth.user,null,'recovery link alone cannot expose the closet');
 assert.equal(a.get('appShell').hidden,true);
 assert.match(a.get('authSubmit').textContent,/Save new password/);
 assert.equal(a.sanitized()?.[2],'/Closet-Current/');
 a.get('authPassword').value='new-secret-password';
 await a.submit();
 assert.equal(a.requests.length,3);
 assert.equal(a.window.closetAuth.user.id,'recovery-owner');
});
test('malformed hash or unknown email link type never reaches verification API',async()=>{
 for(const search of [
  '?token_hash=short&type=signup',
  '?token_hash=abc12345deadbeef&type=garbage',
  '?token_hash=abc12345deadbeef',
  '?token_hash=abc12345deadbeef&type=signup&code=conflict'
 ]){
  const a=app(async()=>{throw Error('Must not make a request');},{search});
  await new Promise(setImmediate);
  assert.equal(a.requests.length,0,search);
  assert.equal(a.window.closetAuth.user,null);
  assert.equal(a.get('appShell').hidden,true);
  assert.match(a.get('authStatus').textContent,/could not be verified/);
  assert.equal(a.sanitized()?.[2],'/Closet-Current/');
 }
});
test('mismatched verified user and missing usable session never unlock email link',async()=>{
 for(const verifyResponse of [
  {access_token:'verified',refresh_token:'refresh',user:{id:'first'}},
  {access_token:'verified',user:{id:'first'}},
  {access_token:'',refresh_token:'refresh',user:{id:'first'}}
 ]){
  const a=app(async(url)=>{
   if(url.endsWith('/verify'))return response(verifyResponse);
   if(url.endsWith('/user'))return response({id:'another-owner'});
   throw Error('Unexpected Auth endpoint');
  },{search:'?token_hash=abc12345deadbeef&type=email'});
  await new Promise(setImmediate);
  assert.equal(a.window.closetAuth.user,null);
  assert.equal(a.saved.has('closet-current-auth-v1'),false);
  assert.equal(a.get('appShell').hidden,true);
  assert.match(a.get('authStatus').textContent,/could not be verified/);
 }
});
test('expired or rejected one-time email hash does not expose another account',async()=>{
 const a=app(async()=>response({error_code:'otp_expired',msg:'expired'},false),
  {search:'?token_hash=abc12345deadbeef&type=signup'});
 await new Promise(setImmediate);
 assert.equal(a.requests.length,1,'no automatic resend or repeated use of expired hash');
 assert.equal(a.window.closetAuth.user,null);
 assert.equal(a.get('authSubmit').disabled,false);
 assert.equal(a.get('appShell').hidden,true);
 assert.equal(a.sanitized()?.[2],'/Closet-Current/');
});
test('PKCE code without matching verifier is rejected with recovery guidance, never exchanged',async()=>{
 const a=app(async()=>{throw Error('Must not exchange code');},{search:'?code=unmatched-one-time-auth-code'});
 await new Promise(setImmediate);
 assert.equal(a.requests.length,0);
 assert.equal(a.window.closetAuth.user,null);
 assert.match(a.get('authStatus').textContent,/unsupported code callback/);
 assert.match(a.get('authStatus').textContent,/Request a fresh/);
 assert.equal(a.sanitized()?.[2],'/Closet-Current/');
});
