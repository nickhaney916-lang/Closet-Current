import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('.');
const types={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.html':'text/html',
 '.css':'text/css','.jpg':'image/jpeg','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith(root+'/'))throw Error('not local');
  const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const CHECKS=['Source print and color intact','Cutout edge clean and complete',
 'Shoulders and sleeves attached','Waist and body proportions believable'];
const stats=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:850},acceptDownloads:true,serviceWorkers:'block'});
    const external=[],errors=[];
    await ctx.route('**/*',route=>{
     const url=route.request().url();
     if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
     external.push(url);return route.abort();
    });
    const page=await ctx.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/research/work48/index.html');
    await page.waitForFunction(()=>document.querySelector('#sample')?.options.length===15&&document.body.dataset.ready==='true');
    assert.equal(await page.locator('#review-root').count(),1);
    assert.match(await page.locator('#review-root [role=status]').innerText(),/0\/15 reviewed/);
    const grade=page.getByLabel('Your visual grade'),reason=page.getByLabel('Visual reason (no personal information)');
    // The real fitted source is reviewable. A manual PASS is NEVER official approval.
    await grade.selectOption('PASS');
    await reason.selectOption('All four visual criteria manually checked');
    await page.getByRole('button',{name:'Save this review'}).click();
    assert.match(await page.locator('#review-root [role=status]').innerText(),/NOT SAVED/);
    for(const title of CHECKS)await page.getByLabel(title).check();
    await page.getByRole('button',{name:'Save this review'}).click();
    assert.match(await page.locator('#review-root [role=status]').innerText(),/1\/15 reviewed/);
    await page.getByRole('button',{name:'Next unreviewed garment'}).click();
    await page.waitForFunction(()=>document.body.dataset.ready==='true'&&document.body.dataset.id==='commons-0003');
    await grade.selectOption('REVIEW');
    await reason.selectOption('Sleeves or underarm attachment still disconnected');
    await page.getByRole('button',{name:'Save this review'}).click();
    assert.match(await page.locator('#review-root [role=status]').innerText(),/2\/15 reviewed/);
    // An unsupported jacket cannot be silently promoted even with all checks ticked.
    await page.selectOption('#sample','commons-0065');
    await page.waitForFunction(()=>document.body.dataset.ready==='true'&&document.body.dataset.id==='commons-0065');
    await grade.selectOption('PASS');await reason.selectOption('All four visual criteria manually checked');
    for(const title of CHECKS)await page.getByLabel(title).check();
    await page.getByRole('button',{name:'Save this review'}).click();
    assert.match(await page.locator('#review-root [role=status]').innerText(),/NOT SAVED/);
    // Export with only two human choices and zero assumed account identity.
    const [dl]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export local JSON review'}).click()]);
    const payload=await readFile(await dl.path(),'utf8'),parsed=JSON.parse(payload);
    assert.equal(parsed.rows.length,15);
    assert.equal(parsed.rows[0].decision,'PASS');
    assert.equal(parsed.rows[1].decision,'REVIEW');
    assert.equal(parsed.rows[2].decision,'NOT_REVIEWED');
    assert.equal(parsed.release,'HOLD');assert.equal(parsed.ownerApproved,false);
    assert.equal(parsed.productionModified,false);
    assert.doesNotMatch(payload,/(@|jwt|token|email|accountId|photoBytes|privatePhoto)/i);
    // Resume exported data after revisiting same page, then reject forged release.
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#sample')?.options.length===15&&document.body.dataset.ready==='true');
    assert.match(await page.locator('#review-root [role=status]').innerText(),/0\/15 reviewed/);
    const input=page.getByLabel('Import previous manual review');
    await input.setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(payload)});
    await page.waitForFunction(()=>document.querySelector('#review-root [role=status]')?.textContent?.includes('Prior local review imported'));
    assert.equal(await page.getByLabel('Your visual grade').inputValue(),'PASS');
    await page.selectOption('#sample','commons-0001');
    await page.waitForFunction(()=>document.body.dataset.ready==='true'&&document.body.dataset.id==='commons-0001');
    assert.equal(await grade.inputValue(),'PASS');
    const forged=JSON.stringify({...parsed,release:'READY',ownerApproved:true});
    await input.setInputFiles({name:'fake.json',mimeType:'application/json',buffer:Buffer.from(forged)});
    await page.waitForFunction(()=>document.querySelector('#review-root [role=status]')?.textContent?.includes('Invalid review file rejected'));
    assert.equal(await grade.inputValue(),'PASS');
    // A different cutout invalidates the prior visual decision, including an older import.
    await page.getByRole('button',{name:'Original cutout fallback',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[aria-label="Your visual grade"]')?.value==='NOT_REVIEWED');
    await input.setInputFiles({name:'older.json',mimeType:'application/json',buffer:Buffer.from(payload)});
    await page.waitForFunction(()=>document.querySelector('#review-root [role=status]')?.textContent?.includes('Prior local review imported'));
    assert.equal(await grade.inputValue(),'NOT_REVIEWED');
    assert.deepEqual(errors,[],'Browser page errors');
    assert.deepEqual(external,[],'No remote traffic permitted');
    const layout=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('#review-root *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,5).map(e=>({tag:e.tagName,role:e.getAttribute('aria-label'),width:Math.round(e.getBoundingClientRect().width)}))}));
    assert.ok(layout.scrollWidth<=layout.viewport+1,'Mobile visual review overflow '+JSON.stringify({browser:name,width,...layout}));
    if(name==='chromium'&&width===390){
     await mkdir('benchmark/work48/visual-review',{recursive:true});
     await page.screenshot({path:'benchmark/work48/visual-review/390px-reviewed-sample-HOLD.png',fullPage:true});
    }
    stats.push({browser:name,width,reviewed:2,unreviewed:13,ownerVerified:false,release:'HOLD'});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
assert.equal(stats.length,6);
console.log('FAMILY_ALPHA_59_VISUAL_REVIEW_BROWSER_HOLD',JSON.stringify(stats));
