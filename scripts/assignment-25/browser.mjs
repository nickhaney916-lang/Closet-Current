import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';
import sharp from 'sharp';

const cloud = process.env.SUPABASE_TEST_ENV ? await import('../assignment-21/local-http.mjs') : null;
const root = resolve('dist');
const types = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.wasm':'application/wasm'};
const table = '/rest/v1/closet_backups';
const storage = '/storage/v1/object/closet-private/';
const rpc = '/rest/v1/rpc/save_closet_backup';
const server = createServer(async (req,res) => {
 try {
  const pathname = new URL(req.url,'http://127.0.0.1').pathname;
  const file = resolve(root,'.'+pathname);
  assert.ok(file.startsWith(root+sep));
  let bytes = await readFile(file);
  if (cloud && ['auth.js','cloud-backup.js'].includes(pathname.slice(1))) {
   let text = bytes.toString();
   for (const [name,value] of [[pathname==='/auth.js'?'URL':'BASE',cloud.endpoint.origin],['KEY',cloud.key]]) {
    const pattern = new RegExp('\\b'+name+"='[^']+'");
    assert.match(text,pattern);
    text = text.replace(pattern,()=>name+'='+JSON.stringify(value));
   }
   bytes = Buffer.from(text);
  }
  res.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream'}).end(bytes);
 } catch {
  res.writeHead(404).end();
 }
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin = 'http://127.0.0.1:'+server.address().port;
const hash = bytes=>createHash('sha256').update(bytes).digest('hex');

async function makeOwner() {
 const email = randomUUID()+'@example.test', password = randomUUID();
 if (!cloud) return {id:email.split('@')[0],email,password};
 const signup = await cloud.request('/auth/v1/signup',null,'POST',{email,password});
 assert.ok(signup.ok,'Disposable signup failed');
 return {email,password,id:cloud.json(signup).user.id};
}

async function remote(owner, viewer=owner) {
 const session = await cloud.request('/auth/v1/token?grant_type=password',null,'POST',{email:viewer.email,password:viewer.password});
 assert.ok(session.ok,'Independent disposable login failed');
 const response = await cloud.request(table+'?owner_id=eq.'+owner.id,cloud.json(session).access_token);
 assert.ok(response.ok,'Independent backup read failed');
 return cloud.json(response)[0];
}

async function jpeg(index) {
 const pixels = Buffer.alloc(96*120*3);
 pixels.writeUInt32BE(index+1,0);
 for (let offset=4;offset<pixels.length;offset++) pixels[offset]=(offset*(31+index)+Math.floor(index/256)*17)%251;
 return sharp(pixels,{raw:{width:96,height:120,channels:3}}).jpeg({quality:87}).toBuffer();
}

async function wardrobe(owner,total,offset) {
 return Promise.all(Array.from({length:total},async (_,index)=>{
  const bytes = await jpeg(index+offset), digest = hash(bytes);
  const image = 'data:image/jpeg;base64,'+bytes.toString('base64');
  const bottom = index===1;
  return {id:'fixture-'+index,ownerId:owner.id,name:'Piece '+String(index).padStart(3,'0'),
   category:bottom?'Bottoms':'Tops',itemType:bottom?'Jeans':'T-shirt',color:'Blue',
   image,originalPhoto:{image,sha256:digest},sourceSHA256:digest,sourceHashVerified:true,
   sourcePhotoOriginal:true,ownerReviewed:true,singleGarmentVerified:true,userAdjusted:true};
 }));
}

async function exercise(browser,engine,width,total) {
 const a=await makeOwner(), b=await makeOwner();
 const rows=await wardrobe(a,total,0), other=await wardrobe(b,1,540);
 const imported=await jpeg(541), importedDigest=hash(imported);
 const expected=new Map(rows.map(row=>[row.id,row.sourceSHA256]));
 const cycles=[], expectedWear=[], errors=[];
 let saved=[], revision=0, abortPublish=false, interrupted=false, stage='bootstrap';
 const counts={requests:0,uploads:0,publishes:0};
 const accounts=[a,b];
 const open=async()=>{
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const req=route.request(), target=new URL(req.url());
   counts.requests++;
   if (target.origin===origin) return route.continue();
   if (cloud && target.origin===cloud.endpoint.origin) {
    if (target.pathname.startsWith(storage)&&req.method()==='POST') counts.uploads++;
    if (target.pathname===rpc&&req.method()==='POST') {
     counts.publishes++;
     if (abortPublish) {
      interrupted=true;
      return route.abort('connectionreset');
     }
    }
    return route.continue();
   }
   // Local browser smoke only. All hosted traffic is intercepted or aborted.
   if (!cloud && target.hostname==='hlkgymugtfbirlpunsra.supabase.co') {
    if (target.pathname==='/auth/v1/logout') return route.fulfill({status:204});
    if (target.pathname==='/auth/v1/token') {
     const payload=req.postDataJSON();
     const owner=accounts.find(account=>payload.email===account.email||payload.refresh_token===account.id);
     if (owner) return route.fulfill({json:{access_token:'test-'+owner.id,refresh_token:owner.id,
      expires_in:3600,user:{id:owner.id,email:owner.email}}});
    }
   }
   return route.abort();
  });
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror',()=>errors.push('uncaught page error'));
  return {context,page};
 };
 const start=await open(), page=start.page;
 const ready=(tab,owner)=>tab.waitForFunction(id=>typeof db!=='undefined'&&db?.name==='closet-current-user-'+id&&boardInitialized,owner.id);
 const login=async(tab,owner)=>{
  await tab.locator('#authEmail').fill(owner.email);
  await tab.locator('#authPassword').fill(owner.password);
  await tab.locator('#authSubmit').tap();
  await ready(tab,owner);
 };
 const logout=async()=>{
  await page.locator('.account-menu summary').tap();
  const reloaded=page.waitForEvent('load');
  await page.locator('#logout').tap();
  await reloaded;
  await page.locator('#authGate').waitFor();
  assert.ok(await page.locator('#appShell').isHidden());
 };
 const seed=async fixture=>{
  await page.evaluate(async records=>{
   await writeAll(records);
   items=(await readAll()).map(normalizeClothing);
   render();
  },fixture);
 };
 const backedUp=tab=>tab.waitForFunction(()=>document.querySelector('#cloudStatus').textContent==='Cloud backup up to date',
  null,{timeout:90000});
 const sync=async()=>{
  const menu=page.locator('.account-menu');
  if (await menu.getAttribute('open')===null) await menu.locator('summary').tap();
  await page.locator('#syncCloset').tap();
  await backedUp(page);
 };
 const state=async tab=>tab.evaluate(async()=>{
  const tx=db.transaction(['items','state']);
  const get=req=>new Promise((done,fail)=>{req.onsuccess=()=>done(req.result);req.onerror=()=>fail(req.error);});
  const [items,board,wear,marker]=await Promise.all([get(tx.objectStore('items').getAll()),
   ...['outfit-board','outfit-wear-history-v1','cloud-sync'].map(id=>get(tx.objectStore('state').get(id)))]);
  const garments=await Promise.all(items.map(async item=>{
   const encoded=item.originalPhoto?.image?.split(',')[1];
   const bytes=encoded?Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)):new Uint8Array();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    n=>n.toString(16).padStart(2,'0')).join('');
   return {id:item.id,owner:item.ownerId,digest,source:item.sourceSHA256,receipt:item.originalPhoto?.sha256};
  }));
  return {garments,saved:board?.saved??[],wear:wear?.events??[],marker:marker&&{dirty:marker.dirty,revision:marker.baseVersion}};
 });
 const verify=async (tab,owner,ledger,outfits,wear)=>{
  const actual=await state(tab);
  assert.equal(new Set(actual.garments.map(item=>item.id)).size,ledger.size);
  assert.equal(actual.garments.length,ledger.size,'Garment count drift');
  for (const item of actual.garments) {
   assert.ok(ledger.has(item.id),'Unexpected garment identity');
   assert.equal(item.owner,owner.id,'Foreign garment owner');
   assert.equal(item.digest,ledger.get(item.id),'Original JPEG changed');
   assert.equal(item.source,item.digest);
   assert.equal(item.receipt,item.digest);
  }
  assert.deepEqual(actual.saved.map(({name,slots})=>({name,slots})),outfits,'Saved outfit drift');
  assert.deepEqual(actual.wear.map(({name,slots})=>({name,slots})),wear,'Wear ledger drift');
  assert.equal(new Set(actual.wear.map(event=>event.id)).size,wear.length);
  return actual.marker;
 };
 const builder=async()=>{
  await page.locator('#moreMenu summary').tap();
  await page.locator('#moreMenu button[data-view=builder]').tap();
 };
 const pick=async(slot,index)=>{
  await page.locator('.board-slot-'+slot).tap({position:{x:12,y:12}});
  await page.locator('#boardPickerItems .board-pick').filter({
   has:page.getByText(rows[index].name,{exact:true})}).tap();
  await page.evaluate(()=>writes);
 };
 const label=async name=>{
  await page.locator('#boardName').fill(name);
  await page.locator('#boardName').press('Tab');
  await page.evaluate(()=>writes);
 };
 const library=page.locator('#savedBoards');
 const reopen=name=>library.getByRole('button',{name,exact:true}).tap();
 try {
  await page.goto(origin+'/index.html');
  await login(page,a);
  await seed(rows);
  if (cloud) {
   await sync();
   const initial=await remote(a);
   assert.equal(initial.document.items.length,total);
   revision=initial.revision;
  }
  for (let cycle=0;cycle<(total===500?1:10);cycle++) {
   const began=performance.now(), before={...counts};
   stage='cycle '+(cycle+1)+' browse';
   await page.locator('.main-nav button[data-view=closet]').tap();
   await page.locator('#search').fill(rows[cycle+2].name);
   await page.locator('#closetGrid').getByText(rows[cycle+2].name,{exact:true}).waitFor();
   if (cycle===0 && total!==500) {
    stage='owner-reviewed JPEG import';
    await page.locator('.main-nav button[data-view=scan]').tap();
    await page.locator('#clothingPhotos').setInputFiles({name:'endurance.jpg',mimeType:'image/jpeg',buffer:imported});
    await page.waitForFunction(()=>batch.some(item=>item.importFilename==='endurance.jpg'));
    await verify(page,a,expected,saved,expectedWear);
    await page.locator('#moreMenu summary').tap();
    await page.locator('#moreMenu button[data-view=review]').tap();
    await page.locator('#reviewGrid article.photo-result').getByRole('button',{name:'Adjust',exact:true}).tap();
    const editor=page.locator('dialog.photo-adjust');
    await editor.getByLabel('Main category').selectOption('Tops');
    await editor.getByLabel('Item type').selectOption('T-shirt');
    await editor.getByLabel('Color',{exact:true}).fill('Blue');
    await editor.getByLabel('I verified the category, clothing type and color').check();
    await editor.getByLabel('I confirmed this photo shows one garment').check();
    await editor.getByRole('button',{name:'Save changes',exact:true}).tap();
    await editor.waitFor({state:'hidden'});
   await page.waitForFunction(()=>!localPending.size&&!automaticRunning);
    const admitted=(await state(page)).garments.find(row=>row.digest===importedDigest);
    assert.ok(admitted,'Owner-approved JPEG missing');
    expected.set(admitted.id,importedDigest);
   }
   stage='cycle '+(cycle+1)+' outfit';
   stage='cycle '+(cycle+1)+' open builder';
   await builder();
   stage='cycle '+(cycle+1)+' pick top';
   await pick('top',cycle+2);
   stage='cycle '+(cycle+1)+' pick bottom';
   await pick('bottom',1);
   const slots={top:rows[cycle+2].id,bottom:rows[1].id};
   const name='Daily outfit '+(cycle+1), updated=name+' edited';
   await label(name);
   stage='cycle '+(cycle+1)+' save outfit';
   await page.locator('#saveBoard').tap();
   await page.waitForFunction(()=>!document.getElementById('saveBoard').disabled);
   assert.match(await page.locator('#boardSaveStatus').textContent(),/^Outfit saved with references/);
   stage='cycle '+(cycle+1)+' reopen outfit';
   await reopen(name);
   await label(updated);
   stage='cycle '+(cycle+1)+' update outfit';
   await page.locator('#updateSavedOutfit').tap();
   stage='cycle '+(cycle+1)+' reopen updated outfit';
   await reopen(updated);
   if (cycle===1) {
    await page.locator('#saveBoard').tap();
    await page.getByText('This exact outfit is already saved.',{exact:false}).waitFor();
   }
   saved=[...saved,{name:updated,slots}];
   stage='cycle '+(cycle+1)+' original preview';
   await page.locator('#mission4Preview1054Section button').tap();
   await page.getByText('2 owner-confirmed original photo(s) verified.',{exact:false}).waitFor();
   const images=await page.locator('#mission4Preview1054Photos img').evaluateAll(nodes=>nodes.map(node=>node.src));
   assert.deepEqual(images.sort(),[rows[cycle+2].image,rows[1].image].sort());
   assert.equal(await page.locator('#outfit3D01Canvas').count(),0,'Unsupported fixture unexpectedly entered 3D');
   stage='cycle '+(cycle+1)+' record wear';
   await library.getByRole('button',{name:'I wore this · '+updated,exact:true}).tap();
   expectedWear.unshift({name:updated,slots});
   await page.waitForFunction(n=>outfitWearEvents.length===n,expectedWear.length);
   if (cycle===4) {
    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('#removeSavedOutfit').tap();
    await verify(page,a,expected,saved,expectedWear);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#removeSavedOutfit').tap();
    await library.getByRole('button',{name:updated,exact:true}).waitFor({state:'detached'});
    saved=saved.slice(0,-1);
   }
   if (cloud) {
    stage='cycle '+(cycle+1)+' backup';
    await backedUp(page);
    const backup=await remote(a);
    assert.ok(backup.revision>revision,'Remote revision did not advance');
    assert.deepEqual(backup.document.items.map(item=>item.id).sort(),[...expected.keys()].sort());
    const maxUploads=cycle===0&&total!==500?1:0;
    assert.ok(counts.uploads-before.uploads<=maxUploads,'An acknowledged original was uploaded again');
    revision=backup.revision;
   }
   await page.reload({waitUntil:'domcontentloaded'});
   await ready(page,a);
   const marker=await verify(page,a,expected,saved,expectedWear);
   if (cloud) assert.deepEqual(marker,{dirty:false,revision});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const receipt={engine,width,total,cycle:cycle+1,garments:expected.size,outfits:saved.length,
    wear:expectedWear.length,ms:Math.round(performance.now()-began),revision,
    heap:await page.evaluate(()=>performance.memory?.usedJSHeapSize??null),
    requests:counts.requests-before.requests,uploads:counts.uploads-before.uploads};
   cycles.push(receipt);
   console.log('ASSIGNMENT_25_CYCLE',JSON.stringify(receipt));
  }
  stage='account switch';
  await logout();
  await login(page,b);
  assert.equal((await state(page)).garments.length,0);
  await seed(other);
  await verify(page,b,new Map([[other[0].id,other[0].sourceSHA256]]),[],[]);
  if (cloud) {
   await sync();
   assert.ok((await remote(b)).document.items.length===1,'Owner B backup missing');
   assert.equal(await remote(a,b),undefined,'Cross-owner backup visible');
  }
  await logout();
  await login(page,a);
  await verify(page,a,expected,saved,expectedWear);
  if (cloud) {
   stage='interruption and fresh recovery';
   const last=await remote(a);
   abortPublish=true;
   await builder();
   const previous=saved.at(-1);
   await reopen(previous.name);
   const changed=previous.name+' recovered';
   await label(changed);
   await page.locator('#updateSavedOutfit').tap();
   await page.waitForFunction(()=>/Retrying when connected/.test(document.querySelector('#cloudStatus').textContent));
   assert.ok(interrupted);
   assert.deepEqual(await remote(a),last,'Interrupted write replaced last good backup');
   abortPublish=false;
   const uploads=counts.uploads;
   await sync();
   assert.equal(counts.uploads,uploads,'Outfit-only retry retransmitted originals');
   saved=[...saved.slice(0,-1),{...previous,name:changed}];
   assert.ok((await remote(a)).revision>last.revision);
   const fresh=await open();
   try {
    await fresh.page.goto(origin+'/index.html');
    await login(fresh.page,a);
    await backedUp(fresh.page);
    await verify(fresh.page,a,expected,saved,[]);
   } finally {
    await fresh.context.close();
   }
   assert.equal(counts.uploads,uploads,'Restore retransmitted originals');
  }
  assert.deepEqual(errors,[]);
  console.log('ASSIGNMENT_25_CELL',JSON.stringify({engine,width,total,cycles:cycles.length,
   backend:cloud?'disposable':'intercepted-auth',counts,interrupted}));
 } catch(error) {
  // Skip browser call logs, which may contain account or fixture identifiers.
  throw Error(engine+' '+width+' '+total+' '+stage+': '+error.message.split('\n')[0]);
 } finally {
  await start.context.close();
 }
}

try {
 const engines=Object.entries({chromium,webkit}).filter(([name])=>!process.env.A25_ENGINE||process.env.A25_ENGINE===name);
 assert.ok(engines.length,'Invalid browser engine');
 const failures=[];
 for (const [engine,type] of engines) {
  const executablePath=engine==='chromium'?process.env.A25_CHROMIUM:undefined;
  const browser=await type.launch({executablePath});
  console.log('ASSIGNMENT_25_BROWSER',engine,browser.version());
  try {
   for (const width of [320,390,430].filter(width=>!process.env.A25_WIDTH||width===Number(process.env.A25_WIDTH))) {
    for (const total of [25,100,500].filter(total=>!process.env.A25_TOTAL||total===Number(process.env.A25_TOTAL))) {
     try {
      await exercise(browser,engine,width,total);
     } catch(error) {
      console.error('ASSIGNMENT_25_FAIL',error.message);
      failures.push(error);
     }
    }
   }
  } finally {
   await browser.close();
  }
 }
 assert.equal(failures.length,0,'Endurance cell failures');
} finally {
 await new Promise(done=>server.close(done));
}
