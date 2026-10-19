// Behavioral client tests. Synthetic transport only; no credentials or AI calls.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ai-tryon.js','utf8');
function client(){
 const elements=new Map(),calls=[];
 const context={console,AbortController,DOMException,Image:class {},
  setTimeout:(fn,ms)=>ms===1500?setTimeout(fn,0):setTimeout(fn,ms),clearTimeout,
  window:{AiTryOnPlan:require('../public/ai-tryon-plan.js')},
  items:[],currentBoard:{slots:{}},fetch:async()=>({ok:true,json:async()=>({status:'unavailable'})}),
  $:id=>{if(!elements.has(id))elements.set(id,{hidden:true,disabled:false,textContent:'',
   removeAttribute(name){delete this[name]},classList:{add(){},remove(){}}});return elements.get(id);}};
 vm.createContext(context);vm.runInContext(source,context);
 context.calls=calls;return context;
}
const img='data:image/jpeg;base64,'+'Ab9/'.repeat(40);
test('every processing poll retains the original signed job token',async()=>{
 const c=client();
 c.tryOnRequest=async(token,body)=>{
  c.calls.push(body);
  if(body.action==='start')return {status:'processing',token:'signed-first-job'};
  assert.equal(body.token,'signed-first-job');
  return c.calls.length<4?{status:'processing'}:{status:'completed',image:img};
 };
 const result=await c.tryOnOne('local-token',img,'tops','female',()=>true);
 assert.equal(result.jobToken,'signed-first-job');
 assert.equal(c.calls.filter(x=>x.action==='start').length,1);
 assert.equal(c.calls.filter(x=>x.action==='status').length,3);
});
test('outfit invalidated during polling delay makes no further status request',async()=>{
 const c=client();let current=true;
 c.tryOnRequest=async(token,body)=>{c.calls.push(body);return {status:'processing',token:'old-job'};};
 c.setTimeout=(fn,ms)=>setTimeout(()=>{if(ms===1500)current=false;fn();},0);
 await assert.rejects(c.tryOnOne('local-token',img,'tops','female',()=>current),/Outfit changed/);
 assert.deepEqual(c.calls.map(x=>x.action),['start']);
});
test('request timeout releases fetch and is never retried automatically',async()=>{
 const c=client();let count=0;
 c.fetch=async(url,options)=>{
  count++;return await new Promise((resolve,reject)=>{
   options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true});
  });
 };
 c.setTimeout=fn=>setTimeout(fn,0);
 await assert.rejects(c.tryOnRequest('local-token',{action:'start'}),/timed out/i);
 assert.equal(count,1);
});
test('invalid JSON success is rejected as an unreadable service response',async()=>{
 const c=client();c.fetch=async()=>({ok:true,json:async()=>{throw Error('broken JSON')}});
 await assert.rejects(c.tryOnRequest('local-token',{action:'status'}),/unreadable/i);
});
