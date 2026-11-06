import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import sharp from 'sharp';

const folder='benchmark/three-d-78';
const report=JSON.parse(await readFile(folder+'/browser-results.json','utf8'));
assert.equal(report.realAnatomicalBones,163);
assert.deepEqual(report.widths,[320,390]);
assert.deepEqual(report.angles,[0,45,90,180]);
assert.equal(report.screenshots,64);
assert.equal(report.humanPhotorealismApproved,false);
assert.equal(report.physicalAndroidPhoneTested,false);
assert.equal(report.physicalIphoneTested,false);
assert.equal(report.familyAlpha,'HOLD');
assert.equal(report.cases.length,16);
assert.equal(report.comparisons.length,8);

const sources={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const files=await readdir(folder),rows=[];
for(const c of report.cases){
 assert.equal(c.sourceSHA,sources[c.denim]);
 assert.equal(c.humanApproved,false);
 for(const angle of report.angles){
  const file=`${c.figure}-${c.width}-${c.mode}-${c.denim}-${angle}.png`;
  assert.ok(files.includes(file),'Missing screenshot '+file);
  const bytes=await readFile(folder+'/'+file);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.format,'png');
  assert.ok(meta.width>=200&&meta.height>=300,`Unexpected render size for ${file}`);
  rows.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),
   width:meta.width,height:meta.height,figure:c.figure,viewport:c.width,
   pose:c.kneePose,denim:c.denim,sourceSHA256:c.sourceSHA,angle});
 }
}
assert.equal(rows.length,64);
for(const c of report.comparisons){
 assert.equal(c.verifiedOriginalSourceSHA,sources[c.denim]);
 for(const angle of report.angles)assert.ok(Number.isFinite(c.changes[angle]),'Missing image delta at '+angle);
 assert.equal(c.humanReview,'REVIEW');
}
await mkdir('benchmark/three-d-90',{recursive:true});
await writeFile('benchmark/three-d-90/acceptance.json',JSON.stringify({
 priority:'PHOTO-CLOTH-FIT-REALISM-90',sourceRendererSHA:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 sourceParentSHA:'e6c2ef87499b354bc8440bfdc9ab3a92980f92f0',
 actualWebGL:true,real163BoneRig:true,angles:[0,45,90,180],screenshots:rows.length,
 comparisons:report.comparisons.length,files:rows,
 imageMetric:'absolute RGB threshold count; supporting evidence only',
 humanAcceptance:'PENDING',photorealismAccepted:false,physicalPhoneTested:false,
 dynamicClothCertified:false,sweptCollisionCertified:false,familyAlpha:'HOLD',releaseAuthorized:false
},null,2)+'\n');
console.log('PHOTO_CLOTH_FIT_REALISM_90_SCREENSHOTS_AUDITED',JSON.stringify({screenshots:rows.length,comparisons:report.comparisons.length,humanAcceptance:'PENDING',familyAlpha:'HOLD'}));
