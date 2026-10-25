// Characterization of an OPEN blocker, not a release acceptance test.
// Executes actual staging-transformed Auth source with synthetic responses only.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {stageAuthSource,STAGE_BASE} from '../scripts/build-family-alpha-staging-auth-hold.mjs';
const source=stageAuthSource(await readFile('public/auth.js','utf8'));
test('OPEN BLOCKER: refresh rejection retains local identity and visible shell',async()=>{
 const elements=new Map(),saved=new Map(),requests=[],events={};
 const ids=['authStatus','authForm','authSubmit','authMode','authReset','authResend','authEmail','authPassword','authPasswordToggle','authUsername','usernameWrap','authGate','appShell','accountLabel','logout'];
 for(const id of ids)elements.set(id,{value:'synthetic',hidden:false,setAttribute(){},addEventListener(){},checkValidity(){return true;}});
 const window={__CLOSET_ALPHA_STAGE_AUTH__:{ready:true,base:STAGE_BASE,key:'sb_publishable_SYNTHETIC_ONLY',redirect:'https://audit.example.invalid/',releaseGate:'HOLD'},addEventListener:(name,fn)=>{events[name]=fn;}};
 vm.runInNewContext(source,{
 window,document:{getElementById:id=>elements.get(id)},
 location:{origin:'https://audit.example.invalid',protocol:'https:',pathname:'/',reload(){}},
 history:{replaceState(){}},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
 URLSearchParams,AbortController,TypeError,setTimeout,clearTimeout,
 fetch:async(url)=>{requests.push(url);return {ok:requests.length===1,json:async()=>requests.length===1?
 {access_token:'SYNTHETIC_ACCESS',refresh_token:'SYNTHETIC_REFRESH',user:{id:'SYNTHETIC_OWNER'},expires_in:3600}:
 {msg:'Refresh token revoked',error_code:'refresh_token_not_found'}};}
 });
 await elements.get('authForm').onsubmit({preventDefault(){}});
 const generation=window.closetAuth.getSessionGeneration();
 await assert.rejects(window.closetAuth.getAccessToken({force:true}),/Refresh token revoked/);
 assert.equal(window.closetAuth.user.id,'SYNTHETIC_OWNER');
 assert.equal(window.closetAuth.getSessionGeneration(),generation);
 assert.equal(elements.get('appShell').hidden,false);
 assert.equal(saved.has('closet-alpha-staging-auth-v1'),true);
 assert.equal(events.storage,undefined,'no cross-tab sign-out listener in this Auth module');
 assert.ok(requests.every(url=>url.startsWith(STAGE_BASE+'/auth/v1/')));
});
