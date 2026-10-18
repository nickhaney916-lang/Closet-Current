import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {jpegGeometry,inspectFigure,stageFigures,ORIGINALS} from '../scripts/stage-ai-model-figures.mjs';

function jpeg(width,height){
 // Only a JPEG structure fixture for header detection; not a real portrait.
 return Uint8Array.from([255,216,255,224,0,2,255,192,0,11,8,
  height>>8,height&255,width>>8,width&255,3,1,0x11,0,2,0x11,0,255,217]);
}
test('studio figure dimensions can be read without altering the original pixels',()=>{
 const bytes=jpeg(647,1199);
 const copy=bytes.slice();
 assert.deepEqual(jpegGeometry(bytes),{width:647,height:1199});
 assert.deepEqual(bytes,copy);
 assert.throws(()=>jpegGeometry(new Uint8Array([1,2,3])),/Not a JPEG/);
 assert.throws(()=>jpegGeometry(new Uint8Array([255,216,255,224,0,0,255,217])),/Malformed JPEG/);
});
test('only exact female and male verified images can be adopted, never lookalikes',()=>{
 assert.deepEqual(Object.keys(ORIGINALS),['female','male']);
 assert.match(ORIGINALS.female.sha256,/^[0-9a-f]{64}$/);
 assert.match(ORIGINALS.male.sha256,/^[0-9a-f]{64}$/);
 assert.notEqual(ORIGINALS.female.sha256,ORIGINALS.male.sha256);
 assert.throws(()=>inspectFigure(jpeg(647,1199),'female'),/identity changed/);
 assert.throws(()=>inspectFigure(jpeg(647,1199),'unknown'),/Unknown/);
});
test('the staging command cannot leave misleading partial figures when a source is missing or unverified',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-standard-model-'));
 const output=join(dir,'output'),input=join(dir,'input');
 try{
  await mkdir(input);
  await writeFile(join(input,ORIGINALS.female.filename),jpeg(647,1199));
  await assert.rejects(()=>stageFigures(input,output),/ENOENT/);
  await assert.rejects(()=>stat(output),/ENOENT/);
  await writeFile(join(input,ORIGINALS.male.filename),jpeg(647,1199));
  await assert.rejects(()=>stageFigures(input,output),/identity changed/);
  await assert.rejects(()=>stat(output),/ENOENT/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
