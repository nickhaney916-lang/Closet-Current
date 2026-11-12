// Actual desktop Chromium/WebKit WASM evidence at mobile CSS widths.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,writeFile,stat,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const engine=process.argv[2]||'chromium';if(!['chromium','webkit'].includes(engine))throw Error('Invalid engine');
const root=resolve('.'),modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76',cache=resolve('node_modules/@huggingface/transformers/.cache',modelId,revision);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=await readFile('research/parallel67-reference/fashionpedia/manifest.json'),manifest=JSON.parse(manifestBytes);
if(manifest.rows.length!==8)throw Error('Expected exactly existing development eight');
const modulePath='research/parallel68/semantic-instances.mjs',moduleSha256=sha(await readFile(modulePath));
const modelBytes=await readFile(cache+'/onnx/model.onnx'),modelSha256=sha(modelBytes);
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET')throw Error('Read only');const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file;
  if(path==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>P68 DEV model evidence HOLD</title><p>Development inference. All predictions require review.</p>');return;}
  if(path.startsWith('/models/'+modelId+'/')){file=resolve(cache,path.slice(('/models/'+modelId+'/').length));if(!file.startsWith(cache+'/'))throw Error('Traversal');}
  else{if(!['/research/parallel68/','/public/','/node_modules/@huggingface/transformers/dist/'].some(p=>path.startsWith(p)))throw Error('Not allowed');file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('Traversal');}
  const info=await stat(file);res.writeHead(200,{'Content-Type':({'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm'}[extname(file)]||'application/octet-stream'),'Content-Length':info.size});createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
const rows=[],loads=[],views=[],violations=[],pageErrors=[];
try{
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{...(process.env.P68_WEBKIT_EXECUTABLE?{executablePath:process.env.P68_WEBKIT_EXECUTABLE}:{})})});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await context.route('**/*',route=>{const req=route.request();if((!req.url().startsWith(origin+'/')&&!req.url().startsWith('blob:'+origin+'/'))||req.method()!=='GET'){violations.push('NONLOCAL_OR_WRITE_REQUEST');return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));await page.goto(origin);
  views.push(await page.evaluate(()=>({width:innerWidth,contentWidth:document.documentElement.scrollWidth})));
  await page.evaluate(()=>{globalThis.w68=new Worker('/research/parallel68/browser-worker.mjs',{type:'module'});globalThis.ask68=request=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{w68.terminate();reject(Error('Bounded actual model timeout'));},120000);const listener=({data})=>{if(data.id!==request.id)return;clearTimeout(timer);w68.removeEventListener('message',listener);data.type==='error'?reject(Error(data.code)):resolve(data);};w68.addEventListener('message',listener);w68.onerror=()=>{clearTimeout(timer);reject(Error('Worker failure'));};w68.postMessage(request,request.bytes?[request.bytes]:[]);});});
  const loaded=await page.evaluate(()=>ask68({id:'load',type:'load'}));loads.push({width,loadMs:loaded.loadMs});
  for(const source of manifest.rows){
   const bytes=await readFile('benchmark/parallel67-reference-photos/'+source.image);if(sha(bytes)!==source.sha256)throw Error('Original DEV JPEG SHA changed');
   const result=await page.evaluate(async({id,sha256,data})=>ask68({id,sha256,type:'infer',bytes:Uint8Array.from(atob(data),c=>c.charCodeAt(0)).buffer}),{id:source.id,sha256:source.sha256,data:bytes.toString('base64')});
   rows.push({viewportWidth:width,...result});console.log(engine,width,source.id,result.baseline.length,result.candidate.length,Math.round(result.elapsedMs));
  }
  await page.evaluate(()=>w68.terminate());await context.close();
 }
 if(violations.length||pageErrors.length)throw Error('Browser network/runtime boundary violated');
 if(sha(await readFile(modulePath))!==moduleSha256)throw Error('P68 grouping source changed during inference');
 if(rows.length!==24||views.some(x=>x.width!==x.contentWidth))throw Error('Incomplete viewport evidence');
 await mkdir('research/parallel68/results',{recursive:true});
 await writeFile('research/parallel68/results/browser-'+engine+'-dev8.json',JSON.stringify({format:'closet-current-parallel68-actual-browser-model/v1',engine,browserVersion:browser.version(),model:modelId,revision,dtype:'fp32',modelBytes:modelBytes.length,modelSha256,moduleSha256,developmentManifestSha256:sha(manifestBytes),cohort:'P67 original eight development photos only; NO validation or sealed acceptance access',physicalDevice:false,desktopMobileViewportEmulation:true,maskHashesFromActualWasm:true,notHumanAcceptance:true,automaticSave:false,views,loads,networkViolations:violations,pageErrors,rows},null,2)+'\n');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
