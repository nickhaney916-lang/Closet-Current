import test from 'node:test';import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet,validatePreviewRequest} from '../functions/api/ai-outfit-preview.js';
test('image-generation endpoint remains disabled without feature flag',async()=>{
 const response=await onRequestPost({request:new Request('https://example.test/api/ai-outfit-preview',{method:'POST'}),env:{}});
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,'AI_PREVIEW_NOT_ENABLED');
});
test('feature flag cannot bypass authentication and quota safeguards',async()=>{
 const response=await onRequestPost({request:new Request('https://example.test/api/ai-outfit-preview',{method:'POST'}),env:{AI_PREVIEW_ENABLED:'true',FASHN_API_KEY:'test'}});
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,'AI_PREVIEW_SETUP_INCOMPLETE');
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
