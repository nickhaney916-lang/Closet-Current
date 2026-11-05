/** HINT50: real Chromium/WebKit owner-private IndexedDB, original JPEG and hostile synthetic worker hints. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const dir='benchmark/segmentation-hint-sanitization-50';
await mkdir(dir,{recursive:true});
const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
const sha=b=>createHash('sha256').update(b).digest('hex');
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8')).find(x=>x.id==='commons-0003');
const originalSHA256=sha(bytes);
assert.equal(originalSHA256,locked.sha256);
const original='data:image/jpeg;base64,'+bytes.toString('base64');
const root=resolve('.'),types={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json'};
const html=[
 '<!doctype html><html lang="en"><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<title>HINT50 private source evidence</title>',
 '<style>body{font-family:system-ui;background:#edf1ed;color:#253a30;margin:0}',
 'main{max-width:680px;margin:auto;padding:18px}section{padding:16px;border:1px solid #a9b9ae;border-radius:12px;background:white}',
 'img{width:100%;max-height:390px;object-fit:contain}',
 'h1{font-size:23px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}',
 '#status{padding:10px;background:#e4eee4;border-radius:8px}</style>',
 '<main><h1>Original-photo private wardrobe safety research</h1>',
 '<section><img alt="Rights-cleared clothing photograph" id="photo">',
 '<p>Human review: <b>Tops · T-shirt · Navy</b></p>',
 '<p id="status">Awaiting untrusted SegFormer evidence check</p>',
 '<pre id="report">Only a human can confirm category, type and color.</pre>',
 '</section></main></html>'
].join('');
const server=createServer(async(req,res)=>{
 const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/hint50'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
 try{
  if(!p.startsWith('/research/')||p.includes('..')||p.includes('\\'))throw Error('unsupported');
  const file=resolve(root,'.'+decodeURIComponent(p));
  if(!file.startsWith(root+'/'))throw Error('escaped');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port+'/hint50';
const result={priority:'SEGMENT-EVIDENCE-SANITIZATION-50',originalSHA256,
  licensedSource:'commons-0003',actualSegFormerInference:false,signedCloudAccounts:false,
  cases:[],screenshots:[],unexpectedRequests:[],errors:[]};
let browser;
async function shot(page,engine,width,stage){
 const png=await page.screenshot({fullPage:true,animations:'disabled'});
 const m=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(m.width,width);assert.ok(m.height>650&&png.length>4000);
 assert.ok(stats.channels.some(c=>c.stdev>6));
 const name=engine+'-'+width+'-'+stage+'.png';
 await writeFile(dir+'/'+name,png);
 result.screenshots.push({name,engine,width,stage,bytes:png.length,height:m.height,sha256:sha(png)});
}
try{
 for(const [engine,Browser] of [['chromium',chromium],['webkit',webkit]]){
  browser=await Browser.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844}});
   const page=await context.newPage();
   try{
    page.on('pageerror',e=>result.errors.push({engine,width,error:e.message}));
    await page.route('**/*',route=>{
     const u=new URL(route.request().url());
     if(u.hostname==='127.0.0.1'||u.protocol==='data:')return route.continue();
     result.unexpectedRequests.push({engine,width,url:u.origin});
     return route.abort();
    });
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.evaluate(src=>{document.getElementById('photo').src=src;},original);
    await page.locator('#photo').evaluate(img=>img.decode());
    await shot(page,engine,width,'before');
    const saved=await page.evaluate(async ({original,originalSHA256,engine,width})=>{
      const {atomicSaveGarments24}=await import('/research/multi-garment-capture-01/atomic-group.mjs');
      const image=new Image();image.src=original;await image.decode();
      const c=document.createElement('canvas');
      c.width=Math.round(image.naturalWidth*.7);c.height=Math.round(image.naturalHeight*.7);
      c.getContext('2d').drawImage(image,20,20,c.width,c.height,0,0,c.width,c.height);
      const crop=c.toDataURL('image/jpeg',.94);
      const proof={image:original,sourceSHA256:originalSHA256,sourceHashVerified:true,
       originalPhoto:{image:original,sha256:originalSHA256,width:image.naturalWidth,height:image.naturalHeight,origin:'licensed-JPEG'}};
      const owner='hint50-'+engine+'-'+width,other='hint50-other-'+engine+'-'+width;
      function open(name){return new Promise((resolve,reject)=>{
       const r=indexedDB.open('closet-current-user-'+name,1);
       r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
       r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
      });}
      function all(db){return new Promise((resolve,reject)=>{
       const r=db.transaction('items').objectStore('items').getAll();
       r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
      });}
      const db=await open(owner),foreign=await open(other);
      try{
       const piece={id:'shirt-'+width,instanceKey:'seg-4-14-11-50-60-1',
        image:crop,cropBounds:{x:.05,y:.05,width:.7,height:.7},cropReviewed:true,
        confirmed:true,category:'Tops',itemType:'T-shirt',color:'Navy',maskApplied:'false',
        hint:{categories:['Tops','Outerwear','Accessories','Tops'],types:['T-shirt','Coat','Bag'],
         confidence:.88,clipped:false,rawImage:original,securityToken:'DO-NOT-SAVE-THIS',
         maskArray:new Uint8Array(40000),foreignOwner:{id:'other'}}};
       await atomicSaveGarments24({db,proof,pieces:[piece],ownerId:owner,currentOwner:()=>owner});
       const records=await all(db),saved=records[0],otherRows=await all(foreign);
       if(records.length!==1||otherRows.length!==0)throw Error('owner isolation failure');
       const hint={categories:['Tops','Outerwear'],types:['T-shirt','Coat'],clipped:false,confidence:.88};
       if(JSON.stringify(saved.segmentHint)!==JSON.stringify(hint))throw Error('hint not sanitized');
       if(JSON.stringify(saved).includes('DO-NOT-SAVE-THIS')||JSON.stringify(saved).includes('maskArray'))
        throw Error('private model payload persisted');
       if(saved.itemType!=='T-shirt'||saved.category!=='Tops'||saved.color!=='Navy'||
          saved.sourceSHA256!==originalSHA256||saved.originalPhoto.image!==original||
          saved.maskApplied!==false||saved.sourceSegmentationConfidence!==.88)
        throw Error('original or user-confirmed garment changed');
       let duplicateBlocked=false;
       try{await atomicSaveGarments24({db,proof,pieces:[{...piece,id:'duplicate'}],
         ownerId:owner,currentOwner:()=>owner});}catch(e){duplicateBlocked=/duplicate/i.test(e.message);}
       if(!duplicateBlocked||(await all(db)).length!==1)throw Error('source duplicate not rejected');
       const report={ownerPrivate:true,originalSHA256,hint,
        category:saved.category,itemType:saved.itemType,color:saved.color,
        maskApplied:saved.maskApplied,duplicateBlocked,foreignOwnerEmpty:true,rawPayloadExcluded:true};
       document.getElementById('status').textContent='PASS: SHA-verified original and confirmed garment retained; untrusted worker evidence removed.';
       document.getElementById('report').textContent='Private owner '+owner+'\n'+JSON.stringify(report,null,2);
       return report;
      }finally{db.close();foreign.close();}
    },{original,originalSHA256,engine,width});
    assert.equal(saved.originalSHA256,originalSHA256);
    assert.ok(saved.ownerPrivate&&saved.duplicateBlocked&&saved.foreignOwnerEmpty&&saved.rawPayloadExcluded);
    await shot(page,engine,width,'after');
    result.cases.push({engine,width,...saved});
   }catch(e){result.errors.push({engine,width,error:e.message});throw e;}
   finally{await context.close();}
  }
  await browser.close();browser=null;
 }
 assert.equal(result.cases.length,6);assert.equal(result.screenshots.length,12);
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.unexpectedRequests,[]);
 await writeFile(dir+'/browser.json',JSON.stringify(result,null,2)+'\n');
 console.log('HINT50 Chromium/WebKit owner-private actual atomic JPEG source and synthetic hostile hint: 6/6, 12 SHA screenshot audits; genuine SegFormer model accuracy NOT tested');
}finally{if(browser)await browser.close();await new Promise(done=>server.close(done));}
