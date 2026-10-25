import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {stageAuthSource,stageIndexSource,STAGE_BASE,PROD_BASE} from '../scripts/build-family-alpha-staging-auth-hold.mjs';
import {removePublicStageSignup} from '../scripts/family-alpha-stage-invite-only-ui.mjs';
const original=await readFile('public/auth.js','utf8');
const staged=stageAuthSource(original);
const ids=['authStatus','authForm','authSubmit','authMode','authReset',
 'authResend','authEmail','authPassword','authPasswordToggle',
 'authUsername','usernameWrap','authGate','appShell','accountLabel','logout'];
function fixture(){
 const fields=new Map(ids.map(id=>[id,{
  hidden:false,value:'fake-value',type:id==='authPassword'?'password':'text',
  setAttribute(){},addEventListener(){},checkValidity(){return true;},disabled:false
 }]));
 fields.get('authEmail').value='synthetic@example.invalid';
 fields.get('authPassword').value='synthetic-password';
 const events=new Map(),storage=new Map(),calls=[];
 const window={
  __CLOSET_ALPHA_STAGE_AUTH__:{
   ready:true,base:STAGE_BASE,key:'sb_publishable_SYNTHETIC_BROWSER_TEST',
   redirect:'https://closet-current-staging.pages.dev/',releaseGate:'HOLD'
  },
  addEventListener:(name,fn)=>events.set(name,fn),
  Event:function Event(name){this.type=name;},
  dispatchEvent(){}
 };
 const fetch=async url=>{
  calls.push(url);
  if(url.includes('/signup'))throw Error('Forbidden staging signup request');
  if(url.includes('grant_type=password'))return {
   ok:true,status:200,json:async()=>({
    access_token:'FAKE_ACCESS',refresh_token:'FAKE_REFRESH',
    expires_in:3600,user:{id:'synthetic-owner',email:'synthetic@example.invalid'}
   })
  };
  throw Error('Unexpected synthetic Auth call');
 };
 const location={
  origin:'https://closet-current-staging.pages.dev',protocol:'https:',pathname:'/',
  hash:'',search:'',reload(){}
 };
 vm.runInNewContext(staged,{
  window,document:{getElementById:id=>fields.get(id)},
  location,history:{replaceState(){}},fetch,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  URLSearchParams,AbortController,TypeError,setTimeout,clearTimeout
 });
 return {window,fields,calls,storage,events};
}
test('only stage-routed hardened Auth may receive the invite-only UI, and transformation is not repeated',()=>{
 assert.match(staged,/const URL=stage\.base/);
 assert.match(staged,/stageTerminalRefreshError/);
 assert.match(staged,/Closet Current Family Alpha is invitation-only/);
 assert.match(staged,/private invitation/);
 assert.doesNotMatch(staged,/request\('signup'\+EMAIL_REDIRECT/);
 assert.doesNotMatch(staged,/https:\/\/hlkgymugtfbirlpunsra\.supabase\.co/);
 assert.match(original,/request\('signup'\+EMAIL_REDIRECT/,'normal production login source unchanged');
 assert.throws(()=>removePublicStageSignup(original),/Only hardened staging-only Auth/);
 assert.throws(()=>removePublicStageSignup(staged),/Staging Auth signup surface changed/);
});
test('staging default is login-only, hides registration controls and keeps username optional',()=>{
 const f=fixture();
 assert.equal(f.fields.get('authMode').hidden,true);
 assert.equal(f.fields.get('usernameWrap').hidden,true);
 assert.equal(f.fields.get('authUsername').required,false);
 assert.match(f.fields.get('authStatus').textContent,/invitation-only/);
 assert.equal(f.fields.get('authSubmit').textContent,'Log in');
 assert.equal(f.calls.length,0,'client does not call Auth until interaction');
});
test('scripted attempted signup switch cannot issue a signup request',async()=>{
 const f=fixture();
 f.fields.get('authMode').onclick(); // hidden control, even fake scripted activation should not enable signup
 assert.equal(f.fields.get('usernameWrap').hidden,true);
 assert.equal(f.fields.get('authUsername').required,false);
 assert.equal(f.fields.get('authMode').hidden,true);
 await f.fields.get('authForm').onsubmit({preventDefault(){}});
 assert.ok(f.calls.length>0);
 assert.ok(f.calls.every(url=>url.startsWith(STAGE_BASE+'/auth/v1/token?grant_type=password')));
 assert.equal(f.window.closetAuth.user?.id,'synthetic-owner');
 assert.equal(f.fields.get('appShell').hidden,false);
});
test('staging login/password reset still has no production routing, no accidental public-signup URL',async()=>{
 const f=fixture();
 await f.fields.get('authForm').onsubmit({preventDefault(){}});
 assert.equal(f.calls.some(url=>url.includes('/signup')),false);
 assert.equal(f.calls.some(url=>url.startsWith(PROD_BASE)),false);
 assert.equal(f.storage.has('closet-current-auth-v1'),false);
 assert.equal(f.storage.has('closet-alpha-staging-auth-v1'),true);
});

test('staging HTML hides registration before Auth JS has even initialized',async()=>{
 const html=await readFile('public/index.html','utf8');
 const stagedHtml=stageIndexSource(html);
 assert.match(stagedHtml,/id="authMode" type="button" hidden>\s*Create an account/);
 assert.doesNotMatch(html,/id="authMode" type="button" hidden/);
 assert.equal(stagedHtml.indexOf('alpha-stage-config.js')<stagedHtml.indexOf('auth.js'),true);
 assert.throws(()=>stageIndexSource(stagedHtml),/Cannot safely inject|expected exactly one original/);
});
