import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {evaluateOriginalRegionColor,composeOfflineGarmentIndex} from '../research/original-color/shadow-corroborated-color.mjs';
const PhotoColor=createRequire(import.meta.url)('../public/photo-color.js');
const colors={
 Red:{lit:[220,30,30],shade:[42,7,10]},
 Blue:{lit:[30,75,210],shade:[14,24,50]},
 Green:{lit:[30,200,65],shade:[9,50,20]},
 Purple:{lit:[135,40,180],shade:[34,8,46]},
 Orange:{lit:[230,100,24],shade:[52,23,5]},
 Yellow:{lit:[220,195,20],shade:[55,50,5]},
 Pink:{lit:[220,60,160],shade:[55,8,40]}
};
const pixel=(width,height,paint)=>{
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set(paint(x,y),4*(y*width+x));
 return {width,height,channels:4,data};
};
const make=(name,{shadow=0,background=false}={})=>{
 const c=colors[name],width=48,height=64,mask=new Uint8Array(width*height);
 const f=pixel(width,height,(x,y)=>{
  const garment=background?x>=10&&x<38&&y>=5&&y<60:true;
  mask[y*width+x]=garment?1:0;
  if(!garment)return [15,110,245,255]; // competing bright blue background
  const lit=x<Math.round(width*(1-shadow));
  return [...(lit?c.lit:c.shade),255];
 });
 return {frame:f,mask};
};
const evalColor=(frame,mask)=>evaluateOriginalRegionColor(frame,{mask,family:PhotoColor.family,
  sourceRole:'original-instance'});
for(const colorName of Object.keys(colors)){
 test(colorName+' full-lit original retained by conservative source palette',()=>{
  const {frame,mask}=make(colorName);
  const before=frame.data.slice(),r=evalColor(frame,mask);
  assert.equal(r.color,colorName,JSON.stringify(r));assert.equal(r.status,'verified-color');
  assert.equal(r.needsConfirmation,false);assert.equal(r.shadowRecoveredPixels,0);
  assert.deepEqual(frame.data,before);
 });
 test(colorName+' shadowed garment recovers chromatic family using independent lit source anchor',()=>{
  const {frame,mask}=make(colorName,{shadow:.75});
  const raw=PhotoColor.maskedPalette(frame.data,frame.width,frame.height);
  assert.notEqual(raw.primary,colorName,'Fixture must actually challenge existing palette');
  const r=evalColor(frame,mask);
  assert.equal(r.color,colorName,JSON.stringify(r));
  assert.equal(r.status,'verified-color');
  assert.ok(r.shadowRecoveredPixels>0);
  assert.equal(r.sourceRole,'original-instance');
 });
 test(colorName+' original mask excludes blue background and preserves source RGBA details',()=>{
  const {frame,mask}=make(colorName,{shadow:.70,background:true});
  const source=frame.data.slice();
  const result=evalColor(frame,mask);
  assert.equal(result.status,'verified-color',JSON.stringify(result));
  assert.equal(result.color,colorName,JSON.stringify(result));
  assert.deepEqual(frame.data,source);
  assert.ok(result.coverage<.6);
 });
}
test('unanchored dark chromatic fabric is REVIEW rather than invented bright red',()=>{
 const frame=pixel(40,40,()=>[40,6,7,255]);
 const r=evalColor(frame,new Uint8Array(40*40).fill(1));
 assert.equal(r.status,'review');assert.equal(r.reason,'shadow-hue-unanchored');
 assert.equal(r.indexingReady,false);
});
test('true black and gray under constant source light remain BLACK and GRAY',()=>{
 for(const [rgb,name]of [[[14,14,14,255],'Black'],[[112,112,112,255],'Gray']]){
  const frame=pixel(48,48,()=>rgb),r=evalColor(frame,null);
  assert.equal(r.color,name,JSON.stringify(r));assert.equal(r.status,'verified-color');
 }
});
test('mostly gray shadows with substantial full-white source anchor retain White',()=>{
 const frame=pixel(40,40,(x,y)=>x<12?[245,245,245,255]:[130,130,130,255]);
 const raw=PhotoColor.maskedPalette(frame.data,40,40),r=evalColor(frame,null);
 assert.equal(raw.primary,'Gray');assert.equal(r.color,'White',JSON.stringify(r));
 assert.equal(r.status,'verified-color');assert.ok(r.whiteShadowRecoveredPixels>0);
});
test('gray fabric with small white highlight is withheld, not promoted to White',()=>{
 const frame=pixel(40,40,(x,y)=>x<8?[244,244,244,255]:[110,110,110,255]);
 const r=evalColor(frame,null);assert.equal(r.status,'review');
 assert.equal(r.reason,'neutral-lighting-ambiguous');
});
test('red-blue patterned original is Multicolor and needs pattern confirmation',()=>{
 const frame=pixel(48,48,(x)=>x<24?[220,30,30,255]:[30,75,210,255]);
 const r=evalColor(frame,null);
 assert.equal(r.status,'review');assert.equal(r.color,'Multicolor');
 assert.equal(r.needsConfirmation,true);
 assert.equal(r.patternHint,'multiple-colors-not-pattern-proof');
 assert.equal(r.indexingReady,false);
});
test('fully transparent red/green buffers can never become clothing colors',()=>{
 const frame=pixel(48,48,(x)=>x<24?[220,30,30,0]:[20,210,60,0]);
 const r=evalColor(frame,null);
 assert.equal(r.status,'review');assert.equal(r.reason,'insufficient-original-region-pixels');
});
test('alpha-skipped bright background is not counted for shadowed garment',()=>{
 const frame=pixel(48,48,(x,y)=>x<28?(x<10?[220,30,30,255]:[42,7,10,255]):[25,180,255,0]);
 const mask=new Uint8Array(48*48).fill(1),r=evalColor(frame,mask);
 assert.equal(r.color,'Red',JSON.stringify(r));
 assert.ok(r.coverage<.65);
});
test('tiny unrelated foreground mask is unverified and background cannot auto-index',()=>{
 const frame=pixel(48,48,()=>[230,20,30,255]),mask=new Uint8Array(48*48);
 for(let i=0;i<50;i++)mask[i]=1;
 assert.equal(evalColor(frame,mask).status,'review');
});
test('source fidelity: large RGBA source has identical bytes after bounded sampling',()=>{
 const frame=pixel(1024,768,(x,y)=>(x+y)%5===0?[30,75,210,255]:[14,24,50,255]);
 const original=frame.data.slice(),r=evaluateOriginalRegionColor(frame,{
  family:PhotoColor.family,sourceRole:'original-whole',maxSamples:150_000,
  expectedSourceSHA:'a'.repeat(64)});
 assert.equal(r.color,'Blue',JSON.stringify(r));assert.deepEqual(frame.data,original);
 assert.equal(r.sourceSHA,'a'.repeat(64));
});
test('wrong source role, bad SHA, corrupt masks, invalid channel array fail closed',()=>{
 const f=pixel(32,32,()=>[220,30,30,255]);
 assert.throws(()=>evaluateOriginalRegionColor(f,{family:PhotoColor.family,sourceRole:'display-mask'}),/original-source role/);
 assert.throws(()=>evaluateOriginalRegionColor(f,{family:PhotoColor.family,expectedSourceSHA:'invalid'}),/source version/);
 assert.throws(()=>evaluateOriginalRegionColor(f,{family:PhotoColor.family,mask:new Uint8Array(14)}),/instance mask/);
 assert.throws(()=>evaluateOriginalRegionColor({...f,data:new Uint8Array(4)},{family:PhotoColor.family}),/Invalid/);
});
test('category type color are mandatory; unknown subtype is explicit review and no fabricated material',()=>{
 const frame=pixel(40,40,()=>[220,30,30,255]),color=evalColor(frame,null);
 const categoryReview={categoryConfirmed:true,choices:[{category:'Tops',itemType:'Unknown'}]};
 const a=composeOfflineGarmentIndex(categoryReview,color,{sourceVersion:'a'.repeat(64)});
 assert.equal(a.category,'Tops');assert.equal(a.itemType,'Unknown');assert.equal(a.color,'Red');
 assert.equal(a.status,'category-color-only');assert.equal(a.autoSave,false);assert.equal(a.optionalAttributesDeferred,true);
 const b=composeOfflineGarmentIndex({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]},color);
 assert.equal(b.status,'verified-core');assert.equal(b.itemType,'T-shirt');
 const wrong=composeOfflineGarmentIndex({strong:true,choices:[{category:'Shoes',itemType:'Sneakers'}]},
  {status:'review',color:'Unknown',indexingReady:false});
 assert.equal(wrong.status,'review');assert.equal(wrong.autoSave,false);
});
test('classification color and source changes do not mutate user-corrected original item',()=>{
 const item={id:'synthetic',category:'Shoes',itemType:'Sneakers',color:'White',colorSource:'user',image:'fake-src'};
 const before=structuredClone(item),f=pixel(40,40,()=>[220,30,30,255]);
 composeOfflineGarmentIndex({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]},evalColor(f,null),{originalPhoto:item.image});
 assert.deepEqual(item,before);
});
