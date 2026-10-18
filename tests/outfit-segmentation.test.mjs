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
 assert.equal(footwear.reason,null,'a complete left-right shoe pair can remain two masked islands');
 assert.equal(footwear.useOriginalCrop,false);
 assert.equal(footwear.pairedFootwear,true);
 assert.equal(garmentDisplayMaskReliability(map,{...group,clipped:true}).reason,'clipped-frame');
 assert.equal(garmentDisplayMaskReliability(map,{...group,selected:new Uint8Array(width*height)}).reason,'insufficient-mask');
 assert.throws(()=>garmentDisplayMaskReliability(map,{selected:new Uint8Array(2)}),/Invalid/);
});

test('shoe-pair display handling rejects shadows, torn footwear, partial crops and non-shoe masks',()=>{
 const width=40,height=32,map={width,height};
 const shape=(a,b)=>{const selected=new Uint8Array(width*height);for(const [x0,y0,x1,y1]of [a,b])
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)selected[y*width+x]=1;return selected;};
 const left=[4,11,12,19],right=[22,11,30,19],pair=shape(left,right);
 const group=(selected,id=9,clipped=false)=>({id,selected,clipped});
 assert.equal(garmentDisplayMaskReliability(map,group(pair)).pairedFootwear,true);
 assert.equal(garmentDisplayMaskReliability(map,group(pair,7)).reason,'fragmented-mask',
  'detached pieces of a pale dress must still use the intact original crop');
 assert.equal(garmentDisplayMaskReliability(map,group(pair,9,true)).reason,'clipped-frame');
 const smallShadow=shape(left,[26,14,28,18]);
 const shadow=garmentDisplayMaskReliability(map,group(smallShadow));
 assert.equal(shadow.pairedFootwear,false);
 assert.equal(shadow.useOriginalCrop,false,'tiny speck alone does not destroy a valid shoe mask');
 const uneven=shape(left,[22,11,25,19]);
 assert.equal(garmentDisplayMaskReliability(map,group(uneven)).reason,'fragmented-mask');
 const stacked=shape(left,[22,22,30,30]);
 assert.equal(garmentDisplayMaskReliability(map,group(stacked)).reason,'fragmented-mask');
 const touching=shape(left,[12,11,20,19]);
 assert.equal(garmentDisplayMaskReliability(map,group(touching)).pairedFootwear,false);
});
test('both separated shoes preserve original RGB only inside their semantic cutout',()=>{
 const width=40,height=32,map={width,height},selected=new Uint8Array(width*height);
 for(const left of [4,22])for(let y=11;y<19;y++)for(let x=left;x<left+8;x++)selected[y*width+x]=1;
 const group={id:9,selected,clipped:false,bounds:{left:4,top:11,right:30,bottom:19}};
 const data=new Uint8ClampedArray(width*height*3);
 for(let i=0;i<data.length;i+=3)data.set([20,80,195],i);
 const photo={width,height,channels:3,data},before=data.slice();
 const risk=garmentDisplayMaskReliability(map,group);
 assert.equal(risk.useOriginalCrop,false);
 const out=isolateClothingPixels(photo,map,group);
 const at=(x,y)=>[...out.data.slice(((y-out.bounds.top)*out.width+x-out.bounds.left)*3,
  ((y-out.bounds.top)*out.width+x-out.bounds.left)*3+3)];
 assert.deepEqual(at(6,15),[20,80,195]);
 assert.deepEqual(at(25,15),[20,80,195]);
 assert.deepEqual(at(16,15),[255,255,255],'the space between shoes stays masked');
 assert.deepEqual(data,before,'original source bytes remain unchanged');
});

test('large enclosed footwear gap keeps untouched source crop instead of erasing the panel',()=>{
 const width=40,height=40,selected=new Uint8Array(width*height);
 for(let y=6;y<34;y++)for(let x=6;x<34;x++)selected[y*width+x]=1;
 for(let y=16;y<23;y++)for(let x=16;x<23;x++)selected[y*width+x]=0;
 const map={width,height,labels:new Uint8Array(width*height)},group={
  id:9,selected,clipped:false,bounds:{left:6,top:6,right:34,bottom:34}
 };
 const risk=garmentDisplayMaskReliability(map,group);
 assert.equal(risk.components,1,'the outer garment region remains contiguous');
 assert.equal(risk.reason,'unexplained-enclosed-gap');
 assert.equal(risk.largestUnexplainedHole,49);
 assert.equal(risk.useOriginalCrop,true);
 assert.equal(risk.measuresPixelAccuracy,false);
 const data=new Uint8ClampedArray(width*height*3);
 for(let i=0;i<data.length;i+=3)data.set([22,65,199],i);
 const image={data,width,height,channels:3},source=data.slice();
 const whiteMatte=isolateClothingPixels(image,map,group);
 const untouched=cropClothingPhotoPixels(image,map,group);
 assert.ok(whiteMatte.data.includes(255),'the model would erase a source-color panel');
 assert.ok(!untouched.data.includes(255),'the safe preview retains original fabric pixels');
 assert.deepEqual(data,source,'neither display route mutates saved pixels');
});
test('real openings, visible underlayers and tiny pinholes never fabricate missing fabric',()=>{
 const width=32,height=32,selected=new Uint8Array(width*height);
 for(let y=4;y<28;y++)for(let x=4;x<28;x++)selected[y*width+x]=1;
 const gap=[...Array(6).keys()].flatMap(y=>[...Array(6).keys()].map(x=>(y+13)*width+x+13));
 for(const i of gap)selected[i]=0;
 const map={width,height,labels:new Uint8Array(width*height),semanticLabels:new Uint8Array(width*height)};
 const group={id:7,selected,clipped:false};
 assert.equal(garmentDisplayMaskReliability(map,group).reason,'unexplained-enclosed-gap');
 map.semanticLabels[gap[10]]=11; // Confident visible skin: legitimate clothing opening.
 assert.equal(garmentDisplayMaskReliability(map,group).useOriginalCrop,false);
 map.semanticLabels[gap[10]]=0;map.labels[gap[10]]=4; // Known other garment.
 assert.equal(garmentDisplayMaskReliability(map,group).useOriginalCrop,false);
 map.labels[gap[10]]=0;
 selected[gap[1]]=1;for(const i of gap)selected[i]=1;
 selected[20*width+20]=0; // Legitimately insignificant one-cell hole.
 const small=garmentDisplayMaskReliability(map,group);
 assert.equal(small.useOriginalCrop,false);
 assert.equal(small.largestUnexplainedHole,1);
 for(let x=4;x<16;x++)selected[16*width+x]=0; // Opening to outside of mask.
 assert.equal(garmentDisplayMaskReliability(map,group).useOriginalCrop,false);
 assert.throws(()=>garmentDisplayMaskReliability({width,height,semanticLabels:new Uint8Array(3)},group),/Invalid/);
 assert.throws(()=>garmentDisplayMaskReliability(map,group,{maxEnclosedHoleShare:0}),/Invalid/);
});

test('uncertain cutout display crop retains original hem beyond recognition margin',()=>{
 const width=128,height=128,map={width:32,height:32},selected=new Uint8Array(32*32);
 // Model identifies main top from x=10..21, y=8..20, but its hem extends
 // beyond the inaccurate predicted bounds (the original pixels still exist).
 for(let y=8;y<21;y++)for(let x=10;x<22;x++)selected[y*32+x]=1;
 const group={id:4,selected,clipped:false,bounds:{left:10,top:8,right:22,bottom:21}};
 const data=new Uint8ClampedArray(width*height*3);
 for(let i=0;i<data.length;i+=3)data.set([244,244,244],i);
 // Blue original hem at y=89: outside 5% crop, inside wider 12% display crop.
 for(let y=87;y<90;y++)for(let x=46;x<82;x++)data.set([29,61,185],(y*width+x)*3);
 const image={width,height,channels:3,data},before=data.slice();
 const recognition=cropClothingPhotoPixels(image,map,group);
 const display=cropClothingPhotoPixels(image,map,group,{marginFraction:.12});
 assert.ok(recognition.bounds.top>0&&recognition.bounds.top<display.bounds.top+10);
 assert.ok(recognition.bounds.top>display.bounds.top);
 assert.ok(recognition.bounds.height<display.bounds.height);
 assert.ok(recognition.bounds.top+recognition.height<=87,
  'recognition bounds stay unchanged at five percent');
 assert.ok(display.bounds.top+display.height>=90,
  'wider original-pixel fallback can retain the known photographed hem');
 assert.equal(display.data.filter((v,i)=>i%3===2&&v===185).length,3*36);
 assert.equal(recognition.data.includes(185),false,
  'the recognition crop and its content remain exactly as before');
 assert.deepEqual(data,before,'no user image is modified or AI-generated');
});
test('photo crop margins are bounded and clipped safely at the original frame',()=>{
 const width=64,height=64,map={width:16,height:16},data=new Uint8ClampedArray(width*height*3).fill(60),
 group={id:9,selected:new Uint8Array(16*16),bounds:{left:0,top:0,right:12,bottom:12},clipped:true};
 const image={data,width,height,channels:3};
 const narrow=cropClothingPhotoPixels(image,map,group),wide=cropClothingPhotoPixels(image,map,group,{marginFraction:.12});
 assert.equal(narrow.bounds.left,0);assert.equal(narrow.bounds.top,0);
 assert.equal(wide.bounds.left,0);assert.equal(wide.bounds.top,0);
 assert.ok(wide.width>=narrow.width&&wide.height>=narrow.height);
 assert.throws(()=>cropClothingPhotoPixels(image,map,group,{marginFraction:.25}),/margin/);
 assert.throws(()=>cropClothingPhotoPixels(image,map,group,{marginFraction:NaN}),/margin/);
});
