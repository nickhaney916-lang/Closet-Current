import test from 'node:test';import assert from 'node:assert/strict';
import {clothingLabelMap,clothingMaskGroups,isolateClothingPixels} from '../public/outfit-segmentation.mjs';
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
