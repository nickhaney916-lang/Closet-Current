import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
let server,base;
test.beforeAll(async()=>{
 server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve('public', '.'+pathname);
  if(!file.startsWith(resolve('public')+'/')){res.writeHead(403).end();return;}
  try{const bytes=await readFile(file);res.setHeader('Content-Type',extname(file)==='.mjs'?'text/javascript':extname(file)==='.html'?'text/html':'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end();}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 base='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{await new Promise(ok=>server.close(ok));});
test('real browser renders synthetic outfits, rotates, replaces dress, and clears',async({page,browserName})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/verified-humanoid-browser-fixture.html');
 const status=page.locator('#status');
 await expect(status).toContainText('initialize');
 const initial=JSON.parse(await status.textContent());
 expect(initial.success, browserName+' must initialize WebGL rather than skip rendering').toBe(true);
 await page.locator('#outfit').click();
 await expect(status).toContainText('shirt-pants');
 const outfit=JSON.parse(await status.textContent());
 expect(outfit.success).toBe(true);
 expect(outfit.state.layers).toEqual(expect.arrayContaining(['top','bottom']));
 expect(outfit.state.drawn.length).toBeGreaterThan(0);
 await page.locator('#rotate').click();
 const rotated=JSON.parse(await status.textContent());
 expect(rotated.success).toBe(true);
 expect(rotated.state.yaw).toBeGreaterThan(1.5);
 await page.locator('#dress').click();
 const dress=JSON.parse(await status.textContent());
 expect(dress.success).toBe(true);
 expect(dress.state.layers).toContain('dress');
 expect(dress.state.layers).not.toContain('bottom');
 expect(dress.state.drawn.length).toBeGreaterThan(0);
 await page.locator('#clear').click();
 const cleared=JSON.parse(await status.textContent());
 expect(cleared.success).toBe(true);
 expect(cleared.state.layers).toEqual([]);
 expect(cleared.state.drawn.some(part=>['top','bottom','shoes','layer','layer2','layer3','dress'].includes(part.key))).toBe(false);
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/'+browserName+'-synthetic-avatar.png'});
});

test('mobile viewport keeps avatar controls usable and supports outfit switching',async({page,browserName})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:375,height:812});
 await page.goto(base+'/verified-humanoid-browser-fixture.html');
 const status=page.locator('#status');
 await expect(status).toContainText('initialize');
 expect(JSON.parse(await status.textContent()).success).toBe(true);
 const dimensions=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth}));
 expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth+1);
 for(const id of ['outfit','dress','rotate','clear']){
  const control=page.locator('#'+id);
  await expect(control).toBeVisible();
  await control.click();
  expect(JSON.parse(await status.textContent()).success).toBe(true);
 }
 expect(JSON.parse(await status.textContent()).state.layers).toEqual([]);
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/'+browserName+'-mobile-avatar.png',fullPage:true});
});
