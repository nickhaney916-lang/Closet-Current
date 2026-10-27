// Synthetic fault injection against supplied ACTUAL compiled app storage functions.
// Runs in Node fake-IDB or a real browser. No networking, real accounts, or disk quota exhaustion.
export async function runStorageProbes(e){
 const {writeAll,savePiece,removeItem,queued,IDBObjectStore,IDBDatabase}=e,results=[];
 const check=(ok,reason)=>{if(!ok)throw Error(reason);};
 const read=store=>new Promise((resolve,reject)=>{const tx=e.getDatabase().transaction(store),r=tx.objectStore(store).getAll();tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(tx.error);});
 const snapshot=async()=>JSON.stringify({items:await read('items'),state:await read('state')});
 const rejected=async fn=>{try{await fn();}catch{return true;}return false;};
 const base=await snapshot(),rows=await read('items'),row=rows[0];check(row?.originalPhoto?.image,'Original-photo fixture required');
 async function preserve(name,run){check(await rejected(run),name+' did not reject');check(await snapshot()===base,name+' left partial records or altered original/state');results.push({name,status:'PASS'});}
 const originalPut=IDBObjectStore.prototype.put;
 async function fault(fn,hook){IDBObjectStore.prototype.put=function(value,...args){return hook.call(this,originalPut,value,args);};try{return await fn();}finally{IDBObjectStore.prototype.put=originalPut;}}
 for(const kind of ['bulk','item+draft']){
  let calls=0;
  await preserve('synchronous quota rollback '+kind,()=>fault(()=>kind==='bulk'?writeAll([{...row,color:'CORRUPTED',image:'bad'}, {id:'quota-second'}]):savePiece({...row,color:'CORRUPTED',image:'bad'},()=>[]),function(put,v,args){if(++calls===2)throw new DOMException('synthetic quota','QuotaExceededError');return put.call(this,v,...args);}));
 }
 await preserve('actual DataCloneError rolls back bulk first put',()=>writeAll([{...row,color:'CORRUPTED'}, {id:'noncloneable',bad:()=>{}}]));
 await preserve('throwing late draft supplier rolls back item',()=>savePiece({...row,color:'CORRUPTED'},()=>{throw Error('synthetic interrupted draft');}));
 await preserve('stillCurrent rejects before transaction',()=>savePiece({...row,color:'CORRUPTED'},()=>[],()=>false));
 await preserve('asynchronous request ConstraintError rolls back bulk',()=>fault(()=>writeAll([{...row,color:'CORRUPTED'},{...row}]),function(put,v,args){this.__probeCount=(this.__probeCount||0)+1;return this.__probeCount===2?this.add(v):put.call(this,v,...args);}));
 await preserve('explicit abort during request completion preserves prior original',()=>fault(()=>savePiece({...row,color:'CORRUPTED'},()=>[]),function(put,v,args){const r=put.call(this,v,...args);r.addEventListener('success',()=>{try{this.transaction.abort();}catch{}},{once:true});return r;}));
 // A queue delay must not discard an independent new capture's remaining draft.
 const oldBatch=e.getBatch(),originalState=await read('state');let release,started;
 const ready=new Promise(r=>started=r),gate=new Promise(r=>release=r);
 const barrier=queued(()=>{started();return gate;});await ready;
 const temporary={...row,id:'storage34-temporary'},late={...row,id:'storage34-late-draft'};
 const pending=savePiece(temporary,()=>e.getBatch().filter(x=>x.id!==temporary.id));e.setBatch([...oldBatch,late]);release();await barrier;await pending;
 const draft=(await read('state')).find(x=>x.id==='draft');check(draft.batch.some(x=>x.id===late.id),'late draft dropped');
 // Duplicate item IDs are an upsert; concurrent duplicate saves must create one row.
 await Promise.all(Array.from({length:12},()=>savePiece(temporary,()=>e.getBatch())));
 check((await read('items')).filter(x=>x.id===temporary.id).length===1,'duplicate saves created duplicate rows');
 check(JSON.stringify((await read('items')).find(x=>x.id===temporary.id).originalPhoto)===JSON.stringify(row.originalPhoto),'duplicate save lost original');
 results.push({name:'concurrent repeated saves remain idempotent; late draft retained',status:'PASS'});
 await removeItem(temporary.id);e.setBatch(oldBatch);
 await new Promise((resolve,reject)=>{const tx=e.getDatabase().transaction('state','readwrite'),s=tx.objectStore('state');s.clear();for(const value of originalState)s.put(value);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
 check(await snapshot()===base,'cleanup altered baseline references');
 // Existing queue checks account before and AFTER delayed cloud authorization.
 const auth=e.window.closetAuth,cloud=e.window.closetCloud,oldBefore=cloud.beforeWrite,oldUser=auth.user;
 let unlock,begun;const reached=new Promise(r=>begun=r),delay=new Promise(r=>unlock=r);
 cloud.beforeWrite=async()=>{begun();await delay;};
 try{const waiting=savePiece({...row,color:'CORRUPTED'},()=>[]);const outcome=waiting.then(()=>false,()=>true);await reached;auth.user={id:'b2222222-2222-4222-8222-222222222222'};unlock();check(await outcome,'account switch did not reject');}
 finally{auth.user=oldUser;cloud.beforeWrite=oldBefore;}
 check(await snapshot()===base,'account switch wrote old/new data');results.push({name:'account switch while cloud preflight pending prevents write',status:'PASS'});
 // A foreign account cannot direct the owner queue into this database.
 auth.user={id:'b2222222-2222-4222-8222-222222222222'};
 try{check(await rejected(()=>writeAll([{id:'foreign'}])),'foreign database accepted');}finally{auth.user=oldUser;}
 check(await snapshot()===base,'foreign account wrote private data');results.push({name:'foreign owner cannot write current private database',status:'PASS'});
 // Once an IDB transaction starts, account switching does not retroactively undo it.
 // The existing queue must reject the UI result, and BOTH old-owner records stay atomic.
 let changed=false;
 try{await fault(async()=>{check(await rejected(()=>savePiece({...row,color:'old-owner-complete'},()=>[{id:'old-owner-draft'}])),'post-start account change reported success');},function(put,v,args){const r=put.call(this,v,...args);if(!changed){changed=true;r.addEventListener('success',()=>{auth.user={id:'b2222222-2222-4222-8222-222222222222'};},{once:true});}return r;});}
 finally{auth.user=oldUser;}
 check((await read('items')).find(x=>x.id===row.id).color==='old-owner-complete','old-owner transaction item not complete');
 check((await read('state')).find(x=>x.id==='draft').batch[0].id==='old-owner-draft','old-owner transaction state not complete');
 check(e.getDatabase().name==='closet-current-user-'+oldUser.id,'transaction leaked to new database');
 results.push({name:'post-start account change rejects UI result; complete transaction confined to old owner',status:'PASS',limitation:'Already-started transaction can fully commit in old account; not retroactively cancelled'});
 await writeAll([row]);
 await new Promise((resolve,reject)=>{const tx=e.getDatabase().transaction('state','readwrite'),state=tx.objectStore('state');state.clear();for(const v of originalState)state.put(v);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
 await writeAll([row]);check(await snapshot()===base,'retry lost original or outfit references');results.push({name:'successful retry after faults preserves all originals/favorites/board',status:'PASS'});
 // Guard against accidental monkeypatch leakage in the harness itself.
 check(IDBObjectStore.prototype.put===originalPut,'fault hook leaked');
 return {results,checks:results.length,originalsAndAllStateUnchanged:true,realQuotaExhaustion:false};
}
