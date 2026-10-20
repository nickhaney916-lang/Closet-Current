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
 assert.deepEqual(errors,[]);
 console.log('NEW_ITEM_STYLE_MOBILE '+JSON.stringify({
  result:'passed',viewport:'390x844 touch',outfitOptions:outfits.length,
  anchorPersisted:true,directOneTapSwap:true,previewNotAutoSaved:true,
  directSwappedOutfitSaved:true,onePieceSwapSaved:true,reloadVerified:true,
  recentGarmentExactOpen:true,duplicateNameSafe:true,oldFiltersCleared:true,
  unsortedCategoryColorSaved:true,unsortedQueueSkipResumes:true,
  originalUnsortedPhotoPreserved:true,offlineTrendSafe:true,
  allOwnedSwapChoicesReachable:true,responsiveWidths:responsive,actualPhoneVerified:false,pageErrors:errors.length
 }));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
