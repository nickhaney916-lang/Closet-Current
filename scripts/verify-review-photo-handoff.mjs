// Offline QA handoff assertion. No mask generated, reviewed or approved here.
// The original image SHA-256, canonical filename, archival alias and model
// prediction identity must all refer to the SAME locked photo.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const root=process.argv[2]||'benchmark/segmentation-predictions';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const packet=JSON.parse(await readFile(join(root,'review-packet.json'),'utf8'));
if(!Array.isArray(manifest.cases)||manifest.cases.length!==6||
   packet?.kind!=='review-preparation-not-ground-truth'||packet?.schemaVersion!==1||
   packet.cases?.length!==manifest.cases.length)
 throw Error('Incorrect six-photo independent-review packet');
const byId=new Map(packet.cases.map(c=>[c.id,c]));
if(byId.size!==manifest.cases.length)throw Error('Duplicate review packet entries');
for(const entry of manifest.cases){
 const task=byId.get(entry.id);
 if(!/^commons-[0-9]{4}$/.test(entry.id)||
   entry.image!==entry.id+'.jpg'||!task||
   task.sourceSha256!==entry.sourceSha256||
   task.image!==entry.image||
   task.files?.original!==entry.image||
   task.files?.archivalOriginal!==entry.id+'.original.jpg'||
   task.files?.modelSuggestion!==entry.id+'.prediction.json'||
   task.files?.comparison!==entry.id+'.side-by-side.png')
  throw Error('Review packet cannot produce canonical annotation for '+entry.id);
 const [source,archive,model,comparison]=await Promise.all([
  readFile(join(root,task.files.original)),
  readFile(join(root,task.files.archivalOriginal)),
  readFile(join(root,task.files.modelSuggestion),'utf8').then(JSON.parse),
  readFile(join(root,task.files.comparison))
 ]);
 if(!source.equals(archive)||
    createHash('sha256').update(source).digest('hex')!==entry.sourceSha256||
    model.image!==entry.image||model.sourceSha256!==entry.sourceSha256||
    !Number.isInteger(model.width)||!Number.isInteger(model.height)||
    model.width<1||model.height<1||!Array.isArray(model.runs)||
    comparison.length<16)
  throw Error('Source pixels, prediction or comparison mismatch: '+entry.id);
}
const index=await readFile(join(root,'review-index.html'),'utf8');
for(const entry of manifest.cases)
 if(!index.includes('href="'+entry.image+'" download="'+entry.image+'"'))
  throw Error('Canonical annotation download link missing: '+entry.id);
console.log('REVIEW_PHOTO_HANDOFF '+JSON.stringify({
 photos:manifest.cases.length,canonicalNamesVerified:true,originalSHA256Verified:true,
 aliasesByteIdentical:true,predictionSourceMatches:true,
 reviewedReferencesCreated:0,productionAuthorized:false
}));
