const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/outfit-capture.js','utf8');
function setup({workerFails=false,saveFails=false,guarded=false,proofLoader=null}={}){
 const nodes=new Map(),timers=new Map(),listeners=new Map();let now=0,next=0;const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,value:'',disabled:false});return nodes.get(id);};
 const window={addEventListener(type,handler){const group=listeners.get(type)||[];group.push(handler);listeners.set(type,group);}};
 const c={$:el,window,captureProof01Active:guarded,captureOperationEpoch:0,captureProofOwner:()=> 'owner-A',captureProofFromFile:file=>proofLoader?.(file),batch:[],items:[],localPending:new Set(),busy:false,session:0,recognitionAssetVersion:'release',categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],crypto:{randomUUID:()=> 'id-'+(++next)},Date:{now:()=>now},setTimeout(fn,delay){const id=++next;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),stopCamera(){c.stopped=true;},controls:disabled=>c.controlsDisabled=disabled,segmentationAllows:(item,choice)=>!item.segmentHint?.clipped&&(!item.segmentHint||item.segmentHint.categories.includes(choice.category)),candidate(image,options){if([...c.batch,...c.items].some(x=>x.image===image))return false;c.batch.push({id:'piece-'+(++next),image,...options,requiresOwnershipConfirmation:false});return true;},saveIndexed:async item=>{if(saveFails)throw Error('storage failed');c.items.push({...item});c.batch=c.batch.filter(x=>x.id!==item.id);return true;},switchView:view=>{c.view=view;},structuredClone,closetReady:Promise.resolve(),outfitBoardReady:Promise.resolve(),photoToJPEG:async()=> 'data:image/jpeg;base64,AAAA',Worker:class{constructor(){if(workerFails)throw Error('unsupported');c.worker=this;}postMessage(data){this.request=data;}terminate(){this.stopped=true;}},render(){c.renderOutfitCapture();}};
 vm.createContext(c);vm.runInContext(source,c);return {c,el,timers,advance:n=>now+=n,emit:data=>c.worker.onmessage({data:{id:c.worker.request.id,...data}}),lock:()=>{c.captureOperationEpoch++;c.busy=false;c.controls(false);for(const fn of listeners.get('closet:session-locked')||[])fn();}};
}
test('automatically cropped pieces enter indexing separately with original photos retained',async()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');const hint={categories:['Tops'],types:[],clipped:false};h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint,recognitionPhoto:{image:'data:image/jpeg;base64,ABCD'},colorEstimate:{color:'Blue'}}});h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AACC',hint}});h.emit({type:'done',count:2});assert.equal(h.c.batch.length,2);assert.equal(h.c.busy,false);assert.equal(h.c.worker.stopped,true);assert.ok(h.c.batch.every(x=>!x.requiresOwnershipConfirmation));assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,AAAA');assert.equal(h.c.batch[0].recognitionPhoto.image,'data:image/jpeg;base64,ABCD');assert.match(h.el('outfitSaveStatus').textContent,/save automatically/);
});
test('partial failure keeps emitted photos, offers retry and does not invent owned clothing',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint:{categories:['Bottoms'],types:[],clipped:false}}});h.emit({type:'error'});assert.equal(h.c.batch.length,1);assert.equal(h.c.items.length,0);assert.equal(h.el('outfitRetry').hidden,false);assert.equal(h.c.busy,false);assert.equal(h.timers.size,0);
});
test('zero-proposal success is a recoverable failure, never a completed photo save',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');
 const worker=h.c.worker;h.emit({type:'done',count:0});
 assert.equal(h.c.busy,false);assert.equal(h.c.controlsDisabled,false);
 assert.equal(worker.stopped,true);assert.equal(h.timers.size,0);
 assert.equal(h.el('outfitRetry').hidden,false);
 assert.match(h.el('outfitSplitStatus').textContent,/No new clothing pieces were added/);
 assert.match(h.el('outfitSplitStatus').textContent,/Single item/);
 assert.match(h.el('outfitSplitStatus').textContent,/Nothing was saved/);
 assert.equal(h.c.items.length,0);assert.equal(h.c.batch.length,0);
 assert.equal(h.el('useCapturedOutfit').disabled,true);
});
test('forged count and rejected worker pieces cannot hide zero-result recovery',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');
 h.emit({type:'piece',piece:{image:'data:image/png;base64,NOTJPEG',hint:{categories:['Tops'],types:[]}}});
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,BBBB',hint:{categories:['InventedCategory'],types:[]}}});
 h.emit({type:'done',count:999});
 assert.equal(h.c.batch.length,0);assert.equal(h.c.items.length,0);
 assert.equal(h.el('outfitRetry').hidden,false);
 assert.equal(h.c.busy,false);
});
test('zero-result retry retains original and accepts later REVIEW-only piece, never an automatic save',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA','source1');
 const stale=h.c.worker;h.emit({type:'done',count:0});
 assert.equal(h.el('outfitRetry').hidden,false);
 h.el('outfitRetry').onclick();
 assert.notEqual(h.c.worker,stale);assert.equal(h.el('outfitRetry').hidden,true);
 assert.equal(h.c.worker.request.image,'data:image/jpeg;base64,AAAA');
 const hint={categories:['Tops'],types:[],clipped:false};
 stale.onmessage({data:{id:stale.request.id,type:'piece',
  piece:{image:'data:image/jpeg;base64,STALE',hint}}});
 assert.equal(h.c.batch.length,0,'stale terminated worker cannot write photo results');
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,VALID',hint}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1);assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,AAAA');
 assert.equal(h.el('outfitRetry').hidden,true);
});
test('duplicate-only scan keeps the previously pending private photo and enables retry',()=>{
 const h=setup();const source='data:image/jpeg;base64,AAAA';
 const hint={categories:['Tops'],types:[],clipped:false};
 h.c.startOutfitSplit(source,'same-owner-source');
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,EXISTING',hint}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1);
 h.c.startOutfitSplit(source,'same-owner-source');
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,EXISTING',hint}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1);assert.equal(h.c.items.length,0);
 assert.equal(h.el('outfitRetry').hidden,false);
});
test('worker constructor failure restores controls rather than trapping capture',()=>{
 const h=setup({workerFails:true});h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');assert.equal(h.c.busy,false);assert.equal(h.c.controlsDisabled,false);assert.equal(h.el('outfitRetry').hidden,false);assert.equal(h.timers.size,0);
});
test('setup progress cannot extend beyond five minutes and inference has a one-minute timeout',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.advance(299000);h.emit({type:'progress',phase:'loading',percent:90});assert.equal([...h.timers.values()][0].delay,1000);h.emit({type:'progress',phase:'separating'});assert.equal([...h.timers.values()][0].delay,60000);[...h.timers.values()][0].fn();assert.equal(h.c.busy,false);assert.equal(h.c.items.length,0);
});
test('completion does not pull a user away from another feature',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.el('scan').hidden=true;h.c.view='stylist';h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint:{categories:['Tops'],types:[],clipped:false}}});h.emit({type:'done',count:1});assert.equal(h.c.view,'stylist');
});

test('100 simulated full-outfit camera captures keep cutouts distinct and queue automatic indexing',async()=>{
 const h=setup();let total=0;
 for(let scene=0;scene<100;scene++){
  h.c.startOutfitSplit('data:image/jpeg;base64,SCENE'+scene,'outfit-'+scene);
  const count=scene%4+1;
  for(let piece=0;piece<count;piece++){
   const image='data:image/jpeg;base64,SCENE'+scene+'PIECE'+piece;
   const category=['Tops','Bottoms','Outerwear','Shoes'][piece];
   h.emit({type:'piece',piece:{image,hint:{categories:[category],types:[],clipped:false}}});
  }
  h.emit({type:'done',count});
  total+=count;
  assert.equal(h.c.items.length,0,'recognition is delegated to the indexing queue');
  assert.equal(h.c.batch.length,total,'no separated item is lost');
  assert.equal(h.c.busy,false,'camera is released after every scene');
  assert.ok(h.c.batch.every(x=>!x.requiresOwnershipConfirmation));
 }
 assert.equal(total,250);
 assert.equal(new Set(h.c.batch.map(x=>x.image)).size,250);
});

test('M183: a delayed JPEG import cannot resume after logout and SAME-owner re-login',async()=>{
 let resolveProof;
 const delayed=new Promise(resolve=>{resolveProof=resolve;});
 const h=setup({guarded:true,proofLoader:()=>delayed});
 const old=h.c.readOutfitPhoto({size:1000,type:'image/jpeg',name:'previous-session.jpg'});
 assert.equal(h.c.busy,true);
 h.lock(); // Simulates app.js lease increment + same-owner new session controls.
 assert.equal(h.c.busy,false);
 resolveProof({image:'data:image/jpeg;base64,AAAA',sourceSHA256:'same-hash',originalPhoto:{sha256:'same-hash'}});
 await old;
 assert.equal(h.c.worker,undefined,'revoked photo must not start a worker for the next session');
 assert.equal(h.c.busy,false);
 assert.equal(h.c.controlsDisabled,false);
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(h.timers.size,0);
 assert.equal(h.el('outfitRetry').hidden,true);
 assert.equal(h.el('outfitSplitStatus').textContent,'');
});

test('M183: stale decode rejection must not overwrite new session status or controls',async()=>{
 let rejectProof;
 const delayed=new Promise((_,reject)=>{rejectProof=reject;});
 const h=setup({guarded:true,proofLoader:()=>delayed});
 const old=h.c.readOutfitPhoto({size:1000,type:'image/jpeg',name:'old.jpg'});
 h.lock();
 h.el('outfitSplitStatus').textContent='New account session ready';
 h.c.controls(true); // Simulate another current-session camera task.
 rejectProof(Error('old photo decode failed'));
 await old;
 assert.equal(h.el('outfitSplitStatus').textContent,'New account session ready');
 assert.equal(h.c.controlsDisabled,true,'old finalizer must not release new task controls');
 assert.equal(h.c.worker,undefined);
 assert.equal(h.timers.size,0);
});

test('M183: session lock terminates an active worker, clears previous status and refuses stale packets',()=>{
 const h=setup();
 h.c.startOutfitSplit('data:image/jpeg;base64,AAAA','previous-session-outfit');
 const stale=h.c.worker;
 h.el('outfitSplitStatus').textContent='Separating previous owner photo';
 h.el('outfitPieceActions').hidden=false;
 h.el('outfitSaveStatus').textContent='Old owner result';
 h.lock();
 assert.equal(stale.stopped,true);
 assert.equal(h.c.busy,false);
 assert.equal(h.el('outfitRetry').hidden,true);
 assert.equal(h.el('outfitSplitStatus').textContent,'');
 assert.equal(h.el('outfitSaveStatus').textContent,'');
 assert.equal(h.el('outfitPieceActions').hidden,true);
 assert.equal(h.el('useCapturedOutfit').disabled,true);
 assert.equal(h.timers.size,0);
 const hint={categories:['Tops'],types:[],clipped:false};
 stale.onmessage({data:{id:stale.request.id,type:'piece',piece:{image:'data:image/jpeg;base64,STALE',hint}}});
 assert.equal(h.c.batch.length,0,'revoked worker cannot inject pieces');
 h.c.startOutfitSplit('data:image/jpeg;base64,NEWSESSION','new-session-outfit');
 assert.notEqual(h.c.worker,stale);
 assert.equal(h.c.busy,true,'new session can start independent scan');
 h.emit({type:'done',count:0});
 assert.equal(h.c.busy,false);
 assert.equal(h.c.items.length,0);
});
