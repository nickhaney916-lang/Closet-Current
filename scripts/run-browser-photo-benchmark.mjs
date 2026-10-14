import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
const root=resolve('dist'),photoDir=resolve('benchmark/photos'),manifest=resolve('benchmark/manifest-reviewed-32.json');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.bin':'application/octet-stream','.css':'text/css','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname;const name=resolve(root,'.'+decodeURIComponent(p==='/'?'/index.html':p));if(!name.startsWith(root+'/'))throw Error('Forbidden');const data=await readFile(name);res.writeHead(200,{'Content-Type':types[extname(name)]||'application/octet-stream','Access-Control-Allow-Origin':'*'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();
 page.on('console',msg=>console.log('Browser:',msg.type(),msg.text().slice(0,300)));
 page.on('pageerror',e=>console.log('Page error:',e.message));
 await page.goto('http://127.0.0.1:'+port+'/benchmark.html');
 await page.locator('#manifest').setInputFiles(manifest);
 const names=(await readdir(photoDir)).filter(x=>/\.(jpg|png|webp)$/i.test(x)).map(x=>join(photoDir,x));
 await page.locator('#photos').setInputFiles(names);
 await page.locator('#run').click();
 try{await page.locator('#download').waitFor({state:'visible',timeout:900000});await page.waitForFunction(()=>!document.querySelector('#download').disabled,null,{timeout:900000});}
 catch(e){console.error('Runner status:',await page.locator('#status').innerText());throw e;}
 const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;
 await mkdir('benchmark/output',{recursive:true});await download.saveAs('benchmark/output/results.json');
 const result=JSON.parse(await readFile('benchmark/output/results.json','utf8'));const errors=result.filter(x=>x.error);const reasons=Object.fromEntries([...new Set(result.map(x=>x.reason|| (x.error?'runtime_error':'accepted')))].map(reason=>[reason,result.filter(x=>(x.reason||(x.error?'runtime_error':'accepted'))===reason).length]));console.log('Rejection reasons:',JSON.stringify(reasons));console.log('Actual browser inference results:',result.length,'errors:',errors.length);console.log('Error examples:',JSON.stringify(errors.slice(0,8)));await writeFile('benchmark/output/run-summary.json',JSON.stringify({count:result.length,errors:errors.length,reasons,errorExamples:errors.slice(0,8)},null,2));
 if(errors.length)process.exitCode=1;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
