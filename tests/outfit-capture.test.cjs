const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/outfit-capture.js','utf8');
function setup({workerFails=false,saveFails=false}={}){
 const nodes=new Map(),timers=new Map();let now=0,next=0;const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,value:'',disabled:false});return nodes.get(id);};
 const c={$:el,batch:[],items:[],localPending:new Set(),busy:false,session:0,recognitionAssetVersion:'release',categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],crypto:{randomUUID:()=> 'id-'+(++next)},Date:{now:()=>now},setTimeout(fn,delay){const id=++next;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),stopCamera(){c.stopped=true;},controls:disabled=>c.controlsDisabled=disabled,segmentationAllows:(item,choice)=>!item.segmentHint?.clipped&&(!item.segmentHint||item.segmentHint.categories.includes(choice.category)),candidate(image,options){if([...c.batch,...c.items].some(x=>x.image===image))return false;c.batch.push({id:'piece-'+(++next),image,...options,requiresOwnershipConfirmation:true});return true;},saveIndexed:async item=>{if(saveFails)throw Error('storage failed');c.items.push({...item});c.batch=c.batch.filter(x=>x.id!==item.id);return true;},switchView:view=>{c.view=view;},structuredClone,closetReady:Promise.resolve(),outfitBoardReady:Promise.resolve(),photoToJPEG:async()=> 'data:image/jpeg;base64,AAAA',Worker:class{constructor(){if(workerFails)throw Error('unsupported');c.worker=this;}postMessage(data){this.request=data;}terminate(){this.stopped=true;}},render(){c.renderOutfitCapture();}};
 vm.createContext(c);vm.runInContext(source,c);return {c,el,timers,advance:n=>now+=n,emit:data=>c.worker.onmessage({data:{id:c.worker.request.id,...data}})};
}
test('outfit cutouts stay separate, require ownership confirmation, and add as independent closet items',async()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');const hint={categories:['Tops'],types:[],clipped:false};h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint}});h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AACC',hint}});h.emit({type:'done',count:2});assert.equal(h.c.batch.length,2);assert.equal(h.c.items.length,0);assert.equal(h.c.busy,false);assert.equal(h.c.worker.stopped,true);
 for(const item of h.c.batch)Object.assign(item,{localAnalyzed:true,category:'Tops',itemType:'T-shirt'});h.c.renderOutfitCapture();assert.equal(h.el('addOutfitPieces').disabled,false);await h.el('addOutfitPieces').onclick();assert.equal(h.c.items.length,2);assert.equal(h.c.batch.length,0);assert.ok(h.c.items.every(x=>!x.requiresOwnershipConfirmation));
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
test('failed ownership save restores the review flag and preserves the isolated photo',async()=>{
 const h=setup({saveFails:true});h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint:{categories:['Tops'],types:[],clipped:false}}});h.emit({type:'done',count:1});Object.assign(h.c.batch[0],{category:'Tops',itemType:'T-shirt',localAnalyzed:true});await h.el('addOutfitPieces').onclick();assert.equal(h.c.batch.length,1);assert.equal(h.c.batch[0].requiresOwnershipConfirmation,true);assert.equal(h.c.items.length,0);assert.match(h.el('outfitSaveStatus').textContent,/could not save/);
});
test('completion does not pull a user away from another feature',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.el('scan').hidden=true;h.c.view='stylist';h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint:{categories:['Tops'],types:[],clipped:false}}});h.emit({type:'done',count:1});assert.equal(h.c.view,'stylist');
});

test('bulk add saves only selected ready clothes and leaves deselected cutouts untouched',async()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');const hint={categories:['Tops'],types:[],clipped:false};
 for(const image of ['data:image/jpeg;base64,AABB','data:image/jpeg;base64,AACC'])h.emit({type:'piece',piece:{image,hint}});h.emit({type:'done',count:2});
 for(const item of h.c.batch)Object.assign(item,{localAnalyzed:true,category:'Tops',itemType:'T-shirt'});
 const excluded=h.c.batch[0].id;vm.runInContext('outfitExcludedIds.add(batch[0].id)',h.c);h.c.renderOutfitCapture();
 await h.el('addOutfitPieces').onclick();assert.equal(h.c.items.length,1);assert.equal(h.c.batch.length,1);assert.equal(h.c.batch[0].id,excluded);assert.equal(h.c.batch[0].requiresOwnershipConfirmation,true);
});
