'use strict';
// Executes the real public/app.js photo-editor handlers with only the
// dynamic research-module import replaced by a controlled test loader.
// Synthetic signed owners, JPEG labels and fake private stores ONLY.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/app.js','utf8');
const start=source.indexOf('function photoEditorSessionLease(){');
const end=source.indexOf('function renderRecognitionNotice(){',start);
assert.ok(start>=0&&end>start,'Exact production photo-editor source required');
const editor=source.slice(start,end);
const moduleLoad=editor
 .replace("import('./native-reviewed-private-save-167.mjs')","loadReviewedSourceModule()")
 .replace("import('../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs')","loadReviewedSourceModule()");
assert.ok(!moduleLoad.includes('await (nativeCanonical167Active\n    ?import('),
 'Test must replace only the module loader, never alter the editor lease code');
const photo='data:image/jpeg;base64,/9j/AA==';
const sha='a'.repeat(64);
const old={id:'original-owner-item',ownerId:'A',image:photo,
 sourceSHA256:sha,originalPhoto:{image:photo,sha256:sha},
 name:'Blue shirt',category:'Tops',itemType:'Shirt',color:'Blue'};
const newer={id:'new-session-item',ownerId:'B',image:photo,
 sourceSHA256:'b'.repeat(64),originalPhoto:{image:photo,sha256:'b'.repeat(64)},
 name:'Red coat',category:'Outerwear',itemType:'Coat',color:'Red'};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function element(tag,text=''){
 return {tag,textContent:text,children:[],style:{},open:false,isConnected:false,
  disabled:false,checked:tag==='input',hidden:false,
  append(...children){this.children.push(...children);},
  prepend(...children){this.children.unshift(...children);},
  setAttribute(){},querySelector(){return null;},
  showModal(){this.open=true;},
  close(){this.open=false;this.onclose?.();},
  remove(){this.isConnected=false;}
 };
}
function seek(root,tag,text){
 if(root?.tag===tag&&(!text||root.textContent===text))return root;
 for(const child of root.children||[]){const found=seek(child,tag,text);if(found)return found;}
 return null;
}
function privateDB(owner,record){
 const db={name:'closet-current-user-'+owner,saved:null,reads:0,
  transaction(store,mode){
   assert.equal(store,'items');assert.equal(mode,'readonly');
   return {objectStore(name){
    assert.equal(name,'items');
    return {get(){
     db.reads++;
     const request={result:db.saved,onsuccess:null,onerror:null};
     queueMicrotask(()=>request.onsuccess?.());
     return request;
    }};
   }};
  }
 };
 return db;
}
function fixture({reviewed=true}={}){
 const committed=deferred(),deleted=deferred(),events=[];
 const firstDB=privateDB('A',old),secondDB=privateDB('B',newer);
 const firstAuth={user:{id:'A'},assertCurrent(){}},
  secondAuth={user:{id:'B'},assertCurrent(){}};
 const domRoot=element('body');
 const nodes={authGate:{hidden:true},appShell:{hidden:false}};
 const ctx={
  stream:null,cameraOpening:false,stopCamera(){},URLSearchParams,
  location:{search:''},reviewedSave120Active:reviewed,
  nativeCanonical167Active:true,captureProof01Active:true,
  items:reviewed?[]:[structuredClone(old)],
  batch:reviewed?[structuredClone(old)]:[],
  db:firstDB,window:{closetAuth:firstAuth},captureOperationEpoch:0,
  localPending:new Set(),sessionCapturedIds:new Set(),failedDraftCaptures:new Set(),
  document:{createElement:tag=>element(tag),createTextNode:text=>({text}),
   body:{append(el){el.isConnected=true;domRoot.append(el);}}},
  node:(tag,text)=>element(tag,text),clothingFields:(form,model)=>()=>({...model}),
  structuredClone,Date,Error,JSON,
  $:id=>nodes[id]||({hidden:false}),
  captureProofOwner:()=>ctx.window.closetAuth.user?.id,
  ClothingMemory:undefined,
  queued:work=>work(),
  loadReviewedSourceModule:async()=>({commitHumanReviewedPhoto119:async args=>{
   assert.equal(args.db,firstDB,'must pin original signed owner DB');
   const result=await committed.promise;
   if(result.saved)firstDB.saved={...old,category:'Tops',itemType:'Shirt',color:'Blue'};
   return result;
  }}),
  savePiece:()=>committed.promise,
  removeItem:()=>deleted.promise,
  normalizeClothing:x=>x,
  render(){events.push('render:'+ctx.window.closetAuth.user?.id);},
  message(s){events.push('message:'+ctx.window.closetAuth.user?.id+':'+s);},
  scheduleMemoryReview(){events.push('memory');},
  nativeIndex07Refresh:async()=>events.push('refresh')
 };
 vm.createContext(ctx);vm.runInContext(moduleLoad,ctx);
 const item=reviewed?ctx.batch[0]:ctx.items[0];
 ctx.adjustPhoto(item);
 const dialog=domRoot.children.at(-1),form=seek(dialog,'form'),
  save=seek(dialog,'button','Save changes'),
  remove=seek(dialog,'button','Remove photo');
 assert.ok(form?.onsubmit&&remove?.onclick&&save,'Actual editor callbacks needed');
 return {ctx,firstDB,secondDB,committed,deleted,events,dialog,item,save,remove,
  submit:()=>form.onsubmit({preventDefault(){}}),
  switchToOther(){
   ctx.captureOperationEpoch++;ctx.window.closetAuth=secondAuth;
   ctx.db=secondDB;ctx.batch=[structuredClone(newer)];
   ctx.items=[];dialog.open=false;
  },
  reloginSameOwner(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'A'},assertCurrent(){}};
   ctx.batch=[structuredClone(old)];ctx.items=[];dialog.open=false;
  }
 };
}
test('same-owner reviewed original reads committed record from exact private DB before acknowledging',async()=>{
 const f=fixture();
 const pending=f.submit();
 f.committed.resolve({saved:true});
 await pending;
 assert.equal(f.firstDB.reads,1);
 assert.equal(f.secondDB.reads,0);
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.ctx.batch.length,0);
 assert.ok(f.events.some(x=>x.includes('saved to your private closet')));
});
test('revoked owner after reviewed atomic commit cannot read or render new owner wardrobe',async()=>{
 const f=fixture(),pending=f.submit();
 f.switchToOther();f.committed.resolve({saved:true});
 await pending;
 assert.equal(f.firstDB.reads,0);
 assert.equal(f.secondDB.reads,0);
 assert.deepEqual(f.ctx.items,[]);
 assert.equal(f.ctx.batch[0].ownerId,'B');
 assert.equal(f.events.filter(x=>x.startsWith('message:')).length,0);
 assert.equal(f.events.filter(x=>x.startsWith('render:')).length,0);
});
test('same account ID re-login is NOT permission for an old review save to publish its success',async()=>{
 const f=fixture(),pending=f.submit();
 f.reloginSameOwner();f.committed.resolve({saved:true});
 await pending;
 assert.equal(f.firstDB.reads,0);
 assert.equal(f.ctx.items.length,0);
 assert.equal(f.events.filter(x=>x.startsWith('message:')).length,0);
});
test('revoked old owner cannot publish a late reviewed-save failure warning',async()=>{
 const f=fixture(),pending=f.submit();
 f.switchToOther();f.committed.reject(Error('Synthetic quota failure'));
 await pending;
 assert.equal(f.events.filter(x=>x.startsWith('message:')).length,0);
});
test('current owner still receives actionable failed-reviewed-save warning',async()=>{
 const f=fixture(),pending=f.submit();
 f.committed.reject(Error('Synthetic quota failure'));
 await pending;
 assert.equal(f.save.disabled,false);
 assert.ok(f.events.some(x=>x.includes('Reviewed garment was not saved')));
});
test('late manual removal after account switch cannot remove next owner clothing or display warning',async()=>{
 const f=fixture({reviewed:false}),pending=f.remove.onclick();
 f.switchToOther();f.deleted.resolve();
 await pending;
 assert.equal(f.ctx.batch.length,1);
 assert.equal(f.ctx.batch[0].ownerId,'B');
 assert.equal(f.ctx.items.length,0);
 assert.equal(f.events.filter(x=>x.startsWith('render:')).length,0);
 assert.equal(f.events.filter(x=>x.startsWith('message:')).length,0);
});
test('review editor exact source pins DB, session epoch and gates postcommit reads and messages',()=>{
 assert.match(editor,/captureOperationEpoch!==epoch\|\|db!==ownerDB/);
 assert.match(editor,/db:ownerDB,ownerId:owner/);
 assert.match(editor,/request=ownerDB\.transaction\('items','readonly'\)/);
 assert.match(editor,/editorSession\.assertCurrent\(\);\s*if\(!stored/);
 assert.match(editor,/await nativeIndex07Refresh\(\);\s*editorSession\.assertCurrent\(\);/);
 assert.match(editor,/catch\(error\)\{\s*\/\/ This editor cannot report/);
 assert.match(editor,/if\(!editorSession\.current\(\)\)return;/);
});
