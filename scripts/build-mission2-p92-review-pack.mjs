/**
 * P92 genuine original-photo human A/B review packet builder (NO deployment).
 *
 * Works only on trusted local SHA-locked Work47 public Commons source and
 * native P91 research screenshot receipt. 100% locally generated output.
 * Does not pretend that any person independently judged a photo.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {buildProvisionalCases92,checkSourceReviewedPacket92,sha256,P92_SOURCE} from
 '../research/mission2-p92/blind-photo-review.mjs';

const engine=process.env.P87_ENGINE??process.argv[2]??'chromium';
assert.ok(['chromium','webkit'].includes(engine),'P92 actual browser required');
const donor=resolve(process.argv[3]||'.native05-donor-541');
const cwd=resolve('.');
assert.notEqual(donor,cwd,'P92 needs detached original-source donor');
assert.ok(donor.startsWith(cwd+'/')&&!donor.startsWith(cwd+'/public')&&
 !donor.startsWith(cwd+'/supabase'),'do not touch consumer or cloud');
const runPath=join(cwd,'benchmark/mission2-p91/native-'+engine);
const dest=join(cwd,'benchmark/mission2-p92/review-'+engine);
const keyDest=join(cwd,'benchmark/mission2-p92/secret-allocations-'+engine+'.json');
const r=JSON.parse(await readFile(join(runPath,'results.json'),'utf8'));
const manifest=JSON.parse(await readFile(join(donor,'benchmark/work47/manifest.json'),'utf8'));
const row=manifest.rows?.find(x=>x.id==='commons-0053');
const {publicPacket,allocation}=buildProvisionalCases92({result:r,engine,manifestRow:row});
assert.equal(checkSourceReviewedPacket92(publicPacket).status,
 'SOURCE_GROUNDED_PACK_READY_FOR_HUMAN_REVIEW_NOT_RELEASE');
await mkdir(join(dest,'cases'),{recursive:true});
const sourceDir=join(donor,'benchmark/work47/assets');
for(const [ext,expected,target] of [
 ['jpg',P92_SOURCE,'source-original.jpg'],
 ['png',row.cutoutSHA256,'source-provisional-cutout.png']
]){
 const bytes=await readFile(join(sourceDir,'commons-0053.'+ext));
 assert.equal(sha256(bytes),expected,'actual licensed source byte SHA mismatch '+ext);
 await writeFile(join(dest,target),bytes,{flag:'wx'});
}
const originalScreens=new Map(r.screens.map(s=>[s.file,s]));
assert.equal(originalScreens.size,120,'real P91 screenshot uniqueness');
for(const caseKey of allocation)for(const side of ['A','B']){
 const source=originalScreens.get(caseKey[side+'OriginalFile']);
 assert.ok(source?.sha256,'original screenshot missing original signed P91 receipt');
 const bytes=await readFile(join(runPath,source.file));
 assert.equal(sha256(bytes),source.sha256,'photo-textured original research screenshot SHA mismatch');
 const expected=publicPacket.cases.find(c=>c.caseId===caseKey.caseId);
 assert.equal(sha256(bytes),expected['image'+side+'SHA256'],
  'blinded candidate allocation not source-matched');
 await writeFile(join(dest,'cases',caseKey.caseId+'-'+side+'.png'),bytes,{flag:'wx'});
}
const template=await readFile('research/mission2-p92/offline-review-template.html','utf8');
const marker='__P92_CASES_JSON__';
assert.equal(template.split(marker).length,2,'static human review template changed');
assert.ok(!/<script[^>]+src=|<iframe|fetch\s*\(/i.test(template),
 'offline reviewer page must not call out to networks');
const encoded=JSON.stringify(publicPacket).replaceAll('<','\\u003c');
const page=template.replace(marker,encoded);
assert.ok(!page.includes(marker)&&page.includes('originalPhotograph'));
await writeFile(join(dest,'index.html'),page,{flag:'wx'});
await writeFile(join(dest,'packet.json'),JSON.stringify(publicPacket,null,2)+'\n',{flag:'wx'});
await mkdir(join(cwd,'benchmark/mission2-p92'),{recursive:true});
await writeFile(keyDest,JSON.stringify({
 schema:'M2-P92-blind-allocation-steward-key-not-in-human-review-packet',
 engine,sourceSHA256:P92_SOURCE,allocation,releaseAuthorized:false,familyAlpha:'HOLD'
},null,2)+'\n',{flag:'wx'});
const report={
 schema:'M2-P92-real-original-photo-review-source-packet-receipt',
 engine,sourcePhotoSHA256:P92_SOURCE,
 provisionalCutoutSHA256:row.cutoutSHA256,
 sourcePhotographUnedited:true,
 genuineLicensedOriginalSource:true,
 genuineOriginal3DRendererScreens:120,
 originalWebGLImagesBlindedIntoPairs:60,
 independentBlindVisualReviewCases:30,
 originalPhotoBackOrSideAvailable:false,
 originalPhotoCutoutApprovedByOwner:false,
 sourceHumanDrapeReviewCompleted:false,
 sourceHumanPhotorealismApproved:false,
 strictP91ContactSourceAndDrapePassed:true,
 noExternalResourceRequests:true,
 noOwnerIdentityOrPrivatePhotosRead:true,
 releasedToConsumer:false,
 status:'PHOTO_TRUTH_REVIEW_PACKET_READY_UNREVIEWED_NOT_RELEASE',
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await writeFile(join(dest,'build-receipt.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log('M2_P92_REAL_PHOTO_REVIEW_PACKET',JSON.stringify(report));
