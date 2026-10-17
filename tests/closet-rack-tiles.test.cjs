'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const rack=require('../public/closet-rack-engine.js'),tile=require('../public/closet-tile-engine.js');
test('rack presentation works for shirts, jackets, dresses, bottoms, shoes and accessories',()=>{
 const input=[['Tops','hanger'],['Outerwear','hanger'],['Dresses','hanger'],
  ['Bottoms','clips'],['Shoes','shelf'],['Accessories','shelf'],['Uncategorized','shelf']];
 for(const [category,expected] of input)assert.equal(rack.support({category}),expected);
});
test('all-category rack remains one view and never modifies any clothing record',()=>{
 const sample={id:'jeans',image:'real-original',category:'Bottoms',sleeveLength:'Unknown'};
 const copy=structuredClone(sample);
 assert.equal(rack.support(sample),'clips');
 assert.equal(rack.modeIsRack('rack'),true);assert.equal(rack.modeIsRack('grid'),false);
 assert.deepEqual(sample,copy);
});
test('swipe navigation step responds to narrow phone and desktop',()=>{
 assert.equal(rack.scrollAmount(300),228);
 assert.equal(rack.scrollAmount(800),608);
 assert.throws(()=>rack.scrollAmount(0));
});
test('centered letterboxed image uses original aspect ratio',()=>{
 const p=tile.placement(200,400);
 assert.equal(p.width/p.height,.5);
 assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=280&&p.y+p.height<=340);
 const landscape=tile.placement(500,220);
 assert.ok(landscape.width<=280&&landscape.height<=340);
});
test('dark plain photograph, white shirt and faint outlines are never aggressively cropped',()=>{
 const width=80,height=100;
 const white=new Uint8ClampedArray(width*height*4).fill(255);
 assert.equal(tile.safeWhiteBounds(white,width,height).trimmed,false);
 const dark=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<dark.length;i+=4){dark[i]=35;dark[i+1]=60;dark[i+2]=88;dark[i+3]=255;}
 assert.equal(tile.safeWhiteBounds(dark,width,height).trimmed,false);
});
test('centered high-contrast item may safely trim modest clean white margins',()=>{
 const width=100,height=100,a=new Uint8ClampedArray(width*height*4).fill(255);
 for(let y=10;y<91;y++)for(let x=11;x<92;x++){
  const k=(y*width+x)*4;a[k]=43;a[k+1]=57;a[k+2]=104;
 }
 const b=tile.safeWhiteBounds(a,width,height);
 assert.equal(b.trimmed,true);
 assert.ok(b.width>=79&&b.height>=79);
});
test('reject malformed dimensions and fake image urls',()=>{
 assert.throws(()=>tile.placement(0,40));
 assert.throws(()=>tile.safeWhiteBounds(new Uint8ClampedArray(7),4,5));
 assert.equal(tile.valid('https://evil.example/garment.png'),false);
 assert.equal(tile.valid('data:image/svg+xml;base64,xxx'),false);
});
test('tile generation skips missing images without touching user data',async()=>{
 assert.equal(await tile.normalized({id:'x',image:'not-an-image'}),null);
 assert.equal(await tile.normalized({id:'x'}),null);
});
