// Usage:
// node scripts/stage-approved-garment-masks.mjs \\
//   benchmark/segmentation-predictions /path/to/commons-0035.mask.approved.json
// Produces local candidate files only. NEVER changes the active manifest.
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {planReviewedMaskImports} from '../benchmark/stage-reviewed-masks.mjs';

const [photoFolder,...approvedFiles]=process.argv.slice(2);
if(!photoFolder||!approvedFiles.length)throw Error('Usage: node scripts/stage-approved-garment-masks.mjs <verified-photo-folder> <approved-json-file>...');
const [manifest,sources]=await Promise.all([
 readFile('benchmark/segmentation-review-manifest.json','utf8').then(JSON.parse),
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse)
]);
const submissions=await Promise.all(approvedFiles.map(async file=>{
 const annotation=JSON.parse(await readFile(file,'utf8'));
 const id=typeof annotation.image==='string'?annotation.image.replace(/\.jpg$/,''):null;
 if(!/^commons-[0-9]{4}$/.test(id||''))throw Error('Unexpected approved mask filename: '+file);
 return {id,annotation};
}));
const photoHashes=new Map();
for(const {id} of submissions){
 let bytes;
 for(const name of [id+'.original.jpg',id+'.jpg']){
  try{bytes=await readFile(join(photoFolder,name));break;}catch(error){if(error.code!=='ENOENT')throw error;}
 }
 if(!bytes)throw Error('Original verified source photo is required for '+id);
 photoHashes.set(id,createHash('sha256').update(bytes).digest('hex'));
}
const plan=planReviewedMaskImports(manifest,sources,submissions,photoHashes);
const candidate='benchmark/segmentation-review-manifest.candidate.json';
const outputRoot=resolve('benchmark/approved-reference-masks');
const planned=[...plan.files.map(x=>resolve(x.path)),resolve(candidate)];
for(const name of planned){
 if(relative(resolve('benchmark'),name).startsWith('..')||name.includes('\0'))throw Error('Unsafe output path');
 try{await access(name);throw Error('Output exists. Review it before changing or overwriting: '+name);}
 catch(error){if(error.code!=='ENOENT')throw error;}
}
await mkdir(outputRoot,{recursive:true});
for(const file of plan.files)await writeFile(file.path,JSON.stringify(file.annotation,null,2)+'\n',{flag:'wx'});
await writeFile(candidate,JSON.stringify(plan.candidate,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({
 status:'candidate-only-not-promoted',
 imported:plan.added,stillPending:plan.pending,
 candidateManifest:candidate,approvedFiles:plan.files.map(x=>x.path),
 instructions:'Human reviewer must inspect files and intentionally promote candidate manifest; active manifest was not modified.'
},null,2));
