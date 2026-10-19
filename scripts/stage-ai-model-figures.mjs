// Validates and prepares the TWO standardized full-size AI studio figure photos.
// Never contacts a provider, consumes credits, or creates a third user-facing body.
// Run with an explicit --stage to copy approved files into public/ai-models/.
import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
export const ORIGINALS={
 female:{filename:'closet_current_female_model.jpg',sha256:'8c37fd71794920ed08b19c88ebeed4a1b4cdbf2b4ec5d5af9feba60ef9ab2faf'},
 male:{filename:'closet_current_male_model.jpg',sha256:'7fc1a566b0fa92cf8571fb2ffc129aa4e4f22a05e0287a3b75a0fc2a80c67af7'}
};
export function jpegGeometry(bytes){
 if(!bytes||bytes[0]!==255||bytes[1]!==216)throw Error('Not a JPEG');
 let at=2;
 while(at+9<bytes.length){
  if(bytes[at]!==255){at++;continue;}
  let marker=bytes[at+1];at+=2;
  if(marker===0xD9||marker===0xDA)break;
  if(marker===0xD8||marker===0x01||(marker>=0xD0&&marker<=0xD7))continue;
  if(at+2>bytes.length)break;
  const len=(bytes[at]<<8)|bytes[at+1];
  if(len<2||at+len>bytes.length)throw Error('Malformed JPEG');
  if([0xC0,0xC1,0xC2,0xC3].includes(marker)){
   if(len<7)throw Error('Malformed JPEG geometry');
   return {width:(bytes[at+5]<<8)|bytes[at+6],height:(bytes[at+3]<<8)|bytes[at+4]};
  }
  at+=len;
 }
 throw Error('Missing JPEG geometry');
}
export function inspectFigure(bytes,kind){
 const identity=ORIGINALS[kind];if(!identity)throw Error('Unknown standardized figure');
 const digest=createHash('sha256').update(bytes).digest('hex');
 if(digest!==identity.sha256)throw Error('Figure identity changed: '+kind);
 const geometry=jpegGeometry(bytes);
 if(geometry.width<600||geometry.height<1000||geometry.height/geometry.width<1.55||
   geometry.height/geometry.width>2.1)throw Error('Invalid standardized model geometry');
 return {id:kind,filename:kind+'.jpg',sourceSha256:digest,width:geometry.width,height:geometry.height};
}
export async function stageFigures(directory,output='public/ai-models'){
 const female=await readFile(join(directory,ORIGINALS.female.filename));
 const male=await readFile(join(directory,ORIGINALS.male.filename));
 // All input checks must succeed before any output file changes.
 const manifest=[inspectFigure(female,'female'),inspectFigure(male,'male')];
 await mkdir(output,{recursive:true});
 for(const model of manifest)await writeFile(join(output,model.filename),
  model.id==='female'?female:male,{flag:'wx'});
 await writeFile(join(output,'figures.json'),JSON.stringify({
  schemaVersion:1,status:'standard-figures-only-no-generated-outfit',
  modelImages:manifest
 },null,2)+'\n',{flag:'wx'});
 return manifest;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const [directory,option]=process.argv.slice(2);
 if(!directory)throw Error('Usage: node scripts/stage-ai-model-figures.mjs <unpacked-model-folder> [--stage]');
 const files=await Promise.all(Object.entries(ORIGINALS).map(async([sex,v])=>
  inspectFigure(await readFile(join(directory,v.filename)),sex)));
 if(option==='--stage'){await stageFigures(directory);console.log('STAGED_AI_MODEL_FIGURES '+JSON.stringify(files));}
 else console.log('VERIFIED_AI_MODEL_FIGURES '+JSON.stringify(files));
}
