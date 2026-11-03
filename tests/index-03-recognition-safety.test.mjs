import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {reviewRecognitionForIndex,analyzeVerifiedGarmentColor,verifyOriginalSourceBytes,
 hasOriginalSourceProof} from '../research/index-03/recognition-index-gate.mjs';
const hash='a'.repeat(64),hash2='b'.repeat(64);
const source={verified:true,recognitionFromOriginal:true,sha256:hash,originalWidth:3024,originalHeight:4032};
const make=(category='Bottoms',itemType='Skirt',extra={})=>({strong:true,choices:[{category,itemType,score:.94}],details:{color:'Blue'},...extra});
const check=(recognition=make(),extra={})=>reviewRecognitionForIndex({
 ownerId:'owner-A',recordOwnerId:'owner-A',source,recognition,...extra
});
test('valid photo byte digest checked before any indexing; tampered pixels fail',async()=>{
 const original=new Uint8Array([255,216,3,9,255,217]);const sha=createHash('sha256').update(original).digest('hex');
 const okay=await verifyOriginalSourceBytes(original,sha,webcrypto);
 assert.equal(okay.verified,true);assert.equal(okay.byteLength,6);
 assert.equal((await verifyOriginalSourceBytes(new Uint8Array([255,216,3,8,255,217]),sha,webcrypto)).verified,false);
 assert.throws(()=>verifyOriginalSourceBytes('image',sha,webcrypto),/original source/);
});
test('original unmodified source proof is mandatory; low confidence stays review',()=>{
 assert.equal(hasOriginalSourceProof(source),true);
 assert.equal(hasOriginalSourceProof({...source,recognitionFromOriginal:false}),false);
 assert.equal(check(make('Bottoms','Skirt',{strong:false})).autoIndex,false);
 assert.ok(check(make('Bottoms','Skirt',{strong:false})).reviewReasons.includes('recognition-unconfirmed'));
 const bad=check(make(),{source:{...source,verified:false}});
 assert.equal(bad.autoIndex,false);assert.ok(bad.reviewReasons.includes('original-source-unverified'));
});
test('category/type/slots use only real model catalog, no cross-category coercion',()=>{
 for(const [category,type,slots]of [
  ['Bottoms','Skirt',['bottom']],['Bottoms','Jeans',['bottom']],
  ['Shoes','Sneakers',['shoes']],['Dresses','Casual dress',['top']],
  ['Tops','T-shirt',['top','layer']],['Outerwear','Jacket',['layer','layer2','layer3']]
 ]){let r=check(make(category,type));assert.equal(r.category,category);
  assert.equal(r.itemType,type);assert.deepEqual(r.slotIds,slots);}
 const bad=check(make('Dresses','Skirt'));assert.equal(bad.category,'Uncategorized');
 assert.equal(bad.itemType,'Unknown');assert.equal(bad.autoIndex,false);
});
test('guard known independently measured dangerous subclass confusions',()=>{
 for(const [category,type]of [['Outerwear','Blazer'],['Tops','Tunic'],['Tops','Sweatshirt'],['Shoes','Ankle boots']]){
  const recognition=make(category,type);
  const r=check(recognition);assert.equal(r.autoIndex,false,type);
  assert.ok(r.reviewReasons.includes('confusable-type-needs-independent-confirmation'));
  const positive=check(recognition,{independent:{executed:true,fullVocabulary:true,
   differentViews:true,primary:{category,itemType:type},confirmation:{category,itemType:type}}});
  assert.equal(positive.autoIndex,true,type);
  const mismatch=check(recognition,{independent:{executed:true,fullVocabulary:true,
   differentViews:true,primary:{category,itemType:type},confirmation:{category,itemType:'Other'}}});
  assert.equal(mismatch.autoIndex,false);
 }
});
test('shape-sensitive recovery types require independent agreement; routine ones retain baseline',()=>{
 for(const [category,type,reason]of [
  ['Bottoms','Skirt','skirt_dress_independent_agreement'],
  ['Bottoms','Shorts','bottoms_independent_agreement'],
  ['Outerwear','Coat','coat_near_full_independent_agreement'],
  ['Shoes','Sneakers','skirt_full_catalog_independent_agreement']
 ]){let r=check(make(category,type,{reason,preprocessingRecovery:true}));
  assert.equal(r.autoIndex,false,type);assert.ok(r.needsReview);}
 assert.equal(check(make('Bottoms','Jeans')).autoIndex,true);
 assert.equal(check(make('Shoes','Sneakers')).autoIndex,true);
});
test('multiple garment source needs separate verified segment, never overwrites source identity',()=>{
 let r=check(make('Tops','T-shirt'),{garmentCount:3});
 assert.equal(r.autoIndex,false);assert.ok(r.reviewReasons.includes('cutout-identity-unverified'));
 r=check(make('Tops','T-shirt'),{garmentCount:3,segment:{verified:true,cutoutSHA256:hash2,originalSHA256:hash}});
 assert.equal(r.autoIndex,false);assert.equal(r.sourceKind,'verified-cutout'); // still requires independent per-piece classification
 r=check(make('Tops','T-shirt'),{segment:{clipped:true}});
 assert.ok(r.reviewReasons.includes('clipped-cutout'));
});
test('user corrections survive model guesses, color proposals and owner switches',()=>{
 const existing={ownerId:'owner-A',userAdjusted:true,category:'Bottoms',itemType:'Skirt',color:'Cream'};
 const r=check(make('Dresses','Casual dress'),{existing});
 assert.equal(r.category,'Bottoms');assert.equal(r.itemType,'Skirt');assert.equal(r.color,'Cream');
 assert.equal(r.colorSuggestion,null);assert.equal(r.autoIndex,false);
 assert.throws(()=>check(make(),{recordOwnerId:'owner-B'}),/owner mismatch/);
 assert.throws(()=>check(make(),{existing:{...existing,ownerId:'owner-B'}}),/owner mismatch/);
 assert.ok(!Object.values(r).some(x=>typeof x==='string'&&x.startsWith('data:image/')));
});
test('category-only review remains browseable without automatic subtype or color',()=>{
 const r=check({strong:false,categoryConfirmed:true,choices:[{category:'Dresses',itemType:'Unknown'}]});
 assert.equal(r.category,'Dresses');assert.equal(r.itemType,'Unknown');assert.equal(r.autoIndex,false);
 assert.deepEqual(r.slotIds,['top']);assert.equal(r.color,'Unknown');
});
const makePixels=(rgb,width=20,height=20)=>{let p=new Uint8ClampedArray(width*height*4);for(let i=0;i<p.length;i+=4){p.set([...rgb,255],i);}return p;};
const mask=(n=400)=>Uint8Array.from({length:n},()=>255);
test('color is read only through verified source-matched mask (no background heuristic)',()=>{
 const p=makePixels([255,255,255]);const a=mask();
 for(let y=5;y<15;y++)for(let x=5;x<15;x++){
  const i=(y*20+x)*4;p.set([8,28,86,255],i);
 }
 a.fill(0);
 for(let y=5;y<15;y++)for(let x=5;x<15;x++)a[y*20+x]=255;
 let r=analyzeVerifiedGarmentColor(p,20,20,{mask:a,sourceSHA256:hash,maskSourceSHA256:hash,maskVerified:true});
 assert.equal(r.color,'Navy');assert.equal(r.needsConfirmation,true);assert.equal(r.samplePixels,100);
 r=analyzeVerifiedGarmentColor(p,20,20,{mask:a,sourceSHA256:hash,maskSourceSHA256:hash2,maskVerified:true});
 assert.equal(r.color,null);assert.equal(r.reason,'mask-source-unverified');
});
test('distinguish black/navy, white/cream, gray/beige, red/pink, and multicolor safely',()=>{
 const colors=[
  [[10,11,12],'Black'],[[8,28,86],'Navy'],[[244,244,243],'White'],
  [[244,232,197],'Cream'],[[135,138,137],'Gray'],[[195,170,130],'Beige'],
  [[190,25,28],'Red'],[[240,152,183],'Pink']
 ];
 for(const [rgb,expected] of colors){
  const r=analyzeVerifiedGarmentColor(makePixels(rgb),20,20,{mask:mask(),maskVerified:true,
   sourceSHA256:hash,maskSourceSHA256:hash});
  assert.equal(r.color,expected,'rgb='+rgb);
 }
 const p=makePixels([250,20,20]);
 for(let y=0;y<20;y++)for(let x=10;x<20;x++)p.set([15,85,242,255],(y*20+x)*4);
 const multi=analyzeVerifiedGarmentColor(p,20,20,{mask:mask(),maskVerified:true,
  sourceSHA256:hash,maskSourceSHA256:hash});
 assert.equal(multi.color,'Multicolor');
});
test('poor mask, background-only, clipped or invalid input never becomes confident color',()=>{
 const p=makePixels([40,80,140]);const sparse=Uint8Array.from({length:400},(_,i)=>i<10?255:0);
 assert.equal(analyzeVerifiedGarmentColor(p,20,20,{mask:sparse,maskVerified:true,
  sourceSHA256:hash,maskSourceSHA256:hash}).color,null);
 assert.throws(()=>analyzeVerifiedGarmentColor(p,20,20,{mask:new Uint8Array(8)}),/invalid/);
});
test('source dataset contains at least 15 original licensed, annotated fixture references',()=>{
 const manifest=JSON.parse(readFileSync('benchmark/manifest-reviewed-32.json','utf8'));
 const photoSources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
 assert.ok(manifest.length>=15);assert.ok(photoSources.length>=59);
 assert.ok(manifest.every(x=>x.verified===true&&x.mode==='single'));
 assert.ok(photoSources.every(x=>x.verified&&x.attribution?.license&&/^[0-9a-f]{64}$/.test(x.sha256)));
});
