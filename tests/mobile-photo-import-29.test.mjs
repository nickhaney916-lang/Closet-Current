import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {importCanonicalPhoto, jpegBytes} from '../public/native-canonical-photo-source-167.mjs';

const image = sharp({create:{width:24,height:32,channels:4,background:'#34825580'}});
const jpeg = await image.clone().jpeg().toBuffer();
const png = await image.clone().png().toBuffer();
const webp = await image.clone().webp().toBuffer();

test('import bounds JPEG dimensions before invoking the decoder', async () => {
 const oversized = Buffer.from(jpeg);
 const frame = oversized.indexOf(Buffer.from([255,192]));
 assert.ok(frame > 0);
 oversized.writeUInt16BE(12000,frame+5);
 oversized.writeUInt16BE(12000,frame+7);
 let calls=0;
 await assert.rejects(importCanonicalPhoto(new File([oversized],'large.jpg',{type:'image/jpeg'}),{
  decode:async()=>{calls++;return {width:24,height:32};}
 }),/dimensions/i);
 assert.equal(calls,0);
});

test('gallery rejects inputs that cannot be retained as byte-exact originals', async () => {
 for(const [mime,bytes] of [['image/png',png],['image/webp',webp]]){
  let calls=0;
  await assert.rejects(importCanonicalPhoto(new File([bytes],'photo',{type:mime}),{
   decode:async()=>{calls++;return {width:24,height:32};},
   makeCanvas:()=>({getContext:()=>({fillRect(){},drawImage(){}}),
    toDataURL:()=> 'data:image/jpeg;base64,'+jpeg.toString('base64')})
  }),/original.*JPEG/i);
  assert.equal(calls,0,mime);
 }
});

test('metadata is optional but conflicting file types are rejected', async () => {
 const decode=async()=>({width:24,height:32});
 for(const type of ['', 'application/octet-stream', 'image/jpg']){
  const file=new File([jpeg],'photo.jpeg',{type});
  const result=await importCanonicalPhoto(file,{decode});
  assert.deepEqual(Buffer.from(jpegBytes(result.image)),jpeg);
  assert.equal(result.originalPhoto.originalFileSha256,result.sourceSHA256);
 }
 await assert.rejects(importCanonicalPhoto(new File([jpeg],'photo.jpg',{type:'image/png'}),{decode}),/contradict/i);
 await assert.rejects(importCanonicalPhoto(new File([jpeg],'photo.png'),{decode}),/contradict/i);
});


test('revocation during read never starts decoding and revocation during decode returns no proof', async () => {
 let live=true, calls=0;
 const file={size:jpeg.length,type:'image/jpeg',name:'photo.jpg',async arrayBuffer(){
  live=false;
  return Uint8Array.from(jpeg).buffer;
 }};
 const options={shouldContinue:()=>live,decode:async()=>{calls++;live=false;return {width:24,height:32};}};
 await assert.rejects(importCanonicalPhoto(file,options),/cancelled/);
 assert.equal(calls,0);
 live=true;
 await assert.rejects(importCanonicalPhoto(new File([jpeg],'photo.jpg'),options),/cancelled/);
 assert.equal(calls,1);
});

test('refuse JPEGs larger than the verified 2D preview limit before reading', async () => {
 let reads=0;
 const beyondPreviewLimit={name:'large.jpg',type:'image/jpeg',size:8_000_001,
  arrayBuffer:async()=>{reads++;return new ArrayBuffer(0);}
 };
 await assert.rejects(importCanonicalPhoto(beyondPreviewLimit),/8 MB or less/);
 assert.equal(reads,0);
});
