import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import PhotoColor from '../public/photo-color.js';
import {assessCropBackdropRisk85} from '../research/crop-background-color-safety-85/color-safety.mjs';
const draw=(border,center,alpha=255)=>{
 const size=48,p=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const rgb=x<10||x>=38||y<10||y>=38?border:center;
  p.set([...rgb,alpha],4*(y*size+x));
 }
 return p;
};
test('COLOR85 white background outvotes blue garment in raw crop but is withheld as pixel suggestion',()=>{
 const p=draw([255,255,255],[19,39,218]);
 assert.equal(PhotoColor.maskedPalette(p,48,48).primary,'White');
 assert.deepEqual(assessCropBackdropRisk85(p,48,48,PhotoColor.family),
  {unsafeToSuggestColor:true,reason:'background-may-dominate-crop'});
});
test('COLOR85 solid red garment crop has no invented background conflict',()=>{
 const p=draw([219,10,20],[219,10,20]);
 assert.equal(assessCropBackdropRisk85(p,48,48,PhotoColor.family).unsafeToSuggestColor,false);
});
test('COLOR85 truly transparent masked edges cannot be mistaken for an opaque backdrop',()=>{
 const p=draw([255,255,255],[15,50,235]);
 for(let y=0;y<48;y++)for(let x=0;x<48;x++)
  if(x<10||x>=38||y<10||y>=38)p[(y*48+x)*4+3]=0;
 assert.equal(assessCropBackdropRisk85(p,48,48,PhotoColor.family).unsafeToSuggestColor,false);
});
test('COLOR85 invalid pixels fail closed, not treated as color accuracy',()=>{
 assert.throws(()=>assessCropBackdropRisk85(new Uint8Array(6),48,48,PhotoColor.family),/invalid/);
 assert.throws(()=>assessCropBackdropRisk85(draw([0,0,0],[0,0,0]),48,48,null),/invalid/);
});
test('COLOR85 verified licensed real JPEG pixels are evaluated without pretending to have independent human color labels',async()=>{
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const source=sources.find(x=>x.id==='commons-0003');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 const raw=await sharp(bytes).rotate().resize(48,48).ensureAlpha().raw().toBuffer();
 const result=assessCropBackdropRisk85(raw,48,48,PhotoColor.family);
 assert.equal(typeof result.unsafeToSuggestColor,'boolean');
 assert.ok(result.reason===null||result.reason==='background-may-dominate-crop');
});
test('COLOR85 UI warns of background conflict, prevents secondary unmasked pixel fallback, and preserves human-confirmed details',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(s,/backdropRisk85\?\.unsafeToSuggestColor\?null:boundedCropColor46/);
 assert.match(s,/!result\.color&&!backdropRisk85\?\.unsafeToSuggestColor&&typeof window\.checkPhoto/);
 assert.match(s,/dataset\.colorRisk85='review-required'/);
 assert.match(s,/Nothing was auto-filled/);
 assert.match(s,/p\.color=v\.trim\(\);p\.confirmed=false/);
});
