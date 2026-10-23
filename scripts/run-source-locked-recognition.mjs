// Warm the existing pinned model once, then deny remote requests before inference.
// Both engines here mean baseline/candidate application engines, not two browsers.
import {chromium} from 'playwright';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {resolve,extname,join} from 'node:path';
import assert from 'node:assert/strict';
const base='33744dc0900fcb0cc2d014510e22fa03c2a96637',root=resolve('dist');
const baseline=execFileSync('git',['show',base+':public/recognition-engine.mjs']);
const output=process.argv[2]||'benchmark/source-locked-output';fs.mkdirSync(output,{recursive:true});
const mime={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.bin':'application/octet-stream'};
const server=createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  if(u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Licensed offline recognition QA</title>');return;}
  const p=resolve(root,'.'+u.pathname);if(!p.startsWith(root+'/'))throw Error('path');
  const bytes=u.pathname==='/recognition-engine.mjs'&&u.searchParams.get('baseline')==='1'?baseline:fs.readFileSync(p);
  res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;
const sha=b=>createHash('sha256').update(b).digest('hex');
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await page.goto(origin);
 await page.evaluate(async()=>{
  window.qa={};
  for(const name of ['baseline','candidate']){
   const worker=new Worker('/local-worker.mjs'+(name==='baseline'?'?baseline=1':''),{type:'module'}),pending=new Map();let id=0;
   const call=payload=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});worker.postMessage({...payload,id});});
   worker.onmessage=({data})=>{if(['progress','identified'].includes(data.type))return;const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.type==='error'?p.reject(Error(data.text)):p.resolve(data);};
   worker.onerror=e=>{for(const p of pending.values())p.reject(Error(e.message));pending.clear();};
   qa[name]={call,worker};await call({type:'load'});
  }
 });
 const remote=[];
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();remote.push(url);return route.abort();});
 const sources=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json'));
 const manifests=['reviewed-32','holdout-16','fresh-11'];const rows={baseline:{},candidate:{}},trace=[],hints=[],frames=[];
 for(const cohort of manifests){
  const manifest=JSON.parse(fs.readFileSync('benchmark/manifest-'+cohort+'.json'));rows.baseline[cohort]=[];rows.candidate[cohort]=[];
  for(const item of manifest){
   const source=sources.find(r=>r.id===item.id),path='benchmark/fixtures/'+item.image,bytes=fs.readFileSync(path);
   assert.equal(sha(bytes),source.sha256);assert.ok(source.attribution?.license);
   const url='data:image/jpeg;base64,'+bytes.toString('base64');
   const dims=await page.evaluate(async url=>{const i=new Image();i.src=url;await i.decode();return {width:i.naturalWidth,height:i.naturalHeight};},url);
   trace.push({id:item.id,sha256:sha(bytes),...dims,sourceBytes:bytes.length,reencoded:false});
   for(const name of ['baseline','candidate']){
    const r=await page.evaluate(({name,url})=>qa[name].call({type:'classify',image:url}),{name,url});const c=r.choices?.[0];
    rows[name][cohort].push({id:item.id,prediction:{category:c?.category||null,type:c?.itemType||null},strong:!!r.strong,categoryConfirmed:!!r.categoryConfirmed,reason:r.reason||null});
    if(item.expectedCategory==='Uncategorized'){
     const result=await page.evaluate(({name,url})=>qa[name].call({type:'classify',image:url,hint:{categories:['Shoes'],types:[],confidence:.99,clipped:false}}),{name,url});
     hints.push({id:item.id,engine:name,strong:!!result.strong,categoryOnly:!!result.categoryOnly,prediction:result.choices?.[0]?.category||null,reason:result.reason||null});
    }
   }
   if(['commons-0003','commons-0014','commons-0064','commons-0078','commons-0036','commons-0059','commons-0095'].includes(item.id)){
    const r=await page.evaluate(url=>qa.candidate.call({type:'benchmark-frames',image:url,subtypeAudit:true}),url);
    frames.push({id:item.id,variants:r.variants});
   }
   assert.equal(sha(fs.readFileSync(path)),source.sha256);
  }
  for(const name of ['baseline','candidate'])fs.writeFileSync(join(output,name+'-'+cohort+'.json'),JSON.stringify(rows[name][cohort],null,2)+'\n');
 }
 assert.equal(trace.length,59,'All immutable sources required');
 assert.deepEqual(rows.candidate,rows.baseline,'Unhinted source-locked predictions must remain exactly unchanged');
 assert.deepEqual(remote,[],'All post-warm-up remote requests denied; no inference asset should be fetched');
 const report={baseApplicationSHA:base,sourceCount:trace.length,originalHashMatches:trace.length,sourceTrace:trace,
  fullStoredResolution:true,reencodedSources:0,remoteRequestsAfterWarmup:remote.length,
  hintComparisons:hints,frameDiagnostics:frames,
  inference:'actual pinned FashionCLIP; runtime/model downloaded before network-denied measurement',
  physicalMaskAccuracy:null,independentHumanMasks:0,customerPhotos:0};
 fs.writeFileSync(join(output,'source-integrity-and-hint-report.json'),JSON.stringify(report,null,2)+'\n');
 assert.equal(hints.filter(r=>r.engine==='candidate'&&r.strong).length,0,'Nonclothing fixtures must reject false mask hint');
 console.log(JSON.stringify({sources:trace.length,unhintedPredictionsUnchanged:true,hints,remoteRequestsAfterWarmup:remote.length}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
