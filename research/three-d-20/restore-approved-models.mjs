/** Reproduce the exact original CC0 fixtures. Never repin a changed publisher download. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {SOURCES,MODEL_OUTPUT,validateGLB} from '../three-d-06/fetch-licensed-avatars.mjs';
export async function restoreApprovedModels(){
 await mkdir(MODEL_OUTPUT,{recursive:true});const sources=[];
 for(const [kind,src] of Object.entries(SOURCES)){
  const bytes=gunzipSync(await readFile(new URL('./fixtures/'+src.filename+'.gz',import.meta.url)),{maxOutputLength:12000000});
  const sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!==src.sha256)throw Error('Original approved fixture SHA mismatch: '+kind);
  const shape=validateGLB(bytes);
  await writeFile(resolve(MODEL_OUTPUT,src.filename),bytes);
  sources.push({kind,file:src.filename,sha256,bytes:bytes.length,license:src.license,
   source:src.source,locked:true,fixture:'unchanged original approved CC0 GLB, lossless gzip',...shape});
 }
 await writeFile(resolve(MODEL_OUTPUT,'verified-assets.json'),JSON.stringify({researchOnly:true,releaseAuthorized:false,sources},null,2));
 return sources;
}
if(process.argv[1]?.endsWith('restore-approved-models.mjs'))
 restoreApprovedModels().then(rows=>console.log('ORIGINAL_APPROVED_CC0_FIXTURES',JSON.stringify(rows))).catch(e=>{console.error(e);process.exitCode=1;});
