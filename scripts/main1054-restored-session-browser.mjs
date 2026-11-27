import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('dist'), authOrigin='https://hlkgymugtfbirlpunsra.supabase.co';
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  assert.ok(file.startsWith(root+sep));
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]??'application/octet-stream'}).end(bytes);
 }catch{res.writeHead(404).end();}
});
const owner='restored-session-fixture-owner',key='closet-current-auth-v1';
const saved={epoch:'fixture-epoch',access_token:'old-access',refresh_token:'old-refresh'};
const valid={user:{id:owner,email:'fixture@example.test'},access_token:'new-access',refresh_token:'new-refresh',expires_in:3600};
const cases=[['missing-refresh',{...valid,refresh_token:undefined}],['missing-access',{...valid,access_token:undefined}],['blank-refresh',{...valid,refresh_token:' '}],['wrong-type',{...valid,refresh_token:42}],['missing-owner',{...valid,user:undefined}]];
async function exercise(browser,engine,width,origin){
 for(const [name,malformed] of cases){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  let answer=malformed,requests=0;
  try{
   await context.addInitScript(({key,saved,origin})=>{
    if(location.origin===origin&&!sessionStorage.getItem('fixture-initialized')){
     localStorage.setItem(key,JSON.stringify(saved));
     sessionStorage.setItem('fixture-initialized','yes');
    }
   },{key,saved,origin});
   await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin===origin)return route.continue();
    if(url.origin===authOrigin&&url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='refresh_token'&&request.method()==='POST'){
     assert.equal(request.postDataJSON().refresh_token,'old-refresh');
     requests++;
     return route.fulfill({json:answer});
    }
    return route.abort();
   });
   const page=await context.newPage();
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('authStatus').textContent.includes('private wardrobe stays locked'));
   assert.equal(await page.locator('#appShell').isHidden(),true);
   assert.equal(await page.locator('#authGate').isVisible(),true);
   assert.equal(await page.locator('#authSubmit').isEnabled(),true);
   assert.equal(await page.evaluate(()=>window.closetAuth.user),null);
   assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),saved);
   assert.equal(requests,1);
   answer=valid;
   await page.locator('#authEmail').fill('');
   await page.locator('#authPassword').fill('');
   await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.evaluate(()=>window.dispatchEvent(new Event('online')))]);
   await page.waitForFunction(owner=>window.closetAuth.user?.id===owner,owner);
   await page.locator('#appShell').waitFor({state:'visible'});
   assert.equal(await page.locator('#authGate').isHidden(),true);
   assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).refresh_token,key),'new-refresh');
   assert.equal(requests,2);
   console.log(engine,width,name,'PASS locked recovery and retry');
  }finally{await context.close();}
 }
}
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC_AUTH_ENGINE&&process.env.CC_AUTH_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{for(const width of [320,390,430])await exercise(browser,engine,width,origin);}
  finally{await browser.close();}
 }
}finally{server.close();}
