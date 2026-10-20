'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/photo-import.js','utf8');
const runIn=(setup={})=>{
 const scope={setTimeout,clearTimeout,...setup};
 vm.createContext(scope);vm.runInContext(source,scope);return scope;
};
const upload=(name,type='',size=128)=>({name,type,size});
test('untyped JPEG/PNG/HEIC/HEIF/AVIF/WEBP paths reach a genuine decoder and retain other successful batch entries',async()=>{
 const c=runIn(),decoded=[],added=[];
 const files=[
  upload('outfit.JPEG'),upload('dress.heic'),upload('shoe.HEIF','application/octet-stream'),
  upload('denim.PNG'),upload('belt.avif'),upload('layer.webp'),
  upload('masquerade.jpg','application/pdf'),upload('data.zip'),upload('huge.PNG','',11*1024*1024)
 ];
 const result=await c.readPhotoBatch(files,async f=>{
  decoded.push(f.name);if(f.name==='dress.heic')throw Error('Unsupported HEIC decoder');
  return f.name;
 },async (_,f)=>{added.push(f.name);return true;});
 assert.deepEqual(decoded,['outfit.JPEG','dress.heic','shoe.HEIF','denim.PNG','belt.avif','layer.webp']);
 assert.deepEqual(added,['outfit.JPEG','shoe.HEIF','denim.PNG','belt.avif','layer.webp']);
 assert.equal(result.added,5);
 assert.deepEqual(Array.from(result.results.map(r=>r.status)),
  ['added','error','added','added','added','added','rejected','rejected','rejected']);
 assert.match(result.errors.join(' '),/dress\.heic: could not open/);
 assert.ok(!result.errors.some(e=>e.includes('shoe.HEIF')));
});
test('blank and octet-stream photos must not trust nonimage names or fake PDF MIME',async()=>{
 const c=runIn(),seen=[];
 const files=[upload('bad.html',''),upload('bad.jpg','text/html'),
  upload('bad.webp','application/zip'),upload('ok.jpeg','application/octet-stream'),
  upload('ok.JPG','IMAGE/JPEG')];
 const out=await c.readPhotoBatch(files,async x=>{seen.push(x.name);return x.name;},async()=>true);
 assert.deepEqual(seen,['ok.jpeg','ok.JPG']);
 assert.equal(out.added,2);
 assert.equal(out.results.filter(x=>x.status==='rejected').length,3);
});
test('a never-settling decoder becomes a recoverable timeout and its object URL is revoked',async()=>{
 let released=0,timeoutDelay=0;
 const c=runIn({
  URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL:()=>{released++;}},
  Image:class{constructor(){this.width=4032;this.height=3024;}decode(){return new Promise(()=>{});}},
  setTimeout:(fn,ms)=>{timeoutDelay=ms;queueMicrotask(fn);return 1;},
  clearTimeout:()=>{}
 });
 await assert.rejects(c.photoToJPEG(upload('stall.HEIC','image/heic')),/Photo decoding timed out/);
 assert.equal(timeoutDelay,15000);
 assert.equal(released,1);
});
test('valid photo decodes and yields high-quality JPEG with bounded original-first source dimensions',async()=>{
 let released=0,painted=0,reported=null,dimensions;
 const outCanvas={width:0,height:0,getContext:()=>({
  fillRect:()=>{},drawImage(...args){painted++;reported=args;}
 }),toDataURL:(mime,quality)=>{
  assert.equal(mime,'image/jpeg');assert.equal(quality,.94);return 'data:image/jpeg;base64,SYNTHETIC';
 }};
 const c=runIn({
  URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL:()=>{released++;}},
  Image:class{constructor(){this.width=4032;this.height=3024;}async decode(){}},
  document:{createElement:()=>outCanvas}
 });
 const photo=await c.photoToJPEG(upload('original.PNG','image/png'));
 assert.equal(photo,'data:image/jpeg;base64,SYNTHETIC');
 assert.equal(outCanvas.width,2048);
 assert.equal(outCanvas.height,1536);
 assert.equal(painted,1);
 assert.equal(released,1);
});
test('one explicitly rejected duplicate and one corrupt photo do not halt remaining saves',async()=>{
 const c=runIn();
 const out=await c.readPhotoBatch([
  upload('one.jpg','image/jpeg'),upload('duplicate.jpg','image/jpeg'),
  upload('corrupt.heic',''),upload('later.PNG','')
 ],async f=>{if(f.name==='corrupt.heic')throw Error('unsupported');return f.name;},
 async (_,f)=>f.name!=='duplicate.jpg');
 assert.equal(out.added,2);
 assert.deepEqual(Array.from(out.results.map(x=>x.status)),['added','duplicate','error','added']);
});
