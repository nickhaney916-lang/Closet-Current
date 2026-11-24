'use strict';
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {resolve}=require('node:path');

let source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
const replace=(anchor,change)=>{
 if(source.split(anchor).length!==2)throw Error('Source journey anchor changed: '+anchor);
 source=source.replace(anchor,change);
};
replace("args:['--no-sandbox']", "args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.env.P1666_VIDEO]");
replace("import assert from 'node:assert/strict';","import assert from 'node:assert/strict';\nimport sharp from 'sharp';");
const start=source.indexOf(" advance('normal-chooser-cancel-duplicate-and-oversize-no-write');");
const end=source.lastIndexOf('}catch(error){');
if(start<0||end<=start)throw Error('Source journey boundary changed');
source=source.slice(0,start)+`
 const home=()=>page.getByRole('button',{name:'Home',exact:true}).click();
 const nextScan=async()=>{
  await home();
  await page.locator('#home button.home-action[data-go-view="scan"]').click();
 };
 const confirmDialog=()=>page.once('dialog',dialog=>dialog.accept());
 const settled=()=>page.waitForFunction(()=>!automaticRunning&&!localPending.size&&!photoImportActive);
 const photoProof=async(name,staging=false)=>page.evaluate(async({name,staging})=>{
  const draft=await new Promise((resolve,reject)=>{
   const request=db.transaction('state').objectStore('state').get('draft');
   request.onsuccess=()=>resolve(request.result?.batch||[]);
   request.onerror=()=>reject(request.error);
  });
  const row=staging?draft[0]:(await readAll()).find(item=>item.name===name);
  if(!row)return null;
  const original=row.originalPhoto;
  const bytes=Uint8Array.from(atob(original.image.split(',')[1]),c=>c.charCodeAt(0));
  const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const module=await import('/native-canonical-photo-source-167.mjs');
  return {origin:original.origin,sha,receipt:row.sourceSHA256,fileHash:original.originalFileSha256,
   width:original.width,height:original.height,transformed:original.transformed,orientation:original.orientation,
   owner:row.ownerId,reviewed:row.ownerReviewed===true,valid:await module.verifyStoredCanonical(row),
   tamperedRejected:!await module.verifyStoredCanonical({...row,sourceSHA256:'0'.repeat(64)})};
 },{name,staging});
 const review=async(name,category,type,color,expectedCount)=>{
  await settled();
  await page.locator('#reviewGrid .photo-result button:has-text("Adjust")').first().click();
  const editor=page.locator('dialog.photo-adjust');
  await editor.waitFor({state:'visible'});
  await editor.getByLabel('Item name').fill(name);
  await editor.getByLabel('Main category').selectOption(category);
  await editor.getByLabel('Item type').selectOption(type);
  await editor.getByLabel('Color',{exact:true}).fill(color);
  const save=editor.getByRole('button',{name:'Save changes'});
  await save.click();
  assert.equal(await rowCount(),expectedCount);
  assert.equal(await editor.isVisible(),true);
  await editor.getByLabel('I verified the category, clothing type and color').check();
  await save.click();
  assert.equal(await rowCount(),expectedCount);
  await editor.getByLabel('I confirmed this photo shows one garment').check();
  await save.evaluate(button=>{button.click();button.click();});
  await editor.waitFor({state:'hidden'});
  await page.waitForFunction(n=>items.length===n,expectedCount+1);
  assert.equal(await rowCount(),expectedCount+1);
 };
 const openCamera=async()=>{
  await nextScan();
  await page.locator('#start').click();
  await page.locator('#takePhoto').waitFor({timeout:10000});
  await page.waitForFunction(()=>video.readyState>=2&&video.videoWidth>0,null,{timeout:10000});
 };
 let camera=null;
 if(engine==='chromium'){
  advance('native-virtual-camera-cancel-retake-and-persist');
  await openCamera();
  await page.locator('#stop').click();
  assert.equal(await rowCount(),2);
  assert.equal(await photoProof('',true),null);
  await openCamera();
  await page.locator('#takePhoto').click();
  await page.waitForFunction(()=>session===1);
  await page.locator('#stop').click();
  await settled();
  const discarded=await photoProof('',true);
  assert.equal(discarded.origin,'camera');
  confirmDialog();
  await page.locator('#discard').click();
  await page.waitForFunction(()=>batch.length===0);
  assert.equal(await photoProof('',true),null);
  await openCamera();
  // Hold only the real digest completion so the rapid Done click is
  // deterministic. Camera frames, JPEG encoding and IndexedDB remain native.
  await page.evaluate(()=>{
   const digest=crypto.subtle.digest.bind(crypto.subtle);
   crypto.subtle.digest=async(...args)=>{
    crypto.subtle.digest=digest;
    await new Promise(resolve=>{window.p1666ReleaseDigest=resolve;});
    return digest(...args);
   };
  });
  await page.locator('#takePhoto').click();
  await page.waitForFunction(()=>typeof window.p1666ReleaseDigest==='function');
  if(process.env.P1666_EXPECT_RED==='1'){
   assert.equal(await page.locator('#stop').isEnabled(),true);
   await page.locator('#stop').click();
   await page.evaluate(()=>window.p1666ReleaseDigest());
   await page.waitForFunction(()=>video.srcObject===null);
   await page.waitForFunction(()=>!captureProofTaking);
   assert.equal(await photoProof('',true),null);
   assert.equal(await rowCount(),2);
   console.log('P1666_RED',engine,width,'Done cancelled the in-flight shutter receipt');
  }else{
   assert.equal(await page.locator('#stop').isDisabled(),true);
   assert.equal(await page.locator('#takePhoto').isDisabled(),true);
   await page.evaluate(()=>window.p1666ReleaseDigest());
   await page.waitForFunction(()=>session===1);
   await page.locator('#stop').click();
   const draft=await photoProof('',true);
   assert.equal(draft.origin,'camera');
   assert.equal(draft.valid,true);
   assert.equal(draft.tamperedRejected,true);
   assert.equal(draft.sha,draft.receipt);
   assert.equal(draft.reviewed,false);
   assert.equal(draft.transformed,false);
   assert.equal(draft.orientation,1);
   assert.equal(draft.width,640);
   assert.equal(draft.height,480);
   assert.equal(await rowCount(),2);
   await review('P1666 camera top','Tops','T-shirt','Black',2);
   camera=await photoProof('P1666 camera top');
   assert.equal(camera.sha,draft.sha);
   assert.equal(camera.reviewed,true);
   assert.equal(camera.owner,'p99-A');
   assert.equal(await photoProof('',true),null);
   await page.locator('nav.main-nav button.tab[data-view="stylist"]').click();
   await page.locator('#stylistFocusItem').selectOption({label:'P1666 camera top · Black'});
   await page.locator('#createCollectionOutfits').click();
   const look=page.locator('.styled-outfit').first();
   await look.getByText('P1666 camera top',{exact:true}).waitFor();
   await look.getByRole('button',{name:'Adjust on outfit board'}).click();
   await page.locator('#mission4Preview1054Section button').click();
   await page.waitForFunction(()=>document.querySelectorAll('#mission4Preview1054Photos img').length===2);
   const sources=await page.locator('#mission4Preview1054Photos img').evaluateAll(async images=>Promise.all(images.map(async image=>{
    const bytes=Uint8Array.from(atob(image.getAttribute('src').split(',')[1]),c=>c.charCodeAt(0));
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
   })));
   assert.ok(sources.includes(camera.sha));
   assert.match(await page.locator('#mission4Preview1054Status').innerText(),/2D only/);
  }
 }else{
  advance('webkit-ordinary-media-availability');
  await nextScan();
  await page.locator('#start').click();
  await page.waitForFunction(()=>!cameraOpening,null,{timeout:12000});
  assert.equal(await page.locator('#takePhoto').isVisible(),false,'camera unexpectedly available without deterministic virtual input');
  const reason=await page.locator('#message').innerText();
  assert.ok(reason);
  console.log('P1666_WEBKIT_CAMERA_BLOCKED',width,reason);
 }
 if(process.env.P1666_EXPECT_RED!=='1'){
  advance('exif-and-png-normal-gallery');
  let count=camera?3:2;
  const fixtures=[
   {name:'p1666-exif.jpg',type:'image/jpeg',bytes:await sharp(originals[0].bytes).resize(600,400,{fit:'fill'}).withMetadata({orientation:6}).jpeg().toBuffer(),orientation:6,size:[400,600]},
   {name:'p1666-derived.png',type:'image/png',bytes:await sharp(originals[1].bytes).resize(400,600,{fit:'fill'}).png().toBuffer(),orientation:'browser-decoded',size:[400,600]},
  ];
  for(const fixture of fixtures){
   await nextScan();
   const imports=page.locator('details.saved-imports');
   if(!await imports.evaluate(el=>el.open))await imports.locator('summary').click();
   const [chooser]=await Promise.all([page.waitForEvent('filechooser'),imports.locator('label').filter({hasText:'Choose clothing photos'}).click()]);
   await chooser.setFiles({name:fixture.name,mimeType:fixture.type,buffer:fixture.bytes});
   await page.waitForFunction(()=>batch.length===1);
   const draft=await photoProof('',true);
   assert.equal(draft.valid,true);
   assert.equal(draft.tamperedRejected,true);
   assert.equal(draft.sha,draft.receipt);
   assert.equal(draft.fileHash,createHash('sha256').update(fixture.bytes).digest('hex'));
   assert.equal(draft.orientation,fixture.orientation);
   assert.deepEqual([draft.width,draft.height],fixture.size);
   assert.equal(draft.transformed,fixture.type==='image/png');
   assert.equal(draft.sha===draft.fileHash,fixture.type==='image/jpeg');
   assert.equal(await rowCount(),count);
   const name='P1666 '+fixture.name;
   const garment=fixture.type==='image/jpeg'?['Tops','T-shirt','Black']:['Bottoms','Jeans','Blue'];
   await review(name,...garment,count);
   count++;
   assert.equal((await photoProof(name)).sha,draft.sha);
  }
  await nextScan();
  await page.locator('#clothingPhotos').setInputFiles({name:'duplicate-original.jpg',mimeType:'image/jpeg',buffer:originals[0].bytes});
  await page.waitForFunction(()=>!photoImportActive&&window.__lastPhotoImportResult?.results?.[0]?.status==='duplicate');
  assert.equal(await rowCount(),count);
  assert.equal(await photoProof('',true),null);
  await page.locator('#clothingPhotos').setInputFiles({name:'invalid.jpg',mimeType:'image/jpeg',buffer:Buffer.from('Not a JPEG')});
  await page.waitForFunction(()=>!photoImportActive);
  assert.equal(await rowCount(),count);
  assert.equal(await photoProof('',true),null);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(n=>db?.name==='closet-current-user-p99-A'&&items.length===n,count);
  if(camera)assert.equal((await photoProof('P1666 camera top')).sha,camera.sha);
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.locator('#authGate').waitFor({state:'visible'});
  await signIn('p99-B');
  assert.equal(await rowCount(),0);
  assert.equal(await photoProof('',true),null);
  await page.locator('nav.main-nav button.tab[data-view="stylist"]').click();
  assert.equal(await page.locator('#stylistFocusItem option').count(),1);
  assert.deepEqual(errors,[]);
  console.log('P1666_PASS',JSON.stringify({engine,version:browser.version(),width,camera:camera?'native virtual device':'blocked',acceptedRows:count,cameraControls:camera?3:null,reviewControls:4,editedDetailFields:3}));
 }
`+source.slice(end);
const runner='scripts/.p1666-source-'+randomUUID()+'.mjs';
try{
 fs.writeFileSync(runner,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[runner],{stdio:'inherit',
  env:{...process.env,P1666_VIDEO:resolve(process.env.P1666_VIDEO||'/tmp/p1666-camera.y4m'),P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;
 process.exitCode=run.status??1;
}finally{if(fs.existsSync(runner))fs.unlinkSync(runner);}
