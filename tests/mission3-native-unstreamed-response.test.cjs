'use strict';
// Executes the EXACT reader functions extracted from the real cloud client.
// Demonstrates the P861 native Response no-stream buffering gap and its fix,
// without granting public/hosted access or creating real customer photos.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const root=process.env.CLOUD_SOURCE_ROOT||'.';
const source=fs.readFileSync(root+'/public/cloud-backup.js','utf8');
const parent=process.env.EXPECT_BASELINE==='1';
const section=(begin,end)=>{
 const a=source.indexOf(begin);
 const b=a<0?-1:source.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,'Actual cloud reader function not found: '+begin);
 return source.slice(a,b);
};
const jpeg=section(' async function readBoundedPrivateJPEG(', ' // A private backup');
const json=section(' async function readBoundedCloudJSON(', ' function photoPath(');
const context={Response,Uint8Array,TextDecoder,setTimeout,clearTimeout,console};
vm.createContext(context);
vm.runInContext([
 "const photoIntegrityError=()=>Object.assign(Error('Cloud photo integrity failed'),{code:'cloud-photo-integrity'});",
 'const maxPrivateJPEGBytes=8388608;',jpeg,
 'const maxOwnerCloudDocumentBytes=33554432;',
 'const maxOwnerCloudSmallReplyBytes=65536;',json,
 'globalThis.readers={jpeg:readBoundedPrivateJPEG,json:readBoundedCloudJSON};'
].join('\n'),context,{timeout:2000});
const {readers}=context;

function unstreamedNative(kind){
 const response=new Response(null,{status:200});
 let attempted=0;
 if(kind==='json')response.json=async()=>{attempted++;return [{revision:99}];};
 else response.arrayBuffer=async()=>{attempted++;return Uint8Array.from([255,216,255,217]).buffer;};
 return {response,get attempted(){return attempted;}};
}

test('native no-stream owner JSON is never parsed or buffered after guard',async()=>{
 const f=unstreamedNative('json');
 if(parent)assert.equal((await readers.json(f.response,65536))[0].revision,99);
 else await assert.rejects(readers.json(f.response,65536),error=>error.code==='cloud-photo-integrity');
 assert.equal(f.attempted,parent?1:0);
});
test('native no-stream owner JPEG is never allocated through arrayBuffer after guard',async()=>{
 const f=unstreamedNative('jpeg');
 if(parent)assert.equal((await readers.jpeg(f.response)).length,4);
 else await assert.rejects(readers.jpeg(f.response),error=>error.code==='cloud-photo-integrity');
 assert.equal(f.attempted,parent?1:0);
});
test('native streaming legitimate owner JSON still decodes with size bound',async()=>{
 const response=new Response('[{"revision":2}]',{headers:{'content-type':'application/json'}});
 const parsed=await readers.json(response,65536);
 assert.equal(parsed[0].revision,2);
});
test('native streaming legitimate private JPEG stays byte exact',async()=>{
 const bytes=Uint8Array.from([255,216,255,224,0,16,255,217]);
 const response=new Response(bytes,{headers:{'content-type':'image/jpeg'}});
 const result=await readers.jpeg(response);
 assert.deepEqual([...result],[...bytes]);
});
test('plain legacy mocked responses keep compatible no-stream path',async()=>{
 let jsonCalls=0,bytesCalls=0;
 const parsed=await readers.json({json:async()=>{jsonCalls++;return [{revision:4}];}},65536);
 const data=await readers.jpeg({arrayBuffer:async()=>{bytesCalls++;return Uint8Array.from([255,216]).buffer;}});
 assert.equal(parsed[0].revision,4);
 assert.equal(data.length,2);
 assert.equal(jsonCalls,1);
 assert.equal(bytesCalls,1);
});
