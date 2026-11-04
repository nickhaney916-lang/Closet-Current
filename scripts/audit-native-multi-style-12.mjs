import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='benchmark/multi-garment-capture-01';
const result=JSON.parse(await readFile(root+'/acceptance.json','utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
assert.equal(result.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(result.source.bytes,104520);
assert.equal(result.cases.length,6);
assert.deepEqual(result.errors,[]);
assert.deepEqual(result.unexpectedUploads,[]);
const six=new Set();
for(const item of result.cases){
 assert.ok(['chromium','webkit'].includes(item.engine));
 assert.ok([320,390,430].includes(item.width));
 assert.equal(item.pieces,3);assert.equal(item.stylePinnedAndSaved,true);
 assert.equal(item.styleLooks,1,'only one real three-piece look available, not three fabricated');
 for(const key of ['outfitSaved','v4Backup','v4Restore','reimportDuplicateBlocked','ownerPrivate'])
  assert.equal(item[key],true,key+' failed '+item.engine+' '+item.width);
 six.add(item.engine+'-'+item.width);
}
assert.equal(six.size,6);
assert.equal(result.screenshots.length,60,'Ten actual PNG screenshot stages per mobile browser case');
const seen=new Set(),groups=new Map();
for(const item of result.screenshots){
 const bytes=await readFile(root+'/'+item.file);
 assert.equal(digest(bytes),item.sha256);
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.format,'png');assert.equal(meta.width,item.width);
 assert.ok(meta.height>=920&&bytes.length>4000);
 assert.ok(stats.channels.some(x=>x.stdev>6));
 assert.ok(!seen.has(item.file));seen.add(item.file);
 const key=item.engine+'-'+item.width;
 groups.set(key,(groups.get(key)||0)+1);
}
for(const key of six)assert.equal(groups.get(key),10,key+' incomplete screenshot evidence');
const evidence={priority:'NATIVE-MULTI-STYLE-INTEGRATION-12',
 sourceSHA256:result.source.sha256,licensedTruePhotograph:true,
 realBrowserCases:6,chromiumAndWebKitWidths:[320,390,430],
 verifiedMobileScreenshots:60,threeHumanReviewedPieces:true,
 automaticModelPrecisionRecallVerified:false,sourceRewritten:false,
 ownerPrivateIDB:true,originalPhotoSHA256Preserved:true,
 nativeStyleOwnedLooks:1,threeFabricatedLooks:false,photoOnly3D:true,
 explicitNativeSavedOutfitAndV4Recovery:true,duplicateImportAtomicRefusal:true,
 realSignedRLS:false,physicalPhoneVerified:false,familyAlpha:'HOLD',
 productionDeployed:false,releaseAuthorized:false};
await writeFile(root+'/integration-12-acceptance.json',JSON.stringify(evidence,null,2));
console.log('INTEGRATION12 AUDIT PASS '+JSON.stringify(evidence));
