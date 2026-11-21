'use strict';
// Original production HTML and JS in a real browser. Synthetic, ownerless boot
// with a real IndexedDB database and injected write failure. NOT auth acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const [oldArg,newArg]=process.argv.slice(2);
assert.ok(oldArg&&newArg,'Specify baseline dist and corrected dist');
const sources=[{name:'unfixed',dir:path.resolve(oldArg),fixed:false},
               {name:'fixed',dir:path.resolve(newArg),fixed:true}];
const img='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="2" height="2"%3E%3C/svg%3E';
const items=[
 {id:'shirt',name:'Original shirt',category:'Tops',itemType:'T-shirt',image:img},
 {id:'newshirt',name:'New shirt',category:'Tops',itemType:'Blouse',image:img},
 {id:'jacket',name:'Jacket',category:'Outerwear',itemType:'Jacket',image:img}
];
const bootstrap=[
 "'use strict';",
 'window.__SYNTHETIC_OWNERLESS_TEST=true;',
 'let items='+JSON.stringify(items)+';',
 'let db=null;',
 'const closetReady=Promise.resolve();',
 'let suppressClick=false,drag=null;',
 'const $=id=>document.getElementById(id);',
 'function node(tag,value,css){const el=document.createElement(tag);if(value!==undefined&&value!==null)el.textContent=String(value);if(css)el.className=css;return el;}',
 'function queued(handler){return handler();}',
 'function render(){if(typeof renderClosetBrowser==="function")renderClosetBrowser();}',
 'document.querySelector("#authGate").hidden=true;',
 'document.querySelector("#appShell").hidden=false;',
 'document.querySelector("#builder").hidden=false;',
 'document.querySelector("#closet").hidden=false;',
 'document.querySelector("#home").hidden=true;'
].join('\n');
async function serve(directory){
 const server=http.createServer((req,res)=>{
  let file;
  try{
   const url=new URL(req.url,'http://localhost');
   let name=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html';
   if(name.includes('..')||!/^[\w./-]+$/.test(name))throw Error('invalid name');
   file=path.resolve(directory,name);
   if(!file.startsWith(directory+path.sep))throw Error('bad path');
  }catch{res.writeHead(400).end();return;}
  try{
   const data=fs.readFileSync(file),type=file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream';
   res.writeHead(200,{'content-type':type,'cache-control':'no-store'});res.end(data);
  }catch{res.writeHead(404).end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {url:'http://127.0.0.1:'+server.address().port+'/',close:()=>new Promise(resolve=>server.close(resolve))};
}
async function boot(browser,source,url,width){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{
  const req=route.request();
  if(req.resourceType()==='script'||req.url().includes('raw.githubusercontent.com'))return route.abort();
  return route.continue();
 });
 await page.goto(url,{waitUntil:'domcontentloaded'});
 // Do not run original auth / cloud boot; inject synthetic in-memory garments.
 await page.addScriptTag({content:bootstrap});
 await page.evaluate(async()=>{
  const request=indexedDB.open('m4-rollback-acceptance',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('state',{keyPath:'id'});
  const opened=await new Promise((resolve,reject)=>{
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  const state={id:'outfit-board',current:{name:'Test look',slots:{top:'shirt'},ideas:{},layerCount:0,
   occasion:'Casual',season:'Fall',audience:'Women',size:'',budget:0},saved:[]};
  await new Promise((resolve,reject)=>{
   const tx=opened.transaction('state','readwrite');tx.objectStore('state').put(state);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
  window.__nativeTestDB=opened;
  window.__failSave=true;
  db={transaction(name,mode){
   if(mode==='readwrite'&&window.__failSave)throw new DOMException('Injected IndexedDB failure','AbortError');
   return opened.transaction(name,mode);
  }};
 });
 for(const script of ['outfit-board-engine.js','outfit-board.js','closet-browser.js']){
  const original=fs.readFileSync(path.join(source.dir,script),'utf8');
  await page.addScriptTag({content:original});
 }
 await page.evaluate(async()=>outfitBoardReady);
 assert.equal(await page.locator('#boardSlots .board-slot-top').count(),1);
 assert.deepEqual(errors,[],'Unexpected original-script error');
 return {context,page,errors};
}
async function storedTop(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const tx=window.__nativeTestDB.transaction('state','readonly');
  const q=tx.objectStore('state').get('outfit-board');
  q.onsuccess=()=>resolve(q.result?.current?.slots?.top);
  q.onerror=()=>reject(q.error);
 }));
}
const fields=[
 {id:'boardName',key:'name',changed:'Updated but unsaved',old:'Test look'},
 {id:'boardOccasion',key:'occasion',changed:'Work',old:'Casual'},
 {id:'boardSeason',key:'season',changed:'Spring',old:'Fall'},
 {id:'boardAudience',key:'audience',changed:'Men',old:'Women'},
 {id:'boardSize',key:'size',changed:'Large',old:''},
 {id:'boardBudget',key:'budget',changed:'850',old:0}
];
function asValue(field,value){return field.key==='budget'?Number(value):value;}
async function nativeBoard(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const tx=window.__nativeTestDB.transaction('state','readonly');
  const req=tx.objectStore('state').get('outfit-board');
  req.onsuccess=()=>resolve(req.result?.current);
  req.onerror=()=>reject(req.error);
 }));
}
async function changeField(page,field){
 const el=page.locator('#'+field.id);
 await el.evaluate((node,desired)=>{
  node.value=desired;
  node.dispatchEvent(new Event('change',{bubbles:true}));
 },field.changed);
}
async function failedChange(page,field,source){
 await changeField(page,field);
 await page.waitForFunction(()=>
  document.getElementById('boardSaveStatus').textContent.includes('could not be saved'),null,{timeout:12000});
 const expected=asValue(field,source.fixed?field.old:field.changed);
 await page.waitForFunction(([key,want])=>currentBoard[key]===want,[field.key,expected],{timeout:12000});
 const displayed=await page.locator('#'+field.id).inputValue();
 assert.equal(displayed,String(source.fixed?field.old:field.changed),
  'failed save UI must reflect '+source.name+' '+field.id+' expected content');
 assert.equal(await page.evaluate(key=>currentBoard[key],field.key),expected);
 const stored=await nativeBoard(page);
 assert.equal(stored[field.key],field.old,'actual browser IndexedDB must retain prior persisted metadata');
 assert.equal(stored.slots.top,'shirt','original garment reference must not change');
}
async function runEngine(engine,name){
 const browser=await engine.launch({headless:true}),matrix=[];
 try{
  for(const source of sources){
   const server=await serve(source.dir);
   try{
    for(const field of fields){
     const widths=['boardOccasion','boardBudget'].includes(field.id)?[320,390,430]:[390];
     for(const width of widths){
      const {context,page,errors}=await boot(browser,source,server.url,width);
      try{
       await failedChange(page,field,source);
       assert.deepEqual(errors,[],'unexpected source page errors on '+name+' '+field.id);
       matrix.push({browser:name,source:source.name,field:field.key,width,
        case:'rejected write vs native IDB',result:'PASS'});
      }finally{await context.close();}
     }
    }
   }finally{await server.close();}
  }
  const fixed=sources.find(x=>x.fixed),server=await serve(fixed.dir);
  try{
   for(const field of fields){
    const {page,context,errors}=await boot(browser,fixed,server.url,390);
    try{
     await page.evaluate(()=>window.__failSave=false);
     await changeField(page,field);
     await page.waitForFunction(async([key,value])=>{
      const tx=window.__nativeTestDB.transaction('state','readonly');
      const q=tx.objectStore('state').get('outfit-board');
      return await new Promise(resolve=>{
       q.onsuccess=()=>resolve(q.result?.current?.[key]===value);
       q.onerror=()=>resolve(false);
      });
     },[field.key,asValue(field,field.changed)],{timeout:12000});
     assert.equal(await page.evaluate(key=>currentBoard[key],field.key),asValue(field,field.changed));
     assert.equal(await page.locator('#'+field.id).inputValue(),field.changed);
     assert.deepEqual(errors,[]);
     matrix.push({browser:name,source:'fixed',field:field.key,width:390,
      case:'successful real native IDB commit',result:'PASS'});
    }finally{await context.close();}
   }
  }finally{await server.close();}
 }finally{await browser.close();}
 return matrix;
}
(async()=>{
 const matrix=[...await runEngine(chromium,'Chromium'),...await runEngine(webkit,'WebKit')];
 assert.equal(matrix.length,52);
 console.log(JSON.stringify({status:'PASS',checks:matrix.length,
  syntheticOwnerlessBoot:true,authenticated:false,physicalMobile:false,
  originalWebKitONNX:false,familyAlpha:'HOLD',matrix},null,2));
})().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
