#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {copyFile,readFile,writeFile} from 'node:fs/promises';
const python=process.env.PYTHON||'python3';
execFileSync(python,['scripts/rebuild-recognition-vectors.py','--prompt-overrides','research/garment-classification-accuracy-48/prompt-overrides.json','--blend','0.75','--output-dir','research/garment-classification-accuracy-48/candidate-assets'],{stdio:'inherit'});
const metadataPath='research/garment-classification-accuracy-48/candidate-assets/recognition-vectors.json';
const metadata=JSON.parse(await readFile(metadataPath,'utf8'));
metadata.classificationProfile='accuracy48-prompt-ensemble-v1';
await writeFile(metadataPath,JSON.stringify(metadata,null,2)+'\n');
await copyFile(metadataPath,'public/recognition-vectors-accuracy-48.json');
await copyFile('research/garment-classification-accuracy-48/candidate-assets/recognition-vectors.bin','public/recognition-vectors-accuracy-48.bin');
console.log('Built accuracy48 local-only candidate vectors.');
