const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('public/photo-import.js','utf8');
const jfif=Buffer.from([0xff,0xe0,0,16,...Buffer.from('JFIF\0'),1,1,0,0,1,0,1,0,0]);
const makeJpeg=({exif=false,thumbnail=false}={})=>{
 const a=Buffer.from(jfif);
 if(thumbnail)a[a.length-1]=1;
 const app=exif?Buffer.from([0xff,0xe1,0,18,...Buffer.from('Exif\0\0GPS:123456')]):Buffer.alloc(0);
 return Buffer.concat([Buffer.from([255,216]),a,app,
  Buffer.from([255,219,0,4,1,2,255,192,0,8,8,0,16,0,16,1,255,218,0,6,1,1,0,0]),
  Buffer.alloc(150,5),Buffer.from([255,217])]);
};
function contextFor({w=1280,h=920,jpeg='fallback-jpeg-base64',decodeError=false}={}){
 let draw=0,encodes=0,revoke=0;
 const ctx={
  Uint8Array,Error,Number,Math,Buffer,btoa:input=>Buffer.from(input,'binary').toString('base64'),
  URL:{createObjectURL:()=> 'blob:fake',revokeObjectURL:()=>revoke++},
  Image:function(){this.width=w;this.height=h;this.naturalWidth=w;this.naturalHeight=h;
   this.decode=async()=>{if(decodeError)throw Error('corrupted');};},
  document:{createElement:type=>{
   assert.equal(type,'canvas');
   return {width:0,height:0,
    getContext:()=>({set fillStyle(value){},fillRect(){},drawImage(){draw++;}}),
    toDataURL:()=>{encodes++;return 'data:image/jpeg;base64,'+jpeg;}
   };
  }}
 };
 vm.createContext(ctx);
 vm.runInContext(source,ctx);
 return {ctx,stat:()=>({draw,encodes,revoke})};
}
const asFile=(data,{name='shirt.jpg',type='image/jpeg',size=data.length}={})=>({
 name,type,size,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)
});
test('small original metadata-free JPEG is saved byte-for-byte with NO recompression',async()=>{
 const bytes=makeJpeg();const {ctx,stat}=contextFor();
 const output=await ctx.photoToJPEG(asFile(bytes));
 assert.equal(output,'data:image/jpeg;base64,'+bytes.toString('base64'));
 assert.deepEqual(stat(),{draw:0,encodes:0,revoke:1});
});
test('EXIF/GPS, JFIF thumbnail, non-JFIF APP segments and comments never bypass metadata stripping',async()=>{
 for(const bytes of [
  makeJpeg({exif:true}),makeJpeg({thumbnail:true}),
  (()=>{const a=makeJpeg();return Buffer.concat([a.subarray(0,2),Buffer.from([255,238,0,5,1,2,3]),a.subarray(2)]);})(),
  (()=>{const a=makeJpeg();return Buffer.concat([a.subarray(0,2),Buffer.from([255,254,0,6,1,2,3,4]),a.subarray(2)]);})()
 ]){
  const {ctx,stat}=contextFor();
  const output=await ctx.photoToJPEG(asFile(bytes));
  assert.equal(output,'data:image/jpeg;base64,fallback-jpeg-base64');
  assert.deepEqual(stat(),{draw:1,encodes:1,revoke:1});
 }
});
test('non-JPEG and oversized originals receive bounded metadata-stripping conversion',async()=>{
 const bytes=makeJpeg();
 for(const file of [
  asFile(bytes,{type:'image/png',name:'capture.png'}),
  asFile(bytes,{size:5*1024*1024})
 ]){
  const {ctx,stat}=contextFor();
  assert.equal(await ctx.photoToJPEG(file),'data:image/jpeg;base64,fallback-jpeg-base64');
  assert.equal(stat().draw,1);assert.equal(stat().revoke,1);
 }
 const huge=contextFor({w:6000,h:4000});
 await huge.ctx.photoToJPEG(asFile(bytes));
 assert.equal(huge.stat().draw,1);
});
test('invalid JPEG frame, appended private payload and missing scan never bypass sanitizer',async()=>{
 for(const bytes of [
  Buffer.concat([makeJpeg(),Buffer.from('PRIVATE')]),
  Buffer.concat([Buffer.from([255,216]),Buffer.alloc(150,0),Buffer.from([255,217])]),
  (()=>{const a=makeJpeg();a[a.indexOf(Buffer.from([255,218]))]=255;a[a.indexOf(Buffer.from([255,218]))+1]=210;return a;})()
 ]){
  const {ctx}=contextFor();
  assert.equal(await ctx.photoToJPEG(asFile(bytes)),'data:image/jpeg;base64,fallback-jpeg-base64');
 }
});
test('unreadable source, decode failure, or unsafe conversion always revokes original blob URL',async()=>{
 const {ctx,stat}=contextFor({decodeError:true});
 await assert.rejects(ctx.photoToJPEG(asFile(makeJpeg())),/corrupted/);
 assert.equal(stat().revoke,1);
 await assert.rejects(ctx.photoToJPEG(null),/Unreadable/);
});
test('no source mutation, no extra user accounts, and batch limits preserve prior policy',async()=>{
 const bytes=makeJpeg();const copy=Buffer.from(bytes);
 const {ctx}=contextFor();
 await ctx.photoToJPEG(asFile(bytes));assert.ok(bytes.equals(copy));
 assert.match(source,/file\.size>10\*1024\*1024/);
 assert.match(source,/await onPhoto\(image,file\)/);
});
