import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {decodeOriginalJpegDataUrl,fingerprintOriginalJpegDataUrl} from '../public/original-jpeg-source.mjs';
import {fingerprintOriginalPhoto} from '../public/original-photo-fingerprint.mjs';
const source=Uint8Array.from([255,216,1,2,3,255,217]);
const url='data:image/jpeg;base64,'+Buffer.from(source).toString('base64');
test('source JPEG data URL hashes exact normalized bytes',async()=>{
 assert.deepEqual(decodeOriginalJpegDataUrl(url),source);
 const a=await fingerprintOriginalJpegDataUrl(url,webcrypto);
 const b=await fingerprintOriginalPhoto(source,webcrypto);
 assert.deepEqual(a,b);
 const restored='data:image/jpeg;base64,'+Buffer.from(decodeOriginalJpegDataUrl(url)).toString('base64');
 assert.equal((await fingerprintOriginalJpegDataUrl(restored,webcrypto)).version,a.version);
});
test('rejects preview formats, empty, malformed and altered JPEG sources',async()=>{
 for(const value of ['',null,'data:image/png;base64,AAAA','data:image/jpeg;base64,','data:image/jpeg;base64,!!!!','data:image/jpeg;base64,'+Buffer.from([1,2,3,4]).toString('base64')])assert.throws(()=>decodeOriginalJpegDataUrl(value));
 const altered=Uint8Array.from([255,216,1,2,4,255,217]);
 assert.notEqual((await fingerprintOriginalJpegDataUrl('data:image/jpeg;base64,'+Buffer.from(altered).toString('base64'),webcrypto)).version,(await fingerprintOriginalJpegDataUrl(url,webcrypto)).version);
});
