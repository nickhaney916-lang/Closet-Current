const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){const c={URL,encodeURIComponent,Date};vm.createContext(c);for(const file of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(fs.readFileSync('public/'+file,'utf8'),c);return c;}
const piece=(id,category,itemType,color='Black',extra={})=>({id,category,itemType,color,pattern:'Solid',sleeveLength:'Unknown',seasons:[],name:itemType,image:'photo-'+id,...extra});
const closet=[piece('polo','Tops','Polo','White'),piece('tee','Tops','T-shirt','Blue'),piece('jeans','Bottoms','Jeans','Blue'),piece('trousers','Bottoms','Trousers'),piece('loafers','Shoes','Loafers','Brown'),piece('sneakers','Shoes','Sneakers','White'),piece('layer','Outerwear','Blazer'),piece('bag','Accessories','Bag','Brown')];
test('men casual date night builds combinations of actual owned pieces with no shopping placeholders',()=>{
 const c=setup(),before=JSON.stringify(closet),results=c.styleOwnedCollection(closet,{request:'Casual date night',audience:'Men',season:'Fall'});assert.equal(results.length,3);assert.equal(results[0].missing.length,0);
 for(const result of results){const ids=Object.values(result.board.slots);assert.equal(ids.length,new Set(ids).size);assert.ok(ids.every(id=>closet.some(x=>x.id===id)));assert.equal(Object.keys(result.board.ideas).length,0);}
 assert.equal(new Set(results.map(x=>x.signature)).size,3);assert.equal(JSON.stringify(closet),before);
});
test('activewear excludes jeans, dress shoes, and optional dressy layers',()=>{
 const c=setup(),all=[...closet,piece('leggings','Bottoms','Leggings')],r=c.styleOwnedCollection(all,{request:'Activewear',season:'Fall'})[0];assert.equal(r.board.slots.bottom,'leggings');assert.equal(r.board.slots.shoes,'sneakers');assert.equal(r.board.slots.layer,undefined);assert.ok(r.notices.some(x=>x.includes('actual activity')));
});
test('insufficient activewear stays partial instead of substituting jeans and loafers',()=>{
 const c=setup(),r=c.styleOwnedCollection([closet[1],closet[2],closet[4]],{request:'Activewear'})[0];assert.equal(r.board.slots.bottom,undefined);assert.equal(r.board.slots.shoes,undefined);assert.deepEqual(Array.from(r.missing),['bottom','shoes']);
});
test('current shared trend data changes the preferred own garment and preserves source attribution',()=>{
 const c=setup(),request={request:'Casual',audience:'Men',season:'Fall'},simple=[piece('tee','Tops','T-shirt'),piece('polo','Tops','Polo'),piece('jeans','Bottoms','Jeans'),piece('sneakers','Shoes','Sneakers')];
 const library={updatedAt:'2026-10-13T03:00:00Z',sources:[{id:'gq',title:'Verified style report',url:'https://www.gq.com/style'}],directions:[{slot:'top',type:'Polo',label:'Knitted polo',reason:'A polished casual direction.',sourceId:'gq',audiences:['Men'],occasions:['Casual'],seasons:['Fall']}]};
 assert.equal(c.styleOwnedCollection(simple,request,null)[0].board.slots.top,'tee');const r=c.styleOwnedCollection(simple,request,library)[0];assert.equal(r.board.slots.top,'polo');assert.equal(r.references[0].source.id,'gq');assert.equal(r.trendUpdatedAt,library.updatedAt);
});
test('a dress covers the bottom slot and does not add trousers',()=>{
 const c=setup(),r=c.styleOwnedCollection([piece('dress','Dresses','Casual dress'),piece('shoe','Shoes','Flats')],{request:'Casual date night',audience:'Women'})[0];assert.equal(r.board.slots.top,'dress');assert.equal(r.board.slots.bottom,undefined);assert.equal(r.missing.length,0);
});
test('known seasonal conflicts are excluded and unknown records remain explicitly uncertain',()=>{
 const c=setup(),r=c.styleOwnedCollection([piece('summer','Tops','T-shirt','Red',{seasons:['Summer']}),piece('winter','Tops','Sweater',''),closet[2],closet[4]],{request:'Casual',season:'Winter'})[0];assert.equal(r.board.slots.top,'winter');assert.ok(r.notices.some(x=>x.includes('colors are unknown')));assert.ok(r.notices.some(x=>x.includes('seasonal details are unknown')));
});
test('empty closet and unindexed clothing never produce invented outfits',()=>{
 const c=setup();assert.equal(c.styleOwnedCollection([]).length,0);assert.equal(c.styleOwnedCollection([piece('unknown','Uncategorized','Unknown')]).length,0);
});
test('source audience, occasion, and season must match before a trend influences an outfit',()=>{
 const c=setup(),library={sources:[{id:'vogue'}],directions:[{slot:'shoes',type:'Loafers',sourceId:'vogue',audiences:['Women'],occasions:['Work'],seasons:['Summer']}]};assert.equal(c.stylistTrendMatches(closet[4],'shoes',{audience:'Men',occasion:'Dinner',season:'Fall'},library).length,0);
});
