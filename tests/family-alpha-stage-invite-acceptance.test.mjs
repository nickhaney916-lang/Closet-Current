import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {stageAuthSource,STAGE_BASE,PROD_BASE} from '../scripts/build-family-alpha-staging-auth-hold.mjs';
import {addStageInvitePasswordSetup} from '../scripts/family-alpha-stage-invite-acceptance.mjs';
const source=await readFile('public/auth.js','utf8');
const stage=stageAuthSource(source);
const STORE='closet-alpha-staging-auth-v1';
const fakeUser=id=>({id,email:'family-test@example.invalid',user_metadata:{}});
function harness({type='invite',getUserId='synthetic-invite-owner',putUserId=getUserId,
 failUpdate=null,delayVerification=null}={}){
 const ids=['authStatus','authForm','authSubmit','authMode','authReset',
  'authResend','authEmail','authPassword','authPasswordToggle',
  'authUsername','usernameWrap','authGate','appShell','accountLabel','logout'];
 const el=new Map(ids.map(id=>[id,{
  hidden:false,disabled:false,required:false,value:'',
  type:id==='authPassword'?'password':'text',
  textContent:'',setAttribute(){},addEventListener(){},checkValidity(){return true;}
 }]));
 el.get('authEmail').value='family-test@example.invalid';
 el.get('authPassword').value='new-password-12345';
 el.get('authGate').hidden=false;
 el.get('appShell').hidden=true;
 const calls=[],storage=new Map(),events=new Map();
 let replaced=0,reloads=0;
 const location={
  hash:'#access_token=SYNTHETIC_INVITE_TOKEN&refresh_token=SYNTHETIC_REFRESH&expires_in=1800&type='+type,
  search:'',pathname:'/',origin:'https://closet-current-staging.pages.dev',
  protocol:'https:',reload(){reloads++;}
 };
 const fetch=async(url,options)=>{
  calls.push({url,method:options?.method||'POST',auth:options?.headers?.Authorization,body:options?.body});
  if(url===STAGE_BASE+'/auth/v1/user'&&options?.method==='GET'){
   if(delayVerification)await delayVerification;
   return {ok:true,status:200,json:async()=>fakeUser(getUserId)};
  }
  if(url===STAGE_BASE+'/auth/v1/user'&&options?.method==='PUT'){
   if(failUpdate)return {ok:false,status:failUpdate.status||401,json:async()=>({
    error_code:failUpdate.code||'session_expired',msg:'Invitation link expired'
   })};
   return {ok:true,status:200,json:async()=>fakeUser(putUserId)};
  }
  throw Error('Unexpected external Auth endpoint '+url);
 };
 const window={
  __CLOSET_ALPHA_STAGE_AUTH__:{
   base:STAGE_BASE,key:'sb_publishable_SYNTHETIC_ONLY',
   ready:true,redirect:location.origin+'/',releaseGate:'HOLD'
  },
  addEventListener:(name,fn)=>events.set(name,fn),
  Event:function Event(type){this.type=type;},
  dispatchEvent(){}
 };
 vm.runInNewContext(stage,{
  window,location,history:{replaceState(){replaced++;}},
  document:{getElementById:id=>el.get(id)},fetch,
  localStorage:{
   getItem:k=>storage.get(k)||null,
   setItem:(k,v)=>storage.set(k,v),
   removeItem:k=>storage.delete(k)
  },
  URLSearchParams,AbortController,TypeError,setTimeout,clearTimeout
 });
 return{
  window,el,calls,storage,events,
  get replaced(){return replaced;},
  get reloads(){return reloads;},
  async settle(){await new Promise(r=>setImmediate(r));},
  async submit(){await el.get('authForm').onsubmit({preventDefault(){}});}
 };
}
test('new invitation step is added only to isolated staged Auth, leaving original production code unchanged',()=>{
 assert.match(stage,/if\(linkType==='recovery'\|\|linkType==='invite'\)/);
 assert.match(stage,/Accept your Closet Current Family Alpha invitation/);
 assert.match(stage,/Session changed during email verification/);
 assert.match(source,/if\(callback\.get\('type'\)==='recovery'\)/);
 assert.doesNotMatch(source,/Family Alpha invitation: choose a password/);
 assert.doesNotMatch(stage,/https:\/\/hlkgymugtfbirlpunsra\.supabase\.co/);
 assert.doesNotMatch(stage,/request\('signup'\+EMAIL_REDIRECT/);
 assert.throws(()=>addStageInvitePasswordSetup(source),/Only isolated invitation-only staging Auth/);
 assert.throws(()=>addStageInvitePasswordSetup(stage),/source changed: fail closed/);
});
test('verified invitation does NOT unlock closet before password setup; URL tokens cleared',async()=>{
 const h=harness();await h.settle();
 assert.equal(h.replaced,1);
 assert.equal(h.window.closetAuth.user,null);
 assert.equal(h.el.get('appShell').hidden,true);
 assert.equal(h.el.get('authGate').hidden,false);
 assert.match(h.el.get('authStatus').textContent,/Accept your Closet Current Family Alpha invitation/);
 assert.equal(h.el.get('authSubmit').textContent,'Save new password');
 assert.equal(h.el.get('authEmail').disabled,true);
 assert.equal(h.el.get('authMode').hidden,true);
 assert.equal(h.storage.has(STORE),false);
 assert.deepEqual(h.calls.map(x=>x.method),['GET']);
 await assert.rejects(h.window.closetAuth.getAccessToken(),/Sign in required/);
});
test('invited user chooses a password via verified Supabase user PUT before session and closet unlock',async()=>{
 const h=harness();await h.settle();await h.submit();
 assert.deepEqual(h.calls.map(x=>x.method),['GET','PUT']);
 assert.ok(h.calls.every(x=>x.url.startsWith(STAGE_BASE+'/auth/v1/')));
 assert.equal(h.calls.some(x=>x.url.startsWith(PROD_BASE)||x.url.includes('/signup')),false);
 assert.equal(h.calls[1].auth,'Bearer SYNTHETIC_INVITE_TOKEN');
 assert.equal(JSON.parse(h.calls[1].body).password,'new-password-12345');
 assert.equal(h.window.closetAuth.user?.id,'synthetic-invite-owner');
 assert.equal(h.el.get('appShell').hidden,false);
 assert.equal(h.el.get('authGate').hidden,true);
 assert.equal(h.storage.has(STORE),true);
});
test('failed or mismatched invitation password update does not unlock private photos or save login',async()=>{
 for(const opts of [{failUpdate:{status:401,code:'session_expired'}},{putUserId:'wrong-owner'}]){
  const h=harness(opts);await h.settle();await h.submit();
  assert.equal(h.window.closetAuth.user,null);
  assert.equal(h.el.get('appShell').hidden,true);
  assert.equal(h.storage.has(STORE),false);
  assert.equal(h.calls.some(x=>x.url.includes('/signup')),false);
 }
});
test('recovery link still prompts for password and magic link remains its distinct sign-in flow',async()=>{
 const recovery=harness({type:'recovery'});await recovery.settle();
 assert.equal(recovery.el.get('appShell').hidden,true);
 assert.match(recovery.el.get('authStatus').textContent,/Choose a new password/);
 await recovery.submit();
 assert.equal(recovery.window.closetAuth.user.id,'synthetic-invite-owner');
 const magic=harness({type:'magiclink'});await magic.settle();
 assert.equal(magic.window.closetAuth.user.id,'synthetic-invite-owner');
 assert.equal(magic.el.get('appShell').hidden,false);
 assert.equal(magic.calls.length,1);
});
test('cross-tab session invalidation while invite verification is pending cannot reopen the setup form',async()=>{
 let release;const wait=new Promise(r=>{release=r;});
 const h=harness({delayVerification:wait});
 h.events.get('storage')({key:STORE,oldValue:'synthetic-old',newValue:null});
 release();
 await h.settle();
 assert.equal(h.window.closetAuth.user,null);
 assert.equal(h.el.get('appShell').hidden,true);
 assert.equal(h.storage.has(STORE),false);
 assert.equal(h.calls.length,1);
 assert.doesNotMatch(h.el.get('authStatus').textContent,/Accept your Closet Current Family Alpha invitation/);
});
