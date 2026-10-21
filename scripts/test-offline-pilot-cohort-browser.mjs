// Browser-only, synthetic and OFFLINE. No real phone/user photos involved.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import device from '../public/device-check-engine.js';
import saved from '../public/saved-closet-audit-engine.js';
import {lockPhotoLabels,phonePhotoResult,scorePhonePhotos,photoTypes} from '../public/phone-photo-benchmark.mjs';
import {reviewPrivatePilotCohort} from '../benchmark/private-pilot-cohort-consistency.mjs';
import {writeOfflinePilotCohort} from './offline-pilot-cohort-organizer.mjs';

const build='abcdef123456';
const steps=Object.fromEntries(device.deviceCheckSteps.map(([id])=>[id,'pass']));
const android=device.deviceCheckReport({steps,events:[]},build,'Android'),
 iphone=device.deviceCheckReport({steps,events:[]},build,'iPhone/iPad');
const labels=lockPhotoLabels([
 {category:'Tops',type:photoTypes('Tops')[0],color:'Blue'}
]);
const model=scorePhonePhotos(labels,[phonePhotoResult('photo-001',{
 strong:true,choices:[{category:'Tops',itemType:labels[0].expectedType}],
 details:{color:'Blue'}},10)],{release:build,indexHash:'b'.repeat(64)});
const top={category:'Tops',type:'T-shirt',color:'Blue'},shoe={category:'Shoes',type:'Shoes',color:'White'};
const savedReport=(platform,label)=>saved.makeReport([{
 id:'item-001',source:'camera',expected:label,proposed:label,
 disposition:'saved-auto',saved:label,quality:'clear',backup:'restored'
}],build,platform);
const s1=savedReport('Android',top),s2=savedReport('iPhone/iPad',shoe);
const expected=reviewPrivatePilotCohort(android,iphone,[model],[s1,s2]);
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'cc-pilot-3family-'));
writeOfflinePilotCohort(path.join(folder,'private'));
const file=path.join(folder,'private','OPEN-PRIVATE-PILOT-REVIEW.html');
const results=[];
try{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',route=>{
    if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();
    external.push(route.request().url());return route.abort();
   });
   await page.goto(pathToFileURL(file).href);
   const upload=(id,records)=>{
    const arr=Array.isArray(records)?records:[records];
    return page.locator('#'+id).setInputFiles(arr.map((r,k)=>({
     name:id+'-'+k+'.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(r))
    })));
   };
   await page.locator('#review').click();
   await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Reports were not accepted.'));
   assert.equal(await page.locator('#results').isHidden(),true);
   await upload('android',android);await upload('iphone',iphone);
   await upload('model',model);await upload('saved',[s1,s2]);
   await page.locator('#review').click();
   await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Private files validated')||
    document.querySelector('#status').textContent.startsWith('Reports were not accepted.'));
   assert.match(await page.locator('#status').innerText(),/Private files validated/);
   assert.match(await page.locator('#resultsSummary').innerText(),/Release BLOCKED/);
   await page.locator('#save').click();
   await page.waitForFunction(()=>document.querySelector('#download').href.startsWith('blob:'));
   const data=await page.evaluate(async()=>JSON.parse(await(await fetch(document.querySelector('#download').href)).text()));
   assert.deepEqual(data,expected,'Offline browser must have byte-equivalent aggregate to canonical Node source');
   assert.equal(data.originalPhotosLinkedAcrossReportFamilies,false);
   assert.equal(data.productionReleaseApproved,false);
   for(const tamper of [
    {...s2,appRelease:'eeeeeeeeeeee'},
    {...s2,userEmail:'private@example.test'},
    {...s2,rows:[{...s2.rows[0],photo:'data:image/jpeg;base64,SECRET'}]}
   ]){
    await upload('saved',[s1,tamper]);
    assert.equal(await page.locator('#download').isHidden(),true);
    await page.locator('#review').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Reports were not accepted.'));
    assert.equal(await page.locator('#results').isHidden(),true);
   }
   await upload('saved',[s1,s2]);
   await upload('model',[model,model]); // duplicate report replay must be rejected.
   await page.locator('#review').click();
   await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Reports were not accepted.'));
   assert.equal(await page.locator('#download').isHidden(),true);
   assert.deepEqual(external,[],'Any external request is a privacy regression');
   assert.deepEqual(errors,[],'Offline UI errors detected');
   await context.close();
   results.push({engine:name,offline:true,sourceParity:true,blockedTamperCases:4,
    noExternalRequests:true,realPhysicalPhonesVerified:false,productionReleaseApproved:false});
  }finally{await browser.close();}
 }
 console.log('PRIVATE_THREE_REPORT_OFFLINE_BROWSER '+JSON.stringify(results));
}finally{fs.rmSync(folder,{recursive:true,force:true});}
