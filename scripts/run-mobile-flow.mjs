import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/mobile-flow');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.bin':'application/octet-stream','.css':'text/css'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+'/'))throw Error('Forbidden');res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[];
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-video-capture='+resolve('benchmark/mobile-camera.y4m') ]});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,permissions:['camera'],serviceWorkers:'block'});
 // Use a test identity only. No production login, credentials or auth messages.
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'mobile-flow-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.evaluate(()=>closetReady);
 // Exercise the actual shared crop/mask dialog on a touch-size browser viewport.
 await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#dc1e1e';ctx.fillRect(0,0,240,240);
  window.maskInteractionSaved=null;
  await window.openPhotoCrop({image:canvas.toDataURL('image/jpeg',.95)},{
   analyze:async()=>null,save:async(photo)=>{window.maskInteractionSaved=photo;}
  });
 });
 const maskDialog=page.locator('dialog.photo-crop-editor');
 await maskDialog.getByRole('button',{name:'Erase background'}).click();
 const frame=maskDialog.locator('.crop-frame'),rect=await frame.boundingBox();
 assert.ok(rect&&rect.width>0&&rect.height>0,'Mask editor must display a usable touch surface');
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
 await page.mouse.down();await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height/2,{steps:6});await page.mouse.up();
 await maskDialog.getByRole('button',{name:'Save crop'}).click();
 await maskDialog.waitFor({state:'detached'});
 const masked=await page.evaluate(async()=>{
  const saved=window.maskInteractionSaved;
  const image=new Image();image.src=saved.image;await image.decode();
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  return {center:[...ctx.getImageData(120,120,1,1).data],corner:[...ctx.getImageData(5,5,1,1).data],original:saved.originalPhoto?.image};
 });
 assert.ok(masked.center[0]>240&&masked.center[1]>230&&masked.center[2]>230,'Erase brush must remove red fabric from center');
 assert.ok(masked.corner[0]>150&&masked.corner[1]<90,'Unpainted pixels must remain red');
 assert.ok(masked.original?.startsWith('data:image/jpeg;base64,'),'Original photo must survive mask edits');
 await page.locator('.tab[data-view="scan"]').click();await page.locator('#start').click();
 await page.waitForFunction(()=>document.querySelector('#video').readyState>=2&&document.querySelector('#video').videoWidth>0);
 const camera=await page.locator('#video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight}));
 assert.deepEqual(camera,{width:1920,height:1080});
 await page.locator('#takePhoto').click();await page.locator('#scanResults .photo-result').waitFor();
 const image=await page.locator('#scanResults .photo-result img').evaluate(async img=>{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};});assert.deepEqual(image,camera);
 await page.locator('#scanResults .photo-result button').filter({hasText:'Adjust'}).click();
 const dialog=page.locator('dialog.photo-adjust');await dialog.getByLabel('Item name',{exact:true}).fill('Phone test blue top');
 await dialog.locator('label').filter({hasText:/^Main category/}).locator('select').selectOption('Tops');await dialog.locator('label').filter({hasText:/^Item type/}).locator('select').selectOption('T-shirt');await dialog.getByLabel('Color',{exact:true}).fill('Blue');await dialog.getByLabel('Summer',{exact:true}).check();
 await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.waitFor({state:'detached'});
 await page.waitForFunction(()=>localPending.size===0&&!automaticRunning,null,{timeout:300000});
 assert.equal(await page.evaluate(()=>localReady&&!recognitionUnavailable),true,'Actual recognition worker must finish successfully.');
 await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('Phone test');await page.locator('.closet-refine').evaluate(el=>el.open=true);await page.locator('#filter').selectOption('Tops');await page.locator('#seasonFilter').selectOption('Summer');assert.equal(await page.locator('#closetGrid article').count(),1);
 await page.reload();await page.evaluate(()=>closetReady);await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('Phone test');assert.equal(await page.locator('#closetGrid article').count(),1);
 const saved=await page.evaluate(()=>items.find(x=>x.name==='Phone test blue top'));assert.equal(saved.category,'Tops');assert.equal(saved.itemType,'T-shirt');assert.equal(saved.userAdjusted,true);assert.equal(saved.color,'Blue');assert.deepEqual(saved.seasons,['Summer']);
 await page.locator('.tab[data-view="scan"]').click();await page.locator('summary').filter({hasText:'Add saved photos or a video'}).click();await page.locator('#clothingPhotos').setInputFiles(resolve('benchmark/photos/commons-0002.jpg'));
 await page.waitForFunction(()=>items.length===2&&localPending.size===0,null,{timeout:300000});
 const automatic=await page.evaluate(()=>items.find(x=>x.name!=='Phone test blue top'));assert.equal(automatic.category,'Tops');assert.equal(automatic.itemType,'T-shirt');assert.notEqual(automatic.userAdjusted,true);
 await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('');await page.locator('#closetAllPieces').click();assert.equal(await page.locator('#closetGrid article').count(),2);
 assert.deepEqual(errors,[]);await page.screenshot({path:out+'/closet.png',fullPage:true});
 const result={viewport:{width:390,height:844},camera,image,manualSave:true,searchAndFilters:true,reloadPersistence:true,automaticPhotoIndexing:true,realRecognitionWorker:true,auth:'test identity stub; production auth not tested',hardware:'Chromium fake camera; physical phone not tested',pageErrors:errors};await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
