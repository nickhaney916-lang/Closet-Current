// Browser-level regression for the real "Style this" path. The actual
// production scripts run on an emulated 390px touch viewport. No accounts,
// vendor calls, paid inference, or unreviewed test photos are used.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
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
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
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
 await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Adjust on outfit board'}).click();
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
 assert.equal(before.saved,1);
 assert.equal(before.board.slots.shoes,nextShoes);
 assert.equal(before.board.slots.top,'new-green-top');
 assert.equal(before.item,original,'styling must not modify the original garment record');
 await page.reload();
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 const after=await page.evaluate(()=>({board:JSON.parse(JSON.stringify(currentBoard)),
  saved:savedOutfitBoards.length,item:JSON.stringify(items.find(x=>x.id==='new-green-top'))}));
 assert.equal(after.saved,1,'saved outfit survives reload');
 assert.equal(after.board.slots.top,'new-green-top','new item persists after reload');
 assert.equal(after.board.slots.shoes,nextShoes,'one-piece swap persists after reload');
 assert.equal(after.item,original,'original garment remains unchanged in saved collection');
 assert.deepEqual(errors,[]);
 console.log('NEW_ITEM_STYLE_MOBILE '+JSON.stringify({
  result:'passed',viewport:'390x844 touch',outfitOptions:outfits.length,
  anchorPersisted:true,onePieceSwapSaved:true,reloadVerified:true,offlineTrendSafe:true,
  actualPhoneVerified:false,pageErrors:errors.length
 }));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
