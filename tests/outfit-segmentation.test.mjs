import test from 'node:test';import assert from 'node:assert/strict';
import {clothingLabelMap,clothingMaskGroups,isolateClothingPixels,cropClothingPhotoPixels,garmentDisplayMaskReliability} from '../public/outfit-segmentation.mjs';
function logits(width=20,height=20){const data=new Float32Array(18*width*height);data.fill(-10);for(let i=0;i<width*height;i++)data[i]=10;return {data,dims:[1,18,height,width],paint(label,left,top,w,h){for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){const i=y*width+x;for(let c=0;c<18;c++)data[c*width*height+i]=c===label?10:-10;}}};}
test('one photo yields separate upper clothing, pants and one shoe-pair mask',()=>{
 const l=logits();l.paint(4,5,4,8,5);l.paint(6,6,10,6,5);l.paint(9,6,16,3,3);l.paint(10,10,16,3,3);const map=clothingLabelMap(l.data,l.dims),pieces=clothingMaskGroups(map);assert.deepEqual(pieces.map(x=>x.label),['Upper garment','Bottoms','Shoes']);assert.equal(pieces[2].count,18);
});
test('face, hair, skin and limbs never become garment masks',()=>{
 const l=logits();l.paint(11,5,1,5,4);l.paint(2,4,1,2,4);l.paint(14,2,5,3,4);l.paint(4,7,6,8,5);const map=clothingLabelMap(l.data,l.dims),pieces=clothingMaskGroups(map);assert.equal(pieces.length,1);assert.equal(pieces[0].label,'Upper garment');assert.equal(map.labels[2*20+6],0);
});
test('weak or conflicting segmentation and tiny speckles remain unrecognized',()=>{
 const l=logits();l.paint(4,5,4,8,5);for(let y=4;y<9;y++)for(let x=5;x<13;x++)l.data[7*400+y*20+x]=9.8;l.paint(16,1,1,1,1);assert.equal(clothingMaskGroups(clothingLabelMap(l.data,l.dims)).length,0);
});
test('isolated garment image contains its clothing pixels on a white background',()=>{
 const l=logits();l.paint(4,5,5,6,6);l.paint(11,6,6,2,2);const map=clothingLabelMap(l.data,l.dims),group=clothingMaskGroups(map)[0];const data=new Uint8ClampedArray(20*20*3);for(let i=0;i<data.length;i+=3){data[i]=20;data[i+1]=40;data[i+2]=180;}
 const crop=isolateClothingPixels({data,width:20,height:20,channels:3},map,group);assert.equal(crop.data[0],255);assert.ok(crop.data.some(x=>x===180));const x=6-crop.bounds.left,y=6-crop.bounds.top;assert.deepEqual(Array.from(crop.data.slice((y*crop.width+x)*3,(y*crop.width+x)*3+3)),[255,255,255]);
});
test('garments cut off by the edge are marked for review and malformed output fails safely',()=>{
 const l=logits();l.paint(6,6,12,7,8);const group=clothingMaskGroups(clothingLabelMap(l.data,l.dims))[0];assert.equal(group.clipped,true);assert.throws(()=>clothingLabelMap(l.data,[1,17,20,20]));l.data[0]=NaN;assert.throws(()=>clothingLabelMap(l.data,l.dims));
});

test('photo crops preserve one-pixel fabric texture and detail omitted by a coarse mask',()=>{
 const width=64,height=64,data=new Uint8ClampedArray(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let c=0;c<3;c++)data[(y*width+x)*3+c]=x%2?180:30;
 const selected=new Uint8Array(16);for(const i of [5,6,9])selected[i]=1;
 const map={width:4,height:4},group={selected,bounds:{left:1,top:1,right:3,bottom:3}};
 const image={data,width,height,channels:3},photo=cropClothingPhotoPixels(image,map,group),masked=isolateClothingPixels(image,map,group);
 const pixel=(crop,x,y)=>Array.from(crop.data.slice(((y-crop.bounds.top)*crop.width+x-crop.bounds.left)*3,((y-crop.bounds.top)*crop.width+x-crop.bounds.left)*3+3));
 assert.deepEqual(pixel(photo,40,40),[30,30,30]);assert.deepEqual(pixel(photo,41,40),[180,180,180]);assert.deepEqual(pixel(masked,40,40),[255,255,255]);
 assert.equal(photo.width,36);assert.equal(photo.height,36);
});


test('garment color sampling excludes dominant background and display white',async()=>{
 const {clothingColorSample}=await import('../public/outfit-segmentation.mjs');
 const data=new Uint8ClampedArray(20*20*3).fill(255),selected=new Uint8Array(400);
 for(let y=6;y<14;y++)for(let x=6;x<14;x++){selected[y*20+x]=1;data.set([20,70,210],(y*20+x)*3);}
 const sample=clothingColorSample({data,width:20,height:20,channels:3},{width:20,height:20},{selected,bounds:{left:6,top:6,right:14,bottom:14}});
 assert.equal(sample.sampledPixels,64);
 for(let i=0;i<sample.data.length;i+=4)assert.deepEqual(Array.from(sample.data.slice(i,i+4)),i<64*4?[20,70,210,255]:[0,0,0,0]);
});

test('fragmented clothing mask chooses original crop without deleting source fabric',()=>{
 const width=24,height=24,selected=new Uint8Array(width*height);
 for(let y=4;y<12;y++)for(let x=3;x<11;x++)selected[y*width+x]=1;
 for(let y=4;y<12;y++)for(let x=15;x<19;x++)selected[y*width+x]=1;
 const map={width,height},group={id:7,selected,bounds:{left:3,top:4,right:19,bottom:12},clipped:false};
 const original=new Uint8ClampedArray(width*height*3);
 for(let i=0;i<original.length;i+=3){original[i]=37;original[i+1]=86;original[i+2]=191;}
 const image={width,height,channels:3,data:original},risk=garmentDisplayMaskReliability(map,group);
 assert.equal(risk.reason,'fragmented-mask');assert.equal(risk.useOriginalCrop,true);
 assert.equal(risk.measuresPixelAccuracy,false);
 assert.equal(risk.components,2);
 const raw=cropClothingPhotoPixels(image,map,group);
 const damaged=isolateClothingPixels(image,map,group);
 assert.ok(damaged.data.includes(255),'white mat erases unselected source pixels');
 assert.ok(!raw.data.includes(255),'raw fallback retains the actual photograph');
 assert.deepEqual(image.data,original,'input photo must not be changed');
});
test('intact garment and harmless tiny speckles keep transparent-style white display masking',()=>{
 const width=24,height=24,selected=new Uint8Array(width*height);
 for(let y=4;y<14;y++)for(let x=5;x<15;x++)selected[y*width+x]=1;
 const map={width,height},group={id:4,selected,clipped:false};
 assert.equal(garmentDisplayMaskReliability(map,group).useOriginalCrop,false);
 selected[20*width+20]=1;
 const r=garmentDisplayMaskReliability(map,group);
 assert.equal(r.useOriginalCrop,false);assert.equal(r.components,2);
 assert.ok(r.detachedShare<.02);
 const pair=new Uint8Array(width*height);
 for(let y=6;y<12;y++)for(let x=3;x<9;x++)pair[y*width+x]=1;
 for(let y=6;y<12;y++)for(let x=15;x<21;x++)pair[y*width+x]=1;
 const footwear=garmentDisplayMaskReliability(map,{id:9,selected:pair,clipped:false});
 assert.equal(footwear.reason,'fragmented-mask','keep both shoes visible when disconnected');
 assert.equal(garmentDisplayMaskReliability(map,{...group,clipped:true}).reason,'clipped-frame');
 assert.equal(garmentDisplayMaskReliability(map,{...group,selected:new Uint8Array(width*height)}).reason,'insufficient-mask');
 assert.throws(()=>garmentDisplayMaskReliability(map,{selected:new Uint8Array(2)}),/Invalid/);
});
