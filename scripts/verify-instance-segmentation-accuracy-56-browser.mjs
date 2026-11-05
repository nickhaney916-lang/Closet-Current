import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),modelPath='/tmp/closet-current-yolo26s-deepfashion2.onnx';
const modelSha='485bc106721febbd82fe24297e12a9fb49a435a552afff1e6b76308716555f76';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let model;
try{model=await readFile(modelPath);}catch(error){
  if(error?.code!=='ENOENT')throw error;
  const url='https://huggingface.co/HasanKabir23/Yolov26s-DeepFashion2/resolve/670bd8b4a9a94c687c85df0b1376497c40a3759b/best.onnx';
  const response=await fetch(url,{redirect:'follow'});
  if(!response.ok)throw Error('Pinned model download failed: HTTP '+response.status);
  model=Buffer.from(await response.arrayBuffer());
  await writeFile(modelPath,model);
}
assert.equal(sha(model),modelSha,'pinned candidate ONNX changed');
const photos=['commons-0021','commons-0033','commons-0080'];
const types={'.mjs':'text/javascript','.html':'text/html','.wasm':'application/wasm','.jpg':'image/jpeg','.js':'text/javascript'};
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(req.method!=='GET'||path.split('/').includes('..')||path.includes('\\')||path.includes('\0'))throw Error('invalid static request');
    if(path==='/candidate.onnx')return res.writeHead(200,{'content-type':'application/octet-stream'}).end(model);
    if(!/^\/(research\/instance-segmentation-accuracy-56\/(browser-runner\.html|browser-runner\.mjs)|benchmark\/fixtures\/(commons-0021|commons-0033|commons-0080)\.jpg|node_modules\/onnxruntime-web\/dist\/[a-zA-Z0-9._-]+)$/.test(path))throw Error('unexpected path');
    const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('outside repo');
    const data=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(data);
  }catch{res.writeHead(404).end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=`http://127.0.0.1:${server.address().port}`;
const dir=resolve('benchmark/instance-segmentation-accuracy-56');await mkdir(dir,{recursive:true});
const allEngines={chromium,webkit};
const requested=(process.env.INSTANCE56_ENGINES||'chromium,webkit').split(',').map(x=>x.trim()).filter(Boolean);
assert.ok(requested.length&&requested.every(x=>allEngines[x]),'unknown INSTANCE56_ENGINES value');
const engines=Object.fromEntries(requested.map(name=>[name,allEngines[name]])),results={};
try{
  for(const [engine,launcher] of Object.entries(engines)){
    const browser=await launcher.launch({headless:true,...engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {}});
    const context=await browser.newContext({viewport:{width:390,height:920},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const outside=[],errors=[];
    await context.route('**/*',route=>{
      const url=route.request().url();
      if(url.startsWith(origin+'/'))return route.continue();
      outside.push(url);return route.abort();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/research/instance-segmentation-accuracy-56/browser-runner.html',{waitUntil:'load'});
    await page.waitForFunction(()=>window.__instance56?.done===true,null,{timeout:180000});
    const execution=await page.evaluate(()=>window.__instance56);
    assert.ok(!execution.error,engine+': '+execution.error);
    assert.equal(execution.outputs.length,photos.length);
    assert.ok(execution.outputs.every(x=>x.proposalCount>=0&&x.proposals.every(p=>p.maskPixels>=0&&p.maskSha256.length===64)));
    assert.deepEqual(errors,[],engine+' browser errors');assert.deepEqual(outside,[],engine+' unexpected network request');
    const screenshots=[];
    for(const width of [320,390,430]){
      await page.setViewportSize({width,height:920});
      const png=await page.screenshot({path:`${dir}/${engine}-${width}.png`,fullPage:true,animations:'disabled'});
      const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
      assert.equal(meta.width,width);assert.ok(meta.height>=700&&png.length>12000);
      assert.ok(stats.channels.some(c=>c.stdev>8),'empty screenshot');
      screenshots.push({engine,width,height:meta.height,file:`${engine}-${width}.png`,bytes:png.length,sha256:sha(png)});
    }
    results[engine]={coldModelLoadMs:execution.coldLoadMs,photos:execution.outputs,screenshots,errors,outsideRequests:outside};
    await context.close();await browser.close();
  }
  const report={assignment:'INSTANCE-SEGMENTATION-ACCURACY-56',modelRevision:'670bd8b4a9a94c687c85df0b1376497c40a3759b',modelSha256:modelSha,
    mode:'actual ONNX Runtime Web WASM inference on SHA-recorded public benchmark fixture JPEG bytes; some fixtures are resized derivatives; read-only harness; no closet saves',
    browsers:results,physicalDeviceTest:false,privateClosetFlow:false,accountIsolation:false,backupRestore:false};
  await writeFile(`${dir}/browser-report.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({photos:Object.fromEntries(Object.entries(results).map(([engine,x])=>[engine,x.photos.length])),
    screenshots:Object.values(results).flatMap(x=>x.screenshots).length,coldLoadMs:Object.fromEntries(Object.entries(results).map(([engine,x])=>[engine,x.coldModelLoadMs])),meanWarmInferenceMs:Object.fromEntries(Object.entries(results).map(([engine,x])=>[engine,Number((x.photos.reduce((n,p)=>n+p.inferenceMs,0)/x.photos.length).toFixed(1))])),
    outsideRequests:0,report:`${dir}/browser-report.json`},null,2));
}finally{await new Promise(done=>server.close(done));}
