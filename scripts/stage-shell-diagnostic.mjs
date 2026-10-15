#!/usr/bin/env node
// Stage a downloaded, visually reviewed jacket as a diagnostic only.
// Do NOT approve it or include it in scored independent accuracy benchmarks.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const [reportPath,candidatesPath,outputManifest,outputDirectory,requestedId='candidate-shell-001']=process.argv.slice(2);
if(!reportPath||!candidatesPath||!outputManifest||!outputDirectory)throw Error('Usage: node scripts/stage-shell-diagnostic.mjs REPORT CANDIDATES OUT_MANIFEST OUT_DIR');
const rows=JSON.parse(readFileSync(reportPath,'utf8')),candidates=JSON.parse(readFileSync(candidatesPath,'utf8'));
const id=requestedId;
if(!['candidate-shell-001','candidate-shell-003'].includes(id))throw Error('Unsupported diagnostic image');
const row=rows.find(x=>x.id===id),candidate=candidates.find(x=>x.id===id);
if(!candidate||candidate.verified||candidate.expectedCategory!=='Outerwear'||!['Jacket','Raincoat'].includes(candidate.expectedType))throw Error('Unexpected diagnostic candidate state');
if(row?.status!=='downloaded-unreviewed'||row.format!=='jpg'||!/^[a-f0-9]{64}$/.test(row.sha256))throw Error('Gray shell image was not downloaded and hashed');
if(!/^[a-f0-9]{64}$/.test(candidate.sha256)||candidate.sha256!==row.sha256)throw Error('Gray shell download does not match locked candidate checksum');
const bytes=readFileSync('benchmark/photo-collection/'+id+'.jpg');
if(bytes.length!==row.bytes||createHash('sha256').update(bytes).digest('hex')!==row.sha256)throw Error('Collected image checksum mismatch');
mkdirSync(outputDirectory,{recursive:true});
const image='diagnostic-'+id+'.jpg';
copyFileSync('benchmark/photo-collection/'+id+'.jpg',outputDirectory+'/'+image);
writeFileSync(outputManifest,JSON.stringify([{id,image,mode:'single',expectedCategory:'Outerwear',expectedType:candidate.expectedType,diagnosticOnly:true,contextContaminated:id==='candidate-shell-003',sha256:row.sha256,source:candidate.source}],null,2)+'\n');
console.log(JSON.stringify({id,image,sha256:row.sha256,diagnosticOnly:true}));
