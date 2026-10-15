const test=require('node:test'),assert=require('node:assert/strict'),C=require('../public/photo-color.js');
const sample=fn=>{const pixels=new Uint8ClampedArray(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++)pixels.set([...fn(x,y),255],(y*16+x)*4);return pixels;};
test('basic color families recognize common garments including dark blue jeans',()=>{for(const [rgb,color]of [[[10,10,10],'Black'],[[240,240,240],'White'],[[120,120,120],'Gray'],[[180,20,20],'Red'],[[20,35,110],'Blue'],[[20,140,40],'Green'],[[235,220,20],'Yellow'],[[240,105,15],'Orange'],[[120,30,180],'Purple'],[[220,55,170],'Pink'],[[105,65,30],'Brown'],[[210,185,155],'Beige']])assert.equal(C.family(...rgb),color);});
test('color estimate samples the garment center rather than a bright surrounding border',()=>{const result=C.estimate(sample((x,y)=>x>=3&&x<13&&y>=3&&y<13?[20,40,160]:[245,245,245]),16,16);assert.equal(result.color,'Blue');assert.equal(result.source,'photo-estimate');});
test('mixed neutral regions retain a multicolor estimate that requires confirmation',()=>{const result=C.estimate(sample((x,y)=>x<8?[20,20,20]:[240,240,240]),16,16);assert.equal(result.color,'Multicolor');assert.equal(result.needsConfirmation,true);});
test('three significant chromatic regions produce a multicolor estimate',()=>{const result=C.estimate(sample((x,y)=>x<8?y<8?[200,20,20]:[20,150,30]:y<8?[20,40,190]:[240,220,20]),16,16);assert.equal(result.color,'Multicolor');});
test('transparent and invalid samples cannot become a confident color',()=>{assert.equal(C.estimate(new Uint8ClampedArray(16*16*4),16,16),null);assert.throws(()=>C.estimate([],16,16));assert.throws(()=>C.estimate([],2,2));});
test('a clear two-tone chromatic garment is kept as multicolor rather than left blank',()=>{assert.equal(C.estimate(sample((x,y)=>x<8?[180,20,20]:[20,40,190]),16,16).color,'Multicolor');});

// A flattened mask can put contrasting trim at the center of the sample even
// though the whole garment is mostly one color. No sample pixel is background.
test('mask color uses the whole garment distribution instead of recropping its sample',()=>{
 const pixels=sample((x,y)=>y>=5&&y<11?[180,20,20]:[20,40,160]);
 assert.equal(C.estimate(pixels,16,16).color,'Red');
 const result=C.estimate(pixels,16,16,{garmentMask:true});
 assert.equal(result.color,'Blue');assert.equal(result.support,.625);
 assert.equal(result.needsConfirmation,true);
});
test('mask sampling preserves narrow shoe and dress color away from the flattened center',()=>{
 const pixels=sample((x,y)=>y>=6&&y<10?[240,240,240]:[20,40,160]);
 const result=C.estimate(pixels,16,16,{garmentMask:true});
 assert.equal(result.color,'Blue');assert.equal(result.support,.75);
 assert.equal(result.needsConfirmation,undefined);
});
test('mask mode ignores transparent samples and does not invent spatial agreement',()=>{
 const pixels=sample((x,y)=>x<10?[20,40,160]:[180,20,20]);
 const result=C.estimate(pixels,16,16,{garmentMask:true});
 assert.equal(result.color,'Blue');assert.equal(result.needsConfirmation,true);
 pixels.fill(0);assert.equal(C.estimate(pixels,16,16,{garmentMask:true}),null);
});
