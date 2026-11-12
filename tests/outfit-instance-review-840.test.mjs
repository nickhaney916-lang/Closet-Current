import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as segmentation from '../public/outfit-segmentation.mjs';
import * as trial from '../public/outfit-instance-review-840.mjs';

function sourceMap(){
 const width=40,height=40,area=width*height,data=new Float32Array(18*area);
 data.fill(-10);
 for(let i=0;i<area;i++)data[i]=10;
 function paint(classId,left,top,w,h){
  for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){
   const i=y*width+x;
   for(let c=0;c<18;c++)data[c*area+i]=c===classId?10:-10;
  }
 }
 paint(11,14,1,7,6); // enough human pixels to permit outfit masks
 paint(4,14,8,11,9);paint(6,16,20,9,7);
 paint(9,5,30,5,5);paint(10,28,30,5,5);
 return {data,dims:[1,18,height,width]};
}
test('P840 two distinct human footwear regions become two review-required masks without fabricated pixels',()=>{
 const l=sourceMap(),map=segmentation.clothingLabelMap(l.data,l.dims);
 assert.equal(map.personDetected,true);
 const old=segmentation.clothingMaskGroups(map),newGroups=trial.clothingReviewInstances840(map);
 assert.equal(old.filter(x=>x.id===9).length,1,'unchanged legacy is one combined shoe-pair mask');
 const shoes=newGroups.filter(x=>x.id===9);
 assert.equal(shoes.length,2);
 assert.deepEqual(shoes.map(x=>x.count),[25,25]);
 assert.ok(shoes.every(x=>x.requiresReview===true&&x.instanceMethod==='connected_footwear_component'));
 for(let i=0;i<map.labels.length;i++){
  const total=shoes.reduce((n,g)=>n+g.selected[i],0);
  assert.equal(total,old.find(x=>x.id===9).selected[i],i+' pixels were added/lost/doubled');
 }
 assert.equal(newGroups.filter(x=>x.id!==9).length,old.filter(x=>x.id!==9).length);
});
test('P840 the split mask supplies distinct intact original-image pixels and human review remains mandatory',()=>{
 const l=sourceMap(),map=segmentation.clothingLabelMap(l.data,l.dims);
 const img={width:40,height:40,channels:3,data:new Uint8ClampedArray(40*40*3)};
 img.data.fill(255);
 for(let y=30;y<35;y++)for(let x=5;x<10;x++)img.data.set([30,70,210],(y*40+x)*3);
 for(let y=30;y<35;y++)for(let x=28;x<33;x++)img.data.set([190,50,30],(y*40+x)*3);
 const [left,right]=trial.clothingReviewInstances840(map).filter(x=>x.id===9);
 assert.equal(left.clipped,false);assert.equal(right.clipped,false);
 for(const g of [left,right]){
  const cropped=segmentation.cropClothingPhotoPixels(img,map,g);
  const masked=segmentation.isolateClothingPixels(img,map,g);
  assert.ok(cropped.data.length>0&&masked.data.length>0);
  assert.equal(g.requiresReview,true);
  assert.equal(segmentation.clothingColorSample(img,map,g).data.length,1024);
 }
 const first=segmentation.clothingColorSample(img,map,left).data,second=segmentation.clothingColorSample(img,map,right).data;
 assert.deepEqual([...first.slice(0,3)],[30,70,210]);
 assert.deepEqual([...second.slice(0,3)],[190,50,30]);
});
test('P840 real outfit worker source retains default behavior and enables instance trial only on explicit message',async()=>{
 const code=fs.readFileSync('public/outfit-worker.mjs','utf8');
 assert.match(code,/request\.instanceReview840===true/);
 const l=sourceMap(),sent=[];
 class Image {
  constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}
  static async read(){return new Image(new Uint8ClampedArray(40*40*3).fill(40),40,40,3);}
  async toBlob(){return {arrayBuffer:async()=>new Uint8Array([255,216,255]).buffer};}
 }
 const runtime={AutoModelForSemanticSegmentation:{from_pretrained:async()=>async()=>({logits:l})},
  AutoProcessor:{from_pretrained:async()=>async()=>({})},RawImage:Image,env:{backends:{onnx:{wasm:{}}}}};
 const PhotoColor={maskedPalette:()=>null};
 const c={runtime,segmentation,trial,PhotoColor,self:{postMessage:x=>sent.push(x)},Uint8Array,Uint8ClampedArray,btoa:x=>Buffer.from(x,'binary').toString('base64')};
 vm.createContext(c);
 const transformed=code.replace(/await import\('https:[^']+'\)/,'await Promise.resolve(runtime)')
  .replace("await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(segmentation)')
  .replace("await import('./outfit-instance-review-840.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(trial)')
  .replace("await import('./photo-color.js'+new URL(import.meta.url).search)",'await Promise.resolve()');
 vm.runInContext(transformed,c);
 async function run(instanceReview840){
  sent.length=0;c.self.onmessage({data:{id:'photo-test',image:'data:image/jpeg;base64,AAAA',...(instanceReview840?{instanceReview840}: {})}});
  await vm.runInContext('chain',c);
  return sent.filter(x=>x.type==='piece');
 }
 const unflagged=await run(false),flagged=await run(true);
 assert.equal(unflagged.length,3);
 assert.equal(flagged.length,4);
 assert.equal(unflagged.filter(x=>x.piece.label==='Shoes').length,1);
 assert.equal(flagged.filter(x=>x.piece.label==='Shoes').length,2);
 assert.ok(flagged.every(x=>x.piece.requiresReview===true));
 assert.ok(flagged.every(x=>x.piece.image.startsWith('data:image/jpeg;base64,')&&x.piece.recognitionPhoto.image.startsWith('data:image/jpeg;base64,')));
 assert.equal(flagged.filter(x=>x.piece.instanceMethod==='connected_footwear_component').length,2);
 assert.equal(sent.filter(x=>x.type==='error').length,0);
});
