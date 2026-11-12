'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path');
const api=require(path.resolve('public/photo-quality-research.js'));
const pixels=(width,height,paint)=>{
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,rgba=paint(x,y);
  data.set(rgba,i);
 }return data;
};
test('research flag is disabled by default and never authorizes saving',()=>{
 assert.equal(api.enabled(),false);
 assert.equal(api.VERSION,'P73-3');
});
test('bounded sample rejects corruption, untrusted oversized dimensions and zero pixels',()=>{
 assert.throws(()=>api.analyzePixels(new Uint8Array(4),16,16));
 assert.throws(()=>api.analyzePixels([],0,0));
 assert.throws(()=>api.analyzePixels(new Uint8Array(513*16*4),513,16));
 assert.throws(()=>api.analyzePixels(new Uint8Array(16*16*4),16,16,Infinity,16));
 assert.throws(()=>api.analyzePixels(Array(16*16*4).fill(NaN),16,16),'reject malformed untyped arrays');
 assert.throws(()=>api.analyzePixels(new Float64Array(16*16*4),16,16),'reject non-byte pixel arrays');
});
test('EXIF rotations use displayed photo dimensions, including mirrored rotations',()=>{
 assert.deepEqual(api.orientedDimensions(4032,3024,1),{width:4032,height:3024});
 assert.deepEqual(api.orientedDimensions(4032,3024,3),{width:4032,height:3024});
 for(const orientation of [5,6,7,8])assert.deepEqual(api.orientedDimensions(4032,3024,orientation),{width:3024,height:4032});
 assert.throws(()=>api.orientedDimensions(4032,3024,9));
 assert.throws(()=>api.orientedDimensions(0,3024,6));
});
test('very narrow originals stay advisory rather than silently losing diagnostics',()=>{
 const sample=api.analyzePixels(pixels(256,3,()=>[8,8,8,255]),256,3,2500,29);
 assert.equal(sample.metrics.sampledHeight,3);
 assert.ok(sample.advice.some(a=>a.code==='limited-resolution'));
 assert.ok(!sample.advice.some(a=>a.code==='possible-softness'));
});
test('severely dark frame produces optional light guidance, not a verdict',()=>{
 const p=pixels(96,96,()=>[14,14,14,255]);
 const x=api.analyzePixels(p,96,96,2048,1536);
 assert.ok(x.advice.some(n=>n.code==='low-light'));
 assert.equal(x.kind,'advisory-only');assert.equal(x.notMeasured.includes('true garment color'),true);
 assert.equal(Object.prototype.hasOwnProperty.call(x,'image'),false);
});
test('nearly white frame warns about detail without declaring blank or invalid',()=>{
 const x=api.analyzePixels(pixels(96,96,()=>[252,252,252,255]),96,96,1280,960);
 assert.ok(x.advice.some(w=>w.code==='bright-detail'));
 assert.ok(!x.advice.some(w=>w.code==='possible-softness'));
});
test('black garment on white contrasting background is not automatically judged underexposed',()=>{
 const x=api.analyzePixels(pixels(100,100,(px,py)=>px>20&&px<80&&py>20&&py<80?[10,10,10,255]:[245,245,245,255]),100,100,1600,1600);
 assert.equal(x.advice.some(w=>w.code==='low-light'),false);
});
test('highly patterned image is not forced into softness advice',()=>{
 const x=api.analyzePixels(pixels(96,96,(x,y)=>(x+y)%2?[8,16,20,255]:[239,250,244,255]),96,96,1600,1600);
 assert.equal(x.advice.some(w=>w.code==='possible-softness'),false);
});
test('border interference can suggest a simpler backdrop without claiming garment identity',()=>{
 const x=api.analyzePixels(pixels(128,128,(px,py)=>{
  const outer=px<25||px>=103||py<25||py>=103;
  return outer&&((px+py)%2)?[13,13,13,255]:outer?[238,238,238,255]:[120,120,120,255];
 }),128,128,1600,1600);
 assert.ok(x.advice.some(w=>w.code==='busy-border'));
 assert.ok(x.metrics.borderEdgeFraction>x.metrics.centerEdgeFraction);
 assert.ok(x.notMeasured.includes('garment boundary or cut-off hems'));
});
test('textured garment filling frame is NOT automatically treated as busy background',()=>{
 const x=api.analyzePixels(pixels(128,128,(px,py)=>(px+py)%2?[12,12,12,255]:[243,243,243,255]),128,128,1500,1600);
 assert.equal(x.advice.some(w=>w.code==='busy-border'),false);
});
test('flat-but-valid color and transparent PNG are not forced to retake',()=>{
 const gray=api.analyzePixels(pixels(96,96,()=>[98,98,98,255]),96,96,1600,1600);
 assert.equal(gray.advice.length,0);
 const alpha=api.analyzePixels(pixels(96,96,(x,y)=>x<50?[0,0,0,0]:[130,56,200,255]),96,96,1280,960);
 assert.ok(alpha.metrics.opaqueFraction<.55);
 assert.equal(alpha.advice.some(x=>x.code==='low-light'),false);
});
test('pixel receipts contain no garment pixels, source URLs, fingerprints or owner fields',()=>{
 const x=api.analyzePixels(pixels(64,64,()=>[120,100,80,255]),64,64,512,512);
 assert.ok(x.advice.some(w=>w.code==='limited-resolution'));
 const s=JSON.stringify(x);
 for(const key of ['data:image','base64','signature','filename','owner','sourceUrl'])assert.ok(!s.includes(key),key);
 assert.equal(x.metrics.sampledWidth,64);assert.equal(x.metrics.sourceHeight,512);
});
test('source-level integration keeps original JPEG and human review protections',()=>{
 const fs=require('node:fs'),index=fs.readFileSync('public/index.html','utf8');
 const photo=fs.readFileSync('public/photo-check.js','utf8'),app=fs.readFileSync('public/app.js','utf8');
 assert.match(index,/id="photoQualityResearch73" type="checkbox"/);
 assert.ok(index.indexOf('photo-quality-research.js')<index.indexOf('photo-check.js'));
 assert.match(photo,/const decoded=new Image\(\)/);
 assert.match(photo,/captureGuidance=window\.PhotoQualityResearch\.analyzePixels/);
 assert.match(app,/const reviewFirst836=true;/);
 assert.match(app,/new WeakMap\(\)/);
 assert.match(app,/photoQualityHints73\.set\(item,\{/);
 assert.doesNotMatch(app,/photoQualityHints73\.set\(item\.id/);
 assert.match(app,/owner73===\(typeof window==='undefined'\?null:window\.closetAuth/);
 assert.match(app,/hint73\.source===\(item\.recognitionPhoto\?\.image\|\|item\.image\)/);
 assert.match(app,/Take another photo/);
 assert.match(app,/Keep this photo/);
});
