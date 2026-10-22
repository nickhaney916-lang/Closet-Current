'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
let source;
const os=require('node:os'),{spawnSync}=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cc-182-'));
test.before(()=>{
 for(const dir of ['public','scripts'])fs.cpSync(path.join(__dirname,'..',dir),path.join(root,dir),{recursive:true});
 const r=spawnSync(process.execPath,['scripts/build-connected-staging-candidate.mjs'],{cwd:root,encoding:'utf8',env:{...process.env,CLOSET_STAGING_APP_ORIGIN:'https://pilot-access-check.closet-current-staging.pages.dev/',CLOSET_STAGING_SUPABASE_URL:'https://fbnplztkbsteuzrmbgib.supabase.co',CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_SYNTHETIC_OFFLINE_ISSUE182'}});
 assert.equal(r.status,0,r.stderr);source=fs.readFileSync(path.join(root,'staging-dist/auth.js'),'utf8');
});
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
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

const tick=()=>new Promise(resolve=>setImmediate(resolve));
const preview='https://pilot-access-check.closet-current-staging.pages.dev/';
test('Cloudflare Access navigation alone does not authenticate app or send credentials',async()=>{
 const a=app(undefined,{origin:new URL(preview).origin,pathname:'/'});await tick();
 assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('appShell').hidden,true);assert.equal(a.requests.length,0);
});
test('built signup, resend and recovery target exact isolated staging callback',async()=>{
 const a=app(async()=>response({}));a.get('authMode').onclick();a.get('pilotNoticeAck').checked=true;await a.submit();
 await a.get('authResend').onclick();await a.get('authReset').onclick();
 assert.equal(a.requests.length,3);
 for(const [url,options] of a.requests){const u=new URL(url);assert.equal(u.origin,'https://fbnplztkbsteuzrmbgib.supabase.co');assert.equal(u.searchParams.get('redirect_to'),preview);assert.equal(options.headers.apikey,'sb_publishable_SYNTHETIC_OFFLINE_ISSUE182');}
 assert.deepEqual(a.requests.map(([url])=>new URL(url).pathname),['/auth/v1/signup','/auth/v1/resend','/auth/v1/recover']);
 assert.equal(a.get('appShell').hidden,true);
});
test('staging implicit callback verifies identity before granting wardrobe access',async()=>{
 const a=app(async()=>response({id:'synthetic-a'}),{pathname:'/',hash:'#access_token=synthetic-token&refresh_token=synthetic-refresh&type=signup'});await tick();
 assert.equal(a.window.closetAuth.user.id,'synthetic-a');assert.equal(a.requests.length,1);
 assert.equal(a.requests[0][0],'https://fbnplztkbsteuzrmbgib.supabase.co/auth/v1/user');assert.deepEqual(Array.from(a.sanitized()),[null,'','/']);
});
test('Cloudflare-like code callback cannot become an app session',async()=>{
 const a=app(undefined,{pathname:'/',search:'?code=synthetic-access-code'});await tick();
 assert.equal(a.window.closetAuth.user,null);assert.equal(a.requests.length,0);assert.equal(a.get('appShell').hidden,true);assert.match(a.get('authStatus').textContent,/unsupported code callback/);
});
test('staging token hash recovery keeps wardrobe locked until password update',async()=>{
 const a=app(async url=>response(url.endsWith('/verify')?{access_token:'synthetic-token',refresh_token:'synthetic-refresh',user:{id:'synthetic-a'}}:{id:'synthetic-a'}),{pathname:'/',search:'?token_hash=synthetic_hash_182&type=recovery'});await tick();
 assert.equal(a.requests.length,2);assert.equal(a.window.closetAuth.user,null);assert.equal(a.get('appShell').hidden,true);assert.equal(a.get('authSubmit').textContent,'Save new password');
 for(const [url] of a.requests)assert.equal(new URL(url).origin,'https://fbnplztkbsteuzrmbgib.supabase.co');
});
