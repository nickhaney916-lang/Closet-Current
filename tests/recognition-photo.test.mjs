import test from 'node:test';
import assert from 'node:assert/strict';
import {uniformPhotoBounds,prepareRecognitionPhoto} from '../public/recognition-photo.mjs';
function photo(width=100,height=200,channels=3){
 const data=new Uint8ClampedArray(width*height*channels);data.fill(255);
 return {width,height,channels,data};
}
function paint(image,left,top,right,bottom,color=[0,0,0]){
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)for(let c=0;c<3;c++)image.data[(y*image.width+x)*image.channels+c]=color[c];
}
test('uniform-border trim retains tall dress hems and wide shoe soles with margin',()=>{
 const dress=photo();paint(dress,20,20,80,180);
 assert.deepEqual(uniformPhotoBounds(dress),{left:13,top:13,right:87,bottom:187});
 const shoe=photo(200,100);paint(shoe,20,20,180,80);
 assert.deepEqual(uniformPhotoBounds(shoe),{left:13,top:13,right:187,bottom:87});
});
test('dark, nonuniform, mostly blank and pale photos retain full frame',()=>{
 const full={left:0,top:0,right:100,bottom:200};
 const blank=photo();assert.deepEqual(uniformPhotoBounds(blank),full);
 const dark=photo();dark.data.fill(20);assert.deepEqual(uniformPhotoBounds(dark),full);
 const busy=photo();paint(busy,0,0,1,1);assert.deepEqual(uniformPhotoBounds(busy),full);
 const small=photo();paint(small,45,95,55,105);assert.deepEqual(uniformPhotoBounds(small),full);
 const pale=photo();paint(pale,20,20,80,180,[245,245,245]);assert.deepEqual(uniformPhotoBounds(pale),full);
});
test('both recognition views preserve the same source bounds and leave original pixels intact',async()=>{
 const image=photo();paint(image,20,20,80,180);const original=image.data.slice(),crops=[],resizes=[];
 image.crop=async bounds=>{crops.push(bounds);return {width:bounds[2]-bounds[0]+1,height:bounds[3]-bounds[1]+1,resize:async(w,h)=>{resizes.push([w,h]);return {data:new Uint8ClampedArray(w*h*3),channels:3};}};};
 class Raw{constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}}
 const a=await prepareRecognitionPhoto(image,Raw),b=await prepareRecognitionPhoto(image,Raw,{confirmation:true});
 assert.deepEqual(crops,[[13,13,86,186],[13,13,86,186]]);
 assert.deepEqual(resizes,[[143,336],[136,320]]);
 assert.equal(a.width,336);assert.equal(b.height,336);assert.equal(b.data[0],255);assert.deepEqual(image.data,original);
});
test('invalid dimensions and pixel buffers fail before preprocessing',()=>{
 assert.throws(()=>uniformPhotoBounds({...photo(),data:new Uint8Array(1)}),/Invalid/);
 assert.throws(()=>uniformPhotoBounds({...photo(),width:NaN}),/Invalid/);
});
