import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {captureCanonicalJPEG,importCanonicalPhoto,verifyStoredCanonical,
 jpegBytes,jpegOrientation,digestBytes} from '../research/capture-proof-01/source-proof.mjs';

const jpeg=Uint8Array.from([255,216,255,224,0,8,74,70,73,70,255,217]);
const original='data:image/jpeg;base64,'+Buffer.from(jpeg).toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
const file=(bytes,type='image/jpeg',name='shirt.jpg')=>({
 name,type,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer
});
const fakeDecode=async()=>({width:4032,height:3024,naturalWidth:4032,naturalHeight:3024});
const options={cryptoProvider:webcrypto,decode:fakeDecode};
test('CAPTURE source proof SHA matches exact camera canonical JPEG bytes at full 4032x3024',async()=>{
 const p=await captureCanonicalJPEG(original,{width:4032,height:3024,cryptoProvider:webcrypto});
 assert.equal(p.image,original);assert.equal(p.sourceSHA256,sha);
 assert.equal(p.originalPhoto.sha256,sha);
 assert.deepEqual([p.originalPhoto.width,p.originalPhoto.height],[4032,3024]);
 assert.equal(p.sourceHashVerified,true);
 assert.equal(p.singleGarmentVerified,false,'a photo cannot prove a single garment');
 assert.equal(p.originalPhoto.transformed,false);
 assert.equal(await verifyStoredCanonical(p,{cryptoProvider:webcrypto}),true);
});
test('independent imported JPEG bytes retained unchanged and input sha equals canonical sha',async()=>{
 const p=await importCanonicalPhoto(file(jpeg),options);
 assert.equal(p.image,original);
 assert.equal(p.sourceSHA256,sha);
 assert.equal(p.originalPhoto.originalFileSha256,sha);
 assert.equal(p.originalPhoto.originalFileType,'image/jpeg');
 assert.equal(p.originalPhoto.originalFileBytes,jpeg.length);
 assert.equal(p.originalPhoto.transformed,false);
 assert.equal(await verifyStoredCanonical(p,{cryptoProvider:webcrypto}),true);
});
test('PNG→full-resolution JPEG preserves separate real source hash and explicit transformation truth',async()=>{
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4]);
 let drawn=false,shape=null;
 const p=await importCanonicalPhoto(file(png,'image/png','shirt.png'),{
  ...options,makeCanvas:()=>({
   set width(v){shape={...(shape||{}),width:v};},
   set height(v){shape={...(shape||{}),height:v};},
   getContext:()=>({fillRect(){},set fillStyle(v){},drawImage(){drawn=true;}}),
   toDataURL:()=>original
  })
 });
 assert.equal(drawn,true);
 assert.deepEqual(shape,{width:4032,height:3024});
 assert.equal(p.image,original);assert.equal(p.sourceSHA256,sha);
 assert.equal(p.originalPhoto.originalFileSha256,createHash('sha256').update(png).digest('hex'));
 assert.notEqual(p.originalPhoto.originalFileSha256,p.sourceSHA256);
 assert.equal(p.originalPhoto.transformed,true);
 assert.equal(p.originalPhoto.orientationConversion,'browser-decoded-to-jpeg');
 assert.equal(await verifyStoredCanonical(p,{cryptoProvider:webcrypto}),true);
});
test('EXIF orientation recorded without false claim that original JPEG bytes were converted',async()=>{
 const exif=Buffer.from([
  255,216,255,225,0,34,69,120,105,102,0,0,
  73,73,42,0,8,0,0,0,1,0,
  18,1,3,0,1,0,0,0,6,0,0,0,
  0,0,0,0,255,217
 ]);
 assert.equal(jpegOrientation(exif),6);
 const p=await importCanonicalPhoto(file(exif),options);
 assert.equal(p.originalPhoto.orientation,6);
 assert.equal(p.originalPhoto.orientationConversion,'browser-exif-display-only');
 assert.equal(p.originalPhoto.transformed,false);
 assert.equal(p.image,'data:image/jpeg;base64,'+exif.toString('base64'));
});
test('tampering a saved canonical JPEG invalidates proof even if optimistic metadata remains',async()=>{
 const p=await captureCanonicalJPEG(original,{width:100,height:100,cryptoProvider:webcrypto});
 const different='data:image/jpeg;base64,'+Buffer.from([255,216,8,4,255,217]).toString('base64');
 assert.equal(await verifyStoredCanonical({...p,image:different,originalPhoto:{...p.originalPhoto,image:different}}, {cryptoProvider:webcrypto}),false);
 assert.equal(await verifyStoredCanonical({...p,sourceHashVerified:false},{cryptoProvider:webcrypto}),false);
 assert.equal(await verifyStoredCanonical({...p,sourceSHA256:'f'.repeat(64)},{cryptoProvider:webcrypto}),false);
 assert.equal(await verifyStoredCanonical({...p,originalPhoto:{...p.originalPhoto,image:'other'}},{cryptoProvider:webcrypto}),false);
});
test('reject fabricated digest/invalid JPEG, giant media, malformed dimensions and spoofed MIME',async()=>{
 await assert.rejects(captureCanonicalJPEG('data:image/jpeg;base64,'+btoa('notjpeg'),{width:200,height:400,cryptoProvider:webcrypto}),/JPEG envelope/);
 await assert.rejects(captureCanonicalJPEG(original,{width:0,height:400,cryptoProvider:webcrypto}),/dimensions/);
 await assert.rejects(captureCanonicalJPEG(original,{width:99999,height:99999,cryptoProvider:webcrypto}),/dimensions/);
 await assert.rejects(importCanonicalPhoto(file([1,2,3,4],'image/jpeg'),options),/false JPEG MIME/);
 await assert.rejects(importCanonicalPhoto(file([1,2,3,4],'application/octet-stream'),options),/unsupported image format/);
 await assert.rejects(importCanonicalPhoto({...file(jpeg),size:111},options),/changed during read/);
 await assert.rejects(digestBytes(new Uint8Array(),webcrypto),/original bytes/);
});
test('two different originals have different SHA regardless of human-readable filename',async()=>{
 const other=Uint8Array.from(jpeg);other[7]=45;
 const a=await importCanonicalPhoto(file(jpeg,'image/jpeg','same.jpg'),options);
 const b=await importCanonicalPhoto(file(other,'image/jpeg','same.jpg'),options);
 assert.notEqual(a.sourceSHA256,b.sourceSHA256);
 assert.notEqual(a.image,b.image);
});
test('camera/import proof never classifies ownership, user identity, a verified cutout, or garment type',async()=>{
 const p=await captureCanonicalJPEG(original,{width:100,height:100,cryptoProvider:webcrypto});
 assert.equal(p.singleGarmentVerified,false);
 assert.equal(p.recognitionFromOriginal,true);
 assert.equal(p.ownerId,undefined);
 assert.equal(p.segmentVerified,undefined);
 assert.equal(p.category,undefined);
 assert.equal(p.itemType,undefined);
 assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.originalPhoto));
});
test('actual opt-in app connects original before model and preserves original hash in crop/outfit',()=>{
 const app=readFileSync('public/app.js','utf8');
 const crop=readFileSync('public/photo-crop-editor.js','utf8');
 const outfit=readFileSync('public/outfit-capture.js','utf8');
 const html=readFileSync('public/index.html','utf8');
 assert.ok(app.includes("get('captureProof01')==='after'"));
 assert.ok(app.includes('captureProofFromJPEG(image,{width,height,origin:'));
 assert.ok(app.includes('captureProofFromFile(file,owner)'));
 assert.ok(app.includes('if(request!==cameraRequest||!stream||captureProofOwner()!==owner||document.hidden)'));
 assert.ok(app.includes('item.singleGarmentVerified=false'));
 assert.ok(app.includes('queueAutomatic(item);return true;'));
 assert.ok(crop.includes('...(item.originalPhoto||{}),image:source'));
 assert.ok(outfit.includes('originalSourceProof:guarded?job.proof:null'));
 assert.ok(html.includes('captureCameraFacing'));
});
test('no unapproved network, native gallery, cloud or model upload is present in proof producer',()=>{
 const src=readFileSync('research/capture-proof-01/source-proof.mjs','utf8');
 assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|postMessage|localStorage|indexedDB|navigator\.share|showSaveFilePicker|\.download\s*=/);
 assert.match(src,/cryptoProvider\.subtle\.digest/);
});
