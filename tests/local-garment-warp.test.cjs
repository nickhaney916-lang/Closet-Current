'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const warp=require('../public/local-garment-warp.js');

test('mesh offers finite local geometry for approved clothing classes only',()=>{
 for(const category of ['Tops','Bottoms','Dresses','Outerwear']){
  const m=warp.makeMesh(300,600,category);
  assert.equal(m.category,category);assert.equal(m.vertices.length,25);
  assert.equal(m.triangles.length,32);
  assert.equal(m.sourcePhotoChanged,false);
  assert.equal(m.photorealisticFitVerified,false);
  for(const v of m.vertices)assert.ok(v.x>=0&&v.x<=m.width&&v.y>=0&&v.y<=m.height,'no clipped boundary vertices');
  for(const t of m.triangles){
   const transform=warp.affine(t.map(i=>m.vertices[i]));
   assert.ok(transform&&transform.every(Number.isFinite));
  }
 }
 for(const category of ['Shoes','Other',undefined,null,'__proto__'])
  assert.equal(warp.makeMesh(300,600,category),null);
});

test('mesh resizes torso silhouette conservatively without changing source vertices',()=>{
 const m=warp.makeMesh(400,600,'Tops');
 assert.equal(m.vertices[0].sourceX,0);
 assert.equal(m.vertices[0].sourceY,0);
 assert.equal(m.vertices[24].sourceX,400);
 assert.equal(m.vertices[24].sourceY,600);
 assert.ok(m.vertices[20].x>0,'lower left corner pinched inward');
 assert.ok(m.vertices[24].x<400,'lower right corner pinched inward');
 assert.equal(m.vertices[12].x,200,'center column must remain at body center');
 assert.equal(m.vertices[24].y,600,'hem stays on bottom');
});

test('each affine triangle maps its exact three source coordinates to warped vertices',()=>{
 const m=warp.makeMesh(220,440,'Dresses');
 for(const ids of m.triangles){
  const points=ids.map(i=>m.vertices[i]),mat=warp.affine(points);
  assert.ok(mat);
  for(const p of points){
   assert.ok(Math.abs((mat[0]*p.sourceX+mat[2]*p.sourceY+mat[4])-p.x)<1e-6);
   assert.ok(Math.abs((mat[1]*p.sourceX+mat[3]*p.sourceY+mat[5])-p.y)<1e-6);
  }
 }
 assert.equal(warp.affine([{sourceX:0,sourceY:0},{sourceX:1,sourceY:1},{sourceX:2,sourceY:2}]),null);
 assert.equal(warp.affine([]),null);
});

test('reject invalid, oversized or corrupt image geometry before canvas allocation',()=>{
 for(const pair of [[0,200],[23,200],[200,23],[10000,10000],[500,NaN],[500.2,600],[-5,600]])
  assert.equal(warp.makeMesh(...pair,'Tops'),null);
 assert.equal(warp.warpTransparentImage(null,'Tops',{}),null);
 assert.equal(warp.warpTransparentImage({naturalWidth:120,naturalHeight:240},'Shoes',{getContext:()=>({})}),null);
});

test('mesh compositing is local and display-only: no provider API or source replacement',()=>{
 const src=fs.readFileSync('public/local-garment-warp.js','utf8');
 const preview=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 assert.match(html,/script src="local-garment-warp\.js"/);
 assert.ok(html.indexOf('src="local-garment-warp.js"')<html.indexOf('src="reusable-figure-preview.js"'));
 assert.match(preview,/ClosetGarmentWarp\.warpTransparentImage/);
 assert.match(preview,/const cancelled=\(\)=>revision!==renderRevision/);
 assert.match(preview,/if\(cancelled\(\)\)return/);
 assert.ok(!/fetch\(|localStorage|sessionStorage|\.setItem\(|\.postMessage\(/.test(src));
 assert.ok(!/FASHN|OPENAI_API_KEY|https:\/\//.test(src));
 assert.match(src,/photorealisticFitVerified:false/);
});

test('renderer does not alter input garment pixels',()=>{
 const calls=[],image={naturalWidth:100,naturalHeight:150},fakeCanvas={
   width:0,height:0,getContext(){return {
     clearRect(){calls.push('clear');},save(){calls.push('save');},
     restore(){calls.push('restore');},beginPath(){},moveTo(){},lineTo(){},
     closePath(){},clip(){},setTransform(...args){assert.equal(args.length,6);},
     drawImage(img){assert.equal(img,image);calls.push('draw');},
     getImageData(){return {data:new Uint8ClampedArray(100*150*4)};},
     putImageData(pixels){assert.equal(pixels.data.length,100*150*4);calls.push('put');}
   };},toDataURL(t){assert.equal(t,'image/png');return 'data:image/png;base64,LOCAL';}
 };
 const original=JSON.stringify(image),result=warp.warpTransparentImage(image,'Outerwear',fakeCanvas);
 assert.equal(result,'data:image/png;base64,LOCAL');
 assert.equal(calls.filter(c=>c==='draw').length,1);
 assert.equal(calls.filter(c=>c==='put').length,1);
 assert.equal(JSON.stringify(image),original);
 assert.equal(fakeCanvas.width,100);assert.equal(fakeCanvas.height,150);
});

test('alpha bounds retain low-opacity cuffs and ignore only fully clear padding',()=>{
 const data=new Uint8ClampedArray(40*50*4);
 data[(5*40+8)*4+3]=1;data[(46*40+32)*4+3]=255;
 const old=Buffer.from(data);
 assert.deepEqual(warp.alphaBounds(data,40,50),{left:8,top:5,width:25,height:42});
 assert.deepEqual(Buffer.from(data),old);
 assert.equal(warp.alphaBounds(new Uint8ClampedArray(40*50*4),40,50),null);
 assert.equal(warp.alphaBounds(data,40,51),null);
});
test('central fabric, collar and seam geometry has no horizontal or vertical strain',()=>{
 for(const category of Object.keys(warp.profiles)){
  const m=warp.makeMesh(400,600,category);
  for(const v of m.vertices.filter(v=>v.sourceX>=100&&v.sourceX<=300)){
   assert.equal(v.x,v.sourceX);assert.equal(v.y,v.sourceY);
  }
  // Positive orientation: no folded-over or inverted triangles.
  for(const ids of m.triangles){
   const [a,b,c]=ids.map(i=>m.vertices[i]);
   assert.ok((b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y)>0);
  }
 }
});

test('inverse rasterization preserves central texture and soft alpha without mesh cracks',()=>{
 const width=80,height=100,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;data.set([x*3,y*2,70,128],i);
 }
 const before=Buffer.from(data),out=warp.rasterize(data,warp.makeMesh(width,height,'Tops'));
 for(let y=0;y<height;y++)for(let x=20;x<60;x++){
  const i=(y*width+x)*4;
  assert.deepEqual([...out.slice(i,i+4)],[...data.slice(i,i+4)]);
 }
 assert.deepEqual(Buffer.from(data),before);
 for(let y=0;y<height;y++)for(let x=10;x<70;x++)assert.equal(out[(y*width+x)*4+3],128);
});
test('pale attached neck ambiguity is held without guessing missing fabric',()=>{
 const width=100,height=160,bounds={left:10,top:0,width:80,height:160};
 const data=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<width*height;i++)data.set([30,20,25,255],i*4);
 assert.equal(warp.hasAmbiguousNeck(data,width,height,bounds),false);
 for(let y=0;y<20;y++)for(let x=42;x<58;x++)data.set([180,180,180,255],(y*width+x)*4);
 const before=Buffer.from(data);
 assert.equal(warp.hasAmbiguousNeck(data,width,height,bounds),true);
 assert.deepEqual(Buffer.from(data),before);
});
