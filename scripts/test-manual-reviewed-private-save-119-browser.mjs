/**
 * PHOTO119 research browser: visible "Correct and Save" controls, real original
 * public-license JPEG, genuine WebCrypto and IndexedDB for TWO isolated owners.
 * Category and color labels are MANUAL test inputs, NOT model inference truth.
 * No customer images, production site, network services or deployment.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {extname,resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const original=readFileSync('benchmark/fixtures/commons-0053.jpg');
const originalJPEG='data:image/jpeg;base64,'+original.toString('base64');
const SHA=createHash('sha256').update(original).digest('hex');
const base=process.cwd();
const html='<!doctype html><html lang="en"><head>'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>PHOTO119 research-only original photo manual review</title>'+
 '<style>*,*:before,*:after{box-sizing:border-box}body{font:16px system-ui,sans-serif;margin:0;background:#f9f9fb;color:#172232}main{max-width:720px;padding:16px;margin:0 auto}h1{font-size:21px;margin:0 0 8px}p{margin:8px 0 14px}.preview{display:grid;gap:12px;grid-template-columns:120px minmax(0,1fr);align-items:start}img{width:120px;max-height:180px;object-fit:contain;border:1px solid #cad2e0;background:#fff;border-radius:8px}form{display:grid;gap:12px;min-width:0}label{display:flex;flex-direction:column;gap:4px;font-size:14px}input,select,button{font:16px system-ui;min-height:48px;border-radius:9px;padding:9px;max-width:100%}button{font-weight:700;background:#1d4b86;color:white;border:0}#status{min-height:24px;font-weight:600}#safe{font-size:13px;color:#456}@media(max-width:360px){main{padding:9px}.preview{grid-template-columns:95px minmax(0,1fr);gap:8px}img{width:95px}h1{font-size:19px}}</style>'+
 '</head><body><main><h1>Review this garment</h1>'+
 '<p id="safe">RESEARCH ONLY · Family Alpha HOLD · Source image preserved</p>'+
 '<div class="preview"><img id="original" alt="Original public licensed clothing research photograph">'+
 '<form id="review"><label>Correct category<select id="category">'+
 '<option>Bottoms</option><option>Tops</option><option>Outerwear</option><option>Dresses</option><option>Shoes</option></select></label>'+
 '<label>Correct clothing type<select id="type"><option>Skirt</option><option>Jeans</option><option>T-shirt</option><option>Sneakers</option><option>Jacket</option></select></label>'+
 '<label>Correct color<input id="color" value="Cream" maxlength="48"></label>'+
 '<label>One garment confirmed<input id="confirmed" type="checkbox" checked></label>'+
 '<button id="save" type="button">Confirm review and save privately</button></form></div>'+
 '<p id="status" role="status" aria-live="polite">Not saved</p></main></body></html>';
const server=createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/__review119'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self' data:; style-src 'unsafe-inline'; script-src 'self'"});
   res.end(html);return;
  }
  if(!['.mjs','.js'].includes(extname(pathname)))throw Error('source module only');
  const file=resolve(base,'.'+pathname);
  if(!file.startsWith(base+sep))throw Error('outside source checkout');
  res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});
  res.end(readFileSync(file));return;
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port;
const evidence=[];
mkdirSync('benchmark/manual-reviewed-private-save-119',{recursive:true});
let launched;
try{
 for(const spec of [
  {engine:'Chromium',launcher:chromium,widths:[320,390,430]},
  {engine:'WebKit',launcher:webkit,widths:[390]}
 ]){
  launched=await spec.launcher.launch({
   headless:true,...(spec.engine==='Chromium'?{args:['--no-sandbox']}:{})
  });
  for(const width of spec.widths){
   const context=await launched.newContext({
    viewport:{width,height:850},deviceScaleFactor:1,
    isMobile:true,hasTouch:true
   });
   try{
    const page=await context.newPage();
    await page.goto(url+'/__review119',{waitUntil:'domcontentloaded'});
    await page.evaluate(async({originalJPEG,SHA,width})=>{
     const module=await import('/research/manual-reviewed-private-save-119/reviewed-source-commit.mjs');
     const names=['research-user-A-'+width,'research-user-B-'+width];
     const open=async name=>await new Promise((resolve,reject)=>{
      const q=indexedDB.open('closet-current-user-'+name,2);
      q.onupgradeneeded=()=>{
       q.result.createObjectStore('items',{keyPath:'id'});
       q.result.createObjectStore('state',{keyPath:'id'});
      };
      q.onsuccess=()=>resolve(q.result);
      q.onerror=()=>reject(q.error);
     });
     const current={name:null,db:null,record:null};
     window.__review119={module,names,current,originalJPEG,SHA,dbs:{}};
     window.__startOwner119=async letter=>{
      const name=names[letter==='A'?0:1];
      const db=await open(name);
      const record={
       id:'photo-reviewed-'+letter,ownerId:name,
       image:originalJPEG,originalPhoto:{image:originalJPEG,sha256:SHA},
       sourceSHA256:SHA,sourceHashVerified:true,
       singleGarmentVerified:false,
       category:'Uncategorized',itemType:'Unknown',color:'Unknown'
      };
      await new Promise((resolve,reject)=>{
       const tx=db.transaction('state','readwrite');
       tx.objectStore('state').put({
        id:'draft',batch:[record,{id:'another-unsaved-item',
         name:'Keep private draft'}],futureState:{preserve:'yes'}
       });
       tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });
      window.__review119.dbs[letter]=db;
      current.name=name;current.db=db;current.record=record;
      document.getElementById('original').src=originalJPEG;
      document.getElementById('status').textContent='Not saved';
     };
     window.__save119=async()=>{
      const r=window.__review119;
      const select=id=>document.getElementById(id);
      const review={
       confirmed:true,recordId:r.current.record.id,
       originalSHA256:SHA,
       category:select('category').value,
       itemType:select('type').value,
       color:select('color').value,
       singleGarmentConfirmed:select('confirmed').checked
      };
      try{
       r.last=await r.module.commitHumanReviewedPhoto119({
        db:r.current.db,ownerId:r.current.name,
        currentOwner:()=>r.current.name,
        record:r.current.record,review
       });
       select('status').textContent=r.last.saved
        ?'Human-reviewed garment saved privately'
        :'More review required before saving';
      }catch{
       r.last={saved:false,needsReview:true};
       select('status').textContent='Save rejected: inspect private draft and review';
      }
      return r.last;
     };
     window.__inspect119=async letter=>{
      const db=window.__review119.dbs[letter];
      return await new Promise((resolve,reject)=>{
       const tx=db.transaction(['items','state'],'readonly');
       let items,draft;
       tx.objectStore('items').getAll().onsuccess=e=>{items=e.target.result;};
       tx.objectStore('state').get('draft').onsuccess=e=>{draft=e.target.result;};
       tx.oncomplete=()=>resolve({
        items:items.map(i=>({
         category:i.category,itemType:i.itemType,color:i.color,
         ownerMatches:i.ownerId===window.__review119.names[letter==='A'?0:1],
         sourceMatches:i.sourceSHA256===SHA&&i.originalPhoto?.image===originalJPEG,
         isUserCorrection:i.userAdjusted===true&&i.ownerReviewed===true
        })),
        remainingDraft:draft.batch.length,
        unrelatedDraftPreserved:draft.batch[0]?.name==='Keep private draft',
        futureStatePreserved:draft.futureState?.preserve==='yes'
       });
       tx.onabort=()=>reject(tx.error);
      });
     };
     window.__foreign119=async()=>{
      const r=window.__review119,ownerB=r.names[1],dbA=r.dbs.A;
      try{
       await r.module.commitHumanReviewedPhoto119({
        db:dbA,ownerId:ownerB,currentOwner:()=>ownerB,
        record:r.current.record,review:{
         confirmed:true,recordId:r.current.record.id,
         originalSHA256:SHA,category:'Bottoms',itemType:'Skirt',
         color:'Cream',singleGarmentConfirmed:true
        }
       });
       return false;
      }catch{return true;}
     };
     document.getElementById('save').addEventListener('click',()=>{
      window.__lastSave119=window.__save119();
     });
    },{originalJPEG,SHA,width});
    await page.evaluate(()=>window.__startOwner119('A'));
    await page.locator('#category').selectOption('Bottoms');
    await page.locator('#type').selectOption('Skirt');
    await page.locator('#color').fill('Cream');
    await page.locator('#save').click();
    await page.waitForFunction(()=>document.getElementById('status').textContent==='Human-reviewed garment saved privately');
    const A=await page.evaluate(()=>window.__inspect119('A'));
    assert.equal(A.items.length,1);
    assert.equal(A.items[0].itemType,'Skirt');
    assert.equal(A.items[0].color,'Cream');
    assert.equal(A.items[0].ownerMatches,true);
    assert.equal(A.items[0].sourceMatches,true);
    assert.equal(A.items[0].isUserCorrection,true);
    assert.equal(A.remainingDraft,1);
    assert.equal(A.unrelatedDraftPreserved,true);
    assert.equal(A.futureStatePreserved,true);
    await page.screenshot({
     path:'benchmark/manual-reviewed-private-save-119/'+spec.engine.toLowerCase()+'-'+width+'-reviewed-A.png',
     fullPage:true
    });
    await page.locator('#save').click();
    await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Save rejected:'));
    const duplicateBlocked=(await page.evaluate(()=>window.__inspect119('A'))).items.length===1;
    assert.equal(duplicateBlocked,true);
    await page.evaluate(()=>window.__startOwner119('B'));
    await page.locator('#category').selectOption('Tops');
    await page.locator('#type').selectOption('T-shirt');
    await page.locator('#color').fill('Blue');
    await page.locator('#save').click();
    await page.waitForFunction(()=>document.getElementById('status').textContent==='Human-reviewed garment saved privately');
    const B=await page.evaluate(()=>window.__inspect119('B'));
    assert.equal(B.items.length,1);
    assert.equal(B.items[0].category,'Tops');
    assert.equal(B.items[0].itemType,'T-shirt');
    assert.equal(B.items[0].color,'Blue');
    assert.equal(B.items[0].ownerMatches,true);
    assert.equal(B.items[0].sourceMatches,true);
    assert.equal(B.remainingDraft,1);
    assert.equal(B.futureStatePreserved,true);
    const foreignOwnerAccessBlocked=await page.evaluate(()=>window.__foreign119());
    assert.equal(foreignOwnerAccessBlocked,true);
    const isolation=await page.evaluate(()=>window.__inspect119('A'));
    assert.equal(isolation.items[0].category,'Bottoms');
    assert.equal(isolation.items[0].color,'Cream');
    const noOverflow=await page.evaluate(()=>
     document.documentElement.scrollWidth<=window.innerWidth+1);
    assert.equal(noOverflow,true);
    await page.screenshot({
     path:'benchmark/manual-reviewed-private-save-119/'+spec.engine.toLowerCase()+'-'+width+'-reviewed-B.png',
     fullPage:true
    });
    evidence.push({
     engine:spec.engine,width,
     actualBrowserIndexedDB:true,actualWebCrypto:true,
     humanReviewUiFunctional:true,originalPublicJPEGPreserved:true,
     twoSyntheticOwnerDatabaseIsolation:true,duplicateReopenBlocked:duplicateBlocked,
     foreignOwnerAccessBlocked,unrelatedDraftPreserved:true,
     noHorizontalOverflow:noOverflow,
     realSignedAccountsTested:false,physicalDeviceTested:false,
     scientificGarmentRecognitionAccuracyTested:false,
     productionAppIntegrated:false,releaseAuthorized:false,familyAlpha:'HOLD'
    });
    await page.evaluate(()=>{
     Object.values(window.__review119.dbs).forEach(db=>db.close());
    });
   }finally{await context.close();}
  }
  await launched.close();launched=null;
 }
 const counts={Chromium:evidence.filter(x=>x.engine==='Chromium').length,
  WebKit:evidence.filter(x=>x.engine==='WebKit').length};
 assert.deepEqual(counts,{Chromium:3,WebKit:1});
 writeFileSync('benchmark/manual-reviewed-private-save-119/browser-results.json',
  JSON.stringify({
   research:true,source:'repository licensed original JPEG',
   sourceSHA256:SHA,
   actualRecognizedGarmentTypeVerified:false,
   realSignedCloudRLSVerified:false,
   actualPhysicalMobileHardwareTested:false,
   originalPhotosOfPrivatePeopleUsed:false,
   productionAppModified:false,
   familyAlpha:'HOLD',releaseAuthorized:false,
   counts,scenarios:evidence
  },null,2));
 console.log('PHOTO119 actual Chromium 320/390/430 and WebKit 390 original-photo human-reviewed private IndexedDB acceptance 4/4 PASS');
}finally{
 await launched?.close();
 await new Promise(resolve=>server.close(resolve));
}
