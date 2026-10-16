import test from 'node:test';import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet,validatePreviewRequest,verifyClosetSession,reservePreviewQuota} from '../functions/api/ai-outfit-preview.js';
test('image-generation endpoint remains disabled without feature flag',async()=>{
 const response=await onRequestPost({request:new Request('https://example.test/api/ai-outfit-preview',{method:'POST'}),env:{}});
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,'AI_PREVIEW_NOT_ENABLED');
});
test('feature flag cannot bypass authentication and quota safeguards',async()=>{
 const response=await onRequestPost({request:new Request('https://example.test/api/ai-outfit-preview',{method:'POST'}),env:{AI_PREVIEW_ENABLED:'true',FASHN_API_KEY:'test'}});
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,'AUTH_REQUIRED');
});
test('GET cannot trigger generation',async()=>{
 assert.equal((await onRequestGet()).status,405);
});

test('generation request validator requires consent and valid limited image references',()=>{
 const image='data:image/jpeg;base64,aGVsbG8=';
 assert.equal(validatePreviewRequest({garments:[{slot:'top',image}]}),'CONSENT_REQUIRED');
 assert.equal(validatePreviewRequest({consentToSharePhotos:true,garments:[{slot:'top',image}]}),null);
 assert.equal(validatePreviewRequest({consentToSharePhotos:true,garments:Array.from({length:4},()=>({slot:'top',image}))}),'INVALID_GARMENT_COUNT');
 assert.equal(validatePreviewRequest({consentToSharePhotos:true,garments:[{slot:'top',image:'https://other.site/asset'}]}),'INVALID_GARMENT_IMAGE');
});

test('Supabase session verification rejects missing and invalid tokens',async()=>{
 const request=new Request('https://example.test/api/ai-outfit-preview');
 assert.equal(await verifyClosetSession(request,{fetcher:()=>{throw Error('Should not fetch')}}),null);
 const invalid=new Request(request.url,{headers:{authorization:'Bearer abc'}});
 assert.equal(await verifyClosetSession(invalid,{fetcher:async()=>new Response('{}',{status:401})}),null);
});
test('Supabase verification accepts only server-validated user ids',async()=>{
 const request=new Request('https://example.test/api/ai-outfit-preview',{headers:{authorization:'Bearer abc'}});
 assert.deepEqual(await verifyClosetSession(request,{fetcher:async()=>new Response(JSON.stringify({id:'user-1'}),{status:200})}),{id:'user-1'});
 assert.equal(await verifyClosetSession(request,{fetcher:async()=>new Response('{}',{status:200})}),null);
});

test('quota reservations fail closed without bound durable storage',async()=>{
 await assert.rejects(()=>reservePreviewQuota({},'user-1'),/not configured/);
});
test('quota reservations use verified user-specific object and enforce result shape',async()=>{
 let key,received;
 const env={AI_PREVIEW_QUOTAS:{idFromName(name){key=name;return name;},get(){return {fetch:async(url,init)=>{received=JSON.parse(init.body);return Response.json({allowed:true,remaining:1});}};}}};
 assert.deepEqual(await reservePreviewQuota(env,'user-123',{day:'2026-10-15',limit:2}),{allowed:true,remaining:1});
 assert.equal(key,'user:user-123');
 assert.deepEqual(received,{day:'2026-10-15',limit:2});
});
