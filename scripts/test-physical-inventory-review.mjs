// Synthetic ONLY regression for internal human-reviewed inventory packet builder.
// No fabricated reference file is committed to benchmark or treated as accuracy.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {evaluateCompletePhysicalInventory} from '../benchmark/physical-garment-inventory.mjs';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 const pageErrors=[],network=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 page.on('request',req=>{if(/^https?:/.test(req.url()))network.push(req.url());});
 await page.goto('file://'+resolve('benchmark/assemble-physical-inventory.html'));
 const base64=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=40;c.height=30;
  const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,40,30);
  x.fillStyle='#d44';x.fillRect(7,4,26,22);
  return c.toDataURL('image/jpeg',.95).split(',')[1];
 });
 const original=Buffer.from(base64,'base64');
 const sha=createHash('sha256').update(original).digest('hex');
 const source={name:'validation-0031.jpg',mimeType:'image/jpeg',buffer:original};
 const encode=(rect)=>{
  const bits=new Uint8Array(40*30);for(let y=rect[1];y<rect[3];y++)
   for(let x=rect[0];x<rect[2];x++)bits[y*40+x]=1;
  let current=0,run=0;const runs=[];
  for(const bit of bits){if(bit!==current){runs.push(run);run=0;current=bit;}run++;}
  runs.push(run);return runs;
 };
 const piece=(num,cat,label,rect)=>({
  schemaVersion:1,image:source.name,sourceSha256:sha,reviewStatus:'approved',
  width:40,height:30,runs:encode(rect),reviewer:'First Human',
  approvedBy:'Second Human',seedModel:null,
  physicalTargetId:'validation-0031-item-'+String(num).padStart(2,'0'),
  humanCategory:cat,humanTargetLabel:label,
  targetIndependentlyIdentifiedBy:'First Human'
 });
 const garmentA=piece(1,'Outerwear','grey blazer',[4,4,19,16]);
 const garmentB=piece(2,'Bottoms','black skirt',[20,12,35,25]);
 const provide=async(items)=>page.locator('#masks').setInputFiles(items.map((x,i)=>({
  name:x.physicalTargetId+'.mask.approved.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(x))
 })));
 assert.equal(await page.locator('#export').isDisabled(),true);
 await page.locator('#photo').setInputFiles({...source,name:'validation-0031.original.jpg'});
 await page.locator('#status').getByText(/canonical source JPEG/).waitFor();
 assert.equal(await page.locator('#export').isDisabled(),true);
 await page.locator('#photo').setInputFiles(source);
 await page.locator('#status').getByText(/No approved outlines/).waitFor();
 await provide([{...garmentA,seedModel:'AI'}]);
 await page.locator('#status').getByText(/Rejected approved outlines/).waitFor();
 await provide([{...garmentA,approvedBy:'First Human'}]);
 await page.locator('#status').getByText(/Rejected approved outlines/).waitFor();
 await provide([{...garmentA,sourceSha256:'f'.repeat(64)}]);
 await page.locator('#status').getByText(/Rejected approved outlines/).waitFor();
 await provide([garmentA,{...garmentB,reviewer:'Different first human'}]);
 await page.locator('#status').getByText(/same two named reviewers/).waitFor();
 await provide([garmentA,garmentB]);
 await page.locator('#status').getByText(/Independent garment count/).waitFor();
 assert.equal(await page.locator('#outlines li').count(),2);
 await page.locator('#outlineSelect').selectOption('validation-0031-item-02');
 assert.equal(await page.locator('#overlay').isVisible(),true);
 await page.locator('#count').fill('1');
 await page.locator('#firstCheck').check();
 await page.locator('#secondCheck').check();
 assert.equal(await page.locator('#export').isDisabled(),true,'Wrong garment count cannot assert completeness');
 await page.locator('#count').fill('2');
 assert.equal(await page.locator('#export').isDisabled(),false);
 const fileDownload=page.waitForEvent('download');
 await page.locator('#export').click();
 const file=await fileDownload;
 assert.equal(file.suggestedFilename(),'validation-0031.inventory.json');
 const inventory=JSON.parse(await readFile(await file.path(),'utf8'));
 assert.equal(inventory.status,'human-inventory-complete');
 assert.equal(inventory.sourceSha256,sha);
 assert.equal(inventory.targets.length,2);
 assert.equal(inventory.reviewedBy,'First Human');
 assert.equal(inventory.approvedBy,'Second Human');
 assert.equal(inventory.targets.find(x=>x.label==='black skirt').category,'Bottoms');
 // This result uses fabricated fixture geometries: verifies plumbing only.
 const score=evaluateCompletePhysicalInventory({
  id:'validation-0031',image:source.name,sourceSha256:sha
 },inventory,new Map([[garmentA.physicalTargetId,garmentA],[garmentB.physicalTargetId,garmentB]]),new Map());
 assert.equal(score.missedPhysicalGarments,2);
 assert.equal(score.detectionRecall,0);
 assert.equal(score.canPromoteModel,false);
 await page.locator('#photo').setInputFiles({...source,name:'commons-0035.jpg'});
 await page.locator('#status').getByText(/No approved outlines/).waitFor();
 assert.equal(await page.locator('#export').isDisabled(),true);
 assert.equal(await page.locator('#count').inputValue(),'');
 assert.deepEqual(pageErrors,[]);
 assert.deepEqual(network,[]);
 console.log('OFFLINE_PHYSICAL_INVENTORY '+JSON.stringify({
  test:'synthetic-only',sourceHashBound:true,distinctReviewersRequired:true,
  humanCompletenessRequired:true,allVisibleGarmentCountMatched:true,
  offlineOnly:true,benchmarkRealPhotoAccuracyMeasured:false,pageErrors:0
 }));
}finally{await browser.close();}
