import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import * as segmentation from '../public/outfit-segmentation.mjs';
import * as trial from '../public/outfit-instance-review-840.mjs';
function actualSourceMap(){
 const width=40,height=40,area=width*height,logits=new Float32Array(18*area);logits.fill(-10);
 for(let i=0;i<area;i++)logits[i]=10;
 const paint=(c,x,y,w,h)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
  const p=yy*width+xx;for(let k=0;k<18;k++)logits[k*area+p]=k===c?10:-10;
 }};
 paint(11,14,1,7,6);paint(4,14,8,11,9);paint(6,16,20,9,7);
 paint(9,5,30,5,5);paint(10,28,30,5,5);
 return {data:logits,dims:[1,18,height,width]};
}
test('actual P840 worker computes original JPEG SHA and disjoint SHA-256 group-mask receipts only with P70 opt-in',async()=>{
 const sent=[],source=fs.readFileSync('public/outfit-worker.mjs','utf8'),l=actualSourceMap();
 class Image{constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}
  static async read(){return new Image(new Uint8ClampedArray(40*40*3).fill(40),40,40,3);}
  async toBlob(){return {arrayBuffer:async()=>new Uint8Array([255,216,255]).buffer};}}
 const runtime={AutoModelForSemanticSegmentation:{from_pretrained:async()=>async()=>({logits:l})},
  AutoProcessor:{from_pretrained:async()=>async()=>({})},RawImage:Image,env:{backends:{onnx:{wasm:{}}}}};
 const PhotoColor={maskedPalette:()=>({primary:'Black',needsConfirmation:false,colors:[{share:.94}]})};
 const c={runtime,segmentation,trial,PhotoColor,crypto:webcrypto,atob,btoa:x=>Buffer.from(x,'binary').toString('base64'),
  self:{postMessage:x=>sent.push(x)},Uint8Array,Uint8ClampedArray};
 vm.createContext(c);
 const transformed=source.replace(/await import\('https:[^']+'\)/,'await Promise.resolve(runtime)')
  .replace("await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(segmentation)')
  .replace("await import('./outfit-instance-review-840.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(trial)')
  .replace("await import('./photo-color.js'+new URL(import.meta.url).search)",'await Promise.resolve()');
 vm.runInContext(transformed,c);
 const run=async enabled=>{
  sent.length=0;c.self.onmessage({data:{id:'original',image:'data:image/jpeg;base64,AAAA',instanceReview840:true,...(enabled?{instanceReview70:true}:{})}});
  await vm.runInContext('chain',c);
  assert.equal(sent.filter(x=>x.type==='error').length,0);
  return sent.filter(x=>x.type==='piece').map(x=>x.piece);
 };
 const unflagged=await run(false),enabled=await run(true);
 assert.equal(unflagged.length,4);assert.equal(enabled.length,4);
 assert.ok(unflagged.every(x=>!x.reconciliation70),'default P840 data surface unchanged');
 const expected=createHash('sha256').update(Buffer.from('AAAA','base64')).digest('hex');
 assert.ok(enabled.every(x=>x.reconciliation70?.sourceSha256===expected));
 assert.ok(enabled.every(x=>/^[a-f0-9]{64}$/.test(x.reconciliation70.maskSha256)));
 assert.equal(new Set(enabled.map(x=>x.reconciliation70.maskSha256)).size,4);
 const shoes=enabled.filter(x=>x.label==='Shoes');
 assert.equal(shoes.length,2);
 assert.equal(new Set(shoes.map(x=>x.reconciliation70.maskSha256)).size,2);
 assert.ok(enabled.every(x=>x.requiresReview&&x.reconciliation70.colorEstimate.color==='Black'));
 assert.ok(enabled.every(x=>!JSON.stringify(x.reconciliation70).includes('data:image/jpeg;base64,')),'no photo bytes in provenance');
});
