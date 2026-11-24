const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {runInNewContext}=require('node:vm');

function extract(file,start,end){
 const source=readFileSync(file,'utf8');
 const from=source.indexOf(start),to=source.indexOf(end,from);
 assert.ok(from>=0&&to>from,'test must execute the real private client');
 return source.slice(from,to);
}

test('auth and backup credential-bearing requests explicitly disallow redirects',async()=>{
 const calls=[];
 const context={
  URL:'https://private.example.invalid',BASE:'https://private.example.invalid',
  KEY:'fixture key',user:'owner',stopForReview145:()=>false,
  window:{closetAuth:{user:{id:'owner'},getAccessToken:async()=>'fixture token'}},
  fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({status:'fixture'})};},
  AbortController,setTimeout,clearTimeout,
 };
 const auth=extract('public/auth.js',' async function request(', ' function showUser(');
 const cloud=extract('public/cloud-backup.js',' async function api(', ' const hash=');
 const clients=runInNewContext(auth+cloud+';({request,api})',context);
 await clients.request('token',{synthetic:true});
 await clients.request('user',null,'fixture token','GET');
 await clients.api('/rest/v1/rpc/save_closet_backup',{method:'POST',body:{synthetic:true}});
 const bytes=new Uint8Array([255,216,255,217]);
 await clients.api('/storage/v1/object/closet-private/owner/fixture.jpg',{method:'POST',contentType:'image/jpeg',body:bytes});
 assert.equal(calls.length,4);
 for(const {url,options} of calls){
  assert.equal(new URL(url).origin,'https://private.example.invalid');
  assert.equal(options.redirect,'error');
  assert.equal(options.cache,'no-store');
 }
 assert.equal(calls[1].options.body,undefined);
 assert.equal(calls[3].options.body,bytes,'backup still sends the exact authorized bytes');
});
