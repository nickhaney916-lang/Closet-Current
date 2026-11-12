import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/parallel70-browser');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json'};
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app-theme.css"></head><body><section id="review" class="view"><div id="outfitPieceActions"><h3>Your outfit pieces</h3><p id="outfitPieceSummary"></p><div id="outfitUnitReview70" class="unit70-panel" hidden></div><button id="useCapturedOutfit"></button><p id="outfitSaveStatus"></p></div></section><section id="scan" class="view" hidden></section><p id="outfitSplitStatus"></p><button id="outfitRetry" hidden></button><input id="outfitCamera" type="file" style="display:block;max-width:100%"><input id="outfitUpload" type="file" style="display:block;max-width:100%"></body></html>';
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/trial70.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;}
  const file=resolve(root,'.'+decodeURIComponent(path));if(!file.startsWith(root+'/'))throw Error('Path');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('missing');}
});
await new Promise(f=>server.listen(0,'127.0.0.1',f));const port=server.address().port,results=[];await mkdir(output,{recursive:true});
const scaffold=[
 "let batch=[],items=[],busy=false,session=0,recognitionAssetVersion='',categories=['Uncategorized','Tops','Bottoms','Shoes','Outerwear','Dresses','Accessories'],localPending=new Set();",
 "window.closetAuth={user:{id:'owner-70'}};window.confirm=()=>true;window.workerRecord=null;",
 "const $=id=>document.getElementById(id);const closetReady=Promise.resolve(),outfitBoardReady=Promise.resolve();",
 "function recordDeviceEvent(){}function stopCamera(){}function controls(){}",
 "function switchView(view){document.querySelector('#review').hidden=view!=='review';document.querySelector('#scan').hidden=view!=='scan';}",
 "function persistDraft(){window.draftBackup=structuredClone(batch);return Promise.resolve();}",
 "let count=0;",
 "function candidate(image,options){if([...items,...batch].some(x=>x.image===image))return false;",
 "batch.push({id:'piece-'+(++count),image,...options,category:'Uncategorized',itemType:'Unknown',requiresOwnershipConfirmation:true,reconciliation70Status:options.reconciliation70Status||'unresolved'});persistDraft();return true;}",
 "function render(){renderOutfitCapture();}",
 "function photoToJPEG(){return Promise.resolve('data:image/jpeg;base64,AAAA');}",
 "class Worker{constructor(){window.workerRecord=this;}postMessage(request){this.request=request;}terminate(){this.terminated=true;}}"
].join('\n');
async function runCase(engine,width){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/trial70.html?outfitInstances840=1&outfitUnits70=1');
  await page.addScriptTag({content:scaffold});
  await page.addScriptTag({url:'http://127.0.0.1:'+port+'/outfit-capture.js'});
  const sha=n=>n.toString(16).padStart(64,'0');
  await page.evaluate(hashes=>{
   window.startOutfitSplit('data:image/jpeg;base64,AAAA','source-1');
   for(const [image,x,mask] of [['AAAA',.15,hashes[0]],['BBBB',.4,hashes[1]]]){
    window.workerRecord.onmessage({data:{id:window.workerRecord.request.id,type:'piece',
     piece:{image:'data:image/jpeg;base64,'+image,
      hint:{categories:['Shoes'],types:[],clipped:false},
      cropBounds:{x,y:.67,width:.12,height:.14},
      colorEstimate:{color:'Black',support:.94},
      reconciliation70:{sourceSha256:hashes[2],maskSha256:mask,instanceOrdinal:0}}}});
   }
   window.workerRecord.onmessage({data:{id:window.workerRecord.request.id,type:'done',count:2}});
  },[sha(11),sha(12),sha(222)]);
  await page.waitForTimeout(750);
  console.log('BROWSER70_DEBUG '+JSON.stringify({state:await page.evaluate(()=>({
    flags:{instanceReview840:window.workerRecord?.request?.instanceReview840,units70:window.workerRecord?.request?.instanceReview70},
    draftCount:batch.length,sourceIds:batch.map(x=>x.outfitSourceId),statuses:batch.map(x=>x.reconciliation70Status),
    reviewHidden:document.getElementById('outfitPieceActions').hidden,panelHidden:document.getElementById('outfitUnitReview70').hidden,
    panelText:document.getElementById('outfitUnitReview70').textContent.slice(0,350),
    scripts:[...document.scripts].map(x=>x.src)
  })),errors}));
  await page.getByRole('button',{name:'Confirm matching pair',exact:true}).waitFor({timeout:7000});
  let state=await page.evaluate(()=>({drafts:batch.length,closet:items.length,statuses:batch.map(x=>x.reconciliation70Status),flag:window.workerRecord.request.instanceReview70}));
  assert.equal(state.drafts,2);assert.equal(state.closet,0);assert.equal(state.flag,true);
  await page.getByRole('button',{name:'Confirm matching pair',exact:true}).click();
  await page.waitForFunction(()=>batch.length===1&&!!batch[0].shoePair);
  state=await page.evaluate(()=>({drafts:batch.length,closet:items.length,status:batch[0].reconciliation70Status,
   photo:batch[0].originalPhoto.image,companion:batch[0].shoePair.companion.image,
   needsReview:batch[0].requiresOwnershipConfirmation}));
  assert.deepEqual([state.drafts,state.closet,state.status,state.companion,state.needsReview],
   [1,0,'paired_confirmed','data:image/jpeg;base64,BBBB',true]);
  assert.equal(state.photo,'data:image/jpeg;base64,AAAA');
  await page.getByRole('button',{name:'Separate regions again'}).click();
  await page.waitForFunction(()=>batch.length===2&&batch.every(x=>x.reconciliation70Status==='separate_confirmed'));
  assert.equal(await page.evaluate(()=>items.length),0);
  await page.screenshot({path:join(output,engine.name()+'-'+width+'.png'),fullPage:true});
  const overflow=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   offenders:[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+2)
    .slice(0,12).map(e=>({tag:e.tagName,id:e.id,klass:e.className?.toString().slice(0,60),
    right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)}))}));
  console.log('BROWSER70_LAYOUT '+JSON.stringify(overflow));
  assert.ok(overflow.scrollWidth<=overflow.viewport+2,'No horizontal mobile overflow');
  assert.deepEqual(errors,[],'No browser JavaScript exceptions');
  return {engine:engine.name(),viewportWidth:width,paired:true,separated:true,originalSourcePreserved:true,closetWrites:0};
 }finally{await browser.close();}
}
try{
 for(const engine of [chromium,webkit])for(const width of [320,390,430])results.push(await runCase(engine,width));
 await writeFile(join(output,'results.json'),JSON.stringify({
  limitations:'Real browser DOM and native controls, simulated SegFormer messages, no real model, no physical phones or private storage writes',
  results
 },null,2));
 console.log(JSON.stringify({cases:results.length,results},null,2));
}finally{await new Promise(r=>server.close(r));}