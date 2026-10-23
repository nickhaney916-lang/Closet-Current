import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSyntheticGarmentOriginal,containGarmentInSlot,hashRetainedOriginalJPEG,prepareVerifiedOriginalDerivative} from '../research/family-alpha-13/garment-photo-preparation.mjs';
import {syntheticGarment,qaCategories} from '../research/family-alpha-13/synthetic-garments.mjs';
import {planPhotoLayers} from '../research/family-alpha-13/reference/family-alpha-2d-layer-plan.mjs';
import {webcrypto} from 'node:crypto';
const key={sourceIdentity:'synthetic-capture',sourceVersion:'sha256-test-version-001'};
const prepare=(sample,opts={})=>prepareSyntheticGarmentOriginal(sample.frame,{category:sample.category,...key,...opts});
for(const kind of qaCategories)test('prepares transparent detailed '+kind+' without touching original',()=>{
 const source=syntheticGarment(kind),before=source.frame.data.slice(),value=prepare(source);
 assert.equal(value.status,'prepared',JSON.stringify({...value,rgba:null}));
 assert.equal(value.category,source.category);
 assert.ok(value.width>25&&value.height>25);
 assert.equal(value.rgba.length,value.width*value.height*4);
 assert.ok(value.backgroundPixels>0);
 assert.equal(value.sourceIdentity,key.sourceIdentity);
 assert.equal(value.sourceVersion,key.sourceVersion);
 assert.equal(value.originalPixelsModified,false);
 assert.equal(value.verifiedOwner,false);
 assert.deepEqual(source.frame.data,before,'retained original is unmodified');
 let originalPixels=0,patternPixels=0,transparent=0;
 for(let y=0;y<value.height;y++)for(let x=0;x<value.width;x++){
  const i=(y*value.width+x)*4;
  const sx=x+value.bounds.left,sy=y+value.bounds.top,j=(sy*source.frame.width+sx)*4;
  if(value.rgba[i+3]>0){
   originalPixels++;
   assert.deepEqual(Array.from(value.rgba.slice(i,i+3)),Array.from(before.slice(j,j+3)),kind+' changed source fabric RGB');
   if(value.rgba[i]===26&&value.rgba[i+1]===210&&value.rgba[i+2]===102)patternPixels++;
  }else transparent++;
 }
 assert.ok(originalPixels>300);assert.ok(patternPixels>40);
 assert.ok(transparent>0);
 assert.equal(value.foregroundPixels,originalPixels);
});
test('source version, item ownership and original photo require external independent attestation',()=>{
 const sample=syntheticGarment('Tops');
 const out=prepare(sample);
 assert.equal(out.requiresOwnerVerification,true);
 assert.equal(out.autoSaved,false);
 assert.equal('ownerId' in out,false);
 assert.equal('url' in out,false);
 assert.equal('originalPhoto' in out,false);
 assert.equal(out.sourceRole,'retained-original');
 assert.equal(prepare(sample,{sourceVersion:'invalid?'}).status,'review');
});
test('uncertain busy background never produces a deceptive transparent garment',()=>{
 for(const c of ['Tops','Shoes','Dresses']){
  const item=syntheticGarment(c,{background:'busy'});
  const v=prepare(item);
  assert.equal(v.status,'review');assert.equal(v.reason,'busy-or-ambiguous-background');
  assert.equal(v.image,null);
 }
});
test('blank, background-colored and tiny garments do not become photo overlays',()=>{
 const blank=syntheticGarment('Tops',{blank:true});
 assert.equal(prepare(blank).reason,'blank-or-indistinguishable-garment');
 const tiny={width:64,height:64,data:new Uint8ClampedArray(64*64*4)};
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const i=(y*64+x)*4;
  tiny.data.set(x>30&&x<35&&y>30&&y<35?[200,20,30,255]:[245,246,247,255],i);
 }
 assert.equal(prepareSyntheticGarmentOriginal(tiny,{category:'Tops',...key}).status,'review');
});
test('invalid frame or malformed mask is refused without touching input bytes',()=>{
 const source=syntheticGarment('Tops'),before=source.frame.data.slice();
 for(const data of [new Uint8Array(3),null])assert.throws(()=>prepareSyntheticGarmentOriginal({...source.frame,data},{category:'Tops',...key}),/Invalid/);
 assert.equal(prepare(source,{mask:new Uint8Array(5)}).reason,'invalid-segmentation-mask');
 assert.deepEqual(source.frame.data,before);
});
test('existing source mask can retain white fabric against white backdrop without changing source',()=>{
 const source=syntheticGarment('Tops',{pattern:false}),mask=source.foreground;
 for(let i=0;i<mask.length;i++)if(mask[i])source.frame.data.set([244,245,246,255],i*4);
 const out=prepare(source,{mask});
 assert.equal(out.status,'prepared');assert.equal(out.sourceRole,'retained-original');
 assert.ok(out.foregroundPixels>100);
});
test('mask containing two unrelated large objects is not silently one shirt',()=>{
 const input=syntheticGarment('Tops',{blank:true}),mask=new Uint8Array(input.frame.width*input.frame.height);
 for(let y=55;y<125;y++)for(let x=18;x<70;x++)mask[y*input.frame.width+x]=1;
 for(let y=155;y<220;y++)for(let x=124;x<168;x++)mask[y*input.frame.width+x]=1;
 const out=prepare(input,{mask});
 assert.equal(out.status,'review');assert.equal(out.reason,'multiple-garments-or-ambiguous-pieces');
});
test('two disconnected shoes from one original frame are retained together',()=>{
 const input=syntheticGarment('Shoes'),out=prepare(input);
 assert.equal(out.status,'prepared');assert.ok(out.foregroundPixels>1000);
 const middleX=Math.floor(out.width/2),centerY=Math.floor(out.height/2);
 assert.equal(out.rgba[(centerY*out.width+middleX)*4+3],0);
});
test('clipped garment touching a photo edge is rejected even if mask found pixels',()=>{
 const input=syntheticGarment('Tops'),mask=new Uint8Array(input.frame.width*input.frame.height);
 for(let y=0;y<100;y++)for(let x=0;x<80;x++)mask[y*input.frame.width+x]=1;
 assert.equal(prepare(input,{mask}).reason,'garment-clipped-by-photo-edge');
});
test('native 1200x1600 garment details remain native resolution and never pixelated by resampling',()=>{
 const input=syntheticGarment('Dresses',{width:1200,height:1600});
 const out=prepare(input);
 assert.equal(out.status,'prepared');
 assert.ok(out.height>900&&out.width>400);
 const rgb=out.rgba.some((v,i)=>i%4===0&&v===26);
 assert.ok(rgb,'Synthetic stripe edges retained in photo-sized RGBA');
});
test('invalid unsupported clothing classifications are not disguised as safe garments',()=>{
 const sample=syntheticGarment('Tops');
 for(const category of ['Accessories','Uncategorized',null,'Dress']){
  const r=prepare(sample,{category});
  assert.equal(r.status,'review');
 }
});
test('PR256 layer contract orders garments correctly with optional jacket, coat and dress conflict',()=>{
 const selection=(slot,id)=>({slot,itemId:id,sourceIdentity:key.sourceIdentity,sourceVersion:key.sourceVersion});
 const layers=planPhotoLayers([selection('layer2','jacket'),selection('top','shirt'),
  selection('shoes','shoes'),selection('layer3','coat'),selection('bottom','pants')]);
 assert.deepEqual(layers.map(x=>x.slot),['shoes','bottom','top','layer2','layer3']);
 assert.throws(()=>planPhotoLayers([selection('dress','dress'),selection('bottom','pants')]),/Dress conflicts/);
 assert.throws(()=>planPhotoLayers([selection('top','shirt'),selection('layer','shirt')]),/duplicate/i);
});
test('photo aspect-fitting to actual PR256 normalized slots NEVER stretches clothing pixels',()=>{
 const kinds=[['top','Tops'],['bottom','Bottoms'],['shoes','Shoes'],['layer2','Outerwear'],['dress','Dresses']];
 const all=planPhotoLayers(kinds.map(([slot,kind],i)=>({slot,itemId:slot+String(i),sourceIdentity:key.sourceIdentity,sourceVersion:key.sourceVersion})).filter(x=>x.slot!=='dress'));
 for(const value of all){
  const kind=kinds.find(x=>x[0]===value.slot)[1],photo=prepare(syntheticGarment(kind));
  const fit=containGarmentInSlot(photo,value);
  assert.ok(fit.width>0&&fit.height>0);
  assert.ok(Math.abs(fit.displayedAspectRatio-fit.originalAspectRatio)<1e-8);
  assert.equal(fit.bodyFitVerified,false);
  assert.ok(fit.width<=360*value.width+1e-8);
  assert.ok(fit.height<=600*value.height+1e-8);
 }
 const dress=planPhotoLayers([{slot:'dress',itemId:'d',...key}].map(x=>({...x,sourceIdentity:key.sourceIdentity,sourceVersion:key.sourceVersion})))[0];
 const fit=containGarmentInSlot(prepare(syntheticGarment('Dresses')),dress);
 assert.ok(Math.abs(fit.displayedAspectRatio-fit.originalAspectRatio)<1e-8);
});
test('invalid placement or unprepared pixels cannot be treated as photographed wearable fit',()=>{
 const photo=prepare(syntheticGarment('Tops'));
 assert.throws(()=>containGarmentInSlot({status:'review'}, {x:.5,y:.5,width:.5,height:.4}),/Invalid/);
 assert.throws(()=>containGarmentInSlot(photo,{x:.5,y:.5,width:0,height:.4}),/Invalid/);
});


test('original retained JPEG SHA binds prepared PNG source and rejects changed full-frame under unchanged crop',async()=>{
 const raw=Buffer.from([255,216,...Array.from({length:100},(_,i)=>i%241),255,217]);
 const raw2=Buffer.from(raw);raw2[52]=73;
 const original='data:image/jpeg;base64,'+raw.toString('base64');
 const other='data:image/jpeg;base64,'+raw2.toString('base64');
 const sha=await hashRetainedOriginalJPEG(original,webcrypto);
 assert.match(sha,/^sha256:[a-f0-9]{64}$/);
 assert.notEqual(sha,await hashRetainedOriginalJPEG(other,webcrypto));
 const sample=syntheticGarment('Tops'),before=sample.frame.data.slice();
 const good=await prepareVerifiedOriginalDerivative(sample.frame,{category:'Tops',sourceIdentity:key.sourceIdentity,
  sourceVersion:sha,originalJPEG:original,cryptoProvider:webcrypto});
 assert.equal(good.status,'prepared');assert.equal(good.verifiedOriginalBytes,true);
 assert.equal(good.verifiedOwner,false);assert.equal(good.sourceSHA,sha);
 const changed=await prepareVerifiedOriginalDerivative(sample.frame,{category:'Tops',sourceIdentity:key.sourceIdentity,
  sourceVersion:sha,originalJPEG:other,cryptoProvider:webcrypto});
 assert.equal(changed.status,'review');assert.equal(changed.reason,'retained-original-version-mismatch');
 assert.deepEqual(sample.frame.data,before);
});
test('wrong JPEG MIME, malformed base64 and invalid SOI or EOI refuse source-derived image',async()=>{
 for(const encoded of ['','data:image/png;base64,/9j/','data:image/jpeg;base64,%%%%',
   'data:image/jpeg;base64,'+Buffer.alloc(100).toString('base64')])
  await assert.rejects(hashRetainedOriginalJPEG(encoded,webcrypto),/Invalid/);
 const value=await prepareVerifiedOriginalDerivative(syntheticGarment('Dresses').frame,{
  category:'Dresses',sourceIdentity:'synthetic',sourceVersion:'sha256:'+'0'.repeat(64),originalJPEG:'data:image/png;base64,AA=='});
 assert.equal(value.status,'review');assert.equal(value.reason,'retained-original-unavailable');
});
