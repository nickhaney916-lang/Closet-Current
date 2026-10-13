const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{randomUUID}=require('node:crypto');
const source=fs.readFileSync('public/app.js','utf8');
const choice={label:'a T-shirt',category:'Tops',itemType:'T-shirt',sleeveLength:'Unknown'};
function setup({result={strong:true,choices:[choice],details:{color:'Blue',pattern:'Solid'}},quality,request}={}){
 const stored=[],elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 const c={recognitionState:{phase:'idle',percent:null,activeId:null},renderRecognitionNotice(){},sessionCapturedIds:new Set(),items:[],batch:[],session:0,localPending:new Set(),automaticQueue:[],automaticRunning:false,localReady:true,localLoadPromise:null,recognitionUnavailable:false,localBatch:false,crypto:{randomUUID},Date,structuredClone,$:el,render(){},persistDraft(){},message(text){c.messageText=text;},checkPhoto:quality||(async(image)=>({blank:false,signature:[image.charCodeAt(0),100,200],aspect:1})),similarPhotos:(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join()===b.join(),localRequest:request||(async()=>result),queued:work=>work(),db:{transaction(){const tx={objectStore:name=>({put(value){if(name==='items')stored.push(value);}})};setImmediate(()=>tx.oncomplete?.());return tx;}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/taxonomy.js','utf8'),c);
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
 assert.equal(stored.length,0);assert.equal(c.batch[0].category,'Uncategorized');assert.equal(c.batch[0].color,'');assert.match(c.batch[0].localStatus,/Not identified confidently/);
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
 c.localRequest=async()=>({strong:true,choices:[choice],details:{}});await c.recognizeBatch();await done(c);assert.equal(c.items.length,2);
});
test('photo checks reject uniform frames and preserve visible structure',()=>{
 const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('public/photo-check.js','utf8'),c);
 const flat=Array.from({length:256},()=>[255,255,255,255]).flat();assert.equal(c.photoQuality(flat).blank,true);
 const patterned=Array.from({length:256},(_,i)=>[i%2?0:255,100,100,255]).flat();assert.equal(c.photoQuality(patterned).blank,false);
 assert.equal(c.similarPhotos([10,20,30],[10,21,30]),true);assert.equal(c.similarPhotos([10,20,30],[200,200,200]),false);
});
