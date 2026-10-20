// Actual Chromium/WebKit canvas+figure-preview rendering at 1x and 3x.
// Synthetic original pixels. No physical phone, approved segmentation,
// commercial figure rights or realistic fit certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!file.startsWith(root+'/'))throw Error('invalid resource');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const results=[];
try{
 for(const [label,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(label==='Chromium'?{args:['--no-sandbox']}: {})});
  try{
   for(const dpr of [1,3]){
    const context=await browser.newContext({
     viewport:{width:390,height:844},deviceScaleFactor:dpr,
     isMobile:true,hasTouch:true,serviceWorkers:'block'
    });
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'retina-preview-evidence'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
    }));
    await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
    const page=await context.newPage();
    const errors=[];const external=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('request',r=>{
     if(r.method()==='POST'&&!r.url().startsWith('http://127.0.0.1:'))
      external.push(r.url());
    });
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
    const input=await page.evaluate(()=>{
     const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=2100;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     ctx.clearRect(0,0,canvas.width,canvas.height);
     ctx.fillStyle='#1c427d';
     ctx.beginPath();
     ctx.moveTo(450,300);ctx.lineTo(950,300);ctx.lineTo(1200,550);
     ctx.lineTo(1100,850);ctx.lineTo(1050,1750);
     ctx.lineTo(350,1750);ctx.lineTo(300,850);ctx.lineTo(200,550);
     ctx.closePath();ctx.fill();
     ctx.clearRect(575,300,250,145); // real alpha neckline cutout
     ctx.fillStyle='#d4a023'; // clearly defined colored pattern
     for(let x=400;x<=950;x+=64)ctx.fillRect(x,750,13,490);
     const display=canvas.toDataURL('image/png');
     const entry={id:'retina-shirt',category:'Tops',itemType:'T-shirt',color:'Blue',
      image:display,name:'Transparent source garment',pattern:'Striped',seasons:[],
      originalPhoto:{image:'data:image/jpeg;base64,'+'A'.repeat(120)},
      recognitionPhoto:{image:'data:image/jpeg;base64,'+'B'.repeat(120)}};
     const original=JSON.stringify(entry);
     items.splice(0,items.length,entry);
     currentBoard.slots={top:'retina-shirt'};currentBoard.layerCount=0;
     switchView('builder'); // Inspect a genuinely visible phone-width stage.
     renderOutfitBoard();
     renderReusableFigurePreview();
     return original;
    });
    await page.waitForFunction(()=>{
     const status=document.querySelector('#reusableFigureStatus')?.textContent||'';
     return status.includes('1 owned clothing layer displayed; 0 held')&&
      document.querySelectorAll('#reusableFigureGarments img').length===1;
    },{timeout:35000});
    await page.locator('#reusableFigureStage').scrollIntoViewIfNeeded();
    const evidence=await page.evaluate(async()=>{
     const im=document.querySelector('#reusableFigureGarments img');
     await im.decode();
     const chosen=items.find(x=>x.id==='retina-shirt');
     const stage=document.getElementById('reusableFigureStage');
     const rect=stage.getBoundingClientRect();
     const source=document.createElement('canvas');source.width=im.naturalWidth;source.height=im.naturalHeight;
     const ctx=source.getContext('2d',{willReadFrequently:true});
     ctx.drawImage(im,0,0);
     const px=ctx.getImageData(0,0,source.width,source.height).data;
     let opaque=0,transparent=0,gold=0;
     for(let i=0;i<px.length;i+=4){
      if(px[i+3]>=200){opaque++;if(px[i]>150&&px[i+1]>85&&px[i+2]<100)gold++;}
      if(px[i+3]===0)transparent++;
     }
     const expected=ClosetPreviewSampling.size(1400,2100,devicePixelRatio);
     return {width:im.naturalWidth,height:im.naturalHeight,
      expected,opaque,transparent,gold,
      originalHashInputsUnchanged:chosen.originalPhoto.image==='data:image/jpeg;base64,'+'A'.repeat(120)&&
       chosen.recognitionPhoto.image==='data:image/jpeg;base64,'+'B'.repeat(120),
      displayImageSourceUnchanged:chosen.image.startsWith('data:image/png;base64,'),
      stageWidth:rect.width,garmentWidthPct:parseFloat(im.style.width),
      fitNotValidated:!ClosetReusableFigure.plan(currentBoard,items,'female').fitAndImageQualityVerified
     };
    });
    assert.ok(evidence.stageWidth>180,
     'render evidence must measure the visible phone-width figure, not a hidden builder');
    await mkdir('artifacts/local-fitting',{recursive:true});
    await page.locator('#reusableFigureStage').screenshot({
     path:'artifacts/local-fitting/retina-'+label.toLowerCase()+'-'+dpr+'x.png'
    });
    assert.ok(evidence.expected,'sampling must resolve for existing native transparent input');
    assert.ok(evidence.width<=evidence.expected.width&&evidence.height<=evidence.expected.height,
     'trim must not exceed sampled native transparent pixels');
    assert.ok(evidence.opaque>20000&&evidence.transparent>1000,'alpha and garment details survive rendering');
    assert.ok(evidence.gold>80,'fine gold pattern remains physically present in output');
    assert.equal(evidence.originalHashInputsUnchanged,true);
    assert.equal(evidence.fitNotValidated,true);
    assert.equal(external.length,0);
    assert.deepEqual(errors,[]);
    results.push({engine:label,dpr,...evidence,remotePosts:external.length,pageErrors:errors.length});
    await context.close();
   }
  }finally{await browser.close();}
 }
 for(const engine of ['Chromium','WebKit']){
  const regular=results.find(r=>r.engine===engine&&r.dpr===1);
  const retina=results.find(r=>r.engine===engine&&r.dpr===3);
  assert.ok(regular&&retina);
  assert.ok(retina.width>=regular.width*1.2&&retina.height>=regular.height*1.2,
   'high density must preserve materially more original transparent cutout detail');
  assert.ok(retina.width*retina.height<=1000000);
 }
 console.log('RETINA_LOCAL_FIT_PREVIEW '+JSON.stringify({
  browsers:results,actualPhone:false,actualFitQualityMeasured:false,
  independentRealPhotoCutoutApproval:false,noRemoteAi:true}));
}finally{await new Promise(resolve=>server.close(resolve));}
