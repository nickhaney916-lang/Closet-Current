import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8');
const a=app.indexOf('async function styleJustReviewedPhoto122('),b=app.indexOf('// The visible photo-retry callback',a);
assert.ok(a>=0&&b>a);
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<div id="authGate" hidden></div><main id="appShell"></main>');
  await page.evaluate(()=>{
   const owner='A',sha='a'.repeat(64),tracked={id:'one',ownerId:owner,sourceSHA256:sha,sourceHashVerified:true,ownerReviewed:true,userAdjusted:true,category:'Tops',itemType:'T-shirt',color:'Blue',image:'fixture',originalPhoto:{sha256:sha,image:'fixture'}};
   Object.assign(window,{captureOperationEpoch:0,items:[tracked],batch:[],sessionCapturedIds:new Set(['one']),reviewedStyle122Active:true,reviewedCloset123Active:true,reviewedCutout124Active:true,events:[],pending:[],finished:[],sha});
   window.db={name:'closet-current-user-A',transaction(){return {objectStore(){return {get(){const q={result:tracked};Promise.resolve().then(()=>q.onsuccess());return q;}};}};}};
   window.closetAuth={user:{id:owner},assertCurrent(){}};
   window.$=id=>document.getElementById(id);
   window.nativeIndex07Refresh=async()=>{};
   window.switchView=()=>events.push('switch-view');
   window.message=()=>{};
   window.makePanel=()=>({selectGarment:()=>new Promise(resolve=>{events.push('select');pending.push(resolve);}),generate:()=>new Promise(resolve=>{events.push('generate');pending.push(()=>resolve({combinations:[{pinnedId:'one'}]}));}),status:()=>({pinnedId:'one',sourceSHA256Verified:true})});
   window.start=()=>{const p=styleJustReviewedPhoto122('one',sha);p.then(()=>finished.push('success'),()=>finished.push('rejected'));};
  });
  await page.addScriptTag({content:app.slice(a,b)});
  for(const phase of ['select','generate','epoch']){
   await page.evaluate(()=>{events.length=0;pending.length=0;finished.length=0;styleOwnedLive03Bridge=makePanel();start();});
   await page.waitForFunction(()=>pending.length===1);
   if(phase==='generate'){
    await page.evaluate(()=>pending[0]());
    await page.waitForFunction(()=>pending.length===2);
   }
   await page.evaluate(phase=>{if(phase==='epoch')captureOperationEpoch++;else styleOwnedLive03Bridge=makePanel();pending.at(-1)();},phase);
   if(mode==='baseline'){
    if(phase!=='generate'){await page.waitForFunction(()=>pending.length===2);await page.evaluate(()=>pending[1]());}
    await page.waitForFunction(()=>finished.length===1);
    assert.deepEqual(await page.evaluate(()=>finished),['success']);
    assert.ok(await page.evaluate(()=>events.includes('switch-view')));
    console.log('REVIEWED_STYLE_HANDOFF_RED',engine,width,phase);
   }else{
    await page.waitForFunction(()=>finished.length===1);
    assert.deepEqual(await page.evaluate(()=>finished),['rejected']);
    assert.equal(await page.evaluate(()=>events.includes('switch-view')),false);
    assert.equal(await page.evaluate(()=>events.includes('generate')),phase==='generate');
    console.log('REVIEWED_STYLE_HANDOFF_GREEN',engine,width,phase);
   }
  }
  await page.evaluate(()=>{events.length=0;pending.length=0;finished.length=0;styleOwnedLive03Bridge=makePanel();start();});
  await page.waitForFunction(()=>pending.length===1);
  await page.evaluate(()=>pending[0]());
  await page.waitForFunction(()=>pending.length===2);
  await page.evaluate(()=>pending[1]());
  await page.waitForFunction(()=>finished.length===1);
  assert.deepEqual(await page.evaluate(()=>finished),['success']);
  assert.equal(await page.evaluate(()=>items[0].originalPhoto.image),'fixture');
  await page.close();
 }
}finally{await browser.close();}
