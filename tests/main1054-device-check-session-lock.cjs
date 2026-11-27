'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const load=name=>fs.readFileSync(path.join(__dirname,'../public',name),'utf8');
const engine=load('device-check-engine.js'),source=load('device-check.js');
function fixture(){
 let read,downloads=0,scans=0;
 const els=new Map(),listeners={};
 const node=tag=>({tag,textContent:'',hidden:false,disabled:false,children:[],
  setAttribute(){},append(...x){this.children.push(...x);},replaceChildren(){this.children=[];},
  click(){downloads++;}});
 const $=id=>{if(!els.has(id))els.set(id,node('div'));return els.get(id);};
 const store={get(){read={result:{enabled:true,steps:{login:'pass'},events:[{type:'scanner_error'}]}};return read;}};
 const ctx={window:{addEventListener:(name,fn)=>listeners[name]=fn},
  db:{transaction:()=>({objectStore:()=>store})},
  closetReady:Promise.resolve(),$,node,queued:()=>Promise.resolve(),
  navigator:{userAgent:'Android'},recognitionAssetVersion:'123456789abc',Blob:class{},
  URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout:()=>1,clearTimeout(){},
  confirm:()=>true,switchView(){scans++;}};
 const api=new Function(...Object.keys(ctx),engine+'\n'+source+'\nreturn {state:()=>deviceCheckState,initialized:()=>deviceCheckInitialized,record:recordDeviceEvent};')(...Object.values(ctx));
 return {api,$,lock:()=>listeners['closet:session-locked'](),finishRead:()=>read.onsuccess(),
  counts:()=>[downloads,scans]};
}
const flush=async()=>{for(let k=0;k<12;k++)await Promise.resolve();};
test('device QA state and controls cannot survive account lock or a delayed storage response',async()=>{
 for(const when of ['before-read','after-read']){
  const f=fixture();
  await flush();
  if(when==='before-read')f.lock();
  f.finishRead();
  await flush();
  if(when==='after-read'){
   assert.equal(f.api.initialized(),true);
   assert.equal(f.api.state().events.length,1);
   assert.equal(f.api.state().steps.login,'pass');
   f.lock();
  }
  assert.equal(f.api.initialized(),false);
  assert.equal(f.api.state().enabled,false);
  assert.equal(f.api.state().events.length,0);
  assert.deepEqual(Object.keys(f.api.state().steps),[]);
  assert.equal(f.$('deviceCheckSteps').children.length,0);
  for(const id of ['startDeviceCheck','stopDeviceCheck','downloadDeviceCheck','deviceCheckAddClothes'])
   assert.equal(f.$(id).disabled,true,id);
  f.$('downloadDeviceCheck').onclick();
  f.$('deviceCheckAddClothes').onclick();
  await f.$('startDeviceCheck').onclick();
  f.api.record('scanner_error');
  assert.deepEqual(f.counts(),[0,0]);
  assert.equal(f.api.state().events.length,0);
  assert.equal(f.api.state().enabled,false);
 }
});
