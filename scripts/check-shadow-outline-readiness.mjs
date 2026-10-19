import {readFile,access} from 'node:fs/promises';
import {validateShadowAnnotation} from '../benchmark/shadow-annotation-validator.mjs';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const decisions=[];
for(const entry of manifest.cases){
 let status='missing-approved-reference',reason='Independent garment and shadow polygons have not been supplied';
 const file=entry.shadowAnnotation;
 if(typeof file==='string'&&file.startsWith('benchmark/annotations/')&&!file.includes('..')){
  try{
   await access(file);
   const annotation=JSON.parse(await readFile(file,'utf8'));
   const validation=validateShadowAnnotation(annotation,entry);
   status=validation.valid?'approved-reference-present':'invalid-reference';
   reason=validation.issues.join('; ')||'Approved outlines exist; ready for separate pixelwise mask comparison';
  }catch(err){status='missing-annotation-file';reason=err.code||err.message;}
 }
 decisions.push({id:entry.id,status,reason});
}
const ready=decisions.every(x=>x.status==='approved-reference-present')&&decisions.length>=6;
console.log('SHADOW_OUTLINE_GATE '+JSON.stringify({ready,referenceCount:decisions.filter(x=>x.status==='approved-reference-present').length,total:decisions.length,decisions}));
if(process.argv.includes('--require-approved')&&!ready)process.exitCode=1;
