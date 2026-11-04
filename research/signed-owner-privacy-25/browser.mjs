import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const out='benchmark/signed-owner-privacy-25';
await mkdir(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const root=resolve('public');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  const file=resolve(root,'.'+pathname);
  if(req.method!=='GET'||!file.startsWith(root+'/'))throw Error();
  res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');
  res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const pictures={};
for(const marker of ['a','b']){
 const bytes=await sharp(Buffer.from('<svg width="64" height="64"><rect width="64" height="64" fill="'+(marker==='a'?'red':'blue')+'"/><text x="18" y="42" font-size="32" fill="white">'+marker.toUpperCase()+'</text></svg>')).jpeg().toBuffer();
 pictures[marker]={image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:sha(bytes)};
}
const results=[];
try{
 for(const [engine,type] of Object.entries({chromium,webkit})){
  const browser=await type.launch();
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const unauthorized=[],errors=[];
    await context.route('**/*',async route=>{
     const req=route.request(),url=new URL(req.url());
     if(url.origin===origin)return route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname.startsWith('/auth/v1/')){
      if(url.pathname.endsWith('/logout'))return route.fulfill({status:204,body:''});
      const data=req.postDataJSON();
      const owner=/^owner-([ab])@example\.test$/.exec(data?.email)?.[1]||/^refresh-([ab])$/.exec(data?.refresh_token)?.[1];
      if(url.pathname.endsWith('/token')&&owner)return route.fulfill({json:{user:{id:'owner-'+owner,email:'owner-'+owner+'@example.test'},
       access_token:'fixture-'+randomUUID(),refresh_token:'refresh-'+owner,expires_in:3600}});
     }
     if(!['GET','HEAD'].includes(req.method()))unauthorized.push(req.method());return route.abort();
    });
    const open=async()=>{
     const p=await context.newPage();p.on('pageerror',error=>errors.push(error.message));
     await p.goto(origin+'/index.html');return p;
    };
    const login=async(p,marker)=>{
     await p.locator('#authEmail').fill('owner-'+marker+'@example.test');
     await p.locator('#authPassword').fill('synthetic-only');
     await p.locator('#authSubmit').click();
     await p.waitForFunction(owner=>window.closetAuth.user?.id===owner&&db?.name==='closet-current-user-'+owner,'owner-'+marker);
    };
    const fixture=marker=>({id:'garment-'+marker,name:'Synthetic garment '+marker,category:'Tops',itemType:'T-shirt',color:'Red',image:pictures[marker].image,ownerId:'owner-'+marker});
    const first=await open();await login(first,'a');
    await first.evaluate(value=>writeAll([value]),fixture('a'));
    const stale=await open();
    await stale.waitForFunction(()=>window.closetAuth.user?.id==='owner-a'&&db?.name==='closet-current-user-owner-a');
    assert.equal(await first.evaluate(()=>window.closetAuth.user?.id),'owner-a','same epoch refresh keeps both tabs active');
    await stale.evaluate(()=>{
     window.closetCloud.beforeWrite=()=>new Promise(done=>{window.releaseStale=done;});
     window.lateWrite=writeAll([{id:'delayed-foreign-write'}]).then(()=>false,()=>true);
    });
    await stale.waitForFunction(()=>!!window.releaseStale);
    await first.evaluate(()=>document.getElementById('logout').click());
    await stale.waitForFunction(()=>window.closetAuth.user===null&&db===null&&document.getElementById('appShell').hidden);
    const stopped=await stale.evaluate(async()=>{window.releaseStale();return window.lateWrite;});
    assert.equal(stopped,true);
    await first.locator('#authSubmit').waitFor({state:'visible'});
    await login(first,'b');
    assert.deepEqual(await first.evaluate(()=>readAll()),[]);
    await first.evaluate(value=>writeAll([value]),fixture('b'));
    const reopened=await open();
    await reopened.waitForFunction(()=>window.closetAuth.user?.id==='owner-b'&&db?.name==='closet-current-user-owner-b');
    const owned=await reopened.evaluate(()=>readAll());
    assert.deepEqual(owned.map(x=>x.id),['garment-b']);
    assert.equal(sha(Buffer.from(owned[0].image.split(',')[1],'base64')),pictures.b.sha256);
    // Reopen A's original DB only after authenticating as A again.
    await first.evaluate(()=>document.getElementById('logout').click());
    await first.locator('#authSubmit').waitFor({state:'visible'});
    await login(first,'a');
    const originals=await first.evaluate(()=>readAll());
    assert.deepEqual(originals.map(x=>x.id),['garment-a']);
    assert.equal(sha(Buffer.from(originals[0].image.split(',')[1],'base64')),pictures.a.sha256);
    await first.evaluate(()=>switchView('closet'));
    const filename=engine+'-'+width+'.png';
    const bytes=await first.screenshot({path:out+'/'+filename,animations:'disabled'});
    assert.deepEqual(unauthorized,[]);
    assert.deepEqual(errors,[]);
    results.push({engine,width,filename,sha256:sha(bytes),realIndexedDB:true,authFixture:true,lateWriteRejected:true});
    await context.close();
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(done=>server.close(done));}
await writeFile(out+'/browser.json',JSON.stringify({results,authScope:'Synthetic auth transport with real application and IndexedDB'},null,2));
console.log('Browser private session checks:',results.length);
