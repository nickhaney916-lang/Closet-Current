'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/pwa.js'),'utf8');
function setup(src,standalone=false){
 const listeners={},button={textContent:'Add to phone',hidden:false,disabled:false},help={hidden:true};
 vm.runInNewContext(src,{window:{addEventListener:(name,fn)=>listeners[name]=fn,matchMedia:()=>({matches:standalone})},
  document:{getElementById:id=>id==='installApp'?button:help},navigator:{},location:{hostname:'localhost'}});
 return {button,help,listeners};
}
test('mobile installation errors, dismissal and overlapping events recover without stale prompts',async()=>{
 for(const scenario of ['prompt-reject','choice-reject','dismissed','pending-double-click','installed-before-rejection','accepted']){
  const x=setup(source);
  let resolve,reject,prevented=false,calls=0;
  const pending=new Promise((a,b)=>{resolve=a;reject=b;});
  const event={preventDefault(){prevented=true;},prompt(){
   calls++;
   if(scenario==='prompt-reject')return Promise.reject(Error('expired'));
   if(scenario==='pending-double-click'||scenario==='installed-before-rejection')return pending;
   return Promise.resolve();
  },get userChoice(){return scenario==='choice-reject'?Promise.reject(Error('unavailable')):
    Promise.resolve({outcome:scenario==='accepted'?'accepted':'dismissed'});}};
  x.listeners.beforeinstallprompt(event);
  assert.equal(prevented,true);
  const action=x.button.onclick();
  if(scenario==='pending-double-click'){
   await x.button.onclick();
   assert.equal(x.help.hidden,true);
   assert.equal(x.button.disabled,true);
   resolve();
  }
  if(scenario==='installed-before-rejection'){
   x.listeners.appinstalled();
   reject(Error('expired'));
  }
  await action;
  assert.equal(calls,1);
  assert.equal(x.button.disabled,false);
  assert.equal(x.help.hidden,scenario==='installed-before-rejection'||scenario==='accepted');
  assert.equal(x.button.hidden,scenario==='installed-before-rejection');
  if(!x.button.hidden)assert.equal(x.button.textContent,'Add to phone');
 }
 const manual=setup(source);
 await manual.button.onclick();
 assert.equal(manual.help.hidden,false);
 await manual.button.onclick();
 assert.equal(manual.help.hidden,true);
 const installed=setup(source,true);
 await installed.button.onclick();
 assert.equal(installed.button.hidden,true);
 assert.equal(installed.help.hidden,true);
});
