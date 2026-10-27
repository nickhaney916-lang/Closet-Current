import {test} from 'node:test';
import assert from 'node:assert/strict';
import {measureVisiblePanelCoverage,requireVisiblePanelCoverage}
 from '../research/work47/fit.mjs';

const pixels=(w,h,within=()=>true)=>{
 const data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;data[i]=101;data[i+1]=80;data[i+2]=62;
  data[i+3]=within(x,y)?255:0;
 }
 return data;
};
const plan=(rects)=>({pieces:rects.map(polygon=>({polygon,matrix:[1,0,0,1,0,0]}))});
const rect=(left,top,right,bottom)=>[[left,top],[right,top],[right,bottom],[left,bottom]];
const metric=(data,polys)=>measureVisiblePanelCoverage(data,40,40,plan(polys),100,100);
test('all reviewed opaque fabric survives simple panel composition without false loss',()=>{
 const v=metric(pixels(40,40),[rect(0,0,100,100)]);
 assert.deepEqual(v,{opaque:1600,retained:1600,ratio:1});
 assert.equal(requireVisiblePanelCoverage(v),v);
});
test('almost empty panel cannot silently hide 90 percent of previously reviewed garment',()=>{
 const v=metric(pixels(40,40),[rect(0,0,10,100)]);
 assert.equal(v.opaque,1600);
 assert.ok(v.retained<=160);
 assert.ok(v.ratio<=.10);
 assert.throws(()=>requireVisiblePanelCoverage(v),/discard too many/);
});
test('no visible garment and fully empty or misplaced panels cannot be a successful fit',()=>{
 const none=metric(pixels(40,40,()=>false),[rect(0,0,100,100)]);
 assert.equal(none.opaque,0);
 assert.equal(none.retained,0);
 assert.throws(()=>requireVisiblePanelCoverage(none));
 const missing=metric(pixels(40,40),[rect(105,105,115,115)]);
 assert.equal(missing.retained,0);
 assert.throws(()=>requireVisiblePanelCoverage(missing));
});
test('split rigid sleeve/body panels count unique visible fabric only once',()=>{
 const full=pixels(40,40);
 const good=metric(full,[rect(0,0,60,100),rect(40,0,100,100)]);
 assert.equal(good.retained,1600);
 assert.equal(good.ratio,1);
 assert.equal(requireVisiblePanelCoverage(good).opaque,1600);
});
test('mask antialias alpha below 128 is not miscounted as solid fabric',()=>{
 const src=pixels(40,40,(_,y)=>y<20);
 // make the transparent half carry translucent edge alpha below 128
 for(let y=20;y<40;y++)for(let x=0;x<40;x++)src[(y*40+x)*4+3]=40;
 const result=metric(src,[rect(0,0,100,55)]);
 assert.equal(result.opaque,800);
 assert.equal(result.retained,800);
 assert.equal(requireVisiblePanelCoverage(result).ratio,1);
});
test('large image, NaN, forged coverage and a clipped source-to-body projection fail closed',()=>{
 assert.throws(()=>measureVisiblePanelCoverage([],40,40,plan([rect(0,0,100,100)]),100,100));
 for(const c of [{opaque:1,retained:1,ratio:1},{opaque:100,retained:101,ratio:1},
 {opaque:500,retained:500,ratio:NaN},{opaque:500,retained:500,ratio:.59},
 {opaque:500,retained:500,ratio:Infinity},null]){
  assert.throws(()=>requireVisiblePanelCoverage(c));
 }
 const projected=plan([rect(0,0,100,100)]);
 projected.pieces[0].matrix=[1,0,0,1,400,0];
 assert.throws(()=>measureVisiblePanelCoverage(pixels(40,40),40,40,projected,100,100),/crop visible garment/);
});
