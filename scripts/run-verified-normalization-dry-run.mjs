// Real source bytes, four independent licensed photos -> VERIFIED MOCK 1:1
// dry runs. No model inference, source upload, saved tiles or private data.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {runVerifiedMockEdit,verifyMockReceipt} from '../supabase/functions/garment-normalize/verified-pipeline.mjs';
const ids=[
 {id:'commons-0035',category:'Bottoms',manifest:'locked'},
 {id:'commons-0065',category:'Outerwear',manifest:'locked'},
 {id:'validation-0017',category:'Bottoms',manifest:'fresh'},
 {id:'validation-0019',category:'Shoes',manifest:'fresh'}
];
const dir=process.argv[2]||'benchmark/verified-normalization-mock';
await mkdir(dir,{recursive:true});
const [locked,fresh]=await Promise.all([
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse),
 readFile('benchmark/manifest-fresh-11.json','utf8').then(JSON.parse)
]);
const sources={locked:new Map(locked.map(x=>[x.id,x])),fresh:new Map(fresh.map(x=>[x.id,x]))};
const tiny='data:image/png;base64,'+
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJPQAAAABJRU5ErkJggg==';
const secret='not-a-production-key-simulation-only-do-not-copy';
const now=Date.now(),owner='synthetic_test_owner_001';
const report={status:'running',sourceBytesVerified:false,modelName:'edit',
 simulationOnly:true,realAIImagesGenerated:false,modelSourceConditioningProven:false,
 sampleImagesUploaded:false,providerCharged:false,garmentFidelityAccuracy:null,
 sourceFilesWrittenToArtifacts:false,automaticallySavedClothes:0,cases:[]};
const save=()=>writeFile(join(dir,'summary.json'),JSON.stringify(report,null,2));
await save();
for(const row of ids){
 const source=sources[row.manifest].get(row.id);
 if(!source?.verified||!source?.attribution?.license||!/^[0-9a-f]{64}$/.test(source.sha256))
  throw Error('Unverified source '+row.id);
 const bytes=await readFile(join('benchmark/photos',source.image));
 const sourceSha256=createHash('sha256').update(bytes).digest('hex');
 if(sourceSha256!==source.sha256)throw Error('Source bytes changed '+row.id);
 const candidate={action:'normalize-preview',category:row.category,
  itemId:row.id,photoSha256:sourceSha256,
  garmentImage:'data:image/jpeg;base64,'+bytes.toString('base64'),
  userInitiated:true,storeResult:false};
 const requestId='simulation_'+row.id.replace('-','_')+'_001';
 const result=await runVerifiedMockEdit({candidate,
  principal:{id:owner,authenticatedByServer:true},
  reservation:{mode:'simulation',allowed:true,ownerId:owner,requestId,maxJobs:1,
   expiresAt:now+60000},requestId,secret,now,enabled:true,
  adapter:{kind:'mock',edit:async payload=>{
   if(payload.inputs.image!==candidate.garmentImage||payload.inputs.num_images!==1)
    throw Error('Provider did not receive exact original photo');
   return tiny;
  }}
 });
 if(!await verifyMockReceipt({receipt:result.receipt,secret,now,
  userId:owner,itemId:row.id,category:row.category,requestId,
  sourceSha256,previewSha256:result.evidence.previewSha256}))
  throw Error('Internal provenance receipt invalid');
 report.cases.push({id:row.id,license:source.attribution.license,
  originalPhotoSha256:sourceSha256,receiptedPhotoSha256:result.evidence.sourceSha256,
  mockedOutputSha256:result.evidence.previewSha256,
  originalBytesSentUnchanged:true,providerKind:'mock',realNormalization:false,
  receiptVerified:true,automaticSave:false});
 await save();
 console.log('VERIFIED_DRY_RUN '+JSON.stringify({
  id:row.id,sha256:sourceSha256,receiptVerified:true,actualAIEdit:false
 }));
}
report.status='complete';report.sourceBytesVerified=true;
await save();
