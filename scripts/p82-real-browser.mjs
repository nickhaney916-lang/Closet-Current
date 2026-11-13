/** Actual browser WASM inference on public DEVELOPMENT originals. No independent human labels. */
import {chromium,webkit} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {server82} from './p82-browser-server.mjs';
const engineName=process.argv[2]||'chromium',requested=process.env.P82_IDS?.split(','),out=process.argv[3]||'benchmark/p82-'+engineName;
const index=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
// Read asynchronously without deriving any model truth from filenames.
const expected=(await Promise.all(['benchmark/manifest-reviewed-32.json','benchmark/manifest-holdout-16.json'].map(async p=>JSON.parse(await readFile(p,'utf8'))))).flat();
const rows=expected.filter(x=>!requested||requested.includes(x.id));
const {server,origin}=await server82();let browser;const results=[],network=[];
try{
 browser=await ({chromium,webkit}[engineName]).launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
 let page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(300000);
 page.on('request',r=>network.push({local:new URL(r.url()).origin===origin||r.url()==='about:blank',scheme:new URL(r.url()).protocol,origin:new URL(r.url()).origin,method:r.method()}));page.on('console',m=>{if(m.type()==='error')console.log('P82_BROWSER_CONSOLE',m.text().slice(0,160));});
 await page.goto(origin);
 for(const row of rows){
  if(process.env.P82_ISOLATED==='1'){await browser.close();browser=await ({chromium,webkit}[engineName]).launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(300000);page.on('request',r=>network.push({local:new URL(r.url()).origin===origin||r.url()==='about:blank',scheme:new URL(r.url()).protocol,origin:new URL(r.url()).origin,method:r.method()}));await page.goto(origin);}
  const receipt=index.find(x=>x.id===row.id),bytes=await readFile('benchmark/photos/'+row.image),sha=createHash('sha256').update(bytes).digest('hex');assert.equal(sha,receipt.sha256);assert.ok(receipt.verified&&row.verified&&receipt.image===row.image);assert.ok(['CC0','Public domain','CC BY 2.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0'].includes(receipt.attribution?.license));assert.ok(receipt.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
  const result=await page.evaluate(async({image,id})=>{
   const {evidence80}=await import('/subtype-review-80.mjs');const {bind82,VERSION82,codeHash82,browserRequest82,validateResponse82}=await import('/dual-core-82.mjs');
   const item={id,image,ownerId:'public-synthetic-owner'},evidence=await evidence80(item,{ownerId:item.ownerId,sessionId:crypto.randomUUID(),live:()=>true});
   const request={schema:VERSION82,requestId:crypto.randomUUID(),enabled:true,consent:true,detailVisible:true,evidence,binding:bind82(evidence),original:image,image,sourceCodeSha256:await codeHash82()};
   const output=await browserRequest82(request,{onProgress:s=>console.log('P82_STAGE',id,s)}),decision=validateResponse82(output,request);
   return {output,decision};
  },{id:row.id,image:'data:image/jpeg;base64,'+bytes.toString('base64')});
  assert.equal(result.output.automaticAdmissions,0);assert.equal(createHash('sha256').update(await readFile('benchmark/photos/'+row.image)).digest('hex'),sha);
  const receiptRow={id:row.id,sourceSha256:sha,historicalExpectation:{category:row.expectedCategory,itemType:row.expectedType},...result};results.push(receiptRow);console.log('P82_REAL_BROWSER_ROW',engineName,row.id,result.decision.status,result.decision.hypotheses[0]?.itemType,Math.round(result.output.totalMs));
 }
 if(!network.every(x=>x.local&&x.method==='GET'))console.error('P82_UNEXPECTED_REQUEST_METADATA',JSON.stringify(network.filter(x=>!x.local||x.method!=='GET')));
 assert.ok(network.every(x=>x.local&&x.method==='GET'));
 const summary={engine:engineName,physicalDevices:0,independentlyHumanReviewedPhotos:0,blindAccuracy:null,status:'PUBLIC_DEVELOPMENT_ONLY',photos:results.length,
 rawTop1:Object.fromEntries(['fashionclip','fashionSiglip'].map(key=>[key,{categoryMatches:results.filter(r=>r.output.observations.find(o=>o.modelKey===key).ranking[0].category===r.historicalExpectation.category).length,exactSubtypeMatches:results.filter(r=>r.output.observations.find(o=>o.modelKey===key).ranking[0].itemType===r.historicalExpectation.itemType).length}])),
 fusedExactSubtypeMatches:results.filter(r=>r.decision.hypotheses[0]?.itemType===r.historicalExpectation.itemType).length,abstentions:results.filter(r=>r.decision.status==='abstain').length,baselineStrong:results.filter(r=>r.output.baseline.strong).length,automaticAdmissions:0,isolation:process.env.P82_ISOLATED==='1'?'fresh-browser-per-photo-NOT-continuous-session':'one-browser-continuous-'+results.length+'-one-shot-workers',peakMemoryBytes:null,sameOriginBlobRequests:network.filter(x=>x.scheme==='blob:'&&x.local).length,nonGetOrExternalRequests:network.filter(x=>!x.local||x.method!=='GET').length};
 await mkdir(out,{recursive:true});await writeFile(out+'/results.json',JSON.stringify({summary,rows:results},null,2)+'\n');console.log('P82_BROWSER_SUMMARY',JSON.stringify(summary));
}finally{await browser?.close();server.close();}
