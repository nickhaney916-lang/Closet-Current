import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const authSource=readFileSync('public/auth.js','utf8');
const cloudSource=readFileSync('public/cloud-backup.js','utf8');
const avatarSource=readFileSync('public/family-alpha-preview-controller.mjs','utf8');
const A='a1111111-1111-4111-8111-111111111111';
function authFixture(){
 const elements=new Map(),listeners=new Map(),storage=new Map(),events=[];
 let logoutFinish,logoutStarted=false,reloads=0,invalidated=0,avatarImages=0;
 const ids=['authStatus','authForm','authSubmit','authMode','authReset','authResend',
  'authEmail','authPassword','authPasswordToggle','authUsername','usernameWrap',
  'authGate','appShell','accountLabel','logout'];
 for(const id of ids)elements.set(id,{
  id,hidden:id==='authGate',value:'',textContent:'',disabled:false,required:false,
  setAttribute(){},addEventListener(){},checkValidity(){return true;}
 });
 elements.get('authEmail').value='fixture@example.invalid';
 elements.get('authPassword').value='fictional-testing-password';
 const window={
  Event:class Event{constructor(type){this.type=type;}},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
  dispatchEvent(event){events.push(event.type);
   if(event.type==='closet:alpha-session-changed')avatarImages=0;
   for(const callback of listeners.get(event.type)||[])callback(event);
  },
  closetCloud:{invalidateSession(){invalidated++;}}
 };
 const fetch=async url=>{
  if(url.includes('/logout')){
   logoutStarted=true;
   return new Promise(resolve=>{logoutFinish=()=>resolve({ok:true,json:async()=>({})});});
  }
  return {ok:true,json:async()=>({
   user:{id:A,email:'fixture@example.invalid'},access_token:'synthetic-access',
   refresh_token:'synthetic-refresh',expires_in:3600
  })};
 };
 vm.runInNewContext(authSource,{
  window,document:{getElementById:id=>elements.get(id)},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null,
   removeItem:k=>storage.delete(k)},
  location:{hash:'',search:'',pathname:'/Closet-Current/',reload(){reloads++;}},
  history:{replaceState(){}},URLSearchParams,fetch,Date,AbortController,
  Promise,TypeError,setTimeout,clearTimeout
 });
 return {elements,storage,window,events,
  setAvatar(n){avatarImages=n;},getAvatar:()=>avatarImages,
  login:()=>elements.get('authForm').onsubmit({preventDefault(){}}),
  logout:()=>elements.get('logout').onclick(),
  get invalidated(){return invalidated;},
  get logoutStarted(){return logoutStarted;},
  resolveLogout:()=>logoutFinish?.(),
  get reloads(){return reloads;}
 };
}
test('integrated four-account logout instantly hides private app, clears avatar and revokes cloud restore gate before network',async()=>{
 const f=authFixture();
 await f.login();
 assert.equal(f.window.closetAuth.user.id,A);
 const currentEpoch=f.window.closetAuth.getSessionGeneration();
 f.setAvatar(3);
 const ending=f.logout();
 assert.equal(f.window.closetAuth.user,null);
 assert.ok(f.window.closetAuth.getSessionGeneration()>currentEpoch);
 assert.equal(f.getAvatar(),0,'avatar must not retain outgoing account clothing');
 assert.equal(f.elements.get('appShell').hidden,true,'private app should be hidden');
 assert.equal(f.elements.get('authGate').hidden,false,'private gate returns immediately');
 assert.equal(f.invalidated,1,'invalidateSession must stop cloud restore');
 assert.ok(f.events.includes('closet:alpha-session-changed'));
 assert.equal(f.storage.has('closet-current-auth-v1'),false);
 assert.equal(f.logoutStarted,true);
 assert.equal(f.reloads,0,'network revoke should remain asynchronous');
 await assert.rejects(f.window.closetAuth.getAccessToken(),/Sign in required/);
 f.resolveLogout();await ending;
 assert.equal(f.reloads,1);
});
test('integrated stale restore policy is required in the actual client and must cancel pending owner-race writes',()=>{
 assert.match(cloudSource,/const current=gate=>enabled&&db===gate\.db&&user===gate\.user&&generation===gate\.generation/);
 assert.match(cloudSource,/window\.closetAuth\?\.getSessionGeneration\?\.\(\)\?\?null/);
 assert.match(cloudSource,/if\(!current\(gate\)\)\{tx\.abort\(\);return;\}/);
 assert.match(cloudSource,/r\.owner_id!==gate\.user/);
 assert.match(cloudSource,/invalidateSession\(\)\{generation\+\+;enabled=false;clearTimeout\(timer\);\}/);
 assert.match(authSource,/window\.closetCloud\?\.invalidateSession\?\.\(\)/);
 assert.match(avatarSource,/addEventListener\('closet:alpha-session-changed',sessionChange\)/);
});
