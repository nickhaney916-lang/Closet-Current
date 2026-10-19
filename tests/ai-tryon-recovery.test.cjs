// Behavioral client tests. Synthetic transport only; no credentials or AI calls.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ai-tryon.js','utf8');
function client(){
 const elements=new Map(),calls=[];
 const context={console,AbortController,DOMException,Image:class {naturalWidth=72;naturalHeight=108;decode(){return Promise.resolve()}removeAttribute(){}},
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
 await assert.rejects(c.tryOnRequest('local-token',{action:'status'}),/Invalid try-on response/i);
});
function transport(c,responses){
 c.fetch=async(url,options)=>{
  const body=JSON.parse(options.body);c.calls.push(body);
  if(body.action==='start'||body.action==='continue')return {ok:true,json:async()=>({status:'processing',token:'signed-active-job'})};
  assert.equal(body.token,'signed-active-job');
  const next=responses.shift();
  if(next instanceof Error)throw next;
  const status=typeof next==='number'?next:200;
  return {ok:status===200,status,json:async()=>typeof next==='number'?{error:'Temporary status outage'}:next};
 };
}
test('temporary status outage resumes the same job without re-submitting a garment',async()=>{
 for(const status of [408,429,500,502,503,504]){
  const c=client();transport(c,[status,{status:'processing'},{status:'completed',image:img}]);
  const result=await c.tryOnOne('local-token',img,'tops','female',()=>true);
  assert.equal(result.jobToken,'signed-active-job');
  assert.deepEqual(c.calls.map(x=>x.action),['start','status','status','status']);
 }
});
test('status recovery stops after two consecutive retries, and never re-submits a continuation',async()=>{
 const c=client();transport(c,[503,503,503,{status:'completed',image:img}]);
 await assert.rejects(c.tryOnOne('local-token',img,'bottoms','female',()=>true,'signed-predecessor'),/Temporary status outage/);
 assert.deepEqual(c.calls.map(x=>x.action),['continue','status','status','status']);
 assert.equal(c.calls[0].previousToken,'signed-predecessor');
});
test('authentication, invalid jobs and actual provider failure never receive status retries',async()=>{
 for(const response of [400,401,403,404,{status:'failed'}]){
  const c=client();transport(c,[response,{status:'completed',image:img}]);
  await assert.rejects(c.tryOnOne('local-token',img,'tops','female',()=>true));
  assert.deepEqual(c.calls.map(x=>x.action),['start','status']);
 }
});
test('outfit change during status recovery prevents further polling',async()=>{
 const c=client();let current=true;
 transport(c,[503,{status:'completed',image:img}]);
 const fetch=c.fetch;
 c.fetch=async(...args)=>{const response=await fetch(...args);if(response.status===503)current=false;return response;};
 await assert.rejects(c.tryOnOne('local-token',img,'tops','female',()=>current),/Outfit changed/);
 assert.deepEqual(c.calls.map(x=>x.action),['start','status']);
});
test('network interruption and request timeout recover only the existing status job',async()=>{
 const c=client();transport(c,[new TypeError('Network interrupted'),{status:'completed',image:img}]);
 await c.tryOnOne('local-token',img,'tops','female',()=>true);
 assert.deepEqual(c.calls.map(x=>x.action),['start','status','status']);
 const d=client();transport(d,[{status:'completed',image:img}]);
 const fetch=d.fetch;let interrupted=false;
 d.setTimeout=(fn,ms)=>setTimeout(fn,[1500,25000].includes(ms)?0:ms);
 d.fetch=async(url,options)=>{
  if(JSON.parse(options.body).action==='status'&&!interrupted){
   interrupted=true;d.calls.push(JSON.parse(options.body));
   return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));
  }
  return fetch(url,options);
 };
 await d.tryOnOne('local-token',img,'tops','female',()=>true);
 assert.deepEqual(d.calls.map(x=>x.action),['start','status','status']);
});
test('a temporary HTTP error on a billable start or continuation is never retried',async()=>{
 for(const previous of [null,'signed-predecessor']){
  const c=client();c.fetch=async(url,options)=>{
   c.calls.push(JSON.parse(options.body));return {ok:false,status:503,json:async()=>({error:'Uncertain generation response'})};
  };
  await assert.rejects(c.tryOnOne('local-token',img,'tops','female',()=>true,previous),/Uncertain generation response/);
  assert.deepEqual(c.calls.map(x=>x.action),[previous?'continue':'start']);
 }
});
