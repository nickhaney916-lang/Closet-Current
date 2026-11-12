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
 assert.equal(api.VERSION,'P73-1');
});
test('bounded sample rejects corruption, untrusted oversized dimensions and zero pixels',()=>{
 assert.throws(()=>api.analyzePixels(new Uint8Array(4),16,16));
 assert.throws(()=>api.analyzePixels([],0,0));
 assert.throws(()=>api.analyzePixels(new Uint8Array(513*16*4),513,16));
 assert.throws(()=>api.analyzePixels(new Uint8Array(16*16*4),16,16,Infinity,16));
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
 assert.match(app,/owner73===\(typeof window==='undefined'\?null:window\.closetAuth/);
 assert.match(app,/hint73\.source===\(item\.recognitionPhoto\?\.image\|\|item\.image\)/);
 assert.match(app,/Take another photo/);
 assert.match(app,/Keep this photo/);
});
