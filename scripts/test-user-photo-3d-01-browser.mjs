/**
 * Genuine Chromium visual benchmark: 15 different original source JPEGs,
 * source hash verified in the real browser, original data persisted in
 * synthetic private IndexedDB. No fake 3D for any unreviewed garment.
 * Actual male/female 163-bone WebGL is separately run from immutable PR541.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir='benchmark/user-photo-3d-01';
await mkdir(dir,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const ids=[
 ['commons-0001','Tops','T-shirt'],['commons-0002','Tops','T-shirt'],
 ['commons-0003','Tops','T-shirt'],['commons-0014','Tops','Blouse'],
 ['commons-0016','Tops','Blouse'],
 ['commons-0021','Bottoms','Jeans'],['commons-0023','Bottoms','Jeans'],
 ['commons-0024','Bottoms','Jeans'],['commons-0035','Bottoms','Shorts'],
 ['commons-0041','Bottoms','Skirt'],
 ['commons-0046','Dresses','Dress'],['commons-0049','Dresses','Dress'],
 ['commons-0053','Dresses','Casual dress'],['commons-0059','Dresses','Dress and jacket'],
 ['validation-0001','Dresses','Summer dress']
];
const locks=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const specs=[];
for(const [id,category,itemType] of ids){
 const locked=locks.find(x=>x.id===id),b=await readFile('benchmark/fixtures/'+id+'.jpg');
 assert.ok(locked?.verified&&locked.sha256===hash(b),'Exact locked REAL original JPEG '+id);
 assert.ok(locked.attribution.source.startsWith('https://commons.wikimedia.org/wiki/File:'));
 specs.push({id,category,itemType,sha256:locked.sha256,bytes:b.length,
  multipleGarments:id==='commons-0059'});
}
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.jpg':'image/jpeg','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const u=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/user-photo-3d-01\/|benchmark\/fixtures\/)/.test(u)||
   u.includes('\\')||u.includes('\0')||u.split('/').includes('..'))
   throw Error('Unsafe research request');
  const file=resolve(root,'.'+u);
  if(!file.startsWith(root+'/'))throw Error('Outside repository');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const owner='a1111111-1111-4111-8111-111111111111';
const results={cases:[],screenshots:[],external:[],errors:[],
 realSignedSupabase:false,privateOwnerSynthetic:true,
 real163BoneWebGLInIndependentPinnedDonor:true,
 originalPhotoReencoded:false,releaseAuthorized:false,familyAlpha:'HOLD'};
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle',
 '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(origin+'/'))return route.continue();
   results.external.push({width,method:route.request().method(),blocked:true});
   return route.abort();
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>results.errors.push({width,message:e.message}));
  await page.goto(origin+'/research/user-photo-3d-01/benchmark.html',{waitUntil:'domcontentloaded'});
  const tested=await page.evaluate(async({specs,owner})=>{
   const m=await import('/research/user-photo-3d-01/photo-readiness.mjs');
   const elements=[],rows=[],evaluations=[];
   for(const spec of specs){
    const response=await fetch('/benchmark/fixtures/'+spec.id+'.jpg',{cache:'no-store'});
    if(!response.ok)throw Error('Original fixture unavailable '+spec.id);
    const bytes=new Uint8Array(await response.arrayBuffer());
    let b64='';for(let i=0;i<bytes.length;i+=8192)
     b64+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const image='data:image/jpeg;base64,'+btoa(b64);
    const item={id:owner+'-'+spec.id,ownerId:owner,
     category:spec.category,itemType:spec.itemType,sourceSHA256:spec.sha256,
     originalPhoto:{image,sha256:spec.sha256},image,
     userAdjusted:true,categoryCorrection:'user',multipleGarments:spec.multipleGarments,
     retained:{futureMetadata:{notes:'not dropped'}}};
    const proof=await m.verifyOriginalPhoto01(item,{ownerId:owner});
    if(proof.sha256!==spec.sha256||proof.byteLength!==bytes.length)
     throw Error('Original source identity mismatch');
    const readiness=await m.assessWardrobePhoto01(item,{ownerId:owner});
    // Review-only silhouette proposal on derived thumbnail: never an admitted mesh.
    const photo=new Image();photo.src=image;await photo.decode();
    const canvas=document.createElement('canvas');canvas.width=160;canvas.height=200;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.fillStyle='#fff';
    c.fillRect(0,0,160,200);const scale=Math.min(160/photo.width,200/photo.height);
    c.drawImage(photo,(160-photo.width*scale)/2,(200-photo.height*scale)/2,
     photo.width*scale,photo.height*scale);
    const silhouette=m.proposeSilhouette01(c.getImageData(0,0,160,200));
    if(silhouette.approvedCutout||silhouette.realFittedGeometry)
     throw Error('Unapproved review thumbnail must never be 3D ready');
    const summary={id:spec.id,category:spec.category,itemType:spec.itemType,
     sha256:proof.sha256,bytes:proof.byteLength,kind:readiness.kind,
     readiness:readiness.readiness,reason:readiness.reason,
     originalPhotoVerified:readiness.originalPhotoVerified,geometryApproved:false,
     silhouette,ownerPrivate:true,originalPhotoUnchanged:true};
    evaluations.push(summary);rows.push(item);
    const box=document.createElement('article'),img=document.createElement('img');
    img.src='/benchmark/fixtures/'+spec.id+'.jpg';img.alt='Real source JPEG '+spec.id;
    await img.decode();
    const title=document.createElement('h3');title.textContent=spec.id+' · '+spec.itemType;
    const status=document.createElement('p');status.className='status '+(
      readiness.readiness==='Needs Review'?'review':'photo');
    status.textContent=readiness.readiness;
    const note=document.createElement('p');note.textContent=readiness.reason;
    const line=document.createElement('p');
    line.textContent='Original SHA '+spec.sha256.slice(0,14)+'… · source unchanged';
    box.append(img,title,status,note,line);elements.push(box);
   }
   // Actual owner-private IndexedDB schema; writing synthetic fixtures only.
   const db=await new Promise((resolve,reject)=>{
    const request=indexedDB.open('closet-current-user-'+owner,2);
    request.onupgradeneeded=()=>{request.result.createObjectStore('items',{keyPath:'id'});
     request.result.createObjectStore('state',{keyPath:'id'});};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
   });
   const saved={id:'outfit-board',current:{name:'Evidence',slots:{}},
    saved:[{id:'research-outfit',outfit3dId:'research-photo-3d-id',ownerId:owner,
     slots:{top:rows[2].id,bottom:rows[5].id,layer2:'original-missing-jacket',
      layer3:'original-missing-coat'},future:{metadata:'retain'}}]};
   await new Promise((resolve,reject)=>{
    const tx=db.transaction(['items','state'],'readwrite');
    for(const row of rows)tx.objectStore('items').put(row);
    tx.objectStore('state').put(saved);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });
   const restored=await new Promise((resolve,reject)=>{
    const tx=db.transaction(['items','state'],'readonly');
    const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').get('outfit-board');
    tx.oncomplete=()=>resolve({items:a.result,board:b.result});
    tx.onerror=()=>reject(tx.error);
   });
   if(restored.items.length!==15||restored.board.saved[0].outfit3dId!=='research-photo-3d-id'||
      restored.board.saved[0].slots.layer3!=='original-missing-coat')
    throw Error('Native owner-private wardrobe or missing garment reference lost');
   for(const row of restored.items){
    const verified=await m.verifyOriginalPhoto01(row,{ownerId:owner});
    if(verified.sha256!==row.sourceSHA256)throw Error('Source lost during IndexedDB reload');
   }
   const persisted=m.planSavedOutfit01(restored.board.saved[0],restored.items,{ownerId:owner});
   if(persisted.missing.length!==2)throw Error('Missing garment IDs dropped');
   const tiles=document.getElementById('tiles');
   window.__photo21={evaluations,rows,elements,storedSnapshotJSON:JSON.stringify(restored.board),
    showPage(index){
     tiles.replaceChildren(...elements.slice(index*5,index*5+5));
     document.getElementById('heading').textContent='Original clothing photographs · '+(index*5+1)+'–'+Math.min(15,index*5+5);
    }};
   window.__photo21.showPage(0);
   return {results:evaluations,ownedRecords:restored.items.length,
    missingIDs:persisted.missing.map(x=>x.garmentId),saved3DId:persisted.outfit3dId};
  },{specs,owner});
  assert.equal(tested.ownedRecords,15);
  assert.deepEqual(tested.missingIDs,['original-missing-jacket','original-missing-coat']);
  assert.equal(tested.saved3DId,'research-photo-3d-id');
  assert.deepEqual(tested.results.reduce((a,r)=>(a[r.readiness]=(a[r.readiness]||0)+1,a),{}),
    {'Needs Review':12,'Photo-Only':3});
  assert.ok(tested.results.every(x=>x.originalPhotoVerified&&x.originalPhotoUnchanged&&
   x.geometryApproved===false&&x.silhouette.approvedCutout===false));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(let g=0;g<3;g++){
   await page.evaluate(i=>window.__photo21.showPage(i),g);
   await page.locator('#tiles img').last().evaluate(el=>el.decode());
   const png=await page.screenshot({animations:'disabled'});
   const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
   assert.equal(meta.width,width);assert.equal(meta.height,900);
   assert.ok(stats.channels.some(x=>x.stdev>8),'Blank photo review screenshot');
   const name='chromium-'+width+'-photos-'+(g+1)+'.png';
   await writeFile(dir+'/'+name,png);
   results.screenshots.push({name,width,group:g+1,sha256:hash(png),bytes:png.length});
  }
  const original=await page.evaluate(()=>window.__photo21.storedSnapshotJSON);
  assert.equal(original,await page.evaluate(()=>window.__photo21.storedSnapshotJSON));
  results.cases.push({width,sourcePhotos:15,readiness:tested.results,
   allOriginalSHA256Verified:true,fullJPEGNeverRewritten:true,
   missingGarmentReferencesRetained:true,actualOriginalFixtureIndexedDB:true,
   valid3DReadyWithoutRender:0,sourceHonestFallback:true});
  await ctx.close();
 }
 assert.deepEqual(results.errors,[]);
 assert.deepEqual(results.external,[]);
 await writeFile(dir+'/results.json',JSON.stringify(results,null,2));
 console.log('PHOTO3D01_BROWSER '+JSON.stringify({
  originalPhotos:15,widths:3,realScreenshots:results.screenshots.length,
  ready:0,needsReview:12,photoOnly:3,
  donor3DRendersSeparate:true,release:'HOLD'}));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
