import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {inspect,LEGACY,CLOUDFLARE} from '../scripts/check-auth-email-cutover.mjs';

const source=await readFile('public/auth.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const element=()=>({hidden:false,disabled:false,value:'',textContent:'',type:'password',
 setAttribute(){},addEventListener(){},checkValidity(){return true}});
function setup(origin,script=source) {
 const names=['authGate','appShell','authStatus','authForm','authMode','authSubmit',
  'authReset','authResend','authRetry','authEmail','authUsername','usernameWrap',
  'authPassword','authPasswordToggle','pilotNoticeWrap','pilotNoticeAck','accountLabel','logout'];
 const map=Object.fromEntries(names.map(id=>[id,element()]));
 map.authEmail.value='example@example.invalid';
 map.authUsername.value='test_user';map.authPassword.value='temporary-password-123';
 map.pilotNoticeAck.checked=true;
 const requested=[],saved=new Map();
 const response=()=>({ok:true,json:async()=>({})});
 const root={
  location:{origin,pathname:origin===CLOUDFLARE.slice(0,-1)?'/':'/Closet-Current/',
   hash:'',search:'',reload(){}},
  document:{getElementById:id=>map[id]},
  window:{ClosetPilotNotice:{signupMetadata:()=>({username:'test_user'})}},
  localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
  history:{replaceState(){}},URLSearchParams,AbortController,TypeError,
  setTimeout:()=>1,clearTimeout(){},
  fetch:async(url,options)=>{requested.push({url,method:options.method});return response();}
 };
 vm.runInNewContext(script,root);
 return {map,requested,signup:async()=>{map.authMode.onclick();await map.authForm.onsubmit({preventDefault(){}});},
 reset:async()=>map.authReset.onclick(),resend:async()=>map.authResend.onclick()};
}
test('source policy preserves approved legacy redirect until administrator sign-off',()=>{
 const report=inspect(source);
 assert.equal(report.target,LEGACY);
 assert.equal(report.crossOriginOnSharedSite,true);
 assert.equal(report.productionReleaseApproved,false);
});
test('unapproved Cloudflare origin cannot silently replace production callback',()=>{
 const candidate=source.replace("const APP_URL='"+LEGACY+"';",
  "const APP_URL='"+CLOUDFLARE+"';");
 assert.throws(()=>inspect(candidate),/cutover blocked/);
 const dryRun=inspect(candidate,{approvedCutover:true});
 assert.equal(dryRun.target,CLOUDFLARE);
 assert.equal(dryRun.productionReleaseApproved,false);
});
test('unsafe callback domains, query strings, HTTP and spoofed paths are denied',()=>{
 for(const destination of [
  'http://closet-current.pages.dev/',
  'https://closet-current.pages.dev/?next=https://attacker.invalid',
  'https://nickhaney916-lang.github.io/Closet-Current/?token=unsafe',
  'https://closet-current.pages.dev.evil.invalid/',
  'https://nickhaney916-lang.github.io/Closet-Current/extra',
  'https://closet-current.pages.dev/#token=secret'
 ]){
  const changed=source.replace("const APP_URL='"+LEGACY+"';","const APP_URL='"+destination+"';");
  assert.throws(()=>inspect(changed),destination);
 }
});
test('signup, reset and resend share a single encoded redirect and warn only on cross-origin Cloudflare',async()=>{
 for(const origin of [CLOUDFLARE.slice(0,-1),new URL(LEGACY).origin]){
  for(const action of ['signup','reset','resend']){
   const a=setup(origin);
   await a[action]();await tick();
   assert.equal(a.requested.length,1,action+' should send one Auth request');
   const url=new URL(a.requested[0].url);
   assert.equal(url.searchParams.get('redirect_to'),LEGACY);
   const message=a.map.authStatus.textContent;
   assert.ok(message.length>0);
   if(origin===CLOUDFLARE.slice(0,-1)){
    assert.match(message,/separate device storage/);
    assert.match(message,/GitHub Pages/);
   }else{
    assert.doesNotMatch(message,/separate device storage/);
   }
  }
 }
});
test('an explicitly staged Cloudflare redirect removes cross-origin warning without approving release',async()=>{
 const swapped=source.replace("const APP_URL='"+LEGACY+"';",
  "const APP_URL='"+CLOUDFLARE+"';");
 const a=setup(CLOUDFLARE.slice(0,-1),swapped);
 await a.reset();await tick();
 assert.equal(new URL(a.requested[0].url).searchParams.get('redirect_to'),CLOUDFLARE);
 assert.doesNotMatch(a.map.authStatus.textContent,/separate device storage/);
 assert.equal(inspect(swapped,{approvedCutover:true}).productionReleaseApproved,false);
});
