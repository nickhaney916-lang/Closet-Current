/** Real compiled browser evidence for advisory-only photo quality review.
 * Synthetic garment-like drawings only, no real user, service, upload or save.
 */
import {chromium,webkit} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist-family-alpha-42-photo-advice-HOLD');
const output='benchmark/family-alpha-42-photo-advice-SYNTHETIC-HOLD';
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/'){
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Closet Current quality hint test — SYNTHETIC</title><style>'+
  'body{font:15px/1.5 system-ui;margin:15px;background:#f0f2f5;color:#222}'+
  '.card{background:white;padding:12px;margin:14px auto;border-radius:14px;max-width:380px}'+
  'img{display:block;max-width:100%;max-height:370px;margin:auto}'+
  '.card-body{padding:8px}button{margin:5px;min-height:48px;padding:8px 12px}'+
  '.capture-photo-advice{font-weight:600;color:#703a09}</style>'+
  '<h1>Photo-quality advisory (synthetic)</h1><p>No account, uploads, or automatic photo rejection.</p>'+
  '<div id="review"></div><div id="results"></div><script src="/photo-check.js"></script></html>');
  return;
 }
 if(!['/photo-check.js','/app.js'].includes(path)){res.writeHead(403);res.end('No network');return;}
 try{res.writeHead(200,{'content-type':'text/javascript'});res.end(await readFile(join(root,path.slice(1))));}
 catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:860},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const external=[],errors=[];
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(url.startsWith(origin+'/')||/^(data:|blob:)/.test(url))return route.continue();
     external.push(url);return route.abort();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto(origin+'/');
     const outcome=await page.evaluate(async()=>{
      const canvas=document.createElement('canvas');
      canvas.width=1280;canvas.height=960;
      const g=canvas.getContext('2d');
      g.fillStyle='#101113';g.fillRect(0,0,1280,960);
      g.fillStyle='#191b1c';g.fillRect(100,80,1080,800);
      g.fillStyle='#111215';g.fillRect(350,100,580,720);
      g.fillStyle='#151719';g.fillRect(450,70,380,100);
      const source=canvas.toDataURL('image/jpeg',.90);
      const before=source;
      const assessed=await checkPhoto(source);
      if(assessed.captureAdvice?.hint?.code!=='dark')throw Error('Dark source not flagged as advisory');
      if(assessed.captureAdvice.decision!=='user-choice')throw Error('Quality check started auto reject');
      const current=await (await fetch('/app.js')).text();
      const start=current.indexOf('function renderPhotoResults('),end=current.indexOf('function render(){',start);
      if(start<0||end<start)throw Error('Source reviewed result renderer missing');
      const src=current.slice(start,end).trim();
      const render=new Function('node','localPending','items','recognitionState','photoAdvisories',
       'adjustPhoto','cropButton','switchView','canConfirmReviewedColor','return ('+src+')')(
       (tag,text,klass)=>{
        const el=document.createElement(tag);
        if(text!==null&&text!==undefined)el.textContent=text;
        if(klass)el.className=klass;return el;
       },new Set(),[],{activeId:null,phase:'idle'},new WeakMap(),()=>{},
       ()=>document.createElement('button'),()=>{},()=>false);
      const item={id:'synthetic',image:source,category:'Uncategorized',itemType:'Unknown',
       seasons:[],color:'',pattern:'',sleeveLength:'',fit:'',name:'',
       localAnalyzed:false};
      let navigation='';
      const evidence=new WeakMap([[item,{source:source,hint:assessed.captureAdvice.hint}]]);
      const renderActual=new Function('node','localPending','items','recognitionState','photoAdvisories',
       'adjustPhoto','cropButton','switchView','canConfirmReviewedColor','return ('+src+')')(
       (tag,text,klass)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(klass)el.className=klass;return el;},
       new Set(),[],{activeId:null},evidence,()=>{},()=>document.createElement('button'),where=>{navigation=where;},()=>false);
      const grid=document.getElementById('review');
      renderActual(grid,[item]);
      const tip=grid.querySelector('.capture-photo-advice');
      if(!tip||!tip.textContent.includes('too dark'))throw Error('Real compiled review did not show Work39 advice');
      const retake=[...grid.querySelectorAll('button')].find(b=>b.textContent==='Take a clearer photo');
      if(!retake)throw Error('Optional retake navigation missing');
      const previous=item.image;
      retake.click();
      if(navigation!=='scan'||item.image!==previous)
       throw Error('Retake must navigate to capture without deleting original JPEG');
      evidence.set(item,{source:'different-image',hint:assessed.captureAdvice.hint});
      renderActual(grid,[item]);
      if(grid.querySelector('.capture-photo-advice'))
       throw Error('A changed original JPEG must not show a stale hint');
      evidence.set(item,{source:source,hint:assessed.captureAdvice.hint});
      renderActual(grid,[item]);
      if(!grid.querySelector('.capture-photo-advice'))throw Error('Cannot restore current source advisory');
      document.getElementById('results').textContent='SYNTHETIC dark garment: advisory only. Retake keeps the original. No images uploaded.';
      return {hint:assessed.captureAdvice.hint.code,
       sourceJpegUnchanged:before===source,retakeDidNotDelete:true,
       invalidSourceHintHidden:true,fullAppRendererUsed:Boolean(render)};
     });
     assert.equal(outcome.hint,'dark');
     assert.deepEqual(external,[]);
     assert.deepEqual(errors,[]);
     await page.screenshot({path:output+'/'+engineName+'-'+width+'-PHOTO-REVIEW-SYNTHETIC-HOLD.png',
      fullPage:true,animations:'disabled'});
     results.push({engine:engineName,width,passed:true,...outcome,
      phonePhysicallyVerified:false,originalUserPhotographsUsed:false});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
await writeFile(output+'/results.json',JSON.stringify(results,null,2)+'\n');
console.log('FAMILY_ALPHA_42_BROWSER_ADVISORY_PASS',JSON.stringify(results));
