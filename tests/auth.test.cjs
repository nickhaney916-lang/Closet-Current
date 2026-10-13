'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/auth.js'),'utf8');
function app(fetchImpl=async()=>{throw new TypeError('network unavailable');}){
 const elements=new Map(),listeners={},timers=new Map(),requests=[];
 for(const id of ['authStatus','authForm','authSubmit','authMode','authReset','authEmail','authPassword','authPasswordToggle','authUsername','usernameWrap','authGate','appShell','accountLabel','logout']){
  elements.set(id,{id,value:'',hidden:false,disabled:false,required:false,textContent:'',setAttribute(){},addEventListener(name,fn){listeners[name]=fn;},checkValidity(){return true;}});
 }
 elements.get('authEmail').value='test@example.invalid';
 elements.get('authPassword').value='test-password-only';
 elements.get('authUsername').value='test_user';
 const saved=new Map(),window={};let timerId=0;
 vm.runInNewContext(source,{window,document:{getElementById:id=>elements.get(id)},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)},location:{reload(){}},AbortController,TypeError,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),fetch:async(...args)=>{requests.push(args);return fetchImpl(...args);}});
 return {get:id=>elements.get(id),listeners,timers,requests,window,submit:()=>elements.get('authForm').onsubmit({preventDefault(){}})};
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
 assert.match(a.requests[0][0],/signup$/);
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
