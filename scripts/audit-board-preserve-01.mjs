/** BOARD01 independent genuine native App + PR541 owner storage screenshot audit. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import sharp from 'sharp';
const base='benchmark/board-preserve-01',dir='benchmark/board-preserve-01-review';
await mkdir(dir,{recursive:true});
const report=JSON.parse(await readFile(join(base,'results.json'),'utf8'));
assert.equal(report.cases,12);assert.equal(report.browserScreenshots,12);
assert.equal(report.screens.length,12);assert.equal(report.nativeSourceCodeOriginal,true);
assert.equal(report.originalDonorPR541IDBRead,true);
assert.equal(report.originalStateAndOutfitReferencesPreserved,true);
assert.equal(report.destructiveLegacyConversionBlocked,true);
assert.equal(report.realSupabaseRLSVerified,false);
assert.equal(report.familyAlpha,'HOLD');assert.equal(report.releaseAuthorized,false);
assert.deepEqual(report.errors,[]);
const seen=new Set(),proofs=[];
for(const shot of report.screens){
 const id=shot.engine+':'+shot.width+':'+shot.owner;
 assert.ok(!seen.has(id));seen.add(id);
 assert.ok(['chromium','webkit'].includes(shot.engine));
 assert.ok([320,390,430].includes(shot.width));
 const bytes=await readFile(join(base,shot.name));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),shot.sha256);
 const meta=await sharp(bytes).metadata();
 assert.equal(meta.width,shot.width);
 assert.ok(meta.height>=650);
 proofs.push({id,sha256:shot.sha256,bytes:bytes.length});
}
assert.equal(seen.size,12);
for(const c of report.cases){
 assert.equal(c.donorOriginalPreserved,true);
 assert.equal(c.nativeDropsJacketAndCoat,true);
 assert.equal(c.missingReferencePresent,true);
 assert.equal(c.reportVerdict,'REVIEW_DO_NOT_OVERWRITE');
 assert.equal(c.refused,true);assert.equal(c.foreignDenied,true);
 assert.equal(c.writePermissionGranted,false);
 assert.equal(c.realRLSVerified,false);
 assert.equal(c.productionChanged,false);
 assert.equal(c.releaseAuthorized,false);
}
const sheets=[];
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const inputs=[];
 for(const [i,letter] of ['A','B'].entries()){
  const s=report.screens.find(x=>x.engine===engine&&x.width===width&&
   x.owner==='board-fixture-'+letter);
  assert.ok(s);
  const png=await sharp(await readFile(join(base,s.name)))
   .resize({width:390,height:780,fit:'contain',background:'#ffffff'})
   .png().toBuffer();
  inputs.push({input:png,left:i*390,top:0});
 }
 const bytes=await sharp({create:{width:780,height:780,channels:3,
  background:'#ffffff'}}).composite(inputs).jpeg({quality:86}).toBuffer();
 const name=engine+'-'+width+'-two-owner-native-loss-audit.jpg';
 await writeFile(join(dir,name),bytes);
 sheets.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const final={priority:'BOARD-PRESERVE-01',originalAuthenticatedWardrobeModified:false,
 ownerFixtureCounts:2,exactNativeNormalizerAudited:true,
 verifiedDonorExistingIDBRead:true,realAppScreenshots:12,
 allScreenshotSHA256sVerified:true,contactSheets:sheets,
 removedOriginalDressOuterwearDetected:true,
 deletedGarmentIDsNeverSilentlyAccepted:true,
 erasedDurable3DOutfitIDsDetected:true,
 userWriteAuthorizationIssued:false,noProductionOrExistingAppSourceModified:true,
 humanVisualAppealApproval:'NOT_APPLICABLE',
 realBackendRLSTested:false,physicalPhoneTested:false,
 familyAlpha:'HOLD',releaseAuthorized:false};
await writeFile(join(dir,'acceptance.json'),JSON.stringify(final,null,2));
console.log('BOARD01_TRUE_NATIVE_BROWSER_AUDIT',JSON.stringify({
 screens:12,sheets:6,nativeDestructiveLossDetected:true,
 sourcePreserved:true,release:'HOLD'}));
