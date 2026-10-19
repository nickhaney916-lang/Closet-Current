const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{randomUUID}=require('node:crypto');
const source=fs.readFileSync('public/app.js','utf8');
const choice={label:'a T-shirt',category:'Tops',itemType:'T-shirt',sleeveLength:'Unknown'};
function setup({result={strong:true,choices:[choice],details:{color:'Blue',pattern:'Solid'}},quality,request}={}){
 const stored=[],elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 const c={scheduleMemoryReview(){},recognitionState:{phase:'idle',percent:null,activeId:null},renderRecognitionNotice(){},sessionCapturedIds:new Set(),items:[],batch:[],session:0,localPending:new Set(),automaticQueue:[],automaticRunning:false,localReady:true,localLoadPromise:null,recognitionUnavailable:false,localBatch:false,crypto:{randomUUID},Date,structuredClone,$:el,render(){},persistDraft(){},message(text){c.messageText=text;},checkPhoto:quality||(async(image)=>({blank:false,signature:[image.charCodeAt(0),100,200],aspect:1})),similarPhotos:(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join()===b.join(),localRequest:request||(async()=>result),queued:work=>work(),db:{transaction(){const tx={objectStore:name=>({put(value){if(name==='items')stored.push(value);}})};setImmediate(()=>tx.oncomplete?.());return tx;}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/taxonomy.js','utf8'),c);vm.runInContext(fs.readFileSync('public/clothing-details.js','utf8'),c);
 vm.runInContext(source.slice(source.indexOf('function exactlyRepeatedCapturedItem('),source.indexOf('function stopCamera(')),c);
 // The actual outfit worker always attaches an unmasked original-RGB crop.
 // Older simulated tests omitted it, then accidentally relied on using the
 // display cutout for recognition. Model the real worker contract explicitly.
 const originalCandidate=c.candidate;
 c.candidate=(image,options={})=>originalCandidate(image,
   options.outfitSourceId&&!options.recognitionPhoto?
     {...options,recognitionPhoto:{image:'data:image/jpeg;base64,ORIGINALRGB'+image}}:options);
 vm.runInContext(source.slice(source.indexOf('function recognitionSourcePhoto('),source.indexOf('function clothingFields(')),c);
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

test('identical cleaned previews from two original-photo regions are retained for review, not silently dropped',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[40,40,40],aspect:1})});
 const original='data:image/jpeg;base64,ORIGINALSAMEHIGHRES';
 const options=box=>({outfitSourceId:'photo-1',
  recognitionPhoto:{image:'data:image/jpeg;base64,ORIGINALREGION'+box.x},
  originalPhoto:{image:original},cropBounds:box,
  segmentHint:{categories:['Tops','Outerwear'],types:[],clipped:false}});
 const first=options({x:.08,y:.15,width:.32,height:.26});
 const second=options({x:.43,y:.15,width:.31,height:.28});
 assert.equal(c.candidate('identical-cleaned-preview',first),true);
 assert.equal(c.candidate('identical-cleaned-preview',second),true,
  'physical pieces at different locations are not duplicate display images');
 await done(c);
 assert.equal(stored.length,0,'ambiguous matching display images must not auto-save');
 assert.equal(c.items.length,0);
 assert.equal(c.batch.length,2,'both physical candidates remain in review');
 assert.ok(c.batch.every(x=>x.possibleDuplicate===true));
 assert.ok(c.batch.every(x=>x.originalPhoto.image===original));
 assert.notEqual(c.batch[0].cropBounds.x,c.batch[1].cropBounds.x);
});
test('a repeat of the exact original source region is suppressed, but another original photo is retained',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[22,22,22],aspect:1})});
 const base={outfitSourceId:'group',originalPhoto:{image:'data:image/jpeg;base64,SCENEA'},
  recognitionPhoto:{image:'data:image/jpeg;base64,REGIONA'},
  cropBounds:{x:.2,y:.3,width:.25,height:.3},
  segmentHint:{categories:['Bottoms'],types:['Skirt'],clipped:false}};
 assert.equal(c.candidate('identical-preview',base),true);
 assert.equal(c.candidate('identical-preview',{...base}),false,
  'same source region is a genuine repeated worker result');
 assert.equal(c.candidate('identical-preview',{...base,
  outfitSourceId:'group-2'}),false,
  'recapturing the identical full original under a new capture ID is still a repeat');
 assert.equal(c.candidate('identical-preview',{...base,outfitSourceId:'new-photo',
  originalPhoto:{image:'data:image/jpeg;base64,SCENEB'}}),true,
  'identical cleaned preview from independently captured originals must not erase an article');
 await done(c);
 assert.equal(stored.length,0);
 assert.equal(c.batch.length,2);
 assert.ok(c.batch.every(x=>x.possibleDuplicate));
 assert.notEqual(c.batch[0].originalPhoto.image,c.batch[1].originalPhoto.image);
});
test('same-looking standalone photo remains an exact duplicate, but original-backed outfit comparison is not lost',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[56,57,58],aspect:1})});
 assert.equal(c.candidate('one-shot-display'),true);
 assert.equal(c.candidate('one-shot-display'),false,'single original still uses exact duplicate suppression');
 const other={outfitSourceId:'genuine-outfit',originalPhoto:{image:'data:image/jpeg;base64,ORIGINALSCENE'},
  recognitionPhoto:{image:'data:image/jpeg;base64,ORIGINALCROP'},
  cropBounds:{x:.1,y:.1,width:.22,height:.3},
  segmentHint:{categories:['Tops'],types:[],clipped:false}};
 assert.equal(c.candidate('one-shot-display',other),true,
  'a whole-scene source is independently reviewable beside a same-looking standalone item');
 await done(c);
 assert.equal(stored.length,0,'neither same-looking source is silently approved');
 assert.equal(c.batch.length,2,'the standalone and sourced garment both survive for review');
 assert.ok(c.batch.some(x=>x.outfitSourceId==='genuine-outfit'));
 assert.ok(c.batch.every(x=>x.possibleDuplicate===true),'identical displays trigger explicit duplicate review instead of deletion');
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
 c.localRequest=async()=>({strong:true,choices:[choice],details:{color:'Blue'}});await c.recognizeBatch();await done(c);assert.equal(c.items.length,2);
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

test('recognized outfit cutouts automatically save as individual closet items',async()=>{
 const {c,stored}=setup();c.candidate('outfit-top',{outfitSourceId:'capture',segmentHint:{categories:['Tops','Outerwear'],types:[],clipped:false}});await done(c);
 assert.equal(stored.length,1);assert.equal(c.items.length,1);assert.equal(c.batch.length,0);assert.equal(c.items[0].itemType,'T-shirt');assert.equal(c.items[0].requiresOwnershipConfirmation,false);assert.equal(c.items[0].outfitSourceId,'capture');
});
test('clipped cutouts and segmentation/category disagreements do not get guessed labels',async()=>{
 for(const hint of [{categories:['Bottoms'],types:[],clipped:false},{categories:['Tops'],types:[],clipped:true},{categories:['Tops'],types:['Polo'],clipped:false}]){
  const {c,stored}=setup();c.candidate('outfit-top',{outfitSourceId:'capture',segmentHint:hint});await done(c);assert.equal(stored.length,0);assert.equal(c.batch[0].category,'Uncategorized');assert.equal(c.batch[0].itemType,'Unknown');
 }
});

test('confirmed dress category fills review without subtype, attributes or autosave',async()=>{
 const result={strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{label:'Dresses',category:'Dresses',itemType:'Unknown',sleeveLength:'Unknown'}],details:{color:'Red'}};
 const {c,stored}=setup({result});c.candidate('dress');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch[0].category,'Dresses');assert.equal(c.batch[0].itemType,'Unknown');assert.equal(c.batch[0].color,'');assert.match(c.batch[0].localStatus,/Choose a color below to save; specific type is optional/);
});
test('category-only review preserves user corrections and clipped mask restrictions',async()=>{
 const result={strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Dresses',itemType:'Unknown',sleeveLength:'Unknown'}]};
 const h=setup({result});h.c.candidate('dress',{outfitSourceId:'outfit',segmentHint:{categories:['Dresses'],types:[],clipped:true}});await done(h.c);assert.equal(h.c.batch[0].category,'Uncategorized');assert.equal(h.stored.length,0);
 let finish;const {c,stored}=setup({request:()=>new Promise(resolve=>finish=resolve)});c.candidate('dress');await new Promise(setImmediate);c.batch[0].userAdjusted=true;c.batch[0].category='Tops';c.batch[0].itemType='Tunic';finish(result);await done(c);assert.equal(c.batch[0].category,'Tops');assert.equal(c.batch[0].itemType,'Tunic');assert.equal(stored.length,0);
});
test('type recognition failure retains a color estimate and keeps the photo for category confirmation',async()=>{const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),result:{strong:false,choices:[],details:{}}});c.candidate('one');await done(c);assert.equal(stored.length,0);assert.equal(c.batch[0].color,'Blue');assert.equal(c.batch[0].colorSource,'photo-estimate');assert.match(c.batch[0].localStatus,/Color kept/);});
test('confirmed broad shirt category and color are saved without inventing a subtype',async()=>{const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),result:{strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Tops',itemType:'Unknown',label:'Tops',sleeveLength:'Unknown'}],details:{}}});c.candidate('one');await done(c);assert.equal(stored.length,1);assert.equal(c.items[0].category,'Tops');assert.equal(c.items[0].color,'Blue');assert.equal(c.items[0].itemType,'Unknown');assert.equal(c.items[0].indexingLevel,'category-color');assert.equal(c.batch.length,0);});
test('confirmed category and color automatically save separated outfit pieces',async()=>{const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,100],aspect:1,colorEstimate:{color:'Blue'}}),result:{strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Tops',itemType:'Unknown',label:'Tops',sleeveLength:'Unknown'}],details:{}}});c.candidate('one',{outfitSourceId:'outfit',colorEstimate:{color:'Blue',source:'photo-estimate'},segmentHint:{categories:['Tops'],types:[],clipped:false}});await done(c);assert.equal(stored.length,1);assert.equal(c.batch.length,0);assert.equal(c.items[0].color,'Blue');assert.equal(c.items[0].colorMethod,'garment-mask');assert.equal(c.items[0].indexingLevel,'category-color');});

test('outfit recognition uses original crop texture while masked garment color wins over scene color',async()=>{
 let modelImage,qualityImage;const {c,stored}=setup({quality:async image=>{qualityImage=image;return {blank:false,signature:[1,2,3],aspect:1,colorEstimate:{color:'White'}};},request:async(type,image)=>{modelImage=image;return {strong:true,choices:[choice],details:{color:'Red',pattern:'Solid'}};}});
 c.candidate('isolated-display',{outfitSourceId:'capture',recognitionPhoto:{image:'raw-textured-crop'},originalPhoto:{image:'whole-outfit'},cropBounds:{x:.1,y:.2,width:.3,height:.4},colorEstimate:{color:'Blue'},segmentHint:{categories:['Tops'],types:[],clipped:false}});await done(c);
 assert.equal(modelImage,'raw-textured-crop');assert.equal(qualityImage,'raw-textured-crop');assert.equal(stored.length,1);assert.equal(stored[0].image,'isolated-display');assert.equal(stored[0].color,'Blue');assert.equal(stored[0].name,'Blue T-shirt');assert.equal(stored[0].colorMethod,'garment-mask');assert.equal(stored[0].originalPhoto.image,'whole-outfit');assert.equal(stored[0].recognitionPhoto.image,'raw-textured-crop');
});

test('accidentally visible clothing beneath a garment is not guessed as a Top',async()=>{
 const {c,stored}=setup({result:{strong:false,categoryConfirmed:false,choices:[],details:{}}});
 c.candidate('partial-underlayer',{outfitSourceId:'outfit1',
  segmentHint:{categories:['Tops','Outerwear'],types:[],clipped:false,layerRole:'underlayer'},
  colorEstimate:{color:'Blue',source:'photo-estimate',support:.9}});
 await done(c);
 assert.equal(c.items.length,0);
 assert.equal(stored.length,0);
 assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].category,'Uncategorized');
 assert.equal(c.batch[0].itemType,'Unknown');
 assert.equal(c.batch[0].underlayerReview,undefined);
 assert.match(c.batch[0].localStatus,/Confirm the garment category/);
});
test('single visible jacket keeps correct identity instead of prompting for underneath clothing',async()=>{
 const jacket={category:'Outerwear',itemType:'Jacket',label:'a jacket',sleeveLength:'Long sleeve'};
 const {c,stored}=setup({result:{strong:true,choices:[jacket],details:{color:'Blue'}}});
 c.candidate('one-visible-jacket',{outfitSourceId:'outfit1',
  segmentHint:{categories:['Tops','Outerwear'],types:[],clipped:false}});
 await done(c);
 assert.equal(stored.length,1);
 assert.equal(c.items[0].category,'Outerwear');
 assert.equal(c.items[0].itemType,'Jacket');
 assert.equal(c.items[0].underlayerReview,undefined);
});

test('a strongly recognized garment with missing color stays in photo review instead of autosaving',async()=>{
 const {c,stored}=setup({result:{strong:true,choices:[choice],details:{}}});
 c.candidate('no-color');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);
 assert.equal(c.batch.length,1);assert.equal(c.batch[0].category,'Tops');
 assert.equal(c.batch[0].color,'');
 assert.match(c.batch[0].localStatus,/Choose a color below to save; your original photo is kept/i);
});
test('uncertain photo color never becomes an automatic category-color save',async()=>{
 const {c,stored}=setup({
  quality:async()=>({blank:false,signature:[22,33,44],aspect:1,colorEstimate:{color:'Brown',needsConfirmation:true}}),
  result:{strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Bottoms',itemType:'Unknown',label:'Bottoms'}],details:{}}
 });
 c.candidate('orange-shorts-photo');await done(c);
 assert.equal(stored.length,0);assert.equal(c.items.length,0);assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].category,'Bottoms');assert.equal(c.batch[0].color,'');
 assert.match(c.batch[0].localStatus,/Choose a color below to save; specific type is optional/i);
});
test('strong model color is accepted when photographic color is uncertain',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[1,2,3],aspect:1,colorEstimate:{color:'Brown',needsConfirmation:true}})});
 c.candidate('orange-shorts-photo');await done(c);
 assert.equal(stored.length,1);assert.equal(stored[0].color,'Blue');
 assert.equal(stored[0].colorSource,'recognition');
});
test('fabric color suggestions cannot overwrite user-entered color',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[11,22,33],aspect:1,colorEstimate:{color:'Brown',needsConfirmation:true}})});
 c.candidate('one');await done(c);assert.equal(stored[0].color,'Blue');
});

test('recognized color-pending garment offers quick color save, not a mandatory full Adjust screen',()=>{
 const source=fs.readFileSync('public/app.js','utf8');
 assert.match(source,/Garment identified\. Choose a color below to save; your original photo is kept/);
 assert.match(source,/Garment category recognized\. Choose a color below to save; specific type is optional/);
});

test('unmasked outfit fallback cannot automatically take its background as clothing color',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,30],aspect:1,
  colorEstimate:{color:'White'}}),result:{strong:false,categoryConfirmed:true,categoryOnly:true,
  choices:[{category:'Tops',itemType:'Unknown',label:'Tops',sleeveLength:'Unknown'}],details:{}}});
 c.candidate('unreliable-outfit-tile',{outfitSourceId:'capture',
  recognitionPhoto:{image:'original-unmasked-crop'},segmentHint:{
   categories:['Tops'],types:[],clipped:false,displayFallback:'original-crop',
   displayFallbackReason:'unexplained-enclosed-gap'}});
 await done(c);
 assert.equal(stored.length,0);
 assert.equal(c.batch[0].category,'Uncategorized');assert.equal(c.batch[0].color,'');
 assert.match(c.batch[0].localStatus,/multiple garments or background/);
});
test('even strong outfit label cannot use room-color photo estimate without garment evidence',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,30],aspect:1,
  colorEstimate:{color:'Red'}}),result:{strong:true,choices:[choice],details:{}}});
 c.candidate('whole-outfit-piece',{outfitSourceId:'full-photo',
  recognitionPhoto:{image:'original-rgb'},segmentHint:{categories:['Tops'],types:[],clipped:false}});
 await done(c);
 assert.equal(stored.length,0);assert.equal(c.batch[0].category,'Tops');
 assert.equal(c.batch[0].color,'');
});
test('single-garment camera color remains available for automatic indexing',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,30],aspect:1,
  colorEstimate:{color:'Blue'}}),result:{strong:true,choices:[choice],details:{}}});
 c.candidate('single-item');await done(c);
 assert.equal(stored.length,1);assert.equal(stored[0].color,'Blue');
 assert.equal(stored[0].colorSource,'photo-estimate');
});
test('a verified mask color retains priority over both scene color and model detail',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,30],aspect:1,
  colorEstimate:{color:'White'}}),result:{strong:true,choices:[choice],details:{color:'Red'}}});
 c.candidate('outfit-display',{outfitSourceId:'outfit',
  recognitionPhoto:{image:'original-crop'},segmentHint:{categories:['Tops'],types:[],
   clipped:false},
  colorEstimate:{color:'Blue',source:'photo-estimate'}});
 await done(c);
 assert.equal(stored.length,1);
 assert.equal(stored[0].color,'Blue');
 assert.equal(stored[0].colorMethod,'garment-mask');
 assert.equal(stored[0].recognitionPhoto.image,'original-crop');
});

test('real-photo-style fragmented outfit proposals stay review-only despite strong labels and color',async()=>{
 const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,30],aspect:1,
  colorEstimate:{color:'White'}}),result:{strong:true,choices:[choice],details:{color:'Red'}}});
 c.candidate('mixed-blazer-skirt',{outfitSourceId:'person-photo',
  recognitionPhoto:{image:'original-rgb'},originalPhoto:{image:'full-original'},
  segmentHint:{categories:['Tops'],types:[],clipped:false,
   displayFallback:'original-crop',displayFallbackReason:'fragmented-mask'},
  colorEstimate:{color:'Blue'}});
 await done(c);
 assert.equal(stored.length,0);
 assert.equal(c.items.length,0);
 assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].originalPhoto.image,'full-original');
 assert.equal(c.batch[0].recognitionPhoto.image,'original-rgb');
 assert.match(c.batch[0].localStatus,/multiple garments or background/);
});

test('all unreliable source-only fallback reasons block strong recognition and proposed color',async()=>{
 for(const reason of ['fragmented-mask','unexplained-enclosed-gap','clipped-frame','insufficient-mask']){
  const {c,stored}=setup({quality:async()=>({blank:false,signature:[1,2,3],aspect:1,
   colorEstimate:{color:'White'}}),result:{strong:true,choices:[choice],details:{color:'Red'}}});
  c.candidate('unmasked-'+reason,{outfitSourceId:'outfit',
   recognitionPhoto:{image:'original-rgb'},originalPhoto:{image:'untouched-outfit'},
   colorEstimate:{color:'Blue'},segmentHint:{categories:['Tops'],types:[],clipped:false,
    displayFallback:'original-crop',displayFallbackReason:reason}});
  await done(c);
  assert.equal(stored.length,0,reason);
  assert.equal(c.batch.length,1);
  assert.equal(c.batch[0].originalPhoto.image,'untouched-outfit');
  assert.equal(c.batch[0].recognitionPhoto.image,'original-rgb');
  assert.match(c.batch[0].localStatus,/multiple garments or background/);
 }
});

test('distinct top and trousers in the same original outfit are not blocked by background-driven lookalike signatures',async()=>{
 const same=async()=>({blank:false,signature:[90,100,110],aspect:1});
 const top={label:'a T-shirt',category:'Tops',itemType:'T-shirt',sleeveLength:'Unknown'};
 const pants={label:'trousers',category:'Bottoms',itemType:'Trousers',sleeveLength:'Unknown'};
 const {c,stored}=setup({quality:same,request:async(type,image)=>({
  strong:true,choices:[image.endsWith('whole-top')?top:pants],details:{color:'Blue'}
 })});
 const originalPhoto={image:'data:image/jpeg;base64,SAMEUNTOUCHED'};
 c.candidate('whole-top',{outfitSourceId:'outfit-original-1',originalPhoto,
  cropBounds:{x:.2,y:.08,width:.48,height:.32},
  segmentHint:{categories:['Tops'],types:[],clipped:false}});
 c.candidate('whole-bottom',{outfitSourceId:'outfit-original-1',originalPhoto,
  cropBounds:{x:.23,y:.48,width:.40,height:.38},
  segmentHint:{categories:['Bottoms'],types:[],clipped:false}});
 await done(c);
 assert.equal(stored.length,2,'distinct source garment regions can both auto-index');
 assert.equal(c.batch.length,0);
 assert.deepEqual(c.items.map(i=>i.category),['Tops','Bottoms']);
});
test('same-photo same-category, overlapping, unmasked or unverifiable regions keep duplicate review',async()=>{
 const base={outfitSourceId:'outfit-one',
  originalPhoto:{image:'data:image/jpeg;base64,ORIGINAL'},
  cropBounds:{x:.1,y:.1,width:.3,height:.3},
  segmentHint:{categories:['Tops'],types:[],clipped:false}};
 for(const variant of [
  {cropBounds:{x:.65,y:.65,width:.2,height:.2},segmentHint:base.segmentHint},
  {cropBounds:base.cropBounds,segmentHint:{categories:['Bottoms'],types:[],clipped:false}},
  {cropBounds:{x:.65,y:.65,width:.2,height:.2},
    segmentHint:{categories:['Bottoms'],types:[],displayFallback:'original-crop'}},
  {cropBounds:{x:.65,y:.65,width:.2,height:.2},
    segmentHint:{categories:['Bottoms'],types:[],clipped:true}},
  {cropBounds:{x:.65,y:.65,width:.2,height:.2},segmentHint:{categories:['Bottoms'],types:[]},
    originalPhoto:{image:'data:image/jpeg;base64,DIFFERENT'}},
  {cropBounds:undefined,segmentHint:{categories:['Bottoms'],types:[]}}
 ]){
  const {c,stored}=setup({quality:async()=>({blank:false,signature:[10,20,30],aspect:1}),
   request:async(type,image)=>({strong:true,choices:[image.endsWith('first')?
     {label:'shirt',category:'Tops',itemType:'T-shirt',sleeveLength:'Unknown'}:
     {label:'trousers',category:'Bottoms',itemType:'Trousers',sleeveLength:'Unknown'}],
     details:{color:'Blue'}})});
  c.candidate('first',base);await done(c);
  c.candidate('second',{...base,...variant});await done(c);
  assert.equal(stored.length,1,'uncertain lookalikes must not silently auto-save');
  assert.equal(c.batch.length,1);
  assert.equal(c.batch[0].possibleDuplicate,true);
 }
});
