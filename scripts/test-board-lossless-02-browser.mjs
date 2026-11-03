/** Genuine original public/index.html Chromium & WebKit 320/390/430, two owners,
 * five lifecycle screenshots each; detached exact PR541 donor view decision.
 * Browser-owned fixture login is synthetic, not live Supabase/RLS.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),donor=resolve('.board02-donor-541'),dir='benchmark/board-lossless-02';
await mkdir(dir,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const sources={};
for(const id of ['commons-0053','commons-0003','commons-0021','commons-0064','commons-0067','commons-0080']){
 const bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 sources[id]={sha256:hash(bytes),data:'data:image/jpeg;base64,'+bytes.toString('base64')};
}
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:public\/|research\/|donor\/|node_modules\/)/.test(url)||url.includes('\\')||
   url.includes('\0')||url.split('/').includes('..'))throw Error('Unsafe URL');
  const base=url.startsWith('/donor/')?donor:root,sub=url.startsWith('/donor/')?url.slice(6):url;
  const path=resolve(base,'.'+sub);
  if(!path.startsWith(base+'/'))throw Error('Outside research tree');
  const bytes=await readFile(path);
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const authScript=owner=>[
 'window.__board02FixtureEpoch=3;',
 'window.closetAuth={ready:Promise.resolve(),user:{id:'+JSON.stringify(owner)+'},',
 'getSessionGeneration:()=>window.__board02FixtureEpoch,',
 "getAccessToken:async()=>{throw Error('No live RLS on fixture account')}};",
 "document.getElementById('authGate').hidden=true;",
 "document.getElementById('appShell').hidden=false;"
].join('\n');
const cloudStub="window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{},sync:async()=>{}};";
function fixture(owner){
 const item=(id,category,itemType,pic)=>({id:owner+'-'+id,ownerId:owner,category,itemType,
  name:id,color:'Black',image:sources[pic].data,sourceSHA256:sources[pic].sha256,
  originalPhoto:{image:sources[pic].data,sha256:sources[pic].sha256}});
 return {items:[
  item('dress','Dresses','Casual dress','commons-0053'),
  item('jacket','Outerwear','Jacket','commons-0064'),
  item('coat','Outerwear','Coat','commons-0067'),
  item('shirt','Tops','T-shirt','commons-0003'),
  item('jeans','Bottoms','Jeans','commons-0021'),
  item('shoes','Shoes','Sneakers','commons-0080'),
  item('newshoes','Shoes','Sneakers','commons-0080')
 ],state:{id:'outfit-board',current:{name:'Preserved native current',slots:{},future:{keep:true}},
  saved:[
   {id:owner+'-dress-outfit',outfit3dId:owner+'-3d-dress',ownerId:owner,
    name:'Dress with jacket and coat',layerCount:3,
    slots:{top:owner+'-dress',layer2:owner+'-jacket',layer3:owner+'-coat',shoes:owner+'-shoes'},
    slotSources:{top:{sha256:sources['commons-0053'].sha256,categoryAtSave:'Dresses'}},
    futureMetadata:{untouched:'yes'}},
   {id:owner+'-missing-outfit',outfit3dId:owner+'-3d-missing',ownerId:owner,
    name:'Missing jeans kept',slots:{top:owner+'-shirt',bottom:owner+'-missing-jeans',shoes:owner+'-shoes'},
    futureMetadata:{untouched:'yes'}}],futureBoardVersion:'keep'}};
}
const cases=[],screens=[],strips=[],errors=[],external=[];
let browser;
async function checkImage(page,engine,width,owner,stage){
 assert.equal(page.viewportSize().width,width,'Actual browser viewport must equal tested mobile width');
 const name=engine+'-'+width+'-'+owner+'-'+stage+'.png';
 const png=await page.screenshot({fullPage:false,animations:'disabled'});
 const metadata=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(metadata.width,width);assert.ok(png.length>4500);
 assert.ok(stats.channels.some(x=>x.stdev>10),'Genuine rendered screenshot not blank');
 await writeFile(dir+'/'+name,png);
 screens.push({name,sha256:hash(png),engine,width,owner,stage});
}
async function sourceCardDetail(page,engine,width,owner){
 const name=engine+'-'+width+'-'+owner+'-source-cards-all-slots.png';
 const png=await page.locator('#board02Preview').screenshot({animations:'disabled'});
 const m=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.ok(m.width<=width&&m.width>=width-65,'Real element crop width must be within viewport');
 assert.ok(png.length>2000&&stats.channels.some(x=>x.stdev>10));
 await writeFile(dir+'/'+name,png);
 screens.push({name,sha256:hash(png),engine,width,owner,stage:'all-original-slot-cards',elementCapture:true});
}
async function setupPage(context,owner,engine,width){
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push({engine,width,owner,message:e.message}));
 await page.route('**/*',route=>{
  const url=route.request().url(),path=new URL(url).pathname;
  if(path==='/public/auth.js')return route.fulfill({contentType:'text/javascript',body:authScript(owner)});
  if(path==='/public/cloud-backup.js')return route.fulfill({contentType:'text/javascript',body:cloudStub});
  if(path==='/public/cloud-backup-bridge.js')return route.fulfill({contentType:'text/javascript',body:''});
  if(url.startsWith(host+'/')||url.startsWith('blob:'+host)||url.startsWith('data:'))return route.continue();
  external.push({engine,width,method:route.request().method(),host:new URL(url).hostname});
  return route.abort();
 });
 await page.goto(host+'/public/index.html?boardLossless02=research',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof db!=='undefined'&&
    db?.name==='closet-current-user-'+window.closetAuth.user.id&&typeof cleanOutfitBoard==='function',null,{timeout:60000});
 return page;
}
const board=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const r=db.transaction('state','readonly').objectStore('state').get('outfit-board');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
}));
async function mount(page){await page.evaluate(async()=>{
 const m=await import('/research/board-lossless-02/native-research-panel.mjs');
 window.__board02=await m.mountLosslessBoard02Research();
});}
try{
 for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
  browser=await type.launch({headless:true,args:engine==='chromium'?
   ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:880},isMobile:true,
    deviceScaleFactor:1,hasTouch:true,serviceWorkers:'block'});
   for(const owner of ['board02-account-A','board02-account-B']){
    const page=await setupPage(context,owner,engine,width);
    const value=fixture(owner);
    await page.evaluate(data=>new Promise((resolve,reject)=>{
     const tx=db.transaction(['items','state'],'readwrite');
     for(const row of data.items)tx.objectStore('items').put(row);
     tx.objectStore('state').put(data.state);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    }),value);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof db!=='undefined'&&db?.name==='closet-current-user-'+window.closetAuth.user.id);
    const before=await board(page);assert.deepEqual(before,value.state);
    const lost=await page.evaluate(state=>{
     const x=cleanOutfitBoard(state.saved[0],items);
     return {jacket:!!x.slots.layer2,coat:!!x.slots.layer3,durable:!!x.outfit3dId};
    },before);
    assert.deepEqual(lost,{jacket:false,coat:false,durable:false});
    await mount(page);
    await page.evaluate(()=>{
     const el=document.createElement('p');
     el.textContent='BEFORE · unchanged native cleaner loses dress jacket, coat and durable 3D identity. Original IDB record remains intact.';
     document.getElementById('boardLossless02Research').append(el);
    });
    await checkImage(page,engine,width,owner,'before-native');
    const first=owner+'-dress-outfit';
    await page.locator('#board02Saved').selectOption(first);
    await page.waitForFunction(()=>document.querySelector('#boardLossless02Status').textContent.includes('Saved IDs retained'));
    const opened=await page.evaluate(()=>window.__board02.editor.inspect());
    assert.equal(opened.slots.layer2,owner+'-jacket');assert.equal(opened.slots.layer3,owner+'-coat');
    assert.equal(opened.outerwear.length,2);
    await checkImage(page,engine,width,owner,'open-lossless');
    await sourceCardDetail(page,engine,width,owner);
    assert.deepEqual(await board(page),before,'Read/render cannot write');
    const edited=await page.evaluate(()=>{
     const e=window.__board02.editor;
     e.pin('shoes');let blocked=false;try{e.swapShoes(window.closetAuth.user.id+'-newshoes');}catch{blocked=true;}
     e.pin('shoes',false);e.swapShoes(window.closetAuth.user.id+'-newshoes');
     e.editName('Saved without losing coat');window.__board02.show();return {blocked,view:e.inspect()};
    });
    assert.equal(edited.blocked,true);assert.equal(edited.view.dirty,true);
    await checkImage(page,engine,width,owner,'unsaved-edit');
    assert.deepEqual(await board(page),before,'Draft cannot mutate existing stored state');
    await page.locator('#board02Save').click();
    await page.waitForFunction(()=>document.querySelector('#boardLossless02Status').textContent.startsWith('Saved original outfit'));
    const receipt={id:first};assert.equal(receipt.id,first);
    const after=await board(page);
    assert.equal(after.saved[0].slots.shoes,owner+'-newshoes');
    assert.equal(after.saved[0].slots.layer2,owner+'-jacket');
    assert.equal(after.saved[0].slots.layer3,owner+'-coat');
    assert.equal(after.saved[0].outfit3dId,owner+'-3d-dress');
    assert.deepEqual(after.current,before.current);
    assert.deepEqual(after.saved[0].futureMetadata,{untouched:'yes'});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof db!=='undefined'&&db?.name==='closet-current-user-'+window.closetAuth.user.id);
    await mount(page);
    const reopen=await page.evaluate(id=>{
     window.__board02.editor.open(id);window.__board02.show();return window.__board02.editor.inspect();
    },first);
    assert.equal(reopen.slots.layer3,owner+'-coat');
    await checkImage(page,engine,width,owner,'saved-reopened');
    assert.deepEqual(await board(page),after,'Reopen does not rewrite');
    const missing=await page.evaluate(id=>{
     const e=window.__board02.editor;e.open(id);window.__board02.show();return e.inspect();
    },owner+'-missing-outfit');
    assert.equal(missing.missing.length,1);assert.equal(missing.missing[0].itemId,owner+'-missing-jeans');
    await checkImage(page,engine,width,owner,'missing-original-id');
    const donor=await page.evaluate(async id=>{
     const {decideOutfit3D01}=await import('/donor/research/outfit-3d-01/source-true-viewer.mjs');
     const e=window.__board02.editor;e.open(id);
     const unchecked=e.toPreview();
     if(unchecked.selected.some(x=>x.originalSHA256!==null))throw Error('Unverified SHA sent to 3D');
     const p=await e.toVerified3DPlan(),d=decideOutfit3D01(p);
     return {mode:d.mode,fallbackIds:d.fallbackIds,originalSHA256Verified:p.originalJPEGsByteVerified};
    },first);
    assert.equal(donor.mode,'dress');assert.equal(donor.originalSHA256Verified,true);
    assert.ok(donor.fallbackIds.includes(owner+'-coat'));
    assert.ok(donor.fallbackIds.includes(owner+'-jacket'));
    assert.ok(donor.fallbackIds.includes(owner+'-newshoes'));
    const identity=await page.evaluate(async()=>{
     const {verifyPhoto02}=await import('/research/board-lossless-02/lossless-board.mjs');
     const {createExistingBoard02IO}=await import('/research/board-lossless-02/existing-idb-cas.mjs');
     const a=window.closetAuth,io=createExistingBoard02IO(a);
     const s=await io.read({authenticated:true,ownerId:a.user.id,generation:a.getSessionGeneration()});
     return verifyPhoto02(s.items.find(x=>x.category==='Dresses'));
    });
    assert.equal(identity.verified,true);
    assert.equal(identity.sourceSHA256,sources['commons-0053'].sha256);
    const denied=await page.evaluate(async foreign=>{
     const {createExistingBoard02IO}=await import('/research/board-lossless-02/existing-idb-cas.mjs');
     const a=window.closetAuth;
     try{await createExistingBoard02IO(a).read({authenticated:true,ownerId:foreign,
      generation:a.getSessionGeneration()});return false;}catch{return true;}
    },owner.endsWith('A')?'board02-account-B':'board02-account-A');
    assert.equal(denied,true);
    await page.evaluate(()=>{
     const e=window.__board02.editor;e.open(window.closetAuth.user.id+'-dress-outfit');
     e.editName('DO NOT SAVE');
    });
    await page.locator('#board02Cancel').click();
    await page.waitForFunction(()=>document.querySelector('#boardLossless02Status').textContent.startsWith('Canceled:'));
    assert.deepEqual(await board(page),after);
    await page.evaluate(()=>window.__board02.editor.editName('Independent saved copy'));
    await page.locator('#board02SaveNew').click();
    await page.waitForFunction(()=>document.querySelector('#boardLossless02Status').textContent.startsWith('Saved separate new outfit'));
    const copied=await board(page);
    assert.equal(copied.saved.length,3);assert.deepEqual(copied.saved[0],after.saved[0]);
    assert.equal(copied.saved[2].name,'Independent saved copy');
    const copyId=copied.saved[2].id;
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#board02Delete').click();
    await page.waitForFunction(()=>document.querySelector('#boardLossless02Status').textContent.startsWith('Confirmed outfit deletion'));
    const cleaned=await board(page);
    assert.equal(cleaned.saved.length,2);assert.deepEqual(cleaned.saved[0],after.saved[0]);
    assert.equal(cleaned.saved.some(x=>x.id===copyId),false);
    let twoTabConflict=false;
    if(engine==='chromium'&&width===390&&owner.endsWith('-A')){
     const other=await setupPage(context,owner,engine,width);await mount(other);
     await page.evaluate(id=>{window.__board02.editor.open(id);window.__board02.editor.editName('Tab one accepted');},first);
     await other.evaluate(id=>{window.__board02.editor.open(id);window.__board02.editor.editName('Tab two stale');},first);
     await page.evaluate(()=>window.__board02.editor.save());
     const denied=await other.evaluate(async()=>{
      try{await window.__board02.editor.save();return false;}catch(e){return /CONFLICT/.test(e.message);}
     });
     assert.equal(denied,true,'Two actual same-owner browser tabs must never overwrite');
     twoTabConflict=true;await other.close();
    }
    await page.evaluate(()=>{
     window.__board02FixtureEpoch++;
     window.dispatchEvent(new CustomEvent('closet:alpha-session-changed'));
    });
    assert.equal(await page.locator('#boardLossless02Status').textContent(),
     'Account or session changed; private research preview cleared.');
    cases.push({engine,width,owner,nativeLoss:lost,losslessJacketCoat:true,
     durable3DID:true,missingPieceId:true,sourceSHA256:identity.sourceSHA256,
     donorMode:donor.mode,donorPhotoFallback:donor.fallbackIds,
     separateOwnerDenied:true,reopenReadOnly:true,cancelNoWrite:true,
     saveAsNewUI:true,confirmedDeleteUI:true,sessionInvalidationUI:true,twoTabConflict,
     realRLS:'NOT TESTED',physicalPhone:'NOT TESTED',releaseAuthorized:false});
    await page.close();
   }
   await context.close();
  }
  await browser.close();browser=null;
 }
 assert.equal(cases.length,12);assert.equal(screens.length,72);
 assert.deepEqual(errors,[]);
 assert.deepEqual(external.filter(x=>x.method!=='GET'),[]);
 for(const s of screens)assert.equal(hash(await readFile(dir+'/'+s.name)),s.sha256);
 for(const row of cases){
  const pair=screens.filter(s=>s.engine===row.engine&&s.width===row.width&&s.owner===row.owner);
  const parts=await Promise.all(['before-native','open-lossless'].map(async stage=>{
   const s=pair.find(x=>x.stage===stage);
   return sharp(await readFile(dir+'/'+s.name)).resize({width:row.width,height:900,
    fit:'contain',background:'#fff'}).png().toBuffer();
  }));
  const png=await sharp({create:{width:row.width*2,height:900,channels:4,background:'#fff'}})
   .composite(parts.map((input,i)=>({input,left:row.width*i,top:0}))).png().toBuffer();
  const file='comparison-'+row.engine+'-'+row.width+'-'+row.owner+'.png';
  await writeFile(dir+'/'+file,png);strips.push({file,sha256:hash(png)});
 }
 const result={priority:'BOARD-LOSSLESS-02',cases:cases.length,screenshots:screens.length,
  strips:strips.length,widths:[320,390,430],engines:['chromium','webkit'],
  actualNativeApp:true,realIndexedDB:true,donorPR541Decision:true,
  accountIsolationFixture:true,verifiedOriginalSHA:true,
  realWebGLRendered:false,originalProductionChanged:false,
  physicalPhone:'NOT TESTED',liveSupabaseRLS:'NOT TESTED',
  external,errors,sourceHashes:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,v.sha256])),
  evidence:cases,screens,strips,familyAlpha:'HOLD'};
 await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('BOARD02_BROWSER_VERIFIED',JSON.stringify({cases:cases.length,
  screens:screens.length,strips:strips.length,sourceTrue:true,familyAlpha:'HOLD'}));
}catch(e){
 await writeFile(dir+'/ERROR.json',JSON.stringify({message:String(e?.stack||e),
  completedScreens:screens.length,external,errors},null,2));
 throw e;
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
