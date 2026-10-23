// Browser-level regression for the real "Style this" path. The actual
// production scripts run on an emulated 390px touch viewport. No accounts,
// vendor calls, paid inference, or unreviewed test photos are used.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const filename=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!filename.startsWith(root+'/'))throw Error('Disallowed asset');
  const bytes=await readFile(filename);
  res.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 const engine=process.env.STYLE_BROWSER==='webkit'?webkit:chromium;
 browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
  "window.closetAuth={user:{id:'new-item-mobile-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 // Do not allow live publisher data to influence this deterministic offline
 // fixture. Built-in cached/local trend research can still be used.
 await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port+'/';
 await page.goto(url);await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 await page.evaluate(()=>switchView('builder'));
 assert.match(await page.locator('#builderOwnedStatus').innerText(),/closet is empty/);
 assert.equal(await page.locator('#builderCreateOwned').isDisabled(),true);
 await page.locator('#builderAddClothes').click();
 assert.equal(await page.locator('#scan').isVisible(),true);
 const original=await page.evaluate(async()=>{
  const make=(id,category,itemType,color)=>({
   id,category,itemType,color,name:id.replaceAll('-',' '),image:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><rect width="100" height="150" fill="'+color.toLowerCase()+'"/></svg>'),
   seasons:[],pattern:'Solid',sleeveLength:'Unknown',fit:'Regular',brand:'',size:'',material:'',occasion:'',notes:''
  });
  const pieces=[make('new-green-top','Tops','T-shirt','Green'),
   make('owned-blue-jeans','Bottoms','Jeans','Blue'),
   make('owned-white-sneakers','Shoes','Sneakers','White'),
   make('owned-black-sneakers','Shoes','Sneakers','Black')];
  const records=pieces.map(normalizeClothing);
  await writeAll(records);
  items.splice(0,items.length,...records);
  render();
  return JSON.stringify(items.find(x=>x.id==='new-green-top'));
 });
 await page.locator('.tab[data-view="closet"]').click();
 await page.locator('#closetAllPieces').click();
 const itemCard=page.locator('#closetGrid article[data-item-id="new-green-top"]');
 await itemCard.getByRole('button',{name:'Style this'}).click();
 await page.locator('#stylistAnchor').waitFor({state:'visible'});
 assert.match(await page.locator('#stylistAnchorName').innerText(),/new green top/i);
 // A failed remote refresh must not make the user's own outfits unavailable.
 await page.locator('#styledCollectionResults .styled-outfit').first().waitFor({timeout:15000});
 const outfits=await page.evaluate(()=>styledCollectionResults.map(x=>({
  top:x.board.slots.top,bottom:x.board.slots.bottom,shoes:x.board.slots.shoes
 })));
 assert.ok(outfits.length>0);
 assert.ok(outfits.every(x=>x.top==='new-green-top'));
 assert.ok(outfits.every(x=>x.bottom==='owned-blue-jeans'));
 assert.ok(outfits.every(x=>['owned-white-sneakers','owned-black-sneakers'].includes(x.shoes)));
 // The same-card tap swap must use another owned shoe and pin the new top.
 const originalOptionShoes=outfits[0].shoes;
 await page.locator('#styledCollectionResults .styled-outfit').first()
  .getByRole('button',{name:'Swap shoes in option 1'}).tap();
 await page.getByText(/Preview only — tap Save outfit when you like it/).first().waitFor();
 const directSwap=await page.evaluate(()=>({
  selected:styledCollectionResults[0].board.slots.shoes,
  top:styledCollectionResults[0].board.slots.top,
  bottom:styledCollectionResults[0].board.slots.bottom,
  saved:savedOutfitBoards.length,
  owned:items.map(item=>item.id),
  anchor:stylistAnchorItemId
 }));
 assert.notEqual(directSwap.selected,originalOptionShoes);
 assert.equal(directSwap.top,'new-green-top');
 assert.equal(directSwap.bottom,'owned-blue-jeans');
 assert.equal(directSwap.anchor,'new-green-top');
 assert.equal(directSwap.saved,0,'swap preview does not silently save an outfit');
 assert.ok(directSwap.owned.includes(directSwap.selected));
 assert.equal(await page.evaluate(()=>JSON.stringify(items.find(x=>x.id==='new-green-top'))),original);
 await page.locator('#styledCollectionResults .styled-outfit').first()
  .getByRole('button',{name:'Save outfit'}).click();
 await page.getByText('Saved. Find it in Outfit builder → Saved outfits.').first().waitFor();
 const directSaved=await page.evaluate(()=>savedOutfitBoards.map(x=>({
  top:x.slots.top,bottom:x.slots.bottom,shoes:x.slots.shoes
 })));
 assert.equal(directSaved.length,1,'directly swapped outfit must save only on tap');
 assert.equal(directSaved[0].shoes,directSwap.selected);
 assert.equal(directSaved[0].top,'new-green-top');
 await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Preview on model'}).click();
 await page.locator('#builder:not([hidden])').waitFor();
 const initialShoes=await page.evaluate(()=>currentBoard.slots.shoes);
 assert.ok(['owned-black-sneakers','owned-white-sneakers'].includes(initialShoes));
 await page.locator('#boardSlots .board-slot-shoes').click();
 await page.locator('#boardPicker').waitFor({state:'visible'});
 const nextShoes=initialShoes==='owned-black-sneakers'?'owned-white-sneakers':'owned-black-sneakers';
 await page.locator('#boardPickerItems .board-pick').filter({hasText:nextShoes.replaceAll('-',' ')}).click();
 await page.waitForFunction(shoes=>currentBoard.slots.shoes===shoes,nextShoes);
 assert.equal(await page.evaluate(()=>currentBoard.slots.top),'new-green-top','changing shoes must not replace the new garment');
 const save=page.locator('#saveBoard');
 await save.click();
 await page.getByRole('status').filter({hasText:'Outfit saved with references'}).first().waitFor();
 const before=await page.evaluate(()=>({
  board:JSON.parse(JSON.stringify(currentBoard)),
  saved:savedOutfitBoards.length,
  item:JSON.stringify(items.find(x=>x.id==='new-green-top'))
 }));
 assert.equal(before.saved,2);
 assert.equal(before.board.slots.shoes,nextShoes);
 assert.equal(before.board.slots.top,'new-green-top');
 assert.equal(before.item,original,'styling must not modify the original garment record');
 await page.reload();
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 const after=await page.evaluate(()=>({board:JSON.parse(JSON.stringify(currentBoard)),
  saved:savedOutfitBoards.length,item:JSON.stringify(items.find(x=>x.id==='new-green-top'))}));
 assert.equal(after.saved,2,'direct card save and board save both survive reload');
 assert.equal(after.board.slots.top,'new-green-top','new item persists after reload');
 assert.equal(after.board.anchorItemId,'new-green-top','selected pin survives IndexedDB reload');
 assert.equal(after.board.slots.shoes,nextShoes,'one-piece swap persists after reload');
 assert.equal(after.item,original,'original garment remains unchanged in saved collection');
 // Duplicate clothing names and stale search/slot filters must never redirect
 // the home "Fresh in your closet" shortcut to the wrong garment.
 await page.evaluate(async()=>{
  const first=items.find(x=>x.id==='new-green-top');
  const duplicate=normalizeClothing({...first,id:'same-name-second-top',
   name:first.name,savedAt:'2026-10-18T23:59:59Z'});
  await writeAll([duplicate]);
  items.push(duplicate);
  switchView('home');
  window.closetBrowseAll=false;
  window.closetSlotFilter='shoes';
  window.closetTargetSlot='shoes';
  window.closetItemType='Sneakers';
  window.closetSleeves=['Long sleeve'];
  window.closetActiveItemId='owned-white-sneakers';
  $('search').value='owned-white-sneakers';
  $('filter').value='Shoes';
  $('seasonFilter').value='Winter';
 });
 assert.equal(await page.locator('#homePieces .home-piece[data-item-id="new-green-top"]').count(),1);
 assert.equal(await page.locator('#homePieces .home-piece[data-item-id="same-name-second-top"]').count(),1);
 await page.locator('#homePieces .home-piece[data-item-id="new-green-top"]').click();
 await page.locator('#closetCollection:not([hidden])').waitFor();
 const direct=await page.evaluate(()=>({
  viewedExact:ClosetRackEngine.activeItemId($('closetGrid')),
  stateId:window.closetActiveItemId,
  original:JSON.stringify(items.find(x=>x.id==='new-green-top')),
  photos:document.querySelectorAll('#closetGrid [data-item-id]').length,
  targeted:document.activeElement?.dataset?.itemId,
  rack:window.closetPresentationMode,
  browseAll:window.closetBrowseAll,
  search:$('search').value,category:$('filter').value,season:$('seasonFilter').value,
  sleeves:$('sleeveFilter').value,
  slot:window.closetSlotFilter,itemType:window.closetItemType,
  sourceType:window.closetTargetSlot
 }));
 assert.equal(direct.viewedExact,'new-green-top','home must open selected UUID rather than shared name');
 assert.equal(direct.stateId,'new-green-top');
 assert.equal(direct.original,original,'home navigation cannot edit garment or original source');
 assert.equal(direct.photos,5,'old shoe and long-sleeve filter may not restrict closet results');
 assert.equal(direct.targeted,'new-green-top','keyboard focus follows selected garment');
 assert.equal(direct.rack,'rack');
 assert.equal(direct.browseAll,true);
 assert.equal(direct.search,'');
 assert.equal(direct.category,'All categories');
 assert.equal(direct.season,'');
 assert.equal(direct.sleeves,'');
 assert.equal(direct.slot,null);
 assert.equal(direct.itemType,'');
 assert.equal(direct.sourceType,null);
 // Compact unsorted queue: an original picture + two mandatory human
 // selections, an explicit save, then automatic next-photo navigation.
 const beforeReview=await page.evaluate(async()=>{
  const original=items.find(x=>x.id==='new-green-top');
  const a=normalizeClothing({...original,id:'review-first-uncategorized',
   name:'Unknown item A',category:'Uncategorized',itemType:'Unknown',
   color:'Blue',colorSource:'photo-estimate',savedAt:'2026-10-18T23:51:00Z'});
  const b=normalizeClothing({...original,id:'review-second-uncategorized',
   name:'Unknown item B',category:'Uncategorized',itemType:'Unknown',
   color:'',savedAt:'2026-10-18T23:52:00Z'});
  a.originalPhoto={image:original.image};
  await writeAll([a,b]);
  items.push(a,b);
  render();
  return {first:JSON.stringify(a),second:JSON.stringify(b),
   originalImage:a.image,sourceImage:a.originalPhoto.image};
 });
 assert.equal(await page.locator('#closetUnsorted').isVisible(),true);
 assert.match(await page.locator('#closetUnsorted').innerText(),/2/);
 await page.locator('#closetUnsorted').click();
 const queue=page.locator('dialog.closet-quick-review');
 await queue.waitFor({state:'visible'});
 assert.equal(await queue.locator('img.closet-quick-review-photo').getAttribute('src'),beforeReview.originalImage);
 assert.equal(await queue.getByLabel('Clothing category').inputValue(),'');
 assert.equal(await queue.getByLabel('Garment color').inputValue(),'');
 assert.equal(await queue.getByRole('button',{name:'Save & next'}).count(),1);
 await queue.getByLabel('Clothing category').selectOption('Bottoms');
 // Save remains blocked until color is explicitly selected.
 await queue.getByRole('button',{name:'Save & next'}).click();
 assert.equal(await queue.isVisible(),true);
 assert.equal(await page.evaluate(()=>items.find(x=>x.id==='review-first-uncategorized').category),
  'Uncategorized');
 await queue.getByLabel('Garment color').selectOption('Green');
 await queue.getByRole('button',{name:'Save & next'}).click();
 await page.waitForFunction(()=>items.find(x=>x.id==='review-first-uncategorized').category==='Bottoms');
 await queue.waitFor({state:'visible'});
 assert.equal(await queue.locator('img.closet-quick-review-photo').getAttribute('alt'),'Unknown item B');
 assert.equal(await page.evaluate(()=>{
  const x=items.find(x=>x.id==='review-first-uncategorized');
  return x.color==='Green'&&x.colorSource==='user'&&x.itemType==='Unknown'&&
    x.sleeveLength==='Not applicable'&&x.image===items.find(y=>y.id==='new-green-top').image;
 }),true);
 await queue.getByRole('button',{name:'Skip for now'}).click();
 await queue.waitFor({state:'detached'});
 assert.match(await page.locator('#closetUnsorted').innerText(),/1/);
 await page.locator('#closetUnsorted').click();
 await queue.waitFor({state:'visible'});
 assert.equal(await queue.locator('img.closet-quick-review-photo').getAttribute('alt'),'Unknown item B');
 await queue.getByRole('button',{name:'Close'}).click();
 await queue.waitFor({state:'detached'});
 await page.reload();
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 const reviewed=await page.evaluate(()=>({
  first:items.find(x=>x.id==='review-first-uncategorized'),
  second:items.find(x=>x.id==='review-second-uncategorized')
 }));
 assert.equal(reviewed.first.category,'Bottoms');
 assert.equal(reviewed.first.color,'Green');
 assert.equal(reviewed.first.colorSource,'user');
 assert.equal(reviewed.first.image,beforeReview.originalImage);
 assert.equal(reviewed.first.originalPhoto.image,beforeReview.sourceImage);
 assert.equal(reviewed.second.category,'Uncategorized');
 assert.equal(reviewed.second.color,'');
 assert.equal(await page.locator('#closetUnsorted').count(),1);
 // Exercise the actual button handler across more than two choices. Engine
 // tests alone cannot prove that the UI carries swap history between taps.
 const swapBaseline=await page.evaluate(()=>{
  const shoe=items.find(x=>x.id==='owned-white-sneakers');
  items.push({...shoe,id:'third-owned-shoe'},{...shoe,id:'fourth-owned-shoe'});
  styleNewClosetItem('new-green-top');
  return {saved:savedOutfitBoards.length,items:JSON.stringify(items)};
 });
 await page.locator('#styledCollectionResults .styled-outfit').first().waitFor();
 const cycle=[await page.evaluate(()=>styledCollectionResults[0].board.slots.shoes)];
 for(let tap=0;tap<7;tap++){
  await page.locator('#styledCollectionResults .styled-outfit').first()
   .getByRole('button',{name:'Swap shoes in option 1'}).tap();
  const state=await page.evaluate(()=>({
   shoe:styledCollectionResults[0].board.slots.shoes,
   top:styledCollectionResults[0].board.slots.top,
   saved:savedOutfitBoards.length,items:JSON.stringify(items)
  }));
  cycle.push(state.shoe);assert.equal(state.top,'new-green-top');
  assert.equal(state.saved,swapBaseline.saved);assert.equal(state.items,swapBaseline.items);
 }
 assert.equal(new Set(cycle.slice(0,4)).size,4,'all four owned shoes are reachable');
 assert.equal(new Set(cycle.slice(4,8)).size,4,'repeat cycle reaches every shoe again');
 // A failed preview write must not block local viewing or create an
 // unhandled rejection. The real UI action and rendering path still run.
 await page.evaluate(()=>{
  window.__restorePreviewPersistence=persistBoardState;
  persistBoardState=async()=>{throw Error('Synthetic preview storage failure');};
 });
 await page.locator('#styledCollectionResults .styled-outfit').first()
  .getByRole('button',{name:'Preview on model'}).click();
 await page.locator('#builder:not([hidden])').waitFor();
 await page.waitForFunction(()=>document.getElementById('boardSaveStatus').textContent.includes('preview is available'));
 assert.equal(await page.evaluate(()=>currentBoard.slots.top),'new-green-top');
 await page.evaluate(()=>{persistBoardState=window.__restorePreviewPersistence;switchView('stylist');});
 // Rebuilding recommendations during an in-flight save must preserve the
 // disabled state, otherwise a second tap would create a duplicate outfit.
 await page.evaluate(()=>{
  const original=saveOwnedOutfitBoard;let release;
  const gate=new Promise(ok=>release=ok);window.__saveRelease=release;
  window.__saveCalls=0;window.__restoreOutfitSave=original;
  saveOwnedOutfitBoard=async value=>{window.__saveCalls++;await gate;return original(value);};
 });
 await page.locator('#styledCollectionResults .styled-outfit').first()
  .getByRole('button',{name:'Save outfit',exact:true}).click();
 await page.evaluate(()=>renderStyledCollection());
 assert.equal(await page.locator('#styledCollectionResults .styled-outfit').first()
  .getByRole('button',{name:'Saving outfit…',exact:true}).isDisabled(),true);
 await page.evaluate(()=>window.__saveRelease());
 await page.locator('#styledCollectionResults .styled-outfit').first()
  .getByRole('button',{name:'Saved',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.__saveCalls),1);
 await page.evaluate(()=>{saveOwnedOutfitBoard=window.__restoreOutfitSave;});
 // Actual IndexedDB abort followed by an overlapping successful save.
 // Neither the in-memory wardrobe nor a later write may retain the failed one.
 const failedSaveProbe=await page.evaluate(async()=>{
  await queued(()=>Promise.resolve());
  const baseline=savedOutfitBoards.length,original=JSON.stringify(items);
  const native=db.transaction.bind(db);let abortNext=true;
  db.transaction=function(stores,mode,...rest){
   const tx=native(stores,mode,...rest);
   if(abortNext&&stores==='state'&&mode==='readwrite'){
    abortNext=false;queueMicrotask(()=>tx.abort());
   }
   return tx;
  };
  let outcomes;
  try{
   const slots={...styledCollectionResults[0].board.slots};
   outcomes=await Promise.allSettled([
    saveOwnedOutfitBoard({name:'Synthetic failed save',slots}),
    saveOwnedOutfitBoard({name:'Synthetic successful save',slots})
   ]);
  }finally{db.transaction=native;}
  const stored=await new Promise((ok,no)=>{
   const req=native('state','readonly').objectStore('state').get('outfit-board');
   req.onsuccess=()=>ok(req.result);req.onerror=()=>no(req.error);
  });
  return {outcomes:outcomes.map(x=>x.status),count:savedOutfitBoards.length-baseline,
   memoryFailed:savedOutfitBoards.some(x=>x.name==='Synthetic failed save'),
   diskFailed:stored.saved.some(x=>x.name==='Synthetic failed save'),
   diskSuccess:stored.saved.some(x=>x.name==='Synthetic successful save'),
   unchanged:JSON.stringify(items)===original};
 });
 assert.deepEqual(failedSaveProbe,{outcomes:['rejected','fulfilled'],count:1,
  memoryFailed:false,diskFailed:false,diskSuccess:true,unchanged:true});
 // Long wardrobe labels and model-preview actions must fit narrow phones.
 await page.evaluate(()=>{
  items.find(x=>x.id==='new-green-top').name='LongGarmentName'.repeat(9);
  styleNewClosetItem('new-green-top');
 });
 await page.locator('#styledCollectionResults .styled-outfit').first().waitFor();
 const responsive=[];
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});
  const bounds=await page.locator('#styledCollectionResults .styled-outfit').first().evaluate(card=>{
   const rect=card.getBoundingClientRect();
   const overflow=[...card.querySelectorAll('figure,figcaption,button')].some(el=>{
    const box=el.getBoundingClientRect();return box.left<rect.left-1||box.right>rect.right+1;
   });
   return {overflow,width:rect.width,tapHeights:[...card.querySelectorAll('.actions button')]
    .map(b=>b.getBoundingClientRect().height)};
  });
  assert.equal(bounds.overflow,false,'long garment labels/actions fit '+width+'px');
  assert.ok(bounds.width<=width);
  assert.ok(bounds.tapHeights.every(height=>height>=48),'comfortable preview/save buttons');
  responsive.push({width,overflow:false});
 }
 await page.setViewportSize({width:390,height:844});
 await mkdir('artifacts/local-fitting',{recursive:true});
 await page.screenshot({path:'artifacts/local-fitting/style-'+(process.env.STYLE_BROWSER||'chromium')+'.png',fullPage:true});
 // Customer handoff: the home shortcut always selects single-item mode.
 await page.evaluate(()=>{switchView('home');setCaptureMode('outfit');});
 await page.locator('#styleNewClothes').click();
 assert.equal(await page.locator('#captureSingle').getAttribute('aria-pressed'),'true');
 // Existing recognition/source-before-crop tests cover acquisition and indexing.
 // These synthetic display assets test UI/render lifecycle, not photo accuracy.
 await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=120;c.height=180;
  const x=c.getContext('2d');x.fillStyle='#245cd1';x.fillRect(24,20,72,140);
  items.find(x=>x.id==='new-green-top').image=c.toDataURL('image/png');
  styleNewClosetItem('new-green-top');
 });
 await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Preview on model'}).click();
 await page.locator('#reusableFigureStage').waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>document.activeElement.id),'reusableFigureStage');
 assert.equal(await page.evaluate(()=>currentBoard.slots.top),'new-green-top');
 await page.waitForFunction(()=>document.querySelector('#reusableFigureStage').getAttribute('aria-busy')==='false');
 // A direct source edit during final PNG decode must not publish the old photo.
 await page.evaluate(()=>{
  currentBoard.slots={top:'new-green-top'};
  window.__nativeDecode=HTMLImageElement.prototype.decode;
  window.__gateSeen=false;
  HTMLImageElement.prototype.decode=function(){
   const native=window.__nativeDecode.call(this);
   if(!this.classList.contains('reusable-figure-layer')||window.__gateSeen)return native;
   window.__gateSeen=true;
   return Promise.all([native,new Promise(ok=>window.__releaseDecode=ok)]);
  };
  document.querySelector('#reusableFigureRetry').click();
 });
 await page.waitForFunction(()=>window.__releaseDecode);
 await page.evaluate(()=>{
  items.find(x=>x.id==='new-green-top').color='Red';
  window.__releaseDecode();HTMLImageElement.prototype.decode=window.__nativeDecode;
 });
 await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus').textContent.includes('selection changed'));
 assert.equal(await page.locator('#reusableFigureGarments img').count(),0);
 await page.locator('#reusableFigureRetry').click();
 try{await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===1);}catch(error){
  console.log('RECOVERY_DIAGNOSTIC',await page.evaluate(()=>({status:document.querySelector('#reusableFigureStatus').textContent,
   board:currentBoard.slots,selected:items.filter(x=>Object.values(currentBoard.slots).includes(x.id)).map(x=>({id:x.id,category:x.category,color:x.color,sourceLength:x.image.length})),
   busy:document.querySelector('#reusableFigureStage').getAttribute('aria-busy')})));throw error;
 }
 // The old account cannot publish a final decoded garment after sign-in changes.
 await page.evaluate(()=>{
  window.__priorPreviewOwner=window.closetAuth.user.id;
  window.__accountGateSeen=false;
  HTMLImageElement.prototype.decode=function(){
   const native=window.__nativeDecode.call(this);
   if(!this.classList.contains('reusable-figure-layer')||window.__accountGateSeen)return native;
   window.__accountGateSeen=true;
   return Promise.all([native,new Promise(ok=>window.__releaseAccountDecode=ok)]);
  };
  document.querySelector('#reusableFigureRetry').click();
 });
 await page.waitForFunction(()=>window.__releaseAccountDecode);
 await page.evaluate(()=>{
  window.closetAuth.user.id='synthetic-different-preview-owner';
  window.__releaseAccountDecode();HTMLImageElement.prototype.decode=window.__nativeDecode;
 });
 await page.waitForFunction(()=>document.querySelector('#reusableFigureStatus').textContent.includes('selection changed'));
 assert.equal(await page.locator('#reusableFigureGarments img').count(),0);
 assert.equal(await page.locator('#reusableFigureSelfie').isVisible(),false);
 // A newly started operation must also refuse the still-open previous DB.
 const wrongDatabase=await page.evaluate(async()=>{
  const native=db.transaction.bind(db);let writes=0;
  db.transaction=function(stores,mode,...rest){if(mode==='readwrite')writes++;return native(stores,mode,...rest);};
  const before=savedOutfitBoards.length;
  try{
   const result=await Promise.allSettled([saveOwnedOutfitBoard(currentBoard),persistBoardState()]);
   const stylingStarted=styleNewClosetItem('new-green-top');
   renderReusableFigurePreview();
   await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
   return {outcomes:result.map(x=>x.status),writes,saved:savedOutfitBoards.length-before,
    stylingStarted,suggestions:styledCollectionResults.length,styleAccountMessage:$('stylistStatus').textContent,
    layers:document.querySelectorAll('#reusableFigureGarments img').length,
    message:document.querySelector('#reusableFigureStatus').textContent,
    busy:document.querySelector('#reusableFigureStage').getAttribute('aria-busy')};
  }finally{db.transaction=native;}
 });
 assert.deepEqual(wrongDatabase.outcomes,['rejected','rejected']);
 assert.equal(wrongDatabase.writes,0);assert.equal(wrongDatabase.saved,0);
 assert.equal(wrongDatabase.layers,0);assert.equal(wrongDatabase.busy,'false');
 assert.equal(wrongDatabase.stylingStarted,false);assert.equal(wrongDatabase.suggestions,0);
 assert.match(wrongDatabase.styleAccountMessage,/account/);
 assert.match(wrongDatabase.message,/account/);
 await page.evaluate(()=>{window.closetAuth.user.id=window.__priorPreviewOwner;renderOutfitBoard();});
 await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===1);
 // A stalled browser decoder must become a retryable hold, never spin forever.
 await page.evaluate(()=>{
  window.__stallRenderRequests=[];window.__stallDecodes=0;
  window.__restoreRenderRequest=renderReusableFigurePreview;
  window.renderReusableFigurePreview=()=>{window.__stallRenderRequests.push(performance.now());window.__restoreRenderRequest();};
  HTMLImageElement.prototype.decode=function(){window.__stallDecodes++;return new Promise(()=>{});};
  document.querySelector('#reusableFigureRetry').click();
  window.__stallRefresh=setInterval(()=>renderReusableFigurePreview(),200);
 });
 try{await page.waitForFunction(()=>document.querySelector('#reusableFigureStage').getAttribute('aria-busy')==='false',null,{timeout:10000});}
 catch(error){console.log('STALL_DIAGNOSTIC',await page.evaluate(()=>({
  status:$('reusableFigureStatus').textContent,busy:$('reusableFigureStage').getAttribute('aria-busy'),
  requests:window.__stallRenderRequests,decodes:window.__stallDecodes,hidden:document.hidden,
  view:[...document.querySelectorAll('.view')].filter(x=>!x.hidden).map(x=>x.id),
  owner:window.closetAuth?.user?.id,database:db?.name,
  layers:$('reusableFigureGarments').children.length
 })));throw error;}
 await page.evaluate(()=>{clearInterval(window.__stallRefresh);window.renderReusableFigurePreview=window.__restoreRenderRequest;});
 assert.equal(await page.locator('#reusableFigureRetry').isVisible(),true);
 await page.evaluate(()=>HTMLImageElement.prototype.decode=window.__nativeDecode);
 await page.locator('#reusableFigureRetry').click();
 try{await page.waitForFunction(()=>document.querySelectorAll('#reusableFigureGarments img').length===1);}catch(error){
  console.log('RECOVERY_DIAGNOSTIC',await page.evaluate(()=>({status:document.querySelector('#reusableFigureStatus').textContent,
   board:currentBoard.slots,selected:items.filter(x=>Object.values(currentBoard.slots).includes(x.id)).map(x=>({id:x.id,category:x.category,color:x.color,sourceLength:x.image.length})),
   busy:document.querySelector('#reusableFigureStage').getAttribute('aria-busy')})));throw error;
 }
 assert.equal(await page.locator('#reusableFigureRetry').isVisible(),false);
 const reuseMeasurement=await page.evaluate(async()=>{
  const box=document.querySelector('#reusableFigureGarments'),before=[...box.children];
  const start=performance.now();let mutations=0;
  const observer=new MutationObserver(rows=>mutations+=rows.length);
  observer.observe(box,{childList:true});
  for(let i=0;i<12;i++)renderReusableFigurePreview();
  await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
  observer.disconnect();
  return {requests:12,elapsedMs:performance.now()-start,mutations,
   sameNodes:before.every((item,i)=>box.children[i]===item)};
 });
 assert.equal(reuseMeasurement.mutations,0);assert.equal(reuseMeasurement.sameNodes,true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal phone overflow');
 await mkdir('artifacts/style-new-clothes',{recursive:true});
 const evidenceName=process.env.STYLE_BROWSER==='webkit'?'iphone-webkit':'android-chromium';
 await page.screenshot({path:'artifacts/style-new-clothes/'+evidenceName+'.png',fullPage:true});
 await writeFile('artifacts/style-new-clothes/'+evidenceName+'.json',JSON.stringify({
  engine:evidenceName,actualPhysicalPhone:false,syntheticDisplayFixture:true,
  newClothesShortcut:true,ownedOutfitModelHandoff:true,sourceEditRaceBlocked:true,crossAccountRenderBlocked:true,priorAccountDatabaseBlocked:true,
  boundedDecodeRetry:true,horizontalOverflow:false,reuseMeasurement,pageErrors:errors
 },null,2));

 // Recommendation quality: owned dress and separates choices, a structure-safe
 // dress swap, actual outfit persistence/reload and varied pinned-shirt bottoms.
 // Fixture records are synthetic; no recognition or visual-fitting score is claimed.
 const qualityOriginal=await page.evaluate(async()=>{
  const original=JSON.stringify(items),image=items.find(x=>x.id==='new-green-top').image;
  const make=(id,category,itemType,color='Black')=>normalizeClothing({
   id:'rq-'+id,name:id,category,itemType,color,image,pattern:'Solid',seasons:[]});
  const records=[...Array.from({length:12},(_,i)=>make('top-'+i,'Tops','T-shirt')),
   make('dress-a','Dresses','Casual dress'),make('dress-b','Dresses','Sweater dress'),
   make('jeans-a','Bottoms','Jeans'),make('jeans-b','Bottoms','Jeans'),
   make('footwear','Shoes','Sneakers')];
  await writeAll(records);items.push(...records);
  $('stylistOccasion').value='Casual';$('stylistAudience').value='All';$('stylistSeason').value='Winter';
  styleNewClosetItem('rq-footwear');return original;
 });
 await page.waitForFunction(()=>styledCollectionResults.length>0&&styledCollectionResults.every(r=>r.board.slots.shoes==='rq-footwear'));
 const dressIndex=await page.evaluate(()=>styledCollectionResults.findIndex(r=>
  items.find(x=>x.id===r.board.slots.top)?.category==='Dresses'));
 assert.ok(dressIndex>=0,'large shirt collection retains an owned dress choice');
 const dressCard=page.locator('#styledCollectionResults .styled-outfit').nth(dressIndex);
 await dressCard.getByRole('button',{name:'Swap dress in option '+(dressIndex+1)}).click();
 const dressSnapshot=await page.evaluate(index=>{
  const result=styledCollectionResults[index];return {slots:{...result.board.slots},
   missing:result.missing,owned:Object.values(result.board.slots).every(id=>items.some(x=>x.id===id))};
 },dressIndex);
 assert.equal(dressSnapshot.owned,true);assert.deepEqual(dressSnapshot.missing,[]);
 assert.equal(dressSnapshot.slots.shoes,'rq-footwear');
 assert.equal(dressSnapshot.slots.bottom,undefined);assert.equal(dressSnapshot.slots.layer,undefined);
 await dressCard.getByRole('button',{name:'Save outfit',exact:true}).click();
 await dressCard.getByRole('button',{name:'Saved',exact:true}).waitFor();
 await page.evaluate(()=>styleNewClosetItem('rq-top-0'));
 await page.waitForFunction(()=>styledCollectionResults.length>0&&styledCollectionResults.every(r=>r.board.slots.top==='rq-top-0'));
 const variety=await page.evaluate(()=>new Set(styledCollectionResults.map(r=>r.board.slots.bottom)).size);
 assert.ok(variety>=2,'options vary owned bottoms before repeating just shoes');
 assert.equal(await page.evaluate(()=>JSON.stringify(items.filter(x=>!x.id.startsWith('rq-')))),qualityOriginal);
 await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 assert.equal(await page.evaluate(snapshot=>savedOutfitBoards.some(x=>
  JSON.stringify(x.slots)===JSON.stringify(snapshot.slots)),dressSnapshot),true,'dress outfit survives actual IndexedDB reload');
 await writeFile('artifacts/style-new-clothes/recommendations-'+evidenceName+'.json',JSON.stringify({
  actualPhysicalPhone:false,syntheticFixtures:true,ownedDressPreserved:true,
  dressSwapKeepsStructure:true,dressSaveReload:true,variedOwnedBottoms:variety,
  originalOwnedRecordsUnchanged:true,pageErrors:errors
 },null,2));
 assert.deepEqual(errors,[]);
 console.log('NEW_ITEM_STYLE_MOBILE '+JSON.stringify({
  result:'passed',viewport:'390x844 touch',outfitOptions:outfits.length,
  anchorPersisted:true,directOneTapSwap:true,previewNotAutoSaved:true,
  directSwappedOutfitSaved:true,onePieceSwapSaved:true,reloadVerified:true,
  recentGarmentExactOpen:true,duplicateNameSafe:true,oldFiltersCleared:true,
  unsortedCategoryColorSaved:true,unsortedQueueSkipResumes:true,
  originalUnsortedPhotoPreserved:true,offlineTrendSafe:true,
  allOwnedSwapChoicesReachable:true,previewStorageFailureRecoverable:true,pendingSaveRerenderProtected:true,concurrentSaveAbortIsolated:true,responsiveWidths:responsive,actualPhoneVerified:false,pageErrors:errors.length
 }));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
