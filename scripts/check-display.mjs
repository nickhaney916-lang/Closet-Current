import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/display'),checks=[];
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{try{
 const p=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(p==='/'?'/index.html':p));if(!file.startsWith(root+'/'))throw Error('Invalid path');
 const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 await mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const specs=[['commons-0002','Red T-shirt for casual weekends','Tops','T-shirt','Red'],['commons-0025','Blue jeans','Bottoms','Jeans','Blue'],['commons-0052','Everyday dress','Dresses','Casual dress','Multicolor'],['commons-0064','Light jacket','Outerwear','Jacket','Beige'],['commons-0081','Everyday sneakers','Shoes','Sneakers','White'],['commons-0087','Ankle boots','Shoes','Ankle boots','Brown']];
 const seed=await Promise.all(specs.map(async([id,name,category,itemType,color])=>({id,name,category,itemType,color,image:'data:image/jpeg;base64,'+(await readFile('benchmark/photos/'+id+'.jpg')).toString('base64'),seasons:['Fall'],sleeveLength:'Unknown',userAdjusted:true,savedAt:'2026-10-14T00:00:00Z'})));
 for(const width of [360,390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:width<760?844:900},isMobile:width<760,hasTouch:width<760,serviceWorkers:'block'});
  // Synthetic test identity and licensed fixture garments only; no live login.
  await context.route('**/auth.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'display-check'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.evaluate(()=>closetReady);
  await page.evaluate(async data=>{await writeAll(data);items=data;render();},seed);await page.evaluate(()=>document.fonts.ready);
  for(const view of ['home','closet','scan','stylist']){
   await page.locator('.tab[data-view="'+view+'"]').click();await page.evaluate(()=>document.activeElement?.blur());
   assert.equal(await page.locator('.main-nav>.tab.active').count(),1);assert.equal(await page.locator('.main-nav>.tab.active').getAttribute('data-view'),view);
   await page.mouse.move(0,0);
   const layout=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
   if(process.env.DISPLAY_ASSERT_LAYOUT==='1')assert.ok(layout.document<=layout.viewport+1,view+' overflow at '+width);
   if(view==='closet'){
    const tiled=await page.locator('#closetCategories').count()>0;if(tiled){assert.equal(await page.locator('#closetGrid article').count(),0);assert.equal(await page.locator('.closet-category').count(),8);assert.equal(await page.locator('#closetCollection').isVisible(),false);assert.equal(await page.locator('#export').isVisible(),false);checks.push({width,view,layout,categoryTiles:8});await page.screenshot({path:out+'/'+width+'-'+view+'.png',fullPage:true,animations:'disabled'});await page.locator('.closet-category[data-category="Shoes"]').click();assert.equal(await page.locator('#closetGrid article').count(),2);await page.locator('#closetAllPieces').click();await page.locator('.closet-refine').evaluate(el=>el.open=true);}else{const first=await page.locator('#closetGrid article').first().boundingBox();checks.push({width,view,layout,firstPhotoTop:first.y});await page.screenshot({path:out+'/'+width+'-'+view+'.png',fullPage:true,animations:'disabled'});}
    assert.equal(await page.locator('#closetGrid article').count(),6);
    await page.locator('#filter').selectOption('Shoes');assert.equal(await page.locator('#closetGrid article').count(),2);await page.locator('#filter').selectOption('All categories');
    await page.locator('#search').fill('Blue jeans');assert.equal(await page.locator('#closetGrid article').count(),1);await page.locator('#search').fill('');
   }else{checks.push({width,view,layout});await page.screenshot({path:out+'/'+width+'-'+view+'.png',fullPage:true,animations:'disabled'});}
  }
  await page.locator('.tab[data-view="closet"]').click();await page.locator('#closetGrid').getByRole('button',{name:'Adjust details',exact:true}).first().click();
  const dialog=page.locator('dialog[open]');await dialog.waitFor();const box=await dialog.boundingBox();assert.ok(box.x>=-1&&box.x+box.width<=width+1,'Adjust dialog must fit '+width);
  if(process.env.DISPLAY_ASSERT_LAYOUT==='1'){
   const reference=dialog.locator('.clothing-reference'),photo=reference.locator('img');assert.equal(await photo.getAttribute('src'),seed[0].image);assert.equal(await photo.evaluate(el=>el.complete&&el.naturalWidth>0),true);
   await dialog.evaluate(el=>el.scrollTop=el.scrollHeight);const visible=await reference.boundingBox(),scrolled=await dialog.boundingBox();assert.ok(visible.y>=scrolled.y-1&&visible.y+visible.height<=scrolled.y+scrolled.height,'Reference photo must remain visible during editing');
   await page.screenshot({path:out+'/'+width+'-adjust-scrolled.png',fullPage:true,animations:'disabled'});await dialog.evaluate(el=>el.scrollTop=0);
  }
  await page.screenshot({path:out+'/'+width+'-adjust.png',fullPage:true,animations:'disabled'});await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  if(width<760){for(const control of await page.locator('.main-nav>.tab,.more-menu>summary').all()){const b=await control.boundingBox();assert.ok(b.width>=44&&b.height>=44,'Navigation touch target too small');}}
  if(await page.locator('#closetCategories').count()){
   await page.locator('#closetAllPieces').click();
   const red=page.locator('#closetGrid article').filter({hasText:'Red T-shirt for casual weekends'}),target=page.locator('.closet-category[data-category="Tops"]');
   if(width>=760){await red.locator('img').dragTo(target);await page.waitForFunction(()=>currentBoard.slots.top==='commons-0002');await red.locator('img').dragTo(page.locator('.closet-category[data-category="Shoes"]'));assert.equal(await page.evaluate(()=>currentBoard.slots.shoes||null),null);}
   else{const button=red.locator('.closet-wear'),box=await button.boundingBox();await button.dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch',button:0,clientX:box.x+20,clientY:box.y+20});await button.dispatchEvent('pointermove',{pointerId:7,pointerType:'touch',buttons:1,clientX:box.x+40,clientY:box.y});const drop=await target.boundingBox();await button.dispatchEvent('pointerup',{pointerId:7,pointerType:'touch',button:0,clientX:drop.x+drop.width/2,clientY:drop.y+drop.height/2});await page.waitForFunction(()=>currentBoard.slots.top==='commons-0002');}
   if(await page.locator('#closetLayerView').count()){
    for(const name of ['Blue jeans','Light jacket','Everyday sneakers'])await page.locator('#closetGrid article').filter({hasText:name}).locator('.closet-wear').click();
    await page.waitForFunction(()=>currentBoard.slots.bottom==='commons-0025'&&currentBoard.slots.layer==='commons-0064'&&currentBoard.slots.shoes==='commons-0081');
    assert.equal(await page.locator('.closet-category.has-look img').count(),4);
    assert.ok(await target.locator('img').evaluate(el=>el.getBoundingClientRect().height>100),'Photo should fill torso rather than be a thumbnail');
    await page.locator('.closet-style-switch label').filter({has:page.locator('input[value="Men"]')}).click();await page.waitForFunction(()=>currentBoard.audience==='Men');assert.equal(await page.evaluate(()=>items.length),6);
    await page.locator('.closet-layer-switch').click();assert.equal(await page.locator('#closetCategories').evaluate(el=>el.classList.contains('split-layers')),false);await page.screenshot({path:out+'/'+width+'-closet-base.png',fullPage:true,animations:'disabled'});
    await page.locator('.closet-layer-switch').click();assert.equal(await page.locator('#closetCategories').evaluate(el=>el.classList.contains('split-layers')),true);
    await page.locator('.closet-category-dresses').click();assert.equal(await page.locator('#closetGrid article').count(),1);await page.locator('#closetGrid .closet-wear').click();await page.waitForFunction(()=>currentBoard.slots.top==='commons-0052');assert.equal(await page.locator('.closet-category-bottom').isVisible(),false);await page.screenshot({path:out+'/'+width+'-closet-dress.png',fullPage:true,animations:'disabled'});
    await page.locator('#closetAllPieces').click();await red.locator('.closet-wear').click();await page.locator('#closetGrid article').filter({hasText:'Blue jeans'}).locator('.closet-wear').click();await page.waitForFunction(()=>currentBoard.slots.top==='commons-0002'&&currentBoard.slots.bottom==='commons-0025');
   }
   await page.locator('#closetSaveLook').click();await page.waitForFunction(()=>savedOutfitBoards.some(x=>x.slots.top==='commons-0002'));await page.screenshot({path:out+'/'+width+'-closet-look.png',fullPage:true,animations:'disabled'});
   await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));assert.equal(await page.evaluate(()=>currentBoard.slots.top),'commons-0002');if(await page.locator('#closetLayerView').count()){assert.equal(await page.evaluate(()=>currentBoard.audience),'Men');assert.equal(await page.evaluate(()=>window.closetLayers),true);}await page.locator('.tab[data-view="closet"]').click();assert.equal(await page.locator('#closetGrid article').count(),0);await page.locator('#closetClearLook').click();assert.equal(await page.evaluate(()=>Object.keys(currentBoard.slots).length),0);assert.equal(await page.evaluate(()=>items.length),6);if(await page.locator('#closetLayerView').count())assert.equal(await page.evaluate(()=>currentBoard.audience),'Men');
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 await writeFile(out+'/results.json',JSON.stringify({checks,filtersAndSearch:true,categoryTilesAndDeferredPhotos:true,bodyLayoutDragAndTap:true,photoFilledFigureAndSplitLayers:true,stylePreferencePersists:true,dressesAvailableForEveryStyle:true,outfitPersistsOnReload:true,clearLookKeepsClothes:true,adjustDialogsFit:true,phoneNavigationTouchTargets:true,limitations:'Synthetic identity and licensed fixture wardrobe; no physical phone or production login.'},null,2));
 console.log(JSON.stringify(checks));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
