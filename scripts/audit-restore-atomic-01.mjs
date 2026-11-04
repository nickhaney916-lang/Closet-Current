import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/restore-atomic-01',out='benchmark/restore-atomic-01-audit';
await mkdir(out,{recursive:true});
const report=JSON.parse(await readFile(dir+'/results.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const {screenshots,cases,errors,external}=report;
assert.equal(cases.length,6);assert.equal(screenshots.length,30);
assert.deepEqual(errors,[]);assert.deepEqual(external.filter(x=>x.method!=='GET'),[]);
assert.ok(cases.every(x=>x.originalPhotosUnchanged&&x.savedOutfit3dIdRetained&&
 x.dressJacketCoatRetained&&x.missingReferencesRetained&&x.atomicRestoreAndNativeEdit&&
 x.ownerAandBIsolated&&!x.realSignedCloudJWT&&!x.releaseAuthorized));
const groups=[];
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const items=screenshots.filter(x=>x.engine===engine&&x.width===width);
 assert.deepEqual(items.map(x=>x.stage),[
 '01-before-saved-photo-outfit','02-before-recovery-storage-loss',
 '03-after-atomic-owner-restore','04-missing-garment-ID-placeholder',
 '05-reopened-edited-and-saved']);
 const inputs=[],offsets=[];
 for(let i=0;i<items.length;i++){
  const item=items[i],bytes=await readFile(dir+'/'+item.name);
  assert.equal(sha(bytes),item.sha256);
  const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
  assert.equal(meta.format,'png');assert.equal(meta.width,width);assert.equal(meta.height,900);
  assert.ok(stats.channels.some(channel=>channel.stdev>5));
  inputs.push({input:await sharp(bytes).resize({width:width,height:700,fit:'cover',position:'top'}).png().toBuffer(),
   left:i*width,top:0});
  offsets.push({stage:item.stage,sha256:item.sha256,size:bytes.length});
 }
 const gallery=await sharp({create:{width:width*5,height:700,channels:4,
  background:{r:255,g:255,b:255,alpha:1}}}).composite(inputs).jpeg({quality:82}).toBuffer();
 const name='contact-'+engine+'-'+width+'.jpg';
 await writeFile(out+'/'+name,gallery);
 groups.push({engine,width,name,sha256:sha(gallery),items:offsets});
}
await writeFile(out+'/acceptance.json',JSON.stringify({status:'PASS_RESEARCH_ONLY',
 verifiedOriginalPNG:screenshots.length,comparisonGalleries:groups.length,
 genuineChromiumWebKit:true,genuinePhysicalDevices:false,
 sameOwnerJPEGUnchanged:true,realLiveTwoOwnerRLS:false,
 familyAlpha:'HOLD',releaseAuthorized:false,groups},null,2));
console.log('RESTORE01_AUDIT',JSON.stringify({realPNGs:30,galleries:6,
 realSignedAccounts:false,release:'HOLD'}));
