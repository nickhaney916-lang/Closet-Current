import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/native-consumer-board-04',data=JSON.parse(await readFile(dir+'/results.json'));
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.equal(data.priority,'NATIVE-CONSUMER-BOARD-04');
assert.equal(data.cases,6);assert.equal(data.evidence.length,6);
assert.equal(data.screenshots,30);assert.equal(data.screens.length,30);
assert.deepEqual(data.engines,['chromium','webkit']);
assert.deepEqual(data.widths,[320,390,430]);
assert.equal(data.realNativeUI,true);assert.equal(data.syntheticAuthHTTPOnly,true);
assert.equal(data.realOwnerIndexedDB,true);assert.equal(data.realCloudJWTs,false);
assert.equal(data.originalPhotosUnchanged,true);assert.equal(data.originalCleanerUnchanged,true);
assert.equal(data.releaseAuthorized,false);assert.equal(data.familyAlpha,'HOLD');
assert.deepEqual(data.errors,[]);
assert.deepEqual(data.blocked.filter(x=>x.method!=='GET'),[]);
const stages=['01-original-consumer-outfit-builder','02-unsaved-native-shoe-swap',
 '03-saved-all-original-dress-coat-shoes','04-owner-B-native-saved-dress-and-coat',
 '05-missing-original-reference-kept'];
const seen=new Set();
for(const file of data.screens){
 assert.ok(['chromium','webkit'].includes(file.engine));
 assert.ok([320,390,430].includes(file.width));
 assert.ok(stages.includes(file.stage));
 assert.equal(file.owner,stages.indexOf(file.stage)<3?'A':'B');
 const id=file.engine+'-'+file.width+'-'+file.owner+'-'+file.stage;
 assert.ok(!seen.has(id));seen.add(id);
 const bytes=await readFile(dir+'/'+file.name);
 assert.equal(hash(bytes),file.sha256,'Real native screenshot SHA mismatch');
 const meta=await sharp(bytes).metadata(),stat=await sharp(bytes).stats();
 assert.equal(meta.width,file.width);assert.ok(meta.height>=790);
 assert.ok(bytes.length>4000&&stat.channels.some(x=>x.stdev>6));
}
for(const result of data.evidence){
 for(const key of ['actualNativeOutfitBuilder','actualNativeAuthSource',
  'onlyAuthHTTPMocked','actualPrivateIndexedDB','originalJPEGSourceSHA',
  'sourceTrueDressWithTwoOuterwear','savedAnd3DIDsPreserved',
  'explicitCASWrite','readRenderCancelNoWrite',
  'cloudRestorePausedDuringEdit','cloudRevisionConflictDetected',
  'backupImportBlockedBeforeMutation','accountAtoBIsolation','missingItemIDPreserved'])
  assert.equal(result[key],true,result.engine+' '+result.width+' '+key);
 assert.equal(result.realLiveSupabaseRLS,false);
 assert.equal(result.physicalPhones,false);
 assert.equal(result.releaseAuthorized,false);
}
const target=dir+'-audit';
await mkdir(target,{recursive:true});
const sheets=[];
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const image=[];
 for(const [i,stage]of stages.entries()){
  const info=data.screens.find(x=>x.engine===engine&&x.width===width&&x.stage===stage);
  assert.ok(info);
  image.push({input:await sharp(await readFile(dir+'/'+info.name))
   .resize({width:390,height:800,fit:'contain',background:'#fff'}).png().toBuffer(),
   left:i*390,top:0});
 }
 const b=await sharp({create:{width:1950,height:800,channels:4,background:'#fff'}})
  .composite(image).jpeg({quality:86}).toBuffer();
 const name=engine+'-'+width+'-native-consumer-A-edit-to-B.jpg';
 await writeFile(target+'/'+name,b);sheets.push({name,sha256:hash(b)});
}
const receipt={priority:'NATIVE-CONSUMER-BOARD-04',status:'PASS_NATIVE_BROWSER_RESEARCH_ONLY',
 realNativeScreensVerified:30,comparisonGalleries:6,sourceTrueJPEGsVerified:true,
 privateOwnerOutfitsPreserved:true,liveSignedAccounts:false,
 crossDeviceCloudRestoreVerified:false,physicalPhoneVerified:false,
 nativeDefaultModeUnchanged:true,releaseAuthorized:false,familyAlpha:'HOLD',sheets};
await writeFile(target+'/acceptance.json',JSON.stringify(receipt,null,2)+'\n');
console.log('BOARD04_AUDIT',JSON.stringify({screens:30,reviewSheets:6,
 ownerPrivateNativeUI:true,liveRLS:'NOT TESTED',familyAlpha:'HOLD'}));
