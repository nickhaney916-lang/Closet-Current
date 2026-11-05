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
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {allowedFashionClipAsset52} from '../research/model-asset-reliability-52/asset-policy.mjs';
const recognition42=process.env.RECOGNITION42==='1';
const name66=process.env.NAME66==='1';
const near67=process.env.NEARDUP67==='1';
const source70=process.env.SOURCE70==='1';
const source71=process.env.SOURCE71==='1';
const source72=process.env.SOURCE72==='1';
const edit73=process.env.COLOR73==='1';
const cancel74=process.env.CANCEL74==='1';
const remove76=process.env.REMOVE76==='1';
const color77=process.env.COLOR77==='1';
const snapshot78=process.env.SNAPSHOT78==='1';
const switch68=process.env.SWITCH68==='1';
const photoSwitch70=switch68||source70||source71||source72;
if(photoSwitch70&&(near67||name66||process.env.DETECTOR57==='1'||process.env.DETECTOR58==='1'||process.env.DETECTOR65==='1'||recognition42))
 throw Error('SWITCH68 must use isolated genuine photo and human review browser acceptance');
if(near67&&(name66||process.env.DETECTOR57==='1'||process.env.DETECTOR58==='1'||process.env.DETECTOR65==='1'))
 throw Error('NEARDUP67 native manual crop regression is a distinct source-identity acceptance mode');
if(name66&&recognition42)throw Error('NAME66 label consistency tests must not run AI inference');
const detector65=process.env.DETECTOR65==='1';
const detector65Modes={
 'chromium/320':'constructor','chromium/390':'post',
 'chromium/430':'runtime','webkit/320':'messageerror',
 'webkit/390':'timeout','webkit/430':'manualstop'
};
const detector58=process.env.DETECTOR58==='1';
const detector57=process.env.DETECTOR57==='1'||detector58;
if((detector57||detector65)&&recognition42)throw Error('DETECTOR65 and RECOGNITION42 are independent reliability and inference evaluations');
if(detector65&&detector57)throw Error('DETECTOR65 cannot be used with DETECTOR57/58');
const root=resolve('.'),dir=resolve(snapshot78?'benchmark/allowlisted-review-snapshot-78':color77?'benchmark/unknown-color-confirm-gate-77':remove76?'benchmark/remove-reviewed-garment-76':cancel74?'benchmark/cancel-reviewed-capture-74':edit73?'benchmark/color-edit-partial-save-73':source72?'benchmark/same-original-photo-review-72':source71?'benchmark/invalid-selection-race-71':source70?'benchmark/verified-photo-switch-70':switch68?'benchmark/photo-switch-guard-68':near67?'benchmark/source-near-duplicate-67':name66?'benchmark/corrected-name-index-66':detector65?'benchmark/detector-recovery-65':detector58?'benchmark/bounded-detection-review-58':detector57?'benchmark/detector-proposal-native-57':recognition42?'benchmark/recognition-to-closet-42':'benchmark/multi-garment-capture-01');
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
const bytes=await fetchOriginal(),expectedHash='e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff';
const sourceHash=sha(bytes);
if(expectedHash)assert.equal(sourceHash,expectedHash,'Licensed original changed; reject stale source lock');
const replacementBytes=photoSwitch70?await readFile('benchmark/fixtures/commons-0046.jpg'):null;
const replacementHash=photoSwitch70?sha(replacementBytes):null;
if(photoSwitch70){
 assert.equal(replacementHash,'7f94b8bc8edc340200f0353968f54868dc72e3180bc191530e19f2a82ce91ead');
 assert.notEqual(replacementHash,sourceHash);
 const meta=await sharp(replacementBytes).metadata();
 assert.equal(meta.format,'jpeg');assert.ok(meta.width>200&&meta.height>200);
}
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
const diagnostics={modelRequestTrace52:{blocked:[],responses:[]},modelRequestFailures:[],source:{url:sourceUrl,page:sourcePage,license,creator:'Rasmus K. Kristiansen',sha256:sourceHash,bytes:bytes.length,sourceHashPinned:!!expectedHash},cases:[],screenshots:[],unexpectedUploads:[],errors:[]};
let browser;
async function shot(page,width,stage,engine='chromium'){
 const png=await page.screenshot({animations:'disabled',fullPage:false});
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(meta.width,width);assert.ok(png.length>4000);
 assert.ok(stats.channels.some(x=>x.stdev>6),'Blank real browser screenshot');
 const file=engine+'-'+width+'-'+stage+'.png';await writeFile(dir+'/'+file,png);
 diagnostics.screenshots.push({file,width,engine,stage,sha256:sha(png)});
}
async function fullShot(page,width,stage,engine='chromium'){
 const png=await page.screenshot({animations:'disabled',fullPage:true});
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(meta.width,width);assert.ok(meta.height>=920&&png.length>5000);
 assert.ok(stats.channels.some(x=>x.stdev>6),'Blank true full-page screenshot');
 const file=engine+'-'+width+'-'+stage+'.png';await writeFile(dir+'/'+file,png);
 diagnostics.screenshots.push({file,width,engine,stage,height:meta.height,sha256:sha(png),fullPage:true});
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
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]])for(const width of [320,390,430]){
  browser=await browserType.launch({headless:true,...engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}});
  const context=await browser.newContext({viewport:{width,height:920},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const request=route.request(),u=request.url();
   if(u===origin+'/public/cloud-backup.js')return route.fulfill({status:200,contentType:'text/javascript',body:'window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};'});
   if(u.startsWith(origin+'/')||u.startsWith('data:')||u.startsWith('blob:'+origin))return route.continue();
   if(u.startsWith(auth+'/auth/v1/'))return authHTTP(route);
   if(recognition42&&allowedFashionClipAsset52(request))return route.continue();
   // MODEL52: preserve only method, host and pathname, never query tokens,
   // request bodies, owner identity or base64 photo content.
   const source=new URL(u);
   if(recognition42&&['huggingface.co','cdn.jsdelivr.net','us.aws.cdn.hf.co'].includes(source.hostname))
    diagnostics.modelRequestTrace52.blocked.push({engine,width,method:request.method(),host:source.hostname,path:source.pathname});
   if(request.method()!=='GET')diagnostics.unexpectedUploads.push({width,method:request.method(),url:u});
   return route.abort(); // unlisted model URL cannot bypass privacy routing.
  });
  const page=await context.newPage();
  const failureMode65=detector65?detector65Modes[engine+'/'+width]:null;
  if(detector65){
   // Fault messages are synthetic ONLY. Actual original licensed JPEG,
   // owner-private IDB, crop editor, style and backup are genuine.
   await page.addInitScript({content:'window.__DETECTOR65_MODE='+JSON.stringify(failureMode65)+';'});
   await page.addInitScript({content:await readFile(
    'research/detector-recovery-65/failure-worker-fixture.js','utf8')});
  }
  if(detector57){
   if(detector58)await page.addInitScript({content:'window.__DETECTOR58=true;'});
   // Only untrusted detector worker replies are replayed. Genuine source
   // JPEG, native crop editor, owner DB, save, style and restore are real.
   await page.addInitScript({content:await readFile(
    'research/detector-proposal-native-acceptance-57/injected-detector-worker.js','utf8')});
  }
  context.on('requestfailed',request=>{
   const host=new URL(request.url()).hostname;
   if(recognition42&&['cdn.jsdelivr.net','huggingface.co','us.aws.cdn.hf.co'].includes(host))
    diagnostics.modelRequestFailures.push({engine,width,method:request.method(),
     host,path:new URL(request.url()).pathname,reason:request.failure()?.errorText});
  });
  context.on('response',response=>{
   const request=response.request(),u=new URL(request.url());
   if(recognition42&&['huggingface.co','cdn.jsdelivr.net','us.aws.cdn.hf.co'].includes(u.hostname))
    diagnostics.modelRequestTrace52.responses.push({engine,width,method:request.method(),host:u.hostname,path:u.pathname,status:response.status()});
  });
  page.on('pageerror',e=>diagnostics.errors.push({width,message:e.message}));
  const url=origin+'/public/index.html?multi24=research&captureProof01=after&index04=after&nativeLossless04=research&nativeIndex07=research&index02=after&restoreAtomic01=research&styleOwned03=research&nativeCorrection10=research';
  await page.goto(url+(recognition42?'&recognitionReview42=research':'')+(name66?'&correctedName66=research':''),{waitUntil:'domcontentloaded'});
  await login(page,'multi24-A');await boardSeed(page);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status().active&&window.multi24Research?.active===true&&window.closetIndex02?.state()?.ready===true,null,{timeout:45000});
  await page.evaluate(()=>switchView('scan'));
  await page.locator('#captureOutfit').click();
  await page.locator('#outfitUpload').setInputFiles({name:'Shirt_and_tie_jeans_and_Converse.jpg',mimeType:'image/jpeg',buffer:bytes});
  await page.waitForFunction(hash=>window.multi24Research?.debug().sourceSHA256===hash,sourceHash,{timeout:30000});
  await page.locator('#multi24Research .multi24-source').scrollIntoViewIfNeeded();
  await shot(page,width,'01-original-source',engine);
  await fullShot(page,width,'01-original-source-all',engine);
  if(detector65){
   const stopAI=page.getByRole('button',{name:'Stop AI; keep manual review'});
   if(failureMode65==='manualstop'){
    await stopAI.waitFor({state:'visible'});
    await stopAI.click();
   }else{
    await page.waitForFunction(()=>{
     const status=document.querySelector('#multi24Status')?.textContent||'';
     return /Local detection (could not start|worker failed|returned an unreadable message)|Local segmentation timed out/.test(status);
    },null,{timeout:30000});
   }
   assert.match(await page.locator('#multi24Status').innerText(),
    /verified original photo.*Nothing was automatically saved/);
   assert.equal(await page.locator('#multi24Research .multi24-source').isVisible(),true);
   assert.equal(await page.getByRole('button',{name:'Add missed piece'}).isEnabled(),true);
   assert.equal(await stopAI.isDisabled(),true);
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
   assert.equal(await page.locator('#multi24Grid .multi24-card').count(),0);
   const countBefore=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const req=db.transaction('items').objectStore('items').count();
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   }));
   assert.equal(countBefore,0,'Failed worker must not save an unreviewed crop');
   assert.equal(await page.evaluate(()=>window.multi24Research?.debug().sourceSHA256),sourceHash);
   await fullShot(page,width,'01b-worker-failed-manual-ready-all',engine);
  }
  if(detector57){
   const first=page.locator('#multi24Grid .multi24-card').first();
   await first.waitFor({timeout:30000});
   if(detector58){
    await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('12 unverified regions')&&document.getElementById('multi24Status')?.textContent.includes('988 extra'),null,{timeout:45000});
    assert.equal(await page.locator('#multi24Grid .multi24-card').count(),12,
     '1000 detector messages must not make more than 12 automatic JPEG regions or DOM cards');
    await fullShot(page,width,'01b-flood-bounded-12-all',engine);
    for(let i=0;i<11;i++)await page.locator('#multi24Grid .multi24-card').last().getByRole('button',{name:'Remove detection'}).click();
   }else await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('1 unverified region'),null,{timeout:30000});
   assert.equal(await page.locator('#multi24Grid .multi24-card').count(),1);
   assert.equal(await first.getAttribute('data-crop-reviewed55'),'unreviewed');
   assert.equal(await first.locator('[data-crop-review55="required"]').count(),1);
   assert.equal(await first.getByLabel('Main category').inputValue(),'Uncategorized',
    'LABEL59 high detector confidence must never preselect owner garment category');
   assert.equal(await first.getByLabel('Color (confirm visually)').inputValue(),'',
    'LABEL59 model pixel color must never prefill authoritative owner color');
   assert.equal(await first.getByLabel('Specific type').inputValue(),'Unknown');
   const hint59=first.locator('[data-model-hint59="unverified"]');
   assert.match(await hint59.innerText(),/Unverified detector hint: Tops.*possible color Blue/);
   assert.match(await hint59.innerText(),/Select the correct category, type and color yourself/);
   assert.equal(await first.getByLabel('I confirm this visible garment, category and color').isDisabled(),true,
    'Score=1, affirmative person flag and plausible taxonomy cannot bypass human crop review');
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
   const before=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').count();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   }));
   assert.equal(before,0,'No unreviewed detector proposal persisted');
   await fullShot(page,width,'01a-detector-unreviewed-all',engine);
   await shot(page,width,'01a-detector-unreviewed',engine);
   for(let i=0;i<2;i++)await page.getByRole('button',{name:'Add missed piece'}).click();
  }else{
   for(let i=0;i<3;i++)await page.getByRole('button',{name:'Add missed piece'}).click();
  }
  assert.equal(await page.locator('#multi24Grid .multi24-card').count(),3);
  let aiSuggestion;
  for(let i=0;i<3;i++){
   const p=cases[i];
   await realCrop(page,i,p);
   const card=page.locator('#multi24Grid .multi24-card').nth(i);
   if(detector57&&i===0){
    assert.equal(await card.getAttribute('data-crop-reviewed55'),'confirmed',
     'Only genuine crop editor Save crop can transition detector piece to reviewed');
    assert.equal(await card.locator('[data-crop-review55="required"]').count(),0);
    assert.equal(await card.getByLabel('I confirm this visible garment, category and color').isChecked(),false,
     'Crop review never implicitly confirms category, subtype or color');
   }
   if(recognition42&&i===2){
    await card.getByRole('button',{name:'Suggest category, type and color'}).click();
    const result=card.locator('[data-recognition42="result"], [data-recognition42="error"]');
    await result.waitFor({timeout:250000});
    assert.equal(await result.getAttribute('data-recognition42'),'result',
     'Genuine classifier unavailable: '+JSON.stringify(diagnostics.modelRequestFailures));
    aiSuggestion=await result.innerText();
    // COLOR46: this is a genuinely computed reviewed JPEG region-pixel
    // color, separate from FashionCLIP class suggestion and never verified.
    const colorAdvice=card.locator('[data-color-review46="unverified"]');
    await colorAdvice.waitFor({state:'visible'});
    assert.match(await colorAdvice.innerText(),/Reviewed crop pixel color.*unverified.*confirm color yourself/i);
    assert.equal(await card.getByLabel('Color (confirm visually)').inputValue(),'');
    assert.equal(await card.getByLabel('Main category').inputValue(),'Uncategorized');
    assert.equal(await card.getByLabel('Specific type').inputValue(),'Unknown');
    assert.equal(await card.getByLabel('Color (confirm visually)').inputValue(),'');
    assert.ok(await card.getByLabel('I confirm this visible garment, category and color').isDisabled());
    await fullShot(page,width,'ai-suggestion-before-review',engine);
   }
   await card.getByLabel('Main category').selectOption(p.category);
   await card.getByLabel('Specific type').selectOption(p.itemType);
   await card.getByLabel('Color (confirm visually)').fill(p.color);
   await card.getByLabel('I confirm this visible garment, category and color').check();
  }
  await fullShot(page,width,'02-three-reviewed-pieces-all',engine);
  await shot(page,width,'02-three-reviewed-pieces',engine);

  if(snapshot78){
   // Real native owner-A review cards, exact licensed original JPG and actual
   // crop pixels/labels are exercised by the same browser. This read-only
   // in-page function check injects ONLY deliberately invalid extra metadata
   // into a separate review snapshot probe; it never modifies live UI state.
   const safe=await page.evaluate(async sourceHash=>{
    const {snapshotConfirmations34}=await import('/research/multi-garment-capture-01/review-save-finality-34.mjs');
    const card=document.querySelector('#multi24Grid .multi24-card');
    const source=document.querySelector('#multi24Research .multi24-source')?.src;
    const crop=card.querySelector('img').src;
    const actualCategory=card.querySelector('select')?.value;
    const actualType=card.querySelectorAll('select')[1]?.value;
    const actualColor=card.querySelector('input[type="text"]')?.value;
    const croppedBytes=Uint8Array.from(atob(crop.split(',')[1]),c=>c.charCodeAt(0));
    const cropHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',croppedBytes)))
      .map(x=>x.toString(16).padStart(2,'0')).join('');
    const piece={
     id:crypto.randomUUID(),instanceKey:card.dataset.pieceKey,
     cropBounds:{x:.12,y:.11,width:.3,height:.35},image:crop,
     category:actualCategory,itemType:actualType,color:actualColor,
     manual:true,cropReviewed:true,confirmed:true,
     name:()=>{},arbitraryNonCloneable:()=>{},
     hugeBinaryMetadata:new Uint8Array(1000000),
     hint:{categories:['Tops'],types:['Button-down shirt'],confidence:.9,
      noncloneable:()=>{},privateToken:'do-not-leak'},
     recognitionSuggestion42:{
      source:'local-fashionclip',category:'Tops',itemType:'Button-down shirt',
      color:'White',colorSource:'recognition',
      inputBinding49:{hashAlgorithm:'SHA-256',sourceSHA256:sourceHash,
       cropSHA256:cropHash,requestedAssetTag:'native-review78'},
      secretUncloneable:()=>{}
     }
    };
    const {snapshots}=snapshotConfirmations34([piece],{types:{Tops:['Button-down shirt']}},{sourceSHA256:sourceHash});
    const snapped=snapshots[0];
    if(!source?.startsWith('data:image/jpeg;base64,')||!crop?.startsWith('data:image/jpeg;base64,'))
     throw Error('Actual native source/crop bytes missing');
    if(actualCategory!=='Tops'||actualType!=='Button-down shirt'||actualColor!=='White')
     throw Error('Native human shirt fields unexpected');
    if(snapped.name!==undefined||snapped.arbitraryNonCloneable!==undefined||
      snapped.hugeBinaryMetadata!==undefined||snapped.hint.privateToken!==undefined||
      snapped.hint.noncloneable!==undefined||
      snapped.recognitionSuggestion42.secretUncloneable!==undefined)
     throw Error('Unexpected untrusted metadata survived pre-clone allowlist');
    if(snapped.image!==crop||snapped.color!==actualColor||snapped.category!==actualCategory||
      snapped.itemType!==actualType||snapped.confirmed!==true||
      snapped.recognitionSuggestion42.inputBinding49.cropSHA256!==cropHash||
      snapped.recognitionSuggestion42.inputBinding49.sourceSHA256!==sourceHash)
     throw Error('Genuine original-photo review fields and safely bounded AI receipt changed');
    return {safe:true,cropHash,sourceHash,sourcePresent:source.length>10000,
     cloneable:true,category:snapped.category,itemType:snapped.itemType,color:snapped.color,
     untrustedFieldsStripped:true,validBoundedModelReceipt:true};
   },sourceHash);
   assert.equal(safe.safe,true);
   assert.equal(safe.sourceHash,sourceHash);
   assert.match(safe.cropHash,/^[0-9a-f]{64}$/);
   assert.equal(safe.validBoundedModelReceipt,true);
   assert.equal(safe.untrustedFieldsStripped,true);
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
   await fullShot(page,width,'02a-uncloneable-review-metadata-accepted-safely-all',engine);
  }

  if(color77){
   // Three genuinely human-reviewed original JPEG crops from owner A. After
   // explicitly confirming all 3, editing only shoe color to unsupported
   // "unknown" variants must revoke its prior confirmation and DISABLE the
   // shoe checkbox without disabling the other two authorized garments.
   const original=await page.evaluate(()=>({
    proof:window.multi24Research.debug().sourceSHA256,
    photo:document.querySelector('#multi24Research .multi24-source')?.src,
    pieces:window.multi24Research.debug().pieces,
    crops:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(i=>i.src)
   }));
   assert.equal(original.pieces.length,3);
   assert.ok(original.pieces.every(x=>x.confirmed));
   const shoe=page.locator('#multi24Grid .multi24-card').last();
   const color=shoe.getByLabel('Color (confirm visually)');
   const checkbox=shoe.getByLabel('I confirm this visible garment, category and color');
   const save=page.getByRole('button',{name:'Save confirmed pieces together'});
   for(const invalid of ['unknown',' UNKNOWN ','UnKnOwN','Unknown','   ']){
    await color.fill(invalid);
    assert.equal(await checkbox.isChecked(),false,
     'Any blank/Unknown placeholder must revoke an earlier approved shoe color');
    assert.equal(await checkbox.isDisabled(),true,
     'The invalid color must not be presented as ready for human confirmation');
    assert.equal(await save.isEnabled(),true,
     'The two other independently approved garments must remain eligible for private Save');
    const current=await page.evaluate(()=>window.multi24Research.debug().pieces);
    assert.equal(current.filter(x=>x.confirmed).length,2);
    assert.ok(current.slice(0,2).every(x=>x.confirmed));
   }
   await fullShot(page,width,'02a-invalid-unknown-color-confirm-disabled-all',engine);
   const unchanged=await page.evaluate(()=>({
    proof:window.multi24Research.debug().sourceSHA256,
    photo:document.querySelector('#multi24Research .multi24-source')?.src,
    crops:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(i=>i.src)
   }));
   assert.equal(unchanged.proof,original.proof);
   assert.equal(unchanged.photo,original.photo);
   assert.deepEqual(unchanged.crops,original.crops);
   assert.equal(await page.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').count();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   })),0,'Unknown color edits must never auto-save any owner-private garment');

   // Restoring an explicitly reviewed, genuine non-placeholder color makes
   // the confirmation available again; require the real owner to check it.
   for(const accepted of ['Navy','Charcoal','Blue']){
    await color.fill(accepted);
    assert.equal(await checkbox.isDisabled(),false,
     'Human-selected valid custom color must remain confirmable');
    assert.equal(await checkbox.isChecked(),false);
   }
   await checkbox.check();
   assert.equal(await checkbox.isChecked(),true);
   assert.equal(await save.isEnabled(),true);
   assert.ok((await page.evaluate(()=>window.multi24Research.debug().pieces)).every(x=>x.confirmed));
   await fullShot(page,width,'02b-corrected-color-manually-reconfirmed-all',engine);
  }

  if(remove76){
   // The real owner has three individually cropped and manually confirmed
   // garments from a SHA-locked licensed original JPEG. Clicking Remove
   // detection on one of them must not silently throw their review away.
   const fullBefore=await page.evaluate(()=>({
    proof:window.multi24Research.debug().sourceSHA256,
    pieces:window.multi24Research.debug().pieces,
    original:document.querySelector('#multi24Research .multi24-source')?.src,
    images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src)
   }));
   assert.equal(fullBefore.pieces.length,3);
   assert.ok(fullBefore.pieces.every(p=>p.confirmed));
   let deniedDialog='',deniedPrompts=0;
   page.once('dialog',async dlg=>{deniedPrompts++;deniedDialog=dlg.message();await dlg.dismiss();});
   await page.locator('#multi24Grid .multi24-card').last().getByRole('button',{name:'Remove detection'}).click();
   assert.equal(deniedPrompts,1,'Human-reviewed crop removal must request consent exactly once');
   assert.match(deniedDialog,/Remove this one garment.*Choose Cancel to keep/);
   await page.waitForFunction(()=>document.querySelector('#multi24Status')?.textContent.includes(
    'Garment removal canceled'),null,{timeout:30000});
   const afterDeny=await page.evaluate(()=>({
    proof:window.multi24Research.debug().sourceSHA256,
    pieces:window.multi24Research.debug().pieces,
    original:document.querySelector('#multi24Research .multi24-source')?.src,
    images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src)
   }));
   assert.deepEqual(afterDeny,fullBefore,
    'Dismissing per-garment remove retains exact original, 3 crop JPEGs and edited details');
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
   await fullShot(page,width,'02a-dismiss-remove-keeps-three-reviewed-garments-all',engine);

   let acceptedDialog='',acceptedPrompts=0;
   page.once('dialog',async dlg=>{acceptedPrompts++;acceptedDialog=dlg.message();await dlg.accept();});
   await page.locator('#multi24Grid .multi24-card').last().getByRole('button',{name:'Remove detection'}).click();
   assert.equal(acceptedPrompts,1);
   assert.match(acceptedDialog,/Remove this one garment/);
   const afterAccept=await page.evaluate(()=>({
    proof:window.multi24Research.debug().sourceSHA256,
    pieces:window.multi24Research.debug().pieces,
    original:document.querySelector('#multi24Research .multi24-source')?.src,
    images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src)
   }));
   assert.equal(afterAccept.pieces.length,2,'Consent removes exactly the chosen unsaved garment');
   assert.equal(afterAccept.proof,fullBefore.proof);
   assert.equal(afterAccept.original,fullBefore.original);
   assert.deepEqual(afterAccept.pieces,fullBefore.pieces.slice(0,2),
    'Shirt and jeans reviewed categories, crop byte data, colors and confirmations must remain');
   assert.deepEqual(afterAccept.images,fullBefore.images.slice(0,2));
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true,
    'The two remaining approved garments must still be eligible for Save');
   assert.equal(await page.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').count();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   })),0,'Removing an unsaved garment cannot silently modify any private closet row');
   await fullShot(page,width,'02b-approve-removes-only-shoe-preserves-other-two-all',engine);

   // Demonstrate recovery: re-add the shoe as a freshly marked region, use
   // the real interactive crop editor and explicitly re-confirm all details.
   await page.getByRole('button',{name:'Add missed piece'}).click();
   assert.equal(await page.locator('#multi24Grid .multi24-card').count(),3);
   await realCrop(page,2,cases[2]);
   const recoveredShoe=page.locator('#multi24Grid .multi24-card').last();
   assert.equal(await recoveredShoe.getByLabel('I confirm this visible garment, category and color').isChecked(),false);
   await recoveredShoe.getByLabel('Main category').selectOption(cases[2].category);
   await recoveredShoe.getByLabel('Specific type').selectOption(cases[2].itemType);
   await recoveredShoe.getByLabel('Color (confirm visually)').fill(cases[2].color);
   await recoveredShoe.getByLabel('I confirm this visible garment, category and color').check();
   assert.ok((await page.evaluate(()=>window.multi24Research.debug().pieces)).every(x=>x.confirmed));
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
  }

  if(cancel74){
   // Actual licensed JPEG and three human-confirmed crop images in owner A.
   const before=await page.evaluate(()=>({
    source:window.multi24Research.debug().sourceSHA256,
    pieces:window.multi24Research.debug().pieces,
    original:document.querySelector('#multi24Research .multi24-source')?.src,
    cropImages:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(i=>i.src)
   }));
   assert.equal(before.pieces.length,3);
   assert.ok(before.pieces.every(p=>p.confirmed));
   let message='',prompts=0;
   page.once('dialog',async dlg=>{prompts++;message=dlg.message();await dlg.dismiss();});
   await page.getByRole('button',{name:'Cancel extraction'}).click();
   assert.equal(prompts,1,'Unfinished owner human-review requires one cancel warning');
   assert.match(message,/Discard this unfinished review.*Choose Cancel to keep/);
   await page.waitForFunction(()=>document.querySelector('#multi24Status')?.textContent.includes(
    'Extraction cancellation dismissed'),null,{timeout:30000});
   const after=await page.evaluate(()=>({
    source:window.multi24Research.debug().sourceSHA256,
    pieces:window.multi24Research.debug().pieces,
    original:document.querySelector('#multi24Research .multi24-source')?.src,
    cropImages:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(i=>i.src)
   }));
   assert.deepEqual(after,before,'Dismissing cancel must preserve exact SHA, crop image bytes and corrected labels');
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
   assert.equal(await page.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').count();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   })),0,'Declined cancellation must neither save nor delete any private garment');
   await fullShot(page,width,'02a-dismiss-cancel-keeps-three-human-reviewed-source-all',engine);
  }
  if(photoSwitch70){
   // A genuinely distinct, separately licensed original JPEG is selected
   // while all three human-corrected garments are still only in memory.
   // Dismiss the real browser confirm and verify every photo byte/crop/label
   // remains selected with no implicit save.
   const before=await page.evaluate(()=>({
    proof:window.multi24Research.debug().sourceSHA256,
    pieces:window.multi24Research.debug().pieces,
    images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src),
    original:document.querySelector('#multi24Research .multi24-source')?.src
   }));
   assert.equal(before.pieces.length,3);
   assert.ok(before.pieces.every(x=>x.confirmed));
   if(source70||source71||source72){
    // A file that falsely claims JPEG MIME, and a valid JPEG envelope with
    // a corrupt undecodable interior, MUST be rejected before replacing the
    // original or prompting the person to discard three confirmed crops.
    const attempts=[
     {name:'not-really-a-jpeg.jpg',buffer:Buffer.alloc(300,65)},
     {name:'jpeg-envelope-but-corrupt.jpg',buffer:Buffer.concat([
      Buffer.from([255,216]),Buffer.alloc(296,0),Buffer.from([255,217])
     ])}
    ];
    let unexpectedPrompts=0;
    const unexpected=async dlg=>{unexpectedPrompts++;await dlg.dismiss();};
    page.on('dialog',unexpected);
    for(let invalidIndex=0;invalidIndex<attempts.length;invalidIndex++){
     await page.locator('#outfitUpload').setInputFiles({
      name:attempts[invalidIndex].name,mimeType:'image/jpeg',
      buffer:attempts[invalidIndex].buffer
     });
     await page.waitForFunction(()=>document.querySelector('#multi24Status')?.textContent.includes(
      'Could not verify selected replacement photo'),null,{timeout:30000});
     assert.match(await page.locator('#multi24Status').innerText(),
      /reviewed clothing remain unchanged; nothing was saved/);
     const after=await page.evaluate(()=>({
      proof:window.multi24Research.debug().sourceSHA256,
      pieces:window.multi24Research.debug().pieces,
      images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src),
      original:document.querySelector('#multi24Research .multi24-source')?.src
     }));
     assert.deepEqual(after,before,
      'Malformed or undecodable source must not revoke original JPEG or human category/subtype/color/crops');
     assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
     assert.equal(unexpectedPrompts,0,'Invalid files must never demand approval to discard existing review');
     const count=await page.evaluate(()=>new Promise((resolve,reject)=>{
      const q=db.transaction('items').objectStore('items').count();
      q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
     }));
     assert.equal(count,0,'Invalid replacement cannot persist or erase clothing records');
     await fullShot(page,width,invalidIndex===0?
      '02b-invalid-false-jpeg-preserves-reviewed-original-all':
      '02c-undecodable-jpeg-envelope-preserves-reviewed-original-all',engine);
    }
    if(source72){
     // SOURCE72 real native file-input re-selection, exactly identical bytes
     // to the original licensed JPEG during three UNSAVED human crop/type/color
     // confirmations. Must not ask to discard, restart or change owner review.
     await page.locator('#outfitUpload').setInputFiles({
      name:'same-original-three-confirmed-garments.jpg',mimeType:'image/jpeg',
      buffer:bytes
     });
     await page.waitForFunction(()=>document.querySelector('#multi24Status')?.textContent.includes(
      'Same verified original photograph selected'),null,{timeout:30000});
     const kept=await page.evaluate(()=>({
      proof:window.multi24Research.debug().sourceSHA256,
      pieces:window.multi24Research.debug().pieces,
      images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src),
      original:document.querySelector('#multi24Research .multi24-source')?.src
     }));
     assert.deepEqual(kept,before,
      'Identical JPEG must preserve all three real crop bytes, category/type/color and confirmations');
     assert.equal(unexpectedPrompts,0,'Same original photo must never demand discarding human review');
     assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
     assert.equal(await page.evaluate(()=>new Promise((resolve,reject)=>{
      const r=db.transaction('items').objectStore('items').count();
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     })),0,'Repeated same photo cannot silently save private clothing');
     await fullShot(page,width,'02e-same-original-preserves-three-reviewed-all',engine);
    }
    if(source71){
     // RACE71: older real JPEG bytes are held mid-read while a newer file
     // is rejected by the native UI's size gate. Last selection must win.
     await page.evaluate(async()=>{
      const original=document.querySelector('#multi24Research .multi24-source').src;
      const binary=atob(original.slice(original.indexOf(',')+1));
      const realBytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));
      const slow=new File([realBytes],'older-delayed-real-jpeg.jpg',{type:'image/jpeg'});
      let startedRead,releaseRead;
      const started=new Promise(resolve=>{startedRead=resolve;});
      Object.defineProperty(slow,'arrayBuffer',{value:()=>new Promise(resolve=>{
       releaseRead=resolve;startedRead();
      })});
      const pending=window.multi24Research.startFile(slow);
      await started;
      window.__race71={finish:async()=>{
       releaseRead(realBytes.buffer);
       await pending;
      }};
     });
     await page.locator('#outfitUpload').setInputFiles({
      name:'newer-invalid-eight-bytes.jpg',mimeType:'image/jpeg',
      buffer:Buffer.alloc(8,1)
     });
     await page.waitForFunction(()=>document.querySelector('#multi24Status')?.textContent.includes(
      'outside the 128-byte to 10 MB capture limit'),null,{timeout:30000});
     const rejectedStatus=await page.locator('#multi24Status').innerText();
     await page.evaluate(async()=>{await window.__race71.finish();delete window.__race71;});
     const raced=await page.evaluate(()=>({
      proof:window.multi24Research.debug().sourceSHA256,
      pieces:window.multi24Research.debug().pieces,
      images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src),
      original:document.querySelector('#multi24Research .multi24-source')?.src
     }));
     assert.deepEqual(raced,before,
      'Late valid JPEG proof must not replace original or three real reviewed garment crops');
     assert.equal(unexpectedPrompts,0,'Older valid JPEG proof cannot prompt after a newer invalid selection');
     assert.equal(await page.locator('#multi24Status').innerText(),rejectedStatus,
      'Late source proof cannot overwrite newer invalid-selection status');
     assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
     await fullShot(page,width,'02d-last-invalid-choice-defeats-older-valid-proof-all',engine);
    }
    page.off('dialog',unexpected);
   }
   let cancelPrompt='';
   page.once('dialog',async dialog=>{cancelPrompt=dialog.message();await dialog.dismiss();});
   await page.locator('#outfitUpload').setInputFiles({
    name:'replacement-commons-0046.jpg',mimeType:'image/jpeg',buffer:replacementBytes
   });
   await page.waitForFunction(()=>document.querySelector('#multi24Status')?.textContent.includes('Photo switch canceled'));
   assert.match(cancelPrompt,/Discard that review.*Choose Cancel/);
   const retained=await page.evaluate(()=>({
    proof:window.multi24Research.debug().sourceSHA256,
    pieces:window.multi24Research.debug().pieces,
    images:[...document.querySelectorAll('#multi24Grid .multi24-card img')].map(x=>x.src),
    original:document.querySelector('#multi24Research .multi24-source')?.src
   }));
   assert.deepEqual(retained,before,
    'Dismissed switch retains immutable JPEG SHA, three genuine crops and all confirmed type/color choices');
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true);
   const none=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').count();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   }));
   assert.equal(none,0,'Cancel switch must neither auto-save nor destroy review');
   await fullShot(page,width,'02a-cancel-switch-preserves-three-reviewed-crops-all',engine);
  }
  if(edit73){
   // Actual licensed JPEG: changing only the shoe color must keep the two
   // other human-confirmed garment crops saveable without auto-confirming shoe.
   const first=page.locator('#multi24Grid .multi24-card').first();
   const second=page.locator('#multi24Grid .multi24-card').nth(1);
   const third=page.locator('#multi24Grid .multi24-card').nth(2);
   const confirmed='I confirm this visible garment, category and color';
   const changed=third.getByLabel('Color (confirm visually)');
   await changed.fill('Green');
   assert.equal(await changed.inputValue(),'Green');
   assert.equal(await third.getByLabel(confirmed).isChecked(),false);
   assert.equal(await first.getByLabel(confirmed).isChecked(),true);
   assert.equal(await second.getByLabel(confirmed).isChecked(),true);
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isEnabled(),true,
    'The two previously confirmed garments must remain eligible for Save');
   assert.equal(await page.evaluate(()=>window.multi24Research.debug().pieces.filter(x=>x.confirmed).length),2);
   await fullShot(page,width,'02a-color-edited-other-two-saveable-all',engine);
   await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
   await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes(
    '2 separately confirmed garments saved together'),null,{timeout:45000});
   const onlyTwo=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const r=db.transaction('items').objectStore('items').getAll();
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   }));
   assert.equal(onlyTwo.length,2,'Only two verified source crops may save');
   assert.deepEqual(onlyTwo.map(x=>x.category).sort(),['Bottoms','Tops']);
   assert.ok(onlyTwo.every(x=>x.sourceSHA256===sourceHash&&x.ownerId==='multi24-A'&&
    x.sourceCropReviewed===true&&x.extractionReview==='human-confirmed'));
   const remaining=await page.evaluate(()=>window.multi24Research.debug());
   assert.equal(remaining.pieces.length,1,'Edited third garment remains in unsaved review');
   assert.deepEqual([remaining.pieces[0].category,remaining.pieces[0].color,remaining.pieces[0].confirmed],
    ['Shoes','Green',false]);
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
   await fullShot(page,width,'02b-only-two-private-committed-unconfirmed-shoe-retained-all',engine);
   // Restore shoe color with explicit human reconfirmation before the inherited
   // complete private owned Style, outfit, restore, duplicate and logout flow.
   const shoe=page.locator('#multi24Grid .multi24-card').first();
   await shoe.getByLabel('Color (confirm visually)').fill('Blue');
   await shoe.getByLabel(confirmed).check();
   await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
   await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes(
    '1 separately confirmed garment saved together'),null,{timeout:45000});
  }else{
   await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
   await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('3 separately confirmed garments'),null,{timeout:45000});
  }
  const rows=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const r=db.transaction('items').objectStore('items').getAll();
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  }));
  assert.equal(rows.length,3);assert.equal(new Set(rows.map(x=>x.sourcePieceKey)).size,3);
  if(detector57)assert.equal(JSON.stringify(rows).includes('modelColorHint59'),false,
   'Volatile detector color hint must not enter permanent owner-private wardrobe');
  if(detector57){
   assert.equal(rows.filter(x=>x.sourcePieceKey.endsWith('/seg-0-100-100-700-700-1')).length,1);
   assert.ok(rows.every(x=>x.sourceCropReviewed===true&&x.extractionReview==='human-confirmed'));
  }
  assert.equal(new Set(rows.map(x=>x.id)).size,3);
  assert.ok(rows.every(x=>x.sourceSHA256===sourceHash&&x.originalPhoto.sha256===sourceHash&&
   x.originalPhoto.image==='data:image/jpeg;base64,'+bytes.toString('base64')&&
   !x.threeDReady&&x.ownerId==='multi24-A'));
  assert.deepEqual(rows.map(x=>x.category).sort(),['Bottoms','Shoes','Tops']);
  const shoes=rows.find(row=>row.category==='Shoes');
  if(recognition42){
   assert.equal(shoes.recognitionSuggestion42?.source,'local-fashionclip');
   // INPUT49: actual source and cropped input bytes are hashed independently
   // at inference and rechecked against the confirmed saved IndexedDB row.
   const input49=shoes.recognitionSuggestion42.inputBinding49;
   assert.equal(input49?.hashAlgorithm,'SHA-256');
   assert.equal(input49?.sourceSHA256,sourceHash);
   assert.equal(input49?.cropSHA256,sha(Buffer.from(shoes.image.split(',')[1],'base64')));
   assert.ok(/^[A-Za-z0-9._-]{1,80}$/.test(input49?.requestedAssetTag||''));
   assert.equal(shoes.recognitionSuggestion42.colorReview46?.source,'reviewed-crop-pixels');
   assert.equal(shoes.recognitionSuggestion42.colorReview46?.needsConfirmation,true);
   assert.ok(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor'].includes(shoes.recognitionSuggestion42.colorReview46.primary));
   assert.equal(shoes.itemType,'Sneakers');
   assert.equal(shoes.color,'Blue');
   assert.equal(shoes.colorSource,'user');
  }
  // Real UI reimport: the same JPEG and the same hand-reviewed garment
  // must not silently generate a duplicate record or partially save again.
  await page.locator('#outfitUpload').setInputFiles({
   name:'same-exact-licensed-photo.jpg',mimeType:'image/jpeg',buffer:bytes
  });
  await page.waitForFunction(hash=>window.multi24Research?.debug().sourceSHA256===hash,sourceHash,{timeout:30000});
  if(detector57){
   const unreviewed=page.locator('#multi24Grid .multi24-card').first();
   await unreviewed.waitFor({timeout:30000});
   if(detector58){
    await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('988 extra'),null,{timeout:45000});
    assert.equal(await page.locator('#multi24Grid .multi24-card').count(),12);
    for(let i=0;i<11;i++)await page.locator('#multi24Grid .multi24-card').last().getByRole('button',{name:'Remove detection'}).click();
   }
   assert.equal(await unreviewed.getAttribute('data-crop-reviewed55'),'unreviewed');
  }else await page.getByRole('button',{name:'Add missed piece'}).click();
  // NEARDUP67: genuine crop-editor accessibility action after the first
  // ordinary crop. Native ArrowRight on the top-left handle changes LEFT
  // by exactly 0.01 normalized units while preserving right/bottom;
  // with the observed ~0.61-wide shirt crop its IoU remains >0.98.
  // This creates a reliably DIFFERENT rounded manual key at every viewport;
  // subpixel pointer drags can round to the same key on phones.
  await realCrop(page,0,cases[0]);
  if(near67){
   const firstCard=page.locator('#multi24Grid .multi24-card').first();
   await firstCard.getByRole('button',{name:'Adjust crop/mask'}).click();
   const dialog=page.locator('dialog.photo-crop-editor');
   await dialog.waitFor({state:'visible'});
   const corner=dialog.locator('.crop-handle.nw');
   await corner.focus();
   await corner.press('ArrowRight');
   await dialog.getByRole('button',{name:'Save crop'}).click();
   await dialog.waitFor({state:'hidden'});
   const current=await page.evaluate(()=>window.multi24Research.debug().pieces[0].instanceKey);
   const saved=rows.find(row=>row.category==='Tops').sourcePieceKey;
   assert.notEqual(sourceHash+'/'+current,saved,
    'Native crop-adjustment must produce a DIFFERENT rounded key for NEARDUP67');
   await fullShot(page,width,'03b-manual-same-shirt-shifted-crop-all',engine);
  }
  const dup=page.locator('#multi24Grid .multi24-card').first();
  await dup.getByLabel('Main category').selectOption('Tops');
  await dup.getByLabel('Specific type').selectOption('Button-down shirt');
  await dup.getByLabel('Color (confirm visually)').fill('White');
  await dup.getByLabel('I confirm this visible garment, category and color').check();
  await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
  await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('Save rejected'),null,{timeout:30000});
  assert.match(await page.locator('#multi24Status').innerText(),
   near67?/near-duplicate/i:/duplicate/i,
   'Changed crop key must still be recognized as the same human-confirmed original garment');
  const afterDuplicateCount=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const q=db.transaction('items').objectStore('items').count();
   q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
  }));
  assert.equal(afterDuplicateCount,3,'Reimport failed closed without any new duplicate record');
  if(cancel74){
   // After duplicate-save rejection a real, manually confirmed unsaved crop
   // remains; the earlier three saved private garments are a separate record.
   const old=await page.evaluate(()=>window.multi24Research.debug());
   assert.equal(old.pieces.length,1);
   assert.equal(old.pieces[0].confirmed,true);
   let prompts=0,message='';
   page.once('dialog',async dlg=>{prompts++;message=dlg.message();await dlg.accept();});
   await page.getByRole('button',{name:'Cancel extraction'}).click();
   assert.equal(prompts,1);
   assert.match(message,/Discard this unfinished review/);
   await page.waitForFunction(()=>document.querySelector('#multi24Status')?.textContent.includes(
    'Unfinished extraction canceled'),null,{timeout:30000});
   const cleared=await page.evaluate(()=>window.multi24Research.debug());
   assert.equal(cleared.sourceSHA256,undefined,'Approved cancel must revoke original bytes');
   assert.equal(cleared.pieces.length,0);
   assert.equal(await page.locator('#multi24Research img[src^="data:image/"]').count(),0);
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
   const committed=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').getAll();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   }));
   assert.equal(committed.length,3,'Approved cancel cannot erase previously committed wardrobe');
   assert.ok(committed.every(x=>x.ownerId==='multi24-A'&&x.sourceSHA256===sourceHash));
   await fullShot(page,width,'03c-accept-cancel-revokes-unsaved-keeps-three-private-all',engine);
  }
  if(photoSwitch70){
   // After a legitimate duplicate-save rejection the old source still has
   // exactly one manually confirmed crop. Approving an explicit switch must
   // revoke that UNSAVED crop, never the three already committed garments.
   const prior=await page.evaluate(()=>window.multi24Research.debug());
   assert.equal(prior.sourceSHA256,sourceHash);
   assert.equal(prior.pieces.length,1);
   assert.equal(prior.pieces[0].confirmed,true);
   let approvePrompt='';
   page.once('dialog',async dialog=>{approvePrompt=dialog.message();await dialog.accept();});
   await page.locator('#outfitUpload').setInputFiles({
    name:'replacement-commons-0046.jpg',mimeType:'image/jpeg',buffer:replacementBytes
   });
   await page.waitForFunction(hash=>window.multi24Research?.debug().sourceSHA256===hash,replacementHash,{timeout:30000});
   assert.match(approvePrompt,/Discard that review.*Choose Cancel/);
   const switched=await page.evaluate(()=>window.multi24Research.debug());
   assert.equal(switched.sourceSHA256,replacementHash);
   assert.ok(switched.pieces.every(p=>p.confirmed===false),
    'Accepted switch cannot carry a previous image confirmed item into new photo');
   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
   const retained=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').getAll();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   }));
   assert.equal(retained.length,3);
   assert.ok(retained.every(x=>x.sourceSHA256===sourceHash&&x.ownerId==='multi24-A'),
    'Committed owner-private closet remains intact after explicit unsaved switch');
   await fullShot(page,width,'03b-approved-switch-clears-unsaved-keeps-private-closet-all',engine);
  }

  if(detector57){
   assert.ok((await page.evaluate(()=>window.__detector57Audit?.requests))>=2,
    'Original source and duplicate reimport both issued native detector worker requests');
  }
  const byCategory=Object.fromEntries(rows.map(x=>[x.category,x.id]));
  // INTEGRATION-12: same real native owner source and wardrobe drive Style.
  // Three photographed garments make exactly ONE genuine pinned look, never
  // three fabricated combinations or an unreviewed 3D-fit receipt.
  const style=await page.evaluate(async ids=>{
   const bridge=window.styleOwnedLive03Bridge;
   if(!bridge?.status().active)throw Error('Real owner Style panel missing');
   await bridge.refresh({quiet:true});
   await bridge.selectGarment(ids.Tops);
   const result=await bridge.generate();
   if(result.combinations.length!==1||result.combinations[0].certified3D!==false)
    throw Error('Must show one source-verified owned look, not three invented outfits');
   bridge.selectSuggestion(0);
   const before=bridge.status();
   if(!before.dirty||before.selectedSlots.top!==ids.Tops||
      before.selectedSlots.bottom!==ids.Bottoms||before.selectedSlots.shoes!==ids.Shoes)
    throw Error('Pinned outfit did not use all three reviewed crop IDs');
   const save=await bridge.save();
   return {saved:save.saved,lookCount:result.combinations.length,
    photoOnly:result.combinations[0].sourcePhotoFallbackRequired,
    savedId:bridge.status().savedId};
  },byCategory);
  assert.equal(style.saved,true);
  assert.equal(style.lookCount,1);
  assert.ok(style.savedId&&style.photoOnly);
  await page.evaluate(()=>switchView('stylist'));
  assert.equal(await page.locator('#styleOwned03Pinned img').count(),1);
  assert.equal(await page.locator('#styleOwned03Pending button').count(),0,
   'reviewed VISIBLE pieces must not require falsely approving the whole image as one item');
  await shot(page,width,'03b-native-styled-visible-crops',engine);
  await page.evaluate(()=>switchView('closet'));
  await page.locator('#search').fill('Blue');
  assert.ok(await page.locator('#closetGrid article.card').count()>=2);
  await fullShot(page,width,'03-owner-private-index-all',engine);
  await page.locator('#closetGrid article.card').first().scrollIntoViewIfNeeded();
  await shot(page,width,'03-owner-private-index',engine);
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
  // Genuine authorized owner recovery: deliberately lose source shirt from
  // actual IDB, then restore all original JPEG bytes and saved outfit slots.
  await page.evaluate(id=>new Promise((resolve,reject)=>{
   const tx=db.transaction('items','readwrite');
   tx.objectStore('items').delete(id);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  }),byCategory.Tops);
  assert.equal(await page.evaluate(()=>new Promise((resolve,reject)=>{
   const r=db.transaction('items').objectStore('items').count();
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  })),2);
  const recovered=await page.evaluate(doc=>
   window.restoreAtomic01Bridge.importBackup(doc,{confirm:()=>true}),backup);
  assert.equal(recovered.cancelled,undefined);
  const recoveredRows=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const r=db.transaction('items').objectStore('items').getAll();
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  }));
  assert.equal(recoveredRows.length,3);
  assert.ok(recoveredRows.every(x=>x.originalPhoto.sha256===sourceHash&&
   x.originalPhoto.image==='data:image/jpeg;base64,'+bytes.toString('base64')));
  const recoveredBoard=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const r=db.transaction('state').objectStore('state').get('outfit-board');
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  }));
  assert.deepEqual(recoveredBoard,backup.state['outfit-board']);
  // Restores intentionally revoke stale native UI snapshots. Reload and
  // explicitly reopen the existing saved outfit, then inspect real clothing.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status().active,null,{timeout:45000});
  assert.equal(await page.evaluate(()=>items.length),3);
  assert.ok(await page.evaluate(()=>items.every(x=>x.originalPhoto?.sha256===x.sourceSHA256)));
  await page.evaluate(()=>switchView('builder'));
  await page.locator('#savedBoards button').first().click();
  assert.deepEqual(await page.evaluate(()=>window.nativeLossless04Bridge.view().slots),{
   top:byCategory.Tops,bottom:byCategory.Bottoms,shoes:byCategory.Shoes
  });
  await fullShot(page,width,'04-saved-outfit-all',engine);
  await page.evaluate(()=>document.getElementById('builder').scrollIntoView({block:'start',behavior:'instant'}));
  await shot(page,width,'04-saved-outfit',engine);
  if(recognition42){
   await page.evaluate(()=>switchView('closet'));
   await page.locator('#closetCategories button[data-category="Shoes"]').click();
   await page.locator('#search').fill('Sneakers');
   const savedCard=page.locator('#closetGrid article.card').filter({hasText:'Blue Sneakers'});
   await savedCard.getByRole('button',{name:'Adjust details'}).click();
   const editor=page.locator('dialog.clothing-editor');
   await editor.locator('details.optional-details').evaluate(details=>{details.open=true;});
   const color=editor.getByLabel('Color',{exact:true});
   assert.equal(await color.inputValue(),'Blue');
   await color.fill('');
   await editor.getByRole('button',{name:'Save changes'}).click();
   await editor.waitFor({state:'hidden',timeout:8000}).catch(async error=>{
    throw Error((await page.locator('#message').textContent())+' '+error.message);
   });
   await savedCard.getByRole('button',{name:'Adjust details'}).click();
   assert.equal(await color.inputValue(),'');
   assert.equal(await editor.getByLabel('Item type',{exact:true}).inputValue(),'Sneakers');
   const edited=await page.evaluate(id=>new Promise((resolve,reject)=>{
    const req=db.transaction('items').objectStore('items').get(id);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   }),byCategory.Shoes);
   assert.equal(edited.color,'');
   assert.equal(edited.colorSource,'user');
   assert.equal(edited.originalPhoto.image,shoes.originalPhoto.image);
   assert.deepEqual(edited.recognitionSuggestion42,shoes.recognitionSuggestion42);
   await fullShot(page,width,'reopened-owner-color-correction',engine);
   await editor.getByRole('button',{name:'Cancel'}).click();
  }
  let shirtEvidence=null;
  if(recognition42&&engine==='chromium'&&width===390){
   const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
   const fixture=manifest.find(source=>source.id==='commons-0003');
   const shirt=await readFile('benchmark/fixtures/'+fixture.image);
   assert.equal(sha(shirt),fixture.sha256);
   await page.evaluate(()=>switchView('scan'));
   await page.locator('#captureOutfit').click();
   await page.locator('#outfitUpload').setInputFiles({name:'archived-shirt.jpg',mimeType:'image/jpeg',buffer:shirt});
   await page.waitForFunction(hash=>window.multi24Research?.debug().sourceSHA256===hash,fixture.sha256);
   await page.getByRole('button',{name:'Add missed piece'}).click();
   await realCrop(page,0,{x:.04,y:.04,right:.96,bottom:.96});
   const card=page.locator('#multi24Grid .multi24-card').first();
   await card.getByRole('button',{name:'Suggest category, type and color'}).click();
   await card.locator('[data-recognition42="result"]').waitFor({timeout:250000});
   // SUBTYPE47 genuine previously misclassified black shirt: AI subtype
   // must be presented as a conflict, never trusted or preselected.
   const subtypeRisk=card.locator('[data-subtype-review47="manual-required"]');
   await subtypeRisk.waitFor({state:'visible'});
   assert.match(await subtypeRisk.innerText(),/Sweatshirt.*T-shirt|T-shirt.*Sweatshirt/);
   assert.match(await card.locator('[data-recognition42="result"]').innerText(),/Type uncertain/);
   assert.equal(await card.getByLabel('Main category').inputValue(),'Uncategorized');
   assert.equal(await card.getByLabel('Specific type').inputValue(),'Unknown');
   await fullShot(page,width,'second-source-ai-review',engine);
   await card.getByLabel('Main category').selectOption('Tops');
   await card.getByLabel('Specific type').selectOption('T-shirt');
   await card.getByLabel('Color (confirm visually)').fill('Black');
   await card.getByLabel('I confirm this visible garment, category and color').check();
   await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
   await page.waitForFunction(hash=>items.some(item=>item.sourceSHA256===hash),fixture.sha256);
   const row=await page.evaluate(hash=>items.find(item=>item.sourceSHA256===hash),fixture.sha256);
   assert.equal(row.originalPhoto.image,'data:image/jpeg;base64,'+shirt.toString('base64'));
   assert.equal(row.ownerId,'multi24-A');
   assert.equal(row.itemType,'T-shirt');
   assert.equal(row.color,'Black');
   assert.ok(row.recognitionSuggestion42);
   assert.equal(row.recognitionSuggestion42.itemType,null,'Dangerous AI subtype withheld');
   assert.equal(row.recognitionSuggestion42.inputBinding49?.sourceSHA256,fixture.sha256);
   assert.equal(row.recognitionSuggestion42.inputBinding49?.cropSHA256,
    sha(Buffer.from(row.image.split(',')[1],'base64')));
   assert.equal(row.recognitionSuggestion42.status,'category-only');
   assert.equal(row.recognitionSuggestion42.subtypeReview47?.needsConfirmation,true);
   assert.equal(row.recognitionSuggestion42.subtypeReview47?.candidate,'Sweatshirt');
   assert.equal(row.recognitionSuggestion42.subtypeReview47?.alternative,'T-shirt');
   assert.equal(row.recognitionSuggestion42.colorReview46?.needsConfirmation,true);
   assert.equal(row.recognitionSuggestion42.colorReview46?.source,'reviewed-crop-pixels');
   shirtEvidence={sha256:fixture.sha256,source:'archived fixture commons-0003',
    attribution:fixture.attribution,suggestion:row.recognitionSuggestion42,
    confirmed:{category:row.category,itemType:row.itemType,color:row.color}};
  }
  if(name66){
   // LABELSYNC66: real native owner-A saved details editor and real private
   // IndexedDB corrections. Typed values are synthetic QA actions, NOT
   // independent recognition accuracy labels or model inference.
   await page.evaluate(()=>switchView('closet'));
   await page.locator('#search').fill('Blue Sneakers');
   const oldCard=page.locator('#closetGrid article.card').filter({hasText:'Blue Sneakers'});
   assert.equal(await oldCard.count(),1,'Source-derived name should start Blue Sneakers');
   await fullShot(page,width,'05a-before-correction-old-blue-shoes-all',engine);
   await oldCard.getByRole('button',{name:'Adjust details'}).click();
   const editor=page.locator('dialog.clothing-editor');
   await editor.waitFor({state:'visible'});
   assert.equal(await editor.getByLabel('Item name',{exact:true}).inputValue(),'Blue Sneakers');
   await editor.locator('details.optional-details').evaluate(d=>{d.open=true;});
   await editor.getByLabel('Item type',{exact:true}).selectOption('Ankle boots');
   await editor.getByLabel('Color',{exact:true}).fill('Black');
   await editor.getByRole('button',{name:'Save changes'}).click();
   await editor.waitFor({state:'hidden',timeout:30000});
   const corrected=await page.evaluate(id=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').get(id);
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   }),byCategory.Shoes);
   assert.equal(corrected.name,'Black Ankle boots',
    'Auto-generated name should follow confirmed human color/subtype correction');
   assert.equal(corrected.itemType,'Ankle boots');
   assert.equal(corrected.color,'Black');
   assert.equal(corrected.colorSource,'user');
   assert.equal(corrected.category,'Shoes');
   assert.equal(corrected.sourceSHA256,sourceHash);
   assert.equal(corrected.originalPhoto.sha256,sourceHash);
   assert.equal(corrected.originalPhoto.image,'data:image/jpeg;base64,'+bytes.toString('base64'));
   assert.equal(corrected.photoOnly,true);
   assert.equal(corrected.threeDReady,false);
   await page.locator('#search').fill('Blue Sneakers');
   assert.equal(await page.locator('#closetGrid article.card').count(),0,
    'Stale generated title must NOT make corrected Black boots match Blue Sneakers search');
   await page.locator('#search').fill('Black Ankle boots');
   const renamed=page.locator('#closetGrid article.card').filter({hasText:'Black Ankle boots'});
   assert.equal(await renamed.count(),1);
   await fullShot(page,width,'05b-after-correction-new-black-boots-all',engine);
   // V4 real private owner export/import round trip must preserve corrected
   // title + category/type/color alongside the canonical original JPEG.
   const correctedBackup=await page.evaluate(async()=> (await window.restoreAtomic01Bridge.exportJSON()).data);
   assert.equal(correctedBackup.version,4);
   const backupShoe=correctedBackup.items.find(x=>x.id===byCategory.Shoes);
   assert.deepEqual([backupShoe.name,backupShoe.itemType,backupShoe.color],
    ['Black Ankle boots','Ankle boots','Black']);
   await page.evaluate(id=>new Promise((resolve,reject)=>{
    const tx=db.transaction('items','readwrite');
    tx.objectStore('items').delete(id);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   }),byCategory.Shoes);
   const restored=await page.evaluate(doc=>
    window.restoreAtomic01Bridge.importBackup(doc,{confirm:()=>true}),correctedBackup);
   assert.equal(restored.cancelled,undefined);
   const recovered=await page.evaluate(id=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').get(id);
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   }),byCategory.Shoes);
   assert.deepEqual([recovered.name,recovered.category,recovered.itemType,recovered.color],
    ['Black Ankle boots','Shoes','Ankle boots','Black']);
   assert.equal(recovered.originalPhoto.sha256,sourceHash);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.closetAuth?.user?.id==='multi24-A'&&items?.length===3);
   await page.evaluate(()=>switchView('closet'));
   await page.locator('#search').fill('Black Ankle boots');
   assert.equal(await page.locator('#closetGrid article.card').count(),1,
    'Corrected saved name should survive real V4 restore and reload');
   await page.locator('#search').fill('Blue Sneakers');
   assert.equal(await page.locator('#closetGrid article.card').count(),0);
  }
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false,null,{timeout:30000});
  assert.equal(await page.locator('#multi24Research img[src^="data:image/"]').count(),0);
  await shot(page,width,'05-logout-photo-cleared',engine);
  await login(page,'multi24-B');
  assert.equal(await page.evaluate(()=>items.length),0,'Owner B cannot see A original photo or private items');
  diagnostics.cases.push({engine,width,pieces:3,detectorMessageReplay57:detector57,detectorFloodBound58:detector58,detectorFailureRecovery65:detector65,detectorFaultMode65:failureMode65,
   nearDuplicateCropKeyRejected67:near67,
   uncommittedPhotoSwitchProtected68:photoSwitch70,
   verifiedPhotoSwitch70:source70||source71||source72,
    sameOriginalReviewPreserved72:source72,
   invalidSelectionDefeatsStaleValidProof71:source71,
   partialColorEditSavesOtherConfirmed73:edit73,
   cancellationPreservesHumanReview74:cancel74,
   individualReviewRemoveSafeguard76:remove76,
   unknownColorConfirmBlocked77:color77,
    reviewSnapshotSanitized78:snapshot78,
   correctedAutoNameAndIndex66:name66,stylePinnedAndSaved:true,styleLooks:style.lookCount,sourceSHA256:sourceHash,reviewAccuracy:'3/3 human confirmed',aiSuggestion:aiSuggestion??null,reopenedUserColorClear:recognition42,shirtEvidence,recognitionEvidence:shoes.recognitionSuggestion42??null,outfitSaved:true,v4Backup:true,v4Restore:true,reimportDuplicateBlocked:true,ownerPrivate:true});
  await context.close();await browser.close();browser=null;
 }
 // Reproducible image contact sheet from actual screenshots, no generated cloth.
 for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
  const series=diagnostics.screenshots.filter(s=>s.width===width&&s.file.startsWith(engine+'-')&&!s.fullPage);
  const composite=await sharp({create:{width:width*series.length,height:920,channels:4,background:'#ffffff'}})
   .composite(await Promise.all(series.map(async(s,i)=>({input:await readFile(dir+'/'+s.file),left:i*width,top:0})))).png().toBuffer();
  await writeFile(dir+'/contact-'+engine+'-'+width+'.png',composite);
 }
 assert.deepEqual(diagnostics.unexpectedUploads,[]);
 await writeFile(dir+'/acceptance.json',JSON.stringify(diagnostics,null,2));
 console.log((source70?'SOURCE70 INVALID/MALFORMED JPEG PRESERVES REVIEW + VALID PHOTO CANCEL/APPROVE PRIVATE OUTFIT PASS: ':switch68?'SWITCH68 GENUINE PHOTO CANCEL/ACCEPT + OWNER PRIVATE V4 BROWSER PASS: ':near67?'NEARDUP67 SHIFTED MANUAL CROP SAME SOURCE PRIVATE DUPLICATE REJECTED BROWSER PASS: ':name66?'LABELSYNC66 ORIGINAL-PHOTO REVIEW -> CORRECTED SEARCH -> PRIVATE V4 RESTORE BROWSER PASS: ':detector65?'RECOVERY65 WORKER FAILURE -> REAL ORIGINAL PHOTO MANUAL PRIVATE CLOSET PASS: ':detector58?'BOUNDS58 1000-MESSAGE DETECTOR FLOOD -> 12 AUTOS + REAL PRIVATE REVIEW PASS: ':detector57?'DETECTOR57 WORKER REPLAY -> REAL SOURCE / CROP / PRIVATE CLOSET GATE SUCCESS: ':'INTEGRATION12 MULTI CAPTURE -> NATIVE STYLE BROWSER SUCCESS: ')+JSON.stringify({sourceSHA256:sourceHash,cases:diagnostics.cases.length,screenshots:diagnostics.screenshots.length,license,detector57,realSegFormerAccuracyMeasured:false}));
}catch(error){
 diagnostics.failure=String(error.stack||error);
 await writeFile(dir+'/acceptance.json',JSON.stringify(diagnostics,null,2));
 throw error;
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
