// Actual local browser WASM inference. No uploads, deployment or owner accounts.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {MODELS67} from '../research/parallel67/independent-scorer.mjs';
const engine=process.argv[2]||'chromium',key=process.argv[3]||'marqo',cohort=process.argv[4]||'new';
if(!['chromium','webkit'].includes(engine)||!['baseline','marqo','marqoclip'].includes(key)||!['old','new'].includes(cohort))throw Error('Invalid fixed experiment');
const partition=process.argv[5]===undefined?null:Number(process.argv[5]);
if(partition!==null&&(!Number.isInteger(partition)||partition<0||partition>4))throw Error('Invalid fixed partition');
const root=resolve('.'),cache=resolve('node_modules/@huggingface/transformers/.cache');
const baseline=JSON.parse(await readFile('public/recognition-vectors.json'));
const specs={...MODELS67,baseline};
const sourceManifest=cohort==='new'?'research/parallel67/new-photos/reviewed-development.json':'benchmark/manifest-holdout-16.json';
const manifestBytes=await readFile(sourceManifest),document=JSON.parse(manifestBytes),allManifest=document.rows||document;
const manifest=partition===null?allManifest:allManifest.slice(partition*4,partition*4+4);
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET')throw Error('No writes');
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file;
  if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>P67 HOLD research</title><p>Independent recognition research. Manual review required.</p>');return;}
  if(path.startsWith('/models/')){
   const spec=Object.values(specs).find(x=>path.startsWith('/models/'+x.model+'/'));if(!spec)throw Error('Unpinned model');
   file=resolve(cache,spec.model,spec.revision,path.slice(('/models/'+spec.model+'/').length));if(!file.startsWith(resolve(cache,spec.model,spec.revision)+'/'))throw Error('Traversal');
  }else{
   if(!['/research/parallel67/','/public/','/node_modules/@huggingface/transformers/dist/'].some(x=>path.startsWith(x)))throw Error('Not allowed');
   file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('Traversal');
  }
  const info=await stat(file);res.writeHead(200,{'Content-Type':({'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm'}[extname(file)]||'application/octet-stream'),'Content-Length':info.size});createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
try{
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{...(process.env.P67_WEBKIT_EXECUTABLE?{executablePath:process.env.P67_WEBKIT_EXECUTABLE}:{})})});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const violations=[];await context.route('**/*',route=>{
  const request=route.request();if((!request.url().startsWith(origin+'/')&&!request.url().startsWith('blob:'+origin+'/'))||request.method()!=='GET'){violations.push('NONLOCAL_OR_WRITE_REQUEST');return route.abort();}return route.continue();
 });
 const page=await context.newPage();page.on('console',msg=>console.log('BROWSER',msg.text().slice(0,240)));page.on('pageerror',error=>console.log('PAGE_ERROR',error.message));
 await page.goto(origin);
 await page.evaluate(()=>{globalThis.worker67=new Worker('/research/parallel67/worker.mjs',{type:'module'});globalThis.ask67=request=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker67.terminate();reject(Error('Bounded worker timeout'));},300000);const listener=({data})=>{if(data.id!==request.id)return;clearTimeout(timer);worker67.removeEventListener('message',listener);if(data.type==='error')reject(Error(data.code));else resolve(data);};worker67.addEventListener('message',listener);worker67.onerror=()=>{clearTimeout(timer);reject(Error('Worker runtime error'));};worker67.postMessage(request,request.bytes?[request.bytes]:[]);});});
 const ready=await page.evaluate(model=>ask67({model,type:'load',id:'load'}),key);console.log('READY',engine,key,ready.loadMs);
 const rows=[],workerLoads=[ready.loadMs];
 for(const row of manifest){

  const bytes=await readFile((cohort==='new'?'benchmark/parallel67-photos/':'benchmark/fixtures/')+row.image);
  const sha256=createHash('sha256').update(bytes).digest('hex');if(sha256!==(row.sha256||sources.find(x=>x.id===row.id)?.sha256))throw Error('Original source SHA mismatch');
  const result=await page.evaluate(async({model,id,sha256,data})=>ask67({model,id,sha256,type:'classify',bytes:Uint8Array.from(atob(data),c=>c.charCodeAt(0)).buffer}),{model:key,id:row.id,sha256,data:bytes.toString('base64')});
  rows.push({id:row.id,expectedCategory:row.expectedCategory,expectedType:row.expectedType,acceptedTypes:row.acceptedTypes||[row.expectedType],subtypeAmbiguous:row.subtypeAmbiguous||false,...result});console.log(engine,key,row.id,result.proposal.strong,result.proposal.choices?.[0]?.itemType,Math.round(result.elapsedMs));
 }
 const widths=[];for(const width of [320,390,430]){await page.setViewportSize({width,height:844});widths.push(await page.evaluate(()=>({width:innerWidth,noOverflow:document.documentElement.scrollWidth<=innerWidth})));}
 if(violations.length)throw Error('Privacy boundary violated');
 await writeFile('research/parallel67/'+engine+'-'+key+'-'+cohort+'-browser'+(partition===null?'':'-part'+partition)+'.json',JSON.stringify({engine,browserVersion:browser.version(),model:key,cohort,notHumanBlindAcceptance:true,physicalDevice:false,manifestSha256:createHash('sha256').update(manifestBytes).digest('hex'),loadMs:ready.loadMs,workerLoadsMs:workerLoads,workerBatchLimit:4,partition,widths,networkViolations:violations,rows},null,2)+'\n');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
