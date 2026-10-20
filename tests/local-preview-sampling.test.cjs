'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Sampling=require('../public/local-preview-sampling.js');

test('high-DPI previously transparent garments retain more display samples within 1MP',()=>{
 const old=Sampling.size(1400,2100,1);
 const retina=Sampling.size(1400,2100,3);
 assert.ok(old.pixels<=600000&&old.pixels>=590000);
 assert.ok(retina.pixels>old.pixels*1.5&&retina.pixels<=1000000);
 assert.ok(retina.width>old.width&&retina.height>old.height);
 assert.ok(retina.width<=1400&&retina.height<=2100);
 assert.equal(retina.recognitionOriginalChanged,false);
 assert.equal(retina.masksAutoApproved,false);
 assert.equal(retina.figureFitVerified,false);
});
test('small native cutouts never upscale or stretch and odd DPR values are bounded',()=>{
 const original=Sampling.size(92,146,3);
 assert.equal(original.width,92);assert.equal(original.height,146);
 assert.deepEqual(
  {width:Sampling.size(1200,1500,1.9).width,height:Sampling.size(1200,1500,1.9).height},
  {width:Sampling.size(1200,1500,1).width,height:Sampling.size(1200,1500,1).height}
 );
 assert.equal(Sampling.size(1200,1500,Infinity).retina,false);
 for(const dim of [[0,100],[100,0],[10,100],[2000,2000.5],[5000,5000]])
  assert.equal(Sampling.size(...dim,3),null);
});
test('transparent rendering uses new sampler and original recognition does not use the new sampling policy',()=>{
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 const app=fs.readFileSync('public/app.js','utf8');
 const before=html.indexOf('<script src="local-preview-sampling.js">');
 const after=html.indexOf('<script src="reusable-figure-preview.js">');
 assert.ok(before>=0&&after>before);
 assert.ok(ui.includes('root.ClosetPreviewSampling?.size(w,h,root.devicePixelRatio)'));
 assert.ok(ui.indexOf('root.ClosetPreviewSampling?.size(w,h,root.devicePixelRatio)')>
  ui.indexOf('if(white?.hasTransparentBackground(pixels.data,c.width,c.height))'));
 assert.ok(ui.includes('const scale=Math.min(1,Math.sqrt(150000/(w*h)))'));
 assert.ok(app.includes('function recognitionSourcePhoto('));
 assert.ok(!app.includes('ClosetPreviewSampling'));
});
