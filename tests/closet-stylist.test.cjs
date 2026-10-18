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
test('casual suggestions can use a known garment category and color with an unconfirmed subtype',()=>{const c=setup(),partial=piece('partial','Tops','Unknown','Blue',{colorSource:'photo-estimate'}),result=c.styleOwnedCollection([partial,closet[2],closet[5]],{request:'Casual'})[0];assert.equal(result.board.slots.top,'partial');assert.equal(result.missing.length,0);assert.ok(result.notices.some(x=>x.includes('types are unconfirmed')));assert.ok(result.notices.some(x=>x.includes('colors are estimated')));});
test('partial garment types do not masquerade as activewear, workwear or an accessory subtype',()=>{const c=setup(),partial=piece('partial','Tops','Unknown','Blue'),accessory=piece('accessory','Accessories','Unknown','Red');for(const request of ['Activewear','Work','Dressy dinner']){const result=c.styleOwnedCollection([partial,closet[2],closet[5]],{request})[0];assert.equal(result?.board.slots.top,undefined);}const result=c.styleOwnedCollection([closet[1],closet[2],closet[5],accessory],{request:'Casual'})[0];assert.equal(Object.values(result.board.slots).includes('accessory'),false);});

test('hidden clothing layers cannot change the score of a dress-only outfit',()=>{const c=setup(),base=[piece('dress','Dresses','Formal dress'),piece('heels','Shoes','Heels')],request={request:'Dressy dinner',audience:'All',season:'Fall'},alone=c.styleOwnedCollection(base,request)[0],withJacket=c.styleOwnedCollection([...base,piece('jacket','Outerwear','Blazer')],request)[0];assert.equal(withJacket.board.slots.layer,undefined);assert.equal(withJacket.board.slots.bottom,undefined);assert.equal(withJacket.score,alone.score);assert.equal(withJacket.signature,alone.signature);});

test('new shirt stays in every suggestion even outside the ordinary top-eight ranking',()=>{
 const c=setup(),owned=[...Array.from({length:12},(_,i)=>piece('tee-'+i,'Tops','T-shirt','White')),
  piece('new-shirt','Tops','Polo','Red'),piece('jeans','Bottoms','Jeans','Blue'),piece('shoes','Shoes','Sneakers','White')];
 const before=JSON.stringify(owned),r=c.styleOwnedCollection(owned,{request:'Casual',anchorItemId:'new-shirt'});
 assert.ok(r.length>0&&r.every(x=>x.board.slots.top==='new-shirt'));
 assert.ok(r.every(x=>Object.values(x.board.slots).every(id=>owned.some(y=>y.id===id))));
 assert.equal(JSON.stringify(owned),before);
});
test('pinned bottoms never disappear beneath a dress; pinned dress removes bottoms',()=>{
 const c=setup(),owned=[piece('dress','Dresses','Casual dress'),piece('tee','Tops','T-shirt'),
 piece('jeans','Bottoms','Jeans'),piece('shoe','Shoes','Sneakers'),piece('jacket','Outerwear','Jacket')];
 const bottom=c.styleOwnedCollection(owned,{request:'Casual',anchorItemId:'jeans'});
 assert.ok(bottom.length>0&&bottom.every(x=>x.board.slots.bottom==='jeans'&&x.board.slots.top!=='dress'));
 const dress=c.styleOwnedCollection(owned,{request:'Casual',anchorItemId:'dress'});
 assert.ok(dress.length>0&&dress.every(x=>x.board.slots.top==='dress'&&!x.board.slots.bottom&&!x.board.slots.layer));
});
test('pinned sneaker and jacket still appear when the chosen occasion usually rejects them',()=>{
 const c=setup(),owned=[piece('tee','Tops','T-shirt'),piece('jeans','Bottoms','Jeans'),
 piece('shoes','Shoes','Sneakers'),piece('jacket','Outerwear','Jacket')];
 const shoe=c.styleOwnedCollection(owned,{request:'Dressy dinner',anchorItemId:'shoes'});
 assert.ok(shoe.length>0&&shoe.every(x=>x.board.slots.shoes==='shoes'));
 assert.ok(shoe[0].notices.some(x=>x.includes('chosen piece')));
 const jacket=c.styleOwnedCollection(owned,{request:'Casual',season:'Summer',anchorItemId:'jacket'});
 assert.ok(jacket.length>0&&jacket.every(x=>x.board.slots.layer==='jacket'));
 assert.ok(jacket[0].notices.some(x=>x.includes('chosen piece')));
});
test('missing, deleted and uncategorized new pieces cannot be silently substituted',()=>{
 const c=setup(),owned=[piece('tee','Tops','T-shirt'),piece('shoe','Shoes','Sneakers'),
 piece('unknown','Uncategorized','Unknown')];
 for(const id of ['missing','unknown'])assert.equal(c.styleOwnedCollection(owned,{anchorItemId:id}).length,0);
 assert.ok(c.styleOwnedCollection(owned).length);
});

test('one-tap Style this opens the existing stylist and submits the chosen owned piece',()=>{
 const script=fs.readFileSync('public/closet-stylist.js','utf8');
 const source=script.slice(script.indexOf('let styledCollectionResults='),script.indexOf('function renderStyledCollection(){'));
 assert.ok(source.includes('function styleNewClosetItem('));
 const elements=new Map(),pieces=[piece('fresh-shirt','Tops','T-shirt'),piece('dress','Dresses','Casual dress'),piece('unknown','Uncategorized','Unknown')];
 let submitted=0,rendered=0,navigated='';
 const c={items:pieces,renderStyledCollection(){rendered++;},switchView(v){navigated=v;},
  $:id=>{if(!elements.has(id))elements.set(id,{textContent:'',requestSubmit(){submitted++;}});return elements.get(id);}};
 vm.createContext(c);vm.runInContext(source,c);
 assert.equal(c.styleNewClosetItem('fresh-shirt'),true);
 assert.equal(vm.runInContext('stylistAnchorItemId',c),'fresh-shirt');
 assert.equal(navigated,'stylist');assert.equal(submitted,1);assert.equal(rendered,1);
 assert.match(elements.get('stylistStatus').textContent,/fresh-shirt|T-shirt/);
 assert.equal(c.styleNewClosetItem('unknown'),false);
 assert.equal(c.styleNewClosetItem('not-in-closet'),false);
 assert.equal(submitted,1,'unknown and missing garments cannot create an outfit');
 assert.equal(c.styleNewClosetItem('dress'),true);
 assert.equal(vm.runInContext('stylistAnchorItemId',c),'dress');
 assert.equal(submitted,2);
 const index=fs.readFileSync('public/index.html','utf8'),app=fs.readFileSync('public/app.js','utf8');
 for(const id of ['stylistAnchor','stylistAnchorPhoto','stylistAnchorName','stylistClearAnchor'])assert.ok(index.includes('id="'+id+'"'));
 assert.match(app,/styleNewClosetItem\(item\.id\)/);
});

test('partial looks retain explicit required garment gaps',()=>{
 const c=setup(),parts=[piece('new-shorts','Bottoms','Shorts','Orange')];
 const results=c.styleOwnedCollection(parts,{anchorItemId:'new-shorts',request:'Casual'});
 assert.equal(results.length,1);
 assert.equal(results[0].board.slots.bottom,'new-shorts');
 assert.deepEqual(Array.from(results[0].missing),['top','shoes']);
 const script=fs.readFileSync('public/closet-stylist.js','utf8');
 assert.match(script,/const onlyPartial=styledCollectionResults\.length>0/);
 assert.match(script,/partial look/);
 assert.match(script,/missing clothes listed below/);
});


test('one-tap shoe swap changes exactly one owned slot and preserves the selected new top',()=>{
 const c=setup(),owned=[piece('new-shirt','Tops','T-shirt','Green'),
  piece('jeans','Bottoms','Jeans','Blue'),piece('white-shoes','Shoes','Sneakers','White'),
  piece('black-shoes','Shoes','Sneakers','Black')];
 const before=JSON.stringify(owned),result=c.styleOwnedCollection(owned,
  {request:'Casual',season:'Fall',anchorItemId:'new-shirt'})[0];
 assert.ok(result);
 const original={...result.board.slots};
 const options=c.stylistSwapChoices(result,'shoes',owned,'new-shirt');
 assert.equal(options.length,1);
 const switched=c.stylistSwapOne(result,'shoes',owned,'new-shirt');
 assert.ok(switched);
 assert.notEqual(switched.board.slots.shoes,original.shoes);
 assert.equal(switched.board.slots.top,'new-shirt');
 assert.equal(switched.board.slots.bottom,original.bottom);
 assert.deepEqual(Object.keys(switched.board.slots).sort(),Object.keys(original).sort());
 assert.ok(Object.values(switched.board.slots).every(id=>owned.some(x=>x.id===id)));
 assert.equal(JSON.stringify(owned),before,'original photos and clothing must remain unchanged');
 assert.deepEqual(Array.from(c.stylistSwapChoices(result,'top',owned,'new-shirt')),[]);
});
test('one-piece swap cannot replace pinned shoes, clothes from other closets, or unknown types',()=>{
 const c=setup(),owned=[piece('tee','Tops','T-shirt'),piece('jeans','Bottoms','Jeans'),
  piece('white-shoes','Shoes','Sneakers','White'),piece('black-shoes','Shoes','Sneakers','Black'),
  piece('unconfirmed-shoes','Uncategorized','Unknown')];
 const r=c.styleOwnedCollection(owned,{request:'Casual',anchorItemId:'white-shoes'})[0];
 assert.equal(r.board.slots.shoes,'white-shoes');
 assert.deepEqual(Array.from(c.stylistSwapChoices(r,'shoes',owned,'white-shoes')),[]);
 const bottoms=c.stylistSwapChoices(r,'bottom',owned,'white-shoes');
 assert.ok(bottoms.every(x=>x.id!=='unconfirmed-shoes'));
 assert.deepEqual(Array.from(c.stylistSwapChoices(r,'bottom',owned,'not-an-owned-anchor')),[],
  'missing selected piece must make swap fail closed');
 const without=owned.filter(x=>x.id!=='jeans');
 assert.deepEqual(Array.from(c.stylistSwapChoices(r,'bottom',without,'white-shoes')),[],
  'deleted or missing original pieces must not invent a valid swap');
});
test('dress can only swap to another dress without adding bottoms or changing chosen footwear',()=>{
 const c=setup(),owned=[piece('dress1','Dresses','Casual dress'),
  piece('dress2','Dresses','Shirt dress'),piece('tee','Tops','T-shirt'),
  piece('heels','Shoes','Flats')];
 const r=c.styleOwnedCollection(owned,{request:'Casual',anchorItemId:'heels'})[0];
 assert.equal(r.board.slots.bottom,undefined);
 const options=c.stylistSwapChoices(r,'top',owned,'heels');
 assert.deepEqual(Array.from(options,x=>x.id),['dress2']);
 const swapped=c.stylistSwapOne(r,'top',owned,'heels');
 assert.equal(swapped.board.slots.top,'dress2');
 assert.equal(swapped.board.slots.bottom,undefined);
 assert.equal(swapped.board.slots.shoes,'heels');
});
test('existing bottom or layers prevent dress swaps that would silently remove other saved pieces',()=>{
 const c=setup(),owned=[piece('tee','Tops','T-shirt'),piece('jeans','Bottoms','Jeans'),
  piece('dress','Dresses','Casual dress'),piece('sneakers','Shoes','Sneakers')];
 const r=c.styleOwnedCollection(owned,{request:'Casual',anchorItemId:'jeans'})[0];
 assert.equal(r.board.slots.bottom,'jeans');
 assert.ok(!c.stylistSwapChoices(r,'top',owned,'jeans').some(x=>x.id==='dress'));
 assert.equal(c.stylistSwapOne(r,'bottom',owned,'jeans'),null);
});
test('new touch swap UI does not overwrite the garment or navigate into outfit builder',()=>{
 const script=fs.readFileSync('public/closet-stylist.js','utf8');
 const style=fs.readFileSync('public/style.css','utf8');
 assert.match(script,/Swap shoes/);
 assert.match(script,/stylistSwapOne\(result,slot,items,stylistAnchorItemId\)/);
 assert.match(script,/result\.references=\[\]/,'stale trend citations must be cleared after a swap');
 assert.match(script,/tap Save outfit when you like it/);
 assert.match(style,/\.styled-swap-button\{min-height:50px/);
});
