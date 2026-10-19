import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateClearlyVisibleLayers as evaluate} from '../benchmark/clearly-visible-layers.mjs';
const sha='f'.repeat(64),width=20,height=20;
function region(fn){const a=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(fn(x,y))a[y*width+x]=255;
 return a;}
const coatMask=region((x,y)=>y>=2&&y<=17&&x>=2&&x<=17&&!(x>=7&&x<=12&&y>=5&&y<=15));
const sweaterMask=region((x,y)=>y>=6&&y<=14&&x>=7&&x<=12);
const outer={id:'coat1',sourceSha256:sha,category:'Outerwear',itemType:'Coat',confidence:.93,mask:coatMask};
const inner={id:'sweater1',sourceSha256:sha,category:'Tops',itemType:'Sweater',confidence:.91,mask:sweaterMask};
const check=(opts={})=>evaluate({sourceSha256:sha,captureMode:'full-outfit',
 width,height,coat:outer,sweater:inner,...opts});
test('open coat with substantial exposed sweater is a review candidate, never automatic catalog',()=>{
 const r=check();
 assert.equal(r.status,'candidate-only-visible-pair');
 assert.deepEqual(r.suggestedCategories,['Outerwear','Tops']);
 assert.equal(r.canAutoSaveSecondItem,false);
 assert.equal(r.secondItemVerified,false);
 assert.equal(r.noNewConfirmationUI,true);
});
test('single-item capture ignores incidental sweater, focusing on deliberate coat shot',()=>{
 const r=check({captureMode:'single-item'});
 assert.deepEqual(r.suggestedCategories,['Outerwear']);
 assert.equal(r.status,'single-intent-only');
});
test('tiny collar-only peek never becomes a second garment',()=>{
 const collar={...inner,mask:region((x,y)=>x>=9&&x<=11&&y>=5&&y<=6)};
 const r=check({sweater:collar});
 assert.deepEqual(r.suggestedCategories,['Outerwear']);
 assert.equal(r.reason,'only-small-collar-cuff-or-ambiguous-sweater-visible');
});
test('cuffs-only exposure is not enough even if area is nonzero',()=>{
 const cuffs={...inner,mask:region((x,y)=>y>=10&&y<=16&&((x>=0&&x<=1)||(x>=18&&x<=19)))};
 const r=check({sweater:cuffs});
 assert.equal(r.canAutoSaveSecondItem,false);
 assert.equal(r.reason,'only-small-collar-cuff-or-ambiguous-sweater-visible');
});
test('identical coat and sweater mask indicates duplicate labels, not two pieces',()=>{
 const duplicate={...inner,mask:coatMask};
 const r=check({sweater:duplicate});
 assert.equal(r.reason,'coat-and-sweater-claims-overlapping-pixels');
});
test('unknown type, bad origin and invalid mask pixels fail closed',()=>{
 assert.throws(()=>check({sweater:{...inner,itemType:'Unknown'}}));
 assert.throws(()=>check({sweater:{...inner,sourceSha256:'a'.repeat(64)}}));
 assert.throws(()=>check({sweater:{...inner,mask:Uint8Array.from(sweaterMask,v=>v?55:0)}}));
 assert.throws(()=>check({sourceSha256:'invalid'}));
});
test('uncertain coat or sweater cannot be counted as two garments',()=>{
 assert.equal(check({sweater:{...inner,confidence:.71}}).status,'single-intent-only');
 assert.equal(check({coat:{...outer,confidence:.59}}).status,'single-intent-only');
 assert.equal(check({sweater:null}).status,'single-intent-only');
});
test('inference evidence never manufactures a second physical item',()=>{
 const r=check();
 assert.equal(r.productionAuthorized,false);
 assert.equal(r.requiresIndependentMaskReview,true);
 assert.equal(r.originalSourcePreserved,true);
});
