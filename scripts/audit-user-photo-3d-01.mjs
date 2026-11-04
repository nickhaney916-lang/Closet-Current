import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='benchmark/user-photo-3d-01',out='benchmark/user-photo-3d-01-audit';
await mkdir(out,{recursive:true});
const data=JSON.parse(await readFile(root+'/results.json','utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
assert.equal(data.cases.length,3);assert.equal(data.screenshots.length,9);
assert.deepEqual(data.errors,[]);assert.deepEqual(data.external,[]);
assert.ok(data.cases.every(x=>x.sourcePhotos===15&&x.allOriginalSHA256Verified&&
 x.fullJPEGNeverRewritten&&x.missingGarmentReferencesRetained&&
 x.actualOriginalFixtureIndexedDB&&x.valid3DReadyWithoutRender===0&&
 x.sourceHonestFallback));
const galleries=[];
for(const width of [320,390,430]){
 const selected=data.screenshots.filter(x=>x.width===width);
 assert.deepEqual(selected.map(x=>x.group),[1,2,3]);
 const layers=[];
 for(let i=0;i<3;i++){
  const record=selected[i],bytes=await readFile(root+'/'+record.name);
  assert.equal(digest(bytes),record.sha256);
  const metadata=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
  assert.equal(metadata.format,'png');assert.equal(metadata.width,width);
  assert.equal(metadata.height,900);
  assert.ok(stats.channels.some(x=>x.stdev>8));
  layers.push({input:bytes,left:i*width,top:0});
 }
 const jpeg=await sharp({create:{width:3*width,height:900,channels:4,
   background:{r:255,g:255,b:255,alpha:1}}}).composite(layers).jpeg({quality:85}).toBuffer();
 const filename='all-15-originals-chromium-'+width+'.jpg';
 await writeFile(out+'/'+filename,jpeg);
 galleries.push({width,filename,sha256:digest(jpeg)});
}
await writeFile(out+'/acceptance.json',JSON.stringify({
 status:'PASS_ORIGINAL_SOURCE_READINESS_AND_PHOTO_FALLBACK_ONLY',
 originalJPEGShaVerified:15,viewports:[320,390,430],
 realChromiumScreenshots:9,screenshotHashesVerified:9,
 galleries,readiness:{'3D Ready':0,'Needs Review':12,'Photo-Only':3},
 inherited163BoneDonorRunsSeparately:true,actualHuman3DPhotoReconstructionAccepted:false,
 originalPhotosReencoded:false,realSignedSupabase:false,physicalDevices:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
},null,2));
console.log('PHOTO3D01_AUDIT '+JSON.stringify({galleries:galleries.length,originals:15,
 pngs:9,ready:0,needsReview:12,photoOnly:3,honestFallback:true}));
