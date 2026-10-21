// Offline, deterministic byte inventory of a fully transformed static staging
// candidate. This detects accidental or unsanctioned post-build byte changes.
// It is NOT an authenticated signature and NEVER authorizes a deployment.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {lstat,readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

export const SEAL_FILE='staging-asset-seal.json';
const FORMAT='closet-current-staging-asset-sha256';
const MAX_ENTRIES=10000, MAX_MANIFEST=2000000;
const keys=value=>Object.keys(value).sort().join(',');
const SAFE_ENTRY_KEYS='bytes,path,sha256';
const SAFE_TOP_KEYS='files,format,permittedToDeploy,productionPromotion,version';

function safePath(relative){
 return typeof relative==='string'&&relative.length>0&&!relative.includes('\\')&&
  !relative.includes('\0')&&!relative.startsWith('/')&&
  relative.split('/').every(p=>p!==''&&p!=='.'&&p!=='..')&&
  relative!==SEAL_FILE;
}
async function digest(path){
 const hash=createHash('sha256');
 let bytes=0;
 for await(const chunk of createReadStream(path)){
  bytes+=chunk.length;hash.update(chunk);
 }
 return {bytes,sha256:hash.digest('hex')};
}
async function snapshot(dir){
 const root=await lstat(dir);
 assert.ok(root.isDirectory()&&!root.isSymbolicLink(),'STAGING_SEAL_REFUSED: unexpected linked/missing staging root');
 const entries=[];
 async function walk(folder,prefix=''){
  for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
   const relative=prefix+entry.name;
   if(entry.isSymbolicLink()||(!entry.isDirectory()&&!entry.isFile()))
    throw Error('STAGING_SEAL_REFUSED: linked or special staging entry '+relative);
   if(entry.isDirectory()){await walk(join(folder,entry.name),relative+'/');continue;}
   if(relative===SEAL_FILE)continue;
   if(!safePath(relative))throw Error('STAGING_SEAL_REFUSED: invalid staging path');
   if(++entries.length>MAX_ENTRIES)throw Error('STAGING_SEAL_REFUSED: too many files');
   const summary=await digest(join(folder,entry.name));
   entries[entries.length-1]={path:relative,...summary};
  }
 }
 await walk(dir);
 if(entries.length===0)throw Error('STAGING_SEAL_REFUSED: empty bundle');
 return entries;
}
export async function createStagingAssetSeal(dir){
 const sealPath=join(dir,SEAL_FILE);
 try{await lstat(sealPath);throw Error('STAGING_SEAL_REFUSED: seal already exists');}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const files=await snapshot(dir);
 const manifest={format:FORMAT,version:1,files,permittedToDeploy:false,productionPromotion:'BLOCKED'};
 await writeFile(sealPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 return {fileCount:files.length,bytes:files.reduce((sum,file)=>sum+file.bytes,0)};
}
export async function verifyStagingAssetSeal(dir){
 const sealPath=join(dir,SEAL_FILE);
 const metadata=await lstat(sealPath);
 if(!metadata.isFile()||metadata.isSymbolicLink()||metadata.size>MAX_MANIFEST)
  throw Error('STAGING_SEAL_REFUSED: manifest missing, linked or too large');
 let manifest;
 try{manifest=JSON.parse(await readFile(sealPath,'utf8'));}
 catch{throw Error('STAGING_SEAL_REFUSED: malformed asset manifest');}
 if(!manifest||Array.isArray(manifest)||typeof manifest!=='object'||
  keys(manifest)!==SAFE_TOP_KEYS||
  manifest.format!==FORMAT||manifest.version!==1||
  manifest.productionPromotion!=='BLOCKED'||manifest.permittedToDeploy!==false||
  !Array.isArray(manifest.files)||manifest.files.length===0||manifest.files.length>MAX_ENTRIES)
  throw Error('STAGING_SEAL_REFUSED: invalid or altered manifest');
 let prior='';
 for(const file of manifest.files){
  if(!file||typeof file!=='object'||Array.isArray(file)||
   keys(file)!==SAFE_ENTRY_KEYS||!safePath(file.path)||file.path<=prior||
   !Number.isSafeInteger(file.bytes)||file.bytes<0||
   !/^[a-f0-9]{64}$/.test(file.sha256))
   throw Error('STAGING_SEAL_REFUSED: invalid or duplicate asset entry');
  prior=file.path;
 }
 const actual=await snapshot(dir);
 if(actual.length!==manifest.files.length)
  throw Error('STAGING_SEAL_REFUSED: added or deleted asset');
 let bytes=0;
 for(let i=0;i<actual.length;i++){
  const a=actual[i],b=manifest.files[i];
  if(a.path!==b.path||a.bytes!==b.bytes||a.sha256!==b.sha256)
   throw Error('STAGING_SEAL_REFUSED: changed asset '+a.path);
  bytes+=a.bytes;
 }
 return {format:FORMAT,assetCount:actual.length,totalBytes:bytes,
  allAssetBytesVerified:true,manifestSelfContained:true,
  signed:false,hostedStagingVerified:false,permittedToDeploy:false,productionPromotion:'BLOCKED'};
}
