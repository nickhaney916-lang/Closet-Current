'use strict';
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
let source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
function replace(anchor,body){
 if(source.split(anchor).length!==2)throw Error('Connectivity journey anchor changed: '+anchor);
 source=source.replace(anchor,body);
}
replace("const server=createServer(async(req,res)=>{","let backupProbeCount=0;\nconst server=createServer(async(req,res)=>{");
replace("  if(audit&&pathname.startsWith('/auth/v1/')){",`
  if(pathname.startsWith('/rest/v1/')){
   assert.equal(req.method,'GET','unavailable backup cannot write');
   backupProbeCount++;
   res.writeHead(503,{'content-type':'application/json','cache-control':'no-store'});
   res.end('{}');return;
  }
  if(audit&&pathname.startsWith('/auth/v1/')){
`);
replace("  if(audit&&pathname==='/cloud-backup.js')bytes=Buffer.from(cloudStub);",`
  if(audit&&pathname==='/cloud-backup.js'){
   const code=bytes.toString();
   assert.ok(code.includes(authOrigin));
   bytes=Buffer.from(code.replace(authOrigin,origin));
  }
`);
const start=source.indexOf(" if(!cacheOnly){\n  advance('normal-v3-private-export');");
const end=source.lastIndexOf('}catch(error){');
if(start<0||end<=start)throw Error('Connectivity journey boundary changed');
source=source.slice(0,start)+`
 advance('signed-owner-offline-trend-and-local-wardrobe');
 const nav=view=>page.locator('nav.main-nav button.tab[data-view="'+view+'"]').click();
 const builder=async()=>{
  if(!await page.locator('#moreMenu').evaluate(el=>el.open))await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 };
 const checkPhotos=async(expected=originals)=>{
  const rows=await page.evaluate(async()=>Promise.all((await readAll()).map(async row=>{
   const bytes=Uint8Array.from(atob(row.originalPhoto.image.split(',')[1]),c=>c.charCodeAt(0));
   const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
   return {sha,receipt:row.sourceSHA256,reviewed:row.ownerReviewed,owner:row.ownerId};
  })));
  assert.equal(rows.length,expected.length);
  for(const original of expected)assert.deepEqual(rows.find(row=>row.sha===original.sha),{sha:original.sha,receipt:original.sha,reviewed:true,owner:'p99-A'});
 };
 if(process.env.P1669_EXPECT_RED!=='1'){
  await nav('home');
  await page.locator('#home button.home-action[data-go-view="scan"]').click();
  await page.locator('#clothingPhotos').setInputFiles({name:secondOriginal.name+'.jpg',mimeType:'image/jpeg',buffer:secondOriginal.bytes});
  await page.waitForFunction(()=>batch.length===1&&!automaticRunning&&!localPending.size);
  assert.equal(await rowCount(),2,'unreviewed draft is excluded from the wardrobe');
 }
 await page.waitForFunction(()=>Boolean(activeTrendLibrary)&&!trendLoading);
 await nav('stylist');
 const remote='https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?*';
 let releaseFirst,firstStarted,requests=0;
 const first=new Promise(resolve=>{firstStarted=resolve;});
 const hold=new Promise(resolve=>{releaseFirst=resolve;});
 const bundled=await readFile('public/trend-data.json','utf8');
 await page.route(remote,async route=>{
  requests++;
  if(requests===1){firstStarted();await hold;}
  try{
   await route.fulfill(requests<=2?{status:503,body:'temporarily unavailable'}:{status:200,contentType:'application/json',body:bundled});
  }catch(error){
   if(!/abort|handled|closed|invalid interception/i.test(error.message))throw error;
  }
 });
 const create=page.locator('#createCollectionOutfits'),card=page.locator('.styled-outfit').first();
 await create.click();
 await first;
 await context.setOffline(true);
 try{
  await page.waitForFunction(()=>navigator.onLine===false);
  if(process.env.P1669_EXPECT_RED==='1'){
   let stalled=false;
   try{await card.waitFor({timeout:2000});}catch(error){if(error.name!=='TimeoutError')throw error;stalled=true;}
   assert.equal(stalled,true,'baseline should wait on interrupted trend fetch');
   assert.equal(await create.isDisabled(),true);
   console.log('P1669_RED',engine,width,'local suggestions stalled on an interrupted public fetch');
  }else{
   await card.waitFor({timeout:2000});
   assert.match(await page.locator('#stylistFreshness').innerText(),/Offline.*last verified/i);
   assert.equal(await create.isEnabled(),true);
   await card.getByRole('button',{name:'Adjust on outfit board'}).click();
   await page.locator('#boardName').fill('P1669 offline outfit');
   await page.locator('#saveBoard').click();
   await page.locator('#savedBoards').getByRole('button',{name:'P1669 offline outfit',exact:true}).waitFor();
   await page.locator('#savedBoards').getByRole('button',{name:outfitName,exact:true}).click();
   await page.locator('#mission4Preview1054Section button').click();
   await page.waitForFunction(()=>document.querySelectorAll('#mission4Preview1054Photos img').length===2);
   const photos=await page.locator('#mission4Preview1054Photos img').evaluateAll(list=>list.map(img=>img.getAttribute('src')));
   for(const original of originals)assert.ok(photos.includes(original.url));
   const wear=page.getByRole('button',{name:'I wore this · '+outfitName,exact:true});
   await wear.click();
   await page.locator('#outfitWearStatus').getByText('Outfit recorded for today.').waitFor();
   await wear.click();
   await page.locator('#outfitWearStatus').getByText('This combination is already recorded for today.').waitFor();
   await nav('closet');
   await page.locator('#search').fill(shirtName.split(' p1607-')[0]);
   assert.equal(await page.locator('#closetGrid article.card').count(),1);
   await checkPhotos();
   await page.waitForFunction(()=>/cloud backup pending/i.test(document.querySelector('#cloudStatus')?.textContent));
   assert.equal(await page.evaluate(()=>window.closetAuth.user.id),'p99-A');
   if(!await page.locator('#moreMenu').evaluate(el=>el.open))await page.locator('#moreMenu summary').click();
   await page.locator('#moreMenu button.tab[data-view="review"]').click();
   await page.locator('#reviewGrid .photo-result button:has-text("Adjust")').first().click();
   const editor=page.locator('dialog.photo-adjust');
   await editor.getByLabel('Item name').fill('P1669 offline reviewed original');
   await editor.getByLabel('Main category').selectOption('Tops');
   await editor.getByLabel('Item type').selectOption('T-shirt');
   await editor.getByLabel('Color',{exact:true}).fill('Black');
   await editor.getByLabel('I verified the category, clothing type and color').check();
   await editor.getByLabel('I confirmed this photo shows one garment').check();
   await editor.getByRole('button',{name:'Save changes'}).click();
   await editor.waitFor({state:'hidden'});
   await page.waitForFunction(()=>items.length===3&&batch.length===0);
   await checkPhotos([...originals,secondOriginal]);
  }
 }finally{releaseFirst();await context.setOffline(false);}
 if(process.env.P1669_EXPECT_RED!=='1'){
  const reconnectDeadline=Date.now()+8000;
  while(requests<2&&Date.now()<reconnectDeadline)await new Promise(resolve=>setTimeout(resolve,100));
  await page.waitForFunction(()=>navigator.onLine===true&&!trendLoading);
  assert.equal(requests,2,'one automatic trend retry after reconnect');
  await nav('stylist');
  await page.waitForFunction(()=>/Could not check for newer data/.test(document.querySelector('#stylistFreshness')?.textContent));
  await create.click();
  await card.waitFor();
  // Local outfit cards render immediately; the managed endpoint probe now
  // precedes the legacy feed request. Assert the exact count after the
  // actual refresh settles, not merely when the cached outfit card is visible.
  await page.waitForFunction(()=>!trendLoading&& !/Could not check/.test(document.querySelector('#stylistFreshness')?.textContent));
  assert.equal(requests,3,'one manual retry after the failed reconnect refresh');
  const acked=backupProbeCount;
  await context.setOffline(true);
  await page.waitForFunction(()=>!navigator.onLine);
  await context.setOffline(false);
  await page.waitForFunction(()=>navigator.onLine);
  const deadline=Date.now()+8000;
  while(backupProbeCount===acked&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,150));
  assert.ok(backupProbeCount>acked,'backup must retry after returning online');
  await page.waitForFunction(()=>/cloud backup pending/i.test(document.querySelector('#cloudStatus')?.textContent));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>db?.name==='closet-current-user-p99-A'&&boardInitialized);
  await builder();
  assert.equal(await page.locator('#savedBoards').getByRole('button',{name:'P1669 offline outfit',exact:true}).count(),1);
  await page.locator('#outfitWearPanel summary').click();
  await page.locator('#outfitWearHistory strong').getByText(outfitName,{exact:true}).waitFor();
  assert.equal(await page.locator('#outfitWearHistory strong').count(),1);
  await checkPhotos([...originals,secondOriginal]);
  await context.setOffline(true);
  await page.waitForFunction(()=>!navigator.onLine);
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  // Revocation must happen before any response or navigation from sign-out.
  await page.waitForFunction(()=>!window.closetAuth?.user?.id&&document.querySelector('#appShell')?.hidden===true).catch(error=>{
   if(!/Execution context was destroyed|ERR_INTERNET_DISCONNECTED|navigation/i.test(error.message))throw error;
  });
  await page.close();
  await context.setOffline(false);
  page=await context.newPage();
  audit.attach(page);
  page.on('pageerror',error=>errors.push('pageerror: '+clean(error.message).slice(0,120)));
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('#authGate').waitFor({state:'visible'});
  await signIn('p99-B');
  assert.equal(await rowCount(),0);
  await builder();
  assert.equal(await page.locator('#savedBoards').getByRole('button',{name:'P1669 offline outfit',exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  audit.verify();
  console.log('P1669_PASS',JSON.stringify({engine,version:browser.version(),width,originals:3,offlineOutfits:1,wear:1,backup:'503 stays pending; automatic retry verified'}));
 }
`+source.slice(end);
source=source.replaceAll('p99-A','a0000001-0000-4000-8000-000000000000')
 .replaceAll('p99-B','a0000002-0000-4000-8000-000000000000')
 .replace('p99-[AB]@example','a000000[12]-0000-4000-8000-000000000000@example');
const output='scripts/.p1669-offline-'+randomUUID()+'.mjs';
try{
 fs.writeFileSync(output,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;
 process.exitCode=run.status??1;
}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
