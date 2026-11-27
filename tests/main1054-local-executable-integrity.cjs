const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {webcrypto,createHash}=require('node:crypto');
const vm=require('node:vm');
const good='export const verified=true;',bad='export const verified=false;';
const integrity='sha384-'+createHash('sha384').update(good).digest('base64');
const scope='https://example.test/';
const url=scope+'local-worker.mjs?v=fixture';
function response(body){return {ok:true,redirected:false,type:'basic',clone(){return response(body)},async arrayBuffer(){return new TextEncoder().encode(body).buffer}}}
function setup(network,cached){
 const handlers={};let stored;
 const cache={match:async()=>cached,put:async(_,r)=>{stored=r}};
 const source=readFileSync('public/sw.js','utf8').replace('__VERSION__','fixture').replace('__ASSETS__',JSON.stringify(['local-worker.mjs','local-worker.mjs?v=fixture'])).replace('__EXECUTABLE_INTEGRITY__',JSON.stringify([['local-worker.mjs',integrity]]));
 vm.runInNewContext(source,{URL,Request,Response,Uint8Array,btoa,crypto:webcrypto,fetch:async()=>{if(network instanceof Error)throw network;return network},caches:{open:async()=>cache},self:{registration:{scope},location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn}});
 let result;handlers.fetch({request:{method:'GET',url},respondWith:p=>result=p});
 return {result,getStored:()=>stored};
}
test('verified executable is returned and cached',async()=>{const r=setup(response(good));assert.equal((await r.result).ok,true);assert.ok(r.getStored())});
test('substituted network executable is rejected without caching',async()=>{const r=setup(response(bad));assert.equal((await r.result).status,503);assert.equal(r.getStored(),undefined)});
test('verified cached executable survives network substitution',async()=>{const saved=response(good),r=setup(response(bad),saved);assert.equal(await r.result,saved)});
test('modified cached executable is rejected offline',async()=>{const r=setup(new Error('offline'),response(bad));assert.equal((await r.result).status,503)});
