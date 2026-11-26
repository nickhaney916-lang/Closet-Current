import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';

const root = resolve('dist');
const mime = {'.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
 '.json':'application/json', '.css':'text/css'};
const server = createServer(async (req, res) => {
 try {
  const {pathname} = new URL(req.url, 'http://127.0.0.1');
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  assert.ok(file.startsWith(root + sep));
  const bytes = await readFile(file);
  res.writeHead(200, {'content-type':mime[extname(file)] ?? 'application/octet-stream'}).end(bytes);
 } catch {
  res.writeHead(404).end();
 }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;
const jpeg = await readFile('benchmark/fixtures/commons-0053.jpg');
const image = 'data:image/jpeg;base64,' + jpeg.toString('base64');
const sha = createHash('sha256').update(jpeg).digest('hex');
const fixture = owner => ({
 id:'piece', ownerId:owner, name:'Original', category:'Tops', itemType:'T-shirt', color:'Blue',
 image, originalPhoto:{image,sha256:sha}, sourceSHA256:sha, sourceHashVerified:true,
 sourcePhotoOriginal:true, ownerReviewed:true, singleGarmentVerified:true
});

async function open(context) {
 const page = await context.newPage();
 await page.goto(origin, {waitUntil:'domcontentloaded'});
 await page.waitForFunction(() => typeof db !== 'undefined' && db && boardInitialized);
 return page;
}

async function snapshot(page) {
 return page.evaluate(() => new Promise((resolve, reject) => {
  const tx = db.transaction(['items','state']);
  const rows = tx.objectStore('items').getAll();
  const state = tx.objectStore('state');
  const draft = state.get('draft');
  const board = state.get('outfit-board');
  const wear = state.get('outfit-wear-history-v1');
  const marker = state.get('cloud-sync');
  tx.oncomplete = () => resolve({items:rows.result, drafts:draft.result?.batch ?? [],
   saved:board.result?.saved ?? [], current:board.result?.current ?? null, wear:wear.result?.events ?? [], revision:marker.result?.localRevision ?? 0});
  tx.onabort = () => reject(tx.error);
 }));
}

async function closeAndCheckSession(context, setOwner, ownerA, ownerB) {
 setOwner(ownerA);
 let page = await open(context);
 try {
  const ownerRow = fixture(ownerA);
  await page.evaluate(async row => {
   await writeAll([row]);
   items = (await readAll()).map(normalizeClothing);
   render();
   if (!document.querySelector('#appShell img[src^="data:image/jpeg"]'))
    throw Error('Synthetic owner preview did not render');
   let release;
   writes = new Promise(resolve => {release = resolve;});
   window.outcome = null;
   const pending = removeItem(row.id, row);
   pending.then(() => {window.outcome = 'resolved';}, () => {window.outcome = 'rejected';});
   // The auth test double only simulates a revoked lease. Exercise the live
   // app's lock handler and release the parked mutation after that event.
   window.closetAuth.assertCurrent = () => {throw Error('Synthetic session revoked');};
   window.dispatchEvent(new Event('closet:session-locked'));
   release();
   await pending.catch(() => {});
  }, ownerRow);
  assert.equal(await page.evaluate(() => window.outcome),'rejected');
  assert.equal(await page.evaluate(() => items.length + batch.length),0);
  assert.equal(await page.locator('#appShell img[src^="data:image/"], #appShell img[src^="blob:"]').count(),0);
  await page.close();
  setOwner(ownerB);
  page = await open(context);
  assert.deepEqual((await snapshot(page)).items,[]);
  await writeOwnerB(page, fixture(ownerB));
  await page.close();
  setOwner(ownerA);
  page = await open(context);
  assert.deepEqual((await snapshot(page)).items,[ownerRow]);
 } finally {
  await page.close();
 }
}

async function writeOwnerB(page, row) {
 await page.evaluate(row => writeAll([row]), row);
 assert.deepEqual((await snapshot(page)).items,[row]);
}

async function armAndStart(page, phase, action, row, board, suggestion) {
 await page.evaluate(({phase, action, row, board, suggestion}) => {
  window.boundary = null;
  window.outcome = null;
  if (phase === 'before-write') {
   writes = new Promise(() => {});
   if (action === 'wear') transactOutfitWear = () => new Promise(() => {});
   if (action !== 'restore') window.boundary = 'write held';
  }
  if (['before-ack','abort-after-write-request','close-during-write','reload-during-write'].includes(phase)) {
   const method = {save:'add', edit:'put', remove:'delete', outfit:'put',
    'outfit-update':'put', wear:'put', restore:'put'}[action];
   const store = {outfit:'outfit-board','outfit-update':'outfit-board',wear:'outfit-wear-history-v1'}[action];
   const request = IDBObjectStore.prototype[method];
   const observed = new WeakSet();
   if (phase === 'before-ack') {
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function(...args) {
     const tx = transaction.apply(this, args);
     tx.addEventListener('complete', event => {
      if (!observed.has(tx)) return;
      event.stopImmediatePropagation();
      window.boundary = 'committed; completion delivery held';
     }, {capture:true});
     return tx;
    };
   }
   IDBObjectStore.prototype[method] = function(value) {
    const result = request.call(this, value);
    const tx = this.transaction;
    if (tx.db !== db || observed.has(tx) ||
        (store ? this.name !== 'state' || value.id !== store : this.name !== 'items')) return result;
    observed.add(tx);
    if (phase === 'abort-after-write-request') {
     result.addEventListener('success', () => {
      tx.abort();
      window.boundary = 'request succeeded; transaction aborted';
     }, {once:true});
    }
    if (phase === 'close-during-write' || phase === 'reload-during-write') {
     // Keep a native request pending until the test closes the page. Giving
     // the transaction nothing to do between checks would let it auto-commit.
     const keepPending = () => {
      this.get('__assignment31_pending__').onsuccess = keepPending;
     };
     result.addEventListener('success', () => {
      keepPending();
      window.boundary = 'write succeeded; native transaction still active';
     }, {once:true});
    }
    return result;
   };
  }
  const operations = {
   save:() => savePiece(row, [], {expectedDraftRow:suggestion}),
   edit:() => savePiece({...row,name:'Edited'}, [], {expectedSavedRow:row}),
   remove:() => removeItem(row.id, row),
   outfit:() => saveOwnedOutfit(board),
   'outfit-update':() => saveOwnedOutfit({...board,name:'Updated outfit'}, {
    manageSaved:{index:0,stamp:savedOutfitSourceStamp}
   }),
   wear:async () => {
    const date = new Date();
    await changeOutfitWear('record', {...board,id:'wear-1',day:wearLocalDay(date),at:date.getTime()});
    if ($('outfitWearStatus').textContent !== 'Outfit recorded for today.')
     throw Error($('outfitWearStatus').textContent);
   },
   restore:async () => {
    const backup = {format:'closet-current',version:3,items:[row],
     outfitBoard:{current:board,saved:[board]}};
    const files = [new File([JSON.stringify(backup)], 'closet-backup.json')];
    window.confirm = () => {
     if (phase === 'before-write') window.boundary = 'restore confirmed; write held';
     return true;
    };
    await $('import').onchange({target:{files,value:''}});
    if ($('message').textContent !== 'Backup imported atomically. All original photos and outfits were preserved.')
     throw Error($('message').textContent);
   }
  };
  Promise.resolve().then(operations[action]).then(
   () => {window.outcome = 'resolved';},
   error => {window.outcome = String(error);});
 }, {phase, action, row, board, suggestion});
 if (phase === 'acknowledged') {
  await page.waitForFunction(() => window.outcome !== null);
  assert.equal(await page.evaluate(() => window.outcome), 'resolved');
 } else {
  await page.waitForFunction(() => window.boundary !== null || window.outcome !== null);
  assert.ok(await page.evaluate(() => window.boundary), await page.evaluate(() => window.outcome));
  if (phase === 'abort-after-write-request') {
   await page.waitForFunction(() => window.outcome !== null);
   assert.notEqual(await page.evaluate(() => window.outcome), 'resolved');
  } else {
   assert.equal(await page.evaluate(() => window.outcome), null);
  }
 }
}

const failures = [];
try {
 for (const [engine, browserType] of Object.entries({chromium, webkit})) {
  if (process.env.CC31_ENGINE && engine !== process.env.CC31_ENGINE) continue;
  for (const width of (process.env.CC31_WIDTH ? [Number(process.env.CC31_WIDTH)] : [320,390,430])) {
   const profile = await mkdtemp(resolve(tmpdir(), 'closet-a31-'));
   let context;
   try {
    context = await browserType.launchPersistentContext(profile, {
     viewport:{width,height:844}, isMobile:true, hasTouch:true, serviceWorkers:'block'
    });
    context.setDefaultTimeout(7000);
    let owner;
    await context.route('**/*', route => {
     const target = new URL(route.request().url());
     if (target.origin !== origin) return route.abort();
     if (target.pathname !== '/auth.js') return route.continue();
     return route.fulfill({contentType:'text/javascript', body:
      'window.closetAuth={user:{id:'+JSON.stringify(owner)+'},ready:Promise.resolve(),assertCurrent(){}};'+
      'document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;'});
    });
    for (const action of ['save','edit','remove','outfit','outfit-update','wear','restore']) {
     for (const phase of ['before-write','abort-after-write-request','close-during-write','reload-during-write','before-ack','acknowledged']) {
      owner = [engine,width,action,phase].join('-');
      let page;
      try {
       page = await open(context);
       const row = action === 'wear' ? {...fixture(owner),category:'Dresses',itemType:'Dress'} : fixture(owner);
       const suggestion = {...row,ownerReviewed:false,localAnalyzed:true};
       const outfit = {name:'Original outfit',slots:{top:row.id}};
       await page.evaluate(async ({row, outfit, action, suggestion}) => {
        await new Promise((resolve, reject) => {
         const tx = db.transaction(['items','state'], 'readwrite');
         const state = tx.objectStore('state');
         if (action === 'save') state.put({id:'draft',batch:[suggestion]});
         else if (action !== 'restore') tx.objectStore('items').put(row);
         if (['remove','outfit-update','wear'].includes(action)) state.put({id:'outfit-board',current:outfit,saved:[outfit]});
         tx.oncomplete = resolve;
         tx.onabort = () => reject(tx.error);
        });
       }, {row, outfit, action, suggestion});
       await page.close();
       page = await open(context);
       const before = await snapshot(page);
       await armAndStart(page, phase, action, row, outfit, suggestion);
       if (phase === 'reload-during-write') {
        page.on('dialog', dialog => dialog.accept());
        await page.reload({waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => typeof db !== 'undefined' && db && boardInitialized);
       } else {
        await page.close();
        page = await open(context);
       }
       const after = await snapshot(page);
       const committed = phase === 'before-ack' || phase === 'acknowledged';
       assert.ok(after.revision >= before.revision, 'Local revision decreased');
       if (action === 'restore') assert.equal(after.revision,before.revision + Number(committed));
       if (!committed) {
        assert.deepEqual({...after,revision:before.revision},before);
       }
       else if (action === 'save') assert.deepEqual(after, {...before,items:[row],drafts:[],revision:after.revision});
       else if (action === 'edit') assert.deepEqual(after, {...before,items:[{...row,name:'Edited'}],revision:after.revision});
       else if (action === 'remove') {
        assert.deepEqual(after.items, []);
        assert.deepEqual(after.saved.map(saved => saved.slots), [{}]);
        assert.deepEqual(after.current.slots, {});
       } else if (action === 'wear') {
        assert.deepEqual(after.items, before.items);
        assert.deepEqual(after.saved, before.saved);
        assert.deepEqual(after.wear.map(({id,name,slots}) => ({id,name,slots})), [{...outfit,id:'wear-1'}]);
       } else {
        if (action === 'restore') assert.deepEqual(after.items.map(({id,ownerId,name}) =>
         ({id,ownerId,name})), [{id:row.id,ownerId:owner,name:row.name}]);
        else assert.deepEqual(after.items, before.items);
        assert.deepEqual(after.saved.map(({name,slots}) => ({name,slots})),
         [action === 'outfit-update' ? {...outfit,name:'Updated outfit'} : outfit]);
       }
       for (const record of [...after.items,...after.drafts]) {
        assert.equal(record.ownerId,owner);
        assert.equal(record.originalPhoto.sha256,sha);
        assert.equal(createHash('sha256').update(Buffer.from(record.originalPhoto.image.split(',')[1],'base64')).digest('hex'),sha);
       }
       if (phase === 'acknowledged') {
        await page.goto(origin + '/__interruption-away', {waitUntil:'domcontentloaded'});
        await page.goBack({waitUntil:'commit'});
        await page.waitForFunction(() => typeof db !== 'undefined' && db && boardInitialized);
        assert.deepEqual(await snapshot(page),after);
        await page.reload({waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => typeof db !== 'undefined' && db && boardInitialized);
        assert.deepEqual(await snapshot(page),after);
       }
       console.log('PASS',engine,width,action,phase);
      } catch (error) {
       failures.push({engine,width,action,phase,error:String(error).slice(0,500)});
       console.error('FAIL',engine,width,action,phase,error.message.slice(0,500));
      } finally {
       await page?.close();
      }
     }
    }
    try {
     await closeAndCheckSession(context, value => {owner = value;},
      engine+'-'+width+'-owner-a', engine+'-'+width+'-owner-b');
     console.log('PASS',engine,width,'late-write-after-session-lock');
    } catch (error) {
     failures.push({engine,width,error:String(error).slice(0,500)});
     console.error('FAIL',engine,width,'late-write-after-session-lock',error.message.slice(0,500));
    }
   } finally {
    await context?.close();
    await rm(profile,{recursive:true,force:true});
   }
  }
 }
} finally {
 await new Promise(done => server.close(done));
}
assert.deepEqual(failures, []);
