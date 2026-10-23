// Execute the real generated staging Auth script against offline fake GoTrue.
// No hosted fetches, signups, emails or customer records are made.
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const base='staging-dist/';
const proof=JSON.parse(readFileSync(base+'staging-preflight.json','utf8'));
const source=readFileSync(base+'auth.js','utf8');
const appOrigin='https://pilot-access-check.closet-current-staging.pages.dev/';
const backend='https://abcdefghijklmnopqrst.supabase.co';
assert.equal(proof.stagingOrigin,appOrigin);
assert.equal(proof.backendProjectRef,'abcdefghijklmnopqrst');
assert.ok(source.includes("const APP_URL='"+appOrigin+"'"));
assert.ok(source.includes("const URL='"+backend+"'"));
for(const dangerous of ['hlkgymugtfbirlpunsra','qlwotqbqxpgkheitsboe','nickhaney916-lang.github.io','closet-current.pages.dev'])
 assert.ok(!source.includes(dangerous),'Staging Auth contains unsafe production route: '+dangerous);
function prepare({hash='',search=''}={}){
 const elements=new Map(),requests=[],timers=new Map(),stored=new Map(),expectedEmail='synthetic@example.invalid';
 let timer=0,networkViolations=0;
 const ids=['authStatus','authForm','authSubmit','authMode','authReset','authResend','authRetry','authEmail',
 'authPassword','authPasswordToggle','authUsername','usernameWrap','pilotNoticeWrap','pilotNoticeAck',
 'authGate','appShell','accountLabel','logout','authHelp'];
 for(const id of ids)elements.set(id,{
  id,hidden:false,disabled:false,required:false,value:'',checked:false,textContent:'',
  type:id==='authPassword'?'password':'text',minLength:1,validity:{valid:true},
  setAttribute(){},addEventListener(){},checkValidity(){return true}
 });
 elements.get('appShell').hidden=true;elements.get('authEmail').value=expectedEmail;
 elements.get('authPassword').value='a-safe-synthetic-password';elements.get('authUsername').value='synthetic_owner';
 const location={origin:appOrigin.slice(0,-1),hash,search,pathname:'/',href:appOrigin,reload(){throw Error('No navigation allowed in offline Auth QA')}};
 const window={ClosetPilotNotice:{signupMetadata:(name,consented)=>({username:name,consent:consented})}};
 const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
 const fetch=async(url,options={})=>{
  if(!url.startsWith(backend+'/auth/v1/')){networkViolations++;throw Error('Unexpected backend '+url);}
  const parsed=new URL(url),pathname=parsed.pathname,method=options.method;
  requests.push({url,method,body:options.body?JSON.parse(options.body):null});
  if(pathname==='/auth/v1/signup')return response({user:{id:'pending-only'}});
  if(pathname==='/auth/v1/recover'||pathname==='/auth/v1/resend')return response({});
  if(pathname==='/auth/v1/user'&&method==='GET')return response({id:'verified-fake-user',email:expectedEmail});
  if(pathname==='/auth/v1/token')return response({access_token:'fake',refresh_token:'fake-refresh',user:{id:'verified-fake-user',email:expectedEmail}});
  throw Error('Unexpected GoTrue API endpoint '+pathname);
 };
 runInNewContext(source,{window,document:{getElementById:id=>elements.get(id)},location,history:{replaceState(){}},
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,val)=>stored.set(key,val),removeItem:key=>stored.delete(key)},
  fetch,AbortController,URLSearchParams,TypeError,setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:key=>timers.delete(key)});
 return {window,requests,elements,networkViolations:()=>networkViolations,submit:()=>elements.get('authForm').onsubmit({preventDefault(){}})};
}
const app=prepare();
app.elements.get('authMode').onclick();
app.elements.get('pilotNoticeAck').checked=true;
await app.submit();
app.elements.get('authMode').onclick();
await app.elements.get('authReset').onclick();
await app.elements.get('authResend').onclick();
assert.equal(app.requests.length,3);
assert.deepEqual(app.requests.map(req=>new URL(req.url).pathname),['/auth/v1/signup','/auth/v1/recover','/auth/v1/resend']);
for(const req of app.requests){
 const url=new URL(req.url),redirect=url.searchParams.get('redirect_to');
 assert.equal(url.origin,backend);
 assert.equal(redirect,appOrigin,'Email action must return only to authorized staging preview origin');
 assert.ok(!redirect.includes('github.io'),'No cross-origin staging email links');
}
assert.equal(app.window.closetAuth.user,null,'Confirmation pending is not a signed-in session');
assert.equal(app.networkViolations(),0);
const callback=prepare({hash:'#access_token=synthetic-verified&refresh_token=synthetic-refresh&type=signup'});
await new Promise(resolve=>setImmediate(resolve));
assert.deepEqual(callback.requests.map(r=>new URL(r.url).pathname),['/auth/v1/user']);
assert.equal(callback.window.closetAuth.user?.id,'verified-fake-user');
assert.equal(callback.networkViolations(),0);
const invalid=prepare({hash:'#error=access_denied&error_code=otp_expired'});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(invalid.requests.length,0);
assert.equal(invalid.window.closetAuth.user,null);
assert.match(invalid.elements.get('authStatus').textContent,/expired/);
console.log('OFFLINE_STAGING_EMAIL_CALLBACKS_PASS '+JSON.stringify({
 originalAppSourceUnchanged:true,actualGeneratedStagingAuth:true,
 backendProject:proof.backendProjectRef,redirectOrigin:appOrigin,
 emailActions:['signup','recover','resend'],pendingConfirmationLocked:true,
 verifiedCallbackRequiresUserLookup:true,expiredCallbackLocked:true,
 outboundNetworkRequests:0,productionBackendUsed:false,hostedEmailProviderTested:false,
 actualCloudflareAccessTested:false,physicalPhoneTested:false
}));
