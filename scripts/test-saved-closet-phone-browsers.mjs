// Mobile-engine rehearsal ONLY: operator-entered values, no actual phones.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const parsed=new URL(req.url,'http://localhost'),p=resolve(root,'.'+decodeURIComponent(parsed.pathname==='/'?'/index.html':parsed.pathname));
  if(!p.startsWith(root+'/'))throw Error('Invalid path');
  const bytes=await readFile(p);res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const results=[];
try{
 for(const [label,browserType] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await browserType.launch({headless:true,...(label.startsWith('Android')?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
    hasTouch:true,acceptDownloads:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>requests.push(r.url()));
   await page.goto('http://127.0.0.1:'+server.address().port+'/saved-closet-audit.html');
   const build=await page.locator('#build').inputValue();
   assert.match(build,/^[a-f0-9]{12}$/);
   assert.equal(await page.locator('#build').getAttribute('readonly'),'');
   assert.equal(await page.locator('script[src*="saved-closet-audit.js"]').getAttribute('src'),'saved-closet-audit.js?v='+build);
   assert.equal(await page.locator('#resultsPanel').isHidden(),true);
   await page.locator('#expectedCategory').selectOption('Bottoms');
   await page.locator('#expectedType').selectOption('Skirt');
   await page.locator('#expectedColor').selectOption('Black');
   await page.locator('#source').selectOption('import');
   await page.locator('#lockExpected').click();
   assert.equal(await page.locator('#expectedInputs').isHidden(),true);
   assert.equal(await page.locator('#resultsPanel').isVisible(),true);
   assert.match(await page.locator('#lockedSummary').textContent(),/Skirt/);
   await page.locator('#proposedCategory').selectOption('Bottoms');
   await page.locator('#proposedType').selectOption('Shorts');
   await page.locator('#proposedColor').selectOption('Black');
   await page.locator('#disposition').selectOption('saved-corrected');
   await page.locator('#savedCategory').selectOption('Bottoms');
   await page.locator('#savedType').selectOption('Skirt');
   await page.locator('#savedColor').selectOption('Black');
   await page.locator('#backup').selectOption('restored');
   await page.locator('#saveRow').click();
   assert.match(await page.locator('#count').textContent(),/1 garment/);
   assert.equal(await page.locator('#resultsPanel').isHidden(),true);
   await page.locator('#expectedCategory').selectOption('Shoes');
   await page.locator('#expectedType').selectOption('Shoes');
   await page.locator('#expectedColor').selectOption('White');
   await page.locator('#source').selectOption('camera');
   await page.locator('#lockExpected').click();
   await page.locator('#proposedCategory').selectOption('Shoes');
   await page.locator('#proposedType').selectOption('Shoes');
   await page.locator('#proposedColor').selectOption('White');
   await page.locator('#saveRow').click();
   assert.match(await page.locator('#count').textContent(),/2 garments/);
   const [download]=await Promise.all([
    page.waitForEvent('download'),page.locator('#downloadReport').click()
   ]);
   const report=JSON.parse(await readFile(await download.path(),'utf8'));
   assert.equal(report.appRelease,build);assert.equal(report.version,1);
   assert.equal(report.rows.length,2);assert.equal(report.rows[0].source,'import');
   assert.equal(report.rows[0].proposed.type,'Shorts');
   assert.equal(report.rows[0].saved.type,'Skirt');
   assert.equal(report.rows[0].disposition,'saved-corrected');
   assert.equal(report.rows[1].disposition,'saved-auto');
   assert.equal(report.summary.saved,2);
   assert.equal(report.summary.savedExactCategoryTypeColorCorrect,2);
   assert.equal(report.productionReleaseApproved,false);
   assert.equal(report.physicalHardwareIndependentlyVerified,false);
   assert.equal(report.sendAutomatically,false);
   assert.ok(!JSON.stringify(report).includes('data:image'));
   assert.ok(!requests.some(url=>url.includes('supabase.co')));
   assert.deepEqual(errors,[]);
   results.push({browser:label,storedRows:2,correctedWrongSkirtVsShorts:true,
    preservedOwnedPhotoPrivacy:true,independentHardwareProof:false,
    reportReleaseMatchesBuild:true});
   await context.close();
  }finally{await browser.close();}
 }
 console.log('SAVED_CLOSET_AUDIT_MOBILE '+JSON.stringify(results));
}finally{server.close();}
