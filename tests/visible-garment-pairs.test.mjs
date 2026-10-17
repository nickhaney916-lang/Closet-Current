import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateVisibleGarmentPair as check} from '../benchmark/visible-garment-pairs.mjs';
const hash='d'.repeat(64),w=60,h=80;
function mask(predicate){
 const out=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(predicate(x,y))out[y*w+x]=255;
 return out;
}
const boots=mask((x,y)=>y>=52&&y<=74&&((x>=12&&x<=23)||(x>=36&&x<=47)));
const socks=mask((x,y)=>y>=40&&y<=51&&((x>=14&&x<=21)||(x>=38&&x<=45)));
const stockings=mask((x,y)=>y>=23&&y<=58&&((x>=14&&x<=21)||(x>=38&&x<=45)));
const shoeMask=mask((x,y)=>y>=62&&y<=74&&((x>=11&&x<=24)||(x>=35&&x<=48)));
const visibleStockings=mask((x,y)=>y>=23&&y<=61&&((x>=14&&x<=21)||(x>=38&&x<=45)));
const base=(category,itemType,mask,id)=>({category,itemType,mask,id,sourceSha256:hash,confidence:.94});
const boot=base('Shoes','Tall boots',boots,'boots-pair');
const sock=base('Legwear','Knee-high socks',socks,'socks-pair');
const shoes=base('Shoes','Flats',shoeMask,'shoes-pair');
const tights=base('Legwear','Stockings',visibleStockings,'stockings-pair');
const query=(opts={})=>check({sourceSha256:hash,captureMode:'full-outfit',
  width:w,height:h,primary:boot,secondary:sock,...opts});
test('long socks clearly visible above boots can be proposed as distinct items for review',()=>{
 const r=query();
 assert.equal(r.status,'candidate-only-visible-pair');
 assert.deepEqual(r.suggestedCategories,['Shoes','Legwear']);
 assert.deepEqual(r.suggestedTypes,['Tall boots','Knee-high socks']);
 assert.equal(r.hosieryCatalogUnitsProposed,1);
 assert.equal(r.canAutoSaveSecondItem,false);
 assert.equal(r.canAutoCreateInventory,false);
 assert.equal(r.productionAuthorized,false);
});
test('stockings clearly exposed with shoes can be a second reviewed clothing candidate',()=>{
 const r=query({primary:shoes,secondary:tights});
 assert.equal(r.status,'candidate-only-visible-pair');
 assert.deepEqual(r.suggestedTypes,['Flats','Stockings']);
 assert.equal(r.newUserPrompts,0);
});
test('tiny sock cuff above boot must NOT create a separate item',()=>{
 const cuff=base('Legwear','Socks',
    mask((x,y)=>y>=50&&y<=51&&((x>=14&&x<=21)||(x>=38&&x<=45))), 'cuff-only');
 const r=query({secondary:cuff});
 assert.equal(r.status,'foreground-only');
 assert.deepEqual(r.suggestedCategories,['Shoes']);
 assert.equal(r.reason,'only-tiny-sock-cuff-or-ambiguous-stocking-visible');
});
test('single-item boot photo ignores incidental exposed socks',()=>{
 const r=query({captureMode:'single-item'});
 assert.deepEqual(r.suggestedCategories,['Shoes']);
 assert.equal(r.reason,'single-item-intent-ignores-incidental-hosiery');
});
test('identical boot and sock masks are duplicate-label conflict, not distinct pieces',()=>{
 const r=query({secondary:base('Legwear','Knee-high socks',boots,'false-sock')});
 assert.equal(r.status,'foreground-only');
 assert.equal(r.reason,'shoe-and-hosiery-claim-overlapping-fabric');
});
test('uncertain source and low-confidence hosiery do not become closet inventory',()=>{
 assert.equal(query({secondary:{...sock,confidence:.40}}).status,'foreground-only');
 assert.throws(()=>query({secondary:{...sock,sourceSha256:'b'.repeat(64)}}),/source|evidence|Invalid/);
});
test('a mitten or jacket cannot be mistaken for legwear just because close to boots',()=>{
 const r=query({secondary:{...sock,category:'Outerwear',itemType:'Coat'}});
 assert.equal(r.status,'foreground-only');
 assert.equal(r.reason,'not-a-legwear-pair');
});
test('one hosiery pair is one catalog candidate, not separate units for each sock',()=>{
 const r=query();
 assert.equal(r.hosieryCatalogUnitsProposed,1);
 assert.equal(r.canAutoCreateInventory,false);
});
test('existing coat and visible sweater path still works without hidden item inference',()=>{
 const c=base('Outerwear','Coat',mask((x,y)=>y>=3&&y<=35&&x>=7&&x<=51&&!(x>=25&&x<=34&&y>=12&&y<=30)), 'coat');
 const s=base('Tops','Sweater',mask((x,y)=>y>=12&&y<=30&&x>=25&&x<=34),'sweater');
 const r=query({primary:c,secondary:s});
 assert.equal(r.status,'candidate-only-visible-pair');
 assert.deepEqual(r.suggestedCategories,['Outerwear','Tops']);
 assert.equal(r.canAutoCreateInventory,false);
});
test('inferred hosiery from a collar / upper-garment image has no supported route',()=>{
 const r=query({primary:{...boot,category:'Tops',itemType:'Sweater'}});
 assert.equal(r.status,'foreground-only');
 assert.equal(r.canAutoCreateInventory,false);
});
test('invalid and malformed masks do not become apparent evidence',()=>{
 assert.throws(()=>query({secondary:{...sock,mask:new Uint8Array(17)}}));
 assert.throws(()=>query({secondary:{...sock,mask:Uint8Array.from(socks,v=>v?63:0)}}));
 assert.throws(()=>query({width:0}));
 assert.throws(()=>query({sourceSha256:'not-a-hash'}));
});
