/**
 * MULTI24 real original Closet Current browser acceptance (not a simulated UI).
 * Auth HTTP is a synthetic fixture; photographs are unchanged CC BY-SA 2.0
 * originals and all app storage writes use genuine per-owner IndexedDB.
 * Automatic model accuracy is audited separately; this exercises the
 * conservative human-corrected fallback when the model is unavailable.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir=resolve('benchmark/multi-garment-capture-01');
await mkdir(dir,{recursive:true});
const sourceUrl='https://upload.wikimedia.org/wikipedia/commons/b/b0/Shirt_and_tie%2C_jeans_and_Converse.jpg';
const license='https://creativecommons.org/licenses/by-sa/2.0/';
const sourcePage='https://commons.wikimedia.org/wiki/File:Shirt_and_tie,_jeans_and_Converse.jpg';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fetchOriginal=async()=>{
 for(let n=0;n<3;n++){
  try{
   const response=await fetch(sourceUrl,{headers:{'user-agent':'ClosetCurrentResearchAcceptance/1.0 (source attributed in GitHub PR)'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const b=Buffer.from(await response.arrayBuffer());
   assert.ok(b.length>50000&&b.length<2_000_000&&b[0]===255&&b[1]===216&&b.at(-2)===255&&b.at(-1)===217);
   const dimensions=await sharp(b).metadata();assert.equal(dimensions.width,800);assert.equal(dimensions.height,750);
   return b;
  }catch(e){if(n===2)throw e;await new Promise(r=>setTimeout(r,1500*(n+1)));}
 }
};
const bytes=await fetchOriginal(),expectedHash=process.env.MULTI24_SOURCE_SHA256||'';
const sourceHash=sha(bytes);
if(expectedHash)assert.equal(sourceHash,expectedHash,'Licensed original changed; reject stale source lock');
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.bin':'application/octet-stream','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public|research|benchmark|node_modules)\//.test(path)||path.split('/').includes('..')||path.includes('\\')||path.includes('\0'))throw Error('invalid fixture path');
  const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('outside root');
  const b=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(b);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,auth='https://hlkgymugtfbirlpunsra.supabase.co';
const diagnostics={source:{url:sourceUrl,page:sourcePage,license,creator:'Rasmus K. Kristiansen',sha256:sourceHash,bytes:bytes.length,sourceHashPinned:!!expectedHash},cases:[],screenshots:[],unexpectedUploads:[],errors:[]};
let browser;
async function shot(page,width,stage){
 const png=await page.screenshot({animations:'disabled',fullPage:false});
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(meta.width,width);assert.ok(png.length>4000);
 assert.ok(stats.channels.some(x=>x.stdev>6),'Blank real browser screenshot');
 const file='chromium-'+width+'-'+stage+'.png';await writeFile(dir+'/'+file,png);
 diagnostics.screenshots.push({file,width,stage,sha256:sha(png)});
}
function authHTTP(route){
 const request=route.request(),url=new URL(request.url());
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  const data=JSON.parse(request.postData()||'{}'),type=url.searchParams.get('grant_type');
  const owner=type==='password'&&/^multi24-[AB]@example\.test$/.test(data.email||'')?data.email.split('@')[0]:
   type==='refresh_token'&&/^multi24-refresh-multi24-[AB]$/.test(data.refresh_token||'')?data.refresh_token.slice('multi24-refresh-'.length):null;
  if(!owner)return route.fulfill({status:401,contentType:'application/json',body:'{"error":"Invalid test account"}'});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   user:{id:owner,email:owner+'@example.test'},access_token:'multi24-fixture-'+owner,
   refresh_token:'multi24-refresh-'+owner,expires_in:3600
  })});
 }
 return route.abort();
}
async function login(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&db?.name==='closet-current-user-'+id,owner,{timeout:30000});
}
async function boardSeed(page){
 await page.evaluate(()=>new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite');
  tx.objectStore('state').put({id:'outfit-board',
   current:{name:'Original outfit draft',slots:{},ideas:{},layerCount:0,occasion:'Casual',season:'Fall',audience:'Women'},saved:[]});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 }));
}
async function realCrop(page,cardIndex,b){
 const card=page.locator('#multi24Grid .multi24-card').nth(cardIndex);
 await card.getByRole('button',{name:'Adjust crop/mask'}).click();
 const dialog=page.locator('dialog.photo-crop-editor');
 await dialog.waitFor({state:'visible'});
 const stage=dialog.locator('.crop-stage');
 await stage.scrollIntoViewIfNeeded();
 async function move(which,px,py){
  const s=await stage.boundingBox(),h=await dialog.locator('.crop-handle.'+which).boundingBox();
  assert.ok(s&&h,'Crop handles visible');
  await page.mouse.move(h.x+h.width/2,h.y+h.height/2);
  await page.mouse.down();
  await page.mouse.move(s.x+s.width*px,s.y+s.height*py,{steps:12});
  await page.mouse.up();
 }
 await move('nw',b.x,b.y);
 await move('se',b.right,b.bottom);
 await dialog.getByRole('button',{name:'Save crop'}).click();
 await dialog.waitFor({state:'hidden'});
}
const cases=[
 {category:'Tops',itemType:'Button-down shirt',color:'White',x:.38,y:.055,right:.78,bottom:.40},
 {category:'Bottoms',itemType:'Jeans',color:'Blue',x:.37,y:.38,right:.76,bottom:.88},
 {category:'Shoes',itemType:'Sneakers',color:'Blue',x:.35,y:.83,right:.72,bottom:.99}
];
try{
 for(const width of [320,390,430]){
  browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width,height:920},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const request=route.request(),u=request.url();
   if(u===origin+'/public/cloud-backup.js')return route.fulfill({status:200,contentType:'text/javascript',body:'window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};'});
   if(u.startsWith(origin+'/')||u.startsWith('data:')||u.startsWith('blob:'+origin))return route.continue();
   if(u.startsWith(auth+'/auth/v1/'))return authHTTP(route);
   if(request.method()!=='GET')diagnostics.unexpectedUploads.push({width,method:request.method(),url:u});
   return route.abort(); // model not available: prove human-reviewed fallback.
  });
  const page=await context.newPage();
  page.on('pageerror',e=>diagnostics.errors.push({width,message:e.message}));
  const url=origin+'/public/index.html?multi24=research&captureProof01=after&index04=after&nativeLossless04=research&nativeIndex07=research&index02=after&restoreAtomic01=research';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await login(page,'multi24-A');await boardSeed(page);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status().active&&window.multi24Research?.active===true&&window.closetIndex02?.state()?.ready===true,null,{timeout:45000});
  await page.evaluate(()=>switchView('scan'));
  await page.locator('#captureOutfit').click();
  await page.locator('#outfitUpload').setInputFiles({name:'Shirt_and_tie_jeans_and_Converse.jpg',mimeType:'image/jpeg',buffer:bytes});
  await page.waitForFunction(hash=>window.multi24Research?.debug().sourceSHA256===hash,sourceHash,{timeout:30000});
  await shot(page,width,'01-original-source');
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Add missed piece'}).click();
  assert.equal(await page.locator('#multi24Grid .multi24-card').count(),3);
  for(let i=0;i<3;i++){
   const p=cases[i];
   await realCrop(page,i,p);
   const card=page.locator('#multi24Grid .multi24-card').nth(i);
   await card.getByLabel('Main category').selectOption(p.category);
   await card.getByLabel('Specific type').selectOption(p.itemType);
   await card.getByLabel('Color (confirm visually)').fill(p.color);
   await card.getByLabel('I confirm this visible garment, category and color').check();
  }
  await shot(page,width,'02-three-reviewed-pieces');
  await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
  await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('3 separately confirmed garments'),null,{timeout:45000});
  const rows=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const r=db.transaction('items').objectStore('items').getAll();
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  }));
  assert.equal(rows.length,3);assert.equal(new Set(rows.map(x=>x.sourcePieceKey)).size,3);
  assert.equal(new Set(rows.map(x=>x.id)).size,3);
  assert.ok(rows.every(x=>x.sourceSHA256===sourceHash&&x.originalPhoto.sha256===sourceHash&&
   x.originalPhoto.image==='data:image/jpeg;base64,'+bytes.toString('base64')&&
   !x.threeDReady&&x.ownerId==='multi24-A'));
  assert.deepEqual(rows.map(x=>x.category).sort(),['Bottoms','Shoes','Tops']);
  const byCategory=Object.fromEntries(rows.map(x=>[x.category,x.id]));
  await page.evaluate(()=>switchView('closet'));
  await page.locator('#search').fill('Blue');
  assert.ok(await page.locator('#closetGrid article.card').count()>=2);
  await shot(page,width,'03-owner-private-index');
  await page.evaluate(ids=>{
   window.nativeLossless04Bridge.startNew();
   window.nativeLossless04Bridge.setSlot('top',ids.Tops);
   window.nativeLossless04Bridge.setSlot('bottom',ids.Bottoms);
   window.nativeLossless04Bridge.setSlot('shoes',ids.Shoes);
   window.nativeLossless04Bridge.setField('name','Three genuine photo pieces');
  },byCategory);
  const saved=await page.evaluate(()=>window.nativeLossless04Bridge.persist({asNew:true}));
  assert.equal(saved.saved,true);
  const backup=await page.evaluate(async()=> (await window.restoreAtomic01Bridge.exportJSON()).data);
  assert.equal(backup.version,4);assert.equal(backup.items.length,3);
  assert.ok(backup.items.every(x=>x.sourceSHA256===sourceHash));
  assert.deepEqual(backup.state['outfit-board'].saved.at(-1).slots,{
   top:byCategory.Tops,bottom:byCategory.Bottoms,shoes:byCategory.Shoes
  });
  await page.evaluate(()=>switchView('builder'));
  await shot(page,width,'04-saved-outfit');
  // Reload tests persistence, original-photo linkage and owner-only reads.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status().active,null,{timeout:45000});
  assert.equal(await page.evaluate(()=>items.length),3);
  assert.ok(await page.evaluate(()=>items.every(x=>x.originalPhoto?.sha256===x.sourceSHA256)));
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false,null,{timeout:30000});
  assert.equal(await page.locator('#multi24Research img[src^="data:image/"]').count(),0);
  await shot(page,width,'05-logout-photo-cleared');
  await login(page,'multi24-B');
  assert.equal(await page.evaluate(()=>items.length),0,'Owner B cannot see A original photo or private items');
  diagnostics.cases.push({width,pieces:3,sourceSHA256:sourceHash,reviewAccuracy:'3/3 human confirmed; automatic model intentionally unavailable',outfitSaved:true,v4Backup:true,ownerPrivate:true});
  await context.close();await browser.close();browser=null;
 }
 // Reproducible image contact sheet from actual screenshots, no generated cloth.
 for(const width of [320,390,430]){
  const series=diagnostics.screenshots.filter(s=>s.width===width);
  const composite=await sharp({create:{width:width*series.length,height:920,channels:4,background:'#ffffff'}})
   .composite(await Promise.all(series.map(async(s,i)=>({input:await readFile(dir+'/'+s.file),left:i*width,top:0})))).png().toBuffer();
  await writeFile(dir+'/contact-'+width+'.png',composite);
 }
 assert.deepEqual(diagnostics.unexpectedUploads,[]);
 await writeFile(dir+'/acceptance.json',JSON.stringify(diagnostics,null,2));
 console.log('MULTI24 BROWSER SUCCESS: '+JSON.stringify({sourceSHA256:sourceHash,cases:diagnostics.cases.length,screenshots:diagnostics.screenshots.length,license}));
}catch(error){
 diagnostics.failure=String(error.stack||error);
 await writeFile(dir+'/acceptance.json',JSON.stringify(diagnostics,null,2));
 throw error;
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
