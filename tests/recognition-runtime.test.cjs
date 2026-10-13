const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
function setup(){
 let now=0,next=0;const timers=new Map();
 const c={localWorker:null,localReady:false,recognitionUnavailable:false,recognitionAssetVersion:'test',localJobs:new Map(),recognitionState:{phase:'loading',percent:null,activeId:null},crypto:{randomUUID:()=> 'job-'+(++next)},Date:{now:()=>now},renderRecognitionNotice(){c.renders=(c.renders||0)+1;},setTimeout(fn,delay){const id=++next;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},Worker:class{postMessage(msg){this.sent=msg;}terminate(){this.stopped=true;}}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function stopRecognitionWorker('),source.indexOf('async function enableLocal(')),c);
 return {c,timers,advance(ms){now+=ms;},fire(){const timer=[...timers.values()][0];timers.clear();timer.fn();}};
}
test('a setup stall releases its job and stops its worker after one minute without progress',async()=>{
 const {c,timers,fire}=setup(),p=c.localRequest('load').catch(e=>e),worker=c.localWorker;assert.equal([...timers.values()][0].delay,60000);fire();assert.match((await p).message,/timed out/);assert.equal(c.localJobs.size,0);assert.equal(worker.stopped,true);assert.equal(c.recognitionState.phase,'failed');
});
test('download progress keeps a live download running and shows a monotonic percentage',async()=>{
 const {c,timers,advance}=setup(),p=c.localRequest('load');advance(55000);c.localWorker.onmessage({data:{type:'progress',stage:'weights',percent:42}});assert.equal(c.recognitionState.percent,42);assert.equal([...timers.values()][0].delay,60000);c.localWorker.onmessage({data:{type:'progress',stage:'runtime',percent:null}});assert.equal(c.recognitionState.percent,42);const id=c.localWorker.sent.id;c.localWorker.onmessage({data:{type:'ready',id}});await p;assert.equal(timers.size,0);
});
test('progress cannot extend model setup beyond its five-minute total limit',async()=>{
 const {c,timers,advance,fire}=setup(),p=c.localRequest('load').catch(e=>e);advance(299000);c.localWorker.onmessage({data:{type:'progress',stage:'weights',percent:98}});assert.equal([...timers.values()][0].delay,1000);fire();assert.match((await p).message,/timed out/);
});
test('classification has a bounded one-minute timeout and preserves the queue for retry',async()=>{
 const {c,timers,fire}=setup();c.localReady=true;const p=c.localRequest('classify','photo','piece').catch(e=>e);assert.equal([...timers.values()][0].delay,60000);fire();assert.match((await p).message,/photos are kept/);assert.equal(c.localReady,false);
});
test('one setup banner displays progress and exposes a retry after failure',()=>{
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',removeAttribute(){}});return nodes.get(id);};
 const c={$:get,batch:[{id:'one'},{id:'two'}],localPending:new Set(['one','two']),recognitionState:{phase:'loading',percent:42}};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function renderRecognitionNotice('),source.indexOf('function renderPhotoResults(')),c);
 c.renderRecognitionNotice();assert.equal(get('recognitionLabel').textContent,'Downloading scanner · 42%');assert.equal(get('recognitionProgress').value,42);assert.equal(get('retryRecognition').hidden,true);
 c.recognitionState.phase='failed';c.localPending.clear();c.renderRecognitionNotice();assert.equal(get('retryRecognition').hidden,false);assert.match(get('recognitionHint').textContent,/photos are kept/);
 c.recognitionState.phase='save-failed';c.renderRecognitionNotice();assert.equal(get('recognitionLabel').textContent,'Couldn’t save this piece');assert.match(get('recognitionHint').textContent,/Keep this page open/);assert.equal(get('retryRecognition').hidden,false);
});
