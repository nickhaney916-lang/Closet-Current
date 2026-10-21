'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const app=fs.readFileSync('public/app.js','utf8');
function setup(){
 let release,cloneCalls=0,cloneChars=0;const blocked=new Promise(r=>release=r),rows=[],ui=new Map();
 const c={Promise,window:{closetAuth:{user:{id:'alice'}},closetCloud:{beforeWrite:async()=>{},changed(){}}},batch:[],writes:blocked,
  $:id=>{if(!ui.has(id))ui.set(id,{textContent:'',hidden:true});return ui.get(id);},message:text=>{c.lastMessage=text;},
  structuredClone:value=>{cloneCalls++;cloneChars+=value.reduce((n,x)=>n+x.image.length,0);return structuredClone(value);}};
 c.db={name:'closet-current-user-alice',transaction(){
  const tx={objectStore:()=>({put(row){if(c.quota)throw Object.assign(Error('full'),{name:'QuotaExceededError'});rows.push(row);}})};
  setImmediate(()=>c.abort?tx.onabort?.():tx.oncomplete?.());return tx;
 }};
 vm.createContext(c);vm.runInContext(app.slice(app.indexOf('let pendingDraftWrite='),app.indexOf('function readDraft()')),c);
 return {c,rows,release,stats:()=>({cloneCalls,cloneChars})};
}
const photo=i=>({id:'photo-'+i,image:'x'.repeat(262144),localAnalyzed:true});
test('twenty blocked draft requests produce one latest snapshot instead of twenty eager photo copies',async()=>{
 const h=setup(),pending=[];for(let i=0;i<20;i++){h.c.batch.push(photo(i));pending.push(h.c.persistDraft());}
 assert.equal(new Set(pending).size,1);assert.equal(h.stats().cloneCalls,0);
 h.release();assert.ok((await Promise.all(pending)).every(Boolean));
 assert.equal(h.rows.length,1);assert.equal(h.rows[0].batch.length,20);assert.equal(h.stats().cloneCalls,1);assert.equal(h.stats().cloneChars,20*262144);
});
test('an intervening write is an ordering barrier for draft coalescing',async()=>{
 const h=setup();h.c.batch.push(photo(0));const first=h.c.persistDraft();
 h.c.writes=h.c.writes.then(()=>h.rows.push({id:'barrier'}));const second=h.c.persistDraft();
 assert.notEqual(first,second);h.release();await Promise.all([first,second]);assert.deepEqual(h.rows.map(x=>x.id),['draft','barrier','draft']);
});
test('draft snapshot includes current corrected details and is isolated after write starts',async()=>{
 const h=setup();h.c.batch.push({...photo(0),color:'Blue'});const p=h.c.persistDraft();h.c.batch[0].color='Red';h.release();await p;
 h.c.batch[0].color='Green';assert.equal(h.rows[0].batch[0].color,'Red');
});
test('storage quota failure keeps all in-memory photos, gives no success and exposes safe retry',async()=>{
 const h=setup();h.c.batch.push(photo(0));h.c.quota=true;const p=h.c.persistDraft();h.release();assert.equal(await p,false);
 assert.equal(h.c.batch.length,1);assert.equal(h.rows.length,0);assert.match(h.c.lastMessage,/storage is full/);assert.equal(h.c.$('retryDraftSave').hidden,false);
 h.c.quota=false;assert.equal(await h.c.persistDraft(),true);assert.equal(h.rows.length,1);assert.equal(h.c.$('retryDraftSave').hidden,true);
});
test('explicit abort with no error is retryable and never announces a persisted draft',async()=>{
 const h=setup();h.c.batch.push(photo(0));h.c.abort=true;const p=h.c.persistDraft();h.release();assert.equal(await p,false);assert.match(h.c.lastMessage,/could not be saved/);assert.equal(h.c.batch.length,1);
});
test('account switch before queued draft begins prevents photo cloning and cloud preflight',async()=>{
 const h=setup();let preflight=0;h.c.window.closetCloud.beforeWrite=async()=>preflight++;
 h.c.batch.push(photo(0));const p=h.c.persistDraft();h.c.window.closetAuth.user.id='bob';h.release();assert.equal(await p,false);assert.equal(preflight,0);assert.equal(h.stats().cloneCalls,0);assert.equal(h.rows.length,0);
});
test('account switch during cloud preflight prevents any snapshot or transaction',async()=>{
 const h=setup();h.c.batch.push(photo(0));h.c.window.closetCloud.beforeWrite=async()=>{h.c.window.closetAuth.user.id='bob';};const p=h.c.persistDraft();h.release();assert.equal(await p,false);assert.equal(h.rows.length,0);assert.equal(h.stats().cloneCalls,0);
});
test('a new database and a signed-out account cannot persist the old draft',async()=>{
 for(const change of [h=>h.c.db={name:'closet-current-user-bob'},h=>h.c.window.closetAuth.user=null]){
  const h=setup();h.c.batch.push(photo(0));const p=h.c.persistDraft();change(h);h.release();assert.equal(await p,false);assert.equal(h.rows.length,0);
 }
});
