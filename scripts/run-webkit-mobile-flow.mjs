import {webkit,devices} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/webkit-mobile-flow');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.bin':'application/octet-stream','.css':'text/css'};
const server=createServer(async(req,res)=>{try{
 const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+'/'))throw Error('Invalid path');
 const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 await mkdir(out,{recursive:true});browser=await webkit.launch({headless:true});
 const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'webkit-mobile-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.evaluate(()=>closetReady);
 // Generate asymmetric pixels and EXIF orientations independently of the importer.
 const images=await page.evaluate(async()=>{
  async function fixture(width,height,orientation){
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,width/2,height);ctx.fillStyle='blue';ctx.fillRect(width/2,0,width/2,height);
   const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.95));let bytes=new Uint8Array(await blob.arrayBuffer());
   if(orientation){
    // APP1: Exif + little-endian TIFF with one orientation SHORT entry.
    const exif=new Uint8Array([255,225,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,orientation,0,0,0,0,0,0,0]);
    const joined=new Uint8Array(bytes.length+exif.length);joined.set(bytes.subarray(0,2));joined.set(exif,2);joined.set(bytes.subarray(2),2+exif.length);bytes=joined;
   }
   return new File([bytes],'fixture.jpg',{type:'image/jpeg'});
  }
  async function inspect(file,options){
   const image=new Image();image.src=await photoToJPEG(file,options);await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
   const top=[...ctx.getImageData(Math.floor(image.width/2),Math.floor(image.height/4),1,1).data];
   const bottom=[...ctx.getImageData(Math.floor(image.width/2),Math.floor(image.height*3/4),1,1).data];
   return {width:image.width,height:image.height,top,bottom};
  }
  return {clockwise:await inspect(await fixture(3000,1500,6)),counterclockwise:await inspect(await fixture(3000,1500,8)),outfit:await inspect(await fixture(4000,2000,6),{maxDimension:3072,quality:.94}),small:await inspect(await fixture(400,200))};
 });
 for(const key of ['clockwise','counterclockwise'])assert.deepEqual([images[key].width,images[key].height],[1024,2048]);
 assert.deepEqual([images.outfit.width,images.outfit.height],[1536,3072]);assert.deepEqual([images.small.width,images.small.height],[400,200]);
 assert.ok(images.clockwise.top[0]>220&&images.clockwise.bottom[2]>220,'EXIF 6 must rotate red left half to top');
 assert.ok(images.counterclockwise.top[2]>220&&images.counterclockwise.bottom[0]>220,'EXIF 8 must rotate red left half to bottom');
 await page.locator('.tab[data-view="scan"]').click();await page.locator('summary').filter({hasText:'Add saved photos or a video'}).click();
 await page.locator('#clothingPhotos').setInputFiles(resolve('benchmark/photos/commons-0002.jpg'));
 await page.waitForFunction(()=>items.length===1&&localPending.size===0,null,{timeout:300000});
 const garment=await page.evaluate(()=>({category:items[0].category,itemType:items[0].itemType,userAdjusted:!!items[0].userAdjusted,workerReady:localReady,unavailable:recognitionUnavailable}));
 assert.equal(garment.category,'Tops');assert.equal(garment.itemType,'T-shirt');assert.equal(garment.userAdjusted,false);assert.equal(garment.workerReady,true);assert.equal(garment.unavailable,false);
 await page.reload();await page.evaluate(()=>closetReady);await page.locator('.tab[data-view="closet"]').click();await page.locator('#search').fill('T-shirt');assert.equal(await page.locator('#closetGrid article').count(),1);
 const layout=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(layout.document<=layout.viewport+1,'Closet must fit the phone viewport');
 assert.deepEqual(errors,[]);await page.screenshot({path:out+'/closet.png',fullPage:true});
 const result={browser:'Playwright WebKit',deviceProfile:'iPhone 13',images,garment,reloadPersistence:true,layout,pageErrors:errors,limitations:'Desktop WebKit emulation; physical iPhone camera and production login not tested'};
 await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
