'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const E=require('../public/reusable-figure-engine.js'),photo=require('./helpers/issue204-photo.cjs');
function setup(){const c={URL,encodeURIComponent,Date};vm.createContext(c);for(const f of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);return c;}
const piece=(id,category,itemType)=>({id,category,itemType,color:'Blue',pattern:'Solid',seasons:[],image:photo(id)});
const closet=[piece('top','Tops','T-shirt'),piece('pants','Bottoms','Jeans'),piece('shoe','Shoes','Sneakers'),piece('other-shoe','Shoes','Sneakers')];
test('duplicate pinned identity cannot produce outfits under either record order',()=>{
 const c=setup(),duplicate={...closet[0],color:'Red',image:photo('different')};
 for(const records of [[...closet,duplicate],[duplicate,...closet]])assert.equal(c.styleOwnedCollection(records,{anchorItemId:'top'}).length,0);
});
test('ambiguous figure source is held while independent owned garments remain visible',()=>{
 const duplicate={...closet[0],image:photo('different')},records=[...closet,duplicate],before=JSON.stringify(records);
 const p=E.plan({slots:{top:'top',bottom:'pants',shoes:'shoe'}},records);
 assert.deepEqual(p.skipped,['top']);assert.deepEqual(p.placements.map(x=>x.itemId),['pants','shoe']);assert.equal(JSON.stringify(records),before);
});
test('duplicate swap alternatives and current sources cannot be silently selected',()=>{
 const c=setup(),result=c.styleOwnedCollection(closet,{anchorItemId:'top'})[0];
 const current=result.board.slots.shoes,alternative=closet.find(x=>x.category==='Shoes'&&x.id!==current);
 assert.equal(c.stylistSwapChoices(result,'shoes',[...closet,{...alternative,color:'Red'}],'top').length,0);
 assert.equal(c.stylistSwapChoices(result,'shoes',[...closet,{...closet.find(x=>x.id===current),color:'Red'}],'top').length,0);
});
test('foreign duplicate does not override an owned original with same identity',()=>{
 const records=[...closet,{...closet[0],ownerId:'foreign'}];
 assert.equal(setup().styleOwnedCollection(records,{ownerId:'local',anchorItemId:'top'}).length,0);
 assert.deepEqual(E.plan({slots:{top:'top'}},records,'female','local').skipped,['top']);
});
