import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/phone-photo-flow');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
 if(!file.startsWith(root+'/'))throw Error('Invalid path');
 res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
}catch{if(!res.headersSent)res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 await mkdir(output,{recursive:true});browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true}),pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/phone-photo-check.html');
 assert.equal(await page.locator('#run').isDisabled(),true);
 await page.locator('#photos').setInputFiles([
  {name:'PRIVATE_PHONE_GARMENT.jpg',mimeType:'image/jpeg',buffer:await readFile('benchmark/photos/commons-0001.jpg')},
  {name:'PRIVATE_PHONE_NEGATIVE.jpg',mimeType:'image/jpeg',buffer:await readFile('benchmark/photos/commons-0090.jpg')}
 ]);
 await page.locator('#category-0').selectOption('Tops');await page.locator('#type-0').selectOption('T-shirt');assert.equal(await page.locator('#run').isDisabled(),true);
 await page.locator('#category-1').selectOption('Uncategorized');await page.locator('#run').click();
 assert.equal(await page.locator('#category-0').isDisabled(),true);assert.equal(await page.locator('#photos').isDisabled(),true);
 await page.locator('#download').waitFor({state:'visible',timeout:480000});
 const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;const reportPath=join(output,'results.json');await download.saveAs(reportPath);
 const raw=await readFile(reportPath,'utf8'),report=JSON.parse(raw);assert.ok(!raw.includes('PRIVATE_PHONE'));assert.ok(!raw.includes('data:image'));assert.equal(report.summary.photos,2);assert.equal(report.summary.errors,0);assert.equal(report.summary.categoryMatches,1);assert.equal(report.summary.typeMatches,1);assert.equal(report.summary.negativeRejected,1);assert.match(report.release,/^[a-f0-9]{12}$/);assert.equal(report.recognitionIndex,JSON.parse(await readFile('public/recognition-vectors.json','utf8')).sha256);
 assert.equal(await page.locator('#category-0').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:join(output,'phone-photo-flow.png'),fullPage:true});
 await page.locator('#restart').click();assert.equal(await page.locator('.photo').count(),0);assert.equal(await page.locator('#photos').isDisabled(),false);assert.equal(await page.locator('#download').isVisible(),false);
 await page.locator('#photos').setInputFiles({name:'PRIVATE_PHONE_RETRY.jpg',mimeType:'image/jpeg',buffer:await readFile('benchmark/photos/commons-0001.jpg')});await page.locator('#category-0').selectOption('Tops');await page.locator('#run').click();await page.locator('#restart').click();
 await page.waitForTimeout(150);assert.equal(await page.locator('.photo').count(),0);assert.equal(await page.locator('#status').innerText(),'Choose your photos to begin.');assert.deepEqual(pageErrors,[]);
 await writeFile(join(output,'summary.json'),JSON.stringify({passed:true,realWorker:true,fixturePhotos:2,viewport:{width:390,height:844},lockedLabels:true,reportPrivacy:true,cancellation:true,pageErrors},null,2));
 console.log('Phone photo-check flow passed with real recognition; private filenames excluded.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
