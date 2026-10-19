'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const geometry=require('../public/garment-fit-geometry.js');
const {create}=require('../public/figure-preview-cache.js');
function cloth(width=100,height=150,left=10,right=72){
 const pixels=new Uint8ClampedArray(width*height*4);
 for(let y=10;y<74;y++)for(let x=left;x<right;x++)
  pixels.set([40,110,175,255],(y*width+x)*4);
 for(let y=74;y<height-10;y++)for(let x=9;x<91;x++)
  pixels.set([40,110,175,255],(y*width+x)*4);
 return pixels;
}
test('stable upper silhouette center estimates asymmetric torso position without changing source pixels',()=>{
 const src=cloth(),before=Buffer.from(src);
 const anchor=geometry.silhouetteAnchor(src,100,150,'Tops');
 assert.ok(anchor, 'enough stable alpha contour evidence exists');
 assert.ok(anchor.center>.35&&anchor.center<.44, 'left-shifted upper silhouette is observed');
 assert.equal(anchor.sourcePixelsChanged,false);
 assert.equal(anchor.physicalFitOrPoseVerified,false);
 assert.equal(anchor.verifiedOnlyOnApprovedCutout,true);
 assert.deepEqual(Buffer.from(src),before);
});
test('asymmetric upper cutout shifts only within calibrated figure slot without stretching or changing neckline height',()=>{
 const src=cloth();
 const center=geometry.silhouetteAnchor(src,100,150,'Tops').center;
 const room={left:24,top:16,width:52,height:40};
 const before=geometry.fitPlacement(room,100,150,{slot:'top',category:'Tops'});
 const after=geometry.fitPlacement(room,100,150,{slot:'top',category:'Tops',silhouetteCenter:center});
 assert.ok(after.left>before.left);
 assert.ok(after.left>=room.left&&after.left+after.width<=room.left+room.width+1e-9);
 assert.ok(after.left-before.left<=room.width*.06+1e-9);
 assert.equal(after.width,before.width);assert.equal(after.height,before.height);
 assert.equal(after.top,before.top);
 assert.equal(after.aspectPreserved,true);assert.equal(after.fitVerified,false);
});
test('unreliable contours, blank masks and invalid class labels do not move the figure alignment',()=>{
 const empty=new Uint8ClampedArray(100*150*4),raw=cloth();
 assert.equal(geometry.silhouetteAnchor(empty,100,150,'Tops'),null);
 assert.equal(geometry.silhouetteAnchor(raw,100,150,'Shoes'),null);
 assert.equal(geometry.silhouetteAnchor(raw,100,150,'__proto__'),null);
 assert.equal(geometry.silhouetteAnchor(raw,100,NaN,'Tops'),null);
 assert.equal(geometry.silhouetteAnchor(raw,9999,150,'Tops'),null);
 assert.equal(geometry.silhouetteAnchor(new Uint8Array(3),100,150,'Tops'),null);
 const room={left:24,top:16,width:52,height:40};
 const original=geometry.fitPlacement(room,100,150,{slot:'top',category:'Tops'});
 for(const center of [null,NaN,Infinity,-.5,.9,undefined])
  assert.deepEqual(geometry.fitPlacement(room,100,150,
   {slot:'top',category:'Tops',silhouetteCenter:center}),original);
 assert.deepEqual(geometry.fitPlacement(room,100,150,
  {slot:'shoes',category:'Shoes',silhouetteCenter:.35}),
  geometry.fitPlacement(room,100,150,{slot:'shoes',category:'Shoes'}));
});
test('highly inconsistent upper-edge silhouette is rejected rather than guessed',()=>{
 const w=100,h=150,p=new Uint8ClampedArray(w*h*4);
 for(let y=12;y<70;y++){
  const l=y%2?2:54,r=y%2?45:97;
  for(let x=l;x<r;x++)p.set([30,60,80,255],(y*w+x)*4);
 }
 assert.equal(geometry.silhouetteAnchor(p,w,h,'Tops'),null);
});
test('private garment cache retains only finite conservative center offsets and clears them per account',()=>{
 const c=create(),src='data:image/png;base64,'+'AAA'.repeat(60);
 const key={owner:'alpha-user',id:'shirt',source:src,category:'Tops',primaryColor:'Blue'};
 const image='data:image/png;base64,'+'BBB'.repeat(40);
 assert.equal(c.put(key,{image,width:100,height:150,silhouetteCenter:.39}),true);
 assert.equal(c.get(key).silhouetteCenter,.39);
 assert.equal(c.put({...key,id:'bad'}, {image,width:100,height:150,silhouetteCenter:.95}),true);
 assert.equal(Object.hasOwn(c.get({...key,id:'bad'}),'silhouetteCenter'),false);
 assert.equal(c.get({...key,owner:'different'}),null);
 assert.equal(c.info().entryCount,0);
});
test('module only measures approved transparent display copies, not Work held-photo proposal output',()=>{
 const fit=fs.readFileSync('public/garment-fit-geometry.js','utf8');
 const preview=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const cache=fs.readFileSync('public/figure-preview-cache.js','utf8');
 assert.match(fit,/function silhouetteAnchor\(/);
 assert.match(preview,/ClosetGarmentFitGeometry\?\.silhouetteAnchor/);
 assert.match(preview,/silhouetteCenter:prepared\.silhouetteCenter/);
 assert.match(cache,/silhouetteCenter/);
 assert.ok(!/ClosetSourceGuidedMask|ClosetDarkStudioMask/.test(preview),
  'unreviewed real-photo proposal cannot be promoted to user-facing fit');
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|indexedDB|localStorage|sessionStorage/.test(fit));
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|indexedDB|localStorage|sessionStorage/.test(cache));
});
