'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const geometry=require('../public/garment-fit-geometry.js');
const {create,MAX_BYTES}=require('../public/figure-preview-cache.js');
function engine(){const c={URL,encodeURIComponent,Date};vm.createContext(c);for(const f of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);return c;}
const piece=(id,category,itemType)=>({id,category,itemType,color:'Blue',pattern:'Solid',seasons:[],image:'photo-'+id});
const base=[piece('new','Tops','T-shirt'),piece('pants','Bottoms','Jeans'),piece('shoes','Shoes','Sneakers')];
test('three owned layers produce three unique complete options around one newly photographed shirt',()=>{
 const c=engine(),closet=[...base,...['a','b','c'].map(id=>piece(id,'Outerwear','Jacket'))],before=JSON.stringify(closet);
 const r=c.styleOwnedCollection(closet,{anchorItemId:'new',season:'Fall'});
 assert.equal(r.length,3);assert.equal(new Set(r.map(x=>x.board.slots.layer)).size,3);
 for(const x of r){assert.equal(x.missing.length,0);assert.equal(x.board.slots.top,'new');assert.ok(Object.values(x.board.slots).every(id=>closet.some(p=>p.id===id)));}
 assert.equal(JSON.stringify(closet),before);
});
test('layer alternatives never duplicate the pinned item or add seasonal conflicts',()=>{
 const c=engine(),closet=[...base,piece('a','Outerwear','Jacket'),{...piece('summer','Outerwear','Jacket'),seasons:['Summer']}];
 const r=c.styleOwnedCollection(closet,{anchorItemId:'a',season:'Winter'});
 assert.equal(r.length,1);assert.equal(r[0].board.slots.layer,'a');assert.equal(new Set(Object.values(r[0].board.slots)).size,Object.values(r[0].board.slots).length);
});
test('sparse closet is never padded with imaginary clothes or duplicate combinations',()=>{
 const c=engine();const r=c.styleOwnedCollection([base[0]],{anchorItemId:'new'});
 assert.equal(r.length,1);assert.deepEqual(Array.from(r[0].missing),['bottom','shoes']);
});
test('retina long pants, dresses and wide garments retain their photographic aspect ratio',()=>{
 for(const [slot,category,width,height] of [['bottom','Bottoms',480,1900],['top','Dresses',400,2300],['layer','Outerwear',1900,480]]){
  const rect={left:20,top:18,width:60,height:70};const fit=geometry.fitPlacement(rect,width,height,{slot,category});
  assert.ok(fit,slot+' must display within the 1MP limit');
  assert.ok(Math.abs((fit.width*647)/(fit.height*1199)-width/height)<1e-10);
  assert.ok(fit.left>=rect.left&&fit.left+fit.width<=rect.left+rect.width+1e-9);
  assert.ok(fit.top>=rect.top&&fit.top+fit.height<=rect.top+rect.height+1e-9);
 }
});
test('oversized and malformed cutouts still fail the unchanged total pixel budget',()=>{
 for(const [w,h] of [[1000,2000],[Infinity,10],[12.5,1900],[1,1900]])assert.equal(geometry.fitPlacement({left:20,top:18,width:60,height:70},w,h,{slot:'bottom',category:'Bottoms'}),null);
});
test('supported high-resolution photo encodings can reuse approved display pixels without reprocessing',()=>{
 const cache=create(),q={owner:'alice',id:'long-pants',category:'Bottoms',primaryColor:'Blue',source:'A'.repeat(2_850_000)},result={image:'approved-display',width:480,height:1900};
 assert.equal(cache.put(q,result),true);assert.deepEqual(cache.get(q),result);assert.ok(cache.info().bytes<=MAX_BYTES);
 assert.equal(cache.get({...q,source:q.source+'B'}),null);
 assert.equal(cache.get({...q,owner:'bob'}),null);assert.equal(cache.info().entryCount,0);
});
