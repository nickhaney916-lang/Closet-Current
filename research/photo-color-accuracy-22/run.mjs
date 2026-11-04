import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {score} from './score.mjs';

const base='876b680272b6e2c40be24410a14b92802bdf991b';
const registry=JSON.parse(await readFile(new URL('./sources.json',import.meta.url)));
if(process.env.COLOR22_SPLIT==='development')registry.photos=registry.photos.filter(row=>row.split==='development');
const out=process.env.COLOR22_OUTPUT || 'benchmark/color-accuracy-22';
const engines={chromium,webkit};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const photos=new Map();
await mkdir(out,{recursive:true});
const exclusions=[];
for(const row of registry.photos){
 try{
  let bytes;
  if(row.fixture) bytes=await readFile(row.fixture);
  else if(process.env.COLOR22_ORIGINALS) bytes=await readFile(process.env.COLOR22_ORIGINALS+'/'+row.id+'.jpg');
  else {
   for(let attempt=0;attempt<5;attempt++){
    await delay(attempt?Math.min(60000,5000*2**attempt):1500);
    try{
     const response=await fetch(row.url,{headers:{'user-agent':'ClosetCurrentColorResearch/1.0 (https://github.com/nickhaney916-lang/Closet-Current)'},signal:AbortSignal.timeout(40000)});
     if(response.ok){bytes=Buffer.from(await response.arrayBuffer());break;}
     await response.body?.cancel();
     if(response.status!==429&&response.status<500)throw Error('HTTP '+response.status);
     if(attempt===4)throw Error('HTTP '+response.status);
    }catch(error){if(attempt===4||/^HTTP 4(?!29)/.test(error.message))throw error;}
   }
  }
  assert.equal(hash(bytes),row.sha256,'JPEG hash mismatch');
  assert.equal(bytes.length,row.bytes,'JPEG byte length mismatch');
  const meta=await sharp(bytes).metadata();
  assert.deepEqual([meta.format,meta.width,meta.height],['jpeg',row.width,row.height]);
  photos.set(row.id,bytes);
 }catch(error){exclusions.push({id:row.id,reason:error.message});}
}
await writeFile(out+'/sources.json',JSON.stringify({verified:[...photos.keys()],exclusions},null,2));
console.log('Verified locked originals:',photos.size,'/',registry.photos.length);
assert.ok(photos.size,'No verified source bytes');
const load=path=>readFile(path,'utf8');
const current={color:await load('public/photo-color.js'),check:await load('public/photo-check.js')};
const baseline={color:execFileSync('git',['show',base+':public/photo-color.js'],{encoding:'utf8'}),
 check:execFileSync('git',['show',base+':public/photo-check.js'],{encoding:'utf8'})};
const details=await load('public/clothing-details.js');
const html=await readFile(new URL('./review.html',import.meta.url));
const server=createServer((req,res)=>{
 const path=req.url;
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 const image=path.startsWith('/photo/')&&photos.get(path.slice(7));
 if(image){res.writeHead(200,{'Content-Type':'image/jpeg'}).end(image);return;}
 if(path==='/'){res.writeHead(200,{'Content-Type':'text/html'}).end(html);return;}
 const scripts={'/baseline-color.js':baseline.color,'/baseline-check.js':baseline.check,
  '/updated-color.js':current.color,'/updated-check.js':current.check,'/details.js':details};
 if(Object.hasOwn(scripts,path)){res.writeHead(200,{'Content-Type':'text/javascript'}).end(scripts[path]);return;}
 res.writeHead(404).end();
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const evidence={baselineSha:base,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),screenshots:[],engines:{},externalAttempts:[],errors:[]};
try{
 for(const engine of (process.env.COLOR22_ENGINES||'chromium,webkit').split(',')){
  const browser=await engines[engine].launch();
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    if(route.request().url().startsWith(origin+'/'))return route.continue();
    evidence.externalAttempts.push({engine,method:route.request().method()});
    return route.abort();
   });
   const page=await context.newPage();
   page.on('pageerror',error=>evidence.errors.push({engine,reason:error.message}));
   await page.goto(origin);
   await page.evaluate(()=>{
    window.baselineColor=window.PhotoColor;
    window.baselineCheck=window.checkPhoto;
    // The historical check resolves PhotoColor dynamically. The page wrapper
    // selects the matching implementation before invoking either version.
   });
   await page.addScriptTag({url:origin+'/updated-color.js'});
   await page.addScriptTag({url:origin+'/updated-check.js'});
   await page.evaluate(()=>{window.updatedColor=window.PhotoColor;window.updatedCheck=window.checkPhoto;});
   const rows=[];
   for(const row of registry.photos.filter(x=>photos.has(x.id))){
    const result=await page.evaluate(async row=>{
     const url='/photo/'+row.id;
     const bytes=await (await fetch(url)).arrayBuffer();
     const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
     const image=URL.createObjectURL(new Blob([bytes],{type:'image/jpeg'}));
     const results={};
     try{
      for(const key of ['baseline','updated']){
       window.PhotoColor=window[key+'Color'];
       try{
        const estimate=(await window[key+'Check'](image)).colorEstimate;
        const saved=ClothingDetails.fillColor({category:row.category},estimate);
        results[key]={estimate,accepted:saved.color??null};
       }catch(error){
        results[key]={estimate:null,accepted:null,processingError:error.name+': '+error.message};
       }
      }
      return {id:row.id,digest,...results};
     }finally{URL.revokeObjectURL(image);}
    },row);
    assert.equal(result.digest,row.sha256,'Browser-decoded source SHA');
    rows.push(result);
    if(result.baseline.processingError||result.updated.processingError)console.log(engine,row.id,result.baseline.processingError,result.updated.processingError);
   }
   for(const [index,width] of [320,390,430].entries()){
    await page.setViewportSize({width,height:844});
    const ids=registry.screenshots[index];
    const row=registry.photos.find(x=>x.id===ids);
    const result=rows.find(x=>x.id===ids);
    if(!result||!row?.color)continue;
    await page.evaluate(({row,result})=>window.showReview(row,result),{row,result});
    await page.locator('#color').selectOption(row.color);
    await page.getByRole('button',{name:'Save confirmed color locally'}).click();
    const state=await page.evaluate(()=>window.verifyReview());
    assert.deepEqual(state,{manual:row.color,cleared:'',sourceStillVisible:true});
    const filename=engine+'-'+width+'-'+ids+'.png';
    const bytes=await page.screenshot({path:out+'/'+filename,fullPage:true});
    assert.equal((await sharp(bytes).metadata()).width,width);
    evidence.screenshots.push({engine,width,id:ids,filename,sha256:hash(bytes),state});
   }
   evidence.engines[engine]=rows;
  }finally{await browser.close();}
 }
}finally{await new Promise(done=>server.close(done));}
evidence.measurements=score(registry.photos,evidence.engines);
await writeFile(out+'/report.json',JSON.stringify(evidence,null,2));
assert.deepEqual(evidence.errors,[]);
assert.deepEqual(evidence.externalAttempts,[]);
assert.equal(photos.size,registry.photos.length,'Frozen cohort incomplete: see sources.json');
if(!process.env.COLOR22_SPLIT)assert.equal(evidence.screenshots.length,Object.keys(evidence.engines).length*3);
console.log(JSON.stringify(evidence.measurements.summary));
