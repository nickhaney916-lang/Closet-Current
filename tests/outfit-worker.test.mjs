import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),PhotoColor=require('../public/photo-color.js');
import * as segmentation from '../public/outfit-segmentation.mjs';
import {visibleGarmentGroups24} from '../research/multi-garment-capture-01/visible-groups.mjs';
const source=fs.readFileSync('public/outfit-worker.mjs','utf8');
function setup({failLoad=false,failSecondCrop=false,noPerson=false,manyRegions=false,multi24=false}={}){
 const sent=[],width=20,height=20,data=new Float32Array(18*width*height);data.fill(-10);for(let i=0;i<400;i++)data[i]=10;
 for(const [id,left,top,w,h]of [[4,5,4,8,5],[6,6,10,6,5],[9,6,16,3,3],[10,10,16,3,3],[11,7,1,4,3]])for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){const i=y*width+x;data[i]=-10;data[id*400+i]=10;}
 let crops=0;class Image{constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}static async read(){return new Image(new Uint8ClampedArray(1200).fill(40),20,20,3);}async toBlob(){if(failSecondCrop&&++crops===3)throw Error('private decode error');return {arrayBuffer:async()=>new Uint8Array([255,216,255]).buffer};}}
 if(noPerson)for(let y=1;y<4;y++)for(let x=7;x<11;x++){data[11*400+y*20+x]=-10;data[y*20+x]=10;}
 if(manyRegions){
  for(let i=0;i<400;i++){for(let c=0;c<18;c++)data[c*400+i]=-10;data[i]=10;}
  for(let region=0;region<13;region++){
   const ox=(region%4)*5,oy=Math.floor(region/4)*5;
   for(let y=oy;y<oy+4;y++)for(let x=ox;x<ox+3;x++){
    const i=y*20+x;data[i]=-10;data[4*400+i]=10;
   }
  }
 }
 const runtime={AutoModelForSemanticSegmentation:{from_pretrained:async()=>{if(failLoad)throw Error('private error');return async()=>({logits:{data,dims:[1,18,20,20]}});}},AutoProcessor:{from_pretrained:async()=>async()=>({})},RawImage:Image,env:{backends:{onnx:{wasm:{}}}}};
 const c={runtime,segmentation,PhotoColor,group24:{visibleGarmentGroups24},self:{postMessage:value=>sent.push(value)},Uint8Array,Uint8ClampedArray,btoa:text=>Buffer.from(text,'binary').toString('base64')};vm.createContext(c);
 vm.runInContext(source.replace(/await import\('https:[^']+'\)/,'await Promise.resolve(runtime)').replace("await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(segmentation)').replace("await import('./photo-color.js'+new URL(import.meta.url).search)",'await Promise.resolve()').replace("await import('../research/multi-garment-capture-01/visible-groups.mjs')",'await Promise.resolve(group24)'),c);
 return {sent,async run(){c.self.onmessage({data:{id:'outfit',image:'data:image/jpeg;base64,AAAA',multi24}});await vm.runInContext('chain',c);}};
}
test('full-outfit worker emits three separate garment images and excludes body labels',async()=>{
 const h=setup();await h.run();const pieces=h.sent.filter(x=>x.type==='piece');assert.deepEqual(pieces.map(x=>x.piece.label),['Upper garment','Bottoms','Shoes']);assert.ok(pieces.every(x=>x.piece.image.startsWith('data:image/jpeg;base64,')&&x.piece.recognitionPhoto.image.startsWith('data:image/jpeg;base64,')&&x.piece.cropBounds.width<1&&x.piece.colorEstimate.color==='Black'));assert.equal(h.sent.find(x=>x.type==='done').count,3);assert.ok(!JSON.stringify(pieces).includes('Face'));
});
test('load failure returns a safe error without fabricated cutouts',async()=>{
 const h=setup({failLoad:true});await h.run();assert.equal(h.sent.filter(x=>x.type==='piece').length,0);assert.ok(h.sent.some(x=>x.type==='error'));assert.ok(!JSON.stringify(h.sent).includes('private error'));
});
test('later crop failure preserves pieces emitted earlier',async()=>{
 const h=setup({failSecondCrop:true});await h.run();assert.equal(h.sent.filter(x=>x.type==='piece').length,1);assert.ok(h.sent.some(x=>x.type==='error'));assert.ok(!h.sent.some(x=>x.type==='done'));
});

test('clothing-shaped regions without sufficient person evidence do not create cutouts',async()=>{
 const h=setup({noPerson:true});await h.run();assert.equal(h.sent.filter(x=>x.type==='piece').length,0);assert.equal(h.sent.find(x=>x.type==='done').count,0);
});

test('P813: multi24 13-region worker rejects entire photo, emits no pieces and explains how to retry',async()=>{
 const h=setup({manyRegions:true,multi24:true});await h.run();
 assert.equal(h.sent.filter(x=>x.type==='piece').length,0,'never export 12 of 13');
 assert.equal(h.sent.filter(x=>x.type==='done').length,0,'never claim completed subset');
 const errors=h.sent.filter(x=>x.type==='error');
 assert.equal(errors.length,1);
 assert.match(errors[0].text,/more clothing regions|fewer garments/);
 assert.ok(!errors[0].text.includes('MULTI24_REVIEW_OVERFLOW'),'internal detail never surfaced');
});
