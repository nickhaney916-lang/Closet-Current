import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist');
const server=createServer((req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Mask evidence QA</title>');return;}
 const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('path');
 res.writeHead(200,{'Content-Type':['.mjs','.js'].includes(extname(file))?'text/javascript':'application/octet-stream'});res.end(fs.readFileSync(file));
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
try{for(const [name,engine]of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),remote=[];
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():(remote.push(route.request().url()),route.abort()));
  await page.goto(origin);
  const r=await page.evaluate(async()=>{
   const {classifyIsolatedGarment}=await import('/recognition-engine.mjs');
   const photo={width:50,height:50},hint={categories:['Shoes'],types:[],confidence:.99,clipped:false};
   const bad=async()=>[{label:'a blank wall',score:.9},{label:'sneakers',score:.1}],good=async()=>[{label:'sneakers',score:.95},{label:'a blank wall',score:.05}];
   const rows=[];for(const [a,b]of [[bad,bad],[good,bad],[bad,good],[good,good]]){let identified=0;
    const result=await classifyIsolatedGarment(a,photo,{hint,confirmationModel:b,onIdentified:()=>identified++});
    rows.push({strong:result.strong,category:result.choices?.[0]?.category||null,identified});
   }return rows;
  });
  assert.deepEqual(r.map(r=>r.strong),[false,false,false,true]);assert.deepEqual(r.map(r=>r.identified),[0,0,0,1]);assert.deepEqual(remote,[]);
  console.log(JSON.stringify({browser:name,syntheticMaskContracts:4,results:r,remoteRequests:0,physicalMaskTruth:false}));
 }finally{await browser.close();}
}}finally{await new Promise(r=>server.close(r));}
