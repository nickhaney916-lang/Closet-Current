'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){const c={URL,encodeURIComponent,Date};vm.createContext(c);
 for(const file of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])
  vm.runInContext(fs.readFileSync('public/'+file,'utf8'),c);return c;}
const p=(id,category,itemType,extra={})=>({id,category,itemType,name:id,image:'owned-photo-'+id,color:'Black',
 pattern:'Solid',sleeveLength:'Unknown',seasons:[],...extra});
const main=()=>[p('top','Tops','T-shirt'),p('jeans','Bottoms','Jeans'),p('shoes','Shoes','Sneakers')];

test('one-tap jacket swaps change ONLY jacket while preserving owned shirt, pants, shoes and original photos',()=>{
 const c=setup(),owned=[...main(),p('j1','Outerwear','Jacket'),p('j2','Outerwear','Blazer'),
  p('j3','Outerwear','Jacket')],frozen=JSON.stringify(owned);
 const result=c.styleOwnedCollection(owned,{request:'Casual',season:'Fall'})[0];
 assert.ok(result.board.slots.layer2);
 const original={...result.board.slots},old=result.board.slots.layer2;
 const swapped=c.stylistSwapOne(result,'layer2',owned);
 assert.ok(swapped&&swapped.id!==old);
 assert.equal(swapped.board.slots.layer2,swapped.id);
 assert.equal(swapped.board.slots.layer,undefined);
 assert.equal(swapped.board.slots.layer3,undefined);
 for(const key of ['top','bottom','shoes'])assert.equal(swapped.board.slots[key],original[key]);
 assert.deepEqual(Object.keys(swapped.board.slots).sort(),Object.keys(original).sort());
 assert.equal(JSON.stringify(owned),frozen);
 assert.ok(owned.some(x=>x.id===swapped.id));
});
test('one-tap coat swaps retain jacket-free third layer and same complete owned outfit',()=>{
 const c=setup(),owned=[...main(),p('coat1','Outerwear','Coat'),
  p('coat2','Outerwear','Raincoat')];
 const result=c.styleOwnedCollection(owned,{request:'Casual',season:'Winter'})[0];
 assert.ok(result.board.slots.layer3);
 const first=result.board.slots.layer3;
 const changed=c.stylistSwapOne(result,'layer3',owned);
 assert.ok(changed);assert.notEqual(changed.id,first);
 assert.equal(changed.board.slots.layer3,changed.id);
 assert.equal(changed.board.layerCount,3);
 assert.equal(changed.board.slots.layer2,undefined);
 for(const key of ['top','bottom','shoes'])assert.equal(changed.board.slots[key],result.board.slots[key]);
 assert.equal(new Set(Object.values(changed.board.slots)).size,Object.values(changed.board.slots).length);
});
test('jacket button never substitutes raincoat, cardigan, blazer in the coat slot or an invalid generic category',()=>{
 const c=setup(),owned=[...main(),p('j1','Outerwear','Jacket'),p('j2','Outerwear','Blazer'),
 p('coat','Outerwear','Coat'),p('rain','Outerwear','Raincoat'),p('cardigan','Outerwear','Cardigan'),
 p('bad','Uncategorized','Unknown')];
 const jacket=c.styleOwnedCollection(owned,{anchorItemId:'top'})
  .find(x=>x.board.slots.layer2);
 assert.ok(jacket,'Find the jacket outfit, rather than assuming it ranks ahead of the cardigan');
 const jacketChoices=c.stylistSwapChoices(jacket,'layer2',owned,'top');
 assert.equal(jacketChoices.length,1);
 assert.ok(['j1','j2'].includes(jacketChoices[0].id));
 assert.notEqual(jacketChoices[0].id,jacket.board.slots.layer2);
 const coat=c.styleOwnedCollection(owned,{anchorItemId:'coat',season:'Winter'})[0];
 assert.deepEqual(Array.from(c.stylistSwapChoices(coat,'layer3',owned,'coat')),[],
  'a pinned coat must not be replaced');
 assert.ok(!c.stylistSwapChoices(jacket,'layer2',owned,'top').some(x=>x.id==='bad'));
});
test('pinned jacket and coat buttons are hidden by their swap choice contract',()=>{
 const c=setup(),owned=[...main(),p('jacket','Outerwear','Jacket'),p('blazer','Outerwear','Blazer'),
 p('coat','Outerwear','Coat'),p('rain','Outerwear','Raincoat')];
 for(const [anchor,slot] of [['jacket','layer2'],['coat','layer3']]){
  const result=c.styleOwnedCollection(owned,{anchorItemId:anchor,season:'Winter'})[0];
  assert.equal(result.board.slots[slot],anchor);
  assert.equal(c.stylistSwapOne(result,slot,owned,anchor),null);
  assert.deepEqual(Array.from(c.stylistSwapChoices(result,slot,owned,anchor)),[]);
 }
});
test('seasonally excluded and deleted jacket/coat alternatives must not appear',()=>{
 const c=setup(),owned=[...main(),p('j1','Outerwear','Jacket'),
  p('j2','Outerwear','Jacket',{seasons:['Summer']}),p('j3','Outerwear','Jacket')];
 const result=c.styleOwnedCollection(owned,{anchorItemId:'top',season:'Winter'})[0];
 const choices=c.stylistSwapChoices(result,'layer2',owned,'top');
 assert.ok(choices.every(x=>x.id!=='j2'));
 const trimmed=owned.filter(x=>x.id!==result.board.slots.layer2);
 assert.equal(c.stylistSwapChoices(result,'layer2',trimmed,'top').length,0);
 assert.equal(c.stylistSwapOne(result,'layer2',trimmed,'top'),null);
});
test('edited jacket retyped as raincoat or cardigan fails closed without changing the rest of the board',()=>{
 const c=setup(),base=[...main(),p('j1','Outerwear','Jacket'),p('j2','Outerwear','Blazer')];
 const result=c.styleOwnedCollection(base,{anchorItemId:'top'})[0];
 const original=JSON.stringify(result.board);
 const reclassified=base.map(item=>item.id===result.board.slots.layer2?{...item,itemType:'Raincoat'}:item);
 assert.equal(c.stylistSwapChoices(result,'layer2',reclassified,'top').length,0);
 assert.equal(c.stylistSwapOne(result,'layer2',reclassified,'top'),null);
 assert.equal(JSON.stringify(result.board),original);
});
test('cycled jacket swaps visit each eligible owned coat before returning to start',()=>{
 const c=setup(),owned=[...main(),...['a','b','c','d'].map(id=>p(id,'Outerwear','Jacket'))];
 const result=c.styleOwnedCollection(owned,{anchorItemId:'top'})[0];
 assert.equal(result.board.slots.layer2!==undefined,true);
 const visited=[result.board.slots.layer2];
 for(let i=0;i<7;i++){
  const sw=c.stylistSwapOne(result,'layer2',owned,'top');assert.ok(sw);
  result.board=sw.board;result.swapHistory={...result.swapHistory,layer2:sw.history};visited.push(sw.id);
  assert.equal(result.board.slots.top,'top');
 }
 assert.equal(new Set(visited.slice(0,4)).size,4);
 assert.equal(new Set(visited.slice(4,8)).size,4);
});
test('UI includes independent 50px jacket/coat buttons, source/account guard and preview-only save',()=>{
 const source=fs.readFileSync('public/closet-stylist.js','utf8');
 const css=fs.readFileSync('public/style.css','utf8');
 assert.match(source,/\['layer2','Swap jacket'\]/);
 assert.match(source,/\['layer3','Swap coat'\]/);
 assert.match(source,/stylistSourcesCurrent\(stylistSelectedSources\(board\)\)/);
 assert.match(source,/stylistOwnsCloset\(\)/);
 assert.match(source,/result\.references=\[\]/);
 assert.match(source,/Preview only — tap Save outfit when you like it/);
 assert.match(css,/\.styled-swap-button\{min-height:50px/);
});
