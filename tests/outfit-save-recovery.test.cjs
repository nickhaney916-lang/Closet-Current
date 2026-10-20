'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function storage(){
 const pending=[],disk={value:null};let tail=Promise.resolve();
 const database={transaction(){const tx={error:null,objectStore:()=>({put(value){pending.push({tx,value:structuredClone(value)});}})};return tx;}};
 const c={window:{closetAuth:{user:{id:'one'}}},db:database,structuredClone,
  items:[{id:'shirt',category:'Tops',image:'original-photo'},{id:'pants',category:'Bottoms',image:'original-pants'}],
  queued(work){const p=tail.then(work);tail=p.catch(()=>{});return p;},URL,encodeURIComponent};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/outfit-board-engine.js','utf8'),c);
 const source=fs.readFileSync('public/outfit-board.js','utf8');
 vm.runInContext(source.slice(0,source.indexOf('async function storeBoard(')),c);
 const finish=(failed=false)=>{const row=pending.shift();assert.ok(row);if(failed){row.tx.error=failed==='abort'?null:Error('Synthetic failed write');if(failed==='abort')row.tx.onabort();else row.tx.onerror();}else{disk.value=row.value;row.tx.oncomplete();}};
 return {c,pending,disk,finish,saved:()=>JSON.parse(vm.runInContext('JSON.stringify(savedOutfitBoards)',c))};
}
const board=(name='A',slot='top',id='shirt')=>({name,slots:{[slot]:id}});
test('failed save cannot enter memory or contaminate a second overlapping successful save',async()=>{
 const s=storage(),original=JSON.stringify(s.c.items);
 const a=s.c.saveOwnedOutfitBoard(board()),b=s.c.saveOwnedOutfitBoard(board('B','bottom','pants'));
 const outcomes=Promise.allSettled([a,b]);await tick();assert.equal(s.saved().length,0);
 s.finish(true);await tick();assert.equal(s.saved().length,0);s.finish();
 const r=await outcomes;assert.equal(r[0].status,'rejected');assert.equal(r[1].status,'fulfilled');
 assert.deepEqual(s.saved().map(x=>x.name),['B']);assert.deepEqual(s.disk.value.saved.map(x=>x.name),['B']);
 assert.equal(JSON.stringify(s.c.items),original);
});
test('queued ordinary board persistence takes its snapshot after successful outfit addition',async()=>{
 const s=storage(),saved=s.c.saveOwnedOutfitBoard(board());
 const persisted=s.c.persistBoardState();await tick();s.finish();await saved;await tick();
 assert.deepEqual(s.pending[0].value.saved.map(x=>x.name),['A']);s.finish();await persisted;
 assert.equal(s.disk.value.saved.length,1);
});
test('concurrent saves at the 50 outfit limit never silently create outfit 51',async()=>{
 const s=storage();vm.runInContext('savedOutfitBoards=Array.from({length:49},(_,i)=>({name:String(i),slots:{top:"shirt"}}))',s.c);
 const a=s.c.saveOwnedOutfitBoard(board('fiftieth')),b=s.c.saveOwnedOutfitBoard(board('over-limit'));
 const done=Promise.allSettled([a,b]);await tick();s.finish();const r=await done;
 assert.equal(r[0].status,'fulfilled');assert.equal(r[1].status,'rejected');
 assert.match(r[1].reason.message,/50 outfits/);assert.equal(s.saved().length,50);assert.equal(s.pending.length,0);
});
test('removed or recategorized clothing is rechecked after queue delay, never silently dropped',async()=>{
 for(const change of [s=>s.c.items.splice(0,1),s=>s.c.items[0].category='Shoes']){
  const s=storage(),p=s.c.saveOwnedOutfitBoard(board());change(s);
  await assert.rejects(p,/outfit changed/);assert.equal(s.pending.length,0);assert.equal(s.saved().length,0);
 }
});
test('account or database switch before the queue prevents any write',async()=>{
 for(const change of [s=>s.c.window.closetAuth.user.id='other',s=>s.c.db={}]){
  const s=storage(),p=s.c.saveOwnedOutfitBoard(board());change(s);
  await assert.rejects(p,/account changed/);assert.equal(s.pending.length,0);
 }
});
test('old-account transaction completion never replaces new-account saved outfits',async()=>{
 const s=storage(),p=s.c.saveOwnedOutfitBoard(board());await tick();
 s.c.window.closetAuth.user.id='other';vm.runInContext('savedOutfitBoards=[{name:"Other account",slots:{}}]',s.c);
 s.finish();await assert.rejects(p,/account changed/);
 assert.equal(s.saved()[0].name,'Other account');
});
function preview(){
 const elements=new Map();let release,finish,fail;
 const ready=new Promise(r=>release=r),persist=new Promise((r,j)=>{finish=r;fail=j;});
 const c={window:{closetAuth:{user:{id:'one'}}},items:[{id:'shirt',category:'Tops',image:'original-photo',itemType:'T-shirt'}],
  outfitBoardReady:ready,currentBoard:{slots:{}},URL,encodeURIComponent,Date,structuredClone,
  $:id=>{if(!elements.has(id))elements.set(id,{textContent:''});return elements.get(id);},
  syncBoardInputs(){},renderOutfitBoard(){},switchView(view){c.view=view;},persistBoardState:()=>persist};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/outfit-board-engine.js','utf8'),c);
 const source=fs.readFileSync('public/closet-stylist.js','utf8');vm.runInContext(source.slice(0,source.indexOf('function renderStyledCollection(){')),c);
 const result={board:board(),context:{request:'Casual'}};c.result=result;
 vm.runInContext('styledCollectionResults=[result]',c);
 const button={disabled:false},status={textContent:''};
 return {c,result,button,status,release,finish,fail,start:()=>c.previewStyledOutfit(result,result.board,0,button,status)};
}
test('preview opens before persistence finishes, storage failure leaves it usable and retry enabled',async()=>{
 const s=preview(),p=s.start();s.release();await tick();assert.equal(s.c.view,'builder');
 assert.equal(s.c.currentBoard.slots.top,'shirt');s.fail(Error('Storage unavailable'));await p;
 assert.match(s.c.$('boardSaveStatus').textContent,/preview is available/);assert.equal(s.button.disabled,false);
});
test('changed source, swapped option or new request during board readiness cannot hijack current preview',async()=>{
 for(const mutate of [s=>s.c.items[0].image='replaced-photo',s=>s.result.board=board('swapped'),
  s=>vm.runInContext('++stylistRequestRevision',s.c),s=>s.c.window.closetAuth.user.id='other']){
  const s=preview(),p=s.start();mutate(s);s.release();await p;
  assert.equal(s.c.view,undefined);assert.deepEqual(s.c.currentBoard.slots,{});assert.equal(s.button.disabled,false);
 }
});
test('delayed old persistence never navigates back from the next screen',async()=>{
 const s=preview(),p=s.start();s.release();await tick();s.c.view='closet';s.finish();await p;assert.equal(s.c.view,'closet');
});
test('board initialization errors produce local feedback and release preview action',async()=>{
 const s=preview();s.c.outfitBoardReady=Promise.reject(Error('Cannot load saved board'));
 await s.start();assert.equal(s.c.view,undefined);assert.match(s.status.textContent,/Cannot load/);assert.equal(s.button.disabled,false);
});

test('explicit transaction abort with a null IDB error still gives retryable feedback',async()=>{
 const s=storage(),p=s.c.saveOwnedOutfitBoard(board());await tick();s.finish('abort');
 await assert.rejects(p,/Could not save this outfit/);assert.equal(s.saved().length,0);
});
test('an empty outfit cannot consume a saved slot or issue a database write',async()=>{
 const s=storage();await assert.rejects(s.c.saveOwnedOutfitBoard({slots:{}}),/at least one piece/);
 assert.equal(s.pending.length,0);assert.equal(s.saved().length,0);
});
