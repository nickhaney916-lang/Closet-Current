const test=require('node:test'),assert=require('node:assert/strict'),C=require('../public/photo-color.js');
const sample=fn=>{const pixels=new Uint8ClampedArray(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++)pixels.set([...fn(x,y),255],(y*16+x)*4);return pixels;};
test('basic color families recognize common garments including dark blue jeans',()=>{for(const [rgb,color]of [[[10,10,10],'Black'],[[240,240,240],'White'],[[120,120,120],'Gray'],[[180,20,20],'Red'],[[20,35,110],'Blue'],[[20,140,40],'Green'],[[235,220,20],'Yellow'],[[240,105,15],'Orange'],[[120,30,180],'Purple'],[[220,55,170],'Pink'],[[105,65,30],'Brown'],[[210,185,155],'Beige']])assert.equal(C.family(...rgb),color);});
test('color estimate samples the garment center rather than a bright surrounding border',()=>{const result=C.estimate(sample((x,y)=>x>=3&&x<13&&y>=3&&y<13?[20,40,160]:[245,245,245]),16,16);assert.equal(result.color,'Blue');assert.equal(result.source,'photo-estimate');});
test('mixed neutral regions retain a multicolor estimate that requires confirmation',()=>{const result=C.estimate(sample((x,y)=>x<8?[20,20,20]:[240,240,240]),16,16);assert.equal(result.color,'Multicolor');assert.equal(result.needsConfirmation,true);});
test('three significant chromatic regions produce a multicolor estimate',()=>{const result=C.estimate(sample((x,y)=>x<8?y<8?[200,20,20]:[20,150,30]:y<8?[20,40,190]:[240,220,20]),16,16);assert.equal(result.color,'Multicolor');});
test('transparent and invalid samples cannot become a confident color',()=>{assert.equal(C.estimate(new Uint8ClampedArray(16*16*4),16,16),null);assert.throws(()=>C.estimate([],16,16));assert.throws(()=>C.estimate([],2,2));});
test('a clear two-tone chromatic garment is kept as multicolor rather than left blank',()=>{assert.equal(C.estimate(sample((x,y)=>x<8?[180,20,20]:[20,40,190]),16,16).color,'Multicolor');});

test('shadowed orange fabric with a material bright-orange share cannot silently become confirmed Brown',()=>{
 const dim=[145,65,20],bright=[225,100,20];
 const rgba=sample((x,y)=>x%4===0?bright:dim);
 const estimate=C.estimate(rgba,16,16);
 assert.equal(estimate.color,'Brown','the legacy raw hue threshold favors the darker swatches');
 assert.equal(estimate.needsConfirmation,true,'mixed lighting is not confident brown fabric evidence');
 assert.equal(estimate.reason,'warm-tone-lighting-ambiguity');
 const masked=C.maskedPalette(rgba,16,16);
 assert.equal(masked.primary,'Brown');
 assert.equal(masked.needsConfirmation,true);
});
test('a uniformly brown piece or clearly orange piece retains its useful color estimate',()=>{
 const brown=C.estimate(sample(()=>[105,65,30]),16,16);
 const orange=C.estimate(sample(()=>[230,105,20]),16,16);
 assert.equal(brown.color,'Brown');assert.notEqual(brown.needsConfirmation,true);
 assert.equal(orange.color,'Orange');assert.notEqual(orange.needsConfirmation,true);
 assert.equal(C.maskedPalette(sample(()=>[105,65,30]),16,16).needsConfirmation,false);
});

test('real-photo-inspired rust orange has Brown and Red evidence and stays uncertain',()=>{
 const darkRust=[150,47,22],litRed=[225,35,30];
 const rgba=sample((x,y)=>x<11?darkRust:litRed);
 assert.equal(C.family(...darkRust),'Brown');
 assert.equal(C.family(...litRed),'Red');
 const estimate=C.estimate(rgba,16,16);
 assert.equal(estimate.color,'Brown');
 assert.equal(estimate.needsConfirmation,true);
 assert.equal(estimate.reason,'warm-tone-lighting-ambiguity');
 const palette=C.maskedPalette(rgba,16,16);
 assert.equal(palette.primary,'Brown');
 assert.equal(palette.needsConfirmation,true);
});
test('neutral true-brown control is not flagged for red-orange ambiguity',()=>{
 const coat=[121,109,97],gray=[125,125,125];
 const rgba=sample((x,y)=>x<11?coat:gray);
 const estimate=C.estimate(rgba,16,16);
 assert.equal(estimate.color,'Brown');
 assert.notEqual(estimate.reason,'warm-tone-lighting-ambiguity');
 const masked=C.maskedPalette(rgba,16,16);
 assert.equal(masked.primary,'Brown');
 assert.equal(masked.needsConfirmation,false);
});

test('garment palette requires both mask and inner fabric to agree on one supported color',()=>{
 const whole={primary:'Blue',colors:[{color:'Blue',share:.9}],secondary:null,needsConfirmation:false};
 const inner={primary:'Blue',colors:[{color:'Blue',share:.98}],secondary:null,needsConfirmation:false};
 assert.deepEqual(C.confirmedGarmentPalette(whole,inner),{color:'Blue',source:'photo-estimate',support:.9,secondaryColor:null});
});
test('garment palette refuses competing boundary colors and insufficient interior samples',()=>{
 const whole={primary:'Blue',colors:[{color:'Blue',share:.85}],needsConfirmation:false};
 const inner={primary:'Red',colors:[{color:'Red',share:.98}],needsConfirmation:false};
 assert.equal(C.confirmedGarmentPalette(whole,inner),null);
 assert.equal(C.confirmedGarmentPalette(whole,null),null);
 assert.equal(C.confirmedGarmentPalette(whole,{...inner,primary:'Blue',needsConfirmation:true}),null);
 assert.equal(C.confirmedGarmentPalette({...whole,needsConfirmation:true},{...inner,primary:'Blue'}),null);
 assert.equal(C.confirmedGarmentPalette(whole,{...inner,primary:'Blue',colors:[]}),null);
});
