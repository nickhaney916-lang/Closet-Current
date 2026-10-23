'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../public/reusable-figure-engine.js');
const photo=n=>'data:image/png;base64,'+n.repeat(160);
const original=photo('A'),display=photo('B');
const item={id:'shirt',category:'Tops',image:display,originalPhoto:{image:original},cropBounds:{x:.1,y:.2,width:.5,height:.6}};
const board={slots:{top:'shirt'}};
test('saved original and native crop are source of truth, not display pixels',()=>{
 const before=JSON.stringify(item),p=E.plan(board,[item],'female','a').placements[0];
 assert.equal(E.plan(board,[{...item,image:''}]).placements[0].image,original);
 assert.equal(p.image,original);assert.deepEqual(p.crop,item.cropBounds);
 assert.equal(JSON.stringify(item),before);
});
test('original bytes, crop or provenance change invalidates render and cache',()=>{
 const baseline=E.plan(board,[item]);
 for(const change of [x=>x.originalPhoto.image=photo('C'),x=>x.cropBounds.x=.2,x=>x.originalPhoto.sha256='changed']){
  const next=structuredClone(item);change(next);const p=E.plan(board,[next]);
  assert.equal(E.samePlan(baseline,p),false);
  assert.notEqual(baseline.placements[0].cacheSource,p.placements[0].cacheSource);
 }
});
test('stale display masks cannot become original pixels',()=>{
 const changed={...item,image:photo('D'),maskApplied:true};
 assert.equal(E.plan(board,[changed]).placements[0].image,original);
 for(const originalPhoto of [null,{image:'https://remote.invalid/source.jpg'},{image:''}])
  assert.deepEqual(E.plan(board,[{...item,originalPhoto}]).skipped,['top']);
});
test('owner checks include nested photo and account aliases',()=>{
 for(const location of ['item','originalPhoto','recognitionPhoto'])for(const key of ['ownerId','owner_id','accountId']){
  const x=structuredClone(item);
  if(location==='item')x[key]='b';else x[location]={...x[location],[key]:'b'};
  assert.deepEqual(E.plan(board,[x],'female','a').skipped,['top']);
 }
 assert.equal(E.plan(board,[{...item,accountId:'a'}],'female','a').placements.length,1);
});
test('invalid crops and missing outfit originals are held without overlaying whole scene',()=>{
 for(const cropBounds of [null,{x:0,y:0,width:0,height:1},{x:0,y:0,width:2,height:1},{x:NaN,y:0,width:1,height:1}])
  assert.deepEqual(E.plan(board,[{...item,cropBounds}]).skipped,['top']);
 for(const x of [{...item,outfitSourceId:'scene',originalPhoto:undefined},{...item,outfitSourceId:'scene',cropBounds:undefined}])
  assert.deepEqual(E.plan(board,[x]).skipped,['top']);
});
