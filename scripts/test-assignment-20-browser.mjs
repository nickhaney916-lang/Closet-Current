import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';
import { endpoint, key, request, json } from '../research/auth-review-session-36/local-http.mjs';

const root = resolve('dist');
const mime = {'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const assetSources = {
 'auth.js': {url:'URL', key:'KEY'},
 'cloud-backup.js': {url:'BASE', key:'KEY'}
};
const errors = [];
const server = createServer(async (req, res) => {
 try {
  assert.equal(req.method, 'GET');
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  if (pathname === '/fixture-bootstrap') {
   res.writeHead(200, {'content-type':'text/html'}).end('<!doctype html><title>Fixture bootstrap</title>');
   return;
  }
  const filename = pathname === '/' ? 'index.html' : pathname.slice(1);
  const path = resolve(root, filename);
  assert.ok(path.startsWith(root + sep));
  let bytes = await readFile(path);
  if (Object.hasOwn(assetSources, filename)) {
   const binding = assetSources[filename];
   let source = bytes.toString();
   for (const [name, replacement] of [[binding.url, endpoint.origin], [binding.key, key]]) {
    const expression = new RegExp('\\b' + name + "='[^']+'");
    assert.match(source, expression);
    const assignment = name + '=' + JSON.stringify(replacement);
    source = source.replace(expression, () => assignment);
   }
   bytes = Buffer.from(source);
  }
  res.writeHead(200, {'content-type':mime[extname(path)] || 'application/octet-stream','cache-control':'no-store'}).end(bytes);
 } catch (error) {
  if (error.code !== 'ENOENT') errors.push('Failed local asset dispatch');
  res.writeHead(404).end();
 }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;

async function newOwner(label) {
 const email = 'closet-' + randomUUID() + '@example.test';
 const password = randomBytes(22).toString('hex');
 const signup = await request('/auth/v1/signup', null, 'POST', {email,password});
 assert.ok(signup.ok, 'Disposable test-account signup failed: ' + signup.status);
 const id = json(signup).user?.id;
 assert.match(id, /^[0-9a-f-]{36}$/);
 const buffer = await sharp({create:{width:72,height:96,channels:3,background:
  {A:'#314dab',B:'#a93d21',C:'#2b8b52',D:'#7c35a1'}[label]}}).jpeg().toBuffer();
 const image = 'data:image/jpeg;base64,' + buffer.toString('base64');
 const sha = createHash('sha256').update(buffer).digest('hex');
 const garment = {id:'shirt-'+label,ownerId:id,name:'Fixture shirt '+label,
  category:'Tops',itemType:'T-shirt',color:'Blue',image,originalPhoto:{image,sha256:sha},
  sourceSHA256:sha,sourceHashVerified:true,sourcePhotoOriginal:true,
  ownerReviewed:true,userAdjusted:true,singleGarmentVerified:true};
 const outfit = {name:'Fixture outfit '+label,slots:{top:garment.id}};
 return {email,password,id,garment,outfit,label};
}

async function seed(page, owner) {
 await page.evaluate(async ({id,garment,outfit}) => {
  const storage = await new Promise((resolve,reject) => {
   const open = indexedDB.open('closet-current-user-'+id,2);
   open.onupgradeneeded = () => {
    open.result.createObjectStore('items',{keyPath:'id'});
    open.result.createObjectStore('state',{keyPath:'id'});
   };
   open.onsuccess = () => resolve(open.result);
   open.onerror = () => reject(open.error);
  });
  try {
   await new Promise((resolve,reject) => {
    const tx = storage.transaction(['items','state'],'readwrite');
    tx.objectStore('items').put(garment);
    const state = tx.objectStore('state');
    state.put({id:'outfit-board',current:outfit,saved:[outfit]});
    state.put({id:'cloud-sync',baseVersion:0,baseDocument:null,dirty:true,localRevision:1});
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(Error('Fixture transaction failed'));
   });
  } finally { storage.close(); }
 }, {id:owner.id,garment:owner.garment,outfit:owner.outfit});
}

async function checkOwner(page, owner, {validateRefresh}) {
 const authResponse = page.waitForResponse(r => r.url() === endpoint.origin + '/auth/v1/token?grant_type=password' && r.ok());
 await page.locator('#authEmail').fill(owner.email);
 await page.locator('#authPassword').fill(owner.password);
 await page.locator('#authSubmit').tap();
 await authResponse;
 await page.waitForFunction(id => window.closetAuth?.user?.id===id && db?.name==='closet-current-user-'+id &&
  document.getElementById('cloudStatus').textContent==='Cloud backup up to date',owner.id,{timeout:35000});
 const state = await page.evaluate(async () => {
  closetAuth.assertCurrent();
  const tx = db.transaction(['items','state']);
  const store = tx.objectStore('state');
  const read = request => new Promise((resolve,reject) => {
   request.onsuccess = () => resolve(request.result);
   request.onerror = () => reject(request.error);
  });
  const [rows, board, marker] = await Promise.all([
   read(tx.objectStore('items').getAll()),read(store.get('outfit-board')),read(store.get('cloud-sync'))
  ]);
  return {rows,board,revision:marker.baseVersion};
 });
 assert.equal(state.rows.length,1);
 assert.equal(state.rows[0].id,owner.garment.id);
 assert.equal(state.rows[0].ownerId,owner.id);
 assert.deepEqual(state.rows[0].originalPhoto,owner.garment.originalPhoto);
 assert.equal(state.revision,1);
 assert.equal(state.board.saved.length,1);
 assert.equal(state.board.saved[0].name,owner.outfit.name);
 assert.deepEqual(state.board.saved[0].slots,owner.outfit.slots);
 await page.locator('#moreMenu summary').tap();
 await page.locator('#moreMenu button[data-view=builder]').tap();
 await page.locator('#savedBoards').getByText(owner.outfit.name,{exact:true}).waitFor();

 if (validateRefresh) {
  const response = page.waitForResponse(r => r.url() === endpoint.origin + '/auth/v1/token?grant_type=refresh_token' && r.ok());
  await page.evaluate(async () => { await closetAuth.getAccessToken({force:true}); });
  await response;
  assert.ok(await page.evaluate(id => closetAuth.user?.id === id,owner.id));
 }
 const logout = page.waitForResponse(r => r.url() === endpoint.origin + '/auth/v1/logout' && r.ok());
 await page.locator('.account-menu summary').tap();
 await page.locator('#logout').tap();
 await logout;
 await page.locator('#authGate').waitFor();
 assert.ok(await page.locator('#appShell').isHidden());
}

try {
 for (const [engine,type] of Object.entries({chromium,webkit})) {
  const owners = await Promise.all(['A','B','C','D'].map(newOwner));
  assert.equal(new Set(owners.map(x=>x.id)).size,4);
  assert.equal(new Set(owners.map(x=>x.garment.sourceSHA256)).size,4);
  const browser = await type.launch();
  try {
   for (const width of [320,390,430]) {
    const context = await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try {
     // This allows only the two explicitly bound local origins. Their real
     // HTTP responses are returned to the application without interception.
     await context.route('**/*', route => {
      const target = new URL(route.request().url());
      return [origin,endpoint.origin].includes(target.origin) ? route.continue() : route.abort();
     });
     const page = await context.newPage();
     page.setDefaultTimeout(20000);
     page.on('pageerror', () => errors.push(engine+' '+width+' uncaught page error'));
     if (width === 320) {
      await page.goto(origin+'/fixture-bootstrap');
      for (const owner of owners) await seed(page,owner);
     }
     await page.goto(origin+'/index.html');
     for (const owner of owners) {
      try {
       await checkOwner(page,owner,{validateRefresh:width===390});
       console.log('ASSIGNMENT_20_OWNER_PASS',engine,width,owner.label,width===320?'backup':'clean-context restore');
      } catch (error) {
       const status = await page.locator('#cloudStatus').textContent().catch(()=>'');
       // Only fixed status categories or test stage messages enter CI logs.
       console.error('Owner scenario failed',engine,width,owner.label,
        status==='Cloud backup up to date'?'backup verified':'backup unverified',error.name);
       throw Error('Four-owner browser acceptance failed at '+engine+' '+width+' owner '+owner.label);
      }
     }
     assert.deepEqual(errors,[]);
    } finally { await context.close(); }
   }
  } finally { await browser.close(); }
 }
} finally { await new Promise(done => server.close(done)); }
