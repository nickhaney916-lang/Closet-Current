/** Desktop browsers; synthetic ranks only. No physical phone claims. */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('public');
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+'/'))throw Error();res.setHeader('Content-Type','text/javascript');res.end(await readFile(path));}catch{res.end('<!doctype html><title>P81</title>');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:780}});await page.goto('http://127.0.0.1:'+server.address().port);
  const r=await page.evaluate(async()=>{
   const {observation81,arbitrate81,arbitrateInstances81}=await import('/model-arbitration-81.mjs');
   const {localCandidates}=await import('/local-catalog.mjs');
   const hash='a'.repeat(64),binding={sourceSha256:hash,inputSha256:hash,ownerSession:'synthetic',photoRevision:'1',cropRevision:'whole',maskRevision:'none',unitRevision:'none',instanceId:'whole'};
   const obs=(modelKey,type)=>observation81({modelKey,binding,scores:localCandidates.map((x,i)=>({label:x.label,score:x.itemType===type?1:0.1-i/1000})),workerSourceSha256:hash,vectorSha256:hash,latencyMs:1});
   const conflicts=[['Sneakers','Ankle boots'],['Shorts','Skirt'],['Casual dress','Tunic'],['Blouse','Tunic'],['T-shirt','Sweatshirt'],['Jacket','Coat']];
   const decisions=conflicts.map(([a,b])=>arbitrate81({binding,observations:[obs('fashionclip',a),obs('fashionSiglip',b)]}));
   let staleBlocked=false;try{arbitrate81({binding:{...binding,ownerSession:'changed'},observations:[obs('fashionclip','Sneakers')]});}catch{staleBlocked=true;}
   const agreement=arbitrate81({binding,observations:[obs('fashionclip','Sneakers'),obs('fashionSiglip','Sneakers')]});
   return {abstentions:decisions.filter(x=>x.status==='abstain').length,noAdmission:decisions.every(x=>!x.admissionAllowed&&x.itemType==='Unknown'),staleBlocked,agreement:agreement.status,requiresOwnerConfirmation:agreement.requiresOwnerConfirmation,empty:arbitrateInstances81([]).length};
  });
  assert.deepEqual(r,{abstentions:6,noAdmission:true,staleBlocked:true,agreement:'cross_family_hypothesis',requiresOwnerConfirmation:true,empty:0});console.log('P81_DESKTOP_SYNTHETIC_PASS',name,width);await page.close();
 }}finally{await browser.close();}
}}finally{server.close();}
