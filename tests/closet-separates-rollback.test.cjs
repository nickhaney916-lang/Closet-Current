'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(storeBoard){
 const source=fs.readFileSync('public/closet-browser.js','utf8');
 const start=source.indexOf("$('closetSeparates').onclick=");
 const end=source.indexOf("\n$('closetStyleLook')",start);
 assert.ok(start>=0&&end>start);
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);};
 const items=[{id:'dress',category:'Dresses',image:'original-jpeg'},{id:'shirt',category:'Tops'}];
 const context=vm.createContext({items,$,window:{closetDressPreview:true},outfitBoardReady:Promise.resolve(),storeBoard,syncBoardInputs(){},render(){}});
 vm.runInContext(fs.readFileSync('public/outfit-board-engine.js','utf8'),context);
 vm.runInContext('let currentBoard=cleanOutfitBoard({slots:{top:"dress"}},items);',context);
 vm.runInContext(source.slice(start,end),context);
 return {context,$,items,run:()=>$('closetSeparates').onclick(),board:()=>JSON.parse(vm.runInContext('JSON.stringify(currentBoard)',context))};
}
test('failed switch to separates restores the saved dress and preview',async()=>{
 const f=setup(async()=>false),before=f.board();
 await f.run();
 assert.deepEqual(f.board(),before);
 assert.equal(f.context.window.closetDressPreview,true);
 assert.equal(f.items[0].image,'original-jpeg');
 assert.match(f.$('closetLookStatus').textContent,/could not save/);
});
test('successful switch removes the selected dress and keeps the closet piece',async()=>{
 const f=setup(async()=>true);
 await f.run();
 assert.equal(f.board().slots.top,undefined);
 assert.equal(f.context.window.closetDressPreview,false);
 assert.equal(f.items[0].image,'original-jpeg');
});
test('a late write failure preserves a newer top selection',async()=>{
 let rejectSave;
 const f=setup(()=>new Promise(resolve=>{rejectSave=()=>resolve(false);}));
 const pending=f.run();await new Promise(setImmediate);
 vm.runInContext('currentBoard=cleanOutfitBoard({slots:{top:"shirt"}},items);',f.context);
 rejectSave();await pending;
 assert.equal(f.board().slots.top,'shirt');
});
