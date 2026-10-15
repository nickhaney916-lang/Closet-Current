#!/usr/bin/env node
// Validate a held-out, human-reviewed 100-photo recognition set before running inference.
// This does not classify photographs or claim any accuracy result.
import {readFile,stat} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
const manifestPath=resolve(process.argv[2]||'benchmark/manifest.json');
const photosDir=resolve(process.argv[3]||'benchmark/photos');
const minimum=Number(process.argv[4]||100);
if(!Number.isInteger(minimum)||minimum<1)throw Error('Minimum must be a positive integer');
const entries=JSON.parse(await readFile(manifestPath,'utf8'));
if(!Array.isArray(entries))throw Error('Manifest must be an array');
const issues=[],counts={},seenIds=new Set(),seenNames=new Set(),seenHashes=new Map();
const eligible=[];
for(const [index,item] of entries.entries()){
 const tag=item?.id||'row-'+(index+1);
 if(!item||typeof item!=='object'){issues.push(tag+': invalid manifest entry');continue;}
 if(item.mode!=='single'){issues.push(tag+': expected single-garment photo');continue;}
 if(item.verified!==true){issues.push(tag+': requires independent human verification');continue;}
 if(!item.expectedCategory||!item.expectedType){issues.push(tag+': missing reviewed category/type');continue;}
 if(!item.id||seenIds.has(item.id)){issues.push(tag+': duplicate/missing ID');continue;}
 seenIds.add(item.id);
 const name=item.image;
 if(!name||basename(name)!==name||!/^.+\.(jpe?g|png|webp)$/i.test(name)){issues.push(tag+': unsafe/invalid photo filename');continue;}
 if(seenNames.has(name)){issues.push(tag+': reused filename');continue;}
 seenNames.add(name);
 try{
  const path=resolve(photosDir,name);
  const info=await stat(path);
  if(!info.isFile()||info.size<1000)throw Error('empty or implausibly small image');
  const digest=createHash('sha256').update(await readFile(path)).digest('hex');
  if(seenHashes.has(digest)){issues.push(tag+': duplicate image bytes of '+seenHashes.get(digest));continue;}
  seenHashes.set(digest,tag);
  const category=item.expectedCategory;
  counts[category]=(counts[category]||0)+1;
  eligible.push({id:item.id,category,type:item.expectedType,image:name});
 }catch(e){issues.push(tag+': unreadable photo: '+e.message);}
}
const report={requestedMinimum:minimum,manifestEntries:entries.length,eligible:eligible.length,
 categoryCounts:counts,distinctImages:seenHashes.size,issues,ready:eligible.length>=minimum&&issues.length===0};
console.log(JSON.stringify(report,null,2));
if(!report.ready)process.exitCode=1;
