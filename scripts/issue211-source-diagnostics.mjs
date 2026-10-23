// Offline pixel diagnostics only. No classifier, model fetch, customer files or mask truth.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {uniformPhotoBounds,recognitionFramingDiagnostics} from '../public/recognition-photo.mjs';
const require=createRequire(import.meta.url),PhotoColor=require('../public/photo-color.js');
const hash=b=>createHash('sha256').update(b).digest('hex');
const base='972a50c8065ac4e5478c1e7fefdf740b2a654001';
const source=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json'));
const labels=new Map(['reviewed-32','holdout-16','fresh-11'].flatMap(cohort=>JSON.parse(fs.readFileSync(`benchmark/manifest-${cohort}.json`)).map(r=>[r.id,{...r,cohort}])));
if(source.length!==59||labels.size!==59)throw Error('Locked 59-source cohort required');
const decode=`from PIL import Image
import sys,json,base64
im=Image.open(sys.argv[1]);orientation=im.getexif().get(274,1);im=im.convert('RGBA')
print(json.dumps(dict(width=im.width,height=im.height,orientation=orientation,pixels=base64.b64encode(im.tobytes()).decode())))`;
const rows=[];
for(const row of source){
 const label=labels.get(row.id),path='benchmark/fixtures/'+row.image;
 if(!label||label.image!==row.image||(label.sha256&&label.sha256!==row.sha256)||!row.attribution?.license||!row.attribution?.source)throw Error('Missing locked provenance '+row.id);
 const bytes=fs.readFileSync(path);
 if(hash(bytes)!==row.sha256)throw Error('Source changed '+row.id);
 const decoded=spawnSync(process.env.PYTHON||'python',['-c',decode,path],{encoding:'utf8',maxBuffer:256*1024*1024});
 if(decoded.status!==0)throw Error(decoded.stderr);
 const {pixels,orientation,...dimensions}=JSON.parse(decoded.stdout),data=new Uint8ClampedArray(Buffer.from(pixels,'base64'));
 const before=hash(data),image={...dimensions,data,channels:4};
 const framing=recognitionFramingDiagnostics(image);
 const bounds=uniformPhotoBounds(image);
 const color=PhotoColor.estimate(data,image.width,image.height);
 if(hash(data)!==before||hash(fs.readFileSync(path))!==row.sha256)throw Error('Original mutated '+row.id);
 rows.push({id:row.id,cohort:label.cohort,expectedCategory:label.expectedCategory,acceptedTypes:label.acceptedTypes||[label.expectedType],sha256:row.sha256,hashMatches:true,...dimensions,exifOrientation:orientation,license:row.attribution.license,source:row.attribution.source,
  framing:{...framing,fullGarmentRetained:undefined},bounds,
  colorEstimate:color,colorGroundTruth:null,colorCorrectness:'NOT_MEASURED',cropMaskIoU:null,
  disposition:'REVIEW',reason:'Pixel diagnostics do not establish physical garment boundaries or color truth'});
}
const report={schema:1,applicationBase:base,measurement:'NEW_OFFLINE_SOURCE_PIXEL_DIAGNOSTICS_NOT_MODEL_INFERENCE',
 sourceCount:rows.length,originalHashMatches:rows.filter(r=>r.hashMatches).length,
 note:'Full stored fixture resolution, not proven camera-native originals: Commons URLs may be resized. No new model predictions or human annotations.',
 modelMetadata:JSON.parse(fs.readFileSync('public/recognition-vectors.json')).revision,
 modelVectorSHA256:hash(fs.readFileSync('public/recognition-vectors.bin')),
 categoryCounts:Object.fromEntries([...new Set(rows.map(r=>r.expectedCategory))].map(c=>[c,rows.filter(r=>r.expectedCategory===c).length])),
 colorNeedsReview:rows.filter(r=>!r.colorEstimate||r.colorEstimate.needsConfirmation).length,
 trimmedSources:rows.filter(r=>r.framing.trimmedFraction>0).map(r=>r.id),
 newInferenceCount:0,independentHumanMasks:0,customerAccuracy:null,physicalPhones:0,rows};
const output=process.argv[2]||'/tmp/issue211-source-diagnostics.json';fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,rows:undefined},null,2));
