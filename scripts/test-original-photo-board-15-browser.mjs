import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const dir=resolve('dist-original-photo-board-15-HOLD');
const MIME={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
 let url;
 try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400).end();return;}
 const filename=resolve(dir,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(filename!==dir&&!filename.startsWith(dir+sep)){res.writeHead(403).end();return;}
 try{const bytes=await readFile(filename);res.writeHead(200,{'content-type':MIME[extname(filename)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);}
 catch{res.writeHead(404).end('not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const gallery=JSON.parse(await readFile(join(dir,'matrix.json'),'utf8'));
assert.equal(gallery.rows.length,15);assert.equal(gallery.ownerApprovedCount,0);
const out=resolve('benchmark/family-alpha-board15');
await mkdir(out,{recursive:true});
try{
 for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']]){
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const page=await browser.newPage({viewport:{width,height:840},deviceScaleFactor:1});
    const errors=[],external=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
    await page.goto(origin+'/',{waitUntil:'load'});
    await page.locator('html[data-gallery="ready"]').waitFor({timeout:30000});
    assert.equal(await page.locator('#matrix .tile').count(),15);
    assert.equal(await page.locator('#outfits .work42-board').count(),3);
    assert.equal(await page.locator('#outfits .work42-board img').count(),10);
    assert.equal(await page.locator('.family-alpha-avatar').count(),0);
    assert.match(await page.locator('#result').innerText(),/HOLD/);
    assert.match(await page.locator('header').innerText(),/0 owner-approved visual results/);
    for(const tile of await page.locator('#matrix .tile').all()){
     await tile.scrollIntoViewIfNeeded();
     const img=tile.locator('img');
     await img.evaluate(async i=>{if(!i.complete)await new Promise((ok,bad)=>{i.onload=ok;i.onerror=bad;});});
     assert.ok(await img.evaluate(i=>i.naturalWidth>0&&i.naturalHeight>0));
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    await page.screenshot({path:join(out,name+'-'+width+'-15-originals-HOLD.png'),fullPage:true});
    console.log('PHOTO15_LAYOUT_PASS',name,width,'15 originals, 3 local boards, no network');
    await page.close();
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(r=>server.close(r));}
