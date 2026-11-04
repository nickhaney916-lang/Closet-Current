const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const PhotoColor=require('../public/photo-color.js');
const Details=require('../public/clothing-details.js');
const photo=(fn,w=16,h=16)=>{
 const pixels=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)
  pixels.set([...fn(x,y),255],(y*w+x)*4);
 return pixels;
};
const blank={category:'Tops',itemType:'T-shirt',color:'',sourceSHA256:'a'.repeat(64)};
test('uncertain actual two-tone photo estimate never becomes a saved fact',()=>{
 const sample=photo((x)=>x<8?[5,5,5]:[250,250,250]);
 const color=PhotoColor.estimate(sample,16,16);
 assert.equal(color.color,'Multicolor');
 assert.equal(color.needsConfirmation,true);
 const item=Details.fillColor(blank,color);
 assert.strictEqual(item,blank,'unchanged object, not just empty text');
 assert.equal(item.color,'');assert.equal(item.colorSource,undefined);
});
test('low-support single color from conflicting sample is still a review suggestion',()=>{
 const palette=PhotoColor.estimate(photo((x,y)=>{
  if(x<8)return [20,20,20];
  if(y<8)return [225,225,225];
  return [50,40,200];
 }),16,16);
 assert.equal(palette.needsConfirmation,true);
 assert.strictEqual(Details.fillColor(blank,palette),blank);
});
test('confident uniform real photo estimate still fills color normally',()=>{
 const sample=PhotoColor.estimate(photo(()=>[170,18,22]),16,16);
 assert.equal(sample.color,'Red');
 assert.ok(!sample.needsConfirmation);
 const item=Details.fillColor(blank,sample);
 assert.equal(item.color,'Red');assert.equal(item.colorSource,'photo-estimate');
 assert.equal(item.sourceSHA256,blank.sourceSHA256);
});
test('verified chromatic multicolor remains allowed while neutral ambiguous multicolor requires review',()=>{
 const confident=PhotoColor.estimate(photo((x,y)=>x<8?y<8?[205,14,19]:[10,135,22]:
  y<8?[20,30,175]:[235,205,22]),16,16);
 assert.equal(confident.color,'Multicolor');
 assert.ok(!confident.needsConfirmation);
 assert.equal(Details.fillColor(blank,confident).color,'Multicolor');
 const uncertain={color:'Multicolor',needsConfirmation:true,source:'photo-estimate',support:0.42};
 assert.strictEqual(Details.fillColor(blank,uncertain),blank);
});
test('real masked-color estimate must respect caller uncertainty and keep user-confirmed color',()=>{
 const mask=photo((x,y)=>x<8?[10,30,200]:[20,50,175]);
 const palette=PhotoColor.maskedPalette(mask,16,16);
 assert.equal(palette.needsConfirmation,false);
 const confident={color:palette.primary,needsConfirmation:palette.needsConfirmation,source:'photo-estimate',support:palette.colors[0]?.share};
 assert.equal(Details.fillColor(blank,confident).color,'Blue');
 const human={...blank,color:'Green',colorSource:'user'};
 assert.strictEqual(Details.fillColor(human,confident),human);
 assert.strictEqual(Details.fillColor(human,{color:'Blue',needsConfirmation:true}),human);
});
test('malformed confidence flags, nonfinite support and unsupported colors all fail closed',()=>{
 for(const est of [
  null,{color:'Green',needsConfirmation:'false'},
  {color:'Green',needsConfirmation:1},{color:'Green',support:NaN},
  {color:'Green',support:Infinity},{color:'Green',support:-.01},
  {color:'Green',support:1.01},{color:'Ultraviolet'},
  {color:'Green',needsConfirmation:true,support:.99},
 ]){
  const out=Details.fillColor(blank,est);
  assert.strictEqual(out,blank,JSON.stringify(est));
 }
});
test('unknown field can be filled, existing stored photo color and source cannot be overwritten',()=>{
 const item={...blank,color:'Unknown'};
 const out=Details.fillColor(item,{color:'Brown',support:.8});
 assert.equal(out.color,'Brown');
 const previous={...blank,color:'Gray',colorSource:'photo-estimate',originalPhoto:{image:'private-source-placeholder'}};
 assert.strictEqual(Details.fillColor(previous,{color:'Blue',support:1}),previous);
 assert.deepEqual(previous.originalPhoto,{image:'private-source-placeholder'});
});
test('actual consumer photo/review hooks use the shared corrected helper, not a duplicate bypass',()=>{
 const app=fs.readFileSync('public/app.js','utf8');
 const details=fs.readFileSync('public/clothing-details.js','utf8');
 const check=fs.readFileSync('public/photo-check.js','utf8');
 assert.match(app,/Object\.assign\(item,ClothingDetails\.fillColor\(item,quality\.colorEstimate\)\)/);
 assert.match(app,/ClothingDetails\.fillColor\(value,photo\.maskApplied\?/);
 assert.match(check,/colorEstimate:window\.PhotoColor\?\.estimate\(pixels,16,16\)/);
 assert.match(details,/estimate\.needsConfirmation===true/);
 // Guarantee app does not bypass shared gate with raw uncertain field assignment.
 const matches=[...app.matchAll(/colorSource\s*=\s*['"]photo-estimate['"]/g)];
 assert.equal(matches.length,0,'color source always flows through shared helper');
});
test('original source identity, owner and confirmed corrected category survive color refusal',()=>{
 const item={...blank,ownerId:'owner-A',sourcePieceKey:'a'.repeat(64)+'/seg-4-1',
  category:'Tops',itemType:'Blouse',color:'',colorSource:undefined,confirmed:true,
  originalPhoto:{sha256:'a'.repeat(64),image:'data:image/jpeg;base64,source-placeholder'}};
 const after=Details.fillColor(item,{color:'Blue',needsConfirmation:true});
 assert.strictEqual(after,item);
 assert.equal(after.confirmed,true);assert.equal(after.category,'Tops');
 assert.equal(after.itemType,'Blouse');assert.equal(after.originalPhoto.sha256,item.sourceSHA256);
});