// Validates the app's whole-outfit handoff, NOT actual segmentation quality.
// A deterministic worker simulates multiple piece emissions while production
// photo capture, candidate queue, manual confirmation, IndexedDB persistence,
// outfit board and reload use the real app. No paid inference or live account.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{const u=new URL(req.url,'http://localhost'),f=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
  if(!f.startsWith(root+'/'))throw Error('Unexpected path');
  const bytes=await readFile(f);res.writeHead(200,{'Content-Type':types[extname(f)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
  "window.closetAuth={user:{id:'whole-outfit-handoff-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
 await context.addInitScript(()=>{
  const NativeWorker=window.Worker;
  window.Worker=class{
   constructor(path,options){
    if(!String(path).includes('outfit-worker.mjs'))return new NativeWorker(path,options);
    this.terminated=false;
   }
   postMessage({id}){
    const make=(base)=>{
     const canvas=document.createElement('canvas');canvas.width=400;canvas.height=580;
     const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,400,580);
     ctx.fillStyle='#ffffff';for(let y=40;y<540;y+=35)ctx.fillRect(20,y,360,8);
     return canvas.toDataURL('image/jpeg',.94);
    };
    // Simulated worker masks carry no validity claim. The user must explicitly
    // correct/confirm each garment before it is written to the test closet.
    const pieces=[{category:'Tops',type:'T-shirt',color:'Red',src:make('#b52b31')},
      {category:'Bottoms',type:'Jeans',color:'Blue',src:make('#325d9c')},
      {category:'Outerwear',type:'Jacket',color:'Black',src:make('#202020')}];
    queueMicrotask(()=>{
     for(const piece of pieces){
      if(this.terminated)return;
      this.onmessage?.({data:{id,type:'piece',piece:{
       image:piece.src,recognitionPhoto:{image:piece.src},
       hint:{categories:[piece.category],types:[],clipped:false}}}});
     }
     if(!this.terminated)this.onmessage?.({data:{id,type:'done',count:pieces.length}});
    });
   }
   terminate(){this.terminated=true;}
  };
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 // Disable background recognition only for the deterministic segmentation
 // transport test: neither labels nor model reliability are being tested.
 await page.evaluate(()=>{queueAutomatic=()=>{};});
 const sourceImage=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=700;canvas.height=1050;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c6c6c6';ctx.fillRect(0,0,700,1050);
  ctx.fillStyle='#b52b31';ctx.fillRect(210,140,280,265);
  ctx.fillStyle='#325d9c';ctx.fillRect(225,405,250,350);
  ctx.fillStyle='#202020';ctx.fillRect(185,100,30,360);
  return canvas.toDataURL('image/jpeg',.94);
 });
 await page.locator('.tab[data-view="scan"]').click();
 await page.locator('#captureOutfit').click();
 await page.locator('#outfitUpload').setInputFiles({name:'controlled-outfit.jpg',mimeType:'image/jpeg',
  buffer:Buffer.from(sourceImage.split(',')[1],'base64')});
 await page.waitForFunction(()=>batch.filter(x=>x.outfitSourceId).length===3&&!!outfitActiveId&&outfitSplitJob===null);
 await page.locator('#review:not([hidden])').waitFor({state:'visible'});
 const before=await page.evaluate(()=>batch.filter(x=>x.outfitSourceId).map(x=>({
  id:x.id,original:x.originalPhoto?.image,recognition:x.recognitionPhoto?.image,
  display:x.image,group:x.outfitSourceId
 })));
 assert.equal(new Set(before.map(x=>x.group)).size,1);
 assert.ok(before.every(x=>x.original===sourceImage));
 assert.ok(before.every(x=>x.recognition&&x.recognition!==x.original));
 assert.ok(before.every(x=>x.display&&x.display!==x.original));
 // A reviewer supplies explicit category/color/identity. No model accuracy
 // or automatic approval is claimed for simulated split output.
 const records=[['Tops','T-shirt','Red'],['Bottoms','Jeans','Blue'],['Outerwear','Jacket','Black']];
 for(let i=0;i<3;i++){
  const match=before[i].id;
  await page.evaluate(id=>{const item=batch.find(x=>x.id===id);adjustPhoto(item);},match);
  const dialog=page.locator('dialog.clothing-editor');
  await dialog.locator('select[aria-label="Main category"]').selectOption(records[i][0]);
  await dialog.locator('select[aria-label="Item type"]').selectOption(records[i][1]);
  await dialog.getByLabel('Color',{exact:true}).fill(records[i][2]);
  await dialog.getByRole('button',{name:'Save changes'}).click();
  await dialog.waitFor({state:'detached'});
 }
 await page.waitForFunction(()=>items.filter(x=>x.outfitSourceId).length===3);
 const action=page.locator('#useCapturedOutfit');
 assert.equal(await action.isDisabled(),false);
 await action.tap();
 await page.locator('#builder:not([hidden])').waitFor({state:'visible'});
 const board=await page.evaluate(()=>({
  slots:{...currentBoard.slots},layerCount:currentBoard.layerCount,
  savedImages:items.filter(x=>x.outfitSourceId).map(x=>x.originalPhoto?.image),
  names:items.filter(x=>x.outfitSourceId).map(x=>x.itemType)
 }));
 assert.deepEqual(board.names,['T-shirt','Jeans','Jacket']);
 assert.equal(board.layerCount,2);
 assert.ok(board.slots.top&&board.slots.bottom&&board.slots.layer2);
 assert.ok(board.savedImages.every(x=>x===sourceImage));
 await page.locator('#saveBoard').click();
 await page.waitForFunction(()=>savedOutfitBoards.length===1);
 await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 const restored=await page.evaluate(()=>({count:items.filter(x=>x.outfitSourceId).length,
  group:outfitActiveId,saved:savedOutfitBoards.length,
  slots:{...currentBoard.slots},layerCount:currentBoard.layerCount,
  originals:items.filter(x=>x.outfitSourceId).map(x=>x.originalPhoto?.image),
  buttonDisabled:document.querySelector('#useCapturedOutfit').disabled,
  actionsHidden:document.querySelector('#outfitPieceActions').hidden
 }));
 assert.equal(restored.count,3);
 assert.ok(restored.group);
 assert.equal(restored.saved,1);
 assert.equal(restored.slots.layer2,board.slots.layer2);
 assert.equal(restored.layerCount,2);
 assert.ok(restored.originals.every(x=>x===sourceImage));
 assert.equal(restored.buttonDisabled,false,'Saved captured outfit should be available after a reload');
 assert.equal(restored.actionsHidden,false,'Review controls must return after a reload');
 assert.deepEqual(errors,[]);
 console.log('OUTFIT_CAPTURE_HANDOFF '+JSON.stringify({
  result:'passed',viewport:'390x844 touch',simulatedWorkerPieces:3,
  manuallyConfirmed:3,actualModelSegmentationTested:false,
  originalPhotoPreserved:true,outerwearJacketLayer:2,
  savedBoardReloaded:true,capturedGroupRestored:true,pageErrors:0,
  realCameraTested:false,realModelClippingAccuracyMeasured:false
 }));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
