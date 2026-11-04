const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/outfit-capture.js','utf8');
function setup({workerFails=false,saveFails=false}={}){
 const nodes=new Map(),timers=new Map();let now=0,next=0;const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,value:'',disabled:false});return nodes.get(id);};
 const c={$:el,batch:[],items:[],localPending:new Set(),busy:false,session:0,recognitionAssetVersion:'release',categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],crypto:{randomUUID:()=> 'id-'+(++next)},Date:{now:()=>now},setTimeout(fn,delay){const id=++next;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),stopCamera(){c.stopped=true;},controls:disabled=>c.controlsDisabled=disabled,segmentationAllows:(item,choice)=>!item.segmentHint?.clipped&&(!item.segmentHint||item.segmentHint.categories.includes(choice.category)),candidate(image,options){if([...c.batch,...c.items].some(x=>x.image===image))return false;c.batch.push({id:'piece-'+(++next),image,...options,requiresOwnershipConfirmation:options.requiresReview===true});return true;},saveIndexed:async item=>{if(saveFails)throw Error('storage failed');c.items.push({...item});c.batch=c.batch.filter(x=>x.id!==item.id);return true;},switchView:view=>{c.view=view;},structuredClone,closetReady:Promise.resolve(),outfitBoardReady:Promise.resolve(),photoToJPEG:async()=> 'data:image/jpeg;base64,AAAA',Worker:class{constructor(){if(workerFails)throw Error('unsupported');c.worker=this;}postMessage(data){this.request=data;}terminate(){this.stopped=true;}},render(){c.renderOutfitCapture();}};
 vm.createContext(c);vm.runInContext(source,c);return {c,el,timers,advance:n=>now+=n,emit:data=>c.worker.onmessage({data:{id:c.worker.request.id,...data}})};
}
test('automatically cropped pieces enter indexing separately with original photos retained',async()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');const hint={categories:['Tops'],types:[],clipped:false};h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint,recognitionPhoto:{image:'data:image/jpeg;base64,ABCD'},colorEstimate:{color:'Blue'}}});h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AACC',hint}});h.emit({type:'done',count:2});assert.equal(h.c.batch.length,2);assert.equal(h.c.busy,false);assert.equal(h.c.worker.stopped,true);assert.ok(h.c.batch.every(x=>x.requiresOwnershipConfirmation));assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,AAAA');assert.equal(h.c.batch[0].recognitionPhoto.image,'data:image/jpeg;base64,ABCD');assert.match(h.el('outfitSaveStatus').textContent,/confirmation in Adjust/);
});
test('partial failure keeps emitted photos, offers retry and does not invent owned clothing',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint:{categories:['Bottoms'],types:[],clipped:false}}});h.emit({type:'error'});assert.equal(h.c.batch.length,1);assert.equal(h.c.items.length,0);assert.equal(h.el('outfitRetry').hidden,false);assert.equal(h.c.busy,false);assert.equal(h.timers.size,0);
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
  assert.ok(h.c.batch.every(x=>x.requiresOwnershipConfirmation));
 }
 assert.equal(total,250);
 assert.equal(new Set(h.c.batch.map(x=>x.image)).size,250);
});

test('genuine multi16 connected-components request is explicit and all proposals require user review',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');
 assert.equal(h.c.worker.request.multi16,true);
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',
  hint:{categories:['Tops','Outerwear'],types:[],clipped:false},needsReview:true}});
 assert.equal(h.c.batch[0].requiresOwnershipConfirmation,true);
 assert.deepEqual([...h.c.batch[0].segmentHint.categories],['Tops','Outerwear']);
});

test('zero automatic proposals keep original and permit explicit manual Add Missed crop',async()=>{
 const h=setup(),image='data:image/jpeg;base64,AAAA';
 h.c.startOutfitSplit(image,'source-original');h.emit({type:'done',count:0});
 assert.equal(h.c.items.length,0);
 assert.equal(h.el('outfitPieceActions').hidden,false);
 assert.equal(h.el('outfitAddMissed').disabled,false);
 let opened=0;
 h.c.openPhotoCrop=async(item,{analyze,save})=>{
  opened++;assert.equal(item.originalPhoto.image,image);
  assert.equal(await analyze('data:image/jpeg;base64,AABB'),null);
  await save({image:'data:image/jpeg;base64,AABB',
   cropBounds:{x:.2,y:.3,width:.4,height:.5}});
 };
 await h.el('outfitAddMissed').onclick();
 assert.equal(opened,1);assert.equal(h.c.batch.length,1);
 assert.equal(h.c.batch[0].originalPhoto.image,image);
 assert.equal(h.c.batch[0].recognitionPhoto.image,'data:image/jpeg;base64,AABB');
 assert.equal(h.c.batch[0].requiresOwnershipConfirmation,true);
 assert.equal(h.c.items.length,0,'manual crop requires user category/color Adjust before storage');
});
test('manual Add Missed refuses duplicate crop and preserves original existing review item',async()=>{
 const h=setup(),image='data:image/jpeg;base64,AAAA';
 h.c.startOutfitSplit(image,'source-original');h.emit({type:'done',count:0});
 h.c.openPhotoCrop=async(item,{save})=>{
  await save({image:'data:image/jpeg;base64,AABB',
   cropBounds:{x:.2,y:.3,width:.4,height:.5}});
 };
 await h.el('outfitAddMissed').onclick();
 assert.equal(h.c.batch.length,1);
 await h.el('outfitAddMissed').onclick();
 assert.equal(h.c.batch.length,1,'duplicate manual crop cannot create second wardrobe item');
 assert.equal(h.c.items.length,0);
});
test('owner session change refuses to open another account original Add Missed dialog',async()=>{
 const h=setup(),image='data:image/jpeg;base64,AAAA';
 let owner='A',opened=false;
 h.c.captureProof01Active=true;h.c.captureProofOwner=()=>owner;
 const proof={image,sourceSHA256:'a'.repeat(64),sourceHashVerified:true,
  originalPhoto:{image,sha256:'a'.repeat(64)}};
 h.c.startOutfitSplit(image,'owner-A-source',proof);h.emit({type:'done',count:0});
 h.c.openPhotoCrop=async()=>{opened=true;};
 owner='B';await h.el('outfitAddMissed').onclick();
 assert.equal(opened,false);assert.equal(h.c.items.length,0);assert.equal(h.c.batch.length,0);
 assert.match(h.el('outfitSaveStatus').textContent,/owner could not be verified/);
});
