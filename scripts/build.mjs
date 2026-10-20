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
// Give each release fresh script/style URLs even when the host or browser
// still considers the previous URLs cacheable.
const versionedAssets=new Set();
for(const asset of assets)if(/\.(?:js|mjs|css)$/.test(asset)||/^recognition-vectors\.(?:json|bin)$/.test(asset))versionedAssets.add(asset+'?v='+version);
const index=await readFile('public/index.html','utf8');
const builtIndex=index.replace(/(src|href)="([^"]+\.(?:js|css))"/g,(match,attribute,asset)=>{
 if(!assets.includes(asset))return match;
 const url=asset+'?v='+version;
 versionedAssets.add(url);
 return attribute+'="'+url+'"';
});
await writeFile('dist/index.html',builtIndex);
const photoCheck=await readFile('public/phone-photo-check.html','utf8');
const recognitionIndex=JSON.parse(await readFile('public/recognition-vectors.json','utf8')).sha256;
await writeFile('dist/phone-photo-check.html',photoCheck.replace('__RELEASE__',version).replace('__RECOGNITION_INDEX__',recognitionIndex).replace(/(src|href)="([^"]+\.(?:js|mjs|css))"/g,(match,attribute,asset)=>assets.includes(asset)?attribute+'="'+asset+'?v='+version+'"':match));
// Pin the private, self-reported saved-closet worksheet to this exact build.
const closetAudit=await readFile('public/saved-closet-audit.html','utf8');
await writeFile('dist/saved-closet-audit.html',closetAudit.replace('__RELEASE__',version).replace(/(src|href)="([^"]+\.(?:js|mjs|css))"/g,(match,attribute,asset)=>assets.includes(asset)?attribute+'="'+asset+'?v='+version+'"':match));
await writeFile('dist/sw.js',template.replace('__VERSION__',version).replace('__ASSETS__',JSON.stringify([...assets,...versionedAssets])));
console.log('Built closet inventory without paid AI services.');
