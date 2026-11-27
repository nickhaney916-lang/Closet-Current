import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine,baseline,candidate]=process.argv.slice(2);
assert.ok(['chromium','webkit'].includes(engine));
async function scheduler(path){
 const source=await readFile(path,'utf8');
 const start=source.indexOf('let memoryReviewTimer=null'),end=source.indexOf('function pauseCameraOnInterruption');
 assert.ok(start>=0&&end>start);
 return source.slice(start,end);
}
function fixture({source,size}){
 const setup=new Function('size',`const listeners={},tasks=new Map();let arms=0,seq=0,scans=0;
 const document={hidden:false,addEventListener:(n,f)=>listeners[n]=f,querySelector:()=>null};
 const setTimeout=f=>{tasks.set(++seq,f);arms++;return seq};const clearTimeout=id=>tasks.delete(id);
 const ClothingMemory={week:()=>{scans++;return 'week'},valid:x=>!!x};
 const captureOperationEpoch=1,db={name:'closet-current-user-a'},window={closetAuth:{user:{id:'a'}}},closetReady={then(){}};
 const items=Array.from({length:size},(_,i)=>({id:i,recognitionMemory:{},learningReviewedWeek:'week'})),busy=false,automaticRunning=false,localPending=new Map();
 `+source+`return {scheduleMemoryReview,hide(){document.hidden=true;listeners.visibilitychange()},show(){document.hidden=false;listeners.visibilitychange()},count:()=>tasks.size,arms:()=>arms,scans:()=>scans,drain(){for(const [id,f] of [...tasks]){tasks.delete(id);f()}}};`);
 const h=setup(size);
 h.scheduleMemoryReview();h.scheduleMemoryReview();const initial=h.count();
 h.hide();const pending=h.count();h.drain();const start=h.arms();
 for(let i=0;i<10;i++){h.scheduleMemoryReview();h.drain()}
 const hiddenArms=h.arms()-start;const hiddenScans=h.scans();
 h.show();h.scheduleMemoryReview();const resumed=h.count();h.drain();
 return {initial,pending,hiddenArms,hiddenScans,resumed,foregroundScans:h.scans(),final:h.count()};
}
const before=await scheduler(baseline),after=await scheduler(candidate);
const browser=await {chromium,webkit}[engine].launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:800}});
  try{
   for(const size of [25,100,250,500]){
    const red=await page.evaluate(fixture,{source:before,size}),green=await page.evaluate(fixture,{source:after,size});
    assert.deepEqual(red,{initial:1,pending:1,hiddenArms:10,hiddenScans:0,resumed:1,foregroundScans:1,final:0});
    assert.deepEqual(green,{initial:1,pending:0,hiddenArms:0,hiddenScans:0,resumed:1,foregroundScans:1,final:0});
    console.log('MEMORY_VISIBILITY_RED_GREEN',engine,width,size,JSON.stringify({red,green}));
   }
  }finally{await page.close()}
 }
}finally{await browser.close()}
