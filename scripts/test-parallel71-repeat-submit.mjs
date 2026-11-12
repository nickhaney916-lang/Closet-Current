/**
 * Parallel #71 real Chromium/WebKit DOM test: execute the actual app Adjust
 * source. Every photo is synthetic and no model, account, or cloud is touched.
 * 'parent' MUST expose two writes; 'candidate' MUST reject re-entrant writes.
 */
import { chromium, webkit } from 'playwright';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const parent='899f1962d53546ec15ff62e8af3a1bcbf937dbdb';
const mode=process.argv[2]||'candidate';
if(!['parent','candidate'].includes(mode))throw Error('Mode must be parent/candidate');
const app=mode==='parent'
 ?execFileSync('git',['show',parent+':public/app.js'],{encoding:'utf8'})
 :await readFile('public/app.js','utf8');
const taxonomy=await readFile('public/taxonomy.js','utf8');
const details=await readFile('public/clothing-details.js','utf8');
const section=(a,b)=>{
 const i=app.indexOf(a),j=app.indexOf(b,i+1);
 if(i<0||j<=i)throw Error('ACTUAL_SOURCE_SECTION_MISSING '+a);
 return app.slice(i,j);
};
const source=section('function node(', 'function cropClothingPhoto(')+
 section('function adjustPhoto(', 'function renderRecognitionNotice(');
const harness=[
"const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];",
"let items=[],batch=[],stream=null,cameraOpening=false;",
"const localPending=new Set(),sessionCapturedIds=new Set();",
"window.savedCount=0;window.finishedCount=0;window.completeSaves=[];",
"const checkPhoto=async()=>({colorEstimate:null});",
"const savePiece=async()=>{window.savedCount++;await new Promise(resolve=>window.completeSaves.push(resolve));window.finishedCount++;};",
"const removeItem=async()=>{};",
"const persistDraft=async()=>{};",
"const render=()=>{};",
"const scheduleMemoryReview=()=>{};",
"const stopCamera=()=>{};",
"const queueAutomatic=()=>{};",
"const message=text=>{window.lastMessage=text;};",
"function parallel71Fixture(){",
"const value={id:'synthetic-one',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==',",
"name:'Synthetic reviewed top',category:'Tops',itemType:'T-shirt',color:'Blue',",
"colorSource:'photo-estimate',pattern:'Unknown',sleeveLength:'Unknown',fit:'Unknown',seasons:[],userAdjusted:false};",
"batch=[value];items=[];window.savedCount=0;window.finishedCount=0;window.completeSaves=[];window.lastMessage='';",
"adjustPhoto(value);",
"}"
].join('\n');
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('http://parallel71.test/**',route=>route.fulfill({
    status:200,contentType:'text/html',body:'<!doctype html><html><body><main id="root"></main></body></html>'
   }));
   await page.goto('http://parallel71.test/?recognitionAcceptance71=1');
   for(const script of [taxonomy,details,harness,source])await page.addScriptTag({content:script});
   await page.evaluate(()=>parallel71Fixture());
   const checkbox=page.getByRole('checkbox',{name:/I checked the clothing photo/});
   assert.equal(await checkbox.count(),1);
   await checkbox.check();
   assert.equal(await page.getByRole('button',{name:'Save changes'}).isEnabled(),true);
   await page.locator('dialog form').evaluate(form=>{
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   });
   const attempted=await page.evaluate(()=>window.savedCount);
   assert.equal(attempted,mode==='parent'?2:1,
    'real submit handler must demonstrate baseline exposure and candidate containment');
   await page.evaluate(()=>window.completeSaves.splice(0).forEach(resolve=>resolve()));
   await page.waitForFunction(n=>window.finishedCount===n,mode==='parent'?2:1);
   assert.deepEqual(errors,[],'no actual browser exceptions');
   console.log('PARALLEL71_REENTRANT_SOURCE_DOM',JSON.stringify({
    mode,name,width,attemptedWrites:attempted,expected:mode==='parent'?2:1,
    syntheticFixture:true,actualAppSource:true,physicalDevice:false,modelInference:false
   }));
   await page.close();
  }
 }finally{await browser.close();}
}
