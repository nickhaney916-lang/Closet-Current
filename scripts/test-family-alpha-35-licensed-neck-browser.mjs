/** Licensed Work #33 cutout ONLY, used in local research and never in private wardrobe. */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const dist=resolve('dist-family-alpha-35-visual-repair-HOLD');
const evidence=resolve('benchmark/family-alpha-35-real-dress-HOLD');
const mime={'.js':'text/javascript','.mjs':'text/javascript','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/__qa__/dress.html'){
   res.writeHead(200,{'content-type':'text/html'});
   res.end('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<title>Offline licensed photo cutout visual REJECT/REVIEW</title>'+
   '<style>body{font:14px/1.5 system-ui;margin:8px;background:#eee;color:#222}h2{font-size:1rem}'+
   '.notice{background:#731f1f;color:white;padding:9px}section{margin:12px 0}'+
   '.photo{width:100%;max-width:360px;margin:auto}</style>'+
   '<div class="notice">LICENSED RESEARCH ONLY — NOT APPROVED. Source-backed human eraser proposal, NOT automatic perfect clipping or realistic try-on.</div>'+
   '<section><h2>Original provisional dress including mannequin neck</h2><div id="before" class="photo"></div></section>'+
   '<section><h2>Alpha-only reviewed-neck cleanup proposal — owner approval NOT GIVEN</h2><div id="after" class="photo"></div></section></html>');
   return;
  }
  let p;
  if(path==='/__qa__/original.png')p=resolve(evidence,'commons-0053-original-provisional.png');
  else if(path==='/__qa__/cleaned.png')p=resolve(evidence,'commons-0053-manually-proposed-neck-cleanup.png');
  else{p=resolve(dist,'.'+path);if(!p.startsWith(dist+'/'))throw Error('outside root');}
  const b=await readFile(p);res.writeHead(200,{'content-type':mime[extname(p)]||'text/plain'});res.end(b);
 }catch{res.writeHead(404);res.end('not available');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390]){
    const context=await browser.newContext({viewport:{width,height:750},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const errors=[],external=[];
    await context.route('**/*',route=>{
     const url=route.request().url();if(url.startsWith(origin+'/')||url.startsWith('data:'))return route.continue();
     external.push(url);return route.abort();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/__qa__/dress.html');
    await page.evaluate(async()=>{
     const {renderPhotoLayers}=await import('/family-alpha-2d-photo-renderer.mjs');
     const entry=async(path)=>{
      const a=new Image();a.src=path;await a.decode();
      if(!a.complete||a.naturalWidth<32||a.naturalHeight<32)throw Error('Broken licensed mask PNG');
      return a;
     };
     const before=await entry('/__qa__/original.png'),after=await entry('/__qa__/cleaned.png');
     for(const [key,img] of [['before',before],['after',after]]){
      const host=document.getElementById(key);
      const n=renderPhotoLayers(host,[{slot:'dress',itemId:'licensed-dress',
       sourceIdentity:'licensed-benchmark-source',sourceVersion:'provisional-NEVER-APPROVED'}],
       {'licensed-dress':img});
      if(n!==1||host.querySelectorAll('img').length!==1||
         !host.querySelector('[data-humanoid="articulated-2d-v1"]'))
       throw Error('Actual 2D photographer source was not rendered');
     }
    });
    assert.equal(await page.locator('#before .family-alpha-avatar img').count(),1);
    assert.equal(await page.locator('#after .family-alpha-avatar img').count(),1);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    const outfile='benchmark/family-alpha-35-real-dress-HOLD/'+engineName+'-'+width+'-licensed-black-dress-neck-BEFORE-AFTER-PROVISIONAL.png';
    await page.screenshot({path:outfile,fullPage:true,animations:'disabled'});
    results.push({engine:engineName,width,source:'CC-BY licensed Work33 garment',technicalRender:true,
     actualCutoutQualityAccepted:false,ownerApproved:false});
    await context.close();
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
await mkdir('benchmark/family-alpha-35-real-dress-HOLD',{recursive:true});
console.log('LICENSED_DRESS_MANNEQUIN_CLEANUP_BROWSER_PROVISIONAL_HOLD',JSON.stringify(results));
