// Production styling UI on localhost only. No hardware, paid API, hosted Auth,
// or live photographs. Both mobile browser engines make zero external connections.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://offline.invalid');
  const filename=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!filename.startsWith(root+'/'))throw Error('Unexpected path');
  const data=await readFile(filename);res.writeHead(200,{'Content-Type':mime[extname(filename)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Missing');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const local='http://127.0.0.1:'+server.address().port+'/';
try{
 for(const [name,engine]of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const blocked=[],errors=[];
   await context.route('**/*',route=>{
    if(route.request().url().startsWith(local)||/^(data:|blob:)/.test(route.request().url()))return route.continue();
    blocked.push(route.request().url());return route.abort('internetdisconnected');
   });
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'unpinned-layer-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(local);await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.evaluate(async()=>{
    const photo='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#344"/></svg>');
    const make=(id,category,itemType)=>normalizeClothing({id,category,itemType,color:'Black',name:id,image:photo,
     pattern:'Solid',seasons:[],fit:'Regular',sleeveLength:'Unknown',brand:'',size:'',material:'',occasion:'',notes:''});
    const garments=[make('shirt','Tops','T-shirt'),make('pants','Bottoms','Jeans'),
     make('shoes','Shoes','Sneakers'),make('jacket','Outerwear','Jacket'),
     make('coat','Outerwear','Coat'),make('cardigan','Outerwear','Cardigan')];
    await writeAll(garments);items.splice(0,items.length,...garments);
    $('stylistSeason').value='Winter';$('stylistOccasion').value='Casual';$('stylistAudience').value='All';
    switchView('stylist');$('styleCollectionForm').requestSubmit();
   });
   await page.waitForFunction(()=>styledCollectionResults.length===3);
   const results=await page.evaluate(()=>styledCollectionResults.map(r=>({
    slots:{...r.board.slots},missing:[...r.missing],layerCount:r.board.layerCount
   })));
   const selection=new Set(results.map(r=>{
    for(const [slot,id]of Object.entries(r.slots))if(['layer','layer2','layer3'].includes(slot)){
     if(id==='cardigan')return slot==='layer'?'cardigan':'WRONG';
     if(id==='jacket')return slot==='layer2'?'jacket':'WRONG';
     if(id==='coat')return slot==='layer3'?'coat':'WRONG';
    }return 'NONE';
   }));
   assert.deepEqual(selection,new Set(['cardigan','jacket','coat']));
   assert.ok(results.every(r=>r.slots.top==='shirt'&&r.slots.bottom==='pants'&&r.slots.shoes==='shoes'&&r.missing.length===0));
   await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Preview on model'}).click();
   await page.locator('#builder:not([hidden])').waitFor();
   assert.ok(await page.evaluate(()=>Object.keys(currentBoard.slots).some(x=>['layer','layer2','layer3'].includes(x))));
   assert.equal(await page.evaluate(()=>currentBoard.slots.top),'shirt');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(errors,[]);
   assert.ok(blocked.every(url=>
    /^https:\/\/fonts\.googleapis\.com\/css2\?/.test(url)||
    /^https:\/\/raw\.githubusercontent\.com\/nickhaney916-lang\/Closet-Current\/main\/public\/trend-data\.json\?checked=\d+$/.test(url)
   ),'Unexpected hosted connection attempt');
   console.log('UNPINNED_LAYER_REAL_UI_EMULATION '+JSON.stringify({engine:name,result:'PASS',
    independentOriginalsVerified:0,physicalHardwareVerified:false,externalConnectionsAllowed:0,publicRequestsBlocked:blocked.length}));
   await context.close();
  }finally{await browser.close();}
 }
}finally{server.close();}
