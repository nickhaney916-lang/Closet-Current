const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{randomUUID}=require('node:crypto');
const source=fs.readFileSync('public/app.js','utf8');
const choice={label:'a T-shirt',category:'Tops',itemType:'T-shirt',sleeveLength:'Unknown'};
function setup({result={strong:true,choices:[choice],details:{color:'Blue',pattern:'Solid'}},quality,request}={}){
 const stored=[],elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 const c={scheduleMemoryReview(){},recognitionState:{phase:'idle',percent:null,activeId:null},renderRecognitionNotice(){},sessionCapturedIds:new Set(),items:[],batch:[],session:0,localPending:new Set(),automaticQueue:[],automaticRunning:false,localReady:true,localLoadPromise:null,recognitionUnavailable:false,localBatch:false,crypto:{randomUUID},Date,structuredClone,$:el,render(){},persistDraft(){},message(text){c.messageText=text;},checkPhoto:quality||(async(image)=>({blank:false,signature:[image.charCodeAt(0),100,200],aspect:1})),similarPhotos:(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join()===b.join(),localRequest:request||(async()=>result),queued:work=>work(),db:{transaction(){const tx={objectStore:name=>({put(value){if(name==='items')stored.push(value);}})};setImmediate(()=>tx.oncomplete?.());return tx;}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/taxonomy.js','utf8'),c);vm.runInContext(fs.readFileSync('public/clothing-details.js','utf8'),c);
 vm.runInContext(source.slice(source.indexOf('function candidate('),source.indexOf('function stopCamera(')),c);
 vm.runInContext(source.slice(source.indexOf('async function enableLocal('),source.indexOf('async function importClothingPhotos(')),c);
 return {c,stored,el};
}
async function done(c){for(let i=0;i<30&&(c.automaticRunning||c.localPending.size);i++)await new Promise(setImmediate);assert.equal(c.automaticRunning,false);}
test('a new photo is indexed and saved without a recognition button',async()=>{
 const {c,stored}=setup();c.candidate('one');await done(c);
 assert.equal(c.batch.length,0);assert.equal(c.items.length,1);assert.equal(stored[0].category,'Tops');assert.equal(stored[0].color,'Blue');assert.equal(stored[0].pattern,'Solid');assert.equal(stored[0].name,'Blue T-shirt');assert.deepEqual(Array.from(stored[0].seasons),[]);assert.equal(stored[0].brand,'');
});
test('uncertain labels stay uncategorized and are not autosaved',async()=>{
 const {c,stored}=setup({result:{strong:false,choices:[choice]}});c.candidate('one');await done(c);
 assert.equal(stored.length,0);assert.equal(c.batch[0].category,'Uncategorized');assert.equal(c.batch[0].color,'');assert.match(c.batch[0].localStatus,/Garment identity needs confirmation/);
});
test('flat frame is removed before contacting the model',async()=>{
 let calls=0;const {c}=setup({quality:async()=>({blank:true}),request:async()=>{calls++;}});c.candidate('blank');await done(c);
 assert.equal(c.batch.length,0);assert.equal(c.items.length,0);assert.equal(calls,0);assert.match(c.messageText,/Blank/);
});
test('an exact duplicate of a saved or queued photo is skipped',async()=>{
 const {c}=setup();c.candidate('one');assert.equal(c.candidate('one'),false);await done(c);assert.equal(c.candidate('one'),false);assert.equal(c.items.length,1);
});
test('lookalikes are flagged and retained rather than silently discarded',async()=>{
 const {c}=setup({quality:async()=>({blank:false,signature:[100,200,50],aspect:1})});c.candidate('one');await done(c);c.candidate('two');await done(c);
 assert.equal(c.items.length,1);assert.equal(c.batch.length,1);assert.equal(c.batch[0].possibleDuplicate,true);assert.match(c.batch[0].localStatus,/Possible duplicate/);
});
test('user adjustments made during recognition survive its response',async()=>{
 let finish;const {c,stored}=setup({request:()=>new Promise(resolve=>finish=resolve)});c.candidate('one');await new Promise(setImmediate);
 c.batch[0].userAdjusted=true;c.batch[0].category='Outerwear';c.batch[0].itemType='Coat';finish({strong:true,choices:[choice],details:{color:'Blue'}});await done(c);
 assert.equal(stored.length,0);assert.equal(c.batch[0].category,'Outerwear');assert.equal(c.batch[0].itemType,'Coat');
});
test('new capture during an IndexedDB save is preserved',async()=>{
 const {c}=setup();let first=true;
 c.db.transaction=()=>{const tx={objectStore:()=>({put(){}})};setImmediate(()=>{if(first){first=false;c.candidate('two');}tx.oncomplete();});return tx;};
 c.candidate('one');await done(c);assert.equal(c.items.length,2);assert.equal(c.batch.length,0);
});
test('model failure preserves all photos and retry processes the backlog',async()=>{
 const {c}=setup({request:async()=>{throw Error('model unavailable');}});c.candidate('one');c.candidate('two');await done(c);
 assert.equal(c.items.length,0);assert.equal(c.batch.length,2);assert.equal(c.localPending.size,0);
 c.localRequest=async()=>({strong:true,choices:[choice],details:{}});await c.recognizeBatch();await done(c);assert.equal(c.items.length,0,'missing color must not auto-save after retry');assert.equal(c.batch.length,2,'both recovered source drafts survive');assert.ok(c.batch.every(item=>item.localAnalyzed&&item.category==='Tops'&&item.requiresOwnershipConfirmation),'retry analyzes both; owner must confirm missing color');
});
test('photo checks reject uniform frames and preserve visible structure',()=>{
 const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('public/photo-check.js','utf8'),c);
 const flat=Array.from({length:256},()=>[255,255,255,255]).flat();assert.equal(c.photoQuality(flat).blank,true);
 const patterned=Array.from({length:256},(_,i)=>[i%2?0:255,100,100,255]).flat();assert.equal(c.photoQuality(patterned).blank,false);
 assert.equal(c.similarPhotos([10,20,30],[10,21,30]),true);assert.equal(c.similarPhotos([10,20,30],[200,200,200]),false);
});

test('a failed closet write remains retryable without losing the photo',async()=>{
 const {c}=setup();const good=c.db.transaction;let fail=true;
 c.db.transaction=()=>{if(!fail)return good();const tx={objectStore:()=>({put(){}}),error:Error('Storage write failed')};setImmediate(()=>tx.onabort?.());return tx;};
 c.candidate('one');await done(c);
 assert.equal(c.items.length,0);assert.equal(c.batch.length,1);assert.equal(c.batch[0].scanFailed,true);
 fail=false;await c.recognizeBatch();await done(c);
 assert.equal(c.items.length,1);assert.equal(c.batch.length,0);
});

test('100 simulated captures index every supported garment family and stay searchable',async()=>{
 const {localCandidates}=await import('../public/local-catalog.mjs');
 const garments=localCandidates.filter(x=>x.category!=='Uncategorized');
 const {c,stored}=setup({quality:async image=>({blank:false,signature:[Number(image.slice(6)),20,30],aspect:1}),request:async(type,image)=>({strong:true,choices:[garments[Number(image.slice(6))%garments.length]],details:{color:Number(image.slice(6))%2?'Blue':'Black',pattern:'Solid'}})});
 for(let group=0;group<5;group++){
  for(let i=group*20;i<group*20+20;i++)c.candidate('photo-'+i);
  for(let spin=0;spin<300&&(c.automaticRunning||c.localPending.size);spin++)await new Promise(setImmediate);
  assert.equal(c.automaticRunning,false);assert.equal(c.batch.length,0);assert.equal(c.items.length,(group+1)*20);
 }
 assert.equal(stored.length,100);assert.equal(new Set(c.items.map(x=>x.id)).size,100);
 for(let i=0;i<100;i++){
  const item=c.items[i],expected=garments[i%garments.length];
  assert.equal(item.category,expected.category);assert.equal(item.itemType,expected.itemType);
  assert.equal(c.clothingMatches(item,expected.itemType,expected.category,'',''),true);
  assert.equal(c.clothingMatches(item,'',item.category==='Tops'?'Shoes':'Tops','',''),false);
  assert.equal(item.brand,'');assert.equal(item.size,'');assert.equal(item.material,'');assert.deepEqual(Array.from(item.seasons),[]);
 }
});

test('a removed photo cannot be saved by a late recognition response',async()=>{
 let finish;const {c,stored}=setup({request:()=>new Promise(resolve=>finish=resolve)});
 c.candidate('one');await new Promise(setImmediate);c.batch=[];
 finish({strong:true,choices:[choice],details:{color:'Blue'}});await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.localPending.size,0);
});

test('unreadable photo does not block the next garment or fabricate labels',async()=>{
 const {c}=setup({quality:async image=>{if(image==='broken')throw Error('Decode failed');return {blank:false,signature:[1,2,3],aspect:1};}});
 c.candidate('broken');c.candidate('good');await done(c);
 assert.equal(c.items.length,1);assert.equal(c.items[0].image,'good');assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].image,'broken');assert.equal(c.batch[0].category,'Uncategorized');assert.equal(c.batch[0].scanFailed,true);
});

test('recognized outfit cutouts remain distinct individually reviewable closet drafts',async()=>{
 const {c,stored}=setup();c.candidate('outfit-top',{outfitSourceId:'capture',segmentHint:{categories:['Tops','Outerwear'],types:[],clipped:false}});await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].itemType,'T-shirt');assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
 assert.equal(c.batch[0].outfitSourceId,'capture');assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);
});
test('clipped cutouts and segmentation/category disagreements do not get guessed labels',async()=>{
 for(const hint of [{categories:['Bottoms'],types:[],clipped:false},{categories:['Tops'],types:[],clipped:true},{categories:['Tops'],types:['Polo'],clipped:false}]){
  const {c,stored}=setup();c.candidate('outfit-top',{outfitSourceId:'capture',segmentHint:hint});await done(c);assert.equal(stored.length,0);assert.equal(c.batch[0].category,'Uncategorized');assert.equal(c.batch[0].itemType,'Unknown');
 }
});

test('confirmed dress category fills review without subtype, attributes or autosave',async()=>{
 const result={strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{label:'Dresses',category:'Dresses',itemType:'Unknown',sleeveLength:'Unknown'}],details:{color:'Red'}};
 const {c,stored}=setup({result});c.candidate('dress');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch[0].category,'Dresses');assert.equal(c.batch[0].itemType,'Unknown');assert.equal(c.batch[0].color,'');assert.match(c.batch[0].localStatus,/Only a broad garment category/);
});
test('category-only review preserves user corrections and clipped mask restrictions',async()=>{
 const result={strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Dresses',itemType:'Unknown',sleeveLength:'Unknown'}]};
 const h=setup({result});h.c.candidate('dress',{outfitSourceId:'outfit',segmentHint:{categories:['Dresses'],types:[],clipped:true}});await done(h.c);assert.equal(h.c.batch[0].category,'Uncategorized');assert.equal(h.stored.length,0);
 let finish;const {c,stored}=setup({request:()=>new Promise(resolve=>finish=resolve)});c.candidate('dress');await new Promise(setImmediate);c.batch[0].userAdjusted=true;c.batch[0].category='Tops';c.batch[0].itemType='Tunic';finish(result);await done(c);assert.equal(c.batch[0].category,'Tops');assert.equal(c.batch[0].itemType,'Tunic');assert.equal(stored.length,0);
});
test('type recognition failure retains a color estimate and keeps the photo for category confirmation',async()=>{const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),result:{strong:false,choices:[],details:{}}});c.candidate('one');await done(c);assert.equal(stored.length,0);assert.equal(c.batch[0].color,'Blue');assert.equal(c.batch[0].colorSource,'photo-estimate');assert.match(c.batch[0].localStatus,/Color kept/);});
test('P842 broad shirt category and estimated color remain owner-review draft without inventing a subtype',async()=>{const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),result:{strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Tops',itemType:'Unknown',label:'Tops',sleeveLength:'Unknown'}],details:{}}});c.candidate('one');await done(c);assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);assert.equal(c.batch[0].category,'Tops');assert.equal(c.batch[0].color,'Blue');assert.equal(c.batch[0].itemType,'Unknown');assert.equal(c.batch[0].requiresOwnershipConfirmation,true);assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);});
test('confirmed category and color remain on separated outfit draft without automatic admission',async()=>{const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),result:{strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Tops',itemType:'Unknown',label:'Tops',sleeveLength:'Unknown'}],details:{}}});c.candidate('one',{outfitSourceId:'outfit',segmentHint:{categories:['Tops'],types:[],clipped:false}});await done(c);assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);assert.equal(c.batch[0].color,'Blue');assert.equal(c.batch[0].category,'Tops');assert.equal(c.batch[0].itemType,'Unknown');assert.equal(c.batch[0].requiresOwnershipConfirmation,true);assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);});

test('outfit recognition uses original crop texture while masked garment color wins over scene color',async()=>{
 let modelImage,qualityImage;const {c,stored}=setup({quality:async image=>{qualityImage=image;return {blank:false,signature:[1,2,3],aspect:1,colorEstimate:{color:'White'}};},request:async(type,image)=>{modelImage=image;return {strong:true,choices:[choice],details:{color:'Red',pattern:'Solid'}};}});
 c.candidate('isolated-display',{outfitSourceId:'capture',recognitionPhoto:{image:'raw-textured-crop'},originalPhoto:{image:'whole-outfit'},cropBounds:{x:.1,y:.2,width:.3,height:.4},colorEstimate:{color:'Blue'},segmentHint:{categories:['Tops'],types:[],clipped:false}});await done(c);
 assert.equal(modelImage,'raw-textured-crop');assert.equal(qualityImage,'raw-textured-crop');assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);assert.equal(c.batch[0].image,'isolated-display');assert.equal(c.batch[0].color,'Blue');assert.equal(c.batch[0].name,'Blue T-shirt');assert.equal(c.batch[0].colorMethod,'garment-mask');assert.equal(c.batch[0].originalPhoto.image,'whole-outfit');assert.equal(c.batch[0].recognitionPhoto.image,'raw-textured-crop');assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
});

test('P836 review-first trial retains confident garment as draft instead of silently saving',async()=>{
 const {c,stored}=setup();c.reviewFirst836=true;c.candidate('one');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].category,'Tops');assert.equal(c.batch[0].itemType,'T-shirt');
 assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
 assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);
});
test('P836 review-first trial retains category-only plus color without auto admission',async()=>{
 const {c,stored}=setup({
  quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),
  result:{strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Tops',itemType:'Unknown',label:'Tops',sleeveLength:'Unknown'}],details:{}}
 });
 c.reviewFirst836=true;c.candidate('one');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].category,'Tops');assert.equal(c.batch[0].itemType,'Unknown');
 assert.equal(c.batch[0].color,'Blue');assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
 assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);
});
test('P836 review-first trial respects a nonclothing/uncertain prediction and never saves',async()=>{
 const {c,stored}=setup({result:{strong:false,choices:[],reason:'category_uncertain'}});
 c.reviewFirst836=true;c.candidate('one');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);
 assert.equal(c.batch[0].category,'Uncategorized');
 assert.notEqual(c.batch[0].requiresOwnershipConfirmation,true);
});

test('P838 empirically risky subtype cannot bypass review by saving broad category and estimated color',async()=>{
 const guarded={strong:false,categoryConfirmed:true,categoryOnly:true,
  reason:'type_uncertain',choices:[{category:'Tops',itemType:'Unknown',label:'Tops',sleeveLength:'Unknown'}],
  details:{},diagnostics:{mission1SubtypeSafety:{ownerSubtypeReviewRequired:true}}};
 const {c,stored}=setup({
  quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),
  result:guarded
 });
 c.reviewFirst836=false;
 c.candidate('sweatshirt-risk');await done(c);
 assert.equal(stored.length,0,'no automatic category-color admission');
 assert.equal(c.items.length,0);
 assert.equal(c.batch.length,1,'original remains in draft');
 assert.equal(c.batch[0].category,'Tops');
 assert.equal(c.batch[0].itemType,'Unknown');
 assert.equal(c.batch[0].color,'Blue','photo estimate remains visible, not owner-confirmed');
 assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
 assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);
});
test('P838 empirically risky subtype without verified color still requires owner review',async()=>{
 const guarded={strong:false,categoryConfirmed:true,categoryOnly:true,
  reason:'type_uncertain',choices:[{category:'Shoes',itemType:'Unknown',label:'Shoes',sleeveLength:'Not applicable'}],
  details:{},diagnostics:{mission1SubtypeSafety:{ownerSubtypeReviewRequired:true}}};
 const {c,stored}=setup({result:guarded});
 c.reviewFirst836=false;c.candidate('boot-risk');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].category,'Shoes');
 assert.equal(c.batch[0].itemType,'Unknown');
 assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
});

test('P839 outfit strong classifier results remain original-photo drafts, never auto-admitted',async()=>{
 const {c,stored}=setup({result:{strong:true,choices:[choice],details:{color:'Blue',pattern:'Solid'}}});
 c.reviewFirst836=false;
 c.candidate('outfit-top',{outfitSourceId:'outfit-original-sha',segmentHint:{clipped:false,categories:['Tops'],types:['T-shirt']},
  recognitionPhoto:{image:'photo-texture'},originalPhoto:{image:'original-outfit'},
  cropBounds:{x:.1,y:.1,width:.4,height:.45}});
 await done(c);
 assert.equal(stored.length,0);
 assert.equal(c.items.length,0);
 assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
 assert.equal(c.batch[0].category,'Tops');
 assert.equal(c.batch[0].itemType,'T-shirt');
 assert.equal(c.batch[0].originalPhoto.image,'original-outfit');
 assert.equal(c.batch[0].recognitionPhoto.image,'photo-texture');
 assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);
});
test('P839 outfit confirmed category and estimated color never bypass the draft-review gate',async()=>{
 const result={strong:false,categoryConfirmed:true,categoryOnly:true,
  choices:[{category:'Dresses',itemType:'Unknown',label:'Dresses',sleeveLength:'Unknown'}],details:{}};
 const {c,stored}=setup({result,quality:async()=>({blank:false,signature:[1,2,3],aspect:1,
  colorEstimate:{color:'Purple'}})});
 c.reviewFirst836=false;c.candidate('outfit-dress',{outfitSourceId:'outfit-whole',
  segmentHint:{categories:['Dresses'],types:[],clipped:false}});await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].category,'Dresses');assert.equal(c.batch[0].itemType,'Unknown');
 assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
 assert.equal(c.batch[0].color,'Purple');
 assert.match(c.batch[0].localStatus,/Tap Adjust to confirm/);
});
test('P839 changed single photo auto-index policy only for outfit pieces',async()=>{
 const {c,stored}=setup();
 c.reviewFirst836=false;c.candidate('isolated-shirt');await done(c);
 assert.equal(stored.length,1);assert.equal(c.items.length,1);assert.equal(c.batch.length,0);
 assert.equal(c.items[0].itemType,'T-shirt');
});
test('P839 unsupported outfit segmentation remains quarantined and never reaches closet',async()=>{
 const {c,stored}=setup();c.candidate('outfit-clip',{outfitSourceId:'whole',
  segmentHint:{categories:['Tops'],types:['T-shirt'],clipped:true}});await done(c);
 assert.equal(stored.length,0);assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].category,'Uncategorized');
 assert.equal(c.batch[0].requiresOwnershipConfirmation,true);
});
