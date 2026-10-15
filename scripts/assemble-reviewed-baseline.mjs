#!/usr/bin/env node
// Combine existing independently reviewed manifests without inventing labels.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
const paths=process.argv.slice(2);
if(paths.length<2)throw Error('Usage: node scripts/assemble-reviewed-baseline.mjs OUTPUT MANIFEST...');
const [out,...inputs]=paths;
const seen=new Set(),rows=[];
for(const path of inputs){
 const entries=JSON.parse(await readFile(path,'utf8'));
 if(!Array.isArray(entries))throw Error('Not a manifest array: '+path);
 for(const entry of entries){
  if(entry.verified!==true||entry.mode!=='single'||!entry.id||!entry.image||!entry.expectedCategory||!entry.expectedType)throw Error('Unreviewed or malformed entry: '+entry.id);
  if(seen.has(entry.id))throw Error('Repeated reviewed ID: '+entry.id);
  seen.add(entry.id);
  rows.push(entry);
 }
}
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify({entries:rows.length,idsUnique:seen.size,output:out,types:[...new Set(rows.map(x=>x.expectedType))]}));
