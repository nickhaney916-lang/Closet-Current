/**
 * MODEL-ASSET52: Independent real local FashionCLIP cold-load probe.
 * No customer accounts, no network photo upload, no classifier substitutes.
 * Records request method/hostname/path, never signed queries/headers.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),dir=resolve('benchmark/model-asset-reliability-52');
await mkdir(dir,{recursive:true});
const input=await readFile('benchmark/fixtures/commons-0003.jpg');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceSHA256=sha(input),lock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0003');
assert.equal(sourceSHA256,lock.sha256);
const image='data:image/jpeg;base64,'+input.toString('base64');
const modelRevision='0f99955d944c39bfd9d035a02ac273c7a44a406b';
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public|research|benchmark|node_modules)\//.test(pathname)||pathname.split('/').includes('..')||pathname.includes('\\'))throw Error('Forbidden path');
  const file=resolve(root,'.'+pathname);
  if(!file.startsWith(root+'/'))throw Error('Outside root');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const result={priority:'MODEL-ASSET-RELIABILITY-52',sourceSHA256,photoUploadCount:0,cases:[],blocked:[],failures:[],responses:[],errors:[]};
function allowedExternal(request){
 if(request.method()!=='GET')return false;
 let u;try{u=new URL(request.url());}catch{return false;}
 if(u.protocol!=='https:')return false;
 if(u.hostname==='cdn.jsdelivr.net')return u.pathname.startsWith('/npm/@huggingface/transformers@3.8.1/dist/');
 if(u.hostname==='huggingface.co')return u.pathname.startsWith('/ff13/fashion-clip/resolve/'+modelRevision+'/');
 if(/^(cas-bridge|cas-server|transfer)\.xethub\.hf\.co$/.test(u.hostname))return true;
 if(u.hostname==='us.aws.cdn.hf.co')return u.pathname.startsWith('/xet-bridge-us/');
 return false;
}
function label(request){
 const u=new URL(request.url());
 return {method:request.method(),host:u.host,path:u.pathname};
}
let browser;
try{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  browser=await launcher.launch({headless:true,...engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}}); 
  const context=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const request=route.request(),url=request.url();
   if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'+origin))return route.continue();
   if(allowedExternal(request))return route.continue();
   const item=label(request);
   if(request.method()!=='GET')result.photoUploadCount++;
   result.blocked.push({engine,...item});
   return route.abort();
  });
  context.on('requestfailed',request=>{
   if(request.url().startsWith(origin+'/'))return;
   result.failures.push({engine,...label(request),reason:request.failure()?.errorText||null});
  });
  context.on('response',response=>{
   const request=response.request();if(request.url().startsWith(origin+'/'))return;
   result.responses.push({engine,...label(request),status:response.status()});
  });
  const page=await context.newPage();
  page.on('pageerror',error=>result.errors.push({engine,text:String(error.message).slice(0,160)}));
  await page.goto(origin+'/public/benchmark.html',{waitUntil:'domcontentloaded'});
  const inference=await page.evaluate(async ({image})=>{
   return new Promise((resolve,reject)=>{
    const worker=new Worker('/public/local-worker.mjs',{type:'module'});
    let timer=setTimeout(()=>{worker.terminate();reject(Error('Real FashionCLIP worker timed out'));},150000);
    let nextId=1;const evidence={};
    const fail=error=>{clearTimeout(timer);worker.terminate();reject(Error(String(error)))};
    worker.onerror=e=>fail('worker error '+(e.message||'unknown'));
    worker.onmessage=({data})=>{
     if(data?.type==='progress'||data?.type==='identified')return;
     if(data?.type==='error')return fail('worker '+data.stage+' '+data.code);
     if(data?.id===1&&data?.type==='result'){
      evidence.modelKey=data.recognitionMemory?.modelKey||null;
      evidence.features=data.recognitionMemory?.features||null;
      worker.postMessage({id:2,type:'classify',image});
     }else if(data?.id===2&&data?.type==='result'){
      evidence.classification={strong:data.strong===true,categoryConfirmed:data.categoryConfirmed===true,
       choiceCount:Array.isArray(data.choices)?data.choices.length:0,
       topCategory:data.choices?.[0]?.category||null};
      clearTimeout(timer);worker.terminate();resolve(evidence);
     }
    };
    worker.postMessage({id:nextId,type:'features',image});
   });
  },{image});
  const values=inference.features;
  assert.ok(Array.isArray(values)&&values.length===512,engine+' must execute genuine 512d visual encoder');
  assert.ok(values.every(Number.isFinite));
  const magnitude=Math.hypot(...values);
  assert.ok(magnitude>.98&&magnitude<1.02,'Expected normalized FashionCLIP embedding');
  assert.equal(inference.modelKey,'fashion-clip/whole-v1/'+modelRevision);
  assert.ok(inference.classification.choiceCount>0);
  result.cases.push({engine,width:390,modelKey:inference.modelKey,visualEncoderDimension:values.length,
   embeddingL2Norm:Number(magnitude.toFixed(6)),...inference.classification,
   errors:result.failures.filter(x=>x.engine===engine).length,
   blocked:result.blocked.filter(x=>x.engine===engine)});
  await context.close();await browser.close();browser=null;
 }
 assert.equal(result.photoUploadCount,0);
 await writeFile(dir+'/probe.json',JSON.stringify(result,null,2)+'\n');
 console.log('MODEL-ASSET52 actual cold-load probe: '+JSON.stringify({cases:result.cases,blocked:result.blocked,failures:result.failures,responses:result.responses,errors:result.errors}));
}catch(e){
 result.failure=String(e.stack||e);
 await writeFile(dir+'/probe.json',JSON.stringify(result,null,2)+'\n');
 throw e;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
