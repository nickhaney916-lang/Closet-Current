// P97 genuine desktop browser engines; NEVER physical phone evidence.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {serve} from './serve-device97.mjs';
const exec=promisify(execFile);
const engine=process.env.P97_ENGINE||'chromium',width=Number(process.env.P97_WIDTH||390);
assert(['chromium','webkit'].includes(engine));assert([320,390,430].includes(width));
const fixture=await readFile('benchmark/fixtures/commons-0003.jpg');
const fixtureSha=createHash('sha256').update(fixture).digest('hex');
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
assert(locked.some(x=>x.id==='commons-0003'&&x.verified&&x.sha256===fixtureSha));
const dir=await mkdtemp(join(tmpdir(),'closet-p97-'));
let server,browser;
try{
 const key=join(dir,'key.pem'),cert=join(dir,'cert.pem');
 await exec('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=localhost',
  '-keyout',key,'-out',cert]);
 server=await serve({host:'127.0.0.1',port:0,cert,key});
 const local='https://127.0.0.1:'+server.address().port;
 browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
 const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,
  acceptDownloads:true,ignoreHTTPSErrors:true,serviceWorkers:'block'});
 const violations=[];
 await ctx.route('**/*',route=>{
  if(new URL(route.request().url()).origin===local)return route.continue();
  violations.push('outbound-attempt');return route.abort();
 });
 const page=await ctx.newPage();
 page.on('pageerror',error=>violations.push(error.name));
 await page.goto(local+'/probe?head='+'a'.repeat(40),{waitUntil:'domcontentloaded'});
 await page.locator('#secure').waitFor();
 assert.match(await page.locator('#secure').textContent(),/Secure context active/);
 await page.locator('#gallery').setInputFiles({name:'disposable-fixture.jpg',mimeType:'image/jpeg',buffer:fixture});
 await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('"decode": "PASS"'),
  null,{timeout:15000});
 await page.locator('#permission').click();
 await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('camera-permission'),
  null,{timeout:15000});
 const downloaded=page.waitForEvent('download');
 await page.locator('#export').click();
 const download=await downloaded;
 const report=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(report.sourceHead,'a'.repeat(40));
 assert.equal(report.environment.deviceKind,'UNVERIFIED');
 assert.equal(report.observations[0].sourceSha256,fixtureSha);
 assert.equal(report.observations[0].originalByteCount,fixture.length);
 assert.equal(report.observations[0].decode,'PASS');
 assert.ok(report.observations[0].decodedWidth>0&&report.observations[0].decodedHeight>0);
 assert.equal(report.observations[0].orientation,'UNVERIFIED');
 assert(!JSON.stringify(report).includes('disposable-fixture'));
 assert(!JSON.stringify(report).includes('data:image'));
 assert.deepEqual(violations,[]);
 await page.locator('#clear').click();
 assert.match(await page.locator('#output').textContent(),/"observations": \[\]/);
 console.log('P97_PROBE_BROWSER_PASS',JSON.stringify({engine,width,actualEngine:true,
  physicalPhone:false,sha256Verified:true,sourceBytes:fixture.length,
  decodedDimensionsVerified:true,permissionResult:report.observations[1].permission,
  redactedExport:true,externalRequests:0,storedImage:false,release:'HOLD'}));
 await ctx.close();
}finally{
 await browser?.close();
 if(server)await new Promise(done=>server.close(done));
 await rm(dir,{recursive:true,force:true});
}
