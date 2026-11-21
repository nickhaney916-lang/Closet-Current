'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/closet-browser.js','utf8');
const engine=fs.readFileSync('public/outfit-board-engine.js','utf8');
const start=source.indexOf("$('closetLayerCount').onchange=");
const end=source.indexOf("\n$('closetUnsorted')",start);
assert.ok(start>=0&&end>start,'actual unmodified production layer-count handler must exist');
const handler=source.slice(start,end);
function setup(){
 const elements=new Map(),items=[
  {id:'base',name:'Original base shirt',category:'Tops',image:'source-jpeg-shirt'},
  {id:'sweater',name:'Original sweater',category:'Tops',image:'source-jpeg-sweater'},
  {id:'jacket',name:'Original jacket',category:'Outerwear',image:'source-jpeg-jacket'},
 ];
 const $=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:''});return elements.get(id);};
 const ctx={URL,encodeURIComponent,structuredClone,items,$,window:{closetTargetSlot:'layer2',closetSlotFilter:'layer2'},outfitBoardReady:Promise.resolve()};
 vm.createContext(ctx);
 vm.runInContext(engine,ctx);
 vm.runInContext('let currentBoard=cleanOutfitBoard({name:"Original layered look",slots:{top:"base",layer:"sweater",layer2:"jacket"},layerCount:2,occasion:"Dinner"},items);',ctx);
 // Real renderClosetBrowser synchronizes layer-count dropdown from the board.
 ctx.render=()=>{$('closetLayerCount').value=String(vm.runInContext('currentBoard.layerCount',ctx));};
 ctx.storeBoard=async()=>true;
 vm.runInContext(handler,ctx);
 ctx.render();
 return {ctx,$,items,elements,board:()=>JSON.parse(vm.runInContext('JSON.stringify(currentBoard)',ctx)),call:()=>ctx.$('closetLayerCount').onchange(),
   persist:fn=>ctx.storeBoard=fn,evaluate:text=>vm.runInContext(text,ctx)};
}
test('rejected layer reduction restores existing sweater/jacket, original images and visible layer count',async()=>{
 const f=setup(),before=f.board(),photos=f.items.map(x=>x.image);
 f.persist(async()=>false);
 f.$('closetLayerCount').value='0';await f.call();
 assert.deepEqual(f.board(),before,'refused save must not discard the previously selected layered outfit');
 assert.equal(f.$('closetLayerCount').value,'2','dropdown must reflect restored persisted layer count');
 assert.deepEqual(f.items.map(x=>x.image),photos);
 assert.match(f.$('closetLookStatus').textContent,/could not save/i);
});
test('successful reduction removes only selected layers and preserves original wardrobe photos',async()=>{
 const f=setup(),photos=f.items.map(x=>x.image);
 f.persist(async()=>true);f.$('closetLayerCount').value='0';await f.call();
 assert.deepEqual(f.board().slots,{top:'base'});
 assert.equal(f.board().layerCount,0);assert.equal(f.$('closetLayerCount').value,'0');
 assert.deepEqual(f.items.map(x=>x.image),photos);
});
test('rejected increase returns to prior layer count without leaking a nonexistent jacket slot',async()=>{
 const f=setup();f.persist(async()=>false);
 f.$('closetLayerCount').value='3';await f.call();
 assert.equal(f.board().layerCount,2);assert.equal(f.board().slots.layer2,'jacket');
 assert.equal(f.$('closetLayerCount').value,'2');
});
test('late rejected layer change does not erase a newer user edit',async()=>{
 const f=setup(),pending=[];
 f.persist(()=>new Promise(resolve=>pending.push(resolve)));
 f.$('closetLayerCount').value='0';const previous=f.call();
 await Promise.resolve(); // actual handler awaits outfitBoardReady
 assert.equal(pending.length,1,'native handler must start one save');
 f.evaluate('currentBoard=cleanOutfitBoard({name:"Newer owner choice",slots:{top:"base",layer:"sweater"},layerCount:1},items)');
 f.render?.();
 pending[0](false);await previous;
 assert.equal(f.board().name,'Newer owner choice');assert.equal(f.board().layerCount,1);
 assert.equal(f.board().slots.layer,'sweater');
});
test('successful increase permits another layer without inventing item identity',async()=>{
 const f=setup();f.persist(async()=>true);
 f.$('closetLayerCount').value='3';await f.call();
 assert.equal(f.board().layerCount,3);assert.equal(f.board().slots.layer2,'jacket');
 assert.equal(f.board().slots.layer3,undefined);
});
