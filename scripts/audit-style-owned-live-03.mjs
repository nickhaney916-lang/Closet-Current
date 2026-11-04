/** Verify exact original registered photos, source-preserving owned-ID
 * screenshot contact evidence and real app/browser acceptance.
 * This audit never infers independent 3D fitting or signed server RLS.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const path='benchmark/style-owned-live-03';
const data=JSON.parse(await readFile(path+'/results.json','utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
assert.equal(data.priority,'STYLE-OWNED-LIVE-03');
assert.equal(data.base,'d913e4f0b65c6b92cfbd1de4083e84692740707e');
assert.equal(data.existingGeneratorAdaptedFromPR547,true);
assert.equal(data.existingNativeBoard04Writer,true);
assert.equal(data.existingOriginalPhotoIndex07,true);
assert.equal(data.existingV4AtomicRestore,true);
assert.equal(data.ownerPrivateIndexedDB,true);
assert.equal(data.originalJPEGReencoded,false);
assert.equal(data.realSignedServerRLS,false);
assert.equal(data.realPhysicalAndroidOrIphone,false);
assert.equal(data.arbitraryFitted3D,false);
assert.equal(data.familyAlpha,'HOLD');
assert.equal(data.releaseAuthorized,false);
for(const key of ['errors','crashes'])
 assert.deepEqual(data[key],[],key+' browser failure cannot be silently waived');
// The existing app attempts read-only font/recognition GETs. Those are
// deliberately BLOCKED by the browser. Never confuse blocked reads with
// successful external requests; reject any unknown host or write method.
const trustedReadOnly=new Set(['fonts.googleapis.com','raw.githubusercontent.com',
 'cdn.jsdelivr.net']);
assert.ok(Array.isArray(data.external));
assert.ok(data.external.every(e=>e.method==='GET'&&e.blocked===true&&
 trustedReadOnly.has(e.host)),
 'Any unblocked request, unknown external host, POST/PUT/PATCH/DELETE or image exfiltration blocks acceptance');
assert.ok(Array.isArray(data.consoleErrors));
const expectedBlockedConsole=data.consoleErrors.filter(e=>
 e.text==='Failed to load resource: net::ERR_FAILED'&&
 data.external.some(x=>x.blocked===true&&x.method==='GET'&&
  trustedReadOnly.has(x.host)&&x.engine===e.engine&&x.width===e.width));
assert.equal(data.expectedBlockedConsoleErrors,expectedBlockedConsole.length);
assert.equal(expectedBlockedConsole.length,data.consoleErrors.length,
 'Unexpected browser console error not backed by deliberately blocked read-only legacy requests');
assert.ok(expectedBlockedConsole.length<=data.external.length,
 'Console noise must not exceed recorded blocked GETs');
assert.equal(data.cases.length,6);
const combinations=new Set();
for(const e of data.cases){
 assert.ok(['chromium','webkit'].includes(e.engine));
 assert.ok([320,390,430].includes(e.width));
 combinations.add(e.engine+'-'+e.width);
 for(const key of ['nativeAppReal','actualInputAndHumanCorrection',
  'threeRealOriginalOwnedLooks','undoPinCAS','ownerBPrivate','logoutCleared',
  'actual2DOriginalImages','noFabricated3D','photosUnchanged'])
  assert.equal(e[key],true,key+' did not pass for '+e.engine+' '+e.width);
 assert.equal(e.ownerA.pinnedNeverChanged,true);
 assert.equal(e.ownerA.undoRestored,true);
 assert.equal(e.ownerA.swapCommitted,true);
 assert.equal(e.ownerA.unsavedSwitchRejected,true);
 assert.equal(e.ownerA.regenerateRejectedWhileDirty,true);
 assert.equal(e.ownerA.cancelRestoredPriorDraft,true);
 assert.equal(e.ownerA.nativeCAS,true);
 assert.equal(e.ownerA.nativeOutfitReopen,true);
 assert.equal(e.ownerA.inlineSaveReceipt,true);
 assert.equal(e.ownerA.inlineReopenReceipt,true);
 assert.equal(e.ownerA.savedReadOnly,true);
 assert.equal(e.ownerA.previousRecordsExact,true);
 assert.equal(e.ownerA.allPhotosFromExactOriginals,true);
 assert.equal(e.ownerA.sourceSha,'fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667');
 assert.equal(e.ownerA.distinctSignatures.length,3);
 assert.equal(new Set(e.ownerA.distinctSignatures).size,3);
 assert.equal(e.ownerA.ownedReferences.includes(e.ownerA.newId),true);
 if(e.engine==='chromium')assert.equal(e.ownerA.v4LossRestored,true);
 else assert.equal(e.ownerA.v4Exported,false);
}
assert.equal(combinations.size,6);
assert.equal(data.screenshots.length,51); // 9 Chromium per width; 8 WebKit per width, including one-item photo review
const seen=new Set(),verified=[];
for(const s of data.screenshots){
 const key=[s.engine,s.width,s.stage].join('-');
 assert.equal(seen.has(key),false,'Repeated screenshot evidence');
 seen.add(key);
 const b=await readFile(path+'/'+s.name);
 assert.equal(b.length,s.bytes);
 assert.equal(digest(b),s.sha256);
 const meta=await sharp(b).metadata(),stats=await sharp(b).stats();
 assert.equal(meta.format,'png');assert.equal(meta.width,s.width);
 assert.equal(meta.height,900);
 assert.ok(stats.channels.some(c=>c.stdev>8),'Blank browser screenshot');
 verified.push(s);
}
const byGroup=new Map();
for(const s of verified){
 const key=s.engine+'-'+s.width;
 if(!byGroup.has(key))byGroup.set(key,[]);
 byGroup.get(key).push(s);
}
const galleries=[];
for(const [key,shots] of byGroup){
 const selected=shots.slice(0,6),parts=[];
 for(let i=0;i<selected.length;i++){
  const resized=await sharp(await readFile(path+'/'+selected[i].name))
   .resize(260,570,{fit:'contain',background:'#f8faf8'}).png().toBuffer();
  parts.push({input:resized,left:(i%3)*260,top:Math.floor(i/3)*570});
 }
 const gallery=await sharp({create:{width:780,height:1140,channels:4,
  background:'#f8faf8'}}).composite(parts).png().toBuffer();
 const name='source-three-looks-'+key+'-gallery.png';
 await writeFile(path+'/'+name,gallery);
 galleries.push({name,sha256:digest(gallery),bytes:gallery.length,key,
  screenshotStages:selected.map(s=>s.stage)});
}
await mkdir('benchmark/style-owned-live-03-audit',{recursive:true});
await writeFile('benchmark/style-owned-live-03-audit/acceptance.json',JSON.stringify({
 priority:'STYLE-OWNED-LIVE-03',actualAppBrowserCases:6,
 genuineOriginalJPEGImportedViaActualNativeControl:true,
 actualSourceSHA256:'fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667',
 pinNeverSubstituted:true,distinctThreeOwnedLooksPerCase:true,
 ownerAOwnerBIsolatedSyntheticAuth:true,losslessCASAndSavedOutfitIdentity:true,
 originalPhotosAndMissingOtherOutfitsPreserved:true,
 actualV4AtomicLossRecoveryChromium:true,
 genuineMobileBrowserScreenshots:verified.length,
 genuineBrowserGalleryCount:galleries.length,
 blockedLegacyExternalReadOnlyGETs:data.external.length,
 expectedLegacyBlockedConsoleErrors:expectedBlockedConsole.length,
 blockedHosts:[...new Set(data.external.map(e=>e.host))],
 prohibitedExternalWrites:0,externalUploads:0,
 galleries,realSignedRLS:false,realPhysicalPhones:false,
 arbitraryPhoto3DReady:false,familyAlpha:'HOLD',productionDeployed:false,
 releaseAuthorized:false
},null,2));
console.log('STYLE03_AUDIT '+JSON.stringify({browserCases:6,
 screens:verified.length,galleries:galleries.length,
 sourceSHA256:data.cases[0].ownerA.sourceSha,
 originalPhotosMutated:false,realSignedRLS:false,familyAlpha:'HOLD'}));
