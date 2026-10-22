// Actual local-only production interface: swap jacket/coat, save and preview
// on emulated Android Chromium and iPhone WebKit. Synthetic clothes only.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://offline.invalid'),
  path=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
 if(!path.startsWith(root+'/'))throw Error('Unsafe asset path');
 const file=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(file);
}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const home='http://127.0.0.1:'+server.address().port+'/';
try{
 for(const [name,engine]of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}:{})});
  try{
   for(const [kind,slot,buttonLabel,types]of [
    ['jacket','layer2','Swap jacket',['Jacket','Blazer']],
    ['coat','layer3','Swap coat',['Coat','Raincoat']]
   ]){
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
     hasTouch:true,serviceWorkers:'block'});
    const errors=[],blocked=[];
    await context.route('**/*',route=>{
     if(route.request().url().startsWith(home)||/^(data:|blob:)/.test(route.request().url()))
      return route.continue();
     blocked.push(route.request().url());return route.abort('internetdisconnected');
    });
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'owned-layer-swap-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto(home);await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
     const garments=await page.evaluate(async data=>{
      const svg='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="130"><rect width="100" height="130" fill="#345"/></svg>');
      const make=(id,category,itemType)=>normalizeClothing({id,category,itemType,color:'Black',name:id,
       image:svg,pattern:'Solid',seasons:[],fit:'Regular',sleeveLength:'Unknown',
       brand:'',size:'',material:'',occasion:'',notes:''});
      const all=[make('shirt','Tops','T-shirt'),make('jeans','Bottoms','Jeans'),
       make('sneakers','Shoes','Sneakers'),make(data+'-one','Outerwear',data==='jacket'?'Jacket':'Coat'),
       make(data+'-two','Outerwear',data==='jacket'?'Blazer':'Raincoat')];
      await writeAll(all);items.splice(0,items.length,...all);
      $('stylistSeason').value='Winter';$('stylistOccasion').value='Casual';$('stylistAudience').value='All';
      switchView('stylist');$('styleCollectionForm').requestSubmit();
      return JSON.stringify(items);
     },kind);
     await page.waitForFunction((x)=>styledCollectionResults.length>0&&
      styledCollectionResults.every(r=>r.board.slots[x]!==undefined),slot);
     const card=page.locator('#styledCollectionResults .styled-outfit').first();
     const first=await page.evaluate(x=>({
      slots:{...styledCollectionResults[0].board.slots},saved:savedOutfitBoards.length,
      garments:JSON.stringify(items)
     }),slot);
     assert.equal(first.saved,0);
     assert.equal(await card.getByRole('button',{name:buttonLabel+' in option 1'}).count(),1);
     await card.getByRole('button',{name:buttonLabel+' in option 1'}).tap();
     await page.getByText(/Preview only — tap Save outfit when you like it/).first().waitFor();
     const changed=await page.evaluate(()=>({
      slots:{...styledCollectionResults[0].board.slots},saved:savedOutfitBoards.length,
      garments:JSON.stringify(items)
     }));
     assert.notEqual(changed.slots[slot],first.slots[slot]);
     for(const key of ['top','bottom','shoes'])assert.equal(changed.slots[key],first.slots[key]);
     assert.equal(changed.saved,0,'One-tap swap must not persist without Save');
     assert.equal(changed.garments,garments,'Original saved clothing/photos must be byte-identical');
     assert.deepEqual(Object.keys(changed.slots).sort(),Object.keys(first.slots).sort());
     await card.getByRole('button',{name:'Save outfit'}).click();
     await page.getByText('Saved. Find it in Outfit builder → Saved outfits.').first().waitFor();
     assert.equal(await page.evaluate(x=>savedOutfitBoards[0]?.slots?.[x],slot),changed.slots[slot]);
     await card.getByRole('button',{name:'Preview on model'}).click();
     await page.locator('#builder:not([hidden])').waitFor();
     assert.equal(await page.evaluate(x=>currentBoard.slots[x],slot),changed.slots[slot]);
     assert.equal(await page.evaluate(()=>currentBoard.slots.top),'shirt');
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     assert.deepEqual(errors,[]);
     assert.ok(blocked.every(url=>
      /^https:\/\/fonts\.googleapis\.com\/css2\?/.test(url)||
      /^https:\/\/raw\.githubusercontent\.com\/nickhaney916-lang\/Closet-Current\/main\/public\/trend-data\.json\?checked=\d+$/.test(url)),
      'No unexpected external requests may be sent even when blocked');
     console.log('ONE_TAP_OWNED_OUTERWEAR_MOBILE '+JSON.stringify({browser:name,slot,
      originalPhotosUnchanged:true,actualDevice:false,externalRequestsAllowed:0,blockedPublicRequests:blocked.length,result:'PASS'}));
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
