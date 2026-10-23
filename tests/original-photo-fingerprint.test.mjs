import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {fingerprintOriginalPhoto} from '../public/original-photo-fingerprint.mjs';
const bytes=s=>new TextEncoder().encode(s);
test('same original photo yields stable SHA-256 version',async()=>{
 const a=await fingerprintOriginalPhoto(bytes('original-photo'),webcrypto);
 const b=await fingerprintOriginalPhoto(bytes('original-photo'),webcrypto);
 assert.equal(a.version,b.version);assert.equal(a.version.length,64);assert.equal(a.algorithm,'sha256');
});
test('source changes invalidate version independently of cropped preview',async()=>{
 const a=await fingerprintOriginalPhoto(bytes('original-photo'),webcrypto);
 const b=await fingerprintOriginalPhoto(bytes('original-photo-replaced'),webcrypto);
 assert.notEqual(a.version,b.version);
});
test('empty bytes and missing digest fail closed',async()=>{
 await assert.rejects(fingerprintOriginalPhoto(new Uint8Array(),webcrypto),/Nonempty/);
 await assert.rejects(fingerprintOriginalPhoto(bytes('valid'),{}),/unavailable/);
});
