// Integrated importer -> original RGB classifier handoff -> owner storage -> owned styling.
// Classifier, Auth and cloud are synthetic fixtures; no real garment/hardware claims.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname,
   file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(root+'/'))throw Error('Unsafe path');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));

try{
 for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'integrated-pilot-owner'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetCloud={beforeWrite:async()=>{},changed(){},start(){}};"}));
   await context.route('**/local-worker.mjs*',route=>route.fulfill({contentType:'text/javascript',body:
    "self.onmessage=event=>self.postMessage({type:'error',id:event.data.id,text:'Synthetic interrupted scanner; retry preserves your photo.'});"}));
   await context.route('https://**',route=>route.abort('internetdisconnected'));
   const page=await context.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')uploads.push(r.url());});
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   const importCheck=await page.evaluate(async()=>{
    scheduleMemoryReview=()=>{};localReady=true;
    const make=(id,category,itemType,color)=>normalizeClothing({id,category,itemType,color,name:id,seasons:[],pattern:'Solid',
     image:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><rect width="100" height="150" fill="'+color.toLowerCase()+'"/></svg>')});
    const owned=[make('owned-jeans','Bottoms','Jeans','Blue'),make('owned-shoes','Shoes','Sneakers','White')];
    await writeAll(owned);items.push(...owned);
    window.classifierInputs=[];checkPhoto=async image=>({blank:false,signature:[image.length,81,151],aspect:4/3});
    localRequest=async(type,image)=>{classifierInputs.push(image);return {strong:true,choices:[{category:'Tops',itemType:'T-shirt',label:'a T-shirt',sleeveLength:'Short sleeve'}],details:{color:'Green',pattern:'Solid'}};};
    const canvas=document.createElement('canvas');canvas.width=3600;canvas.height=2700;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#eee';ctx.fillRect(0,0,3600,2700);ctx.fillStyle='#248934';ctx.fillRect(600,300,2400,2100);
    for(let i=0;i<100;i++){ctx.fillStyle=i%2?'#204026':'#a8e0b3';ctx.fillRect(600+i*22,400,5,1700);}
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));
    await importClothingPhotos([new File([blob],'new-high-resolution.JPG',{type:''})]);
    return {owner:db.name};
   });
   assert.equal(importCheck.owner,'closet-current-user-integrated-pilot-owner');
   await page.waitForFunction(()=>!automaticRunning&&items.some(x=>x.importFilename==='new-high-resolution.JPG'));
   const indexed=await page.evaluate(async()=>{
    await writes;const item=(await readAll()).find(x=>x.importFilename==='new-high-resolution.JPG');window.importedId=item.id;window.importedPhoto=item.image;
    const image=new Image();image.src=item.image;await image.decode();
    return {id:item.id,category:item.category,type:item.itemType,color:item.color,width:image.naturalWidth,height:image.naturalHeight,
     originalUsed:classifierInputs.length===1&&classifierInputs[0]===item.image,duplicateSkipped:candidate(item.image)===false};
   });
   assert.deepEqual({...indexed,id:null},{id:null,category:'Tops',type:'T-shirt',color:'Green',width:3072,height:2304,originalUsed:true,duplicateSkipped:true});
   await page.evaluate(()=>{switchView('closet');render();});
   await page.locator('#closetAllPieces').click();
   await page.locator('#closetGrid article[data-item-id="'+indexed.id+'"]').getByRole('button',{name:'Style this',exact:true}).click();
   await page.locator('#styledCollectionResults .styled-outfit').first().waitFor();
   const options=await page.evaluate(()=>styledCollectionResults.map(x=>x.board.slots));
   assert.ok(options.length>0&&options.every(x=>x.top===indexed.id));
   assert.ok(options.every(x=>x.bottom==='owned-jeans'&&x.shoes==='owned-shoes'));
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Save outfit',exact:true}).click();
   await page.getByText('Saved. Find it in Outfit builder → Saved outfits.').first().waitFor();
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Preview on model',exact:true}).click();
   await page.locator('#builder:not([hidden])').waitFor();
   const preview=await page.evaluate(()=>({top:currentBoard.slots.top,bottom:currentBoard.slots.bottom,shoes:currentBoard.slots.shoes,
    saved:savedOutfitBoards.some(x=>x.slots.top===importedId),sourceKept:items.find(x=>x.id===importedId).image===importedPhoto}));
   assert.deepEqual(preview,{top:indexed.id,bottom:'owned-jeans',shoes:'owned-shoes',saved:true,sourceKept:true});
   const draft=await page.evaluate(async()=>{
    queueAutomatic=()=>{};
    const image=document.createElement('canvas');image.width=900;image.height=1200;
    const ctx=image.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,900,1200);ctx.fillStyle='#a12b48';ctx.fillRect(150,160,600,800);
    const photo=image.toDataURL('image/jpeg',.94);candidate(photo);await persistDraft();await writes;
    return {id:batch[0].id,source:photo};
   });
   await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.waitForFunction(()=>batch.some(x=>x.scanFailed));
   const restored=await page.evaluate(async({id,source})=>{
    await writes;const item=batch.find(x=>x.id===id),saved=(await readAll()).find(x=>x.importFilename==='new-high-resolution.JPG');
    return {draftKept:item?.image===source,scannerFailed:item?.scanFailed===true,garmentKept:!!saved,
     outfitKept:savedOutfitBoards.some(x=>x.slots.top===saved.id),owner:db.name};
   },draft);
   assert.deepEqual(restored,{draftKept:true,scannerFailed:true,garmentKept:true,outfitKept:true,owner:importCheck.owner});
   assert.deepEqual(errors,[]);assert.deepEqual(uploads,[]);
   console.log('INTEGRATED_PILOT_JOURNEY '+JSON.stringify({browser:label,highResolutionImported:[3072,2304],originalRGBClassifierInput:true,
    namedOwnerIndexedDB:true,ownedOnlyStyle:true,previewAndOutfitReload:true,interruptedDraftKept:true,
    scannerFailureRecoverable:true,duplicateSkipped:true,pageErrors:0,networkUploads:0,actualModelTested:false,physicalPhoneTested:false}));
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
