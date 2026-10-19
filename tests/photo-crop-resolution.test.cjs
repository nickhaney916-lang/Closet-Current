const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Crop=require('../public/photo-crop-engine.js');
const Mask=require('../public/garment-mask-engine.js');

test('small shoe crop preserves every available original pixel instead of upscaling',()=>{
 const p=Crop.pixels({x:.45,y:.4,width:.1,height:.1},4000,3000);
 assert.equal(p.width,400);assert.equal(p.height,300);
 assert.equal(p.outputWidth,400);assert.equal(p.outputHeight,300);
});
test('large clothing crop keeps aspect ratio and caps longest edge at 2048',()=>{
 const p=Crop.pixels({x:0,y:0,width:1,height:1},4000,3000);
 assert.equal(p.outputWidth,2048);assert.equal(p.outputHeight,1536);
});
test('narrow crop retains complete right and bottom boundaries',()=>{
 const p=Crop.pixels({x:.9,y:.9,width:.1,height:.1},4000,3000);
 assert.equal(p.x+p.width,4000);assert.equal(p.y+p.height,3000);
});
test('garment mask keeps unmodified fabric pixels intact and removes only erased area',()=>{
 const mask=Mask.create(4,4);Mask.paint(mask,1,1,.6,'erase');
 const pixels=new Uint8ClampedArray(4*4*4);
 for(let i=0;i<pixels.length;i+=4){pixels[i]=17;pixels[i+1]=91;pixels[i+2]=175;pixels[i+3]=255;}
 const result=Mask.apply(pixels,mask);
 const erased=(1*4+1)*4,retained=(3*4+3)*4;
 assert.deepEqual([...result.slice(erased,erased+4)],[255,255,255,255]);
 assert.deepEqual([...result.slice(retained,retained+4)],[17,91,175,255]);
});
test('production crop export explicitly requests high quality sampling',()=>{
 const code=fs.readFileSync('public/photo-crop-editor.js','utf8');
 const start=code.indexOf('function exportPhoto(useMask=true)');
 const end=code.indexOf('function update()',start);
 assert.ok(start>=0&&end>start);
 const exportCode=code.slice(start,end);
 assert.match(exportCode,/imageSmoothingEnabled=true/);
 assert.match(exportCode,/imageSmoothingQuality='high'/);
 assert.match(exportCode,/toDataURL\('image\/jpeg',\.94\)/);
});

test('manual crop mask cannot become a category or primary color recognition source',()=>{
 const code=fs.readFileSync('public/photo-crop-editor.js','utf8');
 assert.match(code,/choice=await analyze\(exportPhoto\(false\)\)/);
 assert.match(code,/const originalScene=item\.outfitSourceId\?item\.originalPhoto\?\.image:null/);
 assert.match(code,/if\(item\.outfitSourceId&&!originalScene\)throw Error\('Original outfit photo unavailable'\)/);
 assert.match(code,/const rawCrop=exportPhoto\(false\)/);
 assert.match(code,/const photo=\{image:mask\?exportPhoto\(\):rawCrop,originalPhoto:\{image:source\},cropBounds:crop\}/);
 assert.match(code,/if\(item\.outfitSourceId\|\|mask\)photo\.recognitionPhoto=\{image:rawCrop\}/);
 assert.match(code,/if\(mask&&useMask\)/);
 const app=fs.readFileSync('public/app.js','utf8');
 assert.match(app,/if\(!photo\.recognitionPhoto\)delete value\.recognitionPhoto/);
 assert.match(app,/checkPhoto\(photo\.recognitionPhoto\?\.image\|\|photo\.image\)/);
});
