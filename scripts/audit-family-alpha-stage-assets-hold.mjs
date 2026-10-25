/**
 * Family Alpha #255 — offline, no-deploy STAGING static resource closure.
 * Check the actual stage-gated FULL app bundle before a future owner-approved
 * Cloudflare upload. This deliberately does not fetch hosts or enable sign-in.
 *
 * Scope: literal script/link resources from both HTML entrypoints, local CSS
 * url()/@import, manifest icons and static/dynamic literal relative JS modules.
 * Nonliteral runtime assets and actual network status need separate QA.
 */
import {readFile,readdir,lstat} from 'node:fs/promises';
import {join,posix,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertProtectedPreviewHold,STAGE_PREVIEW_OUTPUT} from './build-family-alpha-protected-preview-hold.mjs';

export const ENTRYPOINTS=Object.freeze(['index.html','phone-photo-check.html']);
export const CORE=Object.freeze([
 'index.html','phone-photo-check.html','app.js','auth.js','cloud-backup.js',
 'alpha-stage-config.js','alpha-stage-preview-rollout.js',
 'family-alpha-preview-boot.js','family-alpha-preview-controller.mjs',
 'family-alpha-2d-saved-board.mjs','family-alpha-2d-auth-preflight.mjs',
 'recognition-engine.mjs','local-worker.mjs','wardrobe-backup-engine.js',
 'manifest.webmanifest','style.css'
]);
const EXTERNAL=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
function assertSafeName(x){
 if(typeof x!=='string'||!x||x.startsWith('/')||x.includes('\\')||
  x.split('/').some(s=>!s||s==='.'||s==='..')||
  !/^[-\w./]+$/.test(x))
  throw Error('Unsafe candidate asset name: '+x);
 return x;
}
/** Resolve a local browser URL relative to a packaged file. Never leave root. */
export function resolveAsset(from,value){
 assertSafeName(from);
 if(typeof value!=='string'||!value)throw Error('Empty runtime asset URL');
 const reference=value.trim();
 if(!reference||reference.includes('\\')||reference.includes('#')||
    reference.includes('%')||EXTERNAL.test(reference)||reference.includes('?')&&
    !/^[^?]+\?v=[a-f0-9]{12}$/.test(reference))
  throw Error('Unsafe or external runtime asset reference: '+reference);
 const asset=reference.split('?')[0];
 if(!asset||asset.endsWith('/'))throw Error('Directory reference instead of file: '+reference);
 // leading '/' means same staging origin root; never a different origin.
 const resolved=posix.normalize(asset.startsWith('/')
   ? asset.slice(1) : posix.join(posix.dirname(from),asset));
 if(!resolved||resolved==='.'||resolved==='..'||resolved.startsWith('../')||
    resolved.startsWith('/')||!/^[-\w./]+$/.test(resolved))
  throw Error('Runtime asset escapes protected staging root: '+reference);
 return assertSafeName(resolved);
}
const attr=(tag,key)=>{
 const x=new RegExp('\\b'+key+'\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]','i').exec(tag);
 return x?.[1]??null;
};
/** Literal HTML scripts plus deploy-relevant resource links only. */
export function htmlAssets(html){
 const refs=[];
 for(const match of html.matchAll(/<(script|link)\b[^>]*>/gi)){
  const tag=match[0],kind=match[1].toLowerCase();
  const value=kind==='script'?attr(tag,'src'):attr(tag,'href');
  if(!value)continue;
  if(kind==='link'){
   const rel=(attr(tag,'rel')||'').toLowerCase().split(/\s+/);
   if(!rel.some(x=>['stylesheet','manifest','icon','apple-touch-icon',
      'modulepreload','preload'].includes(x)))continue;
  }
  refs.push(value);
 }
 return refs;
}
/** References from authored CSS. Embedded data URLs are not separate files. */
export function cssAssets(css){
 const refs=[];
 for(const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)){
  const asset=match[2].trim();
  if(asset&&!/^data:/i.test(asset)&&asset[0]!=='#')refs.push(asset);
 }
 for(const match of css.matchAll(/@import\s+(?!url\()(["'])(.*?)\1/g)){
  refs.push(match[2]);
 }
 return refs;
}
export function moduleAssets(js){
 const refs=[];
 for(const match of js.matchAll(/(?:^|[\n;])\s*(?:import\s+(?:[^'";\n]*?\sfrom\s*)?|export\s+[^'";\n]*?\sfrom\s*)["']([^"']+)["']/gm)){
  refs.push(match[1]);
 }
 for(const match of js.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)){
  refs.push(match[1]);
 }
 return refs;
}
async function inventory(root,prefix=''){
 const result=[];
 for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlink in packaged Family Alpha assets');
  const p=prefix?prefix+'/'+entry.name:entry.name;
  assertSafeName(p);
  if(entry.isDirectory())result.push(...await inventory(root,p));
  else if(entry.isFile())result.push(p);
  else throw Error('Unexpected staged asset node: '+p);
 }
 return result;
}
function scriptAsset(path){return /\.(?:js|mjs)$/.test(path);}
async function collectReferenced(root,existing,entrypoints){
 const visited=new Set(),required=new Set(),queue=[...entrypoints];
 while(queue.length){
  if(visited.size>500)throw Error('Unexpectedly large staged resource graph');
  const file=queue.shift();
  if(visited.has(file))continue;
  if(!existing.has(file))throw Error('Missing packaged runtime asset: '+file);
  visited.add(file);
  const extension=posix.extname(file);
  if(!['.html','.css','.mjs','.js','.webmanifest','.json'].includes(extension))continue;
  const source=await readFile(join(root,file),'utf8');
  let refs=[];
  if(extension==='.html')refs=htmlAssets(source);
  else if(extension==='.css')refs=cssAssets(source);
  else if(extension==='.js'||extension==='.mjs')refs=moduleAssets(source);
  else if(extension==='.webmanifest'){
   const manifest=JSON.parse(source);
   if(manifest.start_url&&!['./','/'].includes(manifest.start_url))
    throw Error('Unexpected stage manifest start_url');
   if(manifest.scope&&!['./','/'].includes(manifest.scope))
    throw Error('Unexpected stage manifest scope');
   refs=(manifest.icons||[]).map(v=>v.src);
  }
  for(const ref of refs){
   // Browsers do not resolve external bare module imports without an import
   // map. Explicitly refuse them rather than silently ignoring a broken boot.
   const local=resolveAsset(file,ref);
   if(!existing.has(local))
    throw Error('Missing referenced staged resource '+local+' from '+file);
   required.add(local);
   if(['.html','.css','.mjs','.js','.webmanifest'].includes(posix.extname(local)))
    queue.push(local);
  }
 }
 return {visited:[...visited].sort(),referenced:[...required].sort()};
}
export async function checkStaticGraph({root,entrypoints=ENTRYPOINTS,core=CORE,minAssets=60}){
 if(typeof root!=='string'||!root)throw Error('Stage candidate root required');
 const files=await inventory(root);
 if(files.length<minAssets)throw Error('Full Family Alpha bundle absent: '+files.length+' files');
 const existing=new Set(files);
 for(const p of [...entrypoints,...core]){
  assertSafeName(p);
  if(!existing.has(p))throw Error('Missing required full-app asset: '+p);
 }
 const graph=await collectReferenced(root,existing,entrypoints);
 return Object.freeze({
  releaseGate:'HOLD',deployAllowed:false,
  candidateAssetCount:files.length,referencedAssetCount:graph.referenced.length,
  entrypoints:[...entrypoints],traversed:graph.visited.length,
  scope:'Static HTML, CSS, manifest and literal module references only',
  missingReferencedAssets:0
 });
}
export async function auditStageStaticAssets({root=resolve('.')}={}){
 const hold=await assertProtectedPreviewHold({root});
 if(hold.releaseGate!=='HOLD'||hold.deployAllowed!==false||
  hold.stagingAuthReady!==false||hold.photoAvatarEnabled!==false||
  hold.stagingAuthKeyPresent!==false||hold.ownerApproved!==false)
  throw Error('Family Alpha staged preview activation is not held');
 const folder=join(resolve(root),STAGE_PREVIEW_OUTPUT);
 const node=await lstat(folder);
 if(!node.isDirectory()||node.isSymbolicLink())
  throw Error('Invalid static asset audit destination');
 const graph=await checkStaticGraph({root:folder});
 return Object.freeze({
  ...graph,
  stageProjectRef:hold.stagingProjectRef,
  stagingOrigin:hold.approvedRoot,
  protectedAccessSmokeOnly:true,
  realRlsCrossUserProven:false,
  liveAssetCoverageProven:false,
  uploadAuthorized:false,
  fullAppDeployed:false
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No URLs, keys, Auth settings or deployment arguments permitted');
 const report=await auditStageStaticAssets();
 console.log('FAMILY_ALPHA_STATIC_ASSETS_HOLD '+JSON.stringify(report));
}
