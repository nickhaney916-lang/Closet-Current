import test from 'node:test';
import assert from 'node:assert/strict';
import {repairGarmentDisplayPinholes,isolateClothingPixels,cropClothingPhotoPixels}
 from '../public/outfit-segmentation.mjs';

function sample(){
 const width=32,height=32,channels=3,data=new Uint8ClampedArray(width*height*channels);
 const selected=new Uint8Array(width*height),labels=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const garment=x>=4&&x<=27&&y>=4&&y<=27,i=y*width+x,k=i*3;
  data[k]=garment?40:231;data[k+1]=garment?80:232;data[k+2]=garment?130:233;
  if(garment){selected[i]=1;labels[i]=4;}
 }
 const group={selected,id:4,bounds:{left:4,top:4,right:28,bottom:28},clipped:false};
 return {image:{data,width,height,channels},map:{width,height,labels},group};
}
const pixel=(view,x,y)=>{
 const i=((y-view.bounds.top)*view.width+x-view.bounds.left)*3;
 return Array.from(view.data.slice(i,i+3));
};
test('enclosed 1-pixel garment mask dropout gets recovered from TRUE original RGB only',()=>{
 const {image,map,group}=sample(),i=13*32+15;
 group.selected[i]=0;map.labels[i]=0;
 const photoBefore=image.data.slice(),maskBefore=group.selected.slice();
 const r=repairGarmentDisplayPinholes(image,map,group);
 assert.equal(r.repairedPixels,1);assert.equal(r.repairedHoles,1);
 assert.equal(r.selected[i],1);
 assert.equal(group.selected[i],0,'classification mask is never changed');
 assert.deepEqual(image.data,photoBefore,'untouched high-quality original');
 assert.deepEqual(group.selected,maskBefore);
 const display=isolateClothingPixels(image,map,group);
 assert.deepEqual(pixel(display,15,13),[40,80,130]);
 assert.equal(display.displayRepair.repairedPixels,1);
 assert.deepEqual(pixel(isolateClothingPixels(image,map,group,{repairDisplayPinholes:false}),15,13),[255,255,255]);
 assert.deepEqual(pixel(cropClothingPhotoPixels(image,map,group),15,13),[40,80,130]);
});
test('skin-colored real cutout hole is NOT filled by a garment RGB guess',()=>{
 const {image,map,group}=sample(),i=14*32+16;
 group.selected[i]=0;map.labels[i]=0;
 image.data.set([214,164,124],i*3);
 const r=repairGarmentDisplayPinholes(image,map,group);
 assert.equal(r.repairedPixels,0);
 assert.deepEqual(pixel(isolateClothingPixels(image,map,group),16,14),[255,255,255]);
});
test('large true neckline/ornamental opening is kept and never filled',()=>{
 const {image,map,group}=sample();
 for(let y=12;y<15;y++)for(let x=12;x<15;x++){group.selected[y*32+x]=0;map.labels[y*32+x]=0;}
 const r=repairGarmentDisplayPinholes(image,map,group);
 assert.equal(r.repairedPixels,0);
});
test('gap connected diagonally to exterior is not considered an enclosed hole',()=>{
 const {image,map,group}=sample();
 // Clear diagonal from inner pixel to exterior of the garment using 8-neighbor adjacency.
 for(let a=0;a<=10;a++){
  const x=13-a,y=13-a;
  group.selected[y*32+x]=0;map.labels[y*32+x]=0;
 }
 assert.equal(repairGarmentDisplayPinholes(image,map,group).repairedPixels,0);
});
test('pixels assigned to other clothing are NEVER filled',()=>{
 const {image,map,group}=sample(),i=13*32+14;
 group.selected[i]=0;map.labels[i]=7;
 assert.equal(repairGarmentDisplayPinholes(image,map,group).repairedPixels,0);
});
test('clipped masks do not extrapolate fabric at the photo edge',()=>{
 const {image,map,group}=sample(),i=13*32+14;
 group.selected[i]=0;map.labels[i]=0;group.clipped=true;
 assert.equal(repairGarmentDisplayPinholes(image,map,group).repairedPixels,0);
});
test('growth cap limits total repairs while guaranteeing zero removed garment pixels',()=>{
 const {image,map,group}=sample();
 const holes=[[12,12],[14,14],[16,16],[18,18],[20,20],[22,22],[24,24],[12,20],[20,12],[14,23]];
 for(const [x,y] of holes){const i=y*32+x;group.selected[i]=0;map.labels[i]=0;}
 const r=repairGarmentDisplayPinholes(image,map,group,{maxTotalGrowthFraction:.005});
 assert.ok(r.repairedPixels<=r.growthBudget);
 for(let i=0;i<r.selected.length;i++)if(group.selected[i])assert.equal(r.selected[i],1);
});
test('no garment hallucination from entirely missing category',()=>{
 const {image,map,group}=sample();group.selected.fill(0);
 const r=repairGarmentDisplayPinholes(image,map,group);
 assert.equal(r.repairedPixels,0);
 assert.ok(r.selected.every(x=>x===0));
});
test('reject malformed source and mask dimensions rather than saving invalid display crop',()=>{
 const {image,map,group}=sample();
 assert.throws(()=>repairGarmentDisplayPinholes({...image,width:33},map,group));
 assert.throws(()=>repairGarmentDisplayPinholes(image,map,{...group,selected:new Uint8Array(2)}));
 assert.throws(()=>repairGarmentDisplayPinholes(image,map,group,{maxHolePixels:100}));
 assert.throws(()=>repairGarmentDisplayPinholes(image,map,group,{maxTotalGrowthFraction:.5}));
});
