'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mask=require('../public/dark-studio-garment-mask.js');
function fixture(){
 const w=120,h=160,d=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++)d.set([25,25,25,255],i*4);
 for(let y=20;y<145;y++)for(let x=25;x<95;x++)d.set([190,30,35,255],(y*w+x)*4);
 // Enclosed dark logo, pale buttons and seam remain original foreground.
 for(let y=60;y<80;y++)for(let x=45;x<70;x++)d.set([25,25,25,255],(y*w+x)*4);
 d.set([240,235,230,255],(100*w+60)*4);
 return {d,w,h};
}
test('dark studio proposal removes only exterior-connected neutral pixels',()=>{
 const {d,w,h}=fixture(),before=Buffer.from(d),r=mask.analyze(d,w,h,{category:'Tops',primaryColor:'Red'});
 assert.equal(r.proposalAvailable,true);assert.equal(r.displayEligible,false);assert.equal(r.eligible,false);
 assert.equal(r.alpha[0],0);assert.equal(r.alpha[70*w+55],255);assert.equal(r.alpha[100*w+60],255);
 assert.deepEqual(Buffer.from(d),before);
});
test('mask application preserves every RGB byte and never increases existing opacity',()=>{
 const {d,w,h}=fixture(),r=mask.analyze(d,w,h,{category:'Tops',primaryColor:'Red'});
 d[(40*w+40)*4+3]=60;
 const out=mask.applyAlpha(d,r.alpha);
 for(let i=0;i<w*h;i++){
  assert.deepEqual([...out.slice(i*4,i*4+3)],[...d.slice(i*4,i*4+3)]);
  assert.ok(out[i*4+3]<=d[i*4+3]);
 }
 assert.notEqual(out,d);assert.equal(out[(40*w+40)*4+3],60);
 assert.throws(()=>mask.applyAlpha(d,new Uint8Array(3)),/Invalid/);
});
test('native soft alpha, unsupported categories and dark/pale fabric remain held',()=>{
 const {d,w,h}=fixture();
 for(const primaryColor of ['Black','White','Gray','Beige',null])
  assert.equal(mask.analyze(d,w,h,{category:'Tops',primaryColor}).proposalAvailable,false);
 for(const category of ['Shoes','Bottoms','Other','__proto__'])
  assert.equal(mask.analyze(d,w,h,{category,primaryColor:'Red'}).proposalAvailable,false);
 d[3]=128;assert.equal(mask.analyze(d,w,h,{category:'Tops',primaryColor:'Red'}).proposalAvailable,false);
});
test('clutter at border and separate foreground items cannot become approved cutouts',()=>{
 const {d,w,h}=fixture();
 for(let y=0;y<h;y++)d.set([180,60,40,255],y*w*4);
 assert.equal(mask.analyze(d,w,h,{category:'Tops',primaryColor:'Red'}).proposalAvailable,false);
 const f=fixture();
 for(let y=35;y<55;y++)for(let x=5;x<15;x++)f.d.set([180,60,40,255],(y*w+x)*4);
 assert.equal(mask.analyze(f.d,f.w,f.h,{category:'Tops',primaryColor:'Red'}).reason,'multiple-foreground-regions');
});
test('invalid or oversized buffers rejected before queue allocation',()=>{
 for(const [w,h,d] of [[0,100,new Uint8Array(0)],[500,500,new Uint8Array(1000000)],
  [120,160,new Uint8Array(3)],[NaN,160,new Uint8Array(0)]])
  assert.throws(()=>mask.analyze(d,w,h,{category:'Tops',primaryColor:'Red'}),/Invalid/);
});
test('proposal code has no network, persistence, generated pixels or default display activation',()=>{
 const text=fs.readFileSync('public/dark-studio-garment-mask.js','utf8');
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|https:\/\//.test(text));
 assert.match(text,/displayEligible:false/);assert.match(text,/requiresIndependentMaskReview:true/);
 assert.match(fs.readFileSync('public/index.html','utf8'),/src="dark-studio-garment-mask.js"/);
});
