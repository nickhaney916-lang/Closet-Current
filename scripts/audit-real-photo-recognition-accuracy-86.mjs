#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const read=async p=>JSON.parse(await readFile(p,'utf8'));
const files={
 sources:await read('benchmark/locked-photo-sources.json'),
 development:await read('benchmark/manifest-reviewed-32.json'),
 validation:await read('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':await read('benchmark/manifest-holdout-16.json'),
 assets:await read('research/real-photo-recognition-accuracy-86/model-assets.json')
};
assert.equal(files.sources.length,59,'P86 expects the inherited 59 licensed source list');
const ids=new Set(),hashes=new Set(),audited=[];
for(const [split,rows] of Object.entries({development:files.development,validation:files.validation,'locked-evaluation':files['locked-evaluation']})){
 for(const row of rows){
  assert.equal(row.verified,true);assert.ok(row.id&&row.image);
  const src=files.sources.find(x=>x.id===row.id);
  assert.ok(src&&src.verified&&src.image===row.image&&/^[a-f0-9]{64}$/.test(src.sha256));
  assert.ok(src.attribution?.source&&src.attribution?.license,'Source attribution/license missing: '+row.id);
  assert.ok(!ids.has(row.id)&&!hashes.has(src.sha256),'Partition duplicates or source leakage');
  ids.add(row.id);hashes.add(src.sha256);
  const bytes=await readFile('benchmark/fixtures/'+src.image);
  const sha=createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha,src.sha256,'Genuine original bytes differ: '+row.id);
  const image=await sharp(bytes,{failOn:'truncated'}).metadata();
  assert.equal(image.format,'jpeg');assert.ok(image.width&&image.height);
  audited.push({id:row.id,split,sourceSHA256:sha,bytes:bytes.length,width:image.width,height:image.height,
   license:src.attribution.license,source:src.attribution.source,
   provisionalCategory:row.expectedCategory,provisionalSubtype:row.expectedType});
 }
}
assert.equal(ids.size,59);assert.equal(hashes.size,59);
const independentLabels=0;
const report={schema:'real-photo-recognition-accuracy-86/v1',priority:86,
 sourceCommit:'b5167567d4a47e2ce720ccd3727647c037974b3a',researchOnly:true,
 immutableOriginals:{unique:ids.size,sha256Verified:audited.length,allJPEG:true,splitCounts:{development:files.development.length,validation:files.validation.length,'locked-evaluation':files['locked-evaluation'].length}},
 independentHumanAnnotations:{verified:independentLabels,reviewers:0,adjudications:0,primaryColorLabels:0,secondaryColorLabels:0,instanceMasks:0},
 modelAssets:files.assets.models.map(x=>({name:x.name,repository:x.repository,revision:x.revision,license:x.license,weightIdentities:x.weights})),
 acceptance:{engineering:'PENDING_REAL_MODEL_AND_BROWSER_ACTIONS',scientific:'NEEDS_REWORK',releaseAuthorized:false,
  blockers:['fewer than 100 appropriately licensed photos','no independent source-bound human labels','no independent primary/secondary color truth','no independent garment-instance mask truth','SegFormer model license unspecified','no physical Android/iPhone test']},
 legacyLabelsAreProvisional:true,sourceRecords:audited};
await mkdir('benchmark/real-photo-recognition-accuracy-86',{recursive:true});
await writeFile('benchmark/real-photo-recognition-accuracy-86/source-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('P86 SOURCE/RIGHTS/PARTITION AUDIT: '+JSON.stringify({unique:ids.size,sha256Verified:audited.length,
 splits:report.immutableOriginals.splitCounts,independentHumanLabels:independentLabels,
 scientificVerdict:report.acceptance.scientific,releaseAuthorized:false}));
