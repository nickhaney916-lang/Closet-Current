import test from 'node:test';
import assert from 'node:assert/strict';
import {
 INDEX01_CATEGORIES,INDEX01_SLOTS,WardrobeIndexError,buildOwnerWardrobeIndex,
 queryOwnerWardrobeIndex,previewOwnerWardrobeAddition,createOwnerWardrobeBridge
} from '../research/wardrobe-index-01/owner-wardrobe-index.mjs';

const A='owner-private-A',B='owner-private-B';
const h=c=>c.repeat(64);
const piece=(id,category,itemType,color,extra={})=>({
 id,category,itemType,color,name:color+' '+itemType,sourceHashVerified:false,
 seasons:['Fall'],...extra
});
const demo=()=>[
 piece('shirt','Tops','T-shirt','Red',{seasons:['Summer','Fall'],sleeveLength:'Short sleeve',notes:'favorite cotton'}),
 piece('skirt','Bottoms','Skirt','Blue',{seasons:['Spring'],colorSource:'user'}),
 piece('jeans','Bottoms','Jeans','Navy',{seasons:['All seasons']}),
 piece('shoe','Shoes','Sneakers','White',{seasons:['Fall']}),
 piece('boot','Shoes','Ankle boots','Black',{seasons:['Winter']}),
 piece('dress','Dresses','Casual dress','Pink',{seasons:['Summer']}),
 piece('coat','Outerwear','Coat','Brown',{seasons:['Winter']}),
 piece('bag','Accessories','Bag','Brown'),
 piece('earrings','Accessories','Jewelry','Gold')
];

test('INDEX-01 indexes saved category, subtype, color and canonical outfit slots, without inventing types',()=>{
 const ix=buildOwnerWardrobeIndex(A,demo());
 assert.deepEqual(INDEX01_CATEGORIES,['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized']);
 assert.ok(INDEX01_SLOTS.includes('layer3'));
 assert.equal(ix.summary.total,9);
 assert.equal(ix.summary.byCategory.Bottoms,2);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Bottoms'}).ids,['skirt','jeans']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Bottoms',itemType:'Skirt'}).ids,['skirt']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Shoes',itemType:'Ankle boots'}).ids,['boot']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{color:'bRoWn'}).ids,['coat','bag']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{slot:'bottom'}).ids,['skirt','jeans']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{slot:'layer3'}).ids,['coat']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{slot:'finish'}).ids,[]);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{slot:'accessory'}).ids,['earrings']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{slot:'bag'}).ids,['bag']);
});

test('INDEX-01 multifield search, seasons, sleeves and facets are deterministic and paginated',()=>{
 const ix=buildOwnerWardrobeIndex(A,demo());
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{search:'RED cotton'}).ids,['shirt']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{season:'Summer'}).ids,['shirt','jeans','dress']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{sleeveLength:'Short sleeve'}).ids,['shirt']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Shoes',limit:1,offset:1}).ids,['boot']);
 assert.equal(queryOwnerWardrobeIndex(ix,A,{category:'Shoes',limit:1}).total,2);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Shoes'}).facets.types,{'Sneakers':1,'Ankle boots':1});
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{search:'pants'}).ids,[]);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{search:'jea'}).ids,['jeans']);
 assert.throws(()=>queryOwnerWardrobeIndex(ix,A,{category:'Bogus'}),/invalid-category/);
 assert.throws(()=>queryOwnerWardrobeIndex(ix,A,{slot:'wrong'}),/invalid-slot/);
});

test('INDEX-01 never promotes local AI candidates over user correction or invents uncertain categories',()=>{
 const source=[
  piece('human-skirt','Bottoms','Skirt','Red',{userAdjusted:true,
   localChoices:[{category:'Dresses',itemType:'Casual dress',score:.99}]}),
  piece('conflict','Bottoms','Sneakers','Blue'),
  piece('unknown','Uncategorized','Unknown','Green'),
  piece('ankle','Shoes','Ankle boots','Black'),
  piece('estimate','Tops','T-shirt','Red',{colorSource:'photo-estimate'}),
  piece('missing','Outerwear','Unknown','Black'),
  piece('clipped','Tops','T-shirt','Black',{segmentHint:{clipped:true}})
 ];
 const ix=buildOwnerWardrobeIndex(A,source);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{itemType:'Skirt'}).ids,['human-skirt']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{itemType:'Sneakers'}).ids,[]);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Bottoms',review:true}).ids,['conflict']);
 assert.ok(ix.entries.find(x=>x.id==='conflict').reviewReasons.includes('type-category-conflict'));
 assert.ok(ix.entries.find(x=>x.id==='estimate').reviewReasons.includes('color-estimate-needs-confirmation'));
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{slot:'layer3'}).ids,[]);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Uncategorized'}).ids,['unknown']);
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{category:'Tops',review:true}).ids,['estimate','clipped']);
});

test('INDEX-01 two-account isolation always requires signed-in owner and blocks contaminated snapshots',()=>{
 const ix=buildOwnerWardrobeIndex(A,demo().map(x=>({...x,ownerId:A})));
 assert.throws(()=>queryOwnerWardrobeIndex(ix,B,{}),/owner-mismatch/);
 assert.throws(()=>previewOwnerWardrobeAddition(ix,B,piece('new','Tops','T-shirt','Black')),/owner-mismatch/);
 assert.throws(()=>buildOwnerWardrobeIndex(A,[piece('bad','Tops','T-shirt','Red',{ownerId:B})]),/cross-owner-record/);
 assert.throws(()=>buildOwnerWardrobeIndex(A,[piece('bad','Tops','T-shirt','Red',{userId:B})]),/cross-owner-record/);
 assert.throws(()=>buildOwnerWardrobeIndex('',[]),/owner-required/);
 assert.throws(()=>buildOwnerWardrobeIndex(A,{}),/snapshot-required/);
 assert.throws(()=>buildOwnerWardrobeIndex(A,[{category:'Tops'}]),/missing-id/);
});

test('INDEX-01 exact verified single source is rejected and shared multigarment source retains separately cut garments',()=>{
 const photos=[
  piece('dress','Dresses','Casual dress','Blue',{sourceSHA256:h('a'),sourceHashVerified:true,singleGarmentVerified:true}),
  piece('shirt','Tops','T-shirt','White',{sourceSHA256:h('b'),cutoutSHA256:h('c'),sourceHashVerified:true}),
  piece('jeans','Bottoms','Jeans','Blue',{sourceSHA256:h('b'),cutoutSHA256:h('d'),sourceHashVerified:true})
 ];
 const ix=buildOwnerWardrobeIndex(A,photos);
 assert.equal(ix.summary.sourcePairs.length,0);
 assert.equal(previewOwnerWardrobeAddition(ix,A,piece('dress-copy','Dresses','Casual dress','Blue',{
  sourceSHA256:h('a'),sourceHashVerified:true,singleGarmentVerified:true
 })).status,'reject');
 assert.equal(previewOwnerWardrobeAddition(ix,A,piece('shirt-copy','Tops','T-shirt','White',{
  sourceSHA256:h('b'),cutoutSHA256:h('c'),sourceHashVerified:true
 })).status,'reject');
 assert.equal(previewOwnerWardrobeAddition(ix,A,piece('pants-copy','Bottoms','Shorts','Blue',{
  sourceSHA256:h('b'),cutoutSHA256:h('e'),sourceHashVerified:true
 })).status,'allow');
 assert.equal(previewOwnerWardrobeAddition(ix,A,piece('ambiguous','Tops','T-shirt','White',{
  sourceSHA256:h('b'),sourceHashVerified:true
 })).status,'review');
 const ix2=buildOwnerWardrobeIndex(A,[...photos,
  piece('second-shirt','Tops','T-shirt','White',{sourceSHA256:h('b'),cutoutSHA256:h('c'),sourceHashVerified:true})]);
 assert.equal(ix2.summary.sourcePairs[0].status,'duplicate');
 assert.deepEqual(ix2.summary.sourcePairs[0].ids,['shirt','second-shirt']);
 assert.equal(ix2.summary.total,4,'never silently drop already saved garments');
});

test('INDEX-01 refuses unverified SHA duplication certainty and hides original images from every index response',()=>{
 const dataUrl='data:image/jpeg;base64,PRIVATE-DO-NOT-INDEX-OR-LOG';
 const rows=[
  piece('first','Tops','T-shirt','Red',{image:dataUrl,recognitionPhoto:{image:dataUrl},
   sourceSHA256:h('a'),sourceHashVerified:false,notes:'Love this shirt'}),
  piece('second','Tops','T-shirt','Red',{image:dataUrl,
   sourceSHA256:h('a'),sourceHashVerified:false})
 ];
 const ix=buildOwnerWardrobeIndex(A,rows);
 assert.equal(ix.summary.sourcePairs.length,0,'unverified source bytes cannot establish duplicate identity');
 const serial=JSON.stringify(ix);
 assert.ok(!serial.includes('PRIVATE-DO-NOT-INDEX'));
 assert.ok(!serial.includes('base64'));
 assert.ok(!serial.includes('image/jpeg'));
 assert.ok(!serial.includes('recognitionPhoto'));
 assert.ok(!JSON.stringify(queryOwnerWardrobeIndex(ix,A,{})).includes('PRIVATE'));
 assert.deepEqual(queryOwnerWardrobeIndex(ix,A,{search:'Love shirt'}).ids,['first']);
});

test('INDEX-01 rebuild is atomic after edits, deletes and import/restore; older snapshot never mutates',()=>{
 const original=demo();
 const prior=buildOwnerWardrobeIndex(A,original);
 original[0].category='Shoes';original[0].itemType='Sneakers';original[0].color='Black';
 original.splice(1,1);
 original.push(piece('new','Bottoms','Shorts','Green'));
 const updated=buildOwnerWardrobeIndex(A,original);
 assert.deepEqual(queryOwnerWardrobeIndex(prior,A,{category:'Tops'}).ids,['shirt']);
 assert.deepEqual(queryOwnerWardrobeIndex(updated,A,{category:'Tops'}).ids,[]);
 assert.deepEqual(queryOwnerWardrobeIndex(updated,A,{category:'Shoes'}).ids,['shirt','shoe','boot']);
 assert.deepEqual(queryOwnerWardrobeIndex(updated,A,{category:'Bottoms'}).ids,['jeans','new']);
 assert.throws(()=>buildOwnerWardrobeIndex(A,[...original,original[0]]),/duplicate-item-id/);
 assert.deepEqual(queryOwnerWardrobeIndex(updated,A,{category:'Bottoms'}).ids,['jeans','new']);
 assert.ok(Object.isFrozen(updated.entries[0]));
});

test('INDEX-01 authenticated bridge refreshes fully after save and edit; logout clears and async owner swap fails closed',async()=>{
 let owner=A,stored=demo(),release;
 const bridge=createOwnerWardrobeBridge({authenticatedOwner:()=>owner,readSavedItems:async()=>stored});
 await bridge.refresh();
 assert.equal(bridge.browse({category:'Bottoms'}).total,2);
 stored=stored.filter(x=>x.id!=='skirt').map(x=>x.id==='jeans'?{...x,category:'Dresses',itemType:'Jumpsuit'}:x);
 await bridge.refresh();
 assert.deepEqual(bridge.browse({category:'Bottoms'}).ids,[]);
 assert.deepEqual(bridge.browse({category:'Dresses'}).ids,['jeans','dress']);
 owner=B;
 assert.throws(()=>bridge.browse({}),/refresh-required/);
 bridge.clear();
 assert.throws(()=>bridge.browse({}),/refresh-required/);
 const pending=createOwnerWardrobeBridge({authenticatedOwner:()=>owner,
  readSavedItems:()=>new Promise(r=>{release=r;})});
 const promise=pending.refresh();
 owner=A;release(demo());
 await assert.rejects(promise,/owner-changed-during-read/);
 assert.throws(()=>pending.browse({}),/refresh-required/);
});

test('INDEX-01 scales to 1500 saved pieces without losing typed facets, query order or privacy',()=>{
 const source=Array.from({length:1500},(_,i)=>piece('item-'+i,
  i%2?'Tops':'Bottoms',i%2?'Hoodie':'Jeans',i%3?'Blue':'Black'));
 const ix=buildOwnerWardrobeIndex(A,source);
 const search=queryOwnerWardrobeIndex(ix,A,{category:'Bottoms',itemType:'Jeans',limit:200,offset:199});
 assert.equal(search.total,750);
 assert.equal(search.ids.length,200);
 assert.equal(search.ids[0],'item-398');
 assert.equal(ix.summary.ready,1500);
});
