import {cp,rm,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(directory,prefix=''){
 const result=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const name=prefix+entry.name;
  if(entry.isDirectory())result.push(...await files(directory+'/'+entry.name,name+'/'));
  else if(entry.isSymbolicLink())throw new Error(`Unexpected symbolic link in public assets: ${name}`);
  else if(entry.name!=='sw.js'&&!entry.name.startsWith('_'))result.push(name);
 }
 return result.sort();
}
const assets=await files('public');
const hash=createHash('sha256').update('html-script-integrity-v1\0');
const scriptIntegrity=new Map();
for(const asset of assets){
 const bytes=await readFile('public/'+asset);
 hash.update(asset).update(bytes);
 if(/\.(?:js|mjs)$/.test(asset)){
  scriptIntegrity.set(asset,'sha384-'+createHash('sha384').update(bytes).digest('base64'));
 }
}
const template=await readFile('public/sw.js','utf8');
hash.update(template);
const version=hash.digest('hex').slice(0,12);
// Give each release fresh script/style URLs even when the host or browser
// still considers the previous URLs cacheable.
const versionedAssets=new Set();
for(const asset of assets)if(/\.(?:js|mjs|css)$/.test(asset)||/^recognition-vectors\.(?:json|bin)$/.test(asset))versionedAssets.add(asset+'?v='+version);
const recognitionIndex=JSON.parse(await readFile('public/recognition-vectors.json','utf8')).sha256;
const pages=new Map();
for(const page of assets.filter(asset=>asset.endsWith('.html'))){
 let html=await readFile('public/'+page,'utf8');
 const directory=page.slice(0,page.lastIndexOf('/')+1);
 // Only supported script tags can be emitted with resolvable integrity metadata.
 html=html.replace(/<script(?=[\s/>])[^>]*>/gi,tag=>{
  const script=/^<script( type="module")? src="([\w.-]+\.(?:js|mjs))">$/i.exec(tag);
  const integrity=script&&scriptIntegrity.get(directory+script[2]);
  if(!integrity)throw new Error(`Unapproved script entry in ${page}: ${tag}`);
  return `<script${script[1]??''} src="${script[2]}?v=${version}" integrity="${integrity}">`;
 });
 if(page==='index.html'){
  html=html.replace(/href="([^"]+\.css)"/g,(match,asset)=>
   assets.includes(asset)?`href="${asset}?v=${version}"`:match);
 }
 if(page==='phone-photo-check.html'){
  html=html.replace('__RELEASE__',version).replace('__RECOGNITION_INDEX__',recognitionIndex);
 }
 pages.set(page,html);
}
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
for(const [page,html] of pages)await writeFile('dist/'+page,html);
await writeFile('dist/sw.js',template.replace('__VERSION__',version).replace('__ASSETS__',JSON.stringify([...assets,...versionedAssets])));
console.log('Built closet inventory without paid AI services.');
