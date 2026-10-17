import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {clothingColorSample,clothingInteriorColorSample} from '../public/outfit-segmentation.mjs';
const require=createRequire(import.meta.url);
const Color=require('../public/photo-color.js');

function scene({mapWidth=20,mapHeight=20,inside=(x,y)=>x>=3&&x<17&&y>=3&&y<17,garment=[30,60,170],background=[240,240,240]}={}){
 const width=mapWidth*3,height=mapHeight*3,channels=3,data=new Uint8ClampedArray(width*height*3),selected=new Uint8Array(mapWidth*mapHeight);
 for(let y=0;y<mapHeight;y++)for(let x=0;x<mapWidth;x++){
  const on=inside(x,y);if(on)selected[y*mapWidth+x]=1;
  for(let yy=y*3;yy<y*3+3;yy++)for(let xx=x*3;xx<x*3+3;xx++){
   data.set(on?garment:background,(yy*width+xx)*3);
  }
 }
 const indices=[];for(let i=0;i<selected.length;i++)if(selected[i])indices.push(i);
 const xs=indices.map(i=>i%mapWidth),ys=indices.map(i=>Math.floor(i/mapWidth));
 const group={selected,bounds:{left:Math.min(...xs),top:Math.min(...ys),right:Math.max(...xs)+1,bottom:Math.max(...ys)+1}};
 return {image:{width,height,channels,data},map:{width:mapWidth,height:mapHeight},group};
}
const palette=s=>Color.maskedPalette(s.data,s.width,s.height);

test('small ambiguous garment masks do not become 256 fake independent color samples',()=>{
 const f=scene({inside:(x,y)=>x>=8&&x<12&&y>=8&&y<12});
 const sample=clothingColorSample(f.image,f.map,f.group);
 assert.equal(sample.distinctMaskPixels,16);
 assert.equal(sample.sampledPixels,16);
 assert.equal(sample.data.filter((_,i)=>i%4===3&&sample.data[i]===255).length,16);
 assert.equal(palette(sample),null,'a 16-pixel mask does not justify a confident color');
});
test('sparse 40-pixel mask preserves color but requires confirmation',()=>{
 const f=scene({inside:(x,y)=>x>=8&&x<12&&y>=5&&y<15});
 const sample=clothingColorSample(f.image,f.map,f.group);
 assert.equal(sample.sampledPixels,40);
 const result=palette(sample);
 assert.equal(result.primary,'Blue');
 assert.equal(result.needsConfirmation,true);
});
test('sufficient distinct blue garment evidence ignores surrounding white room',()=>{
 const f=scene();
 const sample=clothingColorSample(f.image,f.map,f.group);
 assert.equal(sample.distinctMaskPixels,196);
 assert.equal(sample.sampledPixels,196);
 const result=palette(sample);
 assert.equal(result.primary,'Blue');
 assert.equal(result.needsConfirmation,false);
 assert.ok(result.coverage<1);
});
test('large mask caps samples at 256 while maintaining garment color',()=>{
 const f=scene({inside:(x,y)=>x>=1&&x<19&&y>=1&&y<19});
 const sample=clothingColorSample(f.image,f.map,f.group);
 assert.equal(sample.distinctMaskPixels,324);
 assert.equal(sample.sampledPixels,256);
 assert.equal(palette(sample).primary,'Blue');
});
test('masked estimator samples actual garment not neighboring orange backdrop',()=>{
 const f=scene({background:[225,100,20],garment:[35,65,160]});
 const sample=clothingColorSample(f.image,f.map,f.group);
 assert.equal(palette(sample).primary,'Blue');
});

test('interior color sample removes the coarse outer mask ring without touching original source RGB',()=>{
 const f=scene(),s=clothingInteriorColorSample(f.image,f.map,f.group);
 assert.ok(s);assert.equal(s.maskPixels,196);assert.equal(s.corePixels,144);
 assert.equal(s.sampledPixels,144);
 assert.equal(s.interiorFraction,.735);
 assert.equal(palette(s).primary,'Blue');
 assert.equal(palette(s).needsConfirmation,false);
});
test('red background leakage in the one-pixel mask edge cannot override blue fabric interior',()=>{
 const f=scene();
 // The segmentation mask accidentally includes one-pixel ring colored red.
 // Only source pixels are changed; no mask labels or neighbor pixels are guessed.
 for(let y=3;y<17;y++)for(let x=3;x<17;x++)
  if(x===3||x===16||y===3||y===16)
   for(let yy=y*3;yy<y*3+3;yy++)for(let xx=x*3;xx<x*3+3;xx++)
    f.image.data.set([180,20,25],(yy*f.image.width+xx)*3);
 const full=clothingColorSample(f.image,f.map,f.group);
 const core=clothingInteriorColorSample(f.image,f.map,f.group);
 assert.equal(full.sampledPixels,196);assert.ok(core);
 assert.equal(palette(core).primary,'Blue');
 assert.equal(palette(core).colors.length,1,'outer red pixels never appear in core color evidence');
 assert.equal(core.distinctMaskPixels,144);
});
test('narrow socks, straps, and tiny masks return no interior instead of upsampling border pixels',()=>{
 const narrow=scene({mapWidth:30,mapHeight:30,inside:(x,y)=>x>=10&&x<12&&y>=2&&y<28});
 assert.equal(clothingInteriorColorSample(narrow.image,narrow.map,narrow.group),null);
 const tiny=scene({inside:(x,y)=>x>=8&&x<12&&y>=8&&y<12});
 assert.equal(clothingInteriorColorSample(tiny.image,tiny.map,tiny.group),null);
});
test('interior mask excludes neighboring clothing colors even when adjoining outside pixels touch the shape',()=>{
 const f=scene({background:[235,95,25],garment:[30,60,170]});
 const center=clothingInteriorColorSample(f.image,f.map,f.group);
 assert.equal(palette(center).primary,'Blue');
 assert.ok(!palette(center).colors.some(x=>x.color==='Orange'));
});
test('invalid and untrustworthy interior masks fail closed',()=>{
 const f=scene();
 assert.throws(()=>clothingInteriorColorSample(f.image,f.map,{selected:new Uint8Array(8)}));
 assert.throws(()=>clothingInteriorColorSample(f.image,f.map,f.group,{minimumInterior:300}));
 assert.throws(()=>clothingInteriorColorSample(f.image,{width:0,height:20},f.group));
});
