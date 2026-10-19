// Synthetic protocol regressions only; no provider or image-quality claims.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/ai-tryon.js','utf8');
const one=source.slice(source.indexOf('async function tryOnOne('),source.indexOf('async function generateTryOn('));
function setup(responses){
 const calls=[],decoded=[];
 const c={window:{AiTryOnPlan:{validImage:()=>true}},setTimeout:fn=>{fn();return 1;},decodeTryOnImage:async x=>decoded.push(x),
  tryOnRequest:async(_,body)=>{calls.push(body);return responses.shift();}};
 vm.createContext(c);vm.runInContext(one,c);return {c,calls,decoded};
}
test('every status poll uses the original signed token even when processing replies omit or substitute it',async()=>{
 const {c,calls,decoded}=setup([{status:'processing',token:'signed-original'},
  {status:'processing'},{status:'processing',token:'untrusted-substitute'},
  {status:'completed',image:'synthetic-image'}]);
 const result=await c.tryOnOne('auth','garment','tops','female',()=>true);
 assert.equal(result.jobToken,'signed-original');
 assert.deepEqual(calls.slice(1).map(x=>x.token),Array(3).fill('signed-original'));
 assert.deepEqual(decoded,['synthetic-image']);
});
test('changing outfit during poll delay makes no additional request',async()=>{
 const {c,calls}=setup([{status:'processing',token:'signed'}]);let current=true;
 c.setTimeout=fn=>{current=false;fn();return 1;};
 await assert.rejects(c.tryOnOne('auth','garment','tops','female',()=>current),/Outfit changed/);
 assert.equal(calls.length,1);
});
test('failed image decoding prevents a stage from completing',async()=>{
 const {c}=setup([{status:'processing',token:'signed'}, {status:'completed',image:'corrupt'}]);
 c.decodeTryOnImage=async()=>{throw Error('decode failed');};
 await assert.rejects(c.tryOnOne('auth','garment','tops','female',()=>true),/decode failed/);
});
test('malformed start response cannot enter polling',async()=>{
 for(const answer of [{status:'completed',token:'signed'},{status:'processing',token:''}]){
  const {c,calls}=setup([answer]);
  await assert.rejects(c.tryOnOne('auth','garment','tops','female',()=>true),/did not start/);
  assert.equal(calls.length,1);
 }
});
test('poll limit stops without resubmitting a billable start',async()=>{
 const {c,calls}=setup([{status:'processing',token:'signed'},...Array(32).fill({status:'processing'})]);
 await assert.rejects(c.tryOnOne('auth','garment','tops','female',()=>true),/time limit/);
 assert.equal(calls.filter(x=>x.action==='start').length,1);
 assert.equal(calls.length,33);
});
