'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('public/closet-stylist.js','utf8');
const boardScript=fs.readFileSync('public/outfit-board.js','utf8');
const toPiece=(id,category,itemType,image,color='Blue')=>({
 id,category,itemType,image,color,pattern:'Solid',seasons:['Fall']
});
function setup(){
 const items=[toPiece('new-top','Tops','T-shirt','photo-1'),
  toPiece('old-jeans','Bottoms','Jeans','jeans-1'),
  toPiece('old-shoes','Shoes','Sneakers','shoes-1')];
 const board={name:'Casual',slots:{top:'new-top',bottom:'old-jeans',shoes:'old-shoes'}};
 const writes=[],state={items,window:{closetAuth:{user:{id:'alice'}}},
  db:{name:'closet-current-user-alice',transaction(){
   const tx={objectStore:()=>({put:x=>writes.push(x)})};
   setImmediate(()=>tx.oncomplete?.());return tx;
  }},structuredClone,Date,queued:fn=>fn(),
  cleanOutfitBoard:(x)=>structuredClone(x)};
 state.stylistOwnsCloset=()=>state.db?.name==='closet-current-user-'+state.window.closetAuth.user?.id;
 vm.createContext(state);
 const start=script.indexOf('function stylistSelectedSources('),end=script.indexOf('function renderStylistAnchor(',start);
 assert.ok(start>0&&end>start);
 vm.runInContext(script.slice(start,end),state);
 const boardEnd=boardScript.indexOf('async function storeBoard');
 assert.ok(boardEnd>0);
 vm.runInContext(boardScript.slice(0,boardEnd),state);
 const original=state.stylistSelectedSources(board);
 return {state,items,board,writes,original};
}
test('new-item styling pins real garment photos and category to original owner',async()=>{
 const h=setup(),s=h.state;
 assert.equal(s.stylistSourcesCurrent(h.original),true);
 const saved=await s.saveOwnedOutfitBoard(h.board,()=>s.stylistSourcesCurrent(h.original));
 assert.equal(saved.slots.top,'new-top');
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].id,'outfit-board');
 assert.equal(h.writes[0].saved.length,1);
});
test('same garment ID with replaced photo cannot silently save an old recommendation',async()=>{
 const h=setup(),s=h.state;
 s.queued=fn=>{h.items[0].image='replacement-photo';return fn();};
 await assert.rejects(()=>s.saveOwnedOutfitBoard(h.board,()=>s.stylistSourcesCurrent(h.original)),/outfit or closet changed/);
 assert.equal(h.writes.length,0);
});
test('reclassified dress, changed color and edited seasons invalidate rendered owned suggestions',()=>{
 for(const mutate of [
  item=>{item.category='Dresses';item.itemType='Casual dress';},
  item=>{item.color='Red';},
  item=>{item.pattern='Striped';},
  item=>{item.seasons=['Summer'];}
 ]){
  const h=setup();mutate(h.items[0]);
  assert.equal(h.state.stylistSourcesCurrent(h.original),false);
 }
});
test('removed garment fails closed even when all remaining IDs still match',async()=>{
 const h=setup(),s=h.state;
 h.items.splice(1,1);
 assert.equal(s.stylistSourcesCurrent(h.original),false);
 await assert.rejects(()=>s.saveOwnedOutfitBoard(h.board,()=>s.stylistSourcesCurrent(h.original)),/changed/);
 assert.equal(h.writes.length,0);
});
test('account and IndexedDB tenant mismatch reject stale owner before any outfit storage',async()=>{
 for(const mutate of [
  state=>{state.window.closetAuth.user.id='bob';},
  state=>{state.db={...state.db,name:'closet-current-user-bob'};}
 ]){
  const h=setup(),s=h.state;
  mutate(s);
  assert.equal(s.stylistSourcesCurrent(h.original),false);
  await assert.rejects(()=>s.saveOwnedOutfitBoard(h.board,()=>s.stylistSourcesCurrent(h.original)),/account changed/);
  assert.equal(h.writes.length,0);
 }
});
test('queue and wait time do not block stable source saves or require paid models',async()=>{
 const h=setup(),s=h.state;
 s.queued=fn=>new Promise((res,rej)=>setImmediate(()=>Promise.resolve().then(fn).then(res,rej)));
 const saved=await s.saveOwnedOutfitBoard(h.board,()=>s.stylistSourcesCurrent(h.original));
 assert.equal(saved.slots.shoes,'old-shoes');
 assert.equal(h.writes.length,1);
});
test('new selection guards are used by both preview and save in actual customer script',()=>{
 assert.match(script,/const sources=result\.preparedSources\|\|stylistSelectedSources\(board\)/);
 assert.match(script,/styledCollectionResults\.includes\(result\)&&stylistSourcesCurrent\(sources\)/);
 assert.match(script,/saveOwnedOutfitBoard\(\{\.\.\.board,name:result\.context\.request\+' · option '\+\(index\+1\)\},current\)/);
 assert.match(boardScript,/if\(typeof sourceStillCurrent==='function'&&!sourceStillCurrent\(\)\)/);
});
test('a duplicate identity arriving inside the save queue invalidates the captured source',async()=>{
 const h=setup(),s=h.state;
 s.queued=fn=>{h.items.push({...h.items[0],image:'different-source'});return fn();};
 await assert.rejects(()=>s.saveOwnedOutfitBoard(h.board,()=>s.stylistSourcesCurrent(h.original)),/outfit or closet changed/);
 assert.equal(h.writes.length,0);
});
