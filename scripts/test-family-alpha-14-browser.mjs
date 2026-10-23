import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const require=createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright'); } catch { playwright=require('playwright-core'); }
const {chromium,webkit}=playwright;
const root=resolve('research/family-alpha-14');
const out=resolve('benchmark/family-alpha-14');
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=resolve(root,'.'+(pathname==='/'?'/fixture.html':pathname));
    if(!target.startsWith(root+'/'))throw Error('Rejected file path');
    const data=await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]||'text/plain','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const inlineMode=process.env.ALPHA14_INLINE==='1';
let inlineFixture=null;
if(inlineMode){
  const html=await readFile(resolve(root,'fixture.html'),'utf8');
  const css=await readFile(resolve(root,'fixture.css'),'utf8');
  const api=(await readFile(resolve(root,'feedback-recovery.mjs'),'utf8')).replace(/\bexport (const|function)\b/g,'$1');
  inlineFixture=html.replace('<link rel="stylesheet" href="fixture.css">',`<style>${css}</style>`)
    .replace('<script type="module">',`<script>${api}\n`)
    .replace("import {mountFeedback,renderRecovery} from './feedback-recovery.mjs';",'');
}
const results=[];let checks=0;
let errors=[];
try{
  for(const [engine,browserType] of [['Chromium',chromium],['WebKit',webkit]].filter(([name])=>!process.env.ALPHA14_ENGINE||process.env.ALPHA14_ENGINE===name)){
    const options={headless:true,args:engine==='Chromium'?['--no-sandbox']:[]};
    const localPath=engine==='Chromium'?process.env.ALPHA14_CHROMIUM_PATH:process.env.ALPHA14_WEBKIT_PATH;
    if(localPath)options.executablePath=localPath;
    const browser=await browserType.launch(options);
    try{
      for(const width of [320,390,430]){
        const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'});
        const page=await context.newPage();let external=0;
        page.on('pageerror',e=>errors.push(`${engine} ${width} JS: ${e.message}`));
        page.on('request',req=>{if(!req.url().startsWith(origin+'/'))external++;});
        await context.route('**/*',route=>{
          if(route.request().url().startsWith(origin+'/'))return route.continue();
          external++; return route.abort();
        });
        await page.addInitScript(()=>{
          window.__copied=null;
          Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}});
        });
        if(inlineMode){
          await page.setContent(inlineFixture,{waitUntil:'load'});
          await page.evaluate(()=>{
            window.__copied=null;
            Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}});
          });
        }
        else await page.goto(origin+'/fixture.html');
        await page.locator('button[data-scenario]').first().waitFor();
        const count=await page.locator('button[data-scenario]').count();assert.equal(count,8);checks++;
        if(!inlineMode){assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);checks++;}
        for(const code of ['photo_rejected','unrecognized','blank_image','photo_missing','mask_failed','outfit_failed','avatar_failed','cancelled']){
          await page.locator(`[data-scenario="${code}"]`).click();
          assert.equal(await page.locator('#recovery').getAttribute('data-failure'),code);
          assert.equal(await page.locator('#recovery img').count(),0);
          assert.equal(await page.locator('#recovery [role=alert]').count(),0);
          checks+=3;
        }
        await page.locator('[data-scenario="mask_failed"]').click();
        assert.equal(await page.getByRole('button',{name:'View verified original'}).count(),1);checks++;
        await page.locator('[data-scenario="photo_missing"]').click();
        assert.equal(await page.getByRole('button',{name:'View verified original'}).count(),0);checks++;
        await page.locator('[data-scenario="photo_rejected"]').click();
        await page.locator('#recovery [data-action="retry"]').click();
        assert.match(await page.locator('#actionStatus').textContent(),/retry was requested/i);checks++;
        assert.equal(await page.locator('#recovery img').count(),0);checks++;
        const noVerifiedAction=await page.evaluate(()=>{
          const ghost=document.createElement('section');document.body.append(ghost);
          const result=window.__fa14renderRecovery(ghost,'mask_failed',{verifiedOriginal:false,callbacks:{original:()=>{throw Error('Not allowed')}}});
          ghost.remove();return result.actions;
        });
        assert.equal(noVerifiedAction.includes('original'),false);checks++;
        await page.locator('#feedback').getByRole('button',{name:'Report a Problem'}).click();
        const dialog=page.getByRole('dialog',{name:'Report a Problem'});
        assert.ok(await dialog.isVisible());checks++;
        assert.equal(await dialog.getByRole('combobox',{name:'Problem category'}).locator('option').count(),6);checks++;
        const minHeight=await dialog.getByRole('button',{name:'Prepare report'}).evaluate(el=>el.getBoundingClientRect().height);
        assert.ok(minHeight>=44);checks++;
        await dialog.getByRole('combobox',{name:'Problem category'}).selectOption('2D Avatar');
        await dialog.getByRole('textbox',{name:'Optional description'}).fill('Contact jane@example.com; layer disappeared.');
        await dialog.getByRole('button',{name:'Prepare report'}).click();
        const text=await dialog.getByRole('textbox',{name:'Prepared report'}).inputValue();
        assert.ok(text.includes('2D Avatar')&&text.includes('[email removed]')&&!text.includes('jane@example.com'));checks++;
        assert.match(await dialog.locator('.fa14-status').textContent(),/Nothing has been sent/);checks++;
        await dialog.getByRole('button',{name:'Copy report'}).click();
        await page.waitForFunction(()=>window.__copied!==null);
        assert.equal(await page.evaluate(()=>window.__copied),text);checks++;
        assert.equal(await dialog.getAttribute('data-state'),'copied');checks++;
        await dialog.getByRole('button',{name:'Done'}).click();
        assert.equal(await dialog.isVisible(),false);checks++;
        await page.locator('#feedback').getByRole('button',{name:'Report a Problem'}).click();
        assert.equal(await dialog.getByRole('textbox',{name:'Optional description'}).inputValue(),'');checks++;
        await dialog.getByRole('button',{name:'Cancel'}).click();
        assert.match(await page.locator('.fa14-launch-status').textContent(),/canceled/i);checks++;
        await page.locator('#feedback').getByRole('button',{name:'Report a Problem'}).click();
        await dialog.getByRole('textbox',{name:'Optional description'}).fill('I tried a second photo');
        await dialog.getByRole('button',{name:'Prepare report'}).click();
        await dialog.getByRole('button',{name:'Cancel'}).click();
        assert.equal(await dialog.isVisible(),false);checks++;
        await page.locator('#feedback').getByRole('button',{name:'Report a Problem'}).click();
        assert.equal(await dialog.getByRole('textbox',{name:'Optional description'}).inputValue(),'');checks++;
        await dialog.getByRole('button',{name:'Cancel'}).click();
        await page.locator('#feedback').getByRole('button',{name:'Report a Problem'}).click();
        await dialog.getByRole('textbox',{name:'Optional description'}).fill('Could not open my jacket');
        await dialog.getByRole('button',{name:'Prepare report'}).click();
        await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('Clipboard denied')};});
        await dialog.getByRole('button',{name:'Copy report'}).click();
        assert.equal(await dialog.getAttribute('data-state'),'copy-failed');checks++;
        assert.match(await dialog.locator('.fa14-status').textContent(),/copy it manually/i);checks++;
        await page.keyboard.press('Escape');
        assert.equal(await dialog.isVisible(),false);checks++;
        assert.match(await page.locator('.fa14-launch-status').textContent(),/canceled/i);checks++;
        assert.equal(external,0,'must not request external resources');checks++;
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
        assert.equal(overflow,false,'no viewport overflow');checks++;
        results.push({engine,width,scenarios:8,externalRequests:external,overflow:false,clipboard:'success+failure',cancel:'button+Escape'});
        await context.close();
      }
    }finally{await browser.close();}
  }
  assert.deepEqual(errors,[]);
  await mkdir(out,{recursive:true});await writeFile(resolve(out,'results.json'),JSON.stringify({success:true,checks,cases:results,errors},null,2));
  console.log(`Family Alpha #14: ${checks} browser assertions passed across ${results.length} Chromium/WebKit mobile viewports; 0 external requests and 0 page errors.`);
}finally{server.close();}
