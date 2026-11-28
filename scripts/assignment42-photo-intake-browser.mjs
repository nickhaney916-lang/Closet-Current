import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, resolve} from 'node:path';
import {chromium, webkit} from 'playwright';
import sharp from 'sharp';

const [engine, directory, mode] = process.argv.slice(2);
const baseline = mode === 'baseline';
assert.ok(['chromium', 'webkit'].includes(engine) && directory);
const root = resolve(directory);
const contentTypes = {'.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
 '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml'};
const server = createServer(async (req, res) => {
 try {
  const file = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  assert.ok(file.startsWith(root + '/'));
  res.writeHead(200, {'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
   'Cache-Control':'no-store'});
  res.end(await readFile(file));
 } catch {
  if (!res.headersSent) res.writeHead(404);
  res.end();
 }
});
const fixtures = await Promise.all(Array.from({length:12}, async (_, index) => {
 const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320">' +
  '<rect width="240" height="320" fill="#e8e2da"/>' +
  '<path d="M75 40 45 60 20 120l40 13 10-25v167h100V108l10 25 40-13-25-60-30-20z" ' +
  'fill="rgb('+ (26 + index * 6) + ',74,129)"/></svg>';
 const buffer = await sharp(Buffer.from(svg)).jpeg().toBuffer();
 return {name:'fixture-'+index+'.jpg', mimeType:'image/jpeg', buffer};
}));
const digest = file => createHash('sha256').update(file.buffer).digest('hex');
assert.equal(new Set(fixtures.map(digest)).size, 12);
const badFile = {name:'broken.jpg', mimeType:'image/jpeg', buffer:Buffer.from('invalid JPEG')};
const unsupported = {name:'unsupported.svg', mimeType:'image/svg+xml', buffer:Buffer.from('<svg/>')};
const launch = {headless:true};
if (engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE) launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
const browser = await {chromium,webkit}[engine].launch(launch);
try {
 await new Promise(done => server.listen(0, '127.0.0.1', done));
 const url = 'http://127.0.0.1:'+server.address().port+'/index.html';
 for (const width of [320,390,430]) {
  for (const count of [1,5,10]) {
   const context = await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true});
   let owner = 'synthetic-intake-owner-a';
   let networkBlocked = false;
   await context.route('**/*', route => {
    const request = new URL(route.request().url());
    if (['blob:','data:'].includes(request.protocol)) return route.continue();
    if (networkBlocked) return route.abort('internetdisconnected');
    if (['127.0.0.1','localhost'].includes(request.hostname)) {
     // This fixture supplies authentication through Playwright. Keep the
     // worker out of that request path on reload so the token stays synthetic.
     if (request.pathname==='/sw.js') return route.abort();
     return route.continue();
    }
    if (request.hostname === 'hlkgymugtfbirlpunsra.supabase.co' &&
        request.pathname === '/auth/v1/token') {
     return route.fulfill({json:{access_token:'synthetic-access',refresh_token:'synthetic-refresh',
      expires_in:3600,user:{id:owner,email:'fixture@example.invalid',user_metadata:{username:'Fixture'}}}});
    }
    return route.abort();
   });
   await context.addInitScript(() => {
    localStorage.setItem('closet-current-auth-v1', JSON.stringify({epoch:'synthetic-epoch',
     access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600}));
    window.classifierRequests = 0;
    window.Worker = class {
     postMessage(request) {
      const send = response => this.onmessage?.({data:{id:request.id,...response}});
      if (request.type === 'load') setTimeout(() => send({type:'ready'}), 0);
      if (request.type === 'classify') {
       window.classifierRequests++;
       const result = {type:'result',strong:false,categoryConfirmed:false,choices:[],details:{}};
       setTimeout(() => {send(result);send(result);}, 15);
      }
     }
     terminate() {}
    };
   });
   const page = await context.newPage();
   try {
    await page.goto(url, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('appShell')?.hidden===false,null,{timeout:20000});
    await page.evaluate(()=>closetReady);
    await page.evaluate(() => {
     window.intakeSnapshot = {started:performance.now(),firstReview:null,decodePeak:0,decodeActive:0,raf:0};
     const intakeSnapshot = window.intakeSnapshot;
     const decode = captureProofFromFile;
     captureProofFromFile = async (...args) => {
      intakeSnapshot.decodeActive++;
      intakeSnapshot.decodePeak = Math.max(intakeSnapshot.decodeActive,intakeSnapshot.decodePeak);
      try {return await decode(...args);} finally {intakeSnapshot.decodeActive--;}
     };
     const observe = new MutationObserver(() => {
      if (intakeSnapshot.firstReview===null && !document.getElementById('review').hidden &&
          document.querySelector('#reviewGrid .photo-result')) {
       intakeSnapshot.firstReview = performance.now()-intakeSnapshot.started;
      }
     });
     observe.observe(document.getElementById('review'),{subtree:true,childList:true,attributes:true});
     function frame() {
      if (photoImportActive) intakeSnapshot.raf++;
      if (!window.__lastPhotoImportResult) requestAnimationFrame(frame);
     }
     requestAnimationFrame(frame);
    });
    const picker = page.locator('#clothingPhotos');
    await picker.setInputFiles(fixtures.slice(0,count));
    await page.waitForFunction(n => window.__lastPhotoImportResult?.results.length === n, count);
    await page.waitForFunction(() => !automaticRunning && !localPending.size);
    const queue = page.locator('#galleryIntake .intake-row');
    assert.equal(await queue.count(), baseline ? 0 : count);
    const evidence = await page.evaluate(async () => {
     const rows = await readDraft();
     return {...window.intakeSnapshot,elapsedMs:performance.now()-window.intakeSnapshot.started,
      totalBytes:rows.reduce((sum,row)=>sum+row.originalPhoto.image.length,0),
      drafts:rows.map(row=>({id:row.id,hash:row.sourceSHA256})), saved:(await readAll()).length,
      classifierRequests:window.classifierRequests};
    });
    assert.equal(evidence.decodePeak,1);
    assert.equal(evidence.classifierRequests,count);
    assert.equal(evidence.saved,0,'prediction must not write to the wardrobe');
    assert.deepEqual(evidence.drafts.map(row=>row.hash), fixtures.slice(0,count).map(digest));
    assert.equal(new Set(evidence.drafts.map(row=>row.id)).size,count);
    console.log(JSON.stringify({engine,width,count,mode:baseline?'baseline':'candidate',
     firstReviewMs:Math.round(evidence.firstReview),elapsedMs:Math.round(evidence.elapsedMs),
     draftSourceCharacters:evidence.totalBytes,decodePeak:evidence.decodePeak,frames:evidence.raf,classifierRequests:evidence.classifierRequests}));
    if (baseline || count!==10) continue;

    assert.equal(await page.locator('[data-intake-status="review"]').count(),10);
    const first = page.locator('#reviewGrid .photo-result').first();
    await first.getByRole('button',{name:'Adjust',exact:true}).click();
    const editor = page.locator('dialog.photo-adjust[open]');
    await editor.getByLabel('Item name').fill('Reviewed fixture');
    await editor.getByLabel('Main category').selectOption('Tops');
    await editor.getByLabel('Item type').selectOption('T-shirt');
    await editor.getByLabel('Color',{exact:true}).fill('Blue');
    await editor.getByLabel('I verified the category, clothing type and color').check();
    await editor.getByLabel('I confirmed this photo shows one garment').check();
    await editor.locator('form').evaluate(form=>form.requestSubmit());
    await page.waitForFunction(()=>items.length===1);
    assert.equal(await page.locator('[data-intake-status="saved"]').count(),1);
    const saved = await page.evaluate(async ()=>(await readAll())[0]);
    assert.equal(saved.id,evidence.drafts[0].id);
    assert.equal(saved.originalPhoto.sha256,digest(fixtures[0]));
    assert.deepEqual(Buffer.from(saved.originalPhoto.image.split(',')[1],'base64'),fixtures[0].buffer);

    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#reviewGrid .photo-result').first().getByRole('button',{name:'Skip photo'}).click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-intake-status="skipped"]').length===1);
    assert.equal(await page.evaluate(async ()=>(await readDraft()).length),8);

    await picker.setInputFiles([badFile, fixtures[0], fixtures[1], unsupported]);
    await page.waitForFunction(()=>window.__lastPhotoImportResult?.results.length===4 && !automaticRunning);
    assert.equal(await page.locator('[data-intake-status="error"]').count(),2);
    assert.equal(await page.locator('[data-intake-status="duplicate"]').count(),1);
    assert.equal(await page.locator('[data-intake-status="review"]').count(),1);
    const retry = page.getByRole('button',{name:'Retry photo 1'});
    await retry.click();
    await page.waitForFunction(()=>!photoImportActive);
    assert.equal(await retry.count(),1);
    assert.equal(await page.evaluate(async ()=>(await readAll()).length),1);

    await picker.setInputFiles(fixtures);
    assert.match(await page.locator('#message').textContent(),/Choose up to 10/);
    assert.equal(await queue.count(),4);
    assert.equal(await page.evaluate(async ()=>(await readAll()).length),1);

    // Fail the exact required draft write once, then use the normal retry
    // card to save that original while a second photo succeeds independently.
    await page.evaluate(() => {
     const persist=persistDraft;
     persistDraft=options=>{
      if(options.required && options.record?.importFilename==='fixture-10.jpg' && !window.quotaFailed){
       window.quotaFailed=true;
       return Promise.reject(Object.assign(new Error('Synthetic disk quota'),{code:'CAPTURE_STORAGE_FAILED'}));
      }
      return persist(options);
     };
    });
    await picker.setInputFiles(fixtures.slice(10,12));
    await page.waitForFunction(()=>window.__lastPhotoImportResult?.results.length===2 && !automaticRunning);
    assert.equal(await page.locator('[data-intake-status="storage"]').count(),1,
     JSON.stringify(await page.evaluate(()=>window.__lastPhotoImportResult)));
    assert.equal(await page.locator('[data-intake-status="review"]').count(),1);
    const beforeRetry=await page.evaluate(()=>batch.find(row=>row.importFilename==='fixture-10.jpg').id);
    // WPE's offline override also blocks local Blob reads in this runner.
    // Block all HTTP traffic while preserving browser-local file data.
    networkBlocked=true;
    if(engine==='chromium')await context.setOffline(true);
    await page.getByRole('button',{name:'Retry saving this unsaved original photograph privately'}).click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-intake-status="review"]').length===2);
    const durable=await page.evaluate(async id=>(await readDraft()).find(row=>row.id===id),beforeRetry);
    assert.equal(durable?.sourceSHA256,digest(fixtures[10]));
    assert.equal(await page.evaluate(async ()=>(await readAll())[0].id),saved.id);
    if(engine==='chromium')await context.setOffline(false);
    networkBlocked=false;

    // Hold native decoding to exercise cancellation and sign-out with work in flight.
    await page.evaluate(() => {
     const decode=captureProofFromFile;
     captureProofFromFile=async (...args)=>{
      await new Promise(resolve=>{window.releaseIntake=resolve;});
      return decode(...args);
     };
    });
    await picker.setInputFiles(fixtures.slice(0,5));
    await page.waitForFunction(()=>window.releaseIntake);
    await page.getByRole('button',{name:'Skip photo 2'}).click();
    await page.getByRole('button',{name:'Cancel remaining photos'}).click();
    assert.equal(await page.locator('[data-intake-status="skipped"]').count(),4);
    await page.evaluate(()=>switchView('closet'));
    await page.evaluate(()=>window.releaseIntake());
    await page.waitForFunction(()=>!photoImportActive);
    assert.equal(await page.locator('[data-intake-status="duplicate"]').count(),1);
    assert.equal(await page.locator('#closet').isVisible(),true);
    await page.evaluate(()=>switchView('review'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth),width);

    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('appShell')?.hidden===false,null,{timeout:20000});
    await page.evaluate(()=>closetReady);
    assert.equal(await page.evaluate(async ()=>(await readAll())[0].id),saved.id);
    assert.equal(await queue.count(),0);
    await page.evaluate(() => {
     const decode=captureProofFromFile;
     captureProofFromFile=async (...args)=>{
      await new Promise(resolve=>{window.releaseIntake=resolve;});
      return decode(...args);
     };
    });
    await picker.setInputFiles(fixtures.slice(0,5));
    await page.waitForFunction(()=>window.releaseIntake);
    await page.evaluate(() => {
     window.dispatchEvent(new Event('closet:session-locked'));
     window.releaseIntake();
    });
    assert.equal(await queue.count(),0);
    assert.equal(await page.evaluate(()=>items.length+batch.length),0);
    owner='synthetic-intake-owner-b';
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('appShell')?.hidden===false,null,{timeout:20000});
    await page.evaluate(()=>closetReady);
    assert.equal(await page.evaluate(async ()=>(await readAll()).length+(await readDraft()).length),0);
    // Exercise the real shutter and original-JPEG proof with a synthetic
    // stream and pre-encoded frames. No physical camera is used.
    await page.evaluate(sourceURLs=>{
     let index=0;
     snap=()=>sourceURLs[index++];
     Object.defineProperties(video,{
      videoWidth:{configurable:true,value:240},videoHeight:{configurable:true,value:320},
      readyState:{configurable:true,value:2},
      srcObject:{configurable:true,writable:true,value:null}
     });
     video.play=async()=>{};
     // Exercise shutter and storage without a headless audio backend.
     window.AudioContext=class {async resume(){}};
     Object.defineProperty(navigator,'mediaDevices',{
      configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[]})}
     });
     document.getElementById('sound').checked=false;
     switchView('scan');
    },fixtures.slice(0,11).map(file=>'data:image/jpeg;base64,'+file.buffer.toString('base64')));
    await page.locator('#start').click();
    const shutter=page.locator('#takePhoto');
    await shutter.waitFor({timeout:10000});
    for(let index=1;index<=10;index++){
     await shutter.click();
     await page.waitForFunction(n=>session===n&&!captureProofTaking,index);
    }
    await shutter.click();
    await page.waitForFunction(()=>document.getElementById('scan').hidden && !automaticRunning);
    const camera=await page.evaluate(async()=>({rows:(await readDraft()).map(row=>({
     id:row.id,hash:row.originalPhoto.sha256,origin:row.originalPhoto.origin
    })),saved:(await readAll()).length}));
    assert.equal(camera.rows.length,10);
    assert.equal(camera.saved,0);
    assert.match(await page.locator('#message').textContent(),/Review or skip a camera photo/);
    assert.deepEqual(camera.rows.map(row=>row.hash),fixtures.slice(0,10).map(digest));
    assert.ok(camera.rows.every(row=>row.origin==='camera'));
    assert.equal(new Set(camera.rows.map(row=>row.id)).size,10);
    console.log(JSON.stringify({engine,width,acceptance:'PASS',savedSourceHash:saved.sourceSHA256}));
   } finally {
    await context.close();
   }
  }
 }
} finally {
 await browser.close();
 server.close();
}
