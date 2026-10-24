const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
function setup(){
 function node(tag,text){return {tag,text:text||'',children:[],setAttribute(){},append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;}};}
 const c={window:{closetAuth:{user:{id:'synthetic-owner-A'}}},db:{},recognitionState:{phase:'idle',percent:null,activeId:null},node,items:[],batch:[],categories:['Tops','Dresses'],ClothingDetails:{colors:['Black','Blue','Red'],validColor:v=>['Black','Blue','Red'].includes(v)},localPending:new Set(),localReady:true,adjustPhoto(item){c.adjusted=item;},cropClothingPhoto(item){c.cropped=item;}};
 vm.createContext(c);
 // Render and inline quick-save now share the production original-RGB guard.
 // Slice that helper into this small DOM harness rather than replacing it
 // with a permissive fake that would obscure a missing-original regression.
 vm.runInContext(source.slice(source.indexOf('function recognitionSourcePhoto('),source.indexOf('function clothingFields(')),c);
 vm.runInContext(source.slice(source.indexOf('function cropButton('),source.indexOf('function adjustPhoto(')),c);
 vm.runInContext(source.slice(source.indexOf('const verifiedColorAdmission=new WeakMap();'),source.indexOf('// Saving is transactional')),c);
 vm.runInContext(source.slice(source.indexOf('function canConfirmReviewedColor('),source.indexOf('function renderPhotoResults(')),c);
 vm.runInContext(source.slice(source.indexOf('function renderPhotoResults('),source.indexOf('function render(){')),c);
 return {c,grid:node('div')};
}
function descendants(x){return [x,...x.children.flatMap(descendants)];}
test('recognized photo immediately shows its saved category and Adjust and Crop actions',()=>{
 const {c,grid}=setup();const item={id:'shirt',name:'Blue T-shirt',category:'Tops',itemType:'T-shirt',color:'Blue',pattern:'Solid',sleeveLength:'Short sleeve',fit:'Regular',seasons:[]};c.items=[item];
 c.renderPhotoResults(grid,[item]);const nodes=descendants(grid),buttons=nodes.filter(x=>x.tag==='button');assert.equal(buttons.length,3);assert.equal(buttons[0].text,'Style this');assert.equal(buttons[1].text,'Adjust');assert.ok(nodes.some(x=>x.text==='Tops · T-shirt · Blue'));assert.ok(nodes.some(x=>x.text.includes('Solid · Short sleeve')));c.styleNewClosetItem=id=>{c.styled=id;};buttons[0].onclick();assert.equal(c.styled,'shirt');buttons[1].onclick();assert.equal(c.adjusted,item);buttons[2].onclick();assert.equal(c.cropped,item);
});
test('failed recognition keeps the photo and offers correction and crop actions without guessing',()=>{
 const {c,grid}=setup();c.renderPhotoResults(grid,[{id:'unknown',image:'photo',category:'Uncategorized'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Review garment details'));assert.equal(nodes.filter(x=>x.tag==='button').length,2);assert.ok(nodes.some(x=>x.tag==='img'&&x.src==='photo'));
});
test('processing displays its category as soon as the worker identifies it',()=>{
 const {c,grid}=setup();c.localPending.add('shirt');c.renderPhotoResults(grid,[{id:'shirt',category:'Tops',itemType:'T-shirt'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='T-shirt'));assert.ok(nodes.some(x=>x.text==='Tops · T-shirt'));assert.equal(nodes.filter(x=>x.tag==='button').length,2);assert.equal(nodes.find(x=>x.tag==='button').text,'Adjust');
});
test('recognition errors release the job instead of leaving a perpetual spinner',()=>{
 const nodes=new Map();const c={recognitionState:{phase:'idle',percent:null,activeId:null},renderRecognitionNotice(){},recognitionUnavailable:false,localWorker:null,localReady:true,localJobs:new Map(),crypto:{randomUUID:()=> 'job'},recognitionAssetVersion:'',clearTimeout(){},setTimeout(){return 1;},$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},Worker:class{postMessage(){} terminate(){this.stopped=true;}}};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function stopRecognitionWorker('),source.indexOf('async function enableLocal(')),c);
 const result=c.localRequest('classify','photo').catch(e=>e);c.localWorker.onerror();assert.equal(c.localReady,false);assert.equal(c.localJobs.size,0);assert.equal(c.localWorker,null);return result.then(e=>assert.match(e.message,/unavailable/));
});
test('queued photos stay compact and offer Adjust during model setup',()=>{
 const {c,grid}=setup();c.localReady=false;c.localPending.add('waiting');c.renderPhotoResults(grid,[{id:'waiting',category:'Uncategorized',image:'photo'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Waiting…'));assert.ok(!nodes.some(x=>/first use|Preparing recognition/.test(x.text)));assert.equal(nodes.filter(x=>x.tag==='button').length,2);
});
test('a scanner failure is distinguished from a garment that was not recognized',()=>{
 const {c,grid}=setup();c.renderPhotoResults(grid,[{id:'failed',category:'Uncategorized',scanFailed:true}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Scanner unavailable'));assert.ok(!nodes.some(x=>x.text==='Review garment details'));
});

test('storage failure shows Not saved and keeps recognized labels with one Adjust action',()=>{
 const {c,grid}=setup();c.renderPhotoResults(grid,[{id:'unsaved',category:'Tops',itemType:'Polo',color:'Red',saveFailed:true,scanFailed:true}]);
 const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Not saved'));assert.ok(nodes.some(x=>x.text==='Tops · Polo · Red'));assert.equal(nodes.filter(x=>x.tag==='button').length,2);
});

test('saved outfit pieces show their clipped image without an add or selection step',()=>{
 const {c,grid}=setup();const item={id:'ready',image:'auto-clipped-photo',outfitSourceId:'outfit',category:'Tops',itemType:'T-shirt',localAnalyzed:true};c.items=[item];c.renderPhotoResults(grid,[item]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Saved'));assert.ok(nodes.some(x=>x.tag==='img'&&x.src==='auto-clipped-photo'));assert.ok(!nodes.some(x=>x.tag==='input'||x.text==='Ready to add'));
});

test('an unresolved color offers one-choice inline saving without adding tabs',async()=>{
 const {c,grid}=setup(),item={id:'shirt',image:'photo',category:'Tops',itemType:'T-shirt',color:'',localAnalyzed:true,recognitionReviewRequired:true,seasons:[]};
 c.batch=[item];c.admitReviewedColor(item);const selected=[];
 c.confirmReviewedColor=async(input,color)=>{selected.push({input,color});return true;};
 c.renderPhotoResults(grid,[item]);const nodes=descendants(grid),picker=nodes.find(x=>x.tag==='select');
 assert.ok(picker);
 assert.ok(nodes.some(x=>x.text==='Choose color · save'));
 assert.deepEqual(nodes.filter(x=>x.tag==='option').map(x=>x.text),['Choose color to save','Black','Blue','Red']);
 picker.value='Blue';await picker.onchange();
 assert.equal(picker.disabled,true);
 assert.equal(selected.length,1);assert.equal(selected[0].input,item);
 assert.equal(selected[0].color,'Blue');
 assert.equal(nodes.filter(x=>x.tag==='button').length,2);
});
test('processing, already-saved, and duplicate items never show quick color save',()=>{
 const {c,grid}=setup();
 const item={id:'shirt',category:'Tops',itemType:'T-shirt',localAnalyzed:true,color:''};
 for(const variation of [{pending:true},{saved:true},{possibleDuplicate:true},{requiresOwnershipConfirmation:true}]){
  c.batch=[item];c.items=[];c.localPending.clear();
  const one={...item,...variation};
  c.batch=[one];if(variation.pending)c.localPending.add(one.id);if(variation.saved){c.items=[one];c.batch=[];}
  c.renderPhotoResults(grid,[one]);assert.equal(descendants(grid).filter(x=>x.tag==='select').length,0);
 }
});

test('fragmented whole-outfit photo warns against treating a mixed region as a clean garment',()=>{
 const {c,grid}=setup();
 const item={id:'mixed',image:'original-region',category:'Shoes',itemType:'Unknown',
  outfitSourceId:'outfit',segmentHint:{categories:['Shoes'],types:[],clipped:false,
   displayFallback:'original-crop',displayFallbackReason:'fragmented-mask'},
  localAnalyzed:true,color:''};
 c.batch=[item];c.renderPhotoResults(grid,[item]);
 const all=descendants(grid);
 assert.ok(all.some(x=>/Photo region needs review: this cutout/.test(x.text)));
 assert.equal(all.filter(x=>x.tag==='select').length,0,
  'fragmented candidate requires Adjust, not color-only acceptance');
 assert.ok(all.some(x=>x.tag==='button'&&x.text==='Adjust'));
});

test('all unreliable outfit original-crop reasons have a human review label',()=>{
 for(const reason of ['unexplained-enclosed-gap','clipped-frame']){
  const {c,grid}=setup(),item={id:'region',image:'source',category:'Tops',
   itemType:'Unknown',outfitSourceId:'capture',localAnalyzed:true,color:'',
   segmentHint:{categories:['Tops'],types:[],clipped:false,
    displayFallback:'original-crop',displayFallbackReason:reason}};
  c.batch=[item];c.renderPhotoResults(grid,[item]);
  assert.ok(descendants(grid).some(x=>/Photo region needs review/.test(x.text)));
  assert.equal(descendants(grid).filter(x=>x.tag==='select').length,0);
 }
});


test('disconnected upper regions require review and warn against double-saving a single shirt',()=>{
 const {c,grid}=setup();
 const item={id:'left-region',image:'source-photo',category:'Tops',itemType:'T-shirt',
  color:'',localAnalyzed:true,outfitSourceId:'outfit-1',
  segmentHint:{clipped:false,categories:['Tops'],types:[],
   displayFallback:'original-crop',displayFallbackReason:'disconnected-upper-regions'}};
 c.batch=[item];c.renderPhotoResults(grid,[item]);
 const nodes=descendants(grid);
 assert.ok(nodes.some(x=>/may be parts of ONE garment/.test(x.text)));
 assert.equal(nodes.filter(x=>x.tag==='select').length,0,'color picker must not bypass review');
 assert.ok(nodes.some(x=>x.tag==='button'&&x.text==='Adjust'));
});
test('layered top/skirt conflict cannot be color-approved or treated as a single automatic dress',()=>{
 const {c,grid}=setup();
 const item={id:'suspected-dress',image:'preserved-source',category:'Dresses',
  itemType:'Unknown',color:'',localAnalyzed:true,outfitSourceId:'outfit-3',
  segmentHint:{clipped:false,categories:['Dresses'],types:[],
   displayFallback:'original-crop',displayFallbackReason:'dress-layer-conflict-review-only'}};
 c.batch=[item];c.renderPhotoResults(grid,[item]);
 const children=descendants(grid);
 assert.ok(children.some(x=>/top or jacket over a skirt, not one dress/.test(x.text)));
 assert.equal(children.filter(x=>x.tag==='select').length,0,
  'color-only approval would incorrectly save two physical garments as one dress');
 assert.ok(children.some(x=>x.tag==='button'&&x.text==='Adjust'));
 assert.ok(children.some(x=>x.tag==='img'&&x.src==='preserved-source'));
});


test('a queued save stores newly approved original-photo metadata, not a stale snapshot',async()=>{
 const js=source.slice(source.indexOf('function segmentationAllows('),source.indexOf('function applyLocalChoice('))+
  '\n'+source.slice(source.indexOf('async function saveIndexed('),source.indexOf('async function recognizeItem('));
 let release,stored=null,transactions=0;
 const item={id:'src-piece',name:'Blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue'};
 const c={batch:[item],items:[],ClothingDetails:{validColor:v=>v==='Blue'||v==='Red'},
  normalizeClothing:x=>x,queued:fn=>new Promise((resolve,reject)=>{
   release=()=>Promise.resolve().then(fn).then(resolve,reject);
  }),db:{transaction(){transactions++;const tx={objectStore(name){return {put(value){if(name==='items')stored=structuredClone(value);}}}};setImmediate(()=>tx.oncomplete?.());return tx;}},
  structuredClone,Date,persistDraft(){},render(){}};
 vm.createContext(c);vm.runInContext(js,c);
 const pending=c.saveIndexed(item,()=>true);
 item.color='Red';item.name='Red shirt';
 release();assert.equal(await pending,true);
 assert.equal(transactions,1);
 assert.equal(stored.color,'Red');
 assert.equal(stored.name,'Red shirt');
 assert.equal(c.items[0].color,'Red');
 assert.equal(c.batch.length,0);
});
test('queued save rejects an original-photo draft whose category or color became unsafe',async()=>{
 const js=source.slice(source.indexOf('function segmentationAllows('),source.indexOf('function applyLocalChoice('))+
  '\n'+source.slice(source.indexOf('async function saveIndexed('),source.indexOf('async function recognizeItem('));
 let release,opened=0;
 const item={id:'src-piece',name:'Blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue'};
 const c={batch:[item],items:[],ClothingDetails:{validColor:v=>v==='Blue'},
  normalizeClothing:x=>x,queued:fn=>new Promise((resolve,reject)=>{
   release=()=>Promise.resolve().then(fn).then(resolve,reject);
  }),db:{transaction(){opened++;throw Error('Invalid draft reached IndexedDB');}},
  structuredClone,Date,persistDraft(){},render(){}};
 vm.createContext(c);vm.runInContext(js,c);
 const pending=c.saveIndexed(item,()=>true);
 item.color='Unknown';release();
 assert.equal(await pending,false);
 assert.equal(opened,0);
 assert.equal(c.items.length,0);
 assert.equal(c.batch[0],item);
});
test('automatic save revalidates a changed garment draft before opening storage',async()=>{
 const js=source.slice(source.indexOf('function segmentationAllows('),source.indexOf('function applyLocalChoice('))+'\n'+source.slice(source.indexOf('async function saveIndexed('),source.indexOf('async function recognizeItem('));
 const c={batch:[],items:[],ClothingDetails:{validColor:v=>v==='Blue'},normalizeClothing:x=>x,queued:fn=>fn(),db:{transaction(){throw Error('Unsafe item reached database');}},structuredClone,Date,persistDraft(){},render(){}};
 vm.createContext(c);vm.runInContext(js,c);
 const base={id:'one',outfitSourceId:'outfit-1',name:'Blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue',segmentHint:{clipped:false,categories:['Tops'],types:['T-shirt']}};
 const stale=structuredClone(base);c.batch=[structuredClone(base)];assert.equal(await c.saveIndexed(stale,()=>true),false,'superseded draft with same id must not save');
 for(const mutate of [
  x=>x.segmentHint.clipped=true,
  x=>x.segmentHint.displayFallback='original-crop',
  x=>x.segmentHint.categories=['Bottoms'],
  x=>x.segmentHint.types=['Sweater'],
  x=>x.possibleDuplicate=true,
  x=>x.category='Uncategorized',
  x=>x.color='',
  x=>x.scanFailed=true
 ]){
  const item=structuredClone(base);mutate(item);c.batch=[item];
  assert.equal(await c.saveIndexed(item,()=>true),false,'invalid changed draft must not write');
 }
});

test('queued auto-save requires a verified current-original source callback',async()=>{
 const js=source.slice(source.indexOf('function segmentationAllows('),source.indexOf('function applyLocalChoice('))+
  '\n'+source.slice(source.indexOf('async function saveIndexed('),source.indexOf('async function recognizeItem('));
 let txCount=0;
 const item={id:'confirmed',image:'source-photo',name:'Blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue'};
 const c={batch:[item],items:[],ClothingDetails:{validColor:v=>v==='Blue'},normalizeClothing:x=>x,
  queued:fn=>fn(),db:{transaction(){txCount++;throw Error('No unverified save permitted');}},
  structuredClone,Date,persistDraft(){},render(){}};
 vm.createContext(c);vm.runInContext(js,c);
 assert.equal(await c.saveIndexed(item),false,'missing callback is not proof of the recognized photo');
 assert.equal(await c.saveIndexed(item,()=>false),false,'changed source is not approved');
 assert.equal(txCount,0,'both unsafe paths must stop before opening storage');
});
