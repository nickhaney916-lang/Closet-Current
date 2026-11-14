import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,writeFile,rm,symlink,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,dirname} from 'node:path';
import {installMeasurementModules86,C52_MODULES86} from '../scripts/mission2-p86-module-install.mjs';
test('disposable donor receives full actual transitive closure including C62 and byte-identical P86 metric',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'p86-install-'));
 try{const paths=await installMeasurementModules86('.',dir);assert.equal(paths.length,6);
 for(const path of paths)assert.deepEqual(await readFile(join(dir,path)),await readFile(path));
 await assert.rejects(installMeasurementModules86('.','.'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('unlisted import fails before writing modules',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'p86-closure-')),source=join(dir,'source'),dest=join(dir,'donor');
 try{await mkdir(dest);for(const p of C52_MODULES86){await mkdir(dirname(join(source,p)),{recursive:true});await writeFile(join(source,p),await readFile(p));}
 await writeFile(join(source,C52_MODULES86[0]),"import './missing.mjs';");
 await assert.rejects(installMeasurementModules86(source,dest),/dependency missing/);
 await assert.rejects(access(join(dest,C52_MODULES86[0])));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('existing donor module symlink cannot overwrite source',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'p86-symlink-'));
 try{const path=join(dir,C52_MODULES86[0]);await mkdir(dirname(path),{recursive:true});
 await symlink(join(process.cwd(),C52_MODULES86[0]),path);
 await assert.rejects(installMeasurementModules86('.',dir),/symlink refused/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
