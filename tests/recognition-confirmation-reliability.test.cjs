'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.RECOGNITION_APP_SOURCE||'public/app.js','utf8');
function setup(result){
 const stored=[],state={items:[],batch:[],localPending:new Set(),localReady:true,localLoadPromise:null,
  recognitionUnavailable:false,recognitionState:{phase:'idle'},localBatch:false,
  categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  structuredClone,Date,globalThis:null,render(){},renderRecognitionNotice(){},scheduleMemoryReview(){},persistDraft(){},$:()=>({}),
  checkPhoto:async()=>({blank:false,signature:[2,4,6],aspect:1}),similarPhotos:()=>false,
  localRequest:async()=>result,queued:fn=>fn(),
  db:{name:'closet-current-user-a',transaction(){const tx={objectStore:name=>({put:v=>{if(name==='items')stored.push(v);}})};setImmediate(()=>tx.oncomplete?.());return tx;}},
  window:{closetAuth:{user:{id:'a'}}}};
 state.globalThis=state;vm.createContext(state);
 for(const path of ['public/taxonomy.js','public/clothing-details.js'])vm.runInContext(fs.readFileSync(path,'utf8'),state);
 state.ClothingDetails=state.window.ClothingDetails;
 vm.runInContext(source.slice(source.indexOf('function recognitionSourcePhoto('),source.indexOf('function clothingFields(')),state);
 // Include the same transient quick-color evidence helpers as the browser;
 // a standalone function excerpt must not silently replace them with mocks.
 vm.runInContext(source.slice(source.indexOf('const verifiedColorAdmission=new WeakMap();'),source.indexOf('// Saving is transactional')),state);
 vm.runInContext(source.slice(source.indexOf('function trustedAutomaticPhotoColor('),source.indexOf('function queueAutomatic(')),state);
 vm.runInContext(source.slice(source.indexOf('async function enableLocal('),source.indexOf('async function importClothingPhotos(')),state);
 vm.runInContext(source.slice(source.indexOf('function canConfirmReviewedColor('),source.indexOf('function renderPhotoResults(')),state);
 state.exactlyRepeatedCapturedItem=()=>false;state.independentlyDistinctOutfitRegions=()=>false;
 const item=state.normalizeClothing({id:'piece',name:'',image:'data:image/jpeg;base64,ORIGINAL',category:'Uncategorized',color:'Blue'});state.batch.push(item);
 return {state,item,stored};
}
const choice=(category,itemType)=>({category,itemType,label:'a '+itemType,sleeveLength:'Unknown',score:.9});
for(const [oldCategory,oldType,newCategory,newType] of [
 ['Shoes','Sneakers','Shoes','Ankle boots'],['Shoes','Tall boots','Shoes','Sneakers'],
 ['Dresses','Casual dress','Bottoms','Skirt'],['Bottoms','Skirt','Dresses','Casual dress'],
 ['Bottoms','Shorts','Bottoms','Skirt'],['Bottoms','Skirt','Bottoms','Shorts'],
 ['Tops','Button-down shirt','Outerwear','Jacket'],['Outerwear','Jacket','Outerwear','Coat']
])test('inferred '+oldType+' versus new '+newType+' needs garment confirmation, not an old-type autosave',async()=>{
 const h=setup({strong:true,choices:[choice(newCategory,newType)],details:{color:'Red'}});
 Object.assign(h.item,{category:oldCategory,itemType:oldType,color:''});
 await h.state.recognizeItem(h.item);
 assert.equal(h.stored.length,0);assert.equal(h.item.category,oldCategory);assert.equal(h.item.itemType,oldType);
 assert.equal(h.item.recognitionReviewRequired,true);assert.equal(h.state.canConfirmReviewedColor(h.item),false);
 assert.match(h.item.localStatus,/Confirm the garment in Adjust/);
});
test('uncertain retry cannot reuse old category through color-only save; later valid retry can recover',async()=>{
 const h=setup({strong:false,reason:'views_disagree',choices:[]});
 Object.assign(h.item,{category:'Shoes',itemType:'Sneakers',color:''});
 await h.state.recognizeItem(h.item);
 assert.equal(h.state.canConfirmReviewedColor(h.item),false);
 assert.equal(await h.state.confirmReviewedColor(h.item,'Brown'),false);assert.equal(h.stored.length,0);
 h.state.localRequest=async()=>({strong:true,choices:[choice('Shoes','Sneakers')],details:{color:'Blue'}});
 await h.state.recognizeItem(h.item);assert.equal(h.stored.length,1);assert.equal(h.stored[0].itemType,'Sneakers');
 assert.equal(h.stored[0].image,'data:image/jpeg;base64,ORIGINAL');
});
test('failed recognition retains original and blocks stale quick save until retry',async()=>{
 const h=setup();Object.assign(h.item,{category:'Bottoms',itemType:'Shorts',color:''});
 h.state.localRequest=async()=>{throw Error('Recognition timed out. Your photos are kept.');};
 await h.state.recognizeItem(h.item);
 assert.equal(h.item.scanFailed,true);assert.equal(h.item.recognitionReviewRequired,true);
 assert.equal(h.stored.length,0);assert.equal(h.state.canConfirmReviewedColor(h.item),false);
 assert.equal(h.item.image,'data:image/jpeg;base64,ORIGINAL');
});
test('new valid strong inference still autosaves type and color using original full-frame pixels',async()=>{
 const h=setup({strong:true,choices:[choice('Shoes','Sneakers')],details:{color:'Multicolor'}});h.item.color='';
 let input;h.state.localRequest=async(_,photo)=>{input=photo;return {strong:true,choices:[choice('Shoes','Sneakers')],details:{color:'Multicolor'}};};
 await h.state.recognizeItem(h.item);assert.equal(h.stored.length,1);assert.equal(h.stored[0].color,'Multicolor');
 assert.equal(h.stored[0].itemType,'Sneakers');assert.equal(input,h.item.image);
});
test('late model result cannot cross account or IndexedDB identity',async()=>{
 for(const swap of [s=>{s.window.closetAuth.user.id='b';},s=>{s.db={...s.db,name:'closet-current-user-b'};}]){
  const h=setup();h.state.localRequest=async()=>{swap(h.state);return {strong:true,choices:[choice('Shoes','Sneakers')],details:{color:'Blue'}};};
  await h.state.recognizeItem(h.item);assert.equal(h.stored.length,0);assert.equal(h.item.category,'Uncategorized');
 }
});
test('real write queue rejects account changes both before and during cloud preflight',async()=>{
 for(const during of [false,true]){
  const c={writes:Promise.resolve(),db:{name:'closet-current-user-a'},window:{closetAuth:{user:{id:'a'}},closetCloud:{beforeWrite:async()=>{if(during)c.window.closetAuth.user.id='b';}}}};
  vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function queued('),source.indexOf('let db,items=')),c);
  let writes=0;const pending=c.queued(()=>writes++);if(!during)c.window.closetAuth.user.id='b';
  await assert.rejects(pending,/account changed/);assert.equal(writes,0);
 }
});
test('manual correction write rechecks editor identity after waiting in queue',async()=>{
 const h=setup();let current=true;
 vm.runInContext(source.slice(source.indexOf('function savePiece('),source.indexOf('function node(')),h.state);
 h.state.queued=fn=>{current=false;return fn();};
 await assert.rejects(h.state.savePiece({...h.item,itemType:'Ankle boots',color:'Brown'},[],()=>current),/photo or account changed/);
 assert.equal(h.stored.length,0);
});

test('account change while transaction completes cannot publish old results or notify new owner',async()=>{
 let notifications=0,published=0;
 const c={writes:Promise.resolve(),db:{name:'closet-current-user-a'},window:{closetAuth:{user:{id:'a'}},closetCloud:{beforeWrite:async()=>{},changed(){notifications++;}}}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function queued('),source.indexOf('let db,items=')),c);
 await assert.rejects(c.queued(async()=>{await Promise.resolve();c.window.closetAuth.user.id='b';return 'old-owner-result';}).then(()=>published++),/account changed/);
 assert.equal(published,0);assert.equal(notifications,0);
 c.window.closetAuth.user.id='a';assert.equal(await c.queued(async()=> 'recovered'),'recovered');
});
