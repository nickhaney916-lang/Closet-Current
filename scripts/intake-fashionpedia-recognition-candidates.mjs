#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {intakeFashionpedia} from '../research/autonomous-recognition-mission/fashionpedia-intake.mjs';
const [input,output,...extra]=process.argv.slice(2);
if(!input||!output||extra.length)throw Error('Usage: node scripts/intake-fashionpedia-recognition-candidates.mjs official-val.json metadata-report.json');
const report=intakeFashionpedia(await readFile(input));
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidates:report.candidateCount,acceptedBenchmarkPhotos:0,photoBytesDownloaded:0,sourceSHA256:report.sourceSHA256}));
