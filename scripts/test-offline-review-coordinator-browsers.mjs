// Browser-only, explicitly synthetic QA. Never supply these fixtures as human observations.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,webkit} from 'playwright';
import {packetFromLock,blankSubmission,reconcile,LOCK} from './source-holdout-human-review.mjs';
const [folder,out]=process.argv.slice(2);assert.ok(folder&&out,'Expected COORDINATOR_DIRECTORY OUTPUT.json');
const packet=packetFromLock(fs.readFileSync(LOCK));
function fake(alias){
 const s=blankSubmission(packet);
 s.status='REVIEWED';s.reviewerAlias=alias;s.reviewedAt='2026-10-21T00:00:00.000Z';
 for(const k of Object.keys(s.attestations))s.attestations[k]=true;
 for(const p of s.photos)Object.assign(p,{observedFamily:'shirt',uncertain:false,evidence:'Synthetic browser fixture: visible sleeve and collar.'});
 return s;
}
const a=fake('Synthetic fixture alpha'),b=fake('Synthetic fixture beta');
b.photos[1].observedFamily='boots';b.photos[2].uncertain=true;
const expected=reconcile(packet,[a,b]),results=[];
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],blocked=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{if(/^(file:|blob:|data:)/.test(route.request().url()))return route.continue();blocked.push(route.request().url());return route.abort();});
  await page.goto(pathToFileURL(path.resolve(folder,'OPEN-COORDINATOR.html')).href);
  const load=async(id,submission)=>page.locator('#'+id).setInputFiles({name:'family-observations.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(submission))});
  await page.locator('#verify').click();
  assert.match(await page.locator('#status').innerText(),/Not accepted/);
  assert.equal(await page.locator('#export').isDisabled(),true);
  await load('first',a);await page.locator('#verify').click();
  assert.equal(await page.locator('#results').isHidden(),true,'One reviewer cannot complete validation');
  await load('second',b);await page.locator('#verify').click();
  assert.equal(await page.locator('#export').isDisabled(),false);
  assert.equal(await page.locator('#rows tr').count(),13);
  const dlEvent=page.waitForEvent('download');await page.locator('#export').click();
  const downloaded=await dlEvent;assert.equal(downloaded.suggestedFilename(),'self-attested-review-audit.json');
  const report=JSON.parse(fs.readFileSync(await downloaded.path(),'utf8'));
  for(const field of ['status','packetSha256','sourcePhotos','selfAttestedAgreements','unresolved','photos','submissionSha256','productionPromotion','independentHumanGoldLabels','approvedModelAccuracy','reviewerIdentityAuthenticated'])
   assert.deepEqual(report[field],expected[field],'Browser/Node core parity: '+field);
  assert.equal(report.selfAttestedAgreements,11);
  assert.equal(report.productionPromotion,'BLOCKED');
  assert.equal(report.approvedModelAccuracy,null);
  assert.equal(report.reviewerIdentityAuthenticated,false);
  assert.equal(await page.locator('#rows tr').count(),13);
  const invalid=[
   {...b,status:'DRAFT_UNREVIEWED'},
   {...b,packetSha256:'0'.repeat(64)},
   {...b,reviewerAlias:'Ｓｙｎｔｈｅｔｉｃ fixture alpha'},
   {...b,attestations:{...b.attestations,noModelPredictionsSeen:false}},
   {...b,photos:b.photos.slice(1)},
   {...b,photos:[b.photos[0],...b.photos.slice(1).map(x=>({...x})),b.photos[0]]},
   {...b,photos:b.photos.map((x,i)=>i===3?{...x,observedFamily:'Blazer'}:x)},
   {...b,modelPrediction:'secret'},
  ];
  for(const x of invalid){
   await load('second',x);await page.locator('#verify').click();
   assert.match(await page.locator('#status').innerText(),/Not accepted/);
   assert.equal(await page.locator('#export').isDisabled(),true);
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.equal(await page.locator('#rows tr').count(),0,'Failed audit cannot expose prior pair');
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(blocked,[]);
  results.push({browser:engineName,photos:report.photos.length,syntheticFixtureOnly:true,
    frozenPacketVerified:true,nodeReconcileParity:true,tamperedSubmissionsRejected:invalid.length,
    zeroHumanObservations:true,accuracy:null,modelPromotion:'BLOCKED'});
  console.log(engineName+': two synthetic completed reviews reconciled against authoritative Node parity; '+invalid.length+' tamper cases blocked; zero actual human evidence.');
 }finally{await browser.close();}
}
fs.writeFileSync(out,JSON.stringify({softwareQA:'PASS',originals:13,realHumanReviews:0,
 independentHumanAccuracy:null,productionPromotion:'BLOCKED',engines:results},null,2)+'\n');
