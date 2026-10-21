'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../public/wardrobe-backup-engine.js');
function setup(){const c={URL,encodeURIComponent,structuredClone,crypto:require('node:crypto').webcrypto};vm.createContext(c);for(const f of ['taxonomy.js','outfit-board-engine.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);return c;}
const photo='data:image/jpeg;base64,/9j/2Q==';
const piece=(id='shirt',extra={})=>({id,name:'Corrected blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue',image:photo,...extra});
const empty=()=>({name:'My outfit',slots:{},ideas:{}});
const backup=(extra={})=>({format:'closet-current',version:4,ownerId:'alice',items:[piece()],looks:[],outfitBoard:{current:{name:'Imported selection',slots:{top:'shirt'}},saved:[{name:'My saved look',slots:{top:'shirt'}}]},...extra});
function normalized(c,data=backup()){return E.validate(data,'alice',{normalizeItem:c.normalizeClothing,normalizeLook:x=>structuredClone(x),cleanBoard:c.cleanOutfitBoard});}
const merge=(c,local,incoming)=>{let id=0;return E.merge(local,incoming,{makeId:()=>`copy-${++id}`,cleanBoard:c.cleanOutfitBoard});};
function local(c,items=[]){return {items:items.map(c.normalizeClothing),looks:[],outfitBoard:{current:c.cleanOutfitBoard(empty(),items),saved:[]}};}
test('backup keeps original/display RGB, manual corrections and typed clothing metadata byte-for-byte',()=>{
 const c=setup(),p=piece('shirt',{notes:'manual correction',brand:'Local',originalPhoto:{image:photo},recognitionPhoto:{image:photo},colorSource:'manual',manualType:true});
 const r=normalized(c,backup({items:[p]}));assert.equal(r.items[0].image,p.image);assert.equal(r.items[0].originalPhoto.image,p.originalPhoto.image);assert.equal(r.items[0].recognitionPhoto.image,p.recognitionPhoto.image);assert.equal(r.items[0].notes,p.notes);assert.equal(r.items[0].colorSource,'manual');assert.equal(r.items[0].manualType,true);
});
test('same-ID conflicting corrections keep both photos/details and remap imported outfit references',()=>{
 const c=setup(),a=local(c,[piece('shirt',{color:'Red',name:'Newer red correction'})]);
 const r=merge(c,a,normalized(c));assert.equal(r.items.length,2);assert.equal(r.items[0].color,'Red');assert.equal(r.items[1].color,'Blue');assert.equal(r.outfitBoard.saved[0].slots.top,'copy-1');assert.equal(r.outfitBoard.current.slots.top,'copy-1');assert.equal(r.copies,1);
});
test('repeating a restore reuses matching copies, inspiration and saved boards instead of multiplying them',()=>{
 const c=setup(),incoming=normalized(c,backup({looks:[{id:'inspiration',title:'Saved',image:photo,pieces:[]}]}));
 const a=merge(c,local(c,[piece('shirt',{color:'Red'})]),incoming),b=merge(c,a,incoming);
 assert.equal(b.items.length,2);assert.equal(b.looks.length,1);assert.equal(b.outfitBoard.saved.length,1);assert.equal(b.added,0);assert.equal(b.copies,0);
});
test('current selection and all existing saved outfits survive additive restore',()=>{
 const c=setup(),a=local(c,[piece('existing')]);a.outfitBoard.current=c.cleanOutfitBoard({name:'Current',slots:{top:'existing'}},a.items);a.outfitBoard.saved=[a.outfitBoard.current];
 const r=merge(c,a,normalized(c));assert.equal(r.outfitBoard.current.slots.top,'existing');assert.equal(r.outfitBoard.saved.length,3);assert.ok(r.outfitBoard.saved.some(x=>x.name==='Imported selection'));
});
test('an account-owned backup refuses another customer or missing version-4 identity',()=>{
 const c=setup();for(const ownerId of ['bob',undefined,null])assert.throws(()=>normalized(c,backup({ownerId})),/another account/);
});
test('legacy backups remain readable without inventing ownership metadata',()=>{
 const c=setup();for(const version of [1,2,3]){const b=backup({version});delete b.ownerId;assert.equal(normalized(c,b).items[0].id,'shirt');}
});
test('duplicate IDs, truncated-ID collisions and malformed image values reject the entire file',()=>{
 const c=setup();for(const items of [[piece(),piece()],[piece('a'.repeat(101))],[piece('x',{image:'https://private.test/photo'})],[piece('x',{recognitionPhoto:{image:'data:image/jpeg;base64,broken'}})]])assert.throws(()=>normalized(c,backup({items,outfitBoard:undefined})),/ID|photo/);
});
test('incomplete outfit references, invalid categories and oversized saved collections never silently drop selections',()=>{
 const c=setup();for(const outfitBoard of [{current:{slots:{top:'missing'}},saved:[]},{current:{slots:{bottom:'shirt'}},saved:[]},{current:empty(),saved:Array.from({length:51},empty)}])assert.throws(()=>normalized(c,backup({outfitBoard})),/outfit|clothing/);
});
test('unsafe keys and deeply nested files fail validation before any merge',()=>{
 const c=setup(),unsafe=JSON.parse(JSON.stringify(backup()).replace('"ownerId":"alice"','"ownerId":"alice","__proto__":{"x":true}'));
 assert.throws(()=>normalized(c,unsafe),/unsafe/);let nested={};let cursor=nested;for(let i=0;i<45;i++)cursor=cursor.next={};assert.throws(()=>normalized(c,backup({nested})),/nested/);assert.equal({}.x,undefined);
});
test('capacity conflicts fail as a whole and do not mutate existing data',()=>{
 const c=setup(),a=local(c,[piece('old')]);a.outfitBoard.saved=Array.from({length:50},(_,i)=>c.cleanOutfitBoard({name:'Old '+i,slots:{top:'old'}},a.items));const before=JSON.stringify(a);
 assert.throws(()=>merge(c,a,normalized(c)),/limit/);assert.equal(JSON.stringify(a),before);
});
test('same-ID inspiration conflicts keep both and repeated restore remains idempotent',()=>{
 const c=setup(),a=local(c);a.looks=[{id:'look',title:'Newer',image:photo,pieces:[]}];const incoming=normalized(c,backup({looks:[{id:'look',title:'Older',image:photo,pieces:[]}]}));
 const r=merge(c,a,incoming);assert.equal(r.looks.length,2);assert.equal(r.looks[0].title,'Newer');assert.equal(merge(c,r,incoming).looks.length,2);
});
function ui(){
 const c=setup(),elements=new Map(),disk={items:[],state:[]};let tail=Promise.resolve();
 const h={disk,fail:false,confirm:[],cloud:[]};
 c.window={ClosetWardrobeBackup:E,closetAuth:{user:{id:'alice',email:'alice@example.test'}},closetCloud:{beforeWrite:async database=>h.cloud.push(database.name),changed:()=>{}}};
 c.$=id=>{if(!elements.has(id))elements.set(id,{textContent:'',disabled:false});return elements.get(id);};
 c.items=[];c.inspirationLooks=[];c.currentBoard=c.cleanOutfitBoard(empty(),[]);c.savedOutfitBoards=[];c.styledCollectionResults=[];c.stylistRequestRevision=0;
 c.db={name:'closet-current-user-alice',transaction(names,mode){
  const staged=structuredClone(disk);let aborted=false;
  const tx={abort(){aborted=true;},objectStore(name){return {getAll(){const r={};queueMicrotask(()=>{r.result=structuredClone(staged[name]);r.onsuccess?.();});return r;},put(row){if(h.fail&&name==='state')throw Error('Synthetic write failure');const index=staged[name].findIndex(x=>x.id===row.id);if(index<0)staged[name].push(structuredClone(row));else staged[name][index]=structuredClone(row);}};}};
  setImmediate(()=>{if(aborted)tx.onabort?.();else{if(mode==='readwrite')Object.assign(disk,staged);tx.oncomplete?.();}});return tx;
 }};
 c.writes=Promise.resolve();c.closetReady=c.outfitBoardReady=c.inspirationReady=Promise.resolve();
 c.validLook=x=>structuredClone(x);c.boardBackup=()=>({current:c.currentBoard,saved:c.savedOutfitBoards});c.message=()=>{};c.confirm=text=>{h.confirm.push(text);return true;};
 c.Image=class{naturalWidth=120;naturalHeight=180;decode(){return Promise.resolve();}removeAttribute(){}};
 Object.assign(c,{setTimeout,clearTimeout,Blob,Date});c.node=()=>({click(){}});
 for(const f of ['syncBoardInputs','renderSavedLooks','renderOutfitBoard','renderStyledCollection','render'])c[f]=()=>{};
 vm.runInContext(fs.readFileSync('public/wardrobe-backup.js','utf8'),c);
 h.c=c;h.status=()=>elements.get('backupStatus').textContent;
 h.restore=(data=backup(),text=async()=>JSON.stringify(data))=>elements.get('import').onchange({target:{files:[{size:100,text}],value:'chosen'}});
 return h;
}
test('all restored collections commit together and UI publishes only after durable success',async()=>{
 const h=ui();await h.restore();assert.equal(h.disk.items.length,1);assert.equal(h.disk.state.length,2);assert.equal(h.c.items.length,1);assert.match(h.status(),/Restored 1/);assert.match(h.confirm[0],/alice@example.test/);assert.deepEqual(h.cloud,['closet-current-user-alice']);
});
test('a later state write failure rolls back garment writes and publishes no partial success',async()=>{
 const h=ui();h.fail=true;await h.restore();assert.deepEqual(h.disk,{items:[],state:[]});assert.equal(h.c.items.length,0);assert.doesNotMatch(h.status(),/^Restored/);
});
test('account switching during file read prevents confirmation, cloud hook and all writes',async()=>{
 const h=ui();await h.restore(backup(),async()=>{h.c.window.closetAuth.user.id='bob';return JSON.stringify(backup());});assert.equal(h.confirm.length,0);assert.deepEqual(h.cloud,[]);assert.deepEqual(h.disk,{items:[],state:[]});assert.match(h.status(),/account changed/);
});
test('account switch during cloud preflight cannot restore into either stale or next database',async()=>{
 const h=ui();h.c.window.closetCloud.beforeWrite=async()=>{h.c.window.closetAuth.user.id='bob';};await h.restore();assert.deepEqual(h.disk,{items:[],state:[]});assert.equal(h.c.items.length,0);assert.match(h.status(),/account changed/);
});
test('legacy restore explicitly asks the intended account and keeps cancellation non-destructive',async()=>{
 const h=ui();h.c.confirm=text=>{h.confirm.push(text);return false;};const b=backup({version:3});delete b.ownerId;await h.restore(b);assert.match(h.confirm[0],/older backup.*alice@example.test/);assert.equal(h.disk.items.length,0);assert.match(h.status(),/cancelled/);
});
test('malformed JSON is retryable and never enters the cloud write queue',async()=>{
 const h=ui();await h.restore(null,async()=>'{broken');assert.equal(h.c.$('import').disabled,false);assert.deepEqual(h.cloud,[]);assert.equal(h.disk.items.length,0);await h.restore();assert.equal(h.disk.items.length,1);
});


test('an inspiration normalizer may never silently discard a valid photo',()=>{
 const c=setup();assert.throws(()=>E.validate(backup({looks:[{id:'look',image:photo,pieces:[]}]}),'alice',{normalizeItem:c.normalizeClothing,normalizeLook:x=>({...x,image:''}),cleanBoard:c.cleanOutfitBoard}),/losing detail/);
});
test('an invalid clothing category rejects instead of silently changing a correction',()=>{
 const c=setup();assert.throws(()=>normalized(c,backup({items:[piece('shirt',{category:'Corrupted category'})]})),/category/);
});
test('export never prepares a file above the same budget enforced by restore',async()=>{
 const h=ui();h.disk.items=[piece()];h.c.Blob=class{size=E.MAX_FILE_BYTES+1;};
 await h.c.$('export').onclick();assert.match(h.status(),/100 MB file limit/);assert.equal(h.c.$('export').disabled,false);
});
