import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {family76,sampleMask76,analyzeColor76,proposalMatches76,COLOR76_FLAG} from '../public/garment-color-76.mjs';
const require=createRequire(import.meta.url),legacy=require('../public/photo-color.js');
const SHA1='a'.repeat(64),SHA2='b'.repeat(64),SHA3='c'.repeat(64);
const binding={ownerId:'synthetic-owner-A',requestId:'synthetic-job-A',sourceSha256:SHA1,maskSha256:SHA2};
function fixture(w,h,fn,maskFn=()=>true){
 const data=new Uint8ClampedArray(w*h*3),selected=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const [r,g,b]=fn(x,y),i=y*w+x;data.set([r,g,b],i*3);selected[i]=maskFn(x,y)?1:0;
 }
 return {image:{width:w,height:h,channels:3,data},map:{width:w,height:h},group:{selected,clipped:false}};
}
function run(f){return analyzeColor76(sampleMask76(f.image,f.map,f.group),binding);}
function sampleRGBA(w,h,fn){
 const data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)data.set(fn(x,y),(y*w+x)*4);
 return data;
}
test('explicit flag and owner/photo/mask/request binding protect cross-owner and stale proposals',()=>{
 assert.equal(COLOR76_FLAG,'color76');
 const p=run(fixture(24,24,()=>[20,40,100]));
 assert.equal(p.status,'review');
 assert.equal(proposalMatches76(p,binding),true);
 for(const changes of [{ownerId:'synthetic-owner-B'},{requestId:'other-job'},{sourceSha256:SHA3},{maskSha256:SHA3}])
  assert.equal(proposalMatches76(p,{...binding,...changes}),false);
 assert.equal(analyzeColor76({pixels:new Uint8ClampedArray(400),width:10,height:10},{}).status,'abstain');
});
test('legacy baseline calls remain unchanged and hard cases expose measurable fixture differences',()=>{
 for(const [rgb,legacyColor,candidateColor] of [
  [[10,24,53],'Black','Blue'],[[239,232,218],'White','Beige']
 ]){
  assert.equal(legacy.family(...rgb),legacyColor);
  assert.equal(family76(...rgb),candidateColor);
  const f=fixture(32,32,()=>rgb),result=run(f);
  assert.equal(result.proposedPrimary,candidateColor);
  assert.equal(result.status,'review');
 }
});
test('legitimate all-black and white garments are not discarded as shadow and glare',()=>{
 for(const [rgb,color] of [[[5,5,6],'Black'],[[248,248,248],'White']]){
  const p=run(fixture(32,32,()=>rgb));
  assert.equal(p.proposedPrimary,color);
  assert.equal(p.pixelSupport,1);
  assert.ok(!p.reasons.includes('shadow_or_highlight_attenuation'));
 }
});
test('background pixels outside a real garment mask never become garment color',()=>{
 const f=fixture(32,32,(x,y)=>x>=6&&x<26&&y>=6&&y<26?[20,90,190]:[240,240,240],(x,y)=>x>=6&&x<26&&y>=6&&y<26);
 const p=run(f);assert.equal(p.proposedPrimary,'Blue');assert.equal(p.proposedSecondary,null);
 assert.ok(p.maskFraction<.5);assert.equal(p.validPixels,324);
});
test('edge erosion excludes a contrasting boundary when a safe interior exists',()=>{
 const f=fixture(32,32,(x,y)=>x===0||y===0||x===31||y===31?[240,240,240]:[25,90,190]);
 const sampled=sampleMask76(f.image,f.map,f.group),p=analyzeColor76(sampled,binding);
 assert.equal(sampled.eroded,true);assert.equal(p.proposedPrimary,'Blue');
 assert.equal(p.proposedSecondary,null);
});
test('chromatic two-tone clothing exposes meaningful second color but no automatic owner approval',()=>{
 const f=fixture(32,32,(x)=>x<22?[30,95,200]:[210,35,35]);
 const p=run(f);
 assert.equal(p.proposedPrimary,'Blue');assert.equal(p.proposedSecondary,'Red');
 assert.equal(p.multicolor,true);assert.equal(p.status,'review');
 assert.ok(p.pixelSupport<.75);
});
test('transparent foreground and tiny/clipped regions abstain or require review',()=>{
 const all=fixture(32,32,()=>[30,95,200]);const rgba=new Uint8ClampedArray(32*32*4);
 for(let i=0;i<32*32;i++)rgba.set([30,95,200,80],i*4);
 assert.equal(analyzeColor76({pixels:rgba,width:32,height:32},binding).status,'abstain');
 const f=fixture(32,32,()=>[40,120,60],(x,y)=>x<5&&y<5);
 assert.equal(run(f).status,'abstain');
 all.group.clipped=true;
 assert.ok(run(all).reasons.includes('clipped_garment'));
});
test('invalid buffers and dimensions fail closed instead of inventing mask pixels',()=>{
 const f=fixture(32,32,()=>[20,80,200]);
 for(const mutate of [
  f=>f.image.data=new Uint8ClampedArray(4),
  f=>f.map.width=513,
  f=>f.group.selected=new Uint8Array(2),
  f=>f.image.width=999999
 ]){
  const x={image:{...f.image},map:{...f.map},group:{...f.group}};mutate(x);assert.throws(()=>sampleMask76(x.image,x.map,x.group));
 }
 assert.equal(analyzeColor76({pixels:new Uint8ClampedArray(3),width:32,height:32},binding).status,'abstain');
});
test('color reasoning tolerates extreme shadow on a saturated garment without dropping its evidence',()=>{
 const f=fixture(32,32,(x)=>x<4?[3,3,4]:[30,95,200]);const p=run(f);
 assert.equal(p.proposedPrimary,'Blue');assert.ok(p.reasons.includes('shadow_or_highlight_attenuation'));
});
test('baseline and research proposal are separate: review only, with no wardrobe mutation',()=>{
 const f=fixture(32,32,()=>[80,100,40]),before=structuredClone(f);
 const p=run(f);
 assert.equal(p.source,'photo-pixel-research');assert.equal(p.status,'review');
 assert.deepEqual(f,before);
});
test('app and worker research switch is explicitly opt-in and cannot auto-save a color',async()=>{
 const fs=await import('node:fs/promises');
 const capture=await fs.readFile('public/outfit-capture.js','utf8');
 const worker=await fs.readFile('public/outfit-worker.mjs','utf8');
 assert.match(capture,/const outfitColor76=outfitUnits70&&/);
 assert.match(capture,/color76:true,ownerId:job.ownerId/);
 assert.match(capture,/sourceSha256===p.reconciliation70\?\.sourceSha256/);
 assert.match(capture,/NOT applied/);
 assert.match(worker,/request.color76===true&&request.instanceReview70===true/);
 assert.match(worker,/piece.colorResearch76=/);
 assert.doesNotMatch(worker,/piece.colorEstimate\s*=\s*color76/);
});
