// Actual Chromium/WebKit emulated-phone UI validation on SYNTHETIC alpha garments.
// No real person/face/source, external image provider, phone hardware or human truth.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const p=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!p.startsWith(root+'/'))throw Error('outside app');
  const bytes=await readFile(p);
  res.writeHead(200,{'content-type':mime[extname(p)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const output=[];
try{
 for(const [engineName,engine]of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engineName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},
    deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
    body:"window.closetAuth={user:{id:'mannequin-preview-qa'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   const page=await context.newPage();const errors=[],remotePosts=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.method()==='POST'&&!r.url().startsWith('http://127.0.0.1:'))remotePosts.push(r.url())});
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   const fixtures=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=120;canvas.height=190;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const make=neck=>{
     ctx.clearRect(0,0,120,190);
     ctx.fillStyle='#1e34a5';ctx.fillRect(20,38,80,139);
     if(neck){ctx.fillStyle='#c0b6a5';ctx.fillRect(51,8,18,30);}
     return canvas.toDataURL('image/png');
    };
    return {bad:make(true),good:make(false)};
   });
   assert.notEqual(fixtures.bad,fixtures.good);
   // The figure selector lives in a hidden builder view by default. Exercise
   // the visible customer UI, not a hidden DOM control.
   await page.evaluate(()=>switchView('builder'));
   for(const figure of ['female','male']){
    await page.locator('#reusableFigureChoice').selectOption(figure);
    for(const mode of ['bad','good']){
     const original=fixtures[mode];
     await page.evaluate(({src,figure})=>{
      const record={id:'sample-alpha-dress',category:'Dresses',itemType:'Casual dress',
       color:'Blue',name:'Synthetic dress on alpha',image:src,
       originalPhoto:{image:'original-high-resolution-scene',sha256:'fictional-check-only'},
       recognitionPhoto:{image:'unmasked-source-photo'},seasons:[]};
      items.splice(0,items.length,record);
      currentBoard.slots={top:record.id};currentBoard.layerCount=0;
      switchView('builder');renderOutfitBoard();renderReusableFigurePreview();
     },{src:original,figure});
     const held=mode==='bad';
     await page.waitForFunction(held=>
      document.querySelector('#reusableFigureStatus')?.textContent.startsWith(
       held?'0 owned clothing layers displayed; 1 held':'1 owned clothing layer displayed; 0 held')&&
      document.querySelector('#reusableFigureStage')?.getAttribute('aria-busy')==='false',
      held,{timeout:35000});
     const result=await page.evaluate(()=>{
      const item=items.find(x=>x.id==='sample-alpha-dress');
      const shown=[...document.querySelectorAll('#reusableFigureGarments img')];
      return {count:shown.length,figure:document.querySelector('#reusableFigureChoice').value,
       status:document.querySelector('#reusableFigureStatus').textContent,
       originalUnchanged:item.originalPhoto.image==='original-high-resolution-scene',
       unmaskedRecognitionUnchanged:item.recognitionPhoto.image==='unmasked-source-photo',
       outputDisplayUnchanged:item.image.startsWith('data:image/png;base64,'),
       sourceNeverReclassifiedByFit:true};
     });
     assert.equal(result.count,held?0:1);
     assert.equal(result.figure,figure);
     assert.equal(result.originalUnchanged,true);
     assert.equal(result.unmaskedRecognitionUnchanged,true);
     assert.equal(result.outputDisplayUnchanged,true);
     if(held){
      assert.equal(await page.locator('#reusableFigurePhotoHelp').isVisible(),true);
      assert.equal(await page.locator('#reusableFigureRetry').isVisible(),true);
     }else{
      assert.equal(await page.locator('#reusableFigurePhotoHelp').isVisible(),false);
     }
     output.push({browser:engineName,figure,held,displayedLayers:result.count,
      originalPixelsChanged:false,remotePosts:remotePosts.length,realFitApproved:false});
    }
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(remotePosts,[]);
   await context.close();
  }finally{await browser.close();}
 }
 console.log('TRANSPARENT_NECK_REVIEW '+JSON.stringify({cases:output,
  genuineFullHumanMaskApprovals:0,physicalPhoneChecks:0,sourcePhotosChanged:0}));
}finally{await new Promise(resolve=>server.close(resolve));}
