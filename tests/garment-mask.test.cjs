'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const maskEngine=require('../public/garment-mask-engine.js');
test('erase and restore garment pixels without mutating the original',()=>{
 const mask=maskEngine.create(8,8),source=new Uint8ClampedArray(8*8*4);
 for(let i=0;i<source.length;i+=4)source.set([220,30,30,255],i);
 const before=source.slice();
 maskEngine.paint(mask,3,3,1,'erase');
 const erased=maskEngine.apply(source,mask);
 assert.deepEqual([...erased.slice((3*8+3)*4,(3*8+3)*4+4)],[255,255,255,255]);
 maskEngine.paint(mask,3,3,1,'add');
 const restored=maskEngine.apply(source,mask);
 assert.deepEqual([...restored.slice((3*8+3)*4,(3*8+3)*4+4)],[220,30,30,255]);
 assert.deepEqual(source,before);
});
test('continuous strokes do not leave gaps',()=>{
 const mask=maskEngine.create(30,10);
 maskEngine.stroke(mask,2,5,27,5,2,'erase');
 for(let x=2;x<=27;x++)assert.equal(mask.alpha[5*30+x],0);
});
test('transparent output is suitable for mask-only color sampling',()=>{
 const mask=maskEngine.create(8,8);maskEngine.paint(mask,4,4,2,'erase');
 const source=new Uint8ClampedArray(8*8*4);for(let i=0;i<source.length;i+=4)source.set([20,80,220,255],i);
 const result=maskEngine.apply(source,mask,{transparent:true});
 assert.equal(result[(4*8+4)*4+3],0);
 assert.equal(result[(0*8)*4+3],255);
});
test('invalid brush input is rejected',()=>assert.throws(()=>maskEngine.paint(maskEngine.create(8,8),2,2,0)));
