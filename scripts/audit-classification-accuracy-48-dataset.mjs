#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='benchmark/fixtures/';
const sets=[['development','benchmark/manifest-reviewed-32.json'],['validation','benchmark/manifest-fresh-11.json'],['locked-evaluation','benchmark/manifest-holdout-16.json']];
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const sourceById=new Map(sources.map(x=>[x.id,x]));const ids=new Set(),hashes=new Map(),rows=[];let provisional=0;
for(const [split,path] of sets){
 const manifest=JSON.parse(await readFile(path,'utf8'));
 for(const item of manifest){
  if(ids.has(item.id))throw Error('Duplicate dataset ID across partitions: '+item.id);ids.add(item.id);
  if(!item.verified)throw Error('Missing visual review flag: '+item.id);
  const file=await readFile(root+item.image),sha256=createHash('sha256').update(file).digest('hex');
  if(hashes.has(sha256))throw Error('Duplicate photograph bytes: '+item.id+' and '+hashes.get(sha256));hashes.set(sha256,item.id);
  const pinned=sourceById.get(item.id);if(!pinned||pinned.image!==item.image||pinned.sha256!==sha256)throw Error('Source manifest mismatch: '+item.id);
  const meta=await sharp(file).metadata();if(meta.format!=='jpeg'||!meta.width||!meta.height)throw Error('Invalid genuine source photograph: '+item.id);
  provisional++;
  rows.push({id:item.id,image:item.image,split,source:item.source||pinned.attribution.source,downloadUrl:pinned.downloadUrl,license:pinned.attribution.license,licenseUrl:pinned.attribution.licenseUrl,author:pinned.attribution.author,credit:pinned.attribution.credit,sha256,width:meta.width,height:meta.height,expectedCategory:item.expectedCategory,expectedType:item.expectedType,acceptedTypes:item.acceptedTypes||[item.expectedType],labelStatus:'single-file-visual-review; independent-human-adjudication-not-documented'});
 }
}
const summary={schema:'classification-accuracy-48/dataset-audit-v1',count:rows.length,uniqueSHA256:hashes.size,sets:Object.fromEntries(sets.map(([name])=>[name,rows.filter(x=>x.split===name).length])),allImagesRightsMapped:true,allHashesMatchPinnedSourceManifest:true,duplicatePhotos:0,groundTruthStatus:'provisional visual labels; no independent two-person adjudication evidence was found in repository',rows};
await writeFile('benchmark/classification-accuracy-48/dataset-audit.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({count:summary.count,uniqueSHA256:summary.uniqueSHA256,sets:summary.sets,groundTruthStatus:summary.groundTruthStatus}));
