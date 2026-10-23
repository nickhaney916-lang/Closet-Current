// Real browser engines, synthetic local pixels, no physical-device claim.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),results=[];
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{
 const p=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
 if(req.method!=='GET'||!p.startsWith(root+'/'))throw Error('Denied');
 res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(await readFile(p));
}catch{res.writeHead(404);res.end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const origin='http://127.0.0.1:'+server.address().port;
try{for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{})});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 let remote=0,writes=0;const errors=[];
 await context.route('**/*',route=>{
  const r=route.request(),u=new URL(r.url());
  if(!['http:','https:'].includes(u.protocol))return route.continue();
  if(r.method()!=='GET'){writes++;return route.abort();}
  if(u.origin!==origin){remote++;return route.abort();}
  if(u.pathname==='/auth.js')return route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'synthetic-originals'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"});
  if(/model|\.onnx|\.bin|\/api\//i.test(u.pathname))return route.abort();
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/');await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 await page.evaluate(()=>{
  window.syntheticPhoto=color=>{const c=document.createElement('canvas');c.width=1200;c.height=1800;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(240,180,720,1440);return c.toDataURL('image/png');};
  const source=syntheticPhoto('#1234c8');
  items.push({id:'original-pants',category:'Bottoms',itemType:'Jeans',color:'Blue',image:syntheticPhoto('#ff0000'),originalPhoto:{image:source},cropBounds:{x:.1,y:.05,width:.8,height:.9}});
  currentBoard.slots={bottom:'original-pants'};switchView('builder');renderOutfitBoard();
 });
 async function settled(count){await page.waitForFunction(n=>document.getElementById('reusableFigureStage').getAttribute('aria-busy')==='false'&&document.querySelectorAll('#reusableFigureGarments img').length===n,count);}
 async function rgb(){return page.evaluate(()=>{const i=document.querySelector('#reusableFigureGarments img'),c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);return [...x.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data];});}
 await settled(1);assert.deepEqual(await rgb(),[18,52,200,255]);
 const before=await page.evaluate(()=>JSON.stringify(items));
 // Original-only replacement must replace cached pixels despite unchanged display.
 await page.evaluate(()=>{items[0].originalPhoto.image=syntheticPhoto('#16a045');renderReusableFigurePreview();});
 await page.waitForFunction(()=>document.getElementById('reusableFigureStage').getAttribute('aria-busy')==='false'&&document.querySelector('#reusableFigureGarments img')?.complete);
 await settled(1);assert.deepEqual(await rgb(),[22,160,69,255]);
 await page.evaluate(()=>{items[0].originalPhoto.ownerId='foreign';renderReusableFigurePreview();});await settled(0);
 assert.match(await page.locator('#reusableFigureStatus').innerText(),/held/);
 await page.evaluate(()=>{delete items[0].originalPhoto.ownerId;items[0].originalPhoto.image='data:image/png;base64,'+'AAAA'.repeat(100);renderReusableFigurePreview();});await settled(0);
 await page.evaluate(()=>{items[0].originalPhoto.image=syntheticPhoto('#1234c8');renderReusableFigurePreview();});await settled(1);
 assert.deepEqual(await rgb(),[18,52,200,255]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal(await page.evaluate(()=>JSON.stringify(items))===before,true,'render never edits saved item');
 assert.equal(writes,0);assert.deepEqual(errors,[]);
 await mkdir('artifacts/2d-outfit',{recursive:true});await page.screenshot({path:'artifacts/2d-outfit/'+name+'-mobile.png',fullPage:true});
 results.push({engine:name,viewport:'390x844',originalPixels:true,originalOnlyReplacement:true,foreignPhotoHeld:true,corruptOriginalHeld:true,sourceImmutable:true,horizontalOverflow:false,remoteRequestsBlocked:remote,remoteWrites:writes,physicalDevice:false});
 }finally{await browser.close();}
}}finally{await new Promise(ok=>server.close(ok));}
await writeFile('artifacts/2d-outfit/browser-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
