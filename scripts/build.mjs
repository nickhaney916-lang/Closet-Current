import {cp,rm,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
async function files(directory,prefix=''){
 const result=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const name=prefix+entry.name;
  if(entry.isDirectory())result.push(...await files(directory+'/'+entry.name,name+'/'));
  else if(entry.name!=='sw.js'&&!entry.name.startsWith('_'))result.push(name);
 }
 return result.sort();
}
const assets=await files('public'),hash=createHash('sha256');
for(const asset of assets)hash.update(asset).update(await readFile('public/'+asset));
const template=await readFile('public/sw.js','utf8');
hash.update(template);
const version=hash.digest('hex').slice(0,12);
await writeFile('dist/sw.js',template.replace('__VERSION__',version).replace('__ASSETS__',JSON.stringify(assets)));
console.log('Built closet inventory without paid AI services.');
