import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyIsolatedGarment,categoryCandidates} from '../public/recognition-engine.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {createRequire} from 'node:module';
import {clothingCropBounds,cropClothingPhotoPixels,clothingColorSample,clothingInteriorColorSample,isolateClothingPixels} from '../public/outfit-segmentation.mjs';

// Controlled logits test admission logic, not FashionCLIP accuracy.
for(const [category,itemType] of [['Shoes','Ankle boots'],['Outerwear','Blazer'],['Tops','Tunic']]){
 test(`mask-assisted ${category}/${itemType} requires the same subtype review as an ordinary photo`,async()=>{
  const candidate=localCandidates.find(x=>x.category===category&&x.itemType===itemType);
  assert.ok(candidate);
  const broad=categoryCandidates.find(x=>x.category===category);
  const model=async(_image,labels)=>labels.includes(broad.label)?[{label:broad.label,score:.98}]:[{label:candidate.label,score:.98}];
  const identified=[];
  const result=await classifyIsolatedGarment(model,{width:50,height:50},{hint:{categories:[category],types:[],confidence:.99,clipped:false},onIdentified:x=>identified.push(x)});
  assert.equal(result.strong,false);
  assert.equal(result.categoryConfirmed,true);
  assert.equal(result.choices[0].category,category);
  assert.equal(result.choices[0].itemType,'Unknown');
  assert.deepEqual(result.details,{});
  assert.deepEqual(identified,[],'unsafe subtype must not escape through a provisional callback');
 });
}

function fixture(){
 const image={width:60,height:80,channels:3,data:new Uint8ClampedArray(60*80*3)};
 for(let i=0;i<image.data.length;i++)image.data[i]=[31,87,169][i%3];
 const selected=new Uint8Array(6*8);for(let y=2;y<6;y++)for(let x=1;x<5;x++)selected[y*6+x]=1;
 return {image,map:{width:6,height:8},group:{selected,bounds:{left:1,top:2,right:5,bottom:6}}};
}
for(const [name,change] of [
 ['zero map width',f=>f.map.width=0],
 ['fractional map height',f=>f.map.height=7.5],
 ['oversized semantic map',f=>f.map.width=513],
 ['negative left bound',f=>f.group.bounds.left=-1],
 ['reversed crop',f=>f.group.bounds.right=0],
 ['empty crop',f=>f.group.bounds.right=1],
 ['outside bottom',f=>f.group.bounds.bottom=9],
 ['nonfinite crop',f=>f.group.bounds.top=NaN],
 ['fractional crop',f=>f.group.bounds.top=1.5],
 ['missing mask',f=>delete f.group.selected],
 ['old mask dimensions',f=>f.group.selected=new Uint8Array(12)],
 ['nonbinary mask',f=>f.group.selected[14]=255],
 ['invalid source dimensions',f=>{f.image.width=-60;f.image.height=-80;}],
 ['wrong source buffer length',f=>f.image.data=new Uint8ClampedArray(3)]
]){
 test(`invalid crop input rejects ${name} before producing pixels or color`,()=>{
  const f=fixture();change(f);
  const functions=/mask/.test(name)?[clothingColorSample,clothingInteriorColorSample,isolateClothingPixels]:[clothingCropBounds,cropClothingPhotoPixels,clothingColorSample,clothingInteriorColorSample,isolateClothingPixels];
  for(const fn of functions)
   assert.throws(()=>fn(f.image,f.map,f.group),/Invalid/);
 });
}
test('native-resolution patterned original crops are exact RGB copies and never mutate their source or mask',()=>{
 const f=fixture();
 for(let y=0;y<f.image.height;y++)for(let x=0;x<f.image.width;x++){
  const i=(y*f.image.width+x)*3;f.image.data.set(x%4<2?[176,21,48]:[14,78,191],i);
 }
 const before=f.image.data.slice(),mask=f.group.selected.slice();
 const out=cropClothingPhotoPixels(f.image,f.map,f.group);
 for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){
  const i=(y*out.width+x)*3,j=((y+out.bounds.top)*f.image.width+x+out.bounds.left)*3;
  assert.deepEqual(out.data.slice(i,i+3),before.slice(j,j+3));
 }
 assert.deepEqual(f.image.data,before);assert.deepEqual(f.group.selected,mask);
});
test('transparent hidden red pixels cannot become confident garment color',()=>{
 const color=createRequire(import.meta.url)('../public/photo-color.js');
 const width=20,height=20,data=new Uint8ClampedArray(width*height*4),selected=new Uint8Array(width*height).fill(1);
 for(let i=0;i<data.length;i+=4)data.set([200,20,25,0],i);
 const image={width,height,channels:4,data},map={width,height},group={selected,bounds:{left:0,top:0,right:width,bottom:height}};
 const before=data.slice(),sample=clothingColorSample(image,map,group);
 assert.equal(color.maskedPalette(sample.data,sample.width,sample.height),null);
 assert.deepEqual(data,before);
});
