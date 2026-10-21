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
const results=[];
try{
 for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'outfit-reliability'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=100;canvas.height=150;const ctx=canvas.getContext('2d');ctx.fillStyle='#24567a';ctx.fillRect(20,10,60,130);const image=canvas.toDataURL('image/png');
    const make=(id,category,itemType)=>normalizeClothing({id,category,itemType,name:id,color:'Blue',pattern:'Solid',seasons:[],image});
    const clothes=[make('new','Tops','T-shirt'),make('pants','Bottoms','Jeans'),make('shoes','Shoes','Sneakers'),...['a','b','c'].map(id=>make(id,'Outerwear','Jacket'))];
    await writeAll(clothes);items.splice(0,items.length,...clothes);render();
    $('stylistSeason').value='Fall';styleNewClosetItem('new');
   });
   await page.waitForFunction(()=>styledCollectionResults.length===3);
   assert.equal(await page.locator('#styledCollectionResults .styled-outfit').count(),3);
   assert.equal(await page.evaluate(()=>new Set(styledCollectionResults.map(x=>x.board.slots.layer)).size),3);
   const card=page.locator('#styledCollectionResults .styled-outfit').first();
   await card.getByRole('button',{name:'Save outfit',exact:true}).tap();
   await page.waitForFunction(()=>savedOutfitBoards.length===1);
   await page.evaluate(()=>styleNewClosetItem('new'));
   await page.waitForFunction(()=>styledCollectionResults.length===3);
   await card.getByRole('button',{name:'Save outfit',exact:true}).tap();
   await page.getByText('Saved. Find it in Outfit builder → Saved outfits.').waitFor();
   assert.equal(await page.evaluate(()=>savedOutfitBoards.length),1);
   await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   assert.equal(await page.evaluate(()=>savedOutfitBoards.length),1);
   assert.equal(await page.evaluate(()=>savedOutfitBoards[0].slots.top),'new');
   await page.evaluate(async()=>{
    items.splice(0,items.length,...items.filter(x=>x.id==='new'));await writeAll(items);styleNewClosetItem('new');
   });
   await page.waitForFunction(()=>styledCollectionResults.length===1&&styledCollectionResults[0].missing.length===2);
   assert.equal(await card.getByRole('button',{name:'Save outfit',exact:true}).isDisabled(),true);
   assert.equal(await card.getByRole('button',{name:'Preview on model'}).isEnabled(),true);
   // Exercise the actual renderer with a tall, already transparent synthetic
   // photograph. It used to disappear at the 1600px per-edge geometry gate.
   const source=await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=1000;c.height=4000;
    const x=c.getContext('2d');x.fillStyle='#24567a';x.fillRect(200,50,600,3900);
    x.clearRect(470,1400,60,2550);const photo=c.toDataURL('image/png');
    items.splice(0,items.length,normalizeClothing({id:'long',category:'Bottoms',itemType:'Trousers',name:'long',color:'Blue',image:photo}));
    currentBoard=cleanOutfitBoard({slots:{bottom:'long'}},items);switchView('builder');renderOutfitBoard();return photo;
   });
   await page.waitForFunction(()=>document.querySelector('#reusableFigureGarments img[data-slot="bottom"]'));
   const fitted=await page.locator('#reusableFigureGarments img[data-slot="bottom"]').evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight,cssW:parseFloat(img.style.width),cssH:parseFloat(img.style.height)}));
   assert.ok(fitted.h>1600);assert.ok(fitted.w*fitted.h<=1000000);
   assert.ok(Math.abs((fitted.cssW*647)/(fitted.cssH*1199)-fitted.w/fitted.h)<.00001);
   assert.equal(await page.evaluate(()=>items[0].image),source);
   await mkdir('artifacts/mobile-outfit-reliability',{recursive:true});
   await page.screenshot({path:'artifacts/mobile-outfit-reliability/'+(engine===chromium?'android':'iphone')+'.png',fullPage:true});
   assert.deepEqual(errors,[]);results.push({browser:label,threeOwnedOptions:true,duplicateSaveAndReload:true,partialSaveBlocked:true,tallPhotographicPreview:fitted,physicalPhone:false});
   await context.close();
  }finally{await browser.close();}
 }
 console.log(JSON.stringify(results,null,2));
}finally{await new Promise(ok=>server.close(ok));}
