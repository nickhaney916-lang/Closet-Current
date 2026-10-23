import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {fingerprintOriginalPhoto} from '../public/original-photo-fingerprint.mjs';
import {prepareVerified3DItems} from '../public/verified-3d-photo-preparation.mjs';
import {mapBoardSlotsTo3D} from '../public/outfit-3d-board-bridge.mjs';
const bytes=new TextEncoder().encode('original-photo-bytes');
const fixture=async()=>({id:'shirt',category:'Tops',colorHex:'#336699',image:'synthetic-crop',accountId:'a',originalPhotoId:'photo-1',originalSourceVersion:(await fingerprintOriginalPhoto(bytes,webcrypto)).version});
test('verified original photo flows to board mapping without exposing bytes',async()=>{
 const item=await fixture();
 const prepared=await prepareVerified3DItems([item],'a',async()=>bytes,webcrypto);
 const result=mapBoardSlotsTo3D({slots:{top:'shirt'}},prepared.items,'a',prepared.sourceIdentity);
 assert.equal(result.selected[0].sourceIdentity,'photo-1');
 assert.equal(result.selected[0].sourceVersion,item.originalSourceVersion);
 assert.equal(JSON.stringify(result).includes('original-photo-bytes'),false);
});
test('modified original invalidates the same cropped preview',async()=>{
 const item=await fixture();
 await assert.rejects(prepareVerified3DItems([item],'a',async()=>new TextEncoder().encode('changed-original'),webcrypto),/Stale/);
});
test('missing original identity and foreign account fail closed',async()=>{
 const item=await fixture();
 await assert.rejects(prepareVerified3DItems([{...item,originalPhotoId:''}],'a',async()=>bytes,webcrypto),/original-photo ID/);
 await assert.rejects(prepareVerified3DItems([{...item,accountId:'b'}],'a',async()=>bytes,webcrypto),/ownership/);
});
