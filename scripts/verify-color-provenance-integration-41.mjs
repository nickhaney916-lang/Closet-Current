import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

// COLOR41: actual native clothingFields extracted at runtime from public/app.js,
// genuine checkPhoto/PhotoColor/ClothingDetails scripts, synthetic JPEG and actual
// owner-scoped browser IndexedDB; NO hosted credentials, cloud, model or users.
const root=resolve('.'),out=resolve('benchmark/color-provenance-integration-41');
await mkdir(out,{recursive:true});
const svg=Buffer.from('<svg width="700" height="520" xmlns="http://www.w3.org/2000/svg"><rect width="700" height="520" fill="#eee"/><path d="M100 35 L200 16 L300 16 L400 35 L460 140 L355 200 L332 145 L330 460 L165 460 L165 145 L140 200Z" fill="#878787"/><path d="M530 50 L580 80 L600 450 L510 450Z" fill="#247cb6"/></svg>');
const bytes=await sharp(svg).jpeg({quality:90}).toBuffer();
const sourceData='data:image/jpeg;base64,'+bytes.toString('base64');
const sha=createHash('sha256').update(bytes).digest('hex');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:15px system-ui;margin:12px;max-width:500px;color:#222;background:#fafafa}main{padding:10px;border:1px solid #bbb;background:white}label{display:block;margin:7px 0}input,select,textarea{max-width:100%;width:95%;font:15px system-ui}figure{margin:8px 0}figure img{max-width:100%;max-height:230px}details{margin:8px 0}summary{font-weight:600}p.fine{font-size:13px}</style></head><body><main><h2>Closet Current — Color source review research</h2><p id="hint">This photograph is synthetic. The color is an estimate, not confirmed.</p><div id="form"></div><p id="receipt"></p></main><script src="/public/taxonomy.js"></script><script src="/public/clothing-details.js"></script><script src="/public/photo-color.js"></script><script src="/public/photo-check.js"></script></body></html>';
const allowed=new Set(['/public/taxonomy.js','/public/clothing-details.js','/public/photo-color.js','/public/photo-check.js','/public/app.js']);
const server=createServer(async(req,res)=>{
 try {
  const path=new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET')throw Error('no non-GET');
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
  if(!allowed.has(path))throw Error('forbidden path');
  res.writeHead(200,{'content-type':'text/javascript'}).end(await readFile(root+path));
 } catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],unexpected=[],errors=[];
const digest=b=>createHash('sha256').update(b).digest('hex');
try {
 for(const [engine,launch] of Object.entries({chromium,webkit})){
  const browser=await launch.launch();
  try {
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:930},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(origin+'/')||!['GET','HEAD'].includes(route.request().method())){
      unexpected.push({engine,width,url:'external-or-write'});return route.abort();
     }
     return route.continue();
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push({engine,width,message:error.message.slice(0,120)}));
    await page.goto(origin,{waitUntil:'load'});
    const initial=await page.evaluate(async({sourceData,sha})=>{
     const photo=await checkPhoto(sourceData);
     if(!photo.colorEstimate)throw Error('Real in-browser image sample did not produce a color estimate');
     const source=await fetch('/public/app.js').then(r=>r.text());
     const begin=source.indexOf('function node('),end=source.indexOf('function cropClothingPhoto(');
     if(begin<0||end<=begin)throw Error('cannot locate actual clothingFields native source');
     const create=new Function('categories','items',source.slice(begin,end)+';return clothingFields;');
     const clothingFields=create(['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],[]);
     const item={id:'synthetic-color41',ownerId:'color41-owner',sourceSHA256:sha,
      originalPhoto:{image:sourceData,sha256:sha},image:sourceData,
      category:'Tops',itemType:'T-shirt',name:'Synthetic Gray Shirt',color:'Gray',
      colorSource:'photo-estimate',notes:'',seasons:['Summer'],pattern:'Solid',
      sleeveLength:'Short sleeve',fit:'Regular'};
     const host=document.getElementById('form'),form=document.createElement('form');host.append(form);
     const collect=clothingFields(form,item);
     window.__color41={item,collect,photo,sha};
     const untrusted=photo.colorEstimate;
     // Current scene-level automatic model is not a human-labelled truth.
     const badColor=ClothingDetails.fillColor({...item,color:'',colorSource:undefined},
       {...untrusted,color:'Blue',needsConfirmation:true});
     if(badColor.color)throw Error('uncertain scene color auto-saved');
     const invalid=ClothingDetails.fillColor({...item,color:'',colorSource:undefined},{color:'Red',support:5});
     if(invalid.color)throw Error('invalid support auto-saved');
     if(document.querySelector('[aria-label="Color"]').value!=='Gray')throw Error('estimate not displayed');
     return {realPhotoEstimate:untrusted.color,realSupport:untrusted.support,
      refusedUncertain:true,refusedInvalid:true,sourceUnchanged:item.originalPhoto.image===sourceData};
    },{sourceData,sha});
    assert.ok(initial.sourceUnchanged&&initial.refusedUncertain&&initial.refusedInvalid);
    const notes=page.getByLabel('Notes',{exact:true}),color=page.getByLabel('Color',{exact:true});
    await notes.fill('Changed only my notes');
    const noteOnly=await page.evaluate(()=>{
     const row=window.__color41.collect();
     document.getElementById('receipt').textContent='Notes changed, estimated Gray still attributed to photo-estimate';
     return {color:row.color,source:row.colorSource,notes:row.notes,sha:row.sourceSHA256,
      sourcePhoto:row.originalPhoto.image===window.__color41.item.originalPhoto.image};
    });
    assert.equal(noteOnly.color,'Gray');assert.equal(noteOnly.source,'photo-estimate');
    assert.equal(noteOnly.notes,'Changed only my notes');assert.equal(noteOnly.sha,sha);
    const shots=[];
    async function snap(kind){
     const filename=engine+'-'+width+'-'+kind+'.png';
     const image=await page.screenshot({path:out+'/'+filename,fullPage:true});
     const meta=await sharp(image).metadata(),stats=await sharp(image).stats();
     assert.equal(meta.format,'png');assert.equal(meta.width,width);
     assert.ok(meta.height>500&&image.length>8000&&stats.channels[0].stdev>6);
     shots.push({filename,sha256:digest(image),width:meta.width,height:meta.height,bytes:image.length});
    }
    await snap('photo-estimate');
    await color.fill('Green');
    const manual=await page.evaluate(()=>{
     const row=window.__color41.collect();
     const candidate=ClothingDetails.fill(row,{category:'Tops'},{color:'Red',pattern:'Striped'},true);
     const recent=ClothingDetails.fillColor(row,{color:'Blue',support:1});
     document.getElementById('receipt').textContent='Green was explicitly entered by the user and cannot be overwritten by model Red or Blue';
     return {color:row.color,source:row.colorSource,modelColor:candidate.color,
      photoColor:recent.color,sha:row.sourceSHA256};
    });
    assert.deepEqual(manual,{color:'Green',source:'user',modelColor:'Green',photoColor:'Green',sha});
    await snap('manual-green');
    await color.fill('');
    const cleared=await page.evaluate(async()=>{
     const row=window.__color41.collect();
     const again=ClothingDetails.fill(row,{category:'Tops'},{color:'Red'},true);
     const against=ClothingDetails.fillColor(row,{color:'Black',support:1});
     if(again.color!==''||against.color!==''||row.colorSource!=='user')throw Error('manual clear overwritten');
     const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('closet-current-user-color41-owner',2);
      r.onupgradeneeded=()=>{
       if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});
       if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});
      };
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     await new Promise((resolve,reject)=>{
      const tx=db.transaction('items','readwrite');tx.objectStore('items').put(row);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
     });
     const recovered=await new Promise((resolve,reject)=>{
      const r=db.transaction('items').objectStore('items').get(row.id);
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     db.close();
     document.getElementById('receipt').textContent='User cleared color; real private browser IndexedDB retains the blank without reinference';
     return {color:recovered.color,source:recovered.colorSource,sha:recovered.sourceSHA256,
       identity:recovered.originalPhoto.sha256===recovered.sourceSHA256&&
        recovered.originalPhoto.image===window.__color41.item.originalPhoto.image,
       owner:recovered.ownerId,notes:recovered.notes};
    });
    assert.deepEqual(cleared,{color:'',source:'user',sha,identity:true,
     owner:'color41-owner',notes:'Changed only my notes'});
    await snap('user-cleared');
    cases.push({engine,width,originalSHA256:sha,actualBrowserImageDecode:true,
      untrustedModelAccuracyNotClaimed:true,noteOnlyEstimatePreserved:true,
      userColorProtectedFromOverwrite:true,manualClearProtected:true,
      actualOwnerNamedIndexedDBWriteAndRead:true,originalPhotoRetained:true,
      modelSceneEstimate:initial.realPhotoEstimate,modelSceneSupport:initial.realSupport,screenshots:shots});
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(cases.length,6);assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 const report={priority:'COLOR-PROVENANCE-INTEGRATION-41',realBrowserCases:6,
  engines:['chromium','webkit'],originalSHA256:sha,photoType:'locally-generated synthetic JPEG',
  realRecognitionAccuracyMeasured:false,realSignedBrowserCloudVerified:false,
  physicalDeviceVerified:false,FamilyAlpha:'HOLD',errors,unexpected,cases};
 await writeFile(out+'/browser.json',JSON.stringify(report,null,2)+'\n');
 console.log('COLOR41 real Chromium+WebKit photo-decode/native edit/real IndexedDB: 6/6; 18 verified PNGs; photo estimate/explicit user color and clear preserved; classification/color truth NOT MEASURED; Family Alpha HOLD');
}finally{await new Promise(resolve=>server.close(resolve));}
