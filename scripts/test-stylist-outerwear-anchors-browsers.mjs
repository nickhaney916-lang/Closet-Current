// Live customer UI in a loopback-only Chromium/WebKit mobile emulator.
// Synthetic wardrobe only; never a real Supabase login, photo, or production call.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://local.invalid'),p=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
  if(!p.startsWith(root+'/'))throw Error('Disallowed path');
  const bytes=await readFile(p);
  res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local='http://127.0.0.1:'+server.address().port+'/';
try{
 for(const [label,engine]of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    serviceWorkers:'block'});
   const external=[],errors=[];
   await context.route('**/*',route=>{
    if(route.request().url().startsWith(local)||/^(data:|blob:)/.test(route.request().url()))
     return route.continue();
    external.push(route.request().url());return route.abort();
   });
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'outerwear-layer-local-only'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(local);await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.evaluate(async()=>{
    const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><path fill="black" d="M0 0h10v10H0z"/></svg>');
    const make=(id,category,itemType)=>normalizeClothing({
     id,category,itemType,color:'Black',name:id,image,pattern:'Solid',sleeveLength:'Unknown',
     fit:'Regular',seasons:[],brand:'',size:'',material:'',occasion:'',notes:''
    });
    const garments=[
     make('owned-shirt','Tops','T-shirt'),make('owned-jeans','Bottoms','Jeans'),
     make('owned-shoes','Shoes','Sneakers'),
     make('new-jacket','Outerwear','Jacket'),make('new-coat','Outerwear','Coat'),
     make('new-cardigan','Outerwear','Cardigan'),make('new-raincoat','Outerwear','Raincoat')
    ];
    await writeAll(garments);items.splice(0,items.length,...garments);render();
   });
   for(const [id,slot]of [['new-jacket','layer2'],['new-coat','layer3'],
     ['new-cardigan','layer'],['new-raincoat','layer3']]){
    await page.evaluate(itemId=>styleNewClosetItem(itemId),id);
    await page.waitForFunction(itemId=>stylistAnchorItemId===itemId&&styledCollectionResults.length>0,id);
    const proposed=await page.evaluate(()=>styledCollectionResults.map(x=>({slots:{...x.board.slots},
     missing:x.missing.length,layerCount:x.board.layerCount})));
    assert.ok(proposed.length>0,'No recommendations for '+id);
    for(const candidate of proposed){
     assert.equal(candidate.slots[slot],id,id+' must be on '+slot);
     assert.equal(candidate.slots.top,'owned-shirt');
     assert.equal(candidate.slots.bottom,'owned-jeans');
     assert.equal(candidate.slots.shoes,'owned-shoes');
     assert.equal(candidate.missing,0);
     assert.equal(Object.values(candidate.slots).filter(x=>x===id).length,1);
    }
    assert.equal(await page.locator('#styledCollectionResults .styled-outfit').count()>0,true);
    await page.locator('#styledCollectionResults .styled-outfit').first()
     .getByRole('button',{name:'Preview on model'}).click();
    await page.locator('#builder:not([hidden])').waitFor();
    assert.equal(await page.evaluate(x=>currentBoard.slots[x],slot),id);
    assert.equal(await page.evaluate(()=>currentBoard.slots.top),'owned-shirt');
    await page.evaluate(()=>switchView('stylist'));
   }
   assert.deepEqual(errors,[],'Unexpected page exceptions');
   assert.deepEqual(external,[],'Browser made an unexpected external request');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   console.log('OWNED_OUTERWEAR_REAL_UI_EMULATION '+JSON.stringify({engine:label,result:'PASS',
    truePhysicalHardware:false,sourcePhotoModified:false,externalRequests:0}));
   await context.close();
  }finally{await browser.close();}
 }
}finally{server.close();}
