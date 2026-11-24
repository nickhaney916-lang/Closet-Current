'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
// Exact garment metadata from #201 QA fixture at ad16d788; no photographs,
// source-ledger validation, recognition or full historical benchmark claimed.
const specs=[['new-top','Tops','T-shirt','Blue','Short sleeve'],
 ['long-top','Tops','T-shirt','White','Long sleeve'],
 ['pants','Bottoms','Jeans','Blue'],['shorts','Bottoms','Shorts','Tan'],['skirt','Bottoms','Skirt','Black'],
 ['shoe-1','Shoes','Sneakers','White'],['shoe-2','Shoes','Sneakers','Black'],['shoe-3','Shoes','Sneakers','Gray'],
 ['dress','Dresses','Casual dress','Blue'],['jacket','Outerwear','Jacket','Black'],
 ['jacket-2','Outerwear','Jacket','Tan'],['coat','Outerwear','Coat','Brown']];
const items=specs.map(([id,category,itemType,color,sleeveLength='Unknown'])=>({id,category,itemType,color,sleeveLength,pattern:'Solid',seasons:['Fall']}));
const context=vm.createContext({URL,encodeURIComponent,structuredClone,Date});
for(const file of ['taxonomy.js','outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js']){
 const path=file==='closet-stylist-engine.js'&&process.env.P1636_ENGINE_SOURCE||'public/'+file;
 vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:file});
}
const style=(rows,focusItemId)=>context.styleOwnedCollection(rows,{request:'Casual',audience:'All',season:'Fall',focusItemId});
const owned=(looks,rows)=>looks.every(look=>Object.values(look.board.slots).every(id=>rows.some(row=>row.id===id)));
test('rich pinned wardrobe offers three different core bottoms before shoe-only variants',()=>{
 const looks=style(items,'new-top');
 assert.equal(looks.length,3);assert.equal(new Set(looks.map(x=>x.board.slots.bottom)).size,3);
 assert.equal(looks[0].board.slots.bottom,'pants');assert.equal(looks[0].board.slots.shoes,'shoe-1');
 assert.ok(looks.every(x=>x.focusItemId==='new-top'&&x.board.slots.top==='new-top'&&x.missing.length===0));
 assert.ok(owned(looks,items));
});
test('sparse wardrobe reports zero, one or two real combinations without padding',()=>{
 for(const n of [0,1,2]){
  const ids=n?['new-top','pants',...Array.from({length:n},(_,i)=>'shoe-'+(i+1))]:[];
  const rows=items.filter(x=>ids.includes(x.id));const looks=style(rows,n?'new-top':undefined);
  assert.equal(looks.length,n);assert.ok(owned(looks,rows));assert.ok(looks.every(x=>x.missing.length===0));
 }
});
test('pinned dress preserves real shoe alternatives and suppresses bottoms/layers',()=>{
 const looks=style(items,'dress');assert.equal(looks.length,3);
 assert.equal(new Set(looks.map(x=>x.board.slots.shoes)).size,3);
 assert.ok(looks.every(x=>x.board.slots.top==='dress'&&!x.board.slots.bottom&&!x.board.slots.layer&&x.missing.length===0));
});
test('lone garment stays explicitly incomplete without invented shoes or bottoms',()=>{
 const rows=items.filter(x=>x.id==='new-top'),looks=style(rows,'new-top');
 assert.equal(looks.length,1);assert.equal(Array.from(looks[0].missing).join(','),'bottom,shoes');
 assert.ok(owned(looks,rows));assert.equal(Object.keys(looks[0].board.slots).join(','),'top');
});
