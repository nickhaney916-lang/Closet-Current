'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/photo-import.js','utf8');
function setup(failure=false){let revoked=0,cleared=0,encoded=0,yields=0;const sizes=[];
 const canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage(){sizes.push([canvas.width,canvas.height]);}}),toDataURL:()=>{encoded++;if(failure==='encode')throw Error('Encoder failed');return encoded===1?'x'.repeat(2850001):'jpeg';}};
 const c={URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++},Image:class{width=4032;height=3024;decode(){return failure==='decode'?Promise.reject(Error('Bad image')):Promise.resolve();}removeAttribute(){cleared++;}},document:{createElement:()=>canvas},setTimeout:(fn,ms)=>{if(ms===0)yields++;return setTimeout(fn,ms);},clearTimeout};
 vm.createContext(c);vm.runInContext(source,c);return {c,canvas,sizes,stats:()=>({revoked,cleared,encoded,yields})};
}
test('same full-frame pixels and JPEG qualities survive retries; buffers are released on return',async()=>{
 const h=setup();assert.equal(await h.c.photoToJPEG({}),'jpeg');assert.deepEqual(h.sizes,[[3072,2304]]);assert.equal(h.canvas.width*h.canvas.height,0);assert.deepEqual(h.stats(),{revoked:1,cleared:1,encoded:2,yields:1});
});
test('failed decode and failed encoding release image URLs and any allocated canvas',async()=>{
 for(const failure of ['decode','encode']){const h=setup(failure);await assert.rejects(h.c.photoToJPEG({}),/Bad image|Encoder failed/);assert.equal(h.stats().revoked,1);assert.equal(h.stats().cleared,1);assert.equal(h.canvas.width*h.canvas.height,0);}
});
test('the same selected File object is decoded once, while equal names and sizes remain distinct',async()=>{
 const h=setup(),one={name:'same.jpg',size:10,type:'image/jpeg'},two={...one};let calls=0,ticks=0;
 const timer=setInterval(()=>ticks++,0);
 try{const r=await h.c.readPhotoBatch([one,one,two],async()=>{calls++;return 'photo';},()=>true);assert.equal(calls,2);assert.equal(r.added,2);assert.equal(r.results[1].status,'duplicate');assert.ok(ticks>0);}finally{clearInterval(timer);}
});
test('failed image decode can be retried and never suppresses later photos',async()=>{
 const h=setup(),one={name:'retry.jpg',size:10,type:'image/jpeg'};let calls=0;
 const r=await h.c.readPhotoBatch([one,one],async()=>{if(++calls===1)throw Error('temporary decode failure');return 'photo';},()=>true);assert.equal(calls,2);assert.equal(r.added,1);assert.equal(r.errors.length,1);
});
