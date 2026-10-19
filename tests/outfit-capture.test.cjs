const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/outfit-capture.js','utf8');
function setup({workerFails=false,saveFails=false}={}){
 const nodes=new Map(),timers=new Map();let now=0,next=0;const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,value:'',disabled:false});return nodes.get(id);};
 const c={$:el,batch:[],items:[],localPending:new Set(),busy:false,session:0,recognitionAssetVersion:'release',categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],crypto:{randomUUID:()=> 'id-'+(++next)},Date:{now:()=>now},setTimeout(fn,delay){const id=++next;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),stopCamera(){c.stopped=true;},controls:disabled=>c.controlsDisabled=disabled,segmentationAllows:(item,choice)=>!item.segmentHint?.clipped&&(!item.segmentHint||item.segmentHint.categories.includes(choice.category)),candidate(image,options){if([...c.batch,...c.items].some(x=>c.exactlyRepeatedCapturedItem(x,{image,...options})))return false;c.batch.push({id:'piece-'+(++next),image,...options,requiresOwnershipConfirmation:false});return true;},saveIndexed:async item=>{if(saveFails)throw Error('storage failed');c.items.push({...item});c.batch=c.batch.filter(x=>x.id!==item.id);return true;},switchView:view=>{c.view=view;},structuredClone,closetReady:Promise.resolve(),outfitBoardReady:Promise.resolve(),photoToJPEG:async()=> 'data:image/jpeg;base64,AAAA',Worker:class{constructor(){if(workerFails)throw Error('unsupported');c.worker=this;}postMessage(data){this.request=data;}terminate(){this.stopped=true;}},render(){c.renderOutfitCapture();}};
 vm.createContext(c);
 const app=fs.readFileSync('public/app.js','utf8');
 vm.runInContext(app.slice(app.indexOf('function exactlyRepeatedCapturedItem('),app.indexOf('function candidate(')),c);
 vm.runInContext(source,c);return {c,el,timers,advance:n=>now+=n,emit:data=>c.worker.onmessage({data:{id:c.worker.request.id,...data}})};
}
test('automatically cropped pieces enter indexing separately with original photos retained',async()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');const hint={categories:['Tops'],types:[],clipped:false};h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',hint,recognitionPhoto:{image:'data:image/jpeg;base64,ABCD'},colorEstimate:{color:'Blue'}}});h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AACC',recognitionPhoto:{image:'data:image/jpeg;base64,ACCD'},hint}});h.emit({type:'done',count:2});assert.equal(h.c.batch.length,2);assert.equal(h.c.busy,false);assert.equal(h.c.worker.stopped,true);assert.ok(h.c.batch.every(x=>!x.requiresOwnershipConfirmation));assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,AAAA');assert.equal(h.c.batch[0].recognitionPhoto.image,'data:image/jpeg;base64,ABCD');assert.match(h.el('outfitSaveStatus').textContent,/may save automatically/);
 assert.match(h.el('outfitSplitStatus').textContent,/new clothing regions found/);
});
test('partial failure keeps emitted photos, offers retry and does not invent owned clothing',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',recognitionPhoto:{image:'data:image/jpeg;base64,ABCD'},hint:{categories:['Bottoms'],types:[],clipped:false}}});h.emit({type:'error'});assert.equal(h.c.batch.length,1);assert.equal(h.c.items.length,0);assert.equal(h.el('outfitRetry').hidden,false);assert.equal(h.c.busy,false);assert.equal(h.timers.size,0);
});
test('worker constructor failure restores controls rather than trapping capture',()=>{
 const h=setup({workerFails:true});h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');assert.equal(h.c.busy,false);assert.equal(h.c.controlsDisabled,false);assert.equal(h.el('outfitRetry').hidden,false);assert.equal(h.timers.size,0);
});
test('setup progress cannot extend beyond five minutes and inference has a one-minute timeout',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.advance(299000);h.emit({type:'progress',phase:'loading',percent:90});assert.equal([...h.timers.values()][0].delay,1000);h.emit({type:'progress',phase:'separating'});assert.equal([...h.timers.values()][0].delay,60000);[...h.timers.values()][0].fn();assert.equal(h.c.busy,false);assert.equal(h.c.items.length,0);
});
test('completion does not pull a user away from another feature',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');h.el('scan').hidden=true;h.c.view='stylist';h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',recognitionPhoto:{image:'data:image/jpeg;base64,ABCD'},hint:{categories:['Tops'],types:[],clipped:false}}});h.emit({type:'done',count:1});assert.equal(h.c.view,'stylist');
});

test('100 simulated full-outfit camera captures keep cutouts distinct and queue automatic indexing',async()=>{
 const h=setup();let total=0;
 for(let scene=0;scene<100;scene++){
  h.c.startOutfitSplit('data:image/jpeg;base64,SCENE'+scene,'outfit-'+scene);
  const count=scene%4+1;
  for(let piece=0;piece<count;piece++){
   const image='data:image/jpeg;base64,SCENE'+scene+'PIECE'+piece;
   const category=['Tops','Bottoms','Outerwear','Shoes'][piece];
   h.emit({type:'piece',piece:{image,recognitionPhoto:{image},hint:{categories:[category],types:[],clipped:false}}});
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

test('outfit review recovers the latest saved capture after page reload without inventing unsaved pieces',async()=>{
 const h=setup();await Promise.resolve();
 h.c.items.push({id:'old',outfitSourceId:'capture-old',savedAt:'2026-10-15T12:00:00Z'},
 {id:'new',outfitSourceId:'capture-new',savedAt:'2026-10-18T12:00:00Z'});
 h.c.renderOutfitCapture();
 assert.equal(h.c.items.length,2);
 assert.equal(h.el('outfitPieceActions').hidden,false);
 assert.equal(h.el('useCapturedOutfit').disabled,false);
 assert.match(h.el('outfitPieceSummary').textContent,/1 saved/);
 assert.equal(vm.runInContext('outfitActiveId',h.c),'capture-new');
});
test('captured jacket and coat retain proper outerwear layers rather than sharing one shirt slot',()=>{
 const h=setup();const slot=type=>h.c.capturedPieceSlot({category:'Outerwear',itemType:type});
 assert.equal(slot('Cardigan'),'layer');
 assert.equal(slot('Vest'),'layer');
 assert.equal(slot('Jacket'),'layer2');
 assert.equal(slot('Blazer'),'layer2');
 assert.equal(slot('Unknown'),'layer2');
 assert.equal(slot('Coat'),'layer3');
 assert.equal(slot('Raincoat'),'layer3');
});
test('opening a new captured outfit does not carry over unused layers from the previous board',async()=>{
 const h=setup();
 // These already-saved garments originate from the exact whole outfit
 // being reopened; keep the original-photo provenance realistic.
 h.c.items.push({id:'red-top',category:'Tops',itemType:'T-shirt',
   outfitSourceId:'new-capture',originalPhoto:{image:'data:image/jpeg;base64,AAAA'}},
 {id:'jeans',category:'Bottoms',itemType:'Jeans',
   outfitSourceId:'new-capture',originalPhoto:{image:'data:image/jpeg;base64,AAAA'}});
 h.c.currentBoard={slots:{layer3:'old-coat'},ideas:{layer3:{type:'Coat'}},layerCount:3};
 h.c.cleanOutfitBoard=(board)=>({...board});
 h.c.persistBoardState=async()=>{h.c.persisted=true;};
 h.c.syncBoardInputs=()=>{};
 h.c.renderOutfitBoard=()=>{};
 h.c.boardGaps=()=>[];
 h.c.renderBoardSuggestions=()=>{};
 h.c.startOutfitSplit('data:image/jpeg;base64,AAAA','new-capture');
 // The selected outfit has saved owned clothes only; the fake worker needn't
 // emit segmentation results to exercise the existing board action.
 await h.el('useCapturedOutfit').onclick();
 assert.deepEqual(Object.assign({},h.c.currentBoard.slots),{top:'red-top',bottom:'jeans'});
 assert.deepEqual(Object.assign({},h.c.currentBoard.ideas),{});
 assert.equal(h.c.currentBoard.layerCount,0);
 assert.equal(h.c.currentBoard.name,'Captured outfit');
 assert.equal(h.c.view,'builder');
 assert.equal(h.c.persisted,true);
});

test('separated pieces without valid original RGB recognition crops never enter indexing',()=>{
 for(const recognitionPhoto of [undefined,null,{}, {image:null},{image:42},{image:''},{image:'data:image/png;base64,AAAA'},{image:'data:image/jpeg;base64,'}]){
  const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');
  assert.doesNotThrow(()=>h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',recognitionPhoto,hint:{categories:['Tops'],types:[]}}}));
  h.emit({type:'done',count:1});
  assert.equal(h.c.batch.length,0,'a display cutout must not become recognition evidence');
  assert.equal(h.c.busy,false);
  assert.equal(h.el('outfitRetry').hidden,false,'missing source evidence must offer retry');
 }
});
test('invalid source crop keeps valid earlier pieces and reports partial failure',()=>{
 const h=setup();h.c.startOutfitSplit('data:image/jpeg;base64,AAAA');
 const hint={categories:['Tops'],types:[]};
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AABB',recognitionPhoto:{image:'data:image/jpeg;base64,ABCD'},hint}});
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,AACC',hint}});
 h.emit({type:'done',count:2});
 assert.equal(h.c.batch.length,1);
 assert.equal(h.c.batch[0].recognitionPhoto.image,'data:image/jpeg;base64,ABCD');
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,AAAA');
 assert.equal(h.el('outfitRetry').hidden,false);
 assert.match(h.el('outfitSplitStatus').textContent,/original.*retry/i);
});

test('retry keeps a previously reviewed region even when recompressed JPEG bytes differ',()=>{
 const h=setup();const hint={categories:['Tops','Outerwear'],types:[],clipped:false};
 const original='data:image/jpeg;base64,AAAA',source='original-capture';
 const b={x:.2,y:.15,width:.35,height:.30};
 h.c.startOutfitSplit(original,source);
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,ONEA',
  recognitionPhoto:{image:'data:image/jpeg;base64,RAW1'},cropBounds:b,hint}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1);
 h.c.batch[0].userAdjusted=true;h.c.batch[0].category='Outerwear';
 h.c.startOutfitSplit(original,source);
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,ONEB',
  recognitionPhoto:{image:'data:image/jpeg;base64,RAW2'},
  cropBounds:{x:.201,y:.151,width:.350,height:.300},hint}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1,'same source and near-identical region cannot add duplicate');
 assert.equal(h.c.batch[0].image,'data:image/jpeg;base64,ONEA');
 assert.equal(h.c.batch[0].userAdjusted,true,'keep prior user edits');
 assert.equal(h.c.batch[0].category,'Outerwear');
 assert.match(h.el('outfitSplitStatus').textContent,/Already found 1 clothing regions/);
});
test('saved pieces deduplicate on retry, but other garments, overlapping layers, and fresh captures remain distinct',()=>{
 const h=setup(),raw={image:'data:image/jpeg;base64,RECOG'};
 const top={categories:['Tops','Outerwear'],types:[],clipped:false};
 const dress={categories:['Dresses'],types:[],clipped:false};
 const b={x:.1,y:.15,width:.5,height:.6};
 const photo='data:image/jpeg;base64,WHOLE';
 h.c.items.push({id:'saved',outfitSourceId:'first-photo',
  originalPhoto:{image:photo},cropBounds:b,segmentHint:{...top,sourceLabel:null},
  image:'data:image/jpeg;base64,SAVED',
  category:'Outerwear',itemType:'Jacket'});
 h.c.startOutfitSplit(photo,'first-photo');
 const emit=(image,bounds,hint=top)=>h.emit({type:'piece',piece:{image,recognitionPhoto:raw,
  cropBounds:bounds,hint}});
 emit('data:image/jpeg;base64,SAVED2',b); // old jacket JPEG changed
 emit('data:image/jpeg;base64,DRESS',b,dress); // same box, different class
 emit('data:image/jpeg;base64,SHIRT',{x:.11,y:.16,width:.25,height:.28});
 h.emit({type:'done',count:3});
 assert.equal(h.c.batch.length,2,'different layers and separate smaller garment still enter review');
 assert.equal(h.c.items.length,1,'original saved jacket preserved');
 assert.match(h.el('outfitSplitStatus').textContent,/2 new clothing regions/);
 h.c.startOutfitSplit(photo,'different-photo');
 emit('data:image/jpeg;base64,ANOTHER',b);
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,3,'fresh capture cannot dedupe the previous capture by region');
});
test('invalid or absent region metadata cannot suppress new captures from byte-similar garments',()=>{
 const h=setup(),hint={categories:['Tops'],types:[]};
 h.c.items.push({outfitSourceId:'capture',cropBounds:{x:0,y:0,width:1,height:1},
  segmentHint:hint,image:'data:image/jpeg;base64,OLD'});
 h.c.startOutfitSplit('data:image/jpeg;base64,WHOLE','capture');
 for(const [image,cropBounds] of [
  ['data:image/jpeg;base64,NONE',undefined],
  ['data:image/jpeg;base64,BAD',{x:0,y:0,width:1.3,height:1.1}],
  ['data:image/jpeg;base64,DIFFERENT',{x:.5,y:.5,width:.2,height:.2}]
 ]){
  h.emit({type:'piece',piece:{image,recognitionPhoto:{image},cropBounds,hint}});
 }
 h.emit({type:'done',count:3});
 assert.equal(h.c.batch.length,3);
});

test('reusing a capture ID with a different original photograph never hides a new garment',()=>{
 const h=setup(),hint={categories:['Tops'],types:[],clipped:false};
 const bounds={x:.15,y:.2,width:.3,height:.4};
 h.c.items.push({id:'prior-shirt',outfitSourceId:'shared-group',
  originalPhoto:{image:'data:image/jpeg;base64,ORIGINALA'},
  cropBounds:bounds,segmentHint:{...hint,sourceLabel:'Upper garment'},
  image:'data:image/jpeg;base64,SHIRTA'});
 h.c.startOutfitSplit('data:image/jpeg;base64,ORIGINALB','shared-group');
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,SHIRTB',
  label:'Upper garment',recognitionPhoto:{image:'data:image/jpeg;base64,RAWB'},
  cropBounds:bounds,hint}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.items.length,1);
 assert.equal(h.c.batch.length,1,'new source must not be mistaken for old garment');
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,ORIGINALB');
});
test('same-source near-identical regions are retained separately for distinct clothing layers',()=>{
 const h=setup(),image='data:image/jpeg;base64,ORIGINAL';
 const b={x:.1,y:.2,width:.4,height:.5};
 const top={categories:['Tops','Outerwear'],types:[],clipped:false};
 h.c.startOutfitSplit(image,'capture');
 const emit=(photo,label,layerRole)=>h.emit({type:'piece',piece:{
  image:photo,label,cropBounds:b,
  hint:{...top,layerRole},recognitionPhoto:{image:'data:image/jpeg;base64,RGB'}
 }});
 emit('data:image/jpeg;base64,UNDER','Upper garment','underlayer');
 emit('data:image/jpeg;base64,OVER','Upper garment','outerlayer');
 emit('data:image/jpeg;base64,COAT','Coat','outerlayer');
 emit('data:image/jpeg;base64,DUP','Upper garment','underlayer');
 h.emit({type:'done',count:4});
 assert.equal(h.c.batch.length,3,'underlayer, outerlayer and distinct semantic sources remain separate');
 assert.equal(h.c.batch[0].segmentHint.layerRole,'underlayer');
 assert.equal(h.c.batch[1].segmentHint.layerRole,'outerlayer');
 assert.equal(h.c.batch[2].segmentHint.sourceLabel,'Coat');
 assert.match(h.el('outfitSplitStatus').textContent,/3 new clothing regions/);
});
test('legacy saved records without source-photo provenance are never silently suppressed',()=>{
 const h=setup(),b={x:.1,y:.1,width:.3,height:.4},
 hint={categories:['Tops'],types:[],clipped:false};
 h.c.items.push({id:'legacy',outfitSourceId:'capture',cropBounds:b,segmentHint:hint,
  image:'data:image/jpeg;base64,OLD'});
 h.c.startOutfitSplit('data:image/jpeg;base64,NEWORIGINAL','capture');
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,NEW',
  recognitionPhoto:{image:'data:image/jpeg;base64,RAW'},cropBounds:b,hint}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1,'missing original evidence must fail open into review');
 assert.equal(h.c.items.length,1);
});

test('a mismatched original starts its own outfit group, preserving earlier saved board contents',()=>{
 const h=setup(),source='capture-group';
 const priorOriginal='data:image/jpeg;base64,ORIGINAL1',next='data:image/jpeg;base64,ORIGINAL2';
 h.c.items.push({id:'saved-top',outfitSourceId:source,
  originalPhoto:{image:priorOriginal},category:'Tops',itemType:'T-shirt'});
 h.c.startOutfitSplit(next,source);
 const freshGroup=vm.runInContext('outfitActiveId',h.c);
 assert.notEqual(freshGroup,source,'new original must not reuse previous outfit grouping');
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,ITEM2',
  label:'Upper garment',
  recognitionPhoto:{image:'data:image/jpeg;base64,RAW2'},
  cropBounds:{x:.1,y:.2,width:.3,height:.4},
  hint:{categories:['Tops','Outerwear'],types:[],clipped:false}}});
 h.emit({type:'done',count:1});
 assert.equal(h.c.items[0].outfitSourceId,source);
 assert.equal(h.c.batch[0].outfitSourceId,freshGroup);
 assert.equal(h.c.batch[0].originalPhoto.image,next);
});
test('legacy outfit with unverifiable original remains saved but cannot be silently grouped with new photo',()=>{
 const h=setup();
 h.c.items.push({id:'prior',outfitSourceId:'legacy',
   category:'Bottoms',itemType:'Jeans'});
 h.c.startOutfitSplit('data:image/jpeg;base64,NEW','legacy');
 assert.notEqual(vm.runInContext('outfitActiveId',h.c),'legacy');
 assert.equal(h.c.items.length,1);
 h.emit({type:'done',count:0});
});

test('actual outfit capture retains two source regions with identical cleaned thumbnails',()=>{
 const h=setup(),source='data:image/jpeg;base64,SAMEORIGINAL';
 h.c.startOutfitSplit(source,'capture');
 const hint={categories:['Tops','Outerwear'],types:[],clipped:false};
 const add=(x,role)=>h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,IDENTICALDISPLAY',
  recognitionPhoto:{image:'data:image/jpeg;base64,UNALTEREDRGB'+x},
  cropBounds:{x,y:.15,width:.25,height:.4},
  label:'Upper garment',hint:{...hint,layerRole:role}
 }});
 add(.05,'underlayer');add(.42,'outerlayer');
 h.emit({type:'done',count:2});
 assert.equal(h.c.batch.length,2,'same cleaned bytes do not erase separate original source regions');
 assert.equal(h.c.batch[0].originalPhoto.image,source);
 assert.equal(h.c.batch[1].originalPhoto.image,source);
 assert.notEqual(h.c.batch[0].cropBounds.x,h.c.batch[1].cropBounds.x);
 assert.match(h.el('outfitSplitStatus').textContent,/2 new clothing regions/);
});
test('overlapping layers with identical preview JPEGs remain separately reviewable by semantic role',()=>{
 const h=setup(),source='data:image/jpeg;base64,ORIGINALSAME';
 h.c.startOutfitSplit(source,'source-1');
 const box={x:.1,y:.2,width:.5,height:.5};
 const add=(role)=>h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,ONEPREVIEW',
  recognitionPhoto:{image:'data:image/jpeg;base64,SOURCERGB'+role},
  label:'Upper garment',hint:{categories:['Tops','Outerwear'],types:[],clipped:false,layerRole:role},
  cropBounds:box
 }});
 add('underlayer');add('outerlayer');add('underlayer');
 h.emit({type:'done',count:3});
 assert.equal(h.c.batch.length,2,'underlayer and jacket stay separate but exact repeat is suppressed');
 assert.equal(h.c.batch[0].segmentHint.layerRole,'underlayer');
 assert.equal(h.c.batch[1].segmentHint.layerRole,'outerlayer');
});
