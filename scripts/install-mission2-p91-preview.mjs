/**
 * P91 research-only detached donor module installer, strictly AFTER P87.
 * Never touches public consumer files, original JPEGs, Supabase or owner data.
 */
import assert from 'node:assert/strict';
import {readFile,copyFile,mkdir,lstat,realpath} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const donorArg=process.argv[2];
if(!donorArg)throw Error('P91 exact disposable donor root required');
const source=await realpath('.'),donor=await realpath(resolve(donorArg));
if(donor===source||source.startsWith(donor+'/')||
   ['/public','/supabase'].some(dir=>donor.startsWith(source+dir)))
 throw Error('P91 original user source/consumer tree protected');
const installed=resolve(donor,'research/mission2-p87/skinned-pose-preview.mjs');
const code=await readFile(installed,'utf8');
assert.match(code,/calculateSourceSkirtRelief91/,'P91 must follow original P87/90 source fitter');
assert.match(code,/const drape91=\(\)=>/,'P91 actual disposable clone method absent');
const path='research/mission2-p91/photographed-skirt-relief.mjs';
const target=resolve(donor,path);
await mkdir(dirname(target),{recursive:true});
const real=await realpath(dirname(target));
if(!real.startsWith(donor+'/'))throw Error('P91 symlinked donor destination escaped');
try{if((await lstat(target)).isSymbolicLink())throw Error('P91 destination symlink refused');}
catch(e){if(e.code!=='ENOENT')throw e;}
await copyFile(path,target);
assert.ok((await readFile(path)).equals(await readFile(target)),'source module installation must preserve bytes');
console.log('P91_AUTHENTIC_SKINNED_SOURCE_HEM_HYPOTHESIS_INSTALLED_DETACHED_ONLY_HOLD');
