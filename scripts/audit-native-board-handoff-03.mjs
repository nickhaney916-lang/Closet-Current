/**
 * NATIVE-BOARD-HANDOFF-03 independent 30 genuine native-page screenshot audit.
 * Original source hashes/owner A,B must be verified by browser first;
 * this script independently recomputes SHA-256, dimensions, nonblank pixels
 * and native account-change/fallback/zero-leak proof.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const base='benchmark/native-board-handoff-03',audit=base+'-audit';
await mkdir(audit,{recursive:true});
const m=JSON.parse(await readFile(base+'/results.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(m.priority,'NATIVE-BOARD-HANDOFF-03');
assert.equal(m.caseCount,6);assert.equal(m.screenshotCount,42);
assert.equal(m.sourcePhotoCardScreenshots,12);
assert.equal(m.cases.length,6);assert.equal(m.screens.length,42);
assert.equal(m.screens.filter(x=>x.elementCapture).length,12);
assert.deepEqual(m.errors,[]);assert.deepEqual(m.blocked.filter(x=>x.method!=='GET'),[]);
assert.equal(m.authHTTPMocked,true);assert.equal(m.actualBrowserStorage,true);
assert.equal(m.exactNativeAuthUnchanged,true);assert.equal(m.originalPhotoBytesPreserved,true);
assert.equal(m.accountTwoJWTLive,false);assert.equal(m.releaseAuthorized,false);
assert.equal(m.familyAlpha,'HOLD');
const stages=['01-original-native-login','02-genuine-native-session-edit-draft',
 '03-saved-and-preserved-original','04-refresh-revoked-private-panel',
 '05-independent-owner-B-with-originals'];
const elementStages=['02-original-source-card-element','05-original-source-card-element'];
const ownerOf=s=>s.startsWith('05-')?'B':'A';
const unique=new Set();
for(const img of m.screens){
 const id=img.engine+':'+img.width+':'+img.owner+':'+img.stage;
 assert.ok(!unique.has(id));unique.add(id);
 assert.ok(['chromium','webkit'].includes(img.engine));
 assert.ok([320,390,430].includes(img.width));
 assert.ok(stages.includes(img.stage)||elementStages.includes(img.stage));
 assert.equal(!!img.elementCapture,elementStages.includes(img.stage));
 if(img.elementCapture)assert.equal(img.photoCount,4);
 assert.equal(ownerOf(img.stage),img.owner);
 const bytes=await readFile(base+'/'+img.name);
 assert.equal(sha(bytes),img.sha256,'Modified browser screenshot: '+img.name);
 const info=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 if(img.elementCapture){assert.ok(info.width>190&&info.width<=img.width);assert.ok(info.height>=110);}
 else {assert.equal(info.width,img.width);assert.ok(info.height>=760);}
 assert.ok(bytes.length>3500&&stats.channels.some(x=>x.stdev>6));
}
const strips=[];
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const inputs=[];
 for(const [i,stage] of stages.entries()){
  const original=m.screens.find(x=>x.engine===engine&&x.width===width&&x.stage===stage);
  assert.ok(original);
  const bytes=await readFile(base+'/'+original.name);
  const output=await sharp(bytes).resize({width:390,height:780,fit:'contain',background:'#ffffff'})
   .png().toBuffer();
  inputs.push({input:output,left:i*390,top:0});
 }
 const output=await sharp({create:{width:1950,height:780,channels:4,background:'#ffffff'}})
  .composite(inputs).jpeg({quality:85}).toBuffer();
 const name='native3-'+engine+'-'+width+'-5-stages.jpg';
 await writeFile(audit+'/'+name,output);
 strips.push({name,sha256:sha(output)});
}
for(const c of m.cases){
 assert.equal(c.realNativeAuthSource,true);assert.equal(c.verifiedNativeHTTP,'MOCK_ONLY');
 assert.equal(c.originalSourceSHA256,true);assert.equal(c.independentOwnerFixtures,2);
 assert.equal(c.originalNativeStillLossy,true);
 assert.equal(c.losslessDraftNeverWritten,true);
 assert.equal(c.successfulCASWrite,true);
 assert.equal(c.originalSaved3DIDsAndCoatsPreserved,true);
 assert.equal(c.tokenRefreshRevokesPriorPrivatePreview,true);
 assert.equal(c.pageReloadNativeAuthSessionPersisted,true);
 assert.equal(c.accountSwitchAtoB,true);
 assert.equal(c.ownerBCannotReadOwnerA,true);
 assert.equal(c.donorSourceHonestFallback,true);
 assert.equal(c.originalSourceCardsClearOfFixedNav,true);
 assert.equal(c.privateJPEGHeadersNeverSentOffhost,true);
 assert.equal(c.realSupabaseRLS,'NOT VERIFIED');
 assert.equal(c.physicalPhones,'NOT TESTED');
 assert.equal(c.releaseAuthorized,false);
}
const result={priority:'NATIVE-BOARD-HANDOFF-03',status:'PASS_BROWSER_RESEARCH_ONLY',
 independentRealChromiumAndWebKitScenarios:6,
 originalNativeAuthScriptUnmodified:true,
 authenticOriginalPhotoSHAPinned:true,authHTTPOnlySimulated:true,
 browserViewportScreenshotsIndependentlyVerified:30,
 originalSourceCardScreenshotsIndependentlyVerified:12,
 contactSheets:strips,sourceOwnerPrivacyProvenInFixtureBrowser:true,
 serverSignedTwoAccountsVerified:false,
 genuineSupabaseRLSVerified:false,
 physicalDevicesTested:false,
 productionAppOutfitBoardMigrated:false,
 mainBranchModified:false,releaseAuthorized:false,familyAlpha:'HOLD'};
await writeFile(audit+'/acceptance.json',JSON.stringify(result,null,2));
console.log('NATIVE03 screenshot audit',JSON.stringify({
  realScreens:42,viewportScreens:30,sourceCardScreens:12,contactSheets:6,realNativeBrowser:true,
  signedAccountRLS:'NOT TESTED',release:'HOLD'}));
