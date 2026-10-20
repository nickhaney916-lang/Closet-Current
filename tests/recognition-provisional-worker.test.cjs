const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');

const source=fs.readFileSync('public/app.js','utf8');
const choice={label:'a T-shirt',category:'Tops',itemType:'T-shirt',sleeveLength:'Unknown'};
function setup(){
 const stored=[],workers=[],elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 class WorkerStub {
  constructor(){this.messages=[];this.terminated=false;workers.push(this);}
  postMessage(request){this.messages.push(request);}
  terminate(){this.terminated=true;}
  emit(data){this.onmessage?.({data});}
 }
 const c={scheduleMemoryReview(){},recognitionState:{phase:'idle',percent:null,activeId:null},
  renderRecognitionNotice(){},sessionCapturedIds:new Set(),items:[],batch:[],session:0,
  localPending:new Set(),automaticQueue:[],automaticRunning:false,localReady:true,
  localLoadPromise:null,recognitionUnavailable:false,localBatch:false,recognitionAssetVersion:'',
  localWorker:null,localJobs:new Map(),Worker:WorkerStub,
  crypto:{randomUUID},Date,structuredClone,setTimeout,clearTimeout,$:el,render(){},
  persistDraft(){},message(text){c.messageText=text;},
  recordDeviceEvent(){},
  checkPhoto:async image=>({blank:false,signature:[3,5,7],aspect:1,colorEstimate:{color:'Blue'}}),
  similarPhotos:()=>false,queued:work=>work(),
  db:{transaction(){const tx={objectStore:name=>({put(value){if(name==='items')stored.push(value);}})};
    setImmediate(()=>tx.oncomplete?.());return tx;}}};
 vm.createContext(c);
 vm.runInContext(fs.readFileSync('public/taxonomy.js','utf8'),c);
 vm.runInContext(fs.readFileSync('public/clothing-details.js','utf8'),c);
 vm.runInContext(source.slice(source.indexOf('function exactlyRepeatedCapturedItem('),
  source.indexOf('function stopCamera(')),c);
 vm.runInContext(source.slice(source.indexOf('function recognitionSourcePhoto('),
  source.indexOf('function clothingFields(')),c);
 // Use the real production localRequest / worker message bridge. This is
 // essential: other indexing tests stub localRequest and miss early messages.
 vm.runInContext(source.slice(source.indexOf('function stopRecognitionWorker('),
  source.indexOf('async function enableLocal(')),c);
 vm.runInContext(source.slice(source.indexOf('async function enableLocal('),
  source.indexOf('async function importClothingPhotos(')),c);
 return {c,workers,stored};
}
async function requestFor(workers){
 for(let i=0;i<40;i++){
  const request=workers[0]?.messages.find(x=>x.type==='classify');
  if(request)return {worker:workers[0],request};
  await new Promise(setImmediate);
 }
 throw Error('Production auto-index queue did not request classification');
}
async function done(c){
 for(let i=0;i<60&&(c.automaticRunning||c.localPending.size);i++)await new Promise(setImmediate);
 assert.equal(c.automaticRunning,false);
}
test('early identified guess never changes category before the final verified recognition result',async()=>{
 const {c,workers,stored}=setup();
 c.candidate('data:image/jpeg;base64,ORIGINALPHOTO');
 const {worker,request}=await requestFor(workers);
 const pending=c.batch[0];
 assert.equal(request.image,'data:image/jpeg;base64,ORIGINALPHOTO');
 assert.equal(pending.category,'Uncategorized');
 worker.emit({type:'identified',id:request.id,choice});
 assert.equal(pending.category,'Uncategorized','do not commit category before final source check');
 assert.equal(pending.itemType,'Unknown','do not commit subtype before final source check');
 assert.equal(stored.length,0,'unverified candidate cannot auto-save');
 worker.emit({type:'result',id:request.id,strong:true,choices:[choice],
  details:{color:'Blue',pattern:'Solid'}});
 await done(c);
 assert.equal(stored.length,1,'valid final response should still index the original photo');
 assert.equal(stored[0].category,'Tops');
 assert.equal(stored[0].color,'Blue');
 assert.equal(c.items.length,1);
 assert.equal(workers[0].terminated,false);
});
test('an early worker candidate for changed RGB must not overwrite new photo or save old classification',async()=>{
 const {c,workers,stored}=setup();
 c.candidate('data:image/jpeg;base64,ORIGINALPHOTO');
 const {worker,request}=await requestFor(workers);
 const pending=c.batch[0];
 pending.image='data:image/jpeg;base64,NEWUSERPHOTO';
 worker.emit({type:'identified',id:request.id,choice});
 assert.equal(pending.category,'Uncategorized');
 assert.equal(pending.image,'data:image/jpeg;base64,NEWUSERPHOTO');
 worker.emit({type:'result',id:request.id,strong:true,choices:[choice],details:{color:'Blue'}});
 await done(c);
 assert.equal(stored.length,0,'final response for an old photo cannot save');
 assert.equal(c.items.length,0);
 assert.equal(pending.category,'Uncategorized');
 assert.equal(pending.scanFailed,true);
 assert.match(pending.localStatus,/Photo or category changed/);
});
test('an early worker candidate cannot overwrite an explicit user category correction',async()=>{
 const {c,workers,stored}=setup();
 c.candidate('data:image/jpeg;base64,ORIGINALPHOTO');
 const {worker,request}=await requestFor(workers);
 const pending=c.batch[0];
 pending.userAdjusted=true;
 pending.category='Bottoms';
 pending.itemType='Shorts';
 worker.emit({type:'identified',id:request.id,choice});
 assert.equal(pending.category,'Bottoms');
 assert.equal(pending.itemType,'Shorts');
 worker.emit({type:'result',id:request.id,strong:true,choices:[choice],details:{color:'Blue'}});
 await done(c);
 assert.equal(stored.length,0,'do not auto-index an old scan after a manual category correction');
 assert.equal(pending.category,'Bottoms');
});
