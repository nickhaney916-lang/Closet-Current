'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

const source=fs.readFileSync('public/app.js','utf8');
const match=source.match(/window\.addEventListener\('beforeunload',e=>\{[\s\S]*?\}\);/);
assert.ok(match,'the production app must retain its unfinished-photo unload guard');

function simulateUnload({draft=false,busy=false,signingOut=false,authPresent=true}={}){
 let handler;
 const window={addEventListener:(name,callback)=>{if(name==='beforeunload')handler=callback;}};
 if(authPresent)window.closetAuth={isSigningOut:()=>signingOut};
 vm.runInNewContext(match[0],{window,batch:draft?[{id:'unfinished'}]:[],busy});
 let prevented=false;
 const event={preventDefault(){prevented=true;},returnValue:undefined};
 handler(event);
 return {prevented,returnValue:event.returnValue};
}

test('normal page exit retains the warning for an unfinished photo',()=>{
 assert.equal(simulateUnload({draft:true}).prevented,true);
 assert.equal(simulateUnload({draft:true,authPresent:false}).returnValue,'');
});
test('normal page exit retains the warning during active photo processing',()=>{
 assert.equal(simulateUnload({busy:true}).prevented,true);
});
test('an intentional signout does not prompt even if a photo is unfinished',()=>{
 for(const [draft,busy] of [[true,false],[false,true],[true,true]])
  assert.deepEqual(simulateUnload({draft,busy,signingOut:true}),{prevented:false,returnValue:undefined});
});
test('a clean page exit does not prompt',()=>{
 assert.equal(simulateUnload().prevented,false);
});
